import { getUserBills } from "@/lib/queries/bills";
import { getPayments } from "@/lib/queries/payments";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [bills, payments] = await Promise.all([
    getUserBills(),
    getPayments(),
  ]);
  return <DashboardClient bills={bills} payments={payments} />;
}
