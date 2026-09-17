"use client";

import { ReceiptText } from "lucide-react";
import type { UserBill } from "@/types/bill";
import { BILL_STATUS_LABELS } from "@/types/bill";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface BillListProps {
  bills: UserBill[];
  onPay: (bill: UserBill) => void;
}

export function BillList({ bills, onPay }: BillListProps) {
  if (bills.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="Belum ada tagihan."
        description="Tagihan yang ditugaskan kepada Anda akan muncul di sini."
        framed={false}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {bills.map((item) => {
        const { bill } = item;
        const isActive = bill.status === "active";
        const paid = item.remaining <= 0;
        const overdue = isActive && item.remaining > 0 && bill.dueDate < new Date().toISOString().slice(0, 10);
        const rejected = !paid && isActive && item.pendingAmount === 0 && !!item.latestRejectedReason;
        const statusLabel = paid
          ? "Lunas"
          : item.pendingAmount > 0
            ? "Menunggu Verifikasi"
            : rejected
              ? "Ditolak"
              : item.paidAmount > 0
                ? "Sebagian Dibayar"
                : overdue
                  ? "Terlambat"
                  : BILL_STATUS_LABELS[bill.status];
        const progress =
          bill.amount > 0 ? Math.min(100, Math.round((item.paidAmount / bill.amount) * 100)) : 0;

        return (
          <li key={item.assignmentId} className="px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <ReceiptText size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {bill.title}
                    </p>
                    <Badge variant={paid ? "default" : rejected ? "destructive" : isActive ? "secondary" : "secondary"} className="h-4 text-[10px]">
                      {statusLabel}
                    </Badge>
                    {overdue && !rejected && (
                      <Badge variant="destructive" className="h-4 text-[10px]">
                        Terlambat
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Jatuh tempo {formatDateMedium(bill.dueDate)}
                    {bill.reference ? ` · Ref: ${bill.reference}` : ""}
                  </p>
                  {item.latestRejectedReason && item.pendingAmount === 0 && <p className="mt-1 text-xs text-destructive">Pembayaran ditolak: {item.latestRejectedReason}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(bill.amount)}
                </p>
                {isActive && item.remaining > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    Sisa {formatCurrency(item.remaining)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progres pembayaran ${bill.title}`}
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    progress >= 100 ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {progress}%
              </span>
              {isActive && item.remaining > 0 && item.pendingAmount === 0 && (
                <Button size="sm" onClick={() => onPay(item)}>
                  Bayar
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
