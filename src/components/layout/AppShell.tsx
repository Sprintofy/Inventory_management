"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, state } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = state.settings.sidebarCollapsed;

  React.useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) {
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
      <div className={cn("flex min-h-screen flex-col transition-all duration-300", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
