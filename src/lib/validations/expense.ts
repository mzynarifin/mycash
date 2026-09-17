import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/payment-methods";

export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, "Jumlah wajib diisi")
    .refine((v) => Number(v.replace(/\D/g, "")) > 0, {
      message: "Jumlah harus lebih dari 0",
    }),
  description: z
    .string()
    .min(1, "Deskripsi wajib diisi")
    .max(120, "Deskripsi terlalu panjang"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  expenseDate: z.string().min(1, "Tanggal wajib diisi"),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    message: "Metode pembayaran tidak valid",
  }),
  notes: z.string().max(500, "Catatan terlalu panjang").optional().or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;