"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  Package,
  PackageX,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryChart, DepartmentChart, StockHealthChart } from "@/components/dashboard/charts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatCompact, formatCurrency, formatNumber, timeAgo, cn } from "@/lib/utils";
import { stockHealth as seedStockHealth, departments } from "@/data/mock";

function Greeting() {
  const { user, activeDepartment, role } = useApp();
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isDeptView = role === "department-manager" || role === "department-user";
  const dept = departments.find((d) => d.name === activeDepartment);

  if (isDeptView && dept) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {dept.name} Inventory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Your department's inventory overview</p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {part}, {user?.name.split(" ")[0]}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your inventory today.</p>
    </div>
  );
}

export default function DashboardPage() {
  const { departmentItems, allItems, activeDepartment, user, state, role, setDepartment } = useApp();
  const loading = useFakeLoading();
  const [range, setRange] = React.useState<"7 days" | "30 days" | "3 months" | "1 year">("30 days");

  const items = activeDepartment === "all" ? allItems : departmentItems;

  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((s, i) => s + i.quantity, 0);
    const lowStock = items.filter((i) => i.status === "low-stock").length;
    const outOfStock = items.filter((i) => i.status === "out-of-stock").length;
    const value = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const pendingRequests = state.requests.filter((r) => r.status === "pending" && (activeDepartment === "all" || r.department === activeDepartment)).length;
    return { totalItems, totalStock, lowStock, outOfStock, value, pendingRequests };
  }, [items, state.requests, activeDepartment]);

  const deptChart = React.useMemo(() => {
    if (activeDepartment !== "all") {
      const d = departments.find((x) => x.name === activeDepartment)!;
      return [{ name: activeDepartment, value: stats.totalStock, color: d.color }];
    }
    return departments.map((d) => ({
      name: d.name,
      value: allItems.filter((i) => i.department === d.name).reduce((s, i) => s + i.quantity, 0),
      color: d.color,
    }));
  }, [activeDepartment, allItems, stats.totalStock]);

  const health = React.useMemo(() => {
    if (activeDepartment !== "all") {
      return [
        { label: "Healthy", value: items.filter((i) => i.status === "in-stock").length, color: "#10b981" },
        { label: "Low Stock", value: items.filter((i) => i.status === "low-stock").length, color: "#f59e0b" },
        { label: "Critical", value: items.filter((i) => i.status === "low-stock" && i.quantity <= i.minStock).length, color: "#f97316" },
        { label: "Out of Stock", value: items.filter((i) => i.status === "out-of-stock").length, color: "#ef4444" },
      ];
    }
    return seedStockHealth;
  }, [activeDepartment, items]);

  const recentActivity = React.useMemo(() => state.activities.slice(0, 6), [state.activities]);

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
              {(role === "super-admin" || role === "admin" ? ["all", ...state.departments.map((d) => d.name)] : [activeDepartment]).map((d) => (
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Boxes} label="Total Items" value={formatNumber(stats.totalItems)} change={4.2} trend="up" loading={loading} iconClass="bg-primary/10 text-primary" />
        <StatCard icon={Package} label="Total Stock" value={formatNumber(stats.totalStock)} change={2.8} trend="up" loading={loading} iconClass="bg-sky-500/10 text-sky-500" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={formatNumber(stats.lowStock)} change={-3.1} trend="down" loading={loading} iconClass="bg-warning/15 text-warning" />
        <StatCard icon={PackageX} label="Out of Stock" value={formatNumber(stats.outOfStock)} change={1.4} trend="up" loading={loading} iconClass="bg-danger/10 text-danger" />
        <StatCard icon={ClipboardList} label="Pending Requests" value={formatNumber(stats.pendingRequests)} change={-12.5} trend="down" loading={loading} iconClass="bg-violet-500/10 text-violet-500" />
        <StatCard icon={IndianRupee} label="Inventory Value" value={formatCompact(stats.value)} change={5.6} trend="up" loading={loading} iconClass="bg-emerald-500/10 text-emerald-500" />
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
              <p className="text-muted-foreground text-xs">Latest actions across the organization</p>
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
                  <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2">
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

      {role === "department-user" && (
        <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg border px-4 py-3 text-xs">
          <AlertTriangle className="size-4" />
          You're viewing as <span className="font-medium text-foreground">Department User</span> — actions are limited to your department ({activeDepartment}). Switch roles from your profile menu to explore more.
        </div>
      )}
    </div>
  );
}

export { cn, formatCurrency, ArrowDownRight };