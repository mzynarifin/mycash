"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ReceiptText,
  CreditCard,
  History,
  Menu,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User", icon: Users },
  { href: "/admin/bills", label: "Tagihan", icon: ReceiptText },
  { href: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/audit-logs", label: "Audit Log", icon: History },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5 text-[0.9375rem] font-semibold text-foreground select-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          M
        </div>
        <div className="flex flex-col">
          <span>MyCash</span>
          <span className="text-xs font-normal leading-4 text-muted-foreground">
            Ruang Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Navigasi admin">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors lg:min-h-10",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
              {active && (
                <ChevronRight
                  size={14}
                  className="ml-auto text-sidebar-accent-foreground/50"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <Separator className="mb-3" />
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                <ShieldCheck size={9} className="mr-0.5" aria-hidden="true" />
                Admin
              </Badge>
            </div>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user.nim ? `NIM ${user.nim}` : "Administrator"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-sidebar-foreground/50 hover:text-destructive"
            aria-label="Keluar"
            onClick={() => logout()}
          >
            <LogOut size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="dark flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar select-none">
        {navContent}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9")}
              aria-label="Buka navigasi"
            >
              <Menu size={18} aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              {navContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              M
            </div>
            <span>MyCash</span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              Admin
            </Badge>
          </div>
        </header>

        <main className="flex-1 overflow-auto scroll-py-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
