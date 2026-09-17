import type { AuditEvent } from "@/types/audit";
import type { AdminPaymentListItem } from "@/types/payment";

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
}