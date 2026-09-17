"use client";

import { useState } from "react";
import { ExternalLink, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminPaymentListItem } from "@/types/payment";
import { PAYMENT_STATUS_LABELS } from "@/types/payment";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { isInstallment } from "@/lib/payments";
import { deletePaymentAction } from "@/actions/admin-payment-actions";
import { formatCurrency, formatDateMedium, formatDateTimeMedium } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: AdminPaymentListItem | null;
  onReview: (payment: AdminPaymentListItem) => void;
  onDeleted: () => void;
}

export function PaymentDetailDialog({
  open,
  onOpenChange,
  payment,
  onReview,
  onDeleted,
}: PaymentDetailDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!payment) return;
    setDeleting(true);
    const result = await deletePaymentAction(payment.id);
    setDeleting(false);
    if (result.success) {
      toast.success("Pembayaran dihapus.");
      setConfirmOpen(false);
      onOpenChange(false);
      onDeleted();
    } else {
      toast.error(result.message);
    }
  }

  const installment = payment ? isInstallment(payment.amount, payment.billAmount) : false;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>
              {payment?.userName}
              {payment?.email ? ` · ${payment.email}` : ""}
            </DialogDescription>
          </DialogHeader>

          {payment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Badge
                  variant={
                    payment.status === "verified"
                      ? "default"
                      : payment.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {PAYMENT_STATUS_LABELS[payment.status]}
                </Badge>
                {installment && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                    Cicilan
                  </span>
                )}
              </div>

              <dl className="divide-y divide-border rounded-lg border border-border">
                <Row label="Tagihan" value={payment.billTitle} />
                <Row label="Nominal tagihan" value={formatCurrency(payment.billAmount)} />
                <Row label="Nominal dibayar" value={formatCurrency(payment.amount)} strong />
                <Row label="Metode" value={PAYMENT_METHOD_LABELS[payment.paymentMethod]} />
                <Row label="Tanggal bayar" value={formatDateMedium(payment.paymentDate)} />
                <Row label="Referensi" value={payment.reference || "-"} />
                <Row label="Catatan" value={payment.notes || "-"} />
                <Row label="Dikirim" value={formatDateTimeMedium(payment.createdAt)} />
                {payment.status !== "pending" && (
                  <Row
                    label="Dikonfirmasi"
                    value={payment.reviewedAt ? formatDateTimeMedium(payment.reviewedAt) : "-"}
                  />
                )}
                {payment.status === "rejected" && payment.rejectReason && (
                  <Row label="Alasan ditolak" value={payment.rejectReason} danger />
                )}
              </dl>

              {payment.proofUrl && (
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted/50"
                >
                  <Paperclip size={15} aria-hidden="true" />
                  Lihat bukti pembayaran
                  <ExternalLink size={13} className="ml-auto text-muted-foreground" aria-hidden="true" />
                </a>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 size={15} className="mr-1.5" aria-hidden="true" />
                  Hapus
                </Button>
                {payment.status === "pending" && (
                  <Button onClick={() => onReview(payment)}>Review</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={(v) => !deleting && setConfirmOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <Trash2 className="size-4" aria-hidden="true" />
            </div>
            <AlertDialogTitle>Hapus pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembayaran {payment ? formatCurrency(payment.amount) : ""} untuk tagihan{" "}
              {payment?.billTitle ?? ""} akan dihapus permanen beserta buktinya. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Hapus Pembayaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          danger
            ? "max-w-[60%] text-right text-sm text-destructive"
            : strong
              ? "max-w-[60%] text-right text-sm font-semibold tabular-nums text-foreground"
              : "max-w-[60%] text-right text-sm text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}