"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { SearchInput } from "@/components/ui/SearchInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate, timeAgo } from "@/lib/utils";
import { exportTicketsExcel } from "@/lib/excel";
import { issueCounts } from "@/lib/ticket-utils";
import { toast } from "sonner";
import type { RequestPriority, TicketStatus } from "@/types";

const priorityClass: Record<RequestPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

type StatusFilter = "all" | TicketStatus;

const statusTabs: StatusFilter[] = ["all", "open", "in-progress", "partially-resolved", "resolved", "closed"];

export default function TicketsPage() {
  const { state, activeDepartment, can, updateTicket, user, role } = useApp();
  const router = useRouter();
  const loading = useFakeLoading();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const pageSize = 10;

  const isDeptUser = role === "user" || role === "department-manager" || role === "department-user";
  const canGenerate = can("tickets.manage");
  const admin = canGenerate;
  const scopeLabel = activeDepartment === "all" ? "All Departments" : `${activeDepartment}${user?.subDepartment ? ` / ${user.subDepartment}` : ""}`;

  const tickets = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      // Department-scoped filtering: department-manager sees their dept + sub-depts tickets only
      if (role === "department-manager") {
        const userDept = user?.department;
        if (userDept) {
          const userDeptObj = state.departments.find((d) => d.name === userDept || d.id === userDept);
          const allowedDepts = new Set([userDept, ...(userDeptObj?.subDepartments?.map((s) => s.name) ?? [])].filter(Boolean));
          if (!allowedDepts.has(t.department) && !allowedDepts.has(t.subDepartment || "")) return false;
        }
      } else if (activeDepartment !== "all" && t.department !== activeDepartment) return false;
      if (term && !(t.title.toLowerCase().includes(term) || t.id.toLowerCase().includes(term) || t.description.toLowerCase().includes(term))) return false;
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(t.createdAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [state.tickets, state.departments, statusFilter, priorityFilter, role, user?.department, search, dateFrom, dateTo]);

  const paged = tickets.slice((page - 1) * pageSize, page * pageSize);

  const exportExcel = () => {
    exportTicketsExcel(tickets, state.movements);
    toast.success(`Exported ${tickets.length} tickets to Excel`);
  };

  const doImport = () => toast.success("Import: choose a CSV to bulk-import tickets (demo)");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tickets"
        description={`Support tickets · ${scopeLabel} · ${tickets.length} total`}
        breadcrumb={[{ label: "Tickets" }]}
        actions={
          <>
            <Button variant="outline" onClick={doImport}><FileDown className="size-4" /> Import</Button>
            <Button variant="outline" onClick={exportExcel}><FileDown className="size-4" /> Export</Button>
            <Button variant="outline" onClick={exportExcel}><FileDown className="size-4" /> Export Excel</Button>
            {admin && <Button asChild><Link href="/tickets/create"><Plus className="size-4" /> Generate Ticket</Link></Button>}
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} onClear={() => setSearch("")} placeholder="Search tickets by title, ID…" className="md:max-w-sm" />
          <p className="text-muted-foreground text-xs tabular-nums">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""} · {scopeLabel}</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Priority</SelectItem><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-8 w-auto text-xs" aria-label="From date" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-8 w-auto text-xs" aria-label="To date" />
            {(priorityFilter !== "all" || dateFrom || dateTo || search || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-xs" onClick={() => { setSearch(""); setPriorityFilter("all"); setDateFrom(""); setDateTo(""); setStatusFilter("all"); setPage(1); }}>Clear all</Button>
            )}
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
            <TabsList>
              {statusTabs.map((s) => (
                <TabsTrigger key={s} value={s} className="capitalize">{s.replace("-", " ")}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
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
                <EmptyState icon={Ticket} title="No tickets found" description="Generated tickets will appear here." action={admin ? { label: "Generate Ticket", onClick: () => { window.location.href = "/tickets/create"; } } : undefined} />
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
                  <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{t.department}</span></TableCell>
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

    </div>
  );
}