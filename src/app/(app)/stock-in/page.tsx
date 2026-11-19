"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileDown, FileUp, PackageMinus, Plus, FileText, Search, Filter, X, Calendar, Package, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { downloadCSV, formatDate, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getIconBgClass, getCardGradient, CHART_PALETTE, getStatusColors } from "@/lib/theme";

// Register autoTable plugin
(jsPDF as any).API.autoTable = autoTable;

type DateRange = "all" | "today" | "custom";

const localToday = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

export default function StockInPage() {
  const { state, activeDepartment, user, fetchStockIn, fetchStockInStats } =
    useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [range, setRange] = React.useState<DateRange>("today");
  const [dateFrom, setDateFrom] = React.useState(localToday);
  const [dateTo, setDateTo] = React.useState(localToday);
  const [maintenanceType, setMaintenanceType] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const pageSize = 10;

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("inventoryos-token");
    }
    return null;
  };

  const scopeLabel =
    activeDepartment === "all"
      ? "All Departments"
      : `${activeDepartment} stock only.`;

  const getDateRange = () => {
    let from = "";
    let to = "";
    if (range === "today") {
      from = localToday();
      to = from;
    } else if (range === "custom") {
      from = dateFrom;
      to = dateTo;
    }
    return { from, to };
  };

  const { from, to } = getDateRange();

  const rangeLabel = range === "today" ? "Today" : range === "all" ? "All Records" : `${dateFrom} to ${dateTo}`;

  const skuByItemId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const i of state.inventory) map.set(i.id, i.sku);
    return map;
  }, [state.inventory]);

  const regNoOf = (itemId: string) => skuByItemId.get(itemId) ?? "-";

  React.useEffect(() => {
    fetchStockIn({
      status: "all",
      dateFrom: from,
      dateTo: to,
      type,
      maintenanceType,
      category,
    });
    fetchStockInStats({
      dateFrom: from,
      dateTo: to,
      department: activeDepartment,
      type,
      maintenanceType,
      category,
    });
    setPage(1);
  }, [
    range,
    dateFrom,
    dateTo,
    activeDepartment,
    type,
    maintenanceType,
    category,
    fetchStockIn,
    fetchStockInStats,
    from,
    to,
  ]);

  const records = React.useMemo(() => {
    return state.stockInRecords
      .filter((r) => {
        const term = search.trim().toLowerCase();
        if (term && !(
          (r.itemName ?? '').toLowerCase().includes(term) ||
          (r.jobNo ?? '').toLowerCase().includes(term) ||
          (r.workOrderId ?? '').toLowerCase().includes(term) ||
          (r.department ?? '').toLowerCase().includes(term)
        )) return false;
        if (activeDepartment !== "all" && r.department !== activeDepartment) return false;
        return true;
      })
      .sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime());
  }, [state.stockInRecords, activeDepartment, search]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  const doExportCSV = () => {
    downloadCSV(
      `stock-in-${new Date().toISOString().slice(0, 10)}.csv`,
      records.map((r) => ({
        "S/N": r.id,
        "JOB NO": r.jobNo,
        "EQPT NOMENCLATURE": r.itemName,
        "REGD NO": regNoOf(r.itemId),
        QTY: r.quantity,
        DEPT: r.department,
        "DATE IN": formatDate(r.dateIn),
        "DATE OUT": r.dateOut ? formatDate(r.dateOut) : "-",
      })),
    );
    toast.success(`Exported ${records.length} records to CSV`);
  };

  const doExportMIS = async () => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["authorization"] = token;
      const deptParam = activeDepartment === "all" ? "" : activeDepartment;

      // Determine date range for API query
      let queryFrom = from;
      let queryTo = to;
      let earliestDateForLabel = "";

      if (range === "all") {
        // Fetch earliest transaction date for "all" range
        const earliestRes = await fetch(
          `/api/inventory/stock-in/earliest?department=${deptParam}`,
          { headers },
        );
        const earliestData = await earliestRes.json();
        earliestDateForLabel = earliestData.results || "";
        if (earliestDateForLabel) {
          const dt = new Date(earliestDateForLabel);
          queryFrom = dt.toISOString().slice(0, 10);
        }
        const today = new Date();
        queryTo = today.toISOString().slice(0, 10);
      }

      const misRes = await fetch(
        `/api/inventory/stock-in/mis?dateFrom=${queryFrom}&dateTo=${queryTo}&department=${deptParam}`,
        { headers },
      );
      if (!misRes.ok) throw new Error("Failed to fetch MIS data");
      const misData = await misRes.json();
      const misRows = misData.results || [];

      // For label, use earliestDateForLabel if we fetched it, otherwise fetch it
      let labelEarliestDate = earliestDateForLabel;
      if (!labelEarliestDate && range === "all") {
        const earliestRes = await fetch(
          `/api/inventory/stock-in/earliest?department=${deptParam}`,
          { headers },
        );
        const earliestData = await earliestRes.json();
        labelEarliestDate = earliestData.results || "";
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      }) as any;

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 12;

      // Title: MIS CELL IT EQPT REPAIR STATE
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const title = "MIS CELL IT EQPT REPAIR STATE";
      doc.text(title, pageWidth / 2, y, { align: "center" });
      y += 7;

      // Date range line
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      let dateLabel = "";
      if (range === "today") {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, "0");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[today.getMonth()];
        const year = today.getFullYear();
        dateLabel = `${day} ${month} ${year}`;
      } else if (range === "custom") {
        const fmt = (d: string) => {
          const dt = new Date(d);
          const day = dt.getDate().toString().padStart(2, "0");
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const month = months[dt.getMonth()];
          const year = dt.getFullYear();
          return `${day} ${month} ${year}`;
        };
        dateLabel = `${fmt(from)} to ${fmt(to)}`;
      } else {
        if (labelEarliestDate) {
          const dt = new Date(labelEarliestDate);
          const day = dt.getDate().toString().padStart(2, "0");
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const month = months[dt.getMonth()];
          const year = dt.getFullYear();
          const today = new Date();
          const td = today.getDate().toString().padStart(2, "0");
          const tm = months[today.getMonth()];
          const ty = today.getFullYear();
          dateLabel = `${day} ${month} ${year} to ${td} ${tm} ${ty}`;
        }
      }
      doc.text(dateLabel, pageWidth / 2, y, { align: "center" });
      y += 8;

      // Table
      const columns = ["S/No", "EQPT NOMENCLATURE", "BFF", "IN", "TOTAL", "OUT", "BAL U/R"];
      const rows = misRows.map((r: any, idx: number) => {
        const bff = Number(r.bff || 0);
        const inQty = Number(r.in_qty || 0);
        const outQty = Number(r.out_qty || 0);
        const total = bff + inQty;
        const bal = total - outQty;
        return [
          String(idx + 1),
          r.category,
          bff,
          inQty,
          total,
          outQty,
          bal,
        ];
      });

      // Add totals row
      const totalBff = rows.reduce((s: number, r: any) => s + Number(r[2]), 0);
      const totalIn = rows.reduce((s: number, r: any) => s + Number(r[3]), 0);
      const totalTotal = rows.reduce((s: number, r: any) => s + Number(r[4]), 0);
      const totalOut = rows.reduce((s: number, r: any) => s + Number(r[5]), 0);
      const totalBal = rows.reduce((s: number, r: any) => s + Number(r[6]), 0);
      rows.push(["", "TOTAL", totalBff, totalIn, totalTotal, totalOut, totalBal]);

      // Set default font to avoid "Cannot read properties of undefined (reading 'getFontSize')" error
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      // Call autoTable as a function with doc as first argument
      autoTable(doc, {
        startY: y,
        head: [columns],
        body: rows,
        theme: "grid",
        margin: { left: 14, right: 14 },
        tableWidth: "auto",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
          valign: "middle",
          cellPadding: 4,
          lineWidth: 0.3,
          lineColor: [226, 232, 240],
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          fontSize: 9,
          halign: "center",
          valign: "middle",
          cellPadding: 4,
          lineWidth: 0.3,
          lineColor: [226, 232, 240],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 14, halign: "center" },
          1: { cellWidth: 52, halign: "center" },
          2: { cellWidth: 22, halign: "center" },
          3: { cellWidth: 22, halign: "center" },
          4: { cellWidth: 22, halign: "center" },
          5: { cellWidth: 22, halign: "center" },
          6: { cellWidth: 22, halign: "center" },
        },
        didDrawPage: (data) => {
          // Draw table border
          if (data.cursor) {
            const pageWidth = doc.internal.pageSize.getWidth();
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.rect(data.settings.margin.left, data.settings.startY, pageWidth - data.settings.margin.left - data.settings.margin.right, data.cursor.y - data.settings.startY);
          }
        },
      });

      doc.save(`MIS-IT-EQPT-REPAIR-STATE-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("MIS Report exported as PDF");
    } catch (e) {
      toast.error("Failed to export MIS report");
    }
  };

  const handleStockOut = (id: number | string) => {
    router.push(`/stock-out/${id}`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock In"
        description={`Inbound inventory · ${scopeLabel}`}
        breadcrumb={[{ label: "Stock In" }]}
        actions={
          <>
            <Button variant="outline" onClick={doExportCSV}>
              <FileDown className="size-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={doExportMIS}>
              <FileText className="size-4" /> Export MIS PDF
            </Button>
            <Button
              onClick={() => {
                window.location.href = "/stock-in/create";
              }}
            >
              <Plus className="size-4" /> Record Stock In
            </Button>
          </>
        }
      />

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-sky-500/5 border-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl size-11 bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Records</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{records.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-sky-500/5 to-emerald-500/5 border-sky-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl size-11 bg-sky-500/10 text-sky-500">
              <Download className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total In</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatNumber(state.stockInStats.totalIn)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl size-11 bg-amber-500/10 text-amber-500">
              <PackageMinus className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Out</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatNumber(state.stockInStats.totalOut)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-rose-500/5 to-violet-500/5 border-rose-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl size-11 bg-rose-500/10 text-rose-500">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Net Balance</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatNumber(state.stockInStats.totalIn - state.stockInStats.totalOut)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl size-11 bg-violet-500/10 text-violet-500">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Range</p>
              <p className="text-xl font-bold text-foreground">{rangeLabel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="py-4">
        <CardContent className="space-y-3 px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onClear={() => setSearch("")}
              placeholder="Search by item, work order, job no…"
              className="md:max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg">
                <Calendar className="text-muted-foreground size-4" />
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Range</p>
                  <p className="text-foreground mt-0.5 text-lg font-bold">{rangeLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
                <Package className="text-primary size-4" />
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Total In</p>
                  <p className="text-foreground mt-0.5 text-xl font-bold tabular-nums">{formatNumber(state.stockInStats.totalIn)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                <PackageMinus className="text-amber-500 size-4" />
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Total Out</p>
                  <p className="text-foreground mt-0.5 text-xl font-bold tabular-nums">{formatNumber(state.stockInStats.totalOut)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={range}
              onValueChange={(v) => setRange(v as DateRange)}
            >
              <SelectTrigger
                size="sm"
                className="w-[150px]"
                aria-label="Date range"
              >
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {range === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDateFrom(v);
                    if (v && dateTo && v > dateTo) setDateTo(v);
                  }}
                  className="h-8 w-[150px] text-xs"
                  aria-label="Start date"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDateTo(v);
                    if (v && dateFrom && v < dateFrom) setDateFrom(v);
                  }}
                  className="h-8 w-[150px] text-xs"
                  aria-label="End date"
                />
              </div>
            )}
            <Select value={maintenanceType} onValueChange={setMaintenanceType}>
              <SelectTrigger
                size="sm"
                className="w-[170px]"
                aria-label="Maintenance type"
              >
                <SelectValue placeholder="All Maintenance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Maintenance</SelectItem>
                <SelectItem value="SER">SER</SelectItem>
                <SelectItem value="BER">BER</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger size="sm" className="w-[170px]" aria-label="Type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="W">W (Workshop)</SelectItem>
                <SelectItem value="C">C (Consumable)</SelectItem>
                <SelectItem value="NC">NC (Non-Consumable)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                size="sm"
                className="w-[170px]"
                aria-label="Category"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {state.categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S/N</TableHead>
              <TableHead>JOB NO</TableHead>
              <TableHead>EQPT NOMENCLATURE</TableHead>
              <TableHead>REGD NO</TableHead>
              <TableHead className="text-right">QTY</TableHead>
              <TableHead>DEPT</TableHead>
              <TableHead>DATE IN</TableHead>
              <TableHead>DATE OUT</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-2">
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!loading && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    icon={PackageMinus}
                    title="No stock-in records"
                    description="Receive inventory to start tracking inbound stock."
                    action={{
                      label: "Record Stock In",
                      onClick: () => {
                        window.location.href = "/stock-in/create";
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              paged.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    router.push(`/stock-out/${r.id}`);
                  }}
                >
                  <TableCell className="font-mono text-sm font-semibold">
                    {r.id}
                  </TableCell>
                  <TableCell className="text-foreground/80 text-sm font-medium">
                    {r.jobNo}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {r.itemName}
                  </TableCell>
                  <TableCell className="text-foreground/80 font-mono text-sm">
                    {regNoOf(r.itemId)}
                  </TableCell>
                  <TableCell className="text-base font-bold tabular-nums text-right">
                    {formatNumber(r.quantity)}
                  </TableCell>
                  <TableCell className="text-foreground/80 text-sm">
                    {r.department}
                  </TableCell>
                  <TableCell className="text-foreground/80 text-sm">
                    {formatDate(r.dateIn)}
                  </TableCell>
                  <TableCell className="text-foreground/80 text-sm">
                    {r.dateOut ? formatDate(r.dateOut) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status !== "Stock Out" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStockOut(r.id);
                        }}
                      >
                        <PackageMinus className="size-3.5" /> Stock Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {paged.length > 0 && (
          <div className="border-t px-4 py-3">
            <Pagination
              total={records.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}