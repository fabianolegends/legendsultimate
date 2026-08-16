import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("events")
      .select("participant_limit, public_remaining_spots, public_remaining_spots_ultimate, public_remaining_spots_short")
      .eq("starts_on", "2027-04-29")
      .eq("is_test", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error?.code === "42703") {
      return NextResponse.json({ total: 150, remaining: 150, ultimate: { total: 100, remaining: 100 }, short: { total: 50, remaining: 50 }, configured: false });
    }
    if (error) throw error;

    const ultimateRemaining = Number(data?.public_remaining_spots_ultimate ?? 100);
    const shortRemaining = Number(data?.public_remaining_spots_short ?? 50);
    const total = 150;
    const remaining = ultimateRemaining + shortRemaining;

    return NextResponse.json({
      total,
      remaining: Number.isFinite(remaining) && remaining >= 0 ? remaining : 150,
      ultimate: { total: 100, remaining: Number.isFinite(ultimateRemaining) ? ultimateRemaining : 100 },
      short: { total: 50, remaining: Number.isFinite(shortRemaining) ? shortRemaining : 50 },
      configured: Boolean(data),
    });
  } catch {
    return NextResponse.json({ total: 150, remaining: 150, ultimate: { total: 100, remaining: 100 }, short: { total: 50, remaining: 50 }, configured: false });
  }
}
