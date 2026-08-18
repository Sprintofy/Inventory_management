"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { InventoryFilters, emptyFilters, type InventoryFiltersState } from "@/components/inventory/InventoryFilters";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryForm } from "@/components/inventory/InventoryForm";
import { StockInDialog, StockOutDialog } from "@/components/inventory/StockDialogs";
import { useApp } from "@/store/app-store";
import { useFakeLoadingOn } from "@/hooks/use-fake-loading";
import { downloadCSV, formatDate, formatCurrency, toast } from "@/lib/toast-utils";
import type { InventoryItem } from "@/types";

export default function InventoryPage() {
  const { departmentItems, can } = useApp();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = React.useState<InventoryFiltersState>(emptyFilters);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<InventoryItem | null>(null);
  const [stockInOpen, setStockInOpen] = React.useState(false);
  const [stockOutOpen, setStockOutOpen] = React.useState(false);
  const [stockTarget, setStockTarget] = React.useState<InventoryItem | null>(null);
  const loading = useFakeLoadingOn(searchParams.toString());

  React.useEffect(() => {
    if (searchParams.get("new") === "1") setFormOpen(true);
  }, [searchParams]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return departmentItems.filter((i) => {
      if (term && !(
        i.name.toLowerCase().includes(term) ||
        i.sku.toLowerCase().includes(term) ||
        (i.serialNumber ?? "").toLowerCase().includes(term) ||
        i.category.toLowerCase().includes(term) ||
        i.location.toLowerCase().includes(term)
      )) return false;
      if (filters.department !== "all" && i.department !== filters.department) return false;
      if (filters.category !== "all" && i.category !== filters.category) return false;
      if (filters.location !== "all" && i.location !== filters.location) return false;
      if (filters.status !== "all" && i.status !== filters.status) return false;
      if (filters.supplier !== "all" && i.supplier !== filters.supplier) return false;
      if (filters.dateFrom && new Date(i.lastUpdated) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(i.lastUpdated) > new Date(filters.dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [departmentItems, search, filters]);

  const exportAll = () => {
    const rows = filtered.map((i) => ({
      Item: i.name, SKU: i.sku, Category: i.category, Department: i.department, Location: i.location,
      Quantity: i.quantity, "Reorder Level": i.reorderLevel, "Unit Cost": i.unitCost, "Total Value": i.quantity * i.unitCost,
      Status: i.status, "Last Updated": formatDate(i.lastUpdated),
    }));
    downloadCSV(`inventory-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Exported ${rows.length} items to CSV`);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  const openStockIn = (item: InventoryItem) => {
    setStockTarget(item);
    setStockInOpen(true);
  };

  const openStockOut = (item: InventoryItem) => {
    setStockTarget(item);
    setStockOutOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="Manage and track all items across your organization."
        breadcrumb={[{ label: "Inventory" }]}
        actions={
          <>
            <Button variant="outline" onClick={exportAll}>Export</Button>
            {can("inventory.manage") && (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="size-4" /> Add Item
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by item name, SKU, serial number, category…"
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
        loading={loading}
        search={search}
        onEdit={openEdit}
        onStockIn={openStockIn}
        onStockOut={openStockOut}
      />

      <InventoryForm open={formOpen} onOpenChange={setFormOpen} item={editing} />
      <StockInDialog open={stockInOpen} onOpenChange={setStockInOpen} presetItem={stockTarget} />
      <StockOutDialog open={stockOutOpen} onOpenChange={setStockOutOpen} presetItem={stockTarget} />
    </div>
  );
}