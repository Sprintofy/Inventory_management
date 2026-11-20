"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FileDown, FileUp, Plus, Filter, X, BarChart3, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { InventoryFilters, emptyFilters, type InventoryFiltersState } from "@/components/inventory/InventoryFilters";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryImportDialog } from "@/components/inventory/InventoryImportDialog";
import { useApp } from "@/store/app-store";
import { downloadCSV, formatDate } from "@/lib/toast-utils";
import { exportInventoryExcel } from "@/lib/excel";
import type { InventoryItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { getIconBgClass, getCardGradient, CHART_PALETTE, getStatusColors, getPageGradient } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const { departmentItems, can, activeDepartment, user } = useApp();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = React.useState<InventoryFiltersState>(emptyFilters);
  const [importOpen, setImportOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return departmentItems.filter((i) => {
      if (term && !(
        (i.deviceName ?? '').toLowerCase().includes(term) ||
        (i.sku ?? '').toLowerCase().includes(term) ||
        (i.category ?? '').toLowerCase().includes(term)
      )) return false;
      if (filters.department !== "all" && i.department !== filters.department) return false;
      if (filters.category !== "all" && i.category !== filters.category) return false;
      if (filters.type !== "all" && i.type !== filters.type) return false;
      if (filters.dateFrom && new Date(i.lastUpdated) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(i.lastUpdated) > new Date(filters.dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [departmentItems, search, filters]);

  const exportAll = () => {
    const rows = filtered.map((i) => ({
      ID: i.id,
      "Device Name": i.deviceName,
      Brand: i.brand,
      Type: i.type,
      "Maintenance Type": i.maintenanceType ?? "",
      "Date of Vintage": i.dateOfVintage ?? "",
      Category: i.category,
      Notes: i.notes ?? "",
      "Roll of CPU": i.cpuType ?? "",
      "Reg No.": i.sku,
      Quantity: i.quantity,
      Status: i.status,
      "Last Updated": formatDate(i.lastUpdated),
      "Created At": formatDate(i.createdAt),
      Department: i.department,
    }));
    downloadCSV(`inventory-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Exported ${rows.length} items to CSV`);
  };

  const exportExcel = () => {
    exportInventoryExcel(filtered);
    toast.success(`Exported ${filtered.length} items to Excel`);
  };

  const hasActiveFilters = search || Object.values(filters).some((v) => v !== "all" && v !== "");

  const pageGradient = getPageGradient("inventory");

  return (
    <div className={cn("min-h-screen", pageGradient)}>
      <div className="space-y-5 p-4 sm:p-6">
        <PageHeader
          title="Inventory"
          description={activeDepartment === "all" ? "All departments stock." : `${activeDepartment} stock only.`}
          breadcrumb={[{ label: "Inventory" }]}
          actions={
            <>
              <Button variant="outline" onClick={exportExcel}><FileDown className="size-4" /> Export Excel</Button>
              <Button variant="outline" onClick={exportAll}>Export CSV</Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}><FileUp className="size-4" /> Import</Button>
              {can("inventory.manage") && (
                <Button onClick={() => { window.location.href = "/inventory/create"; }}>
                  <Plus className="size-4" /> Add Item
                </Button>
              )}
            </>
          }
        />

        {/* Summary Stats Bar */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(14,165,233,0.1) 100%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl size-11 bg-primary/20 text-primary">
                <Plus className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Range Of Devices</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{filtered.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(16,185,129,0.1) 100%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl size-11 bg-sky-500/20 text-sky-500">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Depth of Devices(Total Quantity of All Devices)</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{filtered.reduce((s, i) => s + i.quantity, 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl size-11 bg-violet-500/20 text-violet-500">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Categories</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{[...new Set(filtered.map(i => i.category))].length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search by device name, Reg No., category…"
              className="md:max-w-sm"
            />
            <div className="flex items-center gap-2">
              <InventoryFilters filters={filters} onChange={setFilters} />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setSearch(""); setFilters(emptyFilters); }}>
                  <X className="size-3.5 mr-1.5" /> Clear all
                </Button>
              )}
            </div>
          </div>

          <InventoryTable
            items={filtered}
            onEdit={() => {}}
          />
        </div>

        <InventoryImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </div>
    </div>
  );
}