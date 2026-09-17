"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { logoutAction } from "@/actions/auth-actions";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: UserProfile;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: UserProfile;
  children: React.ReactNode;
}) {
  const logout = useCallback(async () => {
    await logoutAction();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: initialUser, logout }),
    [initialUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}