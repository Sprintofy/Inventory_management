"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check, MoreHorizontal, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TransferDialog } from "@/components/operations/TransferDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate, timeAgo } from "@/lib/utils";

export default function TransfersPage() {
  const { state, activeDepartment, can, updateTransfer } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const pageSize = 10;

  const transfers = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.transfers.filter((t) => {
      if (activeDepartment !== "all" && t.fromDepartment !== activeDepartment && t.toDepartment !== activeDepartment) return false;
      if (term && !(t.transferNo.toLowerCase().includes(term) || t.itemName.toLowerCase().includes(term) || t.fromDepartment.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [state.transfers, search, activeDepartment]);

  const paged = transfers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transfers"
        description="Move inventory between departments with approvals."
        breadcrumb={[{ label: "Transfers" }]}
        actions={can("transfers.create") ? <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> New Transfer</Button> : undefined}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search transfers…" className="md:max-w-sm" />
        <div className="flex items-center gap-2">
          {["pending", "approved", "in-transit", "completed", "rejected"].map((s) => (
            <span key={s} className="text-muted-foreground hidden text-xs md:inline">
              {transfers.filter((t) => t.status === s).length} {s}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Transfer No.</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Date</TableHead>
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
                <EmptyState icon={ArrowLeftRight} title="No transfers found" description="Create a transfer to move stock between departments." action={{ label: "New Transfer", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => router.push(`/transfers/${t.id}`)}>
                <TableCell className="font-mono text-xs font-medium">{t.transferNo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="bg-muted rounded px-1.5 py-0.5 font-medium">{t.fromDepartment}</span>
                    <ArrowLeftRight className="text-muted-foreground size-3" />
                    <span className="bg-muted rounded px-1.5 py-0.5 font-medium">{t.toDepartment}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{t.itemName}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{t.quantity}</TableCell>
                <TableCell className="text-muted-foreground max-w-[160px] truncate text-xs">{t.reason}</TableCell>
                <TableCell className="text-xs">{t.requestedBy}</TableCell>
                <TableCell className="text-muted-foreground text-xs" title={formatDate(t.date)}>{timeAgo(t.date)}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => router.push(`/transfers/${t.id}`)}>View details</DropdownMenuItem>
                      {can("transfers.approve") && t.status === "pending" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateTransfer(t.id, "approved")}><Check className="size-3.5 text-success" /> Approve</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTransfer(t.id, "rejected")} className="text-destructive focus:text-destructive"><X className="size-3.5" /> Reject</DropdownMenuItem>
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
          <Pagination total={transfers.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      <TransferDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}