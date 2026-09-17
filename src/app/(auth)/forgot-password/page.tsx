import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Kirim tautan reset kata sandi ke email Anda.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-semibold leading-7 text-foreground">
        Lupa Kata Sandi
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Masukkan email untuk menerima tautan reset.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
