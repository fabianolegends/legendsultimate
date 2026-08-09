import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  try {
    const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("health_declarations")
      .select("id,event_id,registration_id,athlete_number,full_name,email,birth_date,blood_type,emergency_contact_name,emergency_contact_phone,answers,medications,allergies,health_notes,consent_accepted_at,submitted_at,updated_at")
      .order("submitted_at", { ascending: false });
    if (eventId) query = query.eq("event_id", eventId);
    const { data, error } = await query;
    if (error?.code === "42P01") return NextResponse.json({ module_ready: false, declarations: [] });
    if (error) throw error;
    return NextResponse.json({ module_ready: true, declarations: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível carregar as declarações de saúde." }, { status: 500 });
  }
}
