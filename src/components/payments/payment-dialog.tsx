"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/payments/payment-form";
import type { PaymentFormValues } from "@/lib/validations/payment";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billTitle: string;
  remaining: number;
  onSubmit: (values: PaymentFormValues) => void | Promise<void>;
  loading?: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  billTitle,
  remaining,
  onSubmit,
  loading,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim Pembayaran</DialogTitle>
          <DialogDescription>{billTitle}</DialogDescription>
        </DialogHeader>
        <PaymentForm amount={remaining} onSubmit={onSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}