import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminBillDetail, getSelectableUsers } from "@/lib/queries/admin-bills";
import { AdminBillDetailClient } from "@/components/admin/bills/admin-bill-detail";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminBillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bill, users] = await Promise.all([getAdminBillDetail(id), getSelectableUsers()]);
  if (!bill) notFound();

  return (
    <div className="space-y-5">
      <AdminBillDetailClient bill={bill} users={users} />
    </div>
  );
}