"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import type { UserBill } from "@/types/bill";
import type { Payment } from "@/types/payment";
import type { PaymentFormValues } from "@/lib/validations/payment";
import { submitPaymentAction } from "@/actions/payment-actions";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { PAYMENT_STATUS_LABELS } from "@/types/payment";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { cn } from "@/lib/utils";

export function DashboardClient({
  bills,
  payments,
}: {
  bills: UserBill[];
  payments: Payment[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<UserBill | null>(null);
  const [saving, setSaving] = useState(false);

  const active = bills.filter(
    (item) => item.bill.status === "active" && item.remaining > 0
  );
  const totalActiveAmount = active.reduce(
    (sum, item) => sum + item.bill.amount,
    0
  );
  const remaining = active.reduce((sum, item) => sum + item.remaining, 0);
  const pending = payments.filter((p) => p.status === "pending").length;
  const verified = payments.filter((p) => p.status === "verified").length;
  const upcoming = [...active]
    .sort((a, b) => a.bill.dueDate.localeCompare(b.bill.dueDate))
    .slice(0, 5);

  async function pay(values: PaymentFormValues) {
    if (!target) return;
    setSaving(true);
    const result = await submitPaymentAction({
      assignmentId: target.assignmentId,
      ...values,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success("Pembayaran dikirim dan menunggu verifikasi.");
    setTarget(null);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-8 pt-1">
      <PageHeader
        title="Tagihan Saya"
        description="Tagihan dari administrator dan status pembayaran Anda."
      />

      <section aria-labelledby="billing-summary" className="border-b border-border pb-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <p id="billing-summary" className="text-sm font-medium text-muted-foreground">
              Total belum dibayar
            </p>
            <p className="mt-2 text-3xl font-semibold leading-none tabular-nums text-foreground sm:text-[2.5rem]">
              {formatCurrency(remaining)}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <ReceiptText size={15} aria-hidden="true" />
              {active.length} tagihan aktif dengan nilai total{" "}
              {formatCurrency(totalActiveAmount)}
            </p>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-border border-t border-border pt-5 lg:border-t-0 lg:pt-0">
            <SummaryStat
              label="Tagihan Aktif"
              value={active.length}
              className="pr-4 lg:pl-6"
            />
            <SummaryStat
              label="Menunggu Verifikasi"
              value={pending}
              className="px-4"
            />
            <SummaryStat
              label="Berhasil"
              value={verified}
              className="pl-4"
            />
          </dl>
        </div>
      </section>

      <section aria-labelledby="active-bills">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="active-bills" className="text-base font-semibold text-foreground">
              Tagihan aktif
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Urut berdasarkan tanggal jatuh tempo.
            </p>
          </div>
          <Link
            href="/bills"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Semua tagihan
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Belum ada tagihan"
              description="Tagihan yang diberikan admin akan muncul di sini."
              framed={false}
            />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((item) => {
                const overdue =
                  item.bill.dueDate < new Date().toISOString().slice(0, 10);
                return (
                  <li
                    key={item.assignmentId}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.bill.title}
                        </p>
                        {overdue && (
                          <Badge variant="destructive" className="h-4 text-[10px]">
                            Terlambat
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Jatuh tempo {formatDateMedium(item.bill.dueDate)}
                      </p>
                      <BillStatus label={item.pendingAmount > 0 ? "Menunggu Verifikasi" : item.paidAmount > 0 ? "Sebagian Dibayar" : "Belum Dibayar"} />
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(item.remaining)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          sisa · dari {formatCurrency(item.bill.amount)}
                        </p>
                      </div>
                      {item.pendingAmount === 0 && (
                        <Button size="sm" onClick={() => setTarget(item)}>
                          Bayar
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="payment-history">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2
              id="payment-history"
              className="text-base font-semibold text-foreground"
            >
              Riwayat pembayaran
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Status verifikasi pembayaran terakhir.
            </p>
          </div>
          <Link
            href="/payments"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Lihat riwayat
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {payments.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="Belum ada riwayat pembayaran"
              description="Pembayaran yang Anda kirim akan muncul di sini."
              framed={false}
            />
          ) : (
            <ul className="divide-y divide-border">
              {payments.slice(0, 5).map((payment) => {
                const rejected = payment.status === "rejected";
                const verifiedNow = payment.status === "verified";
                return (
                  <li key={payment.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        verifiedNow
                          ? "bg-emerald-500/10 text-emerald-600"
                          : rejected
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {verifiedNow ? (
                        <CircleCheck className="size-4" aria-hidden="true" />
                      ) : rejected ? (
                        <Clock3 className="size-4" aria-hidden="true" />
                      ) : (
                        <Clock3 className="size-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {payment.billTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateMedium(payment.paymentDate)} ·{" "}
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </p>
                      {payment.status === "rejected" && payment.rejectReason && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
                          Alasan: {payment.rejectReason}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <PaymentDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        billTitle={target?.bill.title ?? ""}
        remaining={target?.remaining ?? 0}
        onSubmit={pay}
        loading={saving}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[0.6875rem] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function BillStatus({ label }: { label: string }) {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "size-1.5 rounded-full",
          label === "Lunas"
            ? "bg-emerald-500"
            : label === "Terlambat" || label === "Ditolak"
              ? "bg-destructive"
              : "bg-amber-500"
        )}
        aria-hidden="true"
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}