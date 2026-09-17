"use client";

import { AuthProvider } from "@/lib/auth-context";
import type { UserProfile } from "@/types/user";

export function DashboardProviders({
  initialUser,
  children,
}: {
  initialUser: UserProfile;
  children: React.ReactNode;
}) {
  return <AuthProvider initialUser={initialUser}>{children}</AuthProvider>;
}