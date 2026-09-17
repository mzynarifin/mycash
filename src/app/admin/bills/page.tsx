import type { Metadata } from "next";
import { getAdminBills } from "@/lib/queries/admin-bills";
import { getSelectableUsers } from "@/lib/queries/admin-bills";
import { AdminBillListContainer } from "@/components/admin/bills/admin-bill-list";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const value = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const search = value("search")?.slice(0, 120) ?? "";
  const rawStatus = value("status");
  const status = rawStatus === "active" || rawStatus === "cancelled" || rawStatus === "archived" ? rawStatus : "";
  const page = Math.max(1, Number.parseInt(value("page") ?? "1", 10) || 1);
  const perPage = 20;
  const [billsResult, users] = await Promise.all([
    getAdminBills({ search, status, page, perPage }),
    getSelectableUsers(),
  ]);

  return <AdminBillListContainer bills={billsResult.items} users={users} search={search} status={status || "all"} page={page} perPage={perPage} total={billsResult.total} />;
}
