"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, MoreHorizontal, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StockInDialog } from "@/components/inventory/StockDialogs";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { StockInRecord } from "@/types";

export default function StockInPage() {
  const { state, activeDepartment, can, updateStockInStatus } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<StockInRecord | null>(null);
  const pageSize = 10;

  const records = React.useMemo(() => {
    return state.stockIn.filter((r) => {
      if (activeDepartment !== "all" && r.department !== activeDepartment) return false;
      return true;
    });
  }, [state.stockIn, activeDepartment]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock In"
        description="Record incoming inventory from suppliers and purchase orders."
        breadcrumb={[{ label: "Stock In" }]}
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Record Stock In</Button>}
      />

      <Card className="py-4">
        <CardContent className="px-6">
          <p className="text-muted-foreground text-sm md:text-right">
            {records.length} inbound record{records.length !== 1 ? "s" : ""} {activeDepartment !== "all" && `· ${activeDepartment}`}
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={9} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={9} className="p-0">
                <EmptyState icon={ArrowDownToLine} title="No stock in records" description="Record incoming inventory to get started." action={{ label: "Record Stock In", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs font-medium">{r.reference}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(r.date)}</TableCell>
                <TableCell className="text-sm">{r.supplier}</TableCell>
                <TableCell className="text-sm font-medium">{r.itemName}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">+{r.quantity}</TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{r.department}</span></TableCell>
                <TableCell className="text-muted-foreground text-xs">{r.createdBy}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {(() => {
                        const item = state.inventory.find((i) => i.name === r.itemName);
                        return item ? <DropdownMenuItem onClick={() => router.push(`/inventory/${item.id}`)}>View item</DropdownMenuItem> : null;
                      })()}
                      {can("stock-in.create") && r.status !== "cancelled" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setCancelTarget(r)} className="text-destructive focus:text-destructive"><X className="size-3.5" /> Cancel record</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3">
          <Pagination total={records.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      <StockInDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancel stock in record?"
        description={cancelTarget ? `This will mark ${cancelTarget.reference} (${cancelTarget.itemName}) as cancelled.` : undefined}
        confirmLabel="Cancel Record"
        onConfirm={() => {
          if (cancelTarget) updateStockInStatus(cancelTarget.id, "cancelled");
        }}
      />
    </div>
  );
}