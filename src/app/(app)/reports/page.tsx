"use client";

import * as React from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, FileDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/store/app-store";
import { downloadCSV, formatCompact } from "@/lib/utils";
import type { SubDepartment } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

const palette = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#6366f1", "#f43f5e", "#84cc16"];

function collectSubs(subs: SubDepartment[], out: SubDepartment[] = []): SubDepartment[] {
  for (const s of subs) {
    out.push(s);
    collectSubs(s.children, out);
  }
  return out;
}

function findSubByName(subs: SubDepartment[], name: string): SubDepartment | null {
  for (const s of subs) {
    if (s.name === name) return s;
    const found = findSubByName(s.children, name);
    if (found) return found;
  }
  return null;
}

function subtreeNames(s: SubDepartment, out: string[] = []): string[] {
  out.push(s.name);
  s.children.forEach((c) => subtreeNames(c, out));
  return out;
}

export default function ReportsPage() {
  const { state, visibleDepartments, activeDepartment, role, setDepartment } = useApp();
  const searchParams = useSearchParams();
  const isGlobal = role === "super-admin" || role === "admin";
  const [range, setRange] = React.useState("30d");

  const urlDept = searchParams.get("dept");
  const [dept, setDept] = React.useState(urlDept && visibleDepartments.includes(urlDept) ? urlDept : activeDepartment);
  const [sub, setSub] = React.useState(searchParams.get("sub") ?? "all");

  const deptObj = dept !== "all" ? state.departments.find((d) => d.name === dept) : null;
  const subOptions = useMemo(() => (deptObj ? collectSubs(deptObj.subDepartments) : []), [deptObj]);
  const effectiveSub = sub !== "all" && subOptions.some((s) => s.name === sub) ? sub : "all";

  const scopeItems = useMemo(() => {
    const items = dept === "all" ? state.inventory : state.inventory.filter((i) => i.department === dept);
    if (dept !== "all" && effectiveSub !== "all") {
      const node = findSubByName(deptObj?.subDepartments ?? [], effectiveSub);
      const names = node ? subtreeNames(node) : [effectiveSub];
      return items.filter((i) => names.includes(i.subDepartment ?? ""));
    }
    return items;
  }, [state.inventory, dept, effectiveSub, deptObj]);

  const scopeTransactions = useMemo(
    () => (dept === "all" ? state.transactions : state.transactions.filter((t) => t.department === dept)),
    [state.transactions, dept]
  );

  const metrics = useMemo(() => {
    const stockValue = scopeItems.reduce((s, i) => s + i.quantity, 0);
    const stockIn = scopeTransactions.filter((t) => t.type === "stock-in").reduce((s, t) => s + t.quantity, 0);
    const stockOut = scopeTransactions.filter((t) => t.type === "stock-out").reduce((s, t) => s + t.quantity, 0);
    const outValue = scopeTransactions.filter((t) => t.type === "stock-out").reduce((s, t) => s + t.quantity, 0);
    const categories = Object.entries(scopeItems.reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + i.quantity;
      return acc;
    }, {})).map(([name, quantity]) => ({ name, quantity }));
    return { stockValue, stockIn, stockOut, outValue, categories };
  }, [scopeItems, scopeTransactions]);

  const topItems = useMemo(
    () => [...scopeItems].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    [scopeItems]
  );

  const scopeLabel = dept === "all" ? "All Departments" : effectiveSub === "all" ? dept : `${dept} / ${effectiveSub}`;

  const exportReport = () => {
    downloadCSV("inventory-report.csv", [
      { Name: "Name", SKU: "SKU", Category: "Category", Department: "Department", "Sub-Department": "Sub-Department", Quantity: "Quantity", Status: "Status" },
      ...scopeItems.map((i) => ({ Name: i.deviceName, SKU: i.sku, Category: i.category, Department: i.department, "Sub-Department": i.subDepartment ?? "", Quantity: i.quantity, Status: i.status })),
    ]);
    toast.success("Report exported as CSV");
  };

  const handleDeptChange = (d: string) => {
    setDept(d);
    setSub("all");
    setDepartment(d);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Analyze inventory value, movement and performance."
        breadcrumb={[{ label: "Reports" }, ...(dept !== "all" && effectiveSub !== "all" ? [{ label: `${dept} / ${effectiveSub}` }] : [])]}
        actions={
          <div className="flex items-center gap-2">
            <Select value={dept} onValueChange={handleDeptChange}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {isGlobal && <SelectItem value="all">All Departments</SelectItem>}
                {visibleDepartments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {dept !== "all" && subOptions.length > 0 && (
              <Select value={effectiveSub} onValueChange={setSub}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sub-departments</SelectItem>
                  {subOptions.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportReport}><FileDown className="size-4" /> Export</Button>
          </div>
        }
      />

      <p className="text-muted-foreground text-sm">
        Showing inventory for <span className="text-foreground font-medium">{scopeLabel}</span> · {scopeItems.length} item{scopeItems.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="py-4"><CardContent>
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><Wallet className="size-3.5" /> Inventory Value</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCompact(metrics.stockValue)}</p>
          <p className="text-muted-foreground mt-1 text-xs">across {scopeItems.length} items</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent>
          <p className="text-success flex items-center gap-2 text-xs"><ArrowDownToLine className="size-3.5" /> Stock In</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{metrics.stockIn.toLocaleString()}</p>
          <p className="text-muted-foreground mt-1 text-xs">units received</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent>
          <p className="text-primary flex items-center gap-2 text-xs"><ArrowUpFromLine className="size-3.5" /> Stock Out</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{metrics.stockOut.toLocaleString()}</p>
          <p className="text-muted-foreground mt-1 text-xs">units issued</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent>
          <p className="text-warning flex items-center gap-2 text-xs"><TrendingUp className="size-3.5" /> Issued Value</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCompact(metrics.outValue)}</p>
          <p className="text-muted-foreground mt-1 text-xs">value of issues</p>
        </CardContent></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Stock Value by Category</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.categories} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()} units`, "Quantity"]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                  {metrics.categories.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Top Items by Value</CardTitle>
            <span className="text-muted-foreground text-xs">range: {range}</span>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{i.deviceName}</p>
                      <p className="text-muted-foreground font-mono text-xs">{i.sku}</p>
                    </TableCell>
                    <TableCell className="text-xs">{i.category}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{i.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{i.department}</TableCell>
                    <TableCell><StatusBadge status={i.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Movement Summary</CardTitle>
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.categories} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()} units`, "Quantity"]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
              <Bar dataKey="quantity" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}