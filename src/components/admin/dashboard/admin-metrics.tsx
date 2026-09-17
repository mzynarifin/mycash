"use client";

import {
  Users,
  ReceiptText,
  CreditCard,
  CircleDollarSign,
  AlertTriangle,
} from "lucide-react";
import type { AdminDashboardData } from "@/types/dashboard";
import { formatCurrency } from "@/lib/formatters";

interface AdminMetricsProps {
  data: AdminDashboardData;
}

const metricCards = [
  {
    key: "activeUsers",
    label: "User aktif",
    icon: Users,
    getValue: (d: AdminDashboardData) => d.activeUsers,
  },
  {
    key: "activeBills",
    label: "Tagihan aktif",
    icon: ReceiptText,
    getValue: (d: AdminDashboardData) => d.activeBills,
  },
  {
    key: "outstandingBillAmount",
    label: "Nilai belum lunas",
    icon: CircleDollarSign,
    getValue: (d: AdminDashboardData) => formatCurrency(d.outstandingBillAmount),
  },
  {
    key: "pendingPaymentCount",
    label: "Menunggu verifikasi",
    icon: CreditCard,
    getValue: (d: AdminDashboardData) => d.pendingPaymentCount,
  },
  {
    key: "overdueAssignments",
    label: "Tagihan terlambat",
    icon: AlertTriangle,
    getValue: (d: AdminDashboardData) => d.overdueAssignments,
  },
];

export function AdminMetrics({ data }: AdminMetricsProps) {
  return (
    <dl className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 xl:grid-cols-5">
      {metricCards.map((card) => (
        <div
          key={card.key}
          className="flex min-h-[88px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <card.icon size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <dt className="truncate text-xs text-muted-foreground">{card.label}</dt>
            <dd className="mt-1 truncate text-lg font-semibold text-foreground tabular-nums">
              {card.getValue(data)}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
