"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import type { AssetMovement, MovementType } from "@/types";

const movementIcon: Record<MovementType, React.ComponentType<{ className?: string }>> = {
  "check-in": ArrowDownToLine,
  "check-out": ArrowUpFromLine,
  transfer: ArrowLeftRight,
};

export function MovementHistory({
  movements,
  loading,
  showFilters = true,
  pageSize = 10,
  className,
}: {
  movements: AssetMovement[];
  loading?: boolean;
  showFilters?: boolean;
  pageSize?: number;
  className?: string;
}) {
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<string>("all");
  const [itemType, setItemType] = React.useState<string>("all");
  const [ticket, setTicket] = React.useState<string>("all");
  const [date, setDate] = React.useState("");
  const [page, setPage] = React.useState(1);

  const itemTypes = React.useMemo(() => Array.from(new Set(movements.map((m) => m.itemType))).sort(), [movements]);
  const tickets = React.useMemo(() => Array.from(new Set(movements.map((m) => m.ticketId))).sort(), [movements]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return movements.filter((m) => {
      if (term && !(
        m.assetId.toLowerCase().includes(term) ||
        (m.serialNumber ?? "").toLowerCase().includes(term) ||
        m.itemName.toLowerCase().includes(term) ||
        m.itemType.toLowerCase().includes(term) ||
        m.ticketId.toLowerCase().includes(term) ||
        m.performedBy.toLowerCase().includes(term)
      )) return false;
      if (type !== "all" && m.movementType !== type) return false;
      if (itemType !== "all" && m.itemType !== itemType) return false;
      if (ticket !== "all" && m.ticketId !== ticket) return false;
      if (date && new Date(m.date).toISOString().slice(0, 10) !== date) return false;
      return true;
    });
  }, [movements, search, type, itemType, ticket, date]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={cn("space-y-4", className)}>
      {showFilters && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} onClear={() => setSearch("")} placeholder="Search asset ID, serial, ticket…" className="md:col-span-2" />
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Movement type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All movement types</SelectItem>
              {(["check-in", "check-out", "transfer"] as const).map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={itemType} onValueChange={(v) => { setItemType(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Item type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All item types</SelectItem>
              {itemTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ticket} onValueChange={(v) => { setTicket(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Ticket" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tickets</SelectItem>
              {tickets.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="border-input bg-background text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Asset ID</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Item Type</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead>From → To</TableHead>
              <TableHead>By</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={9} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={9} className="p-0">
                <EmptyState icon={History} title="No movements found" description="Check-in, check-out and transfer transactions will appear here." />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((m) => {
              const Icon = movementIcon[m.movementType];
              return (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(m.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium">{m.ticketId}</TableCell>
                  <TableCell className="font-mono text-xs font-medium">{m.assetId}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{m.serialNumber ?? "—"}</TableCell>
                  <TableCell className="text-sm">{m.itemType}</TableCell>
                  <TableCell><span className="flex items-center gap-1.5"><Icon className="size-3.5" /><StatusBadge status={m.movementType} /></span></TableCell>
                  <TableCell className="text-xs">
                    <span className="text-muted-foreground">{m.fromLocation}</span>
                    <span className="text-muted-foreground/50 mx-1">→</span>
                    <span className="font-medium">{m.toLocation}</span>
                  </TableCell>
                  <TableCell className="text-xs">{m.performedBy}</TableCell>
                  <TableCell className="text-muted-foreground max-w-40 truncate text-xs" title={m.remarks}>{m.remarks ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3">
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}