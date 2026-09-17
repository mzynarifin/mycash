"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
} from "@/lib/validations/admin";
import { getUserRoleFromClient } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import { revalidateAdminUserPaths } from "@/lib/revalidation";
import type { ActionResult } from "@/actions/types";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: { success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." } as ActionResult };
  }
  const role = await getUserRoleFromClient(supabase, user.id);
  if (role !== "admin") {
    return { error: { success: false, message: "Akses ditolak." } as ActionResult };
  }
  return { user };
}

export async function createUserAction(input: {
  name: string;
  nim: string;
  password: string;
  confirmPassword: string;
  status: "active" | "suspended";
}): Promise<ActionResult> {
  const parsed = adminCreateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data user tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const email = `${parsed.data.nim}@mycash.local`;
  const { data: existing } = await admin.from("profiles").select("id").eq("nim", parsed.data.nim).maybeSingle();
  if (existing) return { success: false, message: "NIM tersebut sudah digunakan." };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.name, nim: parsed.data.nim },
    app_metadata: { user_role: "user" },
  });

  if (error) {
    const message = error.message ?? "";
    if (message.toLowerCase().includes("already")) {
      return { success: false, message: "NIM tersebut sudah digunakan." };
    }
    return { success: false, message: "Terjadi kesalahan saat membuat user." };
  }

  if (!data.user) return { success: false, message: "Terjadi kesalahan saat membuat user." };
  const { error: profileError } = await admin.from("profiles").update({
    full_name: parsed.data.name.trim(),
    nim: parsed.data.nim,
    email,
    is_suspended: parsed.data.status === "suspended",
  }).eq("id", data.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { success: false, message: profileError.code === "23505" ? "NIM tersebut sudah digunakan." : "Profil user gagal dibuat." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "user.create",
    entityType: "auth.users",
    entityId: data.user?.id ?? null,
    detail: { nim: parsed.data.nim, status: parsed.data.status },
  });

  revalidateAdminUserPaths();
  return { success: true };
}

export async function updateUserAction(input: {
  userId: string;
  name: string;
  nim: string;
  password?: string;
  status: "active" | "suspended";
}): Promise<ActionResult> {
  const parsed = adminUpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data user tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, email, nim")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (!existingProfile) {
    return { success: false, message: "User tidak ditemukan." };
  }

  if (parsed.data.nim !== existingProfile.nim) {
    const { data: nimOwner } = await admin
      .from("profiles")
      .select("id")
      .eq("nim", parsed.data.nim)
      .neq("id", parsed.data.userId)
      .maybeSingle();
    if (nimOwner) return { success: false, message: "NIM tersebut sudah digunakan." };
  }

  const email = `${parsed.data.nim}@mycash.local`;
  const { error: authError } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    email,
    ...(parsed.data.password
      ? { password: parsed.data.password }
      : {}),
    user_metadata: { full_name: parsed.data.name.trim(), nim: parsed.data.nim },
  });
  if (authError) {
    const message = authError.message ?? "";
    if (message.toLowerCase().includes("already")) {
      return { success: false, message: "NIM tersebut sudah digunakan." };
    }
    return { success: false, message: "Terjadi kesalahan saat memperbarui user." };
  }

  const { error: profileError } = await admin.from("profiles").update({
    full_name: parsed.data.name.trim(),
    nim: parsed.data.nim,
    email,
    is_suspended: parsed.data.status === "suspended",
  }).eq("id", parsed.data.userId);
  if (profileError) {
    return { success: false, message: profileError.code === "23505" ? "NIM tersebut sudah digunakan." : "Profil user gagal diperbarui." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "user.update",
    entityType: "auth.users",
    entityId: parsed.data.userId,
    detail: { nim: parsed.data.nim, status: parsed.data.status },
  });

  revalidateAdminUserPaths();
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (roleRow?.role === "admin") {
    return { success: false, message: "Akun admin tidak dapat dihapus." };
  }

  const { data: assignmentRows } = await admin
    .from("bill_assignments")
    .select("id")
    .eq("user_id", userId);
  const assignmentIds = (assignmentRows ?? []).map((a) => a.id as string);

  const { count: paymentCount } =
    assignmentIds.length > 0
      ? await admin
          .from("payments")
          .select("id", { count: "exact", head: true })
          .in("assignment_id", assignmentIds)
      : { count: 0 };

  if ((paymentCount ?? 0) > 0) {
    return {
      success: false,
      message:
        "User memiliki riwayat pembayaran dan tidak dapat dihapus. Tangguhkan sebagai gantinya.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat menghapus user." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "user.delete",
    entityType: "auth.users",
    entityId: userId,
  });

  revalidateAdminUserPaths();
  return { success: true };
}

export async function setUserStatusAction(input: {
  userId: string;
  action: "suspend" | "reactivate";
}): Promise<ActionResult> {
  const parsed = adminUpdateUserStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data status user tidak valid." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const suspended = parsed.data.action === "suspend";

  const { error } = await admin
    .from("profiles")
    .update({ is_suspended: suspended })
    .eq("id", parsed.data.userId);

  if (error) {
    return { success: false, message: "Terjadi kesalahan saat mengubah status user." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: suspended ? "user.suspend" : "user.reactivate",
    entityType: "profiles",
    entityId: parsed.data.userId,
  });

  revalidateAdminUserPaths();
  return { success: true };
}
