"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false); // 1. Added mounted state
  const { user, role, state } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = state.settings.sidebarCollapsed;

  // 2. Wait until client-side hydration finishes
  React.useEffect(() => {
    setMounted(true);
  }, []);
  // eslint-disable-line react-hooks/set-state-in-effect

  const blockedPaths = React.useMemo(() => {
    const blocked: string[] = [];
    // Scoped users (department login): dept inventory/stock/reports only.
    // No purchase orders, no suppliers, no admin areas.
    // Tickets ARE allowed for department-manager (they see their dept's tickets only).
    if (role === "user" || role === "department-manager" || role === "department-user") {
      blocked.push(
        "/stock-in",
        "/stock-out",
        "/categories",
        "/departments",
        "/activity",
      );
    }
    if (role === "viewer") {
      blocked.push(
        "/inventory",
        "/stock-in",
        "/stock-out",
        "/tickets",
        "/departments",
        "/activity",
      );
    }
    return blocked;
  }, [role]);

  const isBlocked = blockedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  React.useEffect(() => {
    if (!mounted) return; // Wait until mounted before redirecting

    if (!user) {
      router.replace("/login");
    } else if (isBlocked) {
      router.replace("/dashboard");
    }
  }, [user, router, isBlocked, mounted, role, pathname]);

  // 3. Render identical loading state during Server rendering and initial Client hydration
  if (!mounted || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="bg-muted size-3 animate-pulse rounded-full" />
          <div className="bg-muted size-3 animate-pulse rounded-full [animation-delay:150ms]" />
          <div className="bg-muted size-3 animate-pulse rounded-full [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          collapsed ? "lg:pl-[68px]" : "lg:pl-64",
        )}
      >
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}