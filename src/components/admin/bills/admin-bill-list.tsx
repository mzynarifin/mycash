"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminBillListItem, BillStatus } from "@/types/bill";
import { archiveBillAction, cancelBillAction, deleteBillAction } from "@/actions/admin-bill-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminBillTable } from "@/components/admin/bills/admin-bill-table";
import { CreateBillDialog, type SelectableUser } from "@/components/admin/bills/create-bill-dialog";
import { EditBillDialog } from "@/components/admin/bills/edit-bill-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props {
  bills: AdminBillListItem[];
  users: SelectableUser[];
  search: string;
  status: "all" | BillStatus;
  page: number;
  perPage: number;
  total: number;
}

type Mutation =
  | { id: string; kind: "cancel" | "archive" | "delete" }
  | { kind: "edit"; bill: AdminBillListItem }
  | null;

export function AdminBillListContainer({ bills, users, search, status, page, perPage, total }: Props) {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [target, setTarget] = useState<Mutation>(null);
  const [working, setWorking] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const activeCount = bills.filter((item) => item.bill.status === "active").length;
  const recipients = bills.reduce((sum, item) => sum + item.assignmentCount, 0);
  const outstanding = bills.reduce((sum, item) => sum + item.remaining, 0);

  function url(updates: Record<string, string>) {
    const params = new URLSearchParams(currentParams.toString());
    Object.entries(updates).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    return `/admin/bills?${params.toString()}`;
  }

  async function mutate() {
    if (!target || target.kind === "edit") return;
    const id = target.id;
    if (target.kind === "delete") {
      setWorking(true);
      const result = await deleteBillAction(id);
      setWorking(false);
      if (!result.success) return toast.error(result.message);
      toast.success("Tagihan dihapus.");
      setTarget(null);
      router.refresh();
      return;
    }
    setWorking(true);
    const result = target.kind === "archive" ? await archiveBillAction(id) : await cancelBillAction(id);
    setWorking(false);
    if (!result.success) return toast.error(result.message);
    toast.success(target.kind === "archive" ? "Tagihan diarsipkan." : "Tagihan dibatalkan.");
    setTarget(null);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <PageHeader title="Billing Management" description="Buat, distribusikan, dan pantau penyelesaian tagihan pengguna.">
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" />Buat Tagihan</Button>
      </PageHeader>

      <section className="grid divide-y divide-border rounded-lg border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Ringkasan tagihan halaman ini">
        <Metric label="Tagihan aktif" value={String(activeCount)} />
        <Metric label="Penerima" value={String(recipients)} />
        <Metric label="Belum terbayar" value={new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(outstanding)} money />
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="billing-list-heading">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="billing-list-heading" className="text-sm font-semibold text-foreground">Daftar tagihan</h2>
            <p className="text-xs text-muted-foreground">{total} tagihan ditemukan</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput defaultValue={search} placeholder="Cari judul atau referensi..." />
            <Select value={status} onValueChange={(value) => router.push(url({ status: value === "all" || value === null ? "" : value, page: "1" }))}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                <SelectItem value="archived">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <AdminBillTable
          bills={bills}
          onCancel={(id) => setTarget({ id, kind: "cancel" })}
          onArchive={(id) => setTarget({ id, kind: "archive" })}
          onEdit={(item) => setTarget({ kind: "edit", bill: item })}
          onDelete={(id) => setTarget({ id, kind: "delete" })}
        />
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Pagination tagihan">
          <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => router.push(url({ page: String(page - 1) }))}>Sebelumnya</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => router.push(url({ page: String(page + 1) }))}>Selanjutnya</Button>
          </div>
        </nav>
      )}

      <CreateBillDialog open={createOpen} onOpenChange={setCreateOpen} users={users} onCreated={() => router.refresh()} />

      {target?.kind === "edit" && (
        <EditBillDialog
          open
          onOpenChange={(open) => !open && setTarget(null)}
          bill={target.bill.bill}
          onEdited={() => router.refresh()}
        />
      )}

      <AlertDialog open={!!target && target.kind !== "edit"} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive"><Trash2 className="size-4" aria-hidden="true" /></div>
            <AlertDialogTitle>{target?.kind === "delete" ? "Hapus tagihan?" : target?.kind === "archive" ? "Arsipkan tagihan?" : "Batalkan tagihan?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.kind === "delete"
                ? "Tagihan beserta seluruh penugasan, riwayat pembayaran, dan bukti di dalamnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
                : target?.kind === "archive"
                  ? "Tagihan dipindahkan dari daftar aktif, tetapi seluruh riwayat tetap tersimpan."
                  : "Pengguna tidak dapat lagi melakukan pembayaran pada tagihan ini."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={mutate}
              disabled={working}
              className={target?.kind === "delete" ? "bg-destructive hover:bg-destructive/90" : undefined}
            >
              {working
                ? "Memproses..."
                : target?.kind === "delete"
                  ? "Hapus Tagihan"
                  : target?.kind === "archive"
                    ? "Arsipkan"
                    : "Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Metric({ label, value, money }: { label: string; value: string; money?: boolean }) {
  return <div className="px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className={money ? "mt-1 text-base font-semibold tabular-nums text-foreground" : "mt-1 text-xl font-semibold tabular-nums text-foreground"}>{value}</p></div>;
}
