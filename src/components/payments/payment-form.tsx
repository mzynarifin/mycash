"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, LoaderCircle, QrCode, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { paymentSchema, type PaymentFormValues } from "@/lib/validations/payment";
import { createProofUploadAction } from "@/actions/proof-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency, formatAmountInput } from "@/lib/formatters";

interface PaymentFormProps {
  amount?: number;
  onSubmit: (values: PaymentFormValues) => void | Promise<void>;
  loading?: boolean;
}

function QrisDisplay() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-square w-full max-w-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 text-center">
        <ImageIcon className="size-8 text-muted-foreground/60" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Kode QRIS belum tersedia</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Silakan hubungi administrator jika kode belum tampil.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full max-w-[260px]">
      <img
        src="/qris.jpg"
        alt="QRIS — pindai dengan aplikasi pembayaran"
        width={260}
        height={260}
        className="h-full w-full rounded-xl border border-border bg-white object-contain p-3"
        onError={() => setFailed(true)}
        loading="lazy"
      />
      <span className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background px-2.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-muted-foreground">
        QRIS
      </span>
    </div>
  );
}

export function PaymentForm({ amount, onSubmit, loading }: PaymentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: amount ? formatAmountInput(amount) : "",
      paymentMethod: "qris",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      reference: "",
      notes: "",
      proofObject: "",
    },
  });

  const amountField = register("amount");
  const selectedDate = watch("paymentDate");
  const busy = loading || uploading;

  function pickFile(file: File | null) {
    setProofError(null);
    if (!file) {
      setProofFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofError("Ukuran maksimal 5 MB.");
      return;
    }
    setProofFile(file);
  }

  async function uploadProof(): Promise<string> {
    if (!proofFile) return "";
    const ticket = await createProofUploadAction({
      fileName: proofFile.name,
      contentType: proofFile.type,
      size: proofFile.size,
    });
    if (!ticket.success) throw new Error(ticket.message);

    const res = await fetch(ticket.ticket.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": proofFile.type || "application/octet-stream" },
      body: proofFile,
    });
    if (!res.ok) throw new Error("Gagal mengunggah bukti.");
    return ticket.ticket.path;
  }

  async function submit(values: PaymentFormValues) {
    let proofObject = "";
    if (proofFile) {
      setUploading(true);
      try {
        proofObject = await uploadProof();
      } catch (error) {
        setUploading(false);
        toast.error(error instanceof Error ? error.message : "Gagal mengunggah bukti.");
        return;
      }
      setUploading(false);
    }
    await onSubmit({ ...values, proofObject });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pay-amount">Nominal Pembayaran *</Label>
        <Input
          id="pay-amount"
          type="text"
          inputMode="numeric"
          placeholder="100.000"
          aria-invalid={!!errors.amount}
          {...amountField}
          onChange={(event) => {
            event.target.value = formatAmountInput(event.target.value);
            amountField.onChange(event);
          }}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Bisa dibayar penuh atau dicicil sesuai kemampuan Anda (maksimal sisa tagihan).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pay-reference">Referensi Pembayaran</Label>
        <Input id="pay-reference" placeholder="Nomor transfer atau referensi" {...register("reference")} />
        {errors.reference && <p className="text-xs text-destructive">{errors.reference.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Tanggal Pembayaran *</Label>
        <Popover>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            aria-invalid={!!errors.paymentDate}
          >
            <CalendarIcon size={16} className="mr-2 text-muted-foreground" aria-hidden="true" />
            {selectedDate ? format(new Date(selectedDate), "d MMMM yyyy") : "Pilih tanggal"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(date) => {
                if (date) setValue("paymentDate", format(date, "yyyy-MM-dd"));
              }}
            />
          </PopoverContent>
        </Popover>
        {errors.paymentDate && (
          <p className="text-xs text-destructive">{errors.paymentDate.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium leading-none text-foreground">
          Metode Pembayaran
        </span>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <QrCode className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">QRIS</span>
          <span className="ml-auto text-xs text-muted-foreground">
            Pindai kode di bawah ini
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Kode QRIS</Label>
        <div className="flex justify-center rounded-xl border border-border bg-muted/20 p-4">
          <QrisDisplay />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Buka aplikasi pembayaran (m-Banking / e-wallet), pilih{" "}
          <span className="font-medium text-foreground">QRIS</span>, lalu pindai kode di atas
          dan bayar sesuai nominal.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pay-proof">Bukti Transaksi</Label>
        <input
          ref={fileInputRef}
          id="pay-proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
        />
        {proofFile ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{proofFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(proofFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Hapus bukti"
              onClick={() => {
                setProofFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X size={15} aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-muted/40 hover:text-foreground"
          >
            <Upload size={15} aria-hidden="true" />
            Unggah screenshot / bukti pembayaran
          </button>
        )}
        {proofError && <p className="text-xs text-destructive">{proofError}</p>}
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WEBP, atau PDF maksimal 5 MB (opsional, mempercepat verifikasi).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pay-notes">Catatan</Label>
        <Textarea
          id="pay-notes"
          placeholder="Catatan tambahan (opsional)"
          rows={3}
          {...register("notes")}
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
        {amount
          ? `Sisa tagihan saat ini: ${formatCurrency(amount)}`
          : "Pastikan nominal sesuai dengan tagihan yang dibayar."}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={busy}>
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {uploading ? "Mengunggah bukti..." : loading ? "Mengirim..." : "Kirim Pembayaran"}
        </Button>
      </div>
    </form>
  );
}