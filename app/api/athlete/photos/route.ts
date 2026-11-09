import { NextRequest, NextResponse } from "next/server";
import { athletePhotoSessionFromRequest } from "@/lib/athlete-photo-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "athlete-card-photos";

function unauthorized() {
  return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
}

async function signedUrl(supabase: ReturnType<typeof createSupabaseAdmin>, path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function GET(request: NextRequest) {
  const session = athletePhotoSessionFromRequest(request);
  if (!session) return unauthorized();
  try {
    const supabase = createSupabaseAdmin();
    const [{ data: registration, error: registrationError }, { data: submission, error }] =
      await Promise.all([
        supabase
          .from("registrations")
          .select("id, full_name, email, bib_number, category, journey_format, event_id, events(name)")
          .eq("id", session.registrationId)
          .single(),
        supabase
          .from("athlete_card_photos")
          .select("id, face_photo_path, cycling_photo_path, face_photo_name, cycling_photo_name, status, admin_notes, submitted_at, updated_at")
          .eq("registration_id", session.registrationId)
          .maybeSingle(),
      ]);
    if (registrationError) throw registrationError;
    if (error?.code === "42P01")
      return NextResponse.json({ error: "A área de fotos está sendo ativada." }, { status: 503 });
    if (error) throw error;
    const event = Array.isArray(registration.events) ? registration.events[0] : registration.events;
    return NextResponse.json({
      athlete: {
        full_name: registration.full_name,
        email: registration.email,
        bib_number: registration.bib_number,
        category: registration.category,
        journey_format: registration.journey_format,
        event_name: event?.name ?? "Legends Bike Race",
      },
      submission: submission
        ? {
            ...submission,
            face_photo_url: await signedUrl(supabase, submission.face_photo_path),
            cycling_photo_url: await signedUrl(supabase, submission.cycling_photo_path),
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível carregar suas fotos." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = athletePhotoSessionFromRequest(request);
  if (!session) return unauthorized();
  try {
    const body = await request.json();
    const facePath = String(body.face_path ?? "");
    const cyclingPath = String(body.cycling_path ?? "");
    const expectedPrefix = `${session.eventId}/${session.registrationId}/`;
    if (!facePath.startsWith(expectedPrefix) || !cyclingPath.startsWith(expectedPrefix))
      return NextResponse.json({ error: "Arquivos de envio inválidos." }, { status: 400 });
    if (body.consent !== "accepted")
      return NextResponse.json(
        { error: "Confirme a autorização de uso das imagens para produzir o card." },
        { status: 400 },
      );

    const supabase = createSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("athlete_card_photos")
      .select("face_photo_path, cycling_photo_path")
      .eq("registration_id", session.registrationId)
      .maybeSingle();
    if (currentError?.code === "42P01")
      return NextResponse.json({ error: "A área de fotos está sendo ativada." }, { status: 503 });
    if (currentError) throw currentError;

    const now = new Date().toISOString();
    const { data: saved, error: saveError } = await supabase
      .from("athlete_card_photos")
      .upsert(
        {
          event_id: session.eventId,
          registration_id: session.registrationId,
          face_photo_path: facePath,
          cycling_photo_path: cyclingPath,
          face_photo_name: String(body.face_name ?? "foto-rosto").slice(0, 180),
          cycling_photo_name: String(body.cycling_name ?? "foto-pedalando").slice(0, 180),
          consent_accepted_at: now,
          status: "pending",
          admin_notes: null,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: "registration_id" },
      )
      .select("id, status, submitted_at, updated_at")
      .single();
    if (saveError) {
      await supabase.storage.from(BUCKET).remove([facePath, cyclingPath]);
      throw saveError;
    }

    const oldPaths = [current?.face_photo_path, current?.cycling_photo_path].filter(Boolean) as string[];
    if (oldPaths.length) await supabase.storage.from(BUCKET).remove(oldPaths);
    return NextResponse.json({ ok: true, submission: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar as fotos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
