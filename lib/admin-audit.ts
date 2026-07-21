import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { adminSessionFromRequest } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function recordAdminAudit(request: NextRequest, input: {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  eventId?: string | null;
  details?: Record<string, unknown>;
}) {
  const actor = adminSessionFromRequest(request);
  if (!actor) return;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(`${forwarded}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex");
  const { error } = await createSupabaseAdmin().from("admin_operation_audit").insert({
    actor_user_id: actor.userId,
    actor_email: actor.email,
    actor_role: actor.role,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    event_id: input.eventId ?? null,
    ip_hash: ipHash,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    details: input.details ?? {},
  });
  if (error && error.code !== "42P01") console.error("admin audit failed", error.message);
}
