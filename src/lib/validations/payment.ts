import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/payment-methods";

export const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, "Jumlah wajib diisi")
    .refine((v) => Number(v.replace(/\D/g, "")) > 0, {
      message: "Jumlah harus lebih dari 0",
    }),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    message: "Metode pembayaran tidak valid",
  }),
  paymentDate: z.string().min(1, "Tanggal wajib diisi"),
  reference: z.string().trim().max(120, "Referensi terlalu panjang").optional().or(z.literal("")),
  notes: z.string().max(500, "Catatan terlalu panjang").optional().or(z.literal("")),
  proofObject: z.string().trim().max(200, "Bukti tidak valid").optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
