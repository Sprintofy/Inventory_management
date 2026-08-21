"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, FileDown, MoreHorizontal, Plus, Ticket } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketDialog } from "@/components/operations/TicketDialog";
import { CloseTicketDialog } from "@/components/operations/CloseTicketDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate, timeAgo } from "@/lib/utils";
import { exportTicketsExcel } from "@/lib/excel";
import { issueCounts } from "@/lib/ticket-utils";
import { toast } from "sonner";
import type { RequestPriority, Ticket as TicketRecord, TicketStatus } from "@/types";

const priorityClass: Record<RequestPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

type StatusFilter = "all" | TicketStatus;

const statusTabs: StatusFilter[] = ["all", "open", "in-progress", "partially-resolved", "resolved", "closed"];

export default function TicketsPage() {
  const { state, activeDepartment, can, updateTicket } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [closeTicket, setCloseTicket] = React.useState<TicketRecord | null>(null);
  const pageSize = 10;

  const admin = can("tickets.manage");

  const tickets = React.useMemo(() => {
    return state.tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (activeDepartment !== "all" && t.department !== activeDepartment) return false;
      return true;
    });
  }, [state.tickets, statusFilter, activeDepartment]);

  const paged = tickets.slice((page - 1) * pageSize, page * pageSize);

  const exportExcel = () => {
    exportTicketsExcel(tickets, state.movements);
    toast.success(`Exported ${tickets.length} tickets to Excel`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tickets"
        description="One ticket can carry many assets, and each asset can have many independent issues."
        breadcrumb={[{ label: "Tickets" }]}
        actions={
          <>
            <Button variant="outline" onClick={exportExcel}><FileDown className="size-4" /> Export to Excel</Button>
            {admin && <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Generate Ticket</Button>}
          </>
        }
      />

      <div className="flex justify-end">
        <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
          <TabsList>
            {statusTabs.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">{s.replace("-", " ")}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ticket ID</TableHead>
              <TableHead>Title / Customer</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
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
                <EmptyState icon={Ticket} title="No tickets found" description="Generated tickets will appear here." action={admin ? { label: "Generate Ticket", onClick: () => setDialogOpen(true) } : undefined} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((t) => {
              const counts = issueCounts(t.issues);
              return (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => router.push(`/tickets/${t.id}`)}>
                  <TableCell className="font-mono text-xs font-medium">{t.id}</TableCell>
                  <TableCell className="max-w-64">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    {t.customer && <p className="text-muted-foreground truncate text-xs">{t.customer}</p>}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{t.assets.length}</TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums">
                      <span className="font-medium">{counts.total}</span>
                      <span className="text-muted-foreground"> ({counts.resolved} resolved)</span>
                    </span>
                  </TableCell>
                  <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{t.department}</span>{t.subDepartment && <span className="text-muted-foreground mt-0.5 block text-[11px]">{t.subDepartment}</span>}</TableCell>
                  <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass[t.priority]}`}>{t.priority}</span></TableCell>
                  <TableCell className="text-muted-foreground text-xs" title={formatDate(t.createdAt)}>{timeAgo(t.createdAt)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {admin && t.status !== "closed" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/tickets/${t.id}`)}>View details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {t.status === "open" ? (
                            <DropdownMenuItem onClick={() => updateTicket(t.id, { status: "in-progress" })}>Mark in progress</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateTicket(t.id, { status: "open" })}>Reopen ticket</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setCloseTicket(t)}><Check className="size-3.5 text-success" /> Close ticket</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/tickets/${t.id}`)}>View details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3">
          <Pagination total={tickets.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      <TicketDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <CloseTicketDialog open={!!closeTicket} onOpenChange={(o) => !o && setCloseTicket(null)} ticket={closeTicket} />
    </div>
  );
}