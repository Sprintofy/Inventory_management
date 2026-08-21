"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, PackageMinus, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StockOutDialog } from "@/components/inventory/StockDialogs";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { StockOutRecord } from "@/types";

export default function StockOutPage() {
  const { state, activeDepartment, can, updateStockOutStatus } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<StockOutRecord | null>(null);
  const pageSize = 10;

  const records = React.useMemo(() => {
    return state.stockOut.filter((r) => {
      if (activeDepartment !== "all" && r.department !== activeDepartment) return false;
      return true;
    });
  }, [state.stockOut, activeDepartment]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Out"
        description="Issue inventory to employees, departments and projects."
        breadcrumb={[{ label: "Stock Out" }]}
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Issue Stock</Button>}
      />

      <Card className="py-4">
        <CardContent className="px-6">
          <p className="text-muted-foreground text-sm md:text-right">
            {records.length} issue record{records.length !== 1 ? "s" : ""} {activeDepartment !== "all" && `· ${activeDepartment}`}
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Quantity</TableHead>
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
                <EmptyState icon={PackageMinus} title="No stock out records" description="Issue inventory to start tracking outbound stock." action={{ label: "Issue Stock", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs font-medium">{r.reference}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(r.date)}</TableCell>
                <TableCell className="text-sm font-medium">{r.itemName}</TableCell>
                <TableCell className="text-sm">{r.recipient}</TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{r.department}</span></TableCell>
                <TableCell className="text-muted-foreground text-xs">{r.purpose}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{r.quantity}</TableCell>
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
                      {can("stock-out.create") && r.status !== "cancelled" && (
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

      <StockOutDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancel stock out record?"
        description={cancelTarget ? `This will mark ${cancelTarget.reference} (${cancelTarget.itemName}) as cancelled.` : undefined}
        confirmLabel="Cancel Record"
        onConfirm={() => {
          if (cancelTarget) updateStockOutStatus(cancelTarget.id, "cancelled");
        }}
      />
    </div>
  );
}