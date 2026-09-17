"use client";

import Link from "next/link";
import { WalletCards, CircleCheck, CircleX, Clock, Paperclip } from "lucide-react";
import type { Payment } from "@/types/payment";
import { PAYMENT_STATUS_LABELS } from "@/types/payment";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { getProofUrl } from "@/lib/payments";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

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

export function PaymentList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={WalletCards}
        title="Belum ada pembayaran."
        description="Pembayaran Anda akan muncul setelah Anda membayar tagihan."
        framed={false}
        action={<Button variant="outline" nativeButton={false} render={<Link href="/bills" />}>Lihat Tagihan</Button>}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {payments.map((payment) => {
        const Icon = STATUS_ICON[payment.status];
        return (
          <li key={payment.id} className="px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <WalletCards size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {payment.billTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateMedium(payment.paymentDate)} ·{" "}
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                    {payment.reference ? ` · Ref: ${payment.reference}` : ""}
                  </p>
                  {payment.reviewedAt && <p className="mt-1 text-xs text-muted-foreground">Dikonfirmasi {formatDateMedium(payment.reviewedAt)}</p>}
                  {payment.notes && <p className="mt-1 text-xs text-muted-foreground">{payment.notes}</p>}
                  {payment.status === "rejected" && payment.rejectReason && (
                    <p className="mt-1 text-xs text-destructive">
                      Alasan: {payment.rejectReason}
                    </p>
                  )}
                  {getProofUrl(payment.proofObject) && (
                    <a
                      href={getProofUrl(payment.proofObject)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Paperclip size={12} aria-hidden="true" />
                      Lihat bukti pembayaran
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(payment.amount)}
                </p>
                <Badge variant={STATUS_VARIANT[payment.status]} className="mt-1 h-4 text-[10px]">
                  <Icon size={9} className="mr-0.5" aria-hidden="true" />
                  {PAYMENT_STATUS_LABELS[payment.status]}
                </Badge>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
