import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama kategori wajib diisi")
    .max(40, "Nama terlalu panjang"),
  icon: z.string().min(1, "Icon wajib dipilih"),
  color: z
    .string()
    .min(1, "Warna wajib dipilih")
    .regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;