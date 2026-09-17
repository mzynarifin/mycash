"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setUserStatusAction, deleteUserAction } from "@/actions/admin-user-actions";
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

interface ConfirmUserDialogProps {
  open: boolean;
  userId: string;
  userName?: string;
  action: "suspend" | "reactivate" | "delete";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmUserDialog({
  open,
  userId,
  userName,
  action,
  onOpenChange,
  onConfirm,
}: ConfirmUserDialogProps) {
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    const result =
      action === "delete"
        ? await deleteUserAction(userId)
        : await setUserStatusAction({ userId, action });
    setSaving(false);

    if (result.success) {
      toast.success(
        action === "delete"
          ? "User berhasil dihapus."
          : action === "suspend"
            ? "User berhasil disuspend."
            : "User berhasil diaktifkan."
      );
      onConfirm();
    } else {
      toast.error(result.message);
    }
  }

  const destructive = action !== "reactivate";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === "delete"
              ? "Hapus User?"
              : action === "suspend"
                ? "Suspend User?"
                : "Aktifkan User?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === "delete"
              ? `"${userName ?? "User"}" beserta seluruh akunnya akan dihapus permanen. User dengan riwayat pembayaran tidak dapat dihapus.`
              : action === "suspend"
                ? "User tidak akan bisa login hingga diaktifkan kembali."
                : "User akan dapat login dan menggunakan aplikasi kembali."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={saving}
            className={destructive ? "bg-destructive hover:bg-destructive/90" : undefined}
          >
            {saving
              ? "Memproses..."
              : action === "delete"
                ? "Hapus User"
                : action === "suspend"
                  ? "Suspend"
                  : "Aktifkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}