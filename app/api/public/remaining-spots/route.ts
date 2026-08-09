import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("events")
      .select("participant_limit, public_remaining_spots")
      .eq("starts_on", "2027-04-29")
      .eq("is_test", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error?.code === "42703") {
      return NextResponse.json({ total: 100, remaining: 100, configured: false });
    }
    if (error) throw error;

    const total = Number(data?.participant_limit ?? 100);
    const remaining = Number(data?.public_remaining_spots ?? total);

    return NextResponse.json({
      total: Number.isFinite(total) && total > 0 ? total : 100,
      remaining: Number.isFinite(remaining) && remaining >= 0 ? remaining : 100,
      configured: Boolean(data),
    });
  } catch {
    return NextResponse.json({ total: 100, remaining: 100, configured: false });
  }
}
