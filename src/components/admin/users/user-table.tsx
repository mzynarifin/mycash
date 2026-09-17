"use client";

import { MoreHorizontal, UserCheck, UserX, Users, Trash2, Pencil } from "lucide-react";
import type { AdminUserListItem } from "@/lib/queries/admin-users";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateMedium } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface UserTableProps {
  users: AdminUserListItem[];
  onStatusChange: (userId: string, action: "suspend" | "reactivate") => void;
  onEdit: (user: AdminUserListItem) => void;
  onDelete: (user: AdminUserListItem) => void;
}

export function UserTable({ users, onStatusChange, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Belum ada user."
        description="Tambahkan user pertama untuk mulai membuat tagihan."
        framed={false}
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <table className="hidden w-full md:table" aria-label="Daftar user">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3 text-left">Nama</th>
            <th className="px-4 py-3 text-left">NIM</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Bergabung</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-foreground">
                {user.name}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {user.nim ?? "-"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={user.suspended ? "destructive" : "secondary"}
                  className="h-4 text-[10px]"
                >
                  {user.suspended ? "Ditangguhkan" : "Aktif"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary" className="h-4 text-[10px]">
                  {user.role === "admin" ? "Admin" : "User"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {formatDateMedium(user.createdAt)}
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-8 w-8"
                    )}
                    aria-label={`Opsi untuk ${user.name}`}
                  >
                    <MoreHorizontal size={15} aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Pencil size={15} className="mr-2" aria-hidden="true" />
                      Edit
                    </DropdownMenuItem>
                    {!user.suspended && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(user.id, "suspend")}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserX size={15} className="mr-2" aria-hidden="true" />
                        Tangguhkan
                      </DropdownMenuItem>
                    )}
                    {user.suspended && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(user.id, "reactivate")}
                      >
                        <UserCheck size={15} className="mr-2" aria-hidden="true" />
                        Aktifkan kembali
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(user)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={15} className="mr-2" aria-hidden="true" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile list */}
      <ul className="md:hidden divide-y divide-border">
        {users.map((user) => (
          <li key={user.id} className="px-4 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <Badge
                  variant={user.suspended ? "destructive" : "secondary"}
                  className="h-4 text-[10px]"
                >
                  {user.suspended ? "Ditangguhkan" : "Aktif"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                NIM {user.nim ?? "-"} · {formatDateMedium(user.createdAt)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-8 w-8 shrink-0"
                )}
              >
                <MoreHorizontal size={15} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  Edit
                </DropdownMenuItem>
                {!user.suspended && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(user.id, "suspend")}
                    className="text-destructive focus:text-destructive"
                  >
                    Tangguhkan
                  </DropdownMenuItem>
                )}
                {user.suspended && (
                  <DropdownMenuItem onClick={() => onStatusChange(user.id, "reactivate")}>
                    Aktifkan kembali
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-destructive focus:text-destructive"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
    </>
  );
}
