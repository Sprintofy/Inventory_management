"use client";

import * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/store/app-store";

function ThemeApplier() {
  const { state } = useApp();
  React.useEffect(() => {
    const root = document.documentElement;
    const theme = state.settings.theme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = theme === "dark" || (theme === "system" && prefersDark);
    root.classList.toggle("dark", dark);
  }, [state.settings.theme]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <TooltipProvider delayDuration={250}>
        <ThemeApplier />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </AppProvider>
  );
}
