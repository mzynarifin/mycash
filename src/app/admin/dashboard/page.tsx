import { getAdminDashboard } from "@/lib/queries/admin-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { AdminMetrics } from "@/components/admin/dashboard/admin-metrics";
import { AdminRecentBills } from "@/components/admin/dashboard/admin-recent-bills";
import { AdminRecentPayments } from "@/components/admin/dashboard/admin-recent-payments";
import { AdminTransactionHistory } from "@/components/admin/dashboard/admin-transaction-history";
import { AdminActivity } from "@/components/admin/dashboard/admin-activity";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FilePlus2, UserPlus } from "lucide-react";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <PageHeader
        title="Admin Dashboard"
        description="Monitor operasional dan tindak lanjuti pekerjaan yang membutuhkan perhatian."
        action={
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button className="min-w-0" variant="outline" nativeButton={false} render={<Link href="/admin/users" />}>
              <UserPlus size={16} aria-hidden="true" />
              Tambah User
            </Button>
            <Button className="min-w-0" nativeButton={false} render={<Link href="/admin/bills" />}>
              <FilePlus2 size={16} aria-hidden="true" />
              Buat Tagihan
            </Button>
          </div>
        }
      />

      <AdminMetrics data={data} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="pending-title">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="pending-title" className="text-sm font-semibold text-foreground">Antrean verifikasi pembayaran</h2>
                <p className="mt-1 text-xs text-muted-foreground">Pembayaran terbaru yang menunggu keputusan admin.</p>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums">{data.pendingPaymentCount}</span>
            </div>
          </div>
          <AdminRecentPayments items={data.recentPendingPayments} />
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="deadlines-title">
          <div className="border-b border-border px-4 py-3">
            <h2 id="deadlines-title" className="text-sm font-semibold text-foreground">Deadline tagihan</h2>
            <p className="mt-1 text-xs text-muted-foreground">Tagihan aktif berdasarkan jatuh tempo terdekat.</p>
          </div>
          <AdminRecentBills items={data.upcomingDueBills} />
        </section>
      </div>

      <AdminTransactionHistory groups={data.billTransactionGroups} />

      <AdminActivity items={data.recentAuditEvents} />
    </div>
  );
}
