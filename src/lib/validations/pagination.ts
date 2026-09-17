import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export type AdminUserStatusFilter = "active" | "suspended" | "";
export type BillStatusFilter = "active" | "cancelled" | "archived" | "";
export type PaymentStatusFilter = "pending" | "verified" | "rejected" | "";

function optionalString(max: number) {
  return z.preprocess(
    (v) => (v === undefined ? "" : v),
    z.string().max(max)
  );
}

export const expenseSortSchema = z.enum(["newest", "oldest", "amount-desc", "amount-asc"]);

/** URL search params for the /expenses list (§91). */
export const expenseListSearchParamsSchema = paginationSchema.extend({
  q: optionalString(120),
  categoryId: optionalString(60),
  paymentMethod: optionalString(20),
  from: optionalString(10),
  to: optionalString(10),
  minAmount: optionalString(20),
  maxAmount: optionalString(20),
  sort: expenseSortSchema.default("newest"),
});

export type ExpenseListSearchParams = z.infer<typeof expenseListSearchParamsSchema> & {
  sort: ExpenseSortValue;
};

export type ExpenseSortValue = z.infer<typeof expenseSortSchema>;