"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Package,
  PackageX,
  Timer,
  Users as UsersIcon,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryChart, DepartmentChart, StockHealthChart } from "@/components/dashboard/charts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import {
  getTicketsByStatus,
  getTicketsByPriority,
  getTechnicianWorkload,
  getTotalTickets,
} from "@/lib/dashboard-selectors";
import { workloadLevel, type WorkloadLevelKey } from "@/lib/workload";

const priorityClass: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

const workloadBarColor: Record<WorkloadLevelKey, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#b91c1c",
};

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  module: string;
  item: string;
  department: string;
  date: string;
}

function Greeting() {
  const { user, activeDepartment, role, state } = useApp();
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isDeptView = role === "user" || role === "department-manager" || role === "department-user";
  const dept = state.departments.find((d) => d.name === activeDepartment);

  if (isDeptView && dept) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {dept.name} Inventory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Your department&apos;s inventory overview{user?.subDepartment ? ` · ${user.subDepartment}` : ""}</p>
      </div>
    );
  }

  if (isDeptView && dept) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {dept.name} Inventory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Your department&apos;s inventory overview</p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {part}, {user?.name.split(" ")[0]}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">Here&apos;s what&apos;s happening with your inventory and IT support today.</p>
    </div>
  );
}

export default function DashboardPage() {
  const { departmentItems, allItems, activeDepartment, visibleDepartments, state, role, setDepartment } = useApp();
  const loading = useFakeLoading();
  const [range, setRange] = React.useState<"7 days" | "30 days" | "3 months" | "1 year">("30 days");
  const isDeptUser = role === "user" || role === "department-manager" || role === "department-user";

  const items = activeDepartment === "all" ? allItems : departmentItems;

  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((s, i) => s + i.quantity, 0);
    const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= 10).length;
    const outOfStock = items.filter((i) => i.quantity <= 0).length;
    const pendingRequests = state.requests.filter((r) => r.status === "pending" && (activeDepartment === "all" || r.department === activeDepartment)).length;
    return { totalItems, totalStock, lowStock, outOfStock, pendingRequests };
  }, [items, state.requests, activeDepartment]);

  const deptChart = React.useMemo(() => {
    const depts = state.departments;
    if (activeDepartment !== "all") {
      const d = depts.find((x) => x.name === activeDepartment);
      return [{ name: activeDepartment, value: stats.totalStock, color: d?.color ?? "#6366f1" }];
    }
    return depts.map((d) => ({
      name: d.name,
      value: allItems.filter((i) => i.department === d.name).reduce((s, i) => s + i.quantity, 0),
      color: d.color,
    }));
  }, [activeDepartment, allItems, stats.totalStock, state.departments]);

  const health = React.useMemo(() => {
    const source = activeDepartment === "all" ? allItems : items;
    const healthy = source.filter((i) => i.quantity > 10).length;
    const lowStock = source.filter((i) => i.quantity > 0 && i.quantity <= 10).length;
    const outOfStock = source.filter((i) => i.quantity <= 0).length;
    return [
      { label: "Healthy", value: healthy, color: "#10b981" },
      { label: "Low Stock", value: lowStock, color: "#f59e0b" },
      { label: "Out of Stock", value: outOfStock, color: "#ef4444" },
    ];
  }, [activeDepartment, items, allItems]);

  // Enhanced activity feed: real logged activity.
  const recentActivity = React.useMemo(() => {
    return state.activities
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [state.activities]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Greeting />
        <div className="flex items-center gap-2">
          <Select value={activeDepartment === "all" ? "all" : activeDepartment} onValueChange={(v) => setDepartment(v)}>
            <SelectTrigger className="w-[190px]">
              <CalendarDays className="text-muted-foreground size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(role === "super-admin" || role === "admin" ? ["all", ...visibleDepartments] : visibleDepartments).map((d) => (
                <SelectItem key={d} value={d}>
                  {d === "all" ? "All Departments" : d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["7 days", "30 days", "3 months", "1 year"] as const).map((r) => (
                <SelectItem key={r} value={r}>
                  Last {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Boxes} label="Total Items" value={formatNumber(stats.totalItems)} change={4.2} trend="up" loading={loading} iconClass="bg-primary/10 text-primary" />
        <StatCard icon={Package} label="Total Stock" value={formatNumber(stats.totalStock)} change={2.8} trend="up" loading={loading} iconClass="bg-sky-500/10 text-sky-500" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={formatNumber(stats.lowStock)} change={-3.1} trend="down" loading={loading} iconClass="bg-warning/15 text-warning" />
        <StatCard icon={PackageX} label="Out of Stock" value={formatNumber(stats.outOfStock)} change={1.4} trend="up" loading={loading} iconClass="bg-danger/10 text-danger" />
        <StatCard icon={ClipboardList} label="Pending Requests" value={formatNumber(stats.pendingRequests)} change={-12.5} trend="down" loading={loading} iconClass="bg-violet-500/10 text-violet-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Inventory Overview</CardTitle>
              <p className="text-muted-foreground mt-1 text-xs">Stock movements across {activeDepartment === "all" ? "all departments" : activeDepartment}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-primary size-2 rounded-full" /> Stock In
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-warning size-2 rounded-full" /> Stock Out
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <InventoryChart range={range} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory by Department</CardTitle>
            <p className="text-muted-foreground text-xs">Stock distribution</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[230px] w-full" /> : <DepartmentChart data={deptChart} />}
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Health</CardTitle>
            <p className="text-muted-foreground text-xs">Items by stock status</p>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-[160px] w-full" /> : <StockHealthChart data={health} />}</CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <p className="text-muted-foreground text-xs">Inventory, asset and support activity across the organization</p>
            </div>
            <Link href="/activity" className="text-primary hover:underline text-xs font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((a, i) => (
                  <div key={a.id} className={cn("flex items-start gap-3 rounded-lg px-2 py-2", a.module === "ticket" && "border-l-2 border-l-primary/30", a.module === "asset" && "border-l-2 border-l-sky-500/30")}>
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground text-[10px] font-medium tabular-nums">
                        {new Date(a.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                      {i < recentActivity.length - 1 && <span className="bg-border mt-1 w-px flex-1" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{a.user}</span> <span className="text-muted-foreground">{a.action}</span>{" "}
                        <span className="font-medium">{a.item}</span>
                      </p>
                      <p className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                        <StatusBadge status={a.module} dot={false} className="text-[10px]" />
                        {a.department !== "-" && <span>{a.department}</span>}
                        <span className="text-muted-foreground/60">{timeAgo(a.date)}</span>
                      </p>
                    </div>
                    <ArrowUpRight className="text-muted-foreground/40 mt-1 size-3.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(role === "user" || role === "department-user" || role === "department-manager") && (
        <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg border px-4 py-3 text-xs">
          <AlertTriangle className="size-4" />
          You&apos;re viewing as <span className="font-medium text-foreground">User</span> — actions are limited to your department ({activeDepartment}).
        </div>
      )}
    </div>
  );
}
