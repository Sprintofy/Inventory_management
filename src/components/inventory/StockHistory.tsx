"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import type { StockTransaction } from "@/types";

const typeMeta: Record<string, { icon: React.ElementType; label: string; class: string }> = {
  "stock-in": { icon: ArrowDownToLine, label: "Stock In", class: "bg-success/10 text-success" },
  "stock-out": { icon: ArrowUpFromLine, label: "Stock Out", class: "bg-primary/10 text-primary" },
  transfer: { icon: ArrowLeftRight, label: "Transfer", class: "bg-warning/15 text-warning" },
  adjustment: { icon: SlidersHorizontal, label: "Adjustment", class: "bg-muted text-muted-foreground" },
};

export function StockHistory({ transactions, itemName }: { transactions: StockTransaction[]; itemName: string }) {
  if (transactions.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
        <ArrowLeftRight className="size-6 opacity-40" />
        <p className="text-sm">No stock movements recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transactions.map((t) => {
        const meta = typeMeta[t.type];
        const Icon = meta.icon;
        const incoming = t.quantity > 0;
        return (
          <div key={t.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", meta.class)}>
                <Icon className="size-4" />
              </span>
              <span className="bg-border mt-2 w-px flex-1" />
            </div>
            <div className="min-w-0 flex-1 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide">{meta.label}</span>
                <span className={cn("text-sm font-semibold tabular-nums", incoming ? "text-success" : "text-primary")}>
                  {incoming ? "+" : ""}{t.quantity}
                </span>
                {t.toDepartment && (
                  <span className="text-muted-foreground text-xs">
                    {t.department} → {t.toDepartment}
                  </span>
                )}
                <span className="text-muted-foreground ml-auto text-xs">
                  {formatDateTime(t.date)} · {timeAgo(t.date)}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {t.reference} · {itemName} · By {t.createdBy}
              </p>
              {t.note && <p className="text-muted-foreground/80 mt-0.5 text-xs italic">{t.note}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}