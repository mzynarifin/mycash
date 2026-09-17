import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminUserDetail } from "@/lib/queries/admin-users";
import { PageHeader } from "@/components/layout/page-header";
import { AdminUserDetailClient } from "@/components/admin/users/user-detail";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title={user.name} description={user.email ?? "Tanpa email"} />
      <AdminUserDetailClient user={user} />
    </div>
  );
}