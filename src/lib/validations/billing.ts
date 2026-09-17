import { z } from "zod";

const amountString = z
  .string()
  .min(1, "Jumlah wajib diisi")
  .refine((v) => Number(v.replace(/\D/g, "")) > 0, {
    message: "Jumlah harus lebih dari 0",
  });

export const createBillSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul wajib diisi")
      .max(120, "Judul terlalu panjang"),
    description: z
      .string()
      .trim()
      .max(500, "Deskripsi terlalu panjang")
      .optional()
      .or(z.literal("")),
    category: z.string().trim().min(1, "Kategori wajib dipilih").max(60),
    notes: z.string().trim().max(1000, "Catatan terlalu panjang").optional().or(z.literal("")),
    reference: z
      .string()
      .trim()
      .max(80, "Referensi terlalu panjang")
      .optional()
      .or(z.literal("")),
    amount: amountString,
    issueDate: z.string().min(1, "Tanggal wajib diisi"),
    dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
    userIds: z.array(z.string().min(1)),
    assignmentMode: z.enum(["single", "multiple", "all"]),
  })
  .superRefine((d, ctx) => {
    if (d.dueDate < d.issueDate) {
      ctx.addIssue({ code: "custom", message: "Tanggal jatuh tempo tidak boleh sebelum tanggal terbit", path: ["dueDate"] });
    }
    if (d.assignmentMode !== "all" && d.userIds.length === 0) {
      ctx.addIssue({ code: "custom", message: "Pilih minimal satu user", path: ["userIds"] });
    }
    if (d.assignmentMode === "single" && d.userIds.length > 1) {
      ctx.addIssue({ code: "custom", message: "Mode satu user hanya menerima satu pilihan", path: ["userIds"] });
    }
  });

export type CreateBillFormValues = z.infer<typeof createBillSchema>;

export const updateBillSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1, "Judul wajib diisi").max(120, "Judul terlalu panjang"),
    description: z
      .string()
      .trim()
      .max(500, "Deskripsi terlalu panjang")
      .optional()
      .or(z.literal("")),
    category: z.string().trim().min(1, "Kategori wajib dipilih").max(60),
    notes: z.string().trim().max(1000, "Catatan terlalu panjang").optional().or(z.literal("")),
    reference: z
      .string()
      .trim()
      .max(80, "Referensi terlalu panjang")
      .optional()
      .or(z.literal("")),
    amount: amountString,
    issueDate: z.string().min(1, "Tanggal wajib diisi"),
    dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  })
  .refine((d) => d.dueDate >= d.issueDate, {
    message: "Tanggal jatuh tempo tidak boleh sebelum tanggal terbit",
    path: ["dueDate"],
  });

export type UpdateBillFormValues = z.infer<typeof updateBillSchema>;

export const assignBillSchema = z.object({
  billId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1, "Pilih minimal satu user"),
});
