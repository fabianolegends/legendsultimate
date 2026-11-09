import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { athletePhotoSessionFromRequest } from "@/lib/athlete-photo-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "athlete-card-photos";
const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

type FileMeta = { name?: string; type?: string; size?: number };

function extension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function validate(meta: FileMeta, label: string) {
  const type = String(meta.type ?? "");
  const size = Number(meta.size ?? 0);
  if (!ACCEPTED.has(type)) throw new Error(`${label} deve estar em JPG, PNG ou WEBP.`);
  if (!size || size > MAX_BYTES) throw new Error(`${label} deve ter no máximo 12 MB.`);
  return { type, size, name: String(meta.name ?? "foto").slice(0, 180) };
}

export async function POST(request: NextRequest) {
  const session = athletePhotoSessionFromRequest(request);
  if (!session)
    return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  try {
    const body = await request.json();
    const face = validate(body.face ?? {}, "A foto de rosto");
    const cycling = validate(body.cycling ?? {}, "A foto pedalando");
    const folder = `${session.eventId}/${session.registrationId}`;
    const facePath = `${folder}/rosto-${Date.now()}-${randomUUID()}.${extension(face.type)}`;
    const cyclingPath = `${folder}/pedal-${Date.now()}-${randomUUID()}.${extension(cycling.type)}`;
    const supabase = createSupabaseAdmin();
    const [{ data: faceSigned, error: faceError }, { data: cyclingSigned, error: cyclingError }] = await Promise.all([
      supabase.storage.from(BUCKET).createSignedUploadUrl(facePath),
      supabase.storage.from(BUCKET).createSignedUploadUrl(cyclingPath),
    ]);
    if (faceError) throw faceError;
    if (cyclingError) throw cyclingError;
    return NextResponse.json({
      bucket: BUCKET,
      face: { path: facePath, token: faceSigned.token, name: face.name },
      cycling: { path: cyclingPath, token: cyclingSigned.token, name: cycling.name },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível preparar o envio." },
      { status: 400 },
    );
  }
}
