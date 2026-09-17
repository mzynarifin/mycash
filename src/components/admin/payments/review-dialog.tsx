"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { reviewPaymentAction } from "@/actions/admin-payment-actions";
import { isInstallment, getProofUrl } from "@/lib/payments";
import { formatCurrency, formatDateMedium } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AdminPaymentListItem } from "@/types/payment";

const reviewFormSchema = z
  .object({
    decision: z.enum(["verified", "rejected"], { message: "Keputusan tidak valid" }),
    rejectReason: z.string().optional(),
  })
  .refine((d) => (d.decision === "rejected" ? (d.rejectReason?.trim().length ?? 0) > 0 : true), {
    message: "Alasan penolakan wajib diisi",
    path: ["rejectReason"],
  });

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: AdminPaymentListItem | null;
  onReviewed: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  payment,
  onReviewed,
}: ReviewDialogProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      decision: "verified",
      rejectReason: "",
    },
  });

  const decision = watch("decision");

  async function onSubmit(values: ReviewFormValues) {
    if (!payment) return;
    setSaving(true);
    const result = await reviewPaymentAction({
      paymentId: payment.id,
      decision: values.decision,
      rejectReason: values.rejectReason,
    });
    setSaving(false);
    if (result.success) {
      toast.success(
        values.decision === "verified"
          ? "Pembayaran diverifikasi."
          : "Pembayaran ditolak."
      );
      reset();
      onOpenChange(false);
      onReviewed();
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
          <DialogTitle>Review Pembayaran</DialogTitle>
          <DialogDescription>
            {payment?.userName} — {payment?.billTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {payment && (
            <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Nominal dibayar</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Nominal tagihan</span>
                <span className="text-sm tabular-nums text-foreground">
                  {formatCurrency(payment.billAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Tanggal bayar</span>
                <span className="text-sm text-foreground">{formatDateMedium(payment.paymentDate)}</span>
              </div>
              {isInstallment(payment.amount, payment.billAmount) && (
                <div className="flex items-center gap-2 border-t border-border pt-2.5">
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                    Cicilan
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Pembayaran sebagian, bukan pelunasan penuh
                  </span>
                </div>
              )}
              {getProofUrl(payment.proofObject) && (
                <a
                  href={getProofUrl(payment.proofObject)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  Lihat bukti pembayaran
                </a>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Keputusan *</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted">
                <input
                  type="radio"
                  value="verified"
                  checked={decision === "verified"}
                  {...register("decision")}
                  className="h-4 w-4"
                />
                Verifikasi
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted">
                <input
                  type="radio"
                  value="rejected"
                  checked={decision === "rejected"}
                  {...register("decision")}
                  className="h-4 w-4"
                />
                Tolak
              </label>
            </div>
          </div>

          {decision === "rejected" && (
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Alasan Penolakan *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Tuliskan alasan penolakan..."
                rows={3}
                aria-invalid={!!errors.rejectReason}
                {...register("rejectReason")}
              />
              {errors.rejectReason && (
                <p className="text-xs text-destructive">{errors.rejectReason.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              variant={decision === "rejected" ? "destructive" : "default"}
            >
              {saving
                ? "Memproses..."
                : decision === "verified"
                ? "Verifikasi"
                : "Tolak"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}