"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  iconClass?: string;
  label: string;
  value: string;
  change?: number;
  trend?: "up" | "down";
  hint?: string;
  loading?: boolean;
}

export function StatCard({ icon: Icon, iconClass, label, value, change, trend, hint, loading }: StatCardProps) {
  const up = trend === "up";
  return (
    <Card className="group overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="flex items-start justify-between px-5 pt-5">
          <div className={cn("flex size-10 items-center justify-center rounded-lg", iconClass ?? "bg-primary/10 text-primary")}>
            <Icon className="size-5" />
          </div>
          {change !== undefined && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              )}
            >
              {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        <div className="px-5 pb-5 pt-3">
          {loading ? (
            <div className="bg-muted h-7 w-28 animate-pulse rounded-md" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <p className="text-muted-foreground text-sm">{label}</p>
            {hint && <p className="text-muted-foreground/70 truncate text-xs">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
