"use client";

import { useState } from "react";
import { History } from "lucide-react";
import type { AdminBillTransactionGroup } from "@/types/dashboard";
import { PAYMENT_STATUS_LABELS } from "@/types/payment";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_VARIANT = {
  pending: "secondary",
  verified: "default",
  rejected: "destructive",
} as const;

export function AdminTransactionHistory({
  groups,
}: {
  groups: AdminBillTransactionGroup[];
}) {
  const [selected, setSelected] = useState<AdminBillTransactionGroup | null>(null);

  return (
    <section
      className="overflow-hidden rounded-lg border border-border bg-card"
      aria-labelledby="tx-history-title"
    >
      <div className="border-b border-border px-4 py-3">
        <h2 id="tx-history-title" className="text-sm font-semibold text-foreground">
          Riwayat Transaksi
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Transaksi dikelompokkan berdasarkan tagihan. Buka untuk melihat seluruh transaksinya.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Belum ada transaksi.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {groups.map((group) => (
            <li
              key={group.billId}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {group.billTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCurrency(group.billAmount)} · {group.payments.length} transaksi
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setSelected(group)}
              >
                <History size={14} className="mr-1.5" aria-hidden="true" />
                Riwayat Transaksi
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.billTitle}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.payments.length} transaksi · total tagihan ${formatCurrency(selected.billAmount)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border">
            {selected?.payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {payment.userName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateMedium(payment.paymentDate)} ·{" "}
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                    {payment.reference ? ` · Ref: ${payment.reference}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(payment.amount)}
                  </p>
                  <Badge
                    variant={STATUS_VARIANT[payment.status]}
                    className="mt-0.5 h-4 text-[10px]"
                  >
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}