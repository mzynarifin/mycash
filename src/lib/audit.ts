import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export async function writeAuditLog(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: Json;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    // Service key not configured: audit is best-effort.
    return;
  }
  try {
    await admin.from("audit_logs").insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      detail: input.detail ?? null,
    });
  } catch {
    // Never let a failing audit write break the primary operation.
  }
}