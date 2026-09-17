"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { AdminPaymentListItem } from "@/types/payment";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";

export function AdminRecentPayments({
  items,
}: {
  items: AdminPaymentListItem[];
}) {
  if (items.length === 0)
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground text-center">
        Tidak ada pembayaran pending.
      </p>
    );

  return (
    <div className="space-y-0 divide-y divide-border">
      {items.map((item) => {
        return (
          <div key={item.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.userName}
                </p>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.billTitle}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
              <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(item.amount)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDateMedium(item.paymentDate)} · {PAYMENT_METHOD_LABELS[item.paymentMethod]}</p>
            </div>
            <Link href="/admin/payments" aria-label={`Tinjau pembayaran ${item.userName}`} className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:flex">
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        );
      })}
      <Link
        href="/admin/payments"
        className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-primary hover:underline"
      >
        Buka antrean pembayaran
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}
