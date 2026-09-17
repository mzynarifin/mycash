"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetSuccess = useMemo(() => searchParams.get("reset") === "success", [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nim: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    setErrorMessage(null);
    const result = await loginAction(values);
    if (!result.success) {
      setErrorMessage(result.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {resetSuccess && (
        <div
          role="status"
          className="rounded-md border border-emerald-600/30 bg-emerald-600/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400"
        >
          Kata sandi berhasil diubah. Silakan login dengan kata sandi baru.
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="login-nim">NIM</Label>
        <Input
          id="login-nim"
          inputMode="numeric"
          autoComplete="username"
          placeholder="Masukkan NIM"
          aria-invalid={!!errors.nim}
          {...register("nim")}
        />
        {errors.nim && (
          <p className="text-xs text-destructive">{errors.nim.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Memproses..." : "Login"}
      </Button>

      <p className="pt-1 text-center text-xs text-muted-foreground">Akun dikelola oleh administrator MyCash.</p>
    </form>
  );
}
