"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { BillList } from "@/components/bills/bill-list";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { submitPaymentAction } from "@/actions/payment-actions";
import type { UserBill } from "@/types/bill";
import type { PaymentFormValues } from "@/lib/validations/payment";
import { cn } from "@/lib/utils";

type BillFilter =
  | "all"
  | "unpaid"
  | "pending"
  | "paid"
  | "overdue"
  | "rejected";

const BILL_FILTERS: { value: BillFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "unpaid", label: "Belum Dibayar" },
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "paid", label: "Lunas" },
  { value: "overdue", label: "Terlambat" },
  { value: "rejected", label: "Ditolak" },
];

const today = new Date().toISOString().slice(0, 10);

function applyFilter(bills: UserBill[], filter: BillFilter): UserBill[] {
  switch (filter) {
    case "unpaid":
      return bills.filter(
        (item) =>
          item.bill.status === "active" &&
          item.remaining > 0 &&
          item.pendingAmount === 0
      );
    case "pending":
      return bills.filter((item) => item.pendingAmount > 0);
    case "paid":
      return bills.filter(
        (item) => item.bill.status === "active" && item.remaining <= 0
      );
    case "overdue":
      return bills.filter(
        (item) =>
          item.bill.status === "active" &&
          item.remaining > 0 &&
          item.bill.dueDate < today
      );
    case "rejected":
      return bills.filter((item) => item.latestRejectedReason);
    default:
      return bills;
  }
}

export function BillsContainer({ bills }: { bills: UserBill[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<BillFilter>("all");
  const [payTarget, setPayTarget] = useState<UserBill | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = applyFilter(bills, filter);

  async function handleSubmit(values: PaymentFormValues) {
    if (!payTarget) return;
    setSaving(true);
    const result = await submitPaymentAction({
      assignmentId: payTarget.assignmentId,
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      paymentDate: values.paymentDate,
      reference: values.reference,
      notes: values.notes,
    });
    setSaving(false);

    if (result.success) {
      toast.success("Pembayaran dikirim dan menunggu verifikasi.");
      setPayTarget(null);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5">
      <PageHeader
        title="Tagihan"
        description="Tagihan yang diberikan administrator kepada Anda."
      />

      <div
        className="flex gap-1 overflow-x-auto pb-1 sm:flex-wrap"
        role="tablist"
        aria-label="Filter status tagihan"
      >
        {BILL_FILTERS.map((option) => {
          const activeFilter = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={activeFilter}
              onClick={() => setFilter(option.value)}
              className={cn(
                "h-8 shrink-0 rounded-md px-3 text-xs font-medium transition-colors duration-150",
                activeFilter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <BillList
          bills={filtered}
          onPay={(item) => setPayTarget(item)}
        />
      </div>

      <PaymentDialog
        open={!!payTarget}
        onOpenChange={(open) => {
          if (!open) setPayTarget(null);
        }}
        billTitle={payTarget?.bill.title ?? ""}
        remaining={payTarget?.remaining ?? 0}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </div>
  );
}