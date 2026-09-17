"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { AdminUserListItem } from "@/lib/queries/admin-users";
import type { AdminUserStatusFilter } from "@/lib/validations/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserTable } from "@/components/admin/users/user-table";
import { CreateUserDialog } from "@/components/admin/users/create-user-dialog";
import { ConfirmUserDialog } from "@/components/admin/users/confirm-status-dialog";

interface AdminUserListContainerProps {
  users: AdminUserListItem[];
  search: string;
  status: "all" | AdminUserStatusFilter;
  page: number;
  perPage: number;
  total: number;
}

export function AdminUserListContainer({
  users,
  search,
  status,
  page,
  perPage,
  total,
}: AdminUserListContainerProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    userId: string;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function buildUrl(updates: Partial<Record<string, string>>) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    if (page > 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return `/admin/users?${params.toString()}`;
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <PageHeader
        title="User"
        description="Kelola akun pengguna dan status akses."
      >
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          aria-label="Tambah user"
        >
          <UserPlus size={16} className="mr-1.5" aria-hidden="true" />
          Tambah User
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <SearchInput defaultValue={search} placeholder="Cari nama atau NIM..." />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={status}
            onValueChange={(v) => {
              const next = v === null ? "all" : v;
              router.push(buildUrl({ status: next === "all" ? "" : next, page: "1" }));
            }}
          >
            <SelectTrigger className="w-[140px]" aria-label="Filter status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="suspended">Ditangguhkan</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground tabular-nums hidden sm:block">
            {total} user
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <UserTable
          users={users}
          onStatusChange={(userId, action) => setStatusTarget({ userId, action })}
          onEdit={(user) => setEditTarget(user)}
          onDelete={(user) => setDeleteTarget(user)}
        />
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <p className="text-xs text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => router.push(buildUrl({ page: String(page - 1) }))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => router.push(buildUrl({ page: String(page + 1) }))}
            >
              Selanjutnya
            </Button>
          </div>
        </nav>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => router.refresh()}
      />

      {editTarget && (
        <CreateUserDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          user={editTarget}
          onUpdated={() => router.refresh()}
        />
      )}

      {statusTarget && (
        <ConfirmUserDialog
          open={!!statusTarget}
          userId={statusTarget.userId}
          action={statusTarget.action}
          onOpenChange={(open) => {
            if (!open) setStatusTarget(null);
          }}
          onConfirm={() => {
            setStatusTarget(null);
            router.refresh();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmUserDialog
          open={!!deleteTarget}
          userId={deleteTarget.id}
          userName={deleteTarget.name}
          action="delete"
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={() => {
            setDeleteTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
