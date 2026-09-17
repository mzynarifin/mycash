import type { AuditEvent } from "@/types/audit";
import type { PaymentMethod } from "@/types/expense";
import type { AdminPaymentListItem, PaymentStatus } from "@/types/payment";

export interface AdminBillTransactionGroup {
  billId: string;
  billTitle: string;
  billAmount: number;
  payments: Array<{
    id: string;
    userName: string;
    email: string | null;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    status: PaymentStatus;
    reference: string | null;
  }>;
}

export interface AdminDashboardData {
  activeUsers: number;
  activeBills: number;
  outstandingBillAmount: number;
  pendingPaymentCount: number;
  overdueAssignments: number;
  upcomingDueBills: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    remaining: number;
  }>;
  recentPendingPayments: AdminPaymentListItem[];
  recentAuditEvents: AuditEvent[];
  billTransactionGroups: AdminBillTransactionGroup[];
}