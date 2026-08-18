"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MovementHistory } from "@/components/inventory/MovementHistory";
import { computeDailyStock, dayLabel } from "@/lib/ticket-utils";
import { cn } from "@/lib/utils";
import type { AssetMovement } from "@/types";

export function DailyStockView({ movements, loading }: { movements: AssetMovement[]; loading?: boolean }) {
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const rows = React.useMemo(() => computeDailyStock(movements), [movements]);
  const dayMovements = React.useMemo(
    () => (selectedDay ? movements.filter((m) => new Date(m.date).toISOString().slice(0, 10) === selectedDay) : []),
    [movements, selectedDay]
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Opening Stock</TableHead>
            <TableHead className="text-right">Stock In / Check-In</TableHead>
            <TableHead className="text-right">Stock Out / Check-Out</TableHead>
            <TableHead className="text-right">Transfers</TableHead>
            <TableHead className="text-right">Closing Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={6} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow><TableCell colSpan={6} className="p-0">
              <EmptyState icon={CalendarDays} title="No stock movements" description="Check-in, check-out and transfer transactions will appear here day by day." />
            </TableCell></TableRow>
          )}
          {!loading && rows.map((row) => {
            const net = row.stockIn - row.stockOut;
            return (
              <TableRow key={row.date} className="cursor-pointer" onClick={() => setSelectedDay(row.date)}>
                <TableCell className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="text-muted-foreground size-3.5" />
                    {dayLabel(row.date)}
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-normal">click to view</span>
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">{row.opening}</TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums text-success">{row.stockIn}</TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums text-danger">{row.stockOut}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-warning">{row.transfers}</TableCell>
                <TableCell className={cn("text-right text-sm font-semibold tabular-nums", net < 0 ? "text-danger" : net > 0 ? "text-success" : "")}>{row.closing}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Stock movements — {selectedDay ? dayLabel(selectedDay) : ""}</DialogTitle>
            <DialogDescription>Exact assets/items that came in and went out on this day ({dayMovements.length} transactions).</DialogDescription>
          </DialogHeader>
          <MovementHistory movements={dayMovements} pageSize={8} />
        </DialogContent>
      </Dialog>
    </div>
  );
}