import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isPaymentMethod } from "@/lib/payment-methods";
import type { Expense } from "@/types/expense";
import type { ExpenseListSearchParams, ExpenseSortValue } from "@/lib/validations/pagination";

function mapRow(row: {
  id: string;
  amount: number | string;
  description: string;
  expense_date: string;
  payment_method: string | null;
  notes: string | null;
  category_id: string;
}) {
  const method = row.payment_method;
  return {
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    categoryId: row.category_id,
    paymentMethod: method && isPaymentMethod(method) ? method : "other",
    expenseDate: row.expense_date,
    notes: row.notes ?? undefined,
  } satisfies Expense;
}

function parseAmountFilter(value: string): number | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

export const getExpenses = cache(async (): Promise<Expense[]> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, description, expense_date, payment_method, notes, category_id")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map(mapRow);
});

/** Server-side filtered/paginated page for the /expenses list (§90–92). */
export const getExpensesPage = cache(
  async (params: ExpenseListSearchParams): Promise<{ items: Expense[]; total: number }> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let query = supabase
      .from("expenses")
      .select("id, amount, description, expense_date, payment_method, notes, category_id", {
        count: "exact",
      });

    const search = params.q.trim();
    if (search) {
      const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(`description.ilike.%${escaped}%,notes.ilike.%${escaped}%`);
    }
    if (params.categoryId) query = query.eq("category_id", params.categoryId);
    if (isPaymentMethod(params.paymentMethod)) {
      query = query.eq("payment_method", params.paymentMethod);
    }
    if (params.from) query = query.gte("expense_date", params.from);
    if (params.to) query = query.lte("expense_date", params.to);

    const minAmount = parseAmountFilter(params.minAmount);
    if (minAmount !== null) query = query.gte("amount", minAmount);
    const maxAmount = parseAmountFilter(params.maxAmount);
    if (maxAmount !== null) query = query.lte("amount", maxAmount);

    const sort: ExpenseSortValue = params.sort;
    if (sort === "oldest") query = query.order("expense_date", { ascending: true });
    else if (sort === "amount-desc") query = query.order("amount", { ascending: false });
    else if (sort === "amount-asc") query = query.order("amount", { ascending: true });
    else query = query.order("expense_date", { ascending: false });
    query = query.order("created_at", { ascending: false });

    const from = (params.page - 1) * params.perPage;
    const to = from + params.perPage - 1;
    const { data, count, error } = await query.range(from, to);

    if (error || !data) return { items: [], total: 0 };

    return { items: data.map(mapRow), total: count ?? data.length };
  }
);