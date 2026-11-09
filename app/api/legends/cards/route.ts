import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "legends-athlete-cards";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("legends_athlete_cards")
      .select("id, athlete_name, location, image_path")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error?.code === "42P01") return NextResponse.json({ cards: [] });
    if (error) throw error;

    return NextResponse.json({
      cards: (data ?? []).map((card) => ({
        id: card.id,
        athlete_name: card.athlete_name,
        location: card.location,
        image_url: supabase.storage.from(BUCKET).getPublicUrl(card.image_path).data.publicUrl,
      })),
    });
  } catch {
    return NextResponse.json({ cards: [] });
  }
}
