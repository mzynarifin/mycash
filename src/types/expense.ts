export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "e_wallet"
  | "debit_card"
  | "credit_card"
  | "qris"
  | "other";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  notes?: string;
}

export type ExpenseInput = Omit<Expense, "id">;

export type ExpenseSort = "newest" | "oldest" | "amount-desc" | "amount-asc";

export interface ExpenseFilters {
  search: string;
  categoryId: string;
  paymentMethod: PaymentMethod | "";
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
}