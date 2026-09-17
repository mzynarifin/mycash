"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { updateBillSchema, type UpdateBillFormValues } from "@/lib/validations/billing";
import { updateBillAction } from "@/actions/admin-bill-actions";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Bill } from "@/types/bill";

interface EditBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill;
  onEdited: () => void;
}

export function EditBillDialog({ open, onOpenChange, bill, onEdited }: EditBillDialogProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateBillFormValues>({
    resolver: zodResolver(updateBillSchema),
    defaultValues: {
      id: bill.id,
      title: bill.title,
      description: bill.description,
      category: bill.category,
      notes: bill.notes ?? "",
      reference: bill.reference ?? "",
      amount: String(bill.amount),
      issueDate: bill.issueDate,
      dueDate: bill.dueDate,
      audience: bill.audience,
    },
  });

  const issueDate = watch("issueDate");
  const dueDate = watch("dueDate");

  async function onSubmit(values: UpdateBillFormValues) {
    setSaving(true);
    const result = await updateBillAction(values);
    setSaving(false);
    if (result.success) {
      toast.success("Tagihan diperbarui.");
      onOpenChange(false);
      onEdited();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Tagihan</DialogTitle>
          <DialogDescription>{bill.title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Judul *</Label>
            <Input id="edit-title" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">Kategori *</Label>
              <Input id="edit-category" {...register("category")} />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Catatan</Label>
              <Input id="edit-notes" {...register("notes")} />
              {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Deskripsi</Label>
            <Textarea id="edit-desc" rows={2} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-ref">Referensi</Label>
            <Input id="edit-ref" {...register("reference")} />
            {errors.reference && (
              <p className="text-xs text-destructive">{errors.reference.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-amount">Total Nominal *</Label>
            <Input id="edit-amount" inputMode="numeric" {...register("amount")} />
            <p className="text-xs text-muted-foreground">Dibagi rata ke tiap user yang ditugaskan.</p>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tanggal Terbit *</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal",
                    !issueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon size={16} className="mr-2 text-muted-foreground" aria-hidden="true" />
                  {issueDate ? format(new Date(issueDate), "d MMMM yyyy") : "Pilih tanggal"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={issueDate ? new Date(issueDate) : undefined}
                    onSelect={(date) => {
                      if (date) setValue("issueDate", format(date, "yyyy-MM-dd"));
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.issueDate && (
                <p className="text-xs text-destructive">{errors.issueDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Jatuh Tempo *</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon size={16} className="mr-2 text-muted-foreground" aria-hidden="true" />
                  {dueDate ? format(new Date(dueDate), "d MMMM yyyy") : "Pilih tanggal"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) setValue("dueDate", format(date, "yyyy-MM-dd"));
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-xs text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Target Penerima</Label>
            <Select
              value={watch("audience")}
              onValueChange={(value) =>
                value && setValue("audience", value as "selected" | "all", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full" aria-label="Target penerima">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selected">User terpilih saja</SelectItem>
                <SelectItem value="all">Semua user (termasuk pendaftar baru)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pilih <span className="font-medium text-foreground">Semua user</span> agar tagihan otomatis
              muncul untuk user yang mendaftar setelah ini.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
