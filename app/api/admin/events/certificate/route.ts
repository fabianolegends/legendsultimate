import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "certificate-templates";

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function settings(supabase: ReturnType<typeof createSupabaseAdmin>, event: any) {
  const templateUrl = event?.certificate_template_path
    ? supabase.storage.from(BUCKET).getPublicUrl(event.certificate_template_path).data.publicUrl
    : null;
  return {
    enabled: event?.certificate_enabled === true,
    template_path: event?.certificate_template_path ?? null,
    template_url: templateUrl,
    text_color: event?.certificate_text_color || "#171a16",
  };
}

function migrationMissing(error: any) {
  return error?.code === "42703" || error?.code === "42P01" || String(error?.message ?? "").includes("certificate_");
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
  if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("events")
    .select("id, certificate_enabled, certificate_template_path, certificate_text_color")
    .eq("id", eventId)
    .single();
  if (migrationMissing(error)) return NextResponse.json({ error: "Execute a migration 021_event_certificates.sql no Supabase.", module_ready: false }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: settings(supabase, data), module_ready: true });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventId = String(body.event_id ?? "").trim();
    const textColor = String(body.text_color ?? "#171a16").trim();
    if (!eventId) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    if (!/^#[0-9a-f]{6}$/i.test(textColor)) return NextResponse.json({ error: "A cor do texto deve estar no formato hexadecimal." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("events")
      .update({
        certificate_enabled: body.enabled === true,
        certificate_text_color: textColor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select("id, certificate_enabled, certificate_template_path, certificate_text_color")
      .single();
    if (migrationMissing(error)) return NextResponse.json({ error: "Execute a migration 021_event_certificates.sql no Supabase.", module_ready: false }, { status: 409 });
    if (error) throw error;
    await recordAdminAudit(request, { action: "event.certificate.updated", resourceType: "event", resourceId: eventId, eventId, details: { enabled: body.enabled === true, text_color: textColor } });
    return NextResponse.json({ settings: settings(supabase, data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o certificado." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "events.manage")) return unauthorized();
  try {
    const form = await request.formData();
    const eventId = String(form.get("eventId") ?? "").trim();
    const file = form.get("file");
    if (!eventId || !(file instanceof File)) return NextResponse.json({ error: "Evento e arquivo PNG são obrigatórios." }, { status: 400 });
    if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) return NextResponse.json({ error: "A arte-base precisa ser um arquivo PNG." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "A imagem pode ter no máximo 10 MB." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("events")
      .select("id, certificate_template_path")
      .eq("id", eventId)
      .single();
    if (migrationMissing(currentError)) return NextResponse.json({ error: "Execute a migration 021_event_certificates.sql no Supabase.", module_ready: false }, { status: 409 });
    if (currentError) throw currentError;

    const path = `${eventId}/base-${Date.now()}.png`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "image/png", upsert: false });
    if (uploadError) {
      if (String(uploadError.message).toLowerCase().includes("bucket")) return NextResponse.json({ error: "Execute a migration 021_event_certificates.sql no Supabase." }, { status: 409 });
      throw uploadError;
    }

    const { data, error } = await supabase
      .from("events")
      .update({ certificate_template_path: path, certificate_enabled: true, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select("id, certificate_enabled, certificate_template_path, certificate_text_color")
      .single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw error;
    }
    if (current?.certificate_template_path) await supabase.storage.from(BUCKET).remove([current.certificate_template_path]);
    await recordAdminAudit(request, { action: "event.certificate.template_uploaded", resourceType: "event", resourceId: eventId, eventId, details: { file_name: file.name, size: file.size } });
    return NextResponse.json({ settings: settings(supabase, data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível carregar a arte do certificado." }, { status: 500 });
  }
}
