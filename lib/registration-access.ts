type EligibilityResult = {
  configured: boolean;
  required: boolean;
  eligible: boolean;
  registration: Record<string, any> | null;
};

function isMissingTableError(error: any) {
  return error?.code === "42P01" || String(error?.message ?? "").includes("registrations");
}

export async function resolveRegistrationEligibility(
  supabase: any,
  input: { eventId: string; athleteId: string },
): Promise<EligibilityResult> {
  const { count, error: countError } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", input.eventId)
    .neq("status", "cancelled");

  if (countError) {
    if (isMissingTableError(countError)) {
      return { configured: false, required: false, eligible: true, registration: null };
    }
    throw countError;
  }

  const required = (count ?? 0) > 0;
  if (!required) return { configured: true, required: false, eligible: true, registration: null };

  const { data, error } = await supabase
    .from("registrations")
    .select("id, event_id, athlete_id, registration_code, bib_number, full_name, email, birth_date, gender, category, modality, country_code, city, status, claimed_at")
    .eq("event_id", input.eventId)
    .eq("athlete_id", input.athleteId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (error) throw error;
  return { configured: true, required: true, eligible: Boolean(data), registration: data ?? null };
}

export function normalizeRegistrationCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeRegistrationEmail(value: string) {
  return value.trim().toLowerCase();
}
