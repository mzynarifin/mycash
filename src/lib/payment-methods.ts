import type { PaymentMethod } from "@/types/expense";

export const PAYMENT_METHODS = [
  "qris",
  "cash",
  "bank_transfer",
  "e_wallet",
  "debit_card",
  "credit_card",
  "other",
] as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qris: "QRIS",
  cash: "Cash",
  bank_transfer: "Transfer",
  e_wallet: "E-wallet",
  debit_card: "Kartu Debit",
  credit_card: "Kartu Kredit",
  other: "Lainnya",
};

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}