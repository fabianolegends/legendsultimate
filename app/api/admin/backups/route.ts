import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const tables = ["events", "stages", "routes", "route_versions", "checkpoints", "timed_segments", "registrations", "athletes", "activities", "validation_results", "checkpoint_passages", "segment_results", "stage_results", "event_category_bib_sequences", "stage_result_audit_log", "registration_link_audit"] as const;

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, "backups.create")) return NextResponse.json({ error: "Sem permissão para gerar backup." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { event_id?: string };
  const eventId = body.event_id || null;
  const supabase = createSupabaseAdmin();
  const snapshot: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const table of tables) {
    let query = supabase.from(table).select("*");
    if (eventId && ["events", "stages", "registrations", "stage_results", "stage_result_audit_log", "event_category_bib_sequences", "registration_link_audit"].includes(table)) query = query.eq(table === "events" ? "id" : "event_id", eventId);
    const { data, error } = await query;
    if (error?.code === "42P01") continue;
    if (error) return NextResponse.json({ error: `Falha no backup de ${table}: ${error.message}` }, { status: 500 });
    snapshot[table] = data ?? [];
    counts[table] = data?.length ?? 0;
  }
  const payload = JSON.stringify({ format: "legends-core-backup-v1", exported_at: new Date().toISOString(), event_id: eventId, tables: snapshot });
  const checksum = createHash("sha256").update(payload).digest("hex");
  const actor = adminSessionFromRequest(request)!;
  await supabase.from("backup_exports").insert({ actor_user_id: actor.userId, actor_email: actor.email, scope: eventId ? "event" : "full", event_id: eventId, row_counts: counts, checksum_sha256: checksum });
  await recordAdminAudit(request, { action: "backup.exported", resourceType: "backup", eventId, details: { counts, checksum } });
  return new NextResponse(payload, { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="legends-backup-${new Date().toISOString().slice(0, 10)}.json"`, "X-Checksum-SHA256": checksum } });
}
