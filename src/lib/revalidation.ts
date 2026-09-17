import { revalidatePath } from "next/cache";

export function revalidatePaymentPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/payments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/payments");
}

export function revalidateBillPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/bills");
}

export function revalidateAdminUserPaths() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
}