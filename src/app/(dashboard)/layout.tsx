import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/users";
import { DashboardProviders } from "@/components/providers/dashboard-providers";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.suspended) redirect("/login");
  if (user.role === "admin") redirect("/admin/dashboard");

  return (
    <DashboardProviders initialUser={user}>
      <AppShell>{children}</AppShell>
    </DashboardProviders>
  );
}
