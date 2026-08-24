"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  ListChecks,
  LogOut,
  MapPin,
  Package,
  CircleDot,
  Timer,
  User,
  Wrench,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TechniciansView } from "@/components/technicians/TechniciansView";

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const { state, user, logout } = useApp();
  const loading = useFakeLoading(300);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Guard: only the dummy technician account may view this page.
  React.useEffect(() => {
    if (!mounted) return;
    if (!user || user.role !== "technician") router.replace("/technician/login");
  }, [mounted, user, router]);

  // The login maps technician@gmail.com onto an existing technician record,
  // so user.id is that technician's id (e.g. TECH-001, TECH-002, etc.).
  const tech = React.useMemo(
    () => state.technicians.find((t) => t.id === user?.id),
    [state.technicians, user]
  );

  if (!mounted || !user || !tech || loading) {
    return (
      <div className="bg-muted/40 min-h-screen">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-24 w-72" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 min-h-screen">
      {/* Portal header */}
      <header className="bg-card sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary/15 flex size-9 items-center justify-center rounded-xl">
              <User className="text-primary size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Technician Portal</p>
              <p className="text-muted-foreground text-xs">{state.settings.orgName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <StatusBadge status={tech?.availability} />
              <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                {tech?.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => { logout(); router.replace("/technician/login"); }}>
              <LogOut className="size-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Greeting */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Welcome back, {tech?.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm">
            Here is your complete technician management view, synced live with the Admin Panel.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>

        {/* Technician list / details */}
        <TechniciansView basePath="/technicians" />
      </main>

      <p className="text-muted-foreground flex items-center justify-center gap-1.5 pb-4 text-xs">
        <Boxes className="size-3.5" /> Data is synced live with the Admin Panel — changes made by admins appear here instantly.
      </p>
    </div>
  );
}