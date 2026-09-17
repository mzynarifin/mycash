import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AuditEvent } from "@/types/audit";
import { AUDIT_ACTION_LABELS } from "@/types/audit";
import { formatDateTimeMedium } from "@/lib/formatters";

export function AdminActivity({ items }: { items: AuditEvent[] }) {
  return (
    <section className="border-t border-border pt-5" aria-labelledby="admin-activity-title">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 id="admin-activity-title" className="text-sm font-semibold text-foreground">Aktivitas admin terbaru</h2>
          <p className="mt-1 text-xs text-muted-foreground">Jejak perubahan operasional terakhir.</p>
        </div>
        <Link href="/admin/audit-logs" className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          Lihat audit log
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Belum ada aktivitas admin.</p>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{AUDIT_ACTION_LABELS[item.action] ?? item.action}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.entityType}{item.entityId ? ` · ${item.entityId}` : ""}</p>
              </div>
              <time className="text-xs text-muted-foreground" dateTime={item.createdAt}>{formatDateTimeMedium(item.createdAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
