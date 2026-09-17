import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

const USER_PROTECTED_PATHS = [
  "/dashboard",
  "/expenses",
  "/categories",
  "/settings",
  "/bills",
  "/payments",
];

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    USER_PROTECTED_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    )
  );
}

function isAuthRoute(pathname: string) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function isUserWorkspaceRoute(pathname: string) {
  return USER_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user && isUserWorkspaceRoute(pathname)) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (roleRow?.role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Unauthenticated user accessing protected area → /login
  if (!user && (pathname === "/" || isProtectedRoute(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user accessing auth pages → their dashboard
  if (user && isAuthRoute(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    // Suspended users must stay on /login.
    if (profile?.is_suspended) {
      if (pathname !== "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    let admin = false;
    if (pathname === "/login" || pathname === "/register") {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      admin = roleRow?.role === "admin";
    }
    const url = request.nextUrl.clone();
    url.pathname = admin ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Non-admin accessing /admin → their user dashboard
  if (user && pathname.startsWith("/admin")) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (roleRow?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
