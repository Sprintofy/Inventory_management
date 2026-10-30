"use client";

import * as React from "react";

import {
  Pencil,
  PackagePlus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { InventoryItem } from "@/types";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
}

const allColumns = [
  { key: "deviceName", label: "Device Name" },
  { key: "brand", label: "Brand" },
  { key: "type", label: "Type" },
  { key: "sku", label: "Reg No." },
  { key: "category", label: "Category" },
  { key: "quantity", label: "Quantity" },
  { key: "unit", label: "Unit" },
  { key: "status", label: "Status" },
  { key: "updated", label: "Last Updated" },
  { key: "actions", label: "Actions" },
] as const;

export function InventoryTable({ items, onEdit }: InventoryTableProps) {
  const router = useRouter();

  const [page, setPage] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const paginatedItems = React.useMemo(() => {
    const start = page * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, page, itemsPerPage]);

  const totalPages = Math.ceil(
    (items.length || 0) / itemsPerPage,
  );

  React.useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(totalPages - 1);
    }
  }, [totalPages, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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

        <Pagination
          total={items.length}
          page={page + 1}
          pageSize={itemsPerPage}
          onPageChange={(newPage) => setPage(newPage - 1)}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="No items found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {allColumns.map((col) => {
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-left",
                      col.key === "actions" && "text-right",
                    )}
                  >
                    {col.label}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedItems.map((item) => (
              <TableRow
                key={item.id}
                className={cn("hover:bg-muted", "cursor-pointer")}
                onClick={() => router.push(`/inventory/${item.id}`)}
              >
                {allColumns.map((col) => {
                  if (col.key === "actions") {
                    return (
                      <TableCell key={col.key} className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    );
                  }

                  let value: string = "";
                  switch (col.key) {
                    case "deviceName":
                      value = item.deviceName;
                      break;
                    case "brand":
                      value = item.brand;
                      break;
                    case "type":
                      value = item.type;
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
                    default:
                      value = "";
                  }

                  return (
                    <TableCell key={col.key}>
                      {col.key === "status" ? (
                        <StatusBadge status={item.status} />
                      ) : (
                        value
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
