"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { createBillAction } from "@/actions/admin-bill-actions";
import { createBillSchema, type CreateBillFormValues } from "@/lib/validations/billing";
import { BILL_CATEGORIES } from "@/types/bill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BillUserPicker, type SelectableUser } from "@/components/admin/bills/bill-user-picker";

export type { SelectableUser } from "@/components/admin/bills/bill-user-picker";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; users: SelectableUser[]; onCreated: () => void; }

export function CreateBillDialog({ open, onOpenChange, users, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [userTouched, setUserTouched] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateBillFormValues>({
    resolver: zodResolver(createBillSchema),
    mode: "onBlur",
    defaultValues: { title: "", description: "", category: "Lainnya", notes: "", reference: "", amount: "", issueDate: format(new Date(), "yyyy-MM-dd"), dueDate: "", userIds: [], assignmentMode: "all" },
  });
  const mode = watch("assignmentMode");
  const selectedIds = watch("userIds");
  const needsSelection = mode !== "all";
  const userError = needsSelection && selectedIds.length === 0
    ? "Pilih minimal satu user."
    : undefined;

  function close(value: boolean) {
    if (!value) { reset(); setUserSearch(""); setUserTouched(false); }
    onOpenChange(value);
  }

  async function onSubmit(values: CreateBillFormValues) {
    if (needsSelection && values.userIds.length === 0) {
      setUserTouched(true);
      return;
    }
    setSaving(true);
    const result = await createBillAction(values);
    setSaving(false);
    if (!result.success) return toast.error(result.message);
    toast.success(`Tagihan berhasil dibuat${values.assignmentMode === "all" ? ` untuk ${users.length} user aktif` : ` untuk ${values.userIds.length} user`}.`);
    close(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Tagihan</DialogTitle>
          <DialogDescription>Tagihan akan langsung tersedia di akun pengguna yang dipilih.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold text-foreground">Informasi tagihan</legend>
            <Field label="Judul Tagihan" error={errors.title?.message} className="sm:col-span-2">
              <Input id="bill-title" placeholder="Contoh: Iuran September" aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <Field label="Kategori" error={errors.category?.message}>
              <Select value={watch("category")} onValueChange={(value) => value && setValue("category", value, { shouldValidate: true })}>
                <SelectTrigger className="w-full" aria-label="Kategori"><SelectValue /></SelectTrigger>
                <SelectContent>{BILL_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Nominal" error={errors.amount?.message}>
              <Input id="bill-amount" inputMode="numeric" placeholder="500.000" aria-invalid={!!errors.amount} {...register("amount")} />
            </Field>
            <Field label="Deskripsi" optional error={errors.description?.message} className="sm:col-span-2">
              <Textarea id="bill-description" rows={2} placeholder="Ringkasan tagihan" {...register("description")} />
            </Field>
            <Field label="Referensi" optional error={errors.reference?.message}>
              <Input id="bill-reference" placeholder="INV-2026-001" {...register("reference")} />
            </Field>
            <Field label="Catatan" optional error={errors.notes?.message}>
              <Input id="bill-notes" placeholder="Catatan internal atau instruksi" {...register("notes")} />
            </Field>
          </fieldset>
          <fieldset className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold text-foreground">Jadwal</legend>
            <Field label="Tanggal Terbit" error={errors.issueDate?.message}><Input id="bill-issue-date" type="date" {...register("issueDate")} /></Field>
            <Field label="Tanggal Jatuh Tempo" error={errors.dueDate?.message}><Input id="bill-due-date" type="date" {...register("dueDate")} /></Field>
          </fieldset>
          <fieldset className="space-y-3 border-t border-border pt-5">
            <legend className="mb-3 text-sm font-semibold text-foreground">Target user</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Mode target user">
              {([["single","Satu User"],["multiple","Beberapa User"],["all","Semua User"]] as const).map(([value, label]) => (
                <Button key={value} type="button" variant={mode === value ? "default" : "outline"} className="h-auto min-h-11 whitespace-normal px-2 py-2 text-xs sm:text-sm" onClick={() => { setValue("assignmentMode", value); setValue("userIds", []); }} aria-pressed={mode === value}>{label}</Button>
              ))}
            </div>
            {mode === "all" ? (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-3 text-sm"><span className="font-medium text-foreground">Dikirim ke {users.length} user aktif</span><span className="block text-xs text-muted-foreground">Tagihan otomatis masuk ke semua user yang aktif dan tidak ditangguhkan.</span></div>
            ) : (
              <>
                <BillUserPicker users={users} selectedIds={selectedIds} onChange={(ids) => { setValue("userIds", ids, { shouldValidate: true }); setUserTouched(true); }} multiple={mode === "multiple"} search={userSearch} onSearchChange={setUserSearch} />
                {(userError && userTouched) && <p className="text-xs text-destructive">{userError}</p>}
              </>
            )}
            {errors.userIds && <p className="text-xs text-destructive">{errors.userIds.message}</p>}
          </fieldset>
          <div className="sticky -bottom-6 -mx-6 flex justify-end gap-2 border-t border-border bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={saving}>Batal</Button>
            <Button type="submit" disabled={saving || users.length === 0}>{saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}{saving ? "Menyimpan..." : "Simpan Tagihan"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, optional, className, children }: { label: string; error?: string; optional?: boolean; className?: string; children: ReactNode }) {
  return <div className={className}><Label className="mb-1.5 block">{label}{optional ? <span className="ml-1 font-normal text-muted-foreground">(opsional)</span> : " *"}</Label>{children}{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>;
}
