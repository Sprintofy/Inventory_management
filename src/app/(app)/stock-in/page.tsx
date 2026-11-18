"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileDown, FileUp, PackageMinus, Plus, FileText } from "lucide-react";
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
import "jspdf-autotable";

type DateRange = "all" | "today" | "custom";

const localToday = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
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

  const rangeLabel =
    range === "all"
      ? "All"
      : range === "today"
        ? "Today"
        : dateFrom && dateTo
          ? dateFrom === dateTo
            ? formatDate(dateFrom)
            : `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
          : dateFrom
            ? `From ${formatDate(dateFrom)}`
            : dateTo
              ? `Up to ${formatDate(dateTo)}`
              : "Custom";

  const records = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.stockInRecords.filter((r) => {
      if (activeDepartment !== "all" && r.department !== activeDepartment)
        return false;
      if (
        term &&
        !(
          r.itemName.toLowerCase().includes(term) ||
          r.workOrderId.toLowerCase().includes(term) ||
          r.jobNo.toLowerCase().includes(term) ||
          r.createdBy.toLowerCase().includes(term)
        )
      )
        return false;
      return true;
    });
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
      const res = await fetch(
        `/api/inventory/stock-in/mis?dateFrom=${from}&dateTo=${to}&department=${activeDepartment === "all" ? "" : activeDepartment}`,
      );
      if (!res.ok) throw new Error("Failed to fetch MIS data");
      const data = await res.json();
      const misRows = data.results || [];

      const earliestRes = await fetch(
        `/api/inventory/stock-in/earliest?department=${activeDepartment === "all" ? "" : activeDepartment}`,
      );
      const earliestData = await earliestRes.json();
      const earliestDate = earliestData.results || "";

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
        if (earliestDate) {
          const dt = new Date(earliestDate);
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

      doc.autoTable({
        startY: y,
        head: [columns],
        body: rows,
        theme: "striped",
        headStyles: {
          fillColor: [31, 41, 55],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 9,
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 50, halign: "left" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 20, halign: "center" },
          5: { cellWidth: 20, halign: "center" },
          6: { cellWidth: 20, halign: "center" },
        },
        didDrawPage: () => {},
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
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Range
                </p>
                <p className="text-foreground mt-0.5 text-lg font-bold">
                  {rangeLabel}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Total In
                </p>
                <p className="text-foreground mt-0.5 text-2xl font-bold tabular-nums">
                  {formatNumber(state.stockInStats.totalIn)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Total Out
                </p>
                <p className="text-foreground mt-0.5 text-2xl font-bold tabular-nums">
                  {formatNumber(state.stockInStats.totalOut)}
                </p>
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

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>S/N</TableHead>
              <TableHead>JOB NO</TableHead>
              <TableHead>EQPT NOMENCLATURE</TableHead>
              <TableHead>REGD NO</TableHead>
              <TableHead>QTY</TableHead>
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
                  className="cursor-pointer hover:bg-muted"
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
                  <TableCell className="text-base font-bold tabular-nums">
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
      </div>
    </div>
  );
}
