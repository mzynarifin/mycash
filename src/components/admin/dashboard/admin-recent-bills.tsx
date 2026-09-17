"use client";

import Link from "next/link";
import { ReceiptText, Clock, ArrowRight } from "lucide-react";
import type { AdminDashboardData } from "@/types/dashboard";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

export function AdminRecentBills({
  items,
}: {
  items: AdminDashboardData["upcomingDueBills"];
}) {
  if (items.length === 0)
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground text-center">
        Belum ada tagihan aktif.
      </p>
    );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-0 divide-y divide-border">
      {items.map((item) => {
        const overdue = item.dueDate < today;
        return (
          <div key={item.id} className="flex items-start gap-3 px-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <ReceiptText size={16} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                  {formatCurrency(item.amount)}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  Jatuh tempo {formatDateMedium(item.dueDate)}
                </p>
                {item.remaining > 0 && (
                  <Badge variant={overdue ? "destructive" : "secondary"} className="h-3.5 text-[10px]">
                    <Clock size={9} className="mr-0.5" aria-hidden="true" />
                    {overdue ? "Terlambat" : `Sisa ${formatCurrency(item.remaining)}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <Link
        href="/admin/bills"
        className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-primary hover:underline"
      >
        Lihat semua tagihan
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}
