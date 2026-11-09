import { NextRequest, NextResponse } from "next/server";
import {
  createAthletePhotoSession,
  loginAttemptKey,
  secureCredentialMatch,
  setAthletePhotoSessionCookie,
} from "@/lib/athlete-photo-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_FAILURES = 5;
const BLOCK_MINUTES = 15;

function normalizedEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function digits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function genericError(status = 401) {
  return NextResponse.json(
    { error: "E-mail ou senha não conferem com a inscrição." },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizedEmail(body.email);
    const password = digits(body.password);
    if (!email || password.length !== 5) return genericError();

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
    const keyHash = loginAttemptKey(email, ip);
    const supabase = createSupabaseAdmin();

    const { data: attempt, error: attemptError } = await supabase
      .from("athlete_media_login_attempts")
      .select("failure_count, blocked_until")
      .eq("key_hash", keyHash)
      .maybeSingle();
    if (attemptError?.code === "42P01")
      return NextResponse.json(
        { error: "A área de fotos está sendo ativada. Tente novamente em breve." },
        { status: 503 },
      );
    if (attemptError) throw attemptError;
    if (attempt?.blocked_until && new Date(attempt.blocked_until).getTime() > Date.now())
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." },
        { status: 429 },
      );

    const { data: registrations, error } = await supabase
      .from("registrations")
      .select(
        "id, event_id, full_name, email, status, payment_status, document_number, cpf_cnpj, created_at",
      )
      .ilike("email", email)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });
    if (error?.code === "42703")
      return NextResponse.json(
        { error: "A área de fotos está sendo ativada. Tente novamente em breve." },
        { status: 503 },
      );
    if (error) throw error;

    const registration = (registrations ?? []).find((item) => {
      const document = digits(item.document_number || item.cpf_cnpj);
      const eligible =
        item.status === "confirmed" &&
        (!item.payment_status || ["paid", "courtesy"].includes(item.payment_status));
      return eligible && document.length >= 5 && secureCredentialMatch(password, document.slice(0, 5));
    });

    if (!registration) {
      const failures = Number(attempt?.failure_count ?? 0) + 1;
      const blockedUntil =
        failures >= MAX_FAILURES
          ? new Date(Date.now() + BLOCK_MINUTES * 60_000).toISOString()
          : null;
      await supabase.from("athlete_media_login_attempts").upsert({
        key_hash: keyHash,
        failure_count: failures >= MAX_FAILURES ? 0 : failures,
        blocked_until: blockedUntil,
        updated_at: new Date().toISOString(),
      });
      return genericError();
    }

    await supabase.from("athlete_media_login_attempts").delete().eq("key_hash", keyHash);
    const session = createAthletePhotoSession({
      registrationId: registration.id,
      eventId: registration.event_id,
      email: registration.email,
      fullName: registration.full_name,
    });
    const response = NextResponse.json({ ok: true, redirect: "/passport/fotos" });
    setAthletePhotoSessionCookie(response, session.token, session.maxAge);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível entrar." },
      { status: 500 },
    );
  }
}
