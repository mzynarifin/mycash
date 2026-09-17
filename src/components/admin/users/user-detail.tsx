"use client";

import type { AdminUserDetail } from "@/lib/queries/admin-users";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";

export function AdminUserDetailClient({ user }: { user: AdminUserDetail }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground mb-4">Profil</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Nama</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">
              {user.email ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <Badge variant={user.suspended ? "destructive" : "secondary"} className="h-4 text-[10px]">
                {user.suspended ? "Suspended" : "Active"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="mt-1">
              <Badge variant="secondary" className="h-4 text-[10px]">
                {user.role === "admin" ? "Admin" : "User"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bergabung</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">
              {formatDateMedium(user.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Currency</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">{user.currency}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 lg:col-span-1">
        <h3 className="text-sm font-semibold text-foreground mb-4">Statistik</h3>
        <dl className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">Assignment Tagihan</dt>
            <dd className="text-sm font-semibold text-foreground tabular-nums">
              {user.assignmentCount}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">Total Pengeluaran</dt>
            <dd className="text-sm font-semibold text-foreground tabular-nums">
              {user.expenseCount}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">Pembayaran Verified</dt>
            <dd className="text-sm font-semibold text-foreground tabular-nums">
              {formatCurrency(user.verifiedPaymentTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">Pending Review</dt>
            <dd className="text-sm font-semibold text-foreground tabular-nums">
              {user.pendingPaymentCount}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}