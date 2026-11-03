"use client";

import * as React from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/store/app-store";
import { downloadCSV } from "@/lib/utils";
import type { SubDepartment } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

const palette = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#6366f1", "#f43f5e", "#84cc16"];

function findNode(subs: SubDepartment[], name: string): SubDepartment | null {
  for (const s of subs) {
    if (s.name === name) return s;
    const found = findNode(s.children, name);
    if (found) return found;
  }
  return null;
}

function subtreeNames(s: SubDepartment, out: string[] = []): string[] {
  out.push(s.name);
  s.children.forEach((c) => subtreeNames(c, out));
  return out;
}

const HISTOGRAM_BINS = [
  { name: "Out of stock (0)", test: (q: number) => q <= 0 },
  { name: "Low (1–10)", test: (q: number) => q > 0 && q <= 10 },
  { name: "Medium (11–50)", test: (q: number) => q > 10 && q <= 50 },
  { name: "High (51+)", test: (q: number) => q > 50 },
];

export default function ReportsPage() {
  const { state, visibleDepartments, activeDepartment, role, subDepartmentsFor } = useApp();
  const searchParams = useSearchParams();
  const isGlobal = role === "super-admin" || role === "admin";

  const urlDept = searchParams.get("dept");
  const [dept, setDept] = React.useState(
    isGlobal
      ? (urlDept && [...visibleDepartments, "all"].includes(urlDept) ? urlDept : activeDepartment)
      : activeDepartment,
  );
  const [subLevels, setSubLevels] = React.useState<string[]>(() => {
    const sub = searchParams.get("sub");
    return sub ? [sub] : [];
  });

  const [reportView, setReportView] = React.useState<"inventory" | "tickets">("inventory");
  const [dateFilter, setDateFilter] = React.useState<"today" | "week" | "month" | "all">("all");

  const deptObj = dept !== "all" ? state.departments.find((d) => d.name === dept) : null;
  const topSubs = useMemo(
    () => (deptObj ? subDepartmentsFor(deptObj.name) : []),
    [deptObj, subDepartmentsFor],
  );

  const levelChain = useMemo(() => {
    const chain: { options: SubDepartment[]; value: string }[] = [];
    let pool = topSubs;
    chain.push({ options: pool, value: subLevels[0] ?? "" });
    for (let k = 0; k < subLevels.length; k++) {
      const node = subLevels[k] ? findNode(pool, subLevels[k]) : null;
      if (!node || node.children.length === 0) break;
      pool = node.children;
      chain.push({ options: pool, value: subLevels[k + 1] ?? "" });
    }
    return chain;
  }, [topSubs, subLevels]);

  const setLevel = (k: number, v: string) => {
    const next = [...subLevels].slice(0, k);
    if (v) next[k] = v;
    setSubLevels(next);
  };

  const scopeItems = useMemo(() => {
    const base =
      dept === "all"
        ? state.inventory
        : state.inventory.filter((i) => i.department === dept);
    const deepest = [...subLevels].reverse().find((v) => v.trim() !== "");
    if (!deepest || !deptObj) return base;
    const node = findNode(topSubs, deepest);
    if (!node) return base;
    const names = subtreeNames(node);
    return base.filter((i) => names.includes(i.department));
  }, [state.inventory, dept, subLevels, deptObj, topSubs]);

  const ticketReportData = React.useMemo<any[]>(() => [], [dateFilter]);

  const byCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const i of scopeItems) acc[i.category] = (acc[i.category] ?? 0) + 1;
    return Object.entries(acc)
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items - a.items);
  }, [scopeItems]);

  const histogram = useMemo(
    () =>
      HISTOGRAM_BINS.map((b) => ({
        name: b.name,
        items: scopeItems.filter((i) => b.test(i.quantity)).length,
      })),
    [scopeItems],
  );

  const byScope = useMemo(() => {
    if (dept === "all") {
      return state.departments.map((d) => ({
        name: d.name,
        items: state.inventory.filter((i) => i.department === d.name).length,
        color: d.color,
      }));
    }
    const rows = topSubs.map((s) => {
      const names = subtreeNames(s);
      return {
        name: s.name,
        items: scopeItems.filter((i) => names.includes(i.department)).length,
        color: s.color,
      };
    });
    const unassigned = scopeItems.filter((i) => false).length;
    if (unassigned > 0)
      rows.push({ name: "Department level", items: unassigned, color: "#94a3b8" });
    return rows;
  }, [dept, state.departments, state.inventory, topSubs, scopeItems]);

  const topItems = useMemo(
    () => [...scopeItems].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    [scopeItems],
  );

  const scopeLabel =
    dept === "all"
      ? "All Departments"
      : [...subLevels].reverse().find((v) => v.trim() !== "")
        ? `${dept} / ${[...subLevels].reverse().find((v) => v.trim() !== "")}`
        : dept;

  const exportInventoryCSV = () => {
    downloadCSV("inventory-report.csv", [
      { Name: "Name", "Reg No.": "Reg No.", Category: "Category", Department: "Department", Quantity: "Quantity", Status: "Status" },
      ...scopeItems.map((i) => ({ Name: i.deviceName, "Reg No.": i.sku, Category: i.category, Department: i.department, Quantity: i.quantity, Status: i.status })),
    ]);
    toast.success("Inventory report exported as CSV");
  };

  const exportTicketsCSV = () => {
    downloadCSV("tickets-report.csv", [
      { "S/N": "S/N", "JOB NO": "JOB NO", EQPT: "EQPT", "REGD NO": "REGD NO", QTY: "QTY", "SEC/DEPT": "SEC/DEPT", "DATE IN": "DATE IN", "DATE OUT": "DATE OUT", "TYPE OF FAULT": "TYPE OF FAULT", PROGRESS: "PROGRESS", "ACTION BY TEAM": "ACTION BY TEAM" },
      ...ticketReportData.map((t) => ({ "S/N": t.sNo, "JOB NO": t.jobNo, EQPT: t.eqpt, "REGD NO": t.regNo, QTY: t.qty, "SEC/DEPT": t.secDept, "DATE IN": t.dateIn, "DATE OUT": t.dateOut, "TYPE OF FAULT": t.typeOfFault, PROGRESS: t.progress, "ACTION BY TEAM": t.actionByTech })),
    ]);
    toast.success("Ticket report exported as CSV");
  };

  const exportTicketsPDF = () => {
    if (ticketReportData.length === 0) {
      toast.error("No ticket data to export");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    doc.setFontSize(10);
    doc.text("Ticket Report", 14, 10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 16);

    const columns = [
      { header: "S/N", dataKey: "sNo", width: 12 },
      { header: "JOB NO", dataKey: "jobNo", width: 25 },
      { header: "EQPT", dataKey: "eqpt", width: 30 },
      { header: "REGD NO", dataKey: "regNo", width: 25 },
      { header: "QTY", dataKey: "qty", width: 12 },
      { header: "SEC/DEPT", dataKey: "secDept", width: 30 },
      { header: "DATE IN", dataKey: "dateIn", width: 22 },
      { header: "DATE OUT", dataKey: "dateOut", width: 22 },
      { header: "TYPE OF FAULT", dataKey: "typeOfFault", width: 35 },
      { header: "PROGRESS", dataKey: "progress", width: 20 },
      { header: "ACTION BY TEAM", dataKey: "actionByTech", width: 25 },
    ];

    const rows = ticketReportData.map((t) => [
      t.sNo,
      t.jobNo,
      t.eqpt,
      t.regNo,
      t.qty,
      t.secDept,
      t.dateIn,
      t.dateOut,
      t.typeOfFault,
      t.progress,
      t.actionByTech,
    ]);

    (doc as any).autoTable({
      head: [columns.map((c) => c.header)],
      body: rows,
      startY: 22,
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 12 },
        5: { cellWidth: 30 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22 },
        8: { cellWidth: 35 },
        9: { cellWidth: 20 },
        10: { cellWidth: 25 },
      },
    });

    doc.save("tickets-report.pdf");
    toast.success("Ticket report exported as PDF");
  };

  const handleDeptChange = (d: string) => {
    setDept(d);
    setSubLevels([]);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description={isGlobal ? "Department inventory reports with sub-level filtering." : "Your department's inventory report with sub-level filtering."}
        breadcrumb={[{ label: "Reports" }]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {isGlobal ? (
              <Select value={dept} onValueChange={handleDeptChange}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {visibleDepartments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className="bg-muted rounded-md px-3 py-1.5 text-sm font-medium">{dept}</span>
            )}
            {dept !== "all" && levelChain.map((level, k) => (
              <Select key={k} value={level.value || "__all"} onValueChange={(v) => setLevel(k, v === "__all" ? "" : v)}>
                <SelectTrigger className="w-44"><SelectValue placeholder={k === 0 ? "All sub-departments" : `All layer ${k + 1}`} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{k === 0 ? "All sub-departments" : `All layer ${k + 1}`}</SelectItem>
                  {level.value && !level.options.some((s) => s.name === level.value) && (
                    <SelectItem value={level.value}>{level.value} (kept)</SelectItem>
                  )}
                  {level.options.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ))}
            <Tabs value={reportView} onValueChange={(v) => setReportView(v as "inventory" | "tickets")} className="h-auto border-none">
              <TabsList className="px-2 bg-muted border-none rounded-md">
                <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
                <TabsTrigger value="tickets">Ticket Report</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as "today" | "week" | "month" | "all")}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Date Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            {reportView === "inventory" ? (
              <Button variant="outline" onClick={exportInventoryCSV}><FileDown className="size-4" /> Export CSV</Button>
            ) : (
              <>
                <Button variant="outline" onClick={exportTicketsCSV}><FileDown className="size-4" /> Export CSV</Button>
                <Button onClick={exportTicketsPDF}><FileDown className="size-4" /> Export PDF</Button>
              </>
            )}
          </div>
        }
      />

      {/* Inventory Report View */}
      {reportView === "inventory" && (
        <>
          <p className="text-muted-foreground text-sm">
            Showing inventory for <span className="text-foreground font-medium">{scopeLabel}</span> · {scopeItems.length} item{scopeItems.length === 1 ? "" : "s"}
          </p>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Items by Category</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()} items`, "Items"]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="items" radius={[4, 4, 0, 0]}>
                      {byCategory.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Stock Quantity Histogram</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()} items`, "Items"]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="items" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">{dept === "all" ? "Items by Department" : "Items by Sub-department"}</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byScope} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()} items`, "Items"]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="items" radius={[4, 4, 0, 0]}>
                      {byScope.map((row, i) => <Cell key={i} fill={row.color ?? palette[i % palette.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Top Items by Quantity</CardTitle>
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
                          <p className="text-muted-foreground font-mono text-xs">Reg No. {i.sku}</p>
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
        </>
      )}

      {/* Ticket Report View */}
      {reportView === "tickets" && (
        <>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Ticket Report · {ticketReportData.length} ticket{ticketReportData.length === 1 ? "" : "s"}
            </p>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-center">S/N</TableHead>
                    <TableHead className="text-left">JOB NO</TableHead>
                    <TableHead className="text-left">EQPT</TableHead>
                    <TableHead className="text-left">REGD NO</TableHead>
                    <TableHead className="text-right">QTY</TableHead>
                    <TableHead className="text-left">SEC/DEPT</TableHead>
                    <TableHead className="text-left">DATE IN</TableHead>
                    <TableHead className="text-left">DATE OUT</TableHead>
                    <TableHead className="text-left">TYPE OF FAULT</TableHead>
                    <TableHead className="text-left">PROGRESS</TableHead>
                    <TableHead className="text-left">ACTION BY TEAM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketReportData.map((t) => (
                    <TableRow key={t.jobNo}>
                      <TableCell className="text-center text-sm">{t.sNo}</TableCell>
                      <TableCell className="text-sm font-mono">{t.jobNo}</TableCell>
                      <TableCell className="text-sm">{t.eqpt}</TableCell>
                      <TableCell className="text-sm font-mono">{t.regNo}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{t.qty}</TableCell>
                      <TableCell className="text-sm">{t.secDept}</TableCell>
                      <TableCell className="text-sm font-mono">{t.dateIn}</TableCell>
                      <TableCell className="text-sm font-mono">{t.dateOut}</TableCell>
                      <TableCell className="text-sm">{t.typeOfFault}</TableCell>
                      <TableCell className="text-sm"><StatusBadge status={t.progress as any} /></TableCell>
                      <TableCell className="text-sm">{t.actionByTech}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}