"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Columns3,
  Download,
  FolderSync,
  MapPin,
  MoreHorizontal,
  Pencil,
  PackageMinus,
  PackagePlus,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, downloadCSV, formatCurrency, formatDate } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { InventoryItem } from "@/types";

export type SortKey = "name" | "quantity" | "value" | "updated";

interface InventoryTableProps {
  items: InventoryItem[];
  loading?: boolean;
  search: string;
  onEdit: (item: InventoryItem) => void;
  onStockIn: (item: InventoryItem) => void;
  onStockOut: (item: InventoryItem) => void;
}

const allColumns = [
  { key: "item", label: "Item" },
  { key: "sku", label: "SKU" },
  { key: "category", label: "Category" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
  { key: "quantity", label: "Quantity" },
  { key: "reorder", label: "Reorder Level" },
  { key: "unitCost", label: "Unit Cost" },
  { key: "value", label: "Total Value" },
  { key: "status", label: "Status" },
  { key: "updated", label: "Last Updated" },
  { key: "actions", label: "Actions" },
] as const;

export type ColumnKey = (typeof allColumns)[number]["key"];

function defaultColumns(): ColumnKey[] {
  return ["item", "sku", "category", "department", "quantity", "unitCost", "value", "status", "updated", "actions"];
}

export function InventoryTable({ items, loading, search, onEdit, onStockIn, onStockOut }: InventoryTableProps) {
  const { state, assignDepartment, changeLocation, can } = useApp();
  const router = useRouter();
  const [columns, setColumns] = React.useState<ColumnKey[]>(defaultColumns());
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = React.useState<null | "department" | "location">(null);
  const [bulkValue, setBulkValue] = React.useState("");

  React.useEffect(() => {
    const saved = localStorage.getItem("inventory-columns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ColumnKey[];
        setColumns(parsed.filter((c) => allColumns.some((a) => a.key === c)));
      } catch { /* ignore */ }
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem("inventory-columns", JSON.stringify(columns));
  }, [columns]);

  React.useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [items.length, search]);

  const sorted = React.useMemo(() => {
    const arr = [...items];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "quantity": return (a.quantity - b.quantity) * dir;
        case "value": return (a.quantity * a.unitCost - b.quantity * b.unitCost) * dir;
        case "updated": return (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) * dir;
        default: return 0;
      }
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paged.length > 0 && paged.every((i) => selected.has(i.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(paged.map((i) => i.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-foreground cursor-pointer">
      {label}
      {sortKey === k ? (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
    </button>
  );

  const doExport = () => {
    const rows = (selected.size > 0 ? items.filter((i) => selected.has(i.id)) : sorted).map((i) => ({
      Item: i.name, SKU: i.sku, Category: i.category, Department: i.department, Location: i.location,
      Quantity: i.quantity, "Reorder Level": i.reorderLevel, "Unit Cost": i.unitCost, "Total Value": i.quantity * i.unitCost,
      Status: i.status, "Last Updated": formatDate(i.lastUpdated),
    }));
    downloadCSV(`inventory-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Exported ${rows.length} items`);
  };

  const runBulkAction = () => {
    if (bulkDialog === "department" && bulkValue) {
      assignDepartment([...selected], bulkValue);
      toast.success(`Assigned ${selected.size} items to ${bulkValue}`);
    }
    if (bulkDialog === "location" && bulkValue) {
      changeLocation([...selected], bulkValue);
      toast.success(`Moved ${selected.size} items to ${bulkValue}`);
    }
    setBulkDialog(null);
    setBulkValue("");
    setSelected(new Set());
  };

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="bg-primary/5 border-primary/20 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <span className="bg-border mx-1 h-4 w-px" />
          <Button size="sm" variant="outline" onClick={doExport}><Download className="size-3.5" /> Export</Button>
          {can("inventory.manage") && (
            <>
              <Button size="sm" variant="outline" onClick={() => setBulkDialog("department")}><Building2 className="size-3.5" /> Assign Department</Button>
              <Button size="sm" variant="outline" onClick={() => setBulkDialog("location")}><MapPin className="size-3.5" /> Change Location</Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <p className="text-muted-foreground text-xs">
            {search ? (
              <>Results for “<span className="font-medium text-foreground">{search}</span>” — {items.length} item{items.length !== 1 ? "s" : ""}</>
            ) : (
              <>{items.length} item{items.length !== 1 ? "s" : ""} in inventory</>
            )}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Columns3 className="size-3.5" /> Columns <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Show / hide columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allColumns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={columns.includes(c.key)}
                  onCheckedChange={(checked) => {
                    setColumns((prev) => (checked ? [...prev, c.key] : prev.filter((k) => k !== c.key)));
                  }}
                  disabled={c.key === "actions"}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pl-4 pr-0">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
              </TableHead>
              {columns.includes("item") && <TableHead><SortHeader label="Item" k="name" /></TableHead>}
              {columns.includes("sku") && <TableHead>SKU</TableHead>}
              {columns.includes("category") && <TableHead>Category</TableHead>}
              {columns.includes("department") && <TableHead>Department</TableHead>}
              {columns.includes("location") && <TableHead>Location</TableHead>}
              {columns.includes("quantity") && <TableHead className="text-right"><SortHeader label="Qty" k="quantity" /></TableHead>}
              {columns.includes("reorder") && <TableHead className="text-right">Reorder</TableHead>}
              {columns.includes("unitCost") && <TableHead className="text-right">Unit Cost</TableHead>}
              {columns.includes("value") && <TableHead className="text-right"><SortHeader label="Total Value" k="value" /></TableHead>}
              {columns.includes("status") && <TableHead>Status</TableHead>}
              {columns.includes("updated") && <TableHead><SortHeader label="Last Updated" k="updated" /></TableHead>}
              {columns.includes("actions") && <TableHead className="w-12 pr-4 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={columns.length + 1} className="py-2 pl-4">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="p-0">
                  <EmptyState
                    title="No inventory found"
                    description="Try changing your filters or add a new inventory item."
                    action={search ? undefined : { label: "+ Add Inventory", onClick: () => router.push("/inventory?new=1") }}
                  />
                </TableCell>
              </TableRow>
            )}
            {!loading && paged.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <TableRow key={item.id} data-state={isSelected ? "selected" : undefined} className="cursor-pointer" onClick={() => router.push(`/inventory/${item.id}`)}>
                  <TableCell className="w-10 pl-4 pr-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(item.id)} aria-label={`Select ${item.name}`} />
                  </TableCell>
                  {columns.includes("item") && (
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold">
                          {item.category.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-medium">{item.name}</p>
                          {item.serialNumber && <p className="text-muted-foreground font-mono text-[11px]">{item.serialNumber}</p>}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {columns.includes("sku") && <TableCell className="font-mono text-xs">{item.sku}</TableCell>}
                  {columns.includes("category") && <TableCell className="text-muted-foreground text-xs">{item.category}</TableCell>}
                  {columns.includes("department") && (
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{item.department}</span>
                    </TableCell>
                  )}
                  {columns.includes("location") && <TableCell className="text-muted-foreground text-xs">{item.location}</TableCell>}
                  {columns.includes("quantity") && (
                    <TableCell className="text-right">
                      <span className={cn("text-sm font-semibold tabular-nums", item.status === "out-of-stock" && "text-danger", item.status === "low-stock" && "text-warning")}>
                        {item.quantity}
                      </span>
                      <span className="text-muted-foreground text-xs"> {item.unit}</span>
                    </TableCell>
                  )}
                  {columns.includes("reorder") && <TableCell className="text-muted-foreground text-right text-xs tabular-nums">{item.reorderLevel}</TableCell>}
                  {columns.includes("unitCost") && <TableCell className="text-right text-xs tabular-nums">{formatCurrency(item.unitCost)}</TableCell>}
                  {columns.includes("value") && <TableCell className="text-right text-sm font-medium tabular-nums">{formatCurrency(item.quantity * item.unitCost)}</TableCell>}
                  {columns.includes("status") && (
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                  )}
                  {columns.includes("updated") && (
                    <TableCell>
                      <span className="text-muted-foreground text-xs">{formatDate(item.lastUpdated)}</span>
                    </TableCell>
                  )}
                  {columns.includes("actions") && (
                    <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/inventory/${item.id}`)}>View details</DropdownMenuItem>
                          {can("inventory.manage") && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(item)}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onStockIn(item)}><PackagePlus className="size-3.5" /> Stock In</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onStockOut(item)}><PackageMinus className="size-3.5" /> Stock Out</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="border-t px-4 py-3">
          <Pagination total={items.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>

      <Dialog open={bulkDialog !== null} onOpenChange={(open) => !open && setBulkDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkDialog === "department" && "Assign Department"}
              {bulkDialog === "location" && "Change Location"}
            </DialogTitle>
            <DialogDescription>
              {`Apply to ${selected.size} selected item${selected.size !== 1 ? "s" : ""}.`}
            </DialogDescription>
          </DialogHeader>
          {(
            <div className="space-y-2">
              <Label>{bulkDialog === "department" ? "Department" : "Location"}</Label>
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger className="w-full"><SelectValue placeholder={`Select ${bulkDialog}`} /></SelectTrigger>
                <SelectContent>
                  {(bulkDialog === "department" ? state.departments.map((d) => d.name) : state.locations.map((l) => l.name)).map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancel</Button>
            <Button
              disabled={!bulkValue}
              onClick={runBulkAction}
            >
              {<><Check className="size-4" /> Apply</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { FolderSync };