import { z } from "zod";

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(60, "Nama terlalu panjang"),
  nim: z.string().trim().min(1, "NIM wajib diisi").max(30, "NIM terlalu panjang").regex(/^\d+$/, "NIM hanya boleh berisi angka"),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(72, "Kata sandi terlalu panjang"),
  confirmPassword: z.string(),
  status: z.enum(["active", "suspended"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak sama",
  path: ["confirmPassword"],
});

export type AdminCreateUserFormValues = z.infer<typeof adminCreateUserSchema>;

export const adminUpdateUserSchema = z
  .object({
    userId: z.string().min(1),
    name: z.string().trim().min(1, "Nama wajib diisi").max(60, "Nama terlalu panjang"),
    nim: z.string().trim().min(1, "NIM wajib diisi").max(30, "NIM terlalu panjang").regex(/^\d+$/, "NIM hanya boleh berisi angka"),
    password: z
      .string()
      .max(72, "Kata sandi terlalu panjang")
      .optional()
      .or(z.literal("")),
    status: z.enum(["active", "suspended"]),
  })
  .refine((data) => !data.password || data.password.length >= 8, {
    message: "Kata sandi minimal 8 karakter",
    path: ["password"],
  });

export type AdminUpdateUserFormValues = z.infer<typeof adminUpdateUserSchema>;

export const adminUpdateUserStatusSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["suspend", "reactivate"]),
});

export const adminReviewPaymentSchema = z
  .object({
    paymentId: z.string().min(1),
    decision: z.enum(["verified", "rejected"], { message: "Keputusan tidak valid" }),
    rejectReason: z
      .string()
      .trim()
      .max(500, "Alasan terlalu panjang")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (d) => (d.decision === "rejected" ? (d.rejectReason?.trim().length ?? 0) > 0 : true),
    {
      message: "Alasan penolakan wajib diisi",
      path: ["rejectReason"],
    }
  );

export type AdminReviewPaymentFormValues = z.infer<typeof adminReviewPaymentSchema>;
