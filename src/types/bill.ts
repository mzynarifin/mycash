export type BillStatus = "active" | "cancelled" | "archived";

export type BillAudience = "selected" | "all";

export interface Bill {
  id: string;
  title: string;
  description: string;
  category: string;
  notes: string | null;
  reference: string | null;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: BillStatus;
  audience: BillAudience;
  createdAt: string;
  updatedAt: string;
}

/** A bill as seen by the user it is assigned to. */
export interface UserBill {
  assignmentId: string;
  bill: Bill;
  paidAmount: number;
  pendingAmount: number;
  latestRejectedReason: string | null;
  remaining: number;
}

export interface AdminBillListItem {
  bill: Bill;
  assignmentCount: number;
  verifiedTotal: number;
  remaining: number;
}

export interface AdminBillAssignment {
  assignmentId: string;
  userId: string;
  userName: string;
  email: string | null;
  assignedAt: string;
  amount: number;
  verifiedTotal: number;
  remaining: number;
}

export interface AdminBillDetail extends AdminBillListItem {
  assignments: AdminBillAssignment[];
}

export function isBillStatus(value: string): value is BillStatus {
  return value === "active" || value === "cancelled" || value === "archived";
}

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  active: "Aktif",
  cancelled: "Dibatalkan",
  archived: "Diarsipkan",
};

export const BILL_CATEGORIES = [
  "Pendidikan",
  "Keanggotaan",
  "Layanan",
  "Iuran",
  "Administrasi",
  "Lainnya",
] as const;
