import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/category";

export interface CategoryData {
  categories: Category[];
  expenseCounts: Record<string, number>;
}

export const getCategories = cache(async (): Promise<CategoryData> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, color, expenses(category_id)")
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { categories: [], expenseCounts: {} };
  }

  const categories: Category[] = [];
  const expenseCounts: Record<string, number> = {};

  for (const row of data) {
    categories.push({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
    });
    expenseCounts[row.id] = (row.expenses as { category_id: string }[] | null)?.length ?? 0;
  }

  return { categories, expenseCounts };
});

export const getCategoriesList = cache(async (): Promise<Category[]> => {
  const { categories } = await getCategories();
  return categories;
});