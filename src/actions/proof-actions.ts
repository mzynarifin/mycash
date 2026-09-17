"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PROOF_BUCKET = "bukti-pembayaran";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export interface ProofUploadTicket {
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
}

/**
 * Signed upload URL bukti pembayaran. Path selalu di folder `{uid}/`
 * sehingga user tidak bisa menulis ke folder user lain.
 */
export async function createProofUploadAction(input: {
  fileName: string;
  contentType: string;
  size: number;
}): Promise<{ success: true; ticket: ProofUploadTicket } | { success: false; message: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." };
  }

  if (!ALLOWED_TYPES.includes(input.contentType)) {
    return { success: false, message: "Format bukti harus JPG, PNG, WEBP, atau PDF." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_SIZE) {
    return { success: false, message: "Ukuran bukti maksimal 5 MB." };
  }

  const admin = createAdminClient();
  if (!admin) return { success: false, message: "Konfigurasi server tidak lengkap." };

  const ext =
    input.contentType === "image/png" ? "png"
    : input.contentType === "image/webp" ? "webp"
    : input.contentType === "application/pdf" ? "pdf"
    : "jpg";
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const { data, error } = await admin.storage.from(PROOF_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return { success: false, message: "Gagal menyiapkan unggahan bukti." };
  }

  const { data: publicData } = admin.storage.from(PROOF_BUCKET).getPublicUrl(path);

  return {
    success: true,
    ticket: {
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
    },
  };
}