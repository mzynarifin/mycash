"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { History, ShieldAlert } from "lucide-react";
import type { AuditEvent } from "@/types/audit";
import { AUDIT_ACTION_LABELS } from "@/types/audit";
import { formatDateTimeMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface AuditLogListContainerProps {
  items: AuditEvent[];
  page: number;
  perPage: number;
  total: number;
}

export function AuditLogListContainer({ items, page, perPage, total }: AuditLogListContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin/audit-logs?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={History}
            title="Belum ada aktivitas."
            description="Aktivitas administratif akan tercatat di sini."
            framed={false}
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((log) => {
              const label = AUDIT_ACTION_LABELS[log.action] ?? log.action;
              const isSensitive =
                log.action === "user.suspend" ||
                log.action === "user.reactivate" ||
                log.action === "user.create";
              return (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {isSensitive ? (
                      <ShieldAlert size={15} aria-hidden="true" />
                    ) : (
                      <History size={16} aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <Badge variant="secondary" className="h-4 text-[10px]">
                        {log.action}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTimeMedium(log.createdAt)} ·{" "}
                      {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}
                      {log.actorId ? ` · oleh ${log.actorId.slice(0, 8)}` : " · oleh sistem"}
                    </p>
                    {log.detail && (
                      <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-md bg-muted/50 px-2 py-1 text-[11px] leading-4 text-muted-foreground">
                        {JSON.stringify(log.detail, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <p className="text-xs text-muted-foreground">
            Halaman {page} dari {totalPages} · {total} aktivitas
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              Selanjutnya
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
