import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "legends-athlete-cards";
const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function unauthorized() {
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

function publicUrl(supabase: ReturnType<typeof createSupabaseAdmin>, imagePath: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
}

function extension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("legends_athlete_cards")
      .select("id, athlete_name, location, image_path, display_order, published, created_at")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error?.code === "42P01") return NextResponse.json({ module_ready: false, cards: [] });
    if (error) throw error;
    return NextResponse.json({
      module_ready: true,
      cards: (data ?? []).map((card) => ({ ...card, image_url: publicUrl(supabase, card.image_path) })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível carregar os cards." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const form = await request.formData();
    const image = form.get("image");
    const athleteName = String(form.get("athlete_name") ?? "").trim();
    const location = String(form.get("location") ?? "").trim() || null;
    const published = String(form.get("published") ?? "true") === "true";

    if (!(image instanceof File) || !athleteName) {
      return NextResponse.json({ error: "Informe o nome do atleta e selecione o card." }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.has(image.type) || !image.size || image.size > MAX_BYTES) {
      return NextResponse.json({ error: "Use JPG, PNG ou WEBP de até 15 MB." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: lastCard, error: lastError } = await supabase
      .from("legends_athlete_cards")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError?.code === "42P01") {
      return NextResponse.json({ error: "Execute a migration 032 para ativar os cards." }, { status: 503 });
    }
    if (lastError) throw lastError;

    const imagePath = `cards/${Date.now()}-${randomUUID()}.${extension(image.type)}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(imagePath, image, {
      contentType: image.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("legends_athlete_cards")
      .insert({
        athlete_name: athleteName.slice(0, 120),
        location: location?.slice(0, 120) ?? null,
        image_path: imagePath,
        display_order: Number(lastCard?.display_order ?? -1) + 1,
        published,
      })
      .select("id, athlete_name, location, image_path, display_order, published, created_at")
      .single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([imagePath]);
      throw error;
    }
    return NextResponse.json({ card: { ...data, image_url: publicUrl(supabase, data.image_path) } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível enviar o card." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Card inválido." }, { status: 400 });

    const updates: Record<string, string | number | boolean | null> = {};
    if (typeof body.published === "boolean") updates.published = body.published;
    if (typeof body.athlete_name === "string") updates.athlete_name = body.athlete_name.trim().slice(0, 120);
    if (typeof body.location === "string") updates.location = body.location.trim().slice(0, 120) || null;
    if (Number.isFinite(body.display_order)) updates.display_order = Math.max(0, Math.floor(body.display_order));
    if (!Object.keys(updates).length) return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("legends_athlete_cards")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, athlete_name, location, image_path, display_order, published, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ card: { ...data, image_url: publicUrl(supabase, data.image_path) } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o card." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, "registrations.manage")) return unauthorized();
  try {
    const id = request.nextUrl.searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ error: "Card inválido." }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("legends_athlete_cards")
      .delete()
      .eq("id", id)
      .select("image_path")
      .single();
    if (error) throw error;
    await supabase.storage.from(BUCKET).remove([data.image_path]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível excluir o card." }, { status: 500 });
  }
}
