import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("events").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { configured: true, connected: false, error: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json({ configured: true, connected: true });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        error: error instanceof Error ? error.message : "Supabase connection failed.",
      },
      { status: 503 },
    );
  }
}
