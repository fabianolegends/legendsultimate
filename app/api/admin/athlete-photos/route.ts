import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "athlete-card-photos";
const STATUSES = new Set(["pending", "approved", "card_created"]);

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

async function signedUrl(supabase: ReturnType<typeof createSupabaseAdmin>, path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
    if (!eventId) return NextResponse.json({ submissions: [], summary: { total: 0, pending: 0, approved: 0, card_created: 0 } });
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("athlete_card_photos")
      .select("id, event_id, registration_id, face_photo_path, cycling_photo_path, face_photo_name, cycling_photo_name, status, admin_notes, submitted_at, updated_at, registrations(full_name, email, bib_number, category, journey_format, country_code)")
      .eq("event_id", eventId)
      .order("updated_at", { ascending: false });
    if (error?.code === "42P01")
      return NextResponse.json({ module_ready: false, submissions: [], summary: null });
    if (error) throw error;
    const submissions = await Promise.all(
      (data ?? []).map(async (item: any) => ({
        ...item,
        registration: Array.isArray(item.registrations) ? item.registrations[0] : item.registrations,
        registrations: undefined,
        face_photo_url: await signedUrl(supabase, item.face_photo_path),
        cycling_photo_url: await signedUrl(supabase, item.cycling_photo_path),
      })),
    );
    return NextResponse.json({
      module_ready: true,
      submissions,
      summary: {
        total: submissions.length,
        pending: submissions.filter((item) => item.status === "pending").length,
        approved: submissions.filter((item) => item.status === "approved").length,
        card_created: submissions.filter((item) => item.status === "card_created").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível carregar as fotos." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "").trim();
    if (!id || !STATUSES.has(status))
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("athlete_card_photos")
      .update({
        status,
        admin_notes: String(body.admin_notes ?? "").trim().slice(0, 1000) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status, admin_notes, updated_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ submission: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível atualizar." },
      { status: 500 },
    );
  }
}
