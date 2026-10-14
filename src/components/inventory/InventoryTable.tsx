"use client";

import * as React from "react";

import {
  ArrowUpDown,
  Columns3,
  Download,
  Pencil,
  PackageMinus,
  PackagePlus,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { InventoryForm } from "@/components/inventory/InventoryForm";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import type { InventoryItem } from "@/types";
import { cn } from "@/lib/utils";

type ColumnKey =
  | "selection"
  | "deviceName"
  | "brand"
  | "modelNumber"
  | "sku"
  | "category"
  | "quantity"
  | "unit"
  | "reorder"
  | "maxStock"
  | "unitCost"
  | "value"
  | "status"
  | "updated"
  | "actions";

const allColumns = [
  { key: "selection", label: "" },
  { key: "deviceName", label: "Device Name" },
  { key: "brand", label: "Brand" },
  { key: "modelNumber", label: "Model" },
  { key: "sku", label: "SKU" },
  { key: "category", label: "Category" },
  { key: "quantity", label: "Quantity" },
  { key: "reorder", label: "Reorder Level" },
  { key: "unitCost", label: "Unit Cost" },
  { key: "value", label: "Total Value" },
  { key: "status", label: "Status" },
  { key: "updated", label: "Last Updated" },
  { key: "actions", label: "Actions" },
] as const;

function defaultColumns(): ColumnKey[] {
  return [
    "selection",
    "deviceName",
    "brand",
    "modelNumber",
    "sku",
    "category",
    "quantity",
    "unitCost",
    "value",
    "status",
    "updated",
    "actions",
  ];
}

const sortOptions = [
  { value: "deviceName_asc", label: "Device Name: A-Z" },
  { value: "deviceName_desc", label: "Device Name: Z-A" },
  { value: "brand_asc", label: "Brand: A-Z" },
  { value: "brand_desc", label: "Brand: Z-A" },
  { value: "modelNumber_asc", label: "Model: A-Z" },
  { value: "modelNumber_desc", label: "Model: Z-A" },
  { value: "sku_asc", label: "SKU: A-Z" },
  { value: "sku_desc", label: "SKU: Z-A" },
  { value: "category_asc", label: "Category: A-Z" },
  { value: "category_desc", label: "Category: Z-A" },
  { value: "quantity_asc", label: "Quantity: Low-High" },
  { value: "quantity_desc", label: "Quantity: High-Low" },
  { value: "unitCost_asc", label: "Unit Cost: Low-High" },
  { value: "unitCost_desc", label: "Unit Cost: High-Low" },
  { value: "updated_asc", label: "Date: Old-New" },
  { value: "updated_desc", label: "Date: New-Old" },
] as const;

export function InventoryTable() {
  const { state, archiveItems } = useApp();

  const [columns, setColumns] = React.useState<ColumnKey[]>(defaultColumns());
  const [sort, setSort] = React.useState<typeof sortOptions[number]['value'] | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [confirmItemId, setConfirmItemId] = React.useState<string | null>(null);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editItem, setEditItem] = React.useState<InventoryItem | null>(null);


  const filteredItems = React.useMemo(() => {
    if (!searchTerm.trim()) return state.inventory;
    const term = searchTerm.toLowerCase();
    return state.inventory.filter((item) => {
      return (
        item.deviceName.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term) ||
        item.modelNumber.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term) ||
        (item.description ?? "").toLowerCase().includes(term) ||
        (item.category ?? "").toLowerCase().includes(term) ||
        (item.supplier ?? "").toLowerCase().includes(term)
      );
    });
  }, [state.inventory, searchTerm]);

  const sortedItems = React.useMemo(() => {
    if (!sort) return filteredItems;
    const parts = sort.toString().split("_");
    if (parts.length !== 2) {
      // Fallback to filteredItems if the sort string is not in the expected format
      return filteredItems;
    }
    const [key, order] = parts as [keyof InventoryItem, "asc" | "desc"];
    return [...filteredItems].sort((a, b) => {
      if (a[key] === null && b[key] === null) return 0;
      if (a[key] === null) return order === "asc" ? 1 : -1;
      if (b[key] === null) return order === "asc" ? -1 : 1;
      if (typeof a[key] === "string" && typeof b[key] === "string") {
        return order === "asc"
          ? a[key].localeCompare(b[key])
          : b[key].localeCompare(a[key]);
      }
      if (typeof a[key] === "number" && typeof b[key] === "number") {
        return order === "asc" ? a[key] - b[key] : b[key] - a[key];
      }
      return 0;
    });
  }, [filteredItems, sort]);

  const paginatedItems = React.useMemo(() => {
    if (!Array.isArray(sortedItems)) return [];
    const start = page * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, page, itemsPerPage]);

  const totalPages = Math.ceil(
    (Array.isArray(sortedItems) ? sortedItems.length : 0) / itemsPerPage,
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllOnPage = () => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      for (const item of paginatedItems) {
        newSet.add(item.id);
      }
      return newSet;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDownload = async () => {
    // TODO: Implement actual CSV download
    toast.info("CSV download would start here");
  };

  React.useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [totalPages, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const selectedItem = state.inventory.find((item) => selectedIds.has(item.id));
                if (selectedItem) {
                  setEditItem(selectedItem);
                  setOpenEdit(true);
                }
              }}
              disabled={selectedIds.size !== 1}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (selectedIds.size > 0) {
                  setConfirmItemId(null);
                  setOpenConfirm(true);
                }
              }}
              disabled={selectedIds.size === 0}
            >
              <PackageMinus className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="size-4" />
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs sm:max-w-sm"
            />
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="hidden sm:inline-flex"
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Show
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[60px]">{itemsPerPage}</SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            entries
          </div>

          <div className="relative inline-block text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted">
                <Columns3 className="size-4" />
                <span>Columns</span>
                <ChevronDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuLabel className="px-3 py-1.5 text-xs font-medium">
                  Visible columns
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                {allColumns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={columns.includes(col.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setColumns((prev) => [...prev, col.key]);
                      } else {
                        setColumns((prev) => prev.filter((c) => c !== col.key));
                      }
                    }}
                    className="px-3 py-1.5"
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative inline-block text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted">
                <ArrowUpDown className="size-4" />
                <span>Sort</span>
                <ChevronDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuLabel className="px-3 py-1.5 text-xs font-medium">
                  Sort by
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSort(option.value)}
                    className="px-3 py-1.5"
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => setSort(null)}
                  className="px-3 py-1.5"
                >
                  Clear sort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Pagination
            total={sortedItems.length}
            page={page + 1}
            pageSize={itemsPerPage}
            onPageChange={(newPage) => setPage(newPage - 1)}
          />
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="No items found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const colInfo = allColumns.find((c) => c.key === col);
                if (!colInfo) return null;
                return (
                  <TableHead
                    key={col}
                    className={cn(
                      "text-left",
                      col === "actions" && "text-right",
                    )}
                  >
                    {col === "selection" ? (
                      <Checkbox
                        checked={paginatedItems.every((item) => selectedIds.has(item.id))}
                        onChange={() => {
                          if (paginatedItems.every((item) => selectedIds.has(item.id))) {
                            clearSelection();
                          } else {
                            selectAllOnPage();
                          }
                        }}
                      />
                    ) : (
                      colInfo.label
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted">
                {columns.map((col) => {
                  if (col === "actions") {
                    return (
                      <TableCell key={col} className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditItem(item);
                              setOpenEdit(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setConfirmItemId(item.id);
                              setOpenConfirm(true);
                            }}
                          >
                            <PackageMinus className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    );
                  } else if (col === "selection") {
                    return (
                      <TableCell key={col}>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </TableCell>
                    );
                  } else {
                    let value: string = "";
                    switch (col) {
                      case "deviceName":
                        value = item.deviceName;
                        break;
                      case "brand":
                        value = item.brand;
                        break;
                      case "modelNumber":
                        value = item.modelNumber;
                        break;
                      case "sku":
                        value = item.sku;
                        break;
                      case "category":
                        value = item.category;
                        break;
                      case "quantity":
                        value = String(item.quantity);
                        break;
                      case "unit":
                        value = item.unit;
                        break;
                      case "status":
                        value = item.status;
                        break;
                      case "updated":
                        value = new Date(item.lastUpdated).toLocaleDateString();
                        break;
                      case "reorder":
                        value = "";
                        break;
                      case "maxStock":
                        value = "";
                        break;
                      case "unitCost":
                        value = "";
                        break;
                      case "value":
                        value = "";
                        break;
                      default:
                        value = "";
                    }

                    return (
                      <TableCell key={col}>
                        {col === "status" ? (
                          <StatusBadge status={item.status} />
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  }
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      {openConfirm && (
        <ConfirmDialog
          open={openConfirm}
          onOpenChange={setOpenConfirm}
          title={confirmItemId ? "Delete item?" : "Delete items?"}
          description={confirmItemId
            ? "Are you sure you want to delete this item?"
            : "Are you sure you want to delete these items?"}
          onConfirm={() => {
            if (confirmItemId) {
              archiveItems([confirmItemId]);
            } else {
              archiveItems(Array.from(selectedIds));
            }
            setOpenConfirm(false);
            if (!confirmItemId) {
              clearSelection();
            }
          }}
        />
      )}
      
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-2xl sm:max-w-full">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Item" : "Add Inventory Item"}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? "Update the details of this inventory item."
                : "Create a new item in your inventory. All fields marked are required."}
            </DialogDescription>
          </DialogHeader>
          <InventoryForm
            open={openEdit}
            onOpenChange={setOpenEdit}
            item={editItem}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenEdit(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
