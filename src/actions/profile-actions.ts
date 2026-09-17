"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/types";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Nama wajib diisi")
  .max(60, "Nama terlalu panjang");

const themeSchema = z.enum(["light", "dark", "system"]);

function revalidateProfile() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
}

export async function updateProfileNameAction(
  fullName: string
): Promise<ActionResult> {
  const parsed = nameSchema.safeParse(fullName);
  if (!parsed.success) {
    return { success: false, message: "Nama tidak valid." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Sesi berakhir. Silakan login kembali." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui profil.",
    };
  }

  revalidateProfile();
  return { success: true };
}

export async function updateThemeAction(
  theme: "light" | "dark" | "system"
): Promise<ActionResult> {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) {
    return { success: false, message: "Tema tidak valid." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Sesi berakhir. Silakan login kembali." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme: parsed.data })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui tema.",
    };
  }

  revalidateProfile();
  return { success: true };
}