"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/actions/types";

export async function loginAction(input: {
  nim: string;
  password: string;
}): Promise<ActionResult> {
  const validated = loginSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, message: "NIM atau password tidak sesuai." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const admin = createAdminClient();
  if (!admin) return { success: false, message: "Konfigurasi server tidak lengkap." };
  const { data: loginProfile } = await admin.from("profiles").select("email").eq("nim", validated.data.nim).maybeSingle();
  if (!loginProfile?.email) return { success: false, message: "NIM atau password tidak sesuai." };

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: loginProfile.email,
    password: validated.data.password,
  });

  if (error) {
    return { success: false, message: "NIM atau password tidak sesuai." };
  }

  // Reject suspended accounts even if credentials are valid.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("id", signInData.user.id)
    .maybeSingle();

  if (profile?.is_suspended) {
    await supabase.auth.signOut();
    return {
      success: false,
      message: "Akun Anda dinonaktifkan. Hubungi administrator.",
    };
  }

  const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", signInData.user.id).maybeSingle();
  revalidatePath("/", "layout");
  redirect(roleRow?.role === "admin" ? "/admin/dashboard" : "/dashboard");
}

export async function registerAction(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult<{ requiresEmailConfirmation: boolean }>> {
  void input;
  return {
    success: false,
    message: "Pendaftaran publik dinonaktifkan. Hubungi administrator.",
  };
}

export async function logoutAction(): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat keluar. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(input: {
  email: string;
}): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Email tidak valid." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const origin = (await headers()).get("origin") ?? "";
  const options = origin
    ? { redirectTo: `${origin}/reset-password` }
    : { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reset-password` };

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    options
  );

  // Always succeed to avoid leaking which emails are registered.
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat mengirim tautan." };
  }

  return { success: true };
}

export async function resetPasswordAction(input: {
  code: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: input.password,
    confirmPassword: input.confirmPassword,
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Kata sandi tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (input.code) {
    const { error: codeError } = await supabase.auth.exchangeCodeForSession(input.code);
    if (codeError) {
      return { success: false, message: "Tautan reset tidak valid atau kedaluwarsa." };
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, message: "Terjadi kesalahan saat memperbarui kata sandi." };
  }

  return { success: true };
}
