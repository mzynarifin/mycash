import { getUserBills } from "@/lib/queries/bills";
import { BillsContainer } from "@/components/bills/bills-container";

export default async function BillsPage() {
  const bills = await getUserBills();

  return <BillsContainer bills={bills} />;
}