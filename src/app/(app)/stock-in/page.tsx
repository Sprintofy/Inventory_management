"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileDown, FileUp, PackageMinus, Plus } from "lucide-react";
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
  StockInFilters,
  emptyStockInFilters,
  type StockInFiltersState,
} from "@/components/inventory/InventoryFilters";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { downloadCSV, formatDate, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function StockInPage() {
  const { state, activeDepartment, user, fetchStockIn } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] =
    React.useState<StockInFiltersState>(emptyStockInFilters);
  const pageSize = 10;

  const scopeLabel =
    activeDepartment === "all"
      ? "All Departments"
      : `${activeDepartment}${user?.subDepartment ? ` / ${user.subDepartment}` : ""}`;

  const suppliers = React.useMemo(
    () =>
      [...new Set(
        state.inventory
          .map((i) => i.supplier)
          .filter((s): s is string => !!s),
      )].sort(),
    [state.inventory],
  );

  React.useEffect(() => {
    fetchStockIn(filters);
  }, [filters, fetchStockIn]);

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
        "Work Order Id": r.workOrderId,
        "Job No": r.jobNo,
        Date: r.dateIn,
        Item: r.itemName,
        Type: r.productType,
        Quantity: r.quantity,
        Department: r.department,
        "Date Out": r.dateOut ?? "",
        Remarks: r.remarks ?? "",
        Status: r.status,
        "Created By": r.createdBy,
      })),
    );
    toast.success(`Exported ${records.length} records to CSV`);
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
              <FileDown className="size-4" /> Export
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
            <p className="text-muted-foreground text-sm tabular-nums">
              {records.length} inbound record{records.length !== 1 ? "s" : ""} ·{" "}
              {scopeLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StockInFilters
              filters={filters}
              onChange={setFilters}
              suppliers={suppliers}
            />
            {(search ||
              Object.values(filters).some((v) => v !== "all" && v !== "")) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8 text-xs"
                onClick={() => {
                  setSearch("");
                  setFilters(emptyStockInFilters);
                  setPage(1);
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Job No</TableHead>
              <TableHead>Work Order Id</TableHead>
              <TableHead>Date In</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
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
                  <TableCell className="font-mono text-xs font-medium">
                    {r.jobNo}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.workOrderId}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(r.dateIn)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {r.itemName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.productType}
                  </TableCell>
                  <TableCell className="text-sm font-semibold tabular-nums">
                    {formatNumber(r.quantity)}
                  </TableCell>
                  <TableCell>
                    <span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">
                      {r.department}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
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
