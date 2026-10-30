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
  StockOutFilters,
  emptyStockOutFilters,
  type StockOutFiltersState,
} from "@/components/inventory/InventoryFilters";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { downloadCSV, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function StockOutPage() {
  const { state, activeDepartment, user, fetchStockOut } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] =
    React.useState<StockOutFiltersState>(emptyStockOutFilters);
  const pageSize = 10;

  const scopeLabel =
    activeDepartment === "all"
      ? "All Departments"
      : `${activeDepartment}${user?.subDepartment ? ` / ${user.subDepartment}` : ""}`;

  // Fetch server-filtered records whenever filters change
  React.useEffect(() => {
    fetchStockOut(filters);
  }, [filters, fetchStockOut]);

  const records = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.stockOutRecords.filter((r) => {
      if (activeDepartment !== "all" && r.department !== activeDepartment)
        return false;
      if (
        term &&
        !(
          r.itemName.toLowerCase().includes(term) ||
          r.reference.toLowerCase().includes(term) ||
          r.purpose.toLowerCase().includes(term)
        )
      )
        return false;
      return true;
    });
  }, [state.stockOutRecords, activeDepartment, search]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  const doExport = () => {
    downloadCSV(
      `stock-out-${new Date().toISOString().slice(0, 10)}.csv`,
      records.map((r) => ({
        Reference: r.reference,
        Date: r.date,
        Item: r.itemName,
        Quantity: r.quantity,
        Department: r.department,
        Purpose: r.purpose,
        Status: r.status,
      })),
    );
    toast.success(`Exported ${records.length} records`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Out"
        description={`Issued inventory · ${scopeLabel}`}
        breadcrumb={[{ label: "Stock Out" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Import: choose a CSV (demo)")}
            >
              <FileUp className="size-4" /> Import
            </Button>
            <Button variant="outline" onClick={doExport}>
              <FileDown className="size-4" /> Export
            </Button>
            <Button
              onClick={() => {
                window.location.href = "/stock-out/create";
              }}
            >
              <Plus className="size-4" /> Record Stock Out
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
              placeholder="Search by item, reference, purpose…"
              className="md:max-w-sm"
            />
            <p className="text-muted-foreground text-sm tabular-nums">
              {records.length} issue record{records.length !== 1 ? "s" : ""} ·{" "}
              {scopeLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StockOutFilters filters={filters} onChange={setFilters} />
            {(search ||
              Object.values(filters).some((v) => v !== "all" && v !== "")) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8 text-xs"
                onClick={() => {
                  setSearch("");
                  setFilters(emptyStockOutFilters);
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
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-2">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!loading && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={PackageMinus}
                    title="No stock out records"
                    description="Issue inventory to start tracking outbound stock."
                    action={{
                      label: "Issue Stock",
                      onClick: () => {
                        window.location.href = "/stock-out/create";
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
                  className="cursor-pointer"
                  onClick={() => {
                    const item = state.inventory.find(
                      (i) => i.deviceName === r.itemName,
                    );
                    if (item) router.push(`/inventory/${item.id}`);
                  }}
                >
                  <TableCell className="font-mono text-xs font-medium">
                    {r.id}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(r.date)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {r.itemName}
                  </TableCell>
                  <TableCell>
                    <span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">
                      {r.department}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.purpose}
                  </TableCell>
                  <TableCell className="text-sm font-semibold tabular-nums">
                    {r.quantity}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3">
          <Pagination
            total={records.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
