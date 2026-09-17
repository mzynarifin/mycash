"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  WalletCards,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "Tagihan", icon: ReceiptText },
  { href: "/payments", label: "Pembayaran", icon: WalletCards },
  { href: "/settings", label: "Pengaturan", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const navContent = (
    <>
      <div className="flex h-16 items-center gap-2.5 px-4 text-[0.9375rem] font-semibold text-sidebar-foreground select-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent text-xs font-semibold text-primary">
          M
        </div>
        MyCash
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Navigasi utama">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:h-10",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/62 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
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
        <Separator className="mb-3 bg-sidebar-border" />
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="border border-sidebar-border bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user.nim ? `NIM ${user.nim}` : "Portal pengguna"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive"
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
      <aside className="hidden w-[232px] flex-col border-r border-sidebar-border bg-sidebar select-none lg:flex">
        {navContent}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9")}
              aria-label="Buka navigasi"
            >
              <Menu size={18} aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[280px] flex-col border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigasi</SheetTitle>
              {navContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-accent text-xs font-semibold text-primary">
              M
            </div>
            MyCash
          </div>
        </header>

        <main className="flex-1 overflow-auto scroll-py-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
