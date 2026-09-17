"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Ban, ChevronRight, ReceiptText, Archive, Pencil, Trash2 } from "lucide-react";
import type { AdminBillListItem } from "@/types/bill";
import { BILL_STATUS_LABELS } from "@/types/bill";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface AdminBillTableProps {
  bills: AdminBillListItem[];
  onCancel: (billId: string) => void;
  onArchive: (billId: string) => void;
  onEdit: (bill: AdminBillListItem) => void;
  onDelete: (billId: string) => void;
}

export function AdminBillTable({ bills, onCancel, onArchive, onEdit, onDelete }: AdminBillTableProps) {
  if (bills.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="Belum ada tagihan."
        description="Buat tagihan baru dan tugaskan kepada pengguna."
        framed={false}
      />
    );
  }

  return (
    <>
      <table className="hidden w-full md:table" aria-label="Daftar tagihan">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3 text-left">Judul</th>
            <th className="px-4 py-3 text-left">Nominal</th>
            <th className="px-4 py-3 text-left">Terbayar</th>
            <th className="px-4 py-3 text-left">Jatuh Tempo</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">User</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bills.map((item) => (
            <tr key={item.bill.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-foreground">
                <Link href={`/admin/bills/${item.bill.id}`} className="transition-colors hover:text-primary">{item.bill.title}</Link>
                <p className="mt-0.5 text-xs font-normal text-muted-foreground">{item.bill.category}</p>
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(item.bill.amount)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                {formatCurrency(item.verifiedTotal)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDateMedium(item.bill.dueDate)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={item.bill.status === "active" ? "default" : "secondary"} className="h-4 text-[10px]">
                  {BILL_STATUS_LABELS[item.bill.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                {item.assignmentCount}
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-8 w-8"
                    )}
                  >
                    <MoreHorizontal size={15} aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={`/admin/bills/${item.bill.id}`} />}>
                      <Eye size={15} className="mr-2" aria-hidden="true" />
                      Detail
                    </DropdownMenuItem>
                    {item.bill.status === "active" && (
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil size={15} className="mr-2" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {item.bill.status === "active" && (
                      <DropdownMenuItem onClick={() => onArchive(item.bill.id)}>
                        <Archive size={15} className="mr-2" aria-hidden="true" />
                        Arsipkan
                      </DropdownMenuItem>
                    )}
                    {item.bill.status === "active" && (
                      <DropdownMenuItem
                        onClick={() => onCancel(item.bill.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Ban size={15} className="mr-2" aria-hidden="true" />
                        Batalkan
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(item.bill.id)}
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

      <ul className="md:hidden divide-y divide-border">
        {bills.map((item) => (
          <li key={item.bill.id} className="px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{item.bill.title}</p>
                  <Badge variant={item.bill.status === "active" ? "default" : "secondary"} className="h-4 text-[10px]">
                    {BILL_STATUS_LABELS[item.bill.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.bill.category} · Jatuh tempo {formatDateMedium(item.bill.dueDate)} · {item.assignmentCount} user
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                {formatCurrency(item.bill.amount)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <Link
                href={`/admin/bills/${item.bill.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Detail
                <ChevronRight size={14} className="ml-1" aria-hidden="true" />
              </Link>
              {item.bill.status === "active" && (
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Pencil size={14} className="mr-1" aria-hidden="true" />
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(item.bill.id)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-destructive hover:text-destructive")}
              >
                <Trash2 size={14} className="mr-1" aria-hidden="true" />
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
