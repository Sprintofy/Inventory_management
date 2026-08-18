"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartSeries } from "@/data/mock";
import { formatNumber } from "@/lib/utils";

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
  prefix?: string;
}

export function ChartTooltip({ active, payload, label, prefix = "" }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color ?? "var(--primary)" }} />
          <span className="text-muted-foreground capitalize">{p.name}</span>
          <span className="ml-auto font-semibold">
            {prefix}
            {formatNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function InventoryChart({ range }: { range: keyof typeof chartSeries }) {
  const data = useMemo(() => {
    const series = chartSeries[range];
    const n = series.stockIn.length;
    const labels =
      range === "7 days"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : range === "30 days"
          ? Array.from({ length: n }, (_, i) => `D${i + 1}`)
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return series.stockIn.map((v, i) => ({
      label: labels[i % labels.length],
      "Stock In": v,
      "Stock Out": series.stockOut[i],
    }));
  }, [range]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area type="monotone" dataKey="Stock In" stroke="var(--primary)" strokeWidth={2} fill="url(#gradIn)" name="Stock In" />
        <Area type="monotone" dataKey="Stock Out" stroke="var(--chart-4)" strokeWidth={2} fill="url(#gradOut)" name="Stock Out" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DepartmentChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[190px] w-[190px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} strokeWidth={0}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight">{formatNumber(total)}</span>
          <span className="text-muted-foreground text-xs">Units</span>
        </div>
      </div>
      <div className="w-full min-w-0 flex-1 space-y-2.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground flex-1 truncate text-sm">{d.name}</span>
            <span className="text-sm font-medium tabular-nums">{formatNumber(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockHealthChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-4">
      {data.map((d) => {
        const pct = Math.max(1, (d.value / total) * 100);
        return (
          <div key={d.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">{formatNumber(d.value)}</span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, pct)}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}