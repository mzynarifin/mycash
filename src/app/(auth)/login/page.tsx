import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Masuk ke akun MyCash Anda.",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-semibold leading-7 text-foreground">
        Masuk ke Akun
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Gunakan NIM dan password yang diberikan administrator.
      </p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
