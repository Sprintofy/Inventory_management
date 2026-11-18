"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FileDown, FileUp, Plus } from "lucide-react";
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

export default function InventoryPage() {
  const { departmentItems, can, activeDepartment, user } = useApp();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = React.useState<InventoryFiltersState>(emptyFilters);

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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description={activeDepartment === "all" ? "All departments stock." : `${activeDepartment} stock only.`}
        breadcrumb={[{ label: "Inventory" }]}
        actions={
          <>
            <Button variant="outline" onClick={exportExcel}><FileDown className="size-4" /> Export to Excel</Button>
            <Button variant="outline" onClick={exportAll}>Export CSV</Button>
            {can("inventory.manage") && (
              <Button onClick={() => { window.location.href = "/inventory/create"; }}>
                <Plus className="size-4" /> Add Item
              </Button>
            )}
          </>
        }
      />
    
      {/* Count header — All vs Dept (Mar 4). No Current/Daily/Movement tabs. */}
      <div className="bg-card flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 shadow-sm">
        <p className="text-sm">
          <span className="text-2xl font-semibold tabular-nums">{filtered.length}</span>
          <span className="text-muted-foreground ml-2">item{filtered.length !== 1 ? "s" : ""} {activeDepartment === "all" ? "· All Departments" : `· ${activeDepartment}${user?.subDepartment ? ` / ${user.subDepartment}` : ""}`}</span>
        </p>
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
              {(search || Object.values(filters).some((v) => v !== "all" && v !== "")) && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setSearch(""); setFilters(emptyFilters); }}>
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <InventoryTable
            items={filtered}
            onEdit={() => {}}
          />
      </div>

    </div>
  );
}