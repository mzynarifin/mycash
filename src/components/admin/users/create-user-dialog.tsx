"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  type AdminCreateUserFormValues,
  type AdminUpdateUserFormValues,
} from "@/lib/validations/admin";
import { createUserAction, updateUserAction } from "@/actions/admin-user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { UserRole } from "@/types/user";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  onUpdated?: () => void;
  user?: {
    id: string;
    name: string;
    email: string | null;
    nim: string | null;
    role: UserRole;
    suspended: boolean;
    createdAt: string;
  } | null;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
  onUpdated,
  user,
}: CreateUserDialogProps) {
  const [saving, setSaving] = useState(false);
  const isEdit = !!user;

  type UserFormValues = {
    userId?: string;
    name: string;
    nim: string;
    password?: string;
    confirmPassword?: string;
    status: "active" | "suspended";
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(
      (isEdit ? adminUpdateUserSchema : adminCreateUserSchema) as never
    ) as never,
    defaultValues: isEdit
      ? { userId: user?.id ?? "", name: user?.name ?? "", nim: user?.nim ?? "", password: "", status: user?.suspended ? "suspended" : "active" }
      : { name: "", nim: "", password: "", confirmPassword: "", status: "active" },
  });

  async function onSubmit(values: UserFormValues) {
    setSaving(true);
    const result = isEdit
      ? await updateUserAction({ userId: values.userId!, name: values.name, nim: values.nim, password: values.password ?? "", status: values.status })
      : await createUserAction({ name: values.name, nim: values.nim, password: values.password!, confirmPassword: values.confirmPassword!, status: values.status });
    setSaving(false);
    if (result.success) {
      toast.success(isEdit ? "User berhasil diperbarui." : "User berhasil dibuat.");
      reset();
      onOpenChange(false);
      isEdit ? onUpdated?.() : onCreated?.();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Buat User Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui data akun pengguna." : "Buat akun untuk pengguna baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Nama *</Label>
            <Input
              id="user-name"
              placeholder="John Doe"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-nim">NIM *</Label>
            <Input
              id="user-nim"
              inputMode="numeric"
              placeholder="221011400123"
              {...register("nim")}
            />
            {errors.nim && (
              <p className="text-xs text-destructive">{errors.nim.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">
              Kata Sandi {isEdit ? "(kosongkan jika tidak diubah)" : "*"}
            </Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              placeholder={isEdit ? "Minimal 8 karakter" : "Minimal 8 karakter"}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="user-confirm-password">Konfirmasi Password *</Label>
              <Input id="user-confirm-password" type="password" autoComplete="new-password" placeholder="Ulangi password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="user-status">Status Akun *</Label>
            <select id="user-status" className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9" {...register("status")}>
              <option value="active">Aktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (isEdit ? "Menyimpan..." : "Membuat...") : isEdit ? "Simpan" : "Buat User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
