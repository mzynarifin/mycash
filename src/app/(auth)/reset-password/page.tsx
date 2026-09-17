import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Kata Sandi",
  description: "Buat kata sandi baru untuk akun Anda.",
};

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-semibold leading-7 text-foreground">
        Reset Kata Sandi
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Buat kata sandi baru untuk akun Anda.
      </p>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
