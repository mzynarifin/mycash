"use client";

import { CircleCheck, CircleX, Clock, CreditCard, Paperclip } from "lucide-react";
import type { AdminPaymentListItem } from "@/types/payment";
import { PAYMENT_STATUS_LABELS } from "@/types/payment";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { isInstallment } from "@/lib/payments";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminPaymentTableProps {
  payments: AdminPaymentListItem[];
  onReview: (payment: AdminPaymentListItem) => void;
  onDetail: (payment: AdminPaymentListItem) => void;
}

const STATUS_ICON = {
  pending: Clock,
  verified: CircleCheck,
  rejected: CircleX,
} as const;

const STATUS_VARIANT = {
  pending: "secondary",
  verified: "default",
  rejected: "destructive",
} as const;

export function AdminPaymentTable({ payments, onReview, onDetail }: AdminPaymentTableProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Tidak ada pembayaran ditemukan."
        description="Ubah filter atau rentang tanggal untuk melihat data lain."
        framed={false}
      />
    );
  }

  return (
    <>
      <table className="hidden w-full md:table" aria-label="Daftar pembayaran">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3 text-left">User</th>
            <th className="px-4 py-3 text-left">Tagihan</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Metode</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Tanggal</th>
            <th className="w-24 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payments.map((item) => {
            const Icon = STATUS_ICON[item.status];
            return (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  {item.userName}
                  {item.email && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({item.email})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {item.billTitle}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(item.amount)}
                  {isInstallment(item.amount, item.billAmount) && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                      Cicilan
                    </span>
                  )}
                  {isInstallment(item.amount, item.billAmount) && (
                    <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                      dari {formatCurrency(item.billAmount)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[item.status]} className="h-4 text-[10px]">
                    <Icon size={9} className="mr-0.5" aria-hidden="true" />
                    {PAYMENT_STATUS_LABELS[item.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateMedium(item.paymentDate)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {item.proofUrl && (
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={`Lihat bukti pembayaran ${item.userName}`}
                      >
                        <Paperclip size={15} aria-hidden="true" />
                      </a>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onDetail(item)}>
                      Detail
                    </Button>
                    {item.status === "pending" && (
                      <Button size="sm" onClick={() => onReview(item)}>
                        Review
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="md:hidden divide-y divide-border">
        {payments.map((item) => {
          const Icon = STATUS_ICON[item.status];
          return (
            <li key={item.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.userName}
                    </p>
                    <Badge variant={STATUS_VARIANT[item.status]} className="h-4 text-[10px]">
                      <Icon size={9} className="mr-0.5" aria-hidden="true" />
                      {PAYMENT_STATUS_LABELS[item.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.billTitle} · {PAYMENT_METHOD_LABELS[item.paymentMethod]} · {formatDateMedium(item.paymentDate)}
                  </p>
                  {isInstallment(item.amount, item.billAmount) && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                      Cicilan · dari {formatCurrency(item.billAmount)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                  {formatCurrency(item.amount)}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                {item.proofUrl && (
                  <a
                    href={item.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip size={13} aria-hidden="true" />
                    Bukti
                  </a>
                )}
                <Button variant="outline" size="sm" onClick={() => onDetail(item)}>
                  Detail
                </Button>
                {item.status === "pending" && (
                  <Button size="sm" onClick={() => onReview(item)}>
                    Review
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
