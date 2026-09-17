import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex items-center gap-2 select-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          M
        </div>
        <span className="text-[0.9375rem] font-semibold text-foreground">
          MyCash
        </span>
      </div>
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} MyCash —{" "}
        <Link href="/" className="hover:underline">
          Keuangan personal
        </Link>
      </p>
    </div>
  );
}
