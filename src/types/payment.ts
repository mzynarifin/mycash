import type { PaymentMethod } from "@/types/expense";

export type PaymentStatus = "pending" | "verified" | "rejected";

export interface Payment {
  id: string;
  assignmentId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  rejectReason: string | null;
  notes: string | null;
  reference: string | null;
  reviewedAt: string | null;
  createdAt: string;
  billTitle: string;
  billDueDate: string;
  proofObject: string | null;
}

/** Admin view of a payment with the paying user resolved. */
export interface AdminPaymentListItem {
  id: string;
  userId: string;
  userName: string;
  email: string | null;
  billId: string;
  billTitle: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  rejectReason: string | null;
  notes: string | null;
  reference: string | null;
  createdAt: string;
  proofObject: string | null;
  proofUrl: string | null;
  billAmount: number;
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return value === "pending" || value === "verified" || value === "rejected";
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Menunggu Verifikasi",
  verified: "Berhasil",
  rejected: "Ditolak",
};
