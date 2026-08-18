"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardList, MoreHorizontal, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RequestDialog } from "@/components/operations/RequestDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate, timeAgo } from "@/lib/utils";
import type { RequestPriority } from "@/types";

const priorityClass: Record<RequestPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

export default function RequestsPage() {
  const { state, activeDepartment, can, updateRequest } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const pageSize = 10;

  const requests = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.requests.filter((r) => {
      if (activeDepartment !== "all" && r.department !== activeDepartment) return false;
      if (term && !(r.id.toLowerCase().includes(term) || r.itemName.toLowerCase().includes(term) || r.requestedBy.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [state.requests, search, activeDepartment]);

  const paged = requests.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory Requests"
        description="Department users request inventory. Approve, reject or fulfill requests."
        breadcrumb={[{ label: "Requests" }]}
        actions={can("requests.create") ? <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> New Request</Button> : undefined}
      />

      <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search by request ID, item or requester…" className="md:max-w-sm" />

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Request ID</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Priority</TableHead>
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
                <EmptyState icon={ClipboardList} title="No requests found" description="Department requests will appear here." action={{ label: "New Request", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => router.push(`/requests/${r.id}`)}>
                <TableCell className="font-mono text-xs font-medium">{r.id}</TableCell>
                <TableCell className="text-sm">{r.requestedBy}</TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{r.department}</span>{r.subDepartment && <span className="text-muted-foreground mt-0.5 block text-[11px]">{r.subDepartment}</span>}</TableCell>
                <TableCell className="text-sm font-medium">{r.itemName}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{r.quantity}</TableCell>
                <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass[r.priority]}`}>{r.priority}</span></TableCell>
                <TableCell className="text-muted-foreground text-xs" title={formatDate(r.date)}>{timeAgo(r.date)}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  {can("requests.approve") && r.status === "pending" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => router.push(`/requests/${r.id}`)}>View details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateRequest(r.id, "approved")}><Check className="size-3.5 text-success" /> Approve</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateRequest(r.id, "rejected")} className="text-destructive focus:text-destructive"><X className="size-3.5" /> Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => router.push(`/requests/${r.id}`)}>View details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3">
          <Pagination total={requests.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      <RequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}