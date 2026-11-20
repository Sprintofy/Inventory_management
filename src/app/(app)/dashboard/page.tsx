"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  CalendarDays,
  Package,
  Users as UsersIcon,
  Building2,
  BarChart3,
  Activity as ActivityIcon,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  InventoryChart,
  DepartmentChart,
  StockMovementChart,
  CategoryDistributionChart,
  StockTrendChart,
  TopItemsChart,
  MonthlyComparisonChart,
} from "@/components/dashboard/charts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import {
  getStatusColors,
  getIconBgClass,
  getCardGradient,
  CHART_PALETTE,
  getPageGradient,
} from "@/lib/theme";

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

  const items = activeDepartment === "all" ? allItems : departmentItems;

  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((s, i) => s + i.quantity, 0);
    return { totalItems, totalStock };
  }, [items]);

  const deptChart = React.useMemo(() => {
    const depts = state.departments;
    if (activeDepartment !== "all") {
      const d = depts.find((x) => x.name === activeDepartment);
      return [{ name: activeDepartment, value: stats.totalStock, color: d?.color ?? "#6366f1" }];
    }
    return depts.map((d, idx) => ({
      name: d.name,
      value: allItems.filter((i) => i.department === d.name).reduce((s, i) => s + i.quantity, 0),
      color: d.color || CHART_PALETTE[idx % CHART_PALETTE.length],
    }));
  }, [activeDepartment, allItems, stats.totalStock, state.departments]);

  const recentActivity = React.useMemo(() => {
    return state.activities
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [state.activities]);

  const quickStats = React.useMemo(() => [
    { label: "Departments", value: state.departments.length, icon: Building2, color: "indigo" },
    { label: "Categories", value: state.categories.length, icon: BarChart3, color: "teal" },
    { label: "Technicians", value: state.technicians.length, icon: UsersIcon, color: "violet" },
    { label: "Activities (24h)", value: state.activities.filter(a => new Date(a.date) > new Date(Date.now() - 24*60*60*1000)).length, icon: ActivityIcon, color: "orange" },
  ], [state.departments.length, state.categories.length, state.technicians.length, state.activities]);

  const pageGradient = getPageGradient("dashboard");

  return (
    <div className={cn("min-h-screen", pageGradient)}>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Greeting />
          <div className="flex flex-wrap items-center gap-2">
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

        {/* Primary Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard icon={Boxes} label="Range Of Devices" value={formatNumber(stats.totalItems)} loading={loading} iconClass="bg-primary/20 text-primary" />
          <StatCard icon={Package} label="Depth of Devices(Total Quantity of All Devices)" value={formatNumber(stats.totalStock)} loading={loading} iconClass="bg-sky-500/20 text-sky-500" />
        </div>

        {/* Secondary Quick Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickStats.map((stat, idx) => (
            <Card key={stat.label} className={cn("relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5", getCardGradient(idx))}>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-4 flex items-center gap-3">
                <div className={cn("flex items-center justify-center rounded-xl size-11", getIconBgClass(idx))}>
                  <stat.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{formatNumber(stat.value)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(14,165,233,0.05) 100%)" }}>
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
                  <span className="bg-amber-500 size-2 rounded-full" /> Stock Out
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

          <Card className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(16,185,129,0.05) 100%)" }}>
            <CardHeader>
              <CardTitle className="text-base">Inventory by Department</CardTitle>
              <p className="text-muted-foreground text-xs">Stock distribution</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[230px] w-full" /> : <DepartmentChart data={deptChart} />}
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts Row */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(14,165,233,0.05) 100%)" }}>
            <CardHeader>
              <CardTitle className="text-base">Stock Movement</CardTitle>
              <p className="text-muted-foreground text-xs">Stock In vs Stock Out over time</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[240px] w-full" /> : <StockMovementChart range={range} />}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(16,185,129,0.05) 100%)" }}>
            <CardHeader>
              <CardTitle className="text-base">Category Distribution</CardTitle>
              <p className="text-muted-foreground text-xs">Stock movements by category</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[300px] w-full" /> : <CategoryDistributionChart />}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.05) 100%)" }}>
            <CardHeader>
              <CardTitle className="text-base">Stock Trend</CardTitle>
              <p className="text-muted-foreground text-xs">Running balance over time</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[280px] w-full" /> : <StockTrendChart range={range} />}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.05) 100%)" }}>
            <CardHeader>
              <CardTitle className="text-base">Top Items</CardTitle>
              <p className="text-muted-foreground text-xs">Most moved items by quantity</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[280px] w-full" /> : <TopItemsChart />}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.05) 100%)" }}>
            <CardHeader>
              <CardTitle className="text-base">Monthly Comparison</CardTitle>
              <p className="text-muted-foreground text-xs">Monthly stock in vs out</p>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : <MonthlyComparisonChart />}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="xl:col-span-2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.05) 100%)" }}>
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
                  {recentActivity.map((a, i) => {
                    const colors = getStatusColors(a.module);
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                          "hover:bg-white/50 border-l-2",
                          `border-l-${colors.border.replace("bg-", "")}`,
                        )}
                      >
                        <div className="flex flex-col items-center shrink-0">
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
                            {a.department !== "-" && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.department}</span>}
                            <span className="text-muted-foreground/60">{timeAgo(a.date)}</span>
                          </p>
                        </div>
                        <ArrowUpRight className="text-muted-foreground/40 mt-1 size-3.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {(role === "user" || role === "department-user" || role === "department-manager") && (
          <div className="bg-primary/10 text-primary-foreground flex items-center gap-2 rounded-lg border border-primary/20 px-4 py-3 text-xs">
            <AlertCircle className="size-4" />
            You&apos;re viewing as <span className="font-medium">{activeDepartment}</span> — actions are limited to your department.
          </div>
        )}
      </div>
    </div>
  );
}