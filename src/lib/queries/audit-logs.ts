import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AuditEvent } from "@/types/audit";

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  detail: unknown;
  created_at: string;
}

export const getAuditLogs = cache(
  async (params: {
    page: number;
    perPage: number;
  }): Promise<{ items: AuditEvent[]; total: number }> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const from = (params.page - 1) * params.perPage;
    const to = from + params.perPage - 1;

    const { data, count, error } = await supabase
      .from("audit_logs")
      .select("id, actor_id, action, entity_type, entity_id, detail, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data) return { items: [], total: 0 };

    const items: AuditEvent[] = (data as unknown as AuditLogRow[]).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      detail: (row.detail as AuditEvent["detail"]) ?? null,
      createdAt: row.created_at,
    }));

    return { items, total: count ?? 0 };
  }
);