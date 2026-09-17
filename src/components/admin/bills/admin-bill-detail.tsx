"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Ban,
  Pencil,
  UserPlus,
  CircleCheck,
  Clock,
  ArrowLeft,
} from "lucide-react";
import type { AdminBillDetail } from "@/types/bill";
import { BILL_STATUS_LABELS } from "@/types/bill";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssignBillDialog } from "@/components/admin/bills/assign-bill-dialog";
import { EditBillDialog } from "@/components/admin/bills/edit-bill-dialog";
import { cancelBillAction } from "@/actions/admin-bill-actions";
import type { SelectableUser } from "@/components/admin/bills/create-bill-dialog";

interface AdminBillDetailClientProps {
  bill: AdminBillDetail;
  users: SelectableUser[];
}

export function AdminBillDetailClient({ bill, users }: AdminBillDetailClientProps) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isActive = bill.bill.status === "active";
  const progress = bill.bill.amount > 0
    ? Math.min(100, Math.round((bill.verifiedTotal / bill.bill.amount) * 100))
    : 0;

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelBillAction(bill.bill.id);
    setCancelling(false);
    if (result.success) {
      toast.success("Tagihan dibatalkan.");
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bills"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} aria-hidden="true" /> Kembali ke Bills
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{bill.bill.title}</h2>
                  <Badge variant={isActive ? "default" : "secondary"} className="h-4 text-[10px]">
                    {BILL_STATUS_LABELS[bill.bill.status]}
                  </Badge>
                </div>
                {bill.bill.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{bill.bill.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil size={14} className="mr-1.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                    <UserPlus size={14} className="mr-1.5" aria-hidden="true" />
                    Assign
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)}>
                    <Ban size={14} className="mr-1.5" aria-hidden="true" />
                    Batalkan
                  </Button>
                </>
              )}
            </div>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Amount</dt>
              <dd className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">
                {formatCurrency(bill.bill.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Terbayar</dt>
              <dd className="mt-0.5 text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(bill.verifiedTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Belum dibayar</dt>
              <dd className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">
                {formatCurrency(bill.remaining)}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Kategori</dt>
              <dd className="mt-0.5 font-medium text-foreground">{bill.bill.category}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Referensi</dt>
              <dd className="mt-0.5 font-medium text-foreground">{bill.bill.reference ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Terbit</dt>
              <dd className="mt-0.5 font-medium text-foreground">{formatDateMedium(bill.bill.issueDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Jatuh Tempo</dt>
              <dd className="mt-0.5 font-medium text-foreground">{formatDateMedium(bill.bill.dueDate)}</dd>
            </div>
          </dl>
          {bill.bill.notes && <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">{bill.bill.notes}</p>}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Statistik</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">User ditugaskan</dt>
              <dd className="font-semibold text-foreground tabular-nums">{bill.assignments.length}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">Progres</dt>
              <dd className="font-semibold text-foreground tabular-nums">{progress}%</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <h3 className="text-sm font-semibold text-foreground px-4 pt-4 pb-2">
          Assignment ({bill.assignments.length})
        </h3>
        <ul className="divide-y divide-border">
          {bill.assignments.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground text-center">
              Belum ada user yang ditugaskan.
            </li>
          ) : (
            bill.assignments.map((a) => {
              const pct = a.amount > 0
                ? Math.min(100, Math.round((a.verifiedTotal / a.amount) * 100))
                : 0;
              const complete = a.remaining <= 0;
              return (
                <li key={a.assignmentId} className="flex items-center gap-3 px-4 py-3.5">
                  {complete ? (
                    <CircleCheck size={18} className="shrink-0 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Clock size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground truncate">{a.userName}</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                        {formatCurrency(a.verifiedTotal)} / {formatCurrency(a.amount)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{pct}%</span>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <AssignBillDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        billId={bill.bill.id}
        users={users}
        assignedIds={bill.assignments.map((a) => a.userId)}
        onAssigned={() => router.refresh()}
      />

      <EditBillDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        bill={bill.bill}
        onEdited={() => router.refresh()}
      />

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open) setCancelOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Tagihan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tagihan tidak akan bisa dibayar lagi oleh pengguna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelling ? "Memproses..." : "Batalkan Tagihan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
