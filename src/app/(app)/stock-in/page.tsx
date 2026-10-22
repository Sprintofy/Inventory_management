"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, FileDown, FileUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { StockInDialog } from "@/components/inventory/StockDialogs";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { downloadCSV, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StockInFilters, emptyStockInFilters, type StockInFiltersState } from "@/components/inventory/InventoryFilters";

export default function StockInPage() {
  const { state, activeDepartment, user } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<StockInFiltersState>(emptyStockInFilters);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const pageSize = 10;

  const scopeLabel = activeDepartment === "all" ? "All Departments" : `${activeDepartment}${user?.subDepartment ? ` / ${user.subDepartment}` : ""}`;

  const suppliers = React.useMemo(() => [...new Set(state.stockIn.map((r) => r.supplier))].sort(), [state.stockIn]);

  const records = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.stockIn.filter((r) => {
      if (activeDepartment !== "all" && r.department !== activeDepartment) return false;
      if (term && !(r.itemName.toLowerCase().includes(term) || r.reference.toLowerCase().includes(term) || r.supplier.toLowerCase().includes(term) || r.createdBy.toLowerCase().includes(term))) return false;
      if (filters.supplier !== "all" && r.supplier !== filters.supplier) return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.dateFrom && new Date(r.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(r.date) > new Date(filters.dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [state.stockIn, activeDepartment, search, filters]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  const doImport = () => toast.success("Import: choose a CSV to bulk-add stock in records (demo)");
  const doExportCSV = () => {
    downloadCSV(`stock-in-${new Date().toISOString().slice(0, 10)}.csv`, records.map((r) => ({ Reference: r.reference, Date: r.date, Item: r.itemName, Quantity: r.quantity, Department: r.department, CreatedBy: r.createdBy, Status: r.status })));
    toast.success(`Exported ${records.length} records to CSV`);
  };
  const doExportExcel = () => {
    downloadCSV(`stock-in-${new Date().toISOString().slice(0, 10)}.csv`, records.map((r) => ({ Reference: r.reference, Date: r.date, Item: r.itemName, Quantity: r.quantity, Department: r.department, CreatedBy: r.createdBy, Status: r.status })));
    toast.success(`Exported ${records.length} records to Excel`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock In"
        description={`Inbound inventory · ${scopeLabel}`}
        breadcrumb={[{ label: "Stock In" }]}
        actions={
          <>
            <Button variant="outline" onClick={doImport}><FileUp className="size-4" /> Import</Button>
            <Button variant="outline" onClick={doExportCSV}><FileDown className="size-4" /> Export</Button>
            <Button variant="outline" onClick={doExportExcel}><FileDown className="size-4" /> Export Excel</Button>
            <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Record Stock In</Button>
          </>
        }
      />

      <Card className="py-4">
        <CardContent className="space-y-3 px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} onClear={() => setSearch("")} placeholder="Search by item, reference, supplier…" className="md:max-w-sm" />
            <p className="text-muted-foreground text-sm tabular-nums">
              {records.length} inbound record{records.length !== 1 ? "s" : ""} · {scopeLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StockInFilters filters={filters} onChange={setFilters} suppliers={suppliers} />
            {(search || Object.values(filters).some((v) => v !== "all" && v !== "")) && (
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-xs" onClick={() => { setSearch(""); setFilters(emptyStockInFilters); setPage(1); }}>Clear all</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={7} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={7} className="p-0">
                <EmptyState icon={ArrowDownToLine} title="No stock in records" description="Record incoming inventory to get started." action={{ label: "Record Stock In", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => {
                const item = state.inventory.find((i) => i.deviceName === r.itemName);
                if (item) router.push(`/inventory/${item.id}`);
              }}>
                <TableCell className="font-mono text-xs font-medium">{r.reference}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(r.date)}</TableCell>
                <TableCell className="text-sm font-medium">{r.itemName}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">+{r.quantity}</TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{r.department}</span></TableCell>
                <TableCell className="text-muted-foreground text-xs">{r.createdBy}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3">
          <Pagination total={records.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      <StockInDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
