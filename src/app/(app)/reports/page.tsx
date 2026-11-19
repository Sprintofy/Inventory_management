"use client";

import * as React from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FileDown, BarChart3, Filter, X, Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/store/app-store";
import { formatNumber } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import * as XLSX from "xlsx";
import { CHART_PALETTE, getCardGradient, getIconBgClass } from "@/lib/theme";

const HISTOGRAM_BINS = [
  { name: "Out of stock (0)", test: (q: number) => q <= 0 },
  { name: "Low (1–10)", test: (q: number) => q > 0 && q <= 10 },
  { name: "Medium (11–50)", test: (q: number) => q > 10 && q <= 50 },
  { name: "High (51+)", test: (q: number) => q > 50 },
];

export default function ReportsPage() {
  const { state, visibleDepartments, activeDepartment, role } = useApp();
  const searchParams = useSearchParams();
  const isGlobal = role === "super-admin" || role === "admin";

  const urlDept = searchParams.get("dept");
  const [dept, setDept] = React.useState(
    isGlobal
      ? (urlDept && [...visibleDepartments, "all"].includes(urlDept) ? urlDept : activeDepartment)
      : activeDepartment,
  );
  const [reportView, setReportView] = React.useState<"inventory" | "tickets">("inventory");
  const [dateFilter, setDateFilter] = React.useState<"today" | "week" | "month" | "year" | "all">("today");

  const scopeItems = useMemo(() => {
    const base =
      dept === "all"
        ? state.stockInRecords
        : state.stockInRecords.filter((i) => i.department === dept);
    return base;
  }, [state.stockInRecords, dept]);

  const ticketReportData = React.useMemo<any[]>(() => [], [dateFilter]);

  const byCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const i of scopeItems) acc[i.productType] = (acc[i.productType] ?? 0) + 1;
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
    return state.departments.map((d) => ({
      name: d.name,
      items: state.stockInRecords.filter((i) => i.department === d.name).length,
      color: d.color,
    }));
  }, [state.stockInRecords, state.departments]);

  const topItems = useMemo(
    () => [...scopeItems].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    [scopeItems],
  );

  // Build SKU lookup from inventory items so REGD NO shows the actual SKU
  const skuByItemId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const i of state.inventory) map.set(i.id, i.sku);
    return map;
  }, [state.inventory]);

  const regNoOf = (itemId: string) => skuByItemId.get(itemId) ?? "-";

  const scopeLabel = dept === "all" ? "All Departments" : dept;

  const formatDateDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const filteredStockIn = scopeItems.filter((i) => {
    if (!i.dateIn) return true;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const itemDate = i.dateIn.slice(0, 10);
    if (dateFilter === "today") return itemDate === todayStr;
    if (dateFilter === "week") return new Date(i.dateIn) >= weekAgo;
    if (dateFilter === "month") return new Date(i.dateIn) >= monthStart;
    if (dateFilter === "year") return new Date(i.dateIn) >= yearStart;
    return true;
  });

  const exportInventoryExcel = () => {
    const wsData: any[][] = [
      ["S/N", "JOB NO", "EQPT NOMENCLATURE", "REGD NO", "QTY", "DEPT", "DATE IN", "DATE OUT", "TYPE OF FAULT", "PROGRESS", "ACTION BY TEAM"],
    ];

    for (let i = 0; i < filteredStockIn.length; i++) {
      const r = filteredStockIn[i];
      wsData.push([
        i + 1,
        r.jobNo,
        r.itemName,
        regNoOf(r.itemId),
        r.quantity,
        r.department,
        formatDateDDMMYYYY(r.dateIn),
        r.dateOut ? formatDateDDMMYYYY(r.dateOut) : "-",
        r.defect ?? "-",
        r.status,
        r.remarks ?? "-",
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const lastRow = wsData.length;
    for (let r = 1; r <= lastRow; r++) {
      for (let c = 0; c < 11; c++) {
        const colChar = String.fromCharCode(65 + c);
        const cellRef = `${colChar}${r}`;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { sz: 9 },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: "d1d5db" },
              bottom: { style: "thin", color: "d1d5db" },
              left: { style: "thin", color: "d1d5db" },
              right: { style: "thin", color: "d1d5db" },
            },
          };
        }
      }
    }

    for (let c = 0; c < 11; c++) {
      const colChar = String.fromCharCode(65 + c);
      const cellRef = `${colChar}1`;
      ws[cellRef].s = {
        font: { sz: 10, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1F2937" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: "d1d5db" },
          bottom: { style: "thin", color: "d1d5db" },
          left: { style: "thin", color: "d1d5db" },
          right: { style: "thin", color: "d1d5db" },
        },
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock In Report");
    XLSX.writeFile(wb, `stock-in-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Stock In report exported as Excel");
  };

  const handleDeptChange = (d: string) => {
    setDept(d);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description={isGlobal ? "Department inventory reports." : "Your department's inventory report."}
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
              <span className="bg-primary/5 text-primary px-3 py-1.5 text-sm font-medium rounded-lg border border-primary/10">{dept}</span>
            )}
            <Tabs value={reportView} onValueChange={(v) => setReportView(v as "inventory" | "tickets")} className="h-auto border-none">
              <TabsList className="px-2 bg-primary/5 border-none rounded-md">
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
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            {reportView === "inventory" ? (
              <Button variant="outline" onClick={exportInventoryExcel}><FileDown className="size-4" /> Export Excel</Button>
            ) : (
              <>
                <Button variant="outline" onClick={exportInventoryExcel}><FileDown className="size-4" /> Export Excel</Button>
              </>
            )}
          </div>
        }
      />

      {/* Inventory Report View */}
      {reportView === "inventory" && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-sky-500/5 border-primary/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl size-11 bg-primary/10 text-primary">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Records</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{filteredStockIn.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden bg-gradient-to-br from-sky-500/5 to-emerald-500/5 border-sky-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl size-11 bg-sky-500/10 text-sky-500">
                  <Download className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Qty In</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{filteredStockIn.reduce((s, r) => s + r.quantity, 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl size-11 bg-amber-500/10 text-amber-500">
                  <Filter className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Categories</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{byCategory.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl size-11 bg-violet-500/10 text-violet-500">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Date Filter</p>
                  <p className="text-xl font-bold text-foreground capitalize">{dateFilter}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-muted-foreground text-sm mt-4">
            Showing inventory for <span className="text-foreground font-medium">{scopeLabel}</span> · {filteredStockIn.length} item{filteredStockIn.length === 1 ? "" : "s"}
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
                      {byCategory.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
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
              <CardHeader><CardTitle className="text-base">Items by Department</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byScope} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${Number(v ?? 0).toLocaleString()} items`, "Items"]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="items" radius={[4, 4, 0, 0]}>
                      {byScope.map((row, i) => <Cell key={i} fill={row.color ?? CHART_PALETTE[i % CHART_PALETTE.length]} />)}
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
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Department</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topItems.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <p className="font-semibold">{i.itemName}</p>
                          <p className="text-foreground/70 font-mono text-sm">Reg No. {i.itemId}</p>
                        </TableCell>
                        <TableCell className="text-sm font-semibold">{i.productType}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{i.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{i.department}</TableCell>
                        <TableCell><StatusBadge status={i.status as any} /></TableCell>
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
                      <TableCell className="text-center text-sm font-medium">{t.sNo}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold">{t.jobNo}</TableCell>
                      <TableCell className="font-medium">{t.eqpt}</TableCell>
                      <TableCell className="font-mono text-sm font-medium">{t.regNo}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{t.qty}</TableCell>
                      <TableCell className="text-sm">{t.secDept}</TableCell>
                      <TableCell className="font-mono text-sm">{t.dateIn}</TableCell>
                      <TableCell className="font-mono text-sm">{t.dateOut}</TableCell>
                      <TableCell className="text-sm">{t.typeOfFault}</TableCell>
                      <TableCell><StatusBadge status={t.progress as any} /></TableCell>
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