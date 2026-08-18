"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PODialog } from "@/components/operations/PODialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { POStatus } from "@/types";

export default function PurchaseOrdersPage() {
  const { state, activeDepartment, can, updatePO } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const pageSize = 10;

  const orders = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.purchaseOrders.filter((po) => {
      if (activeDepartment !== "all" && po.department !== activeDepartment) return false;
      if (term && !(po.poNumber.toLowerCase().includes(term) || po.supplier.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [state.purchaseOrders, search, activeDepartment]);

  const paged = orders.slice((page - 1) * pageSize, page * pageSize);

  const advanceStatus = (po: (typeof orders)[number]) => {
    const flow: POStatus[] = ["draft", "pending-approval", "approved", "ordered", "partially-received", "received"];
    const i = flow.indexOf(po.status);
    if (i >= 0 && i < flow.length - 1) updatePO(po.id, flow[i + 1]);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        description="Create and track purchase orders from suppliers."
        breadcrumb={[{ label: "Purchase Orders" }]}
        actions={can("po.create") ? <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> New Purchase Order</Button> : undefined}
      />

      <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search by PO number or supplier…" className="md:max-w-sm" />

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={9} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={9} className="p-0">
                <EmptyState icon={ShoppingCart} title="No purchase orders" description="Create a purchase order to start tracking procurement." action={{ label: "New Purchase Order", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((po) => (
              <TableRow key={po.id} className="cursor-pointer" onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                <TableCell className="font-mono text-xs font-medium">{po.poNumber}</TableCell>
                <TableCell className="text-sm font-medium">{po.supplier}</TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{po.department}</span></TableCell>
                <TableCell className="text-muted-foreground text-xs">{po.items.length} item{po.items.length !== 1 ? "s" : ""}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{formatCurrency(po.amount)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(po.orderDate)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(po.expectedDelivery)}</TableCell>
                <TableCell><StatusBadge status={po.status} /></TableCell>
                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  {can("po.manage") ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => router.push(`/purchase-orders/${po.id}`)}>View details</DropdownMenuItem>
                        {po.status !== "received" && po.status !== "cancelled" && (
                          <DropdownMenuItem onClick={() => advanceStatus(po)}>Advance status</DropdownMenuItem>
                        )}
                        {po.status !== "cancelled" && (
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => updatePO(po.id, "cancelled")}>
                            Cancel order
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/purchase-orders/${po.id}`)}><MoreHorizontal className="size-4" /></Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3"><Pagination total={orders.length} page={page} pageSize={pageSize} onPageChange={setPage} /></div>
      </div>

      <PODialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}