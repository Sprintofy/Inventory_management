"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export type InventoryRange = "7 days" | "30 days" | "3 months" | "1 year";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86400000;

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

export function InventoryChart({ range }: { range: InventoryRange }) {
  const { state } = useApp();

  const data = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const endTs = end.getTime();
    const days = range === "7 days" ? 7 : range === "30 days" ? 30 : range === "3 months" ? 90 : 365;

    interface Bucket {
      start: number;
      end: number;
      in: number;
      out: number;
    }

    const buckets: Bucket[] = [];
    if (range === "1 year") {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(endTs);
        start.setDate(1);
        start.setMonth(start.getMonth() - i);
        buckets.push({ start: start.getTime(), end: i === 0 ? endTs + 1 : Date.UTC(start.getFullYear(), start.getMonth() + 1, 1), in: 0, out: 0 });
      }
    } else if (range === "3 months") {
      const step = Math.ceil(days / 12) * DAY;
      for (let i = 11; i >= 0; i--) {
        const start = endTs - (i + 1) * step;
        buckets.push({ start, end: start + step, in: 0, out: 0 });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const start = endTs - (i + 1) * DAY;
        buckets.push({ start, end: start + DAY, in: 0, out: 0 });
      }
    }

    for (const t of state.transactions) {
      const ts = new Date(t.date).getTime();
      if (ts > endTs + 1 || ts < endTs - days * DAY) continue;
      const idx = buckets.findIndex((b) => ts >= b.start && ts < b.end);
      if (idx === -1) continue;
      if (t.type === "stock-in") buckets[idx].in += t.quantity;
      else if (t.type === "stock-out") buckets[idx].out += Math.abs(t.quantity);
    }

    return buckets.map((b, i) => {
      let label: string;
      if (range === "7 days") label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(b.start).getDay()];
      else if (range === "30 days") label = `D${i + 1}`;
      else label = MONTHS[i % 12];
      return {
        label,
        "Stock In": b.in,
        "Stock Out": b.out,
        "Net": b.in - b.out,
      };
    });
  }, [state.transactions, range]);

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
          <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area type="monotone" dataKey="Stock In" stroke="var(--primary)" strokeWidth={2} fill="url(#gradIn)" name="Stock In" />
        <Area type="monotone" dataKey="Stock Out" stroke="var(--chart-4)" strokeWidth={2} fill="url(#gradOut)" name="Stock Out" />
        <Area type="monotone" dataKey="Net" stroke="var(--chart-3)" strokeWidth={2} fill="url(#gradNet)" name="Net" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DepartmentChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
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
            <span className="text-muted-foreground text-xs">{(total > 0 ? (d.value / total * 100).toFixed(1) : 0)}%</span>
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
              <span className="text-muted-foreground text-xs tabular-nums">{formatNumber(d.value)} ({pct.toFixed(1)}%)</span>
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

export function StockMovementChart({ range }: { range: InventoryRange }) {
  const { state } = useApp();

  const data = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const endTs = end.getTime();
    const days = range === "7 days" ? 7 : range === "30 days" ? 30 : range === "3 months" ? 90 : 365;

    interface Bucket {
      start: number;
      end: number;
      in: number;
      out: number;
    }

    const buckets: Bucket[] = [];
    if (range === "1 year") {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(endTs);
        start.setDate(1);
        start.setMonth(start.getMonth() - i);
        buckets.push({ start: start.getTime(), end: i === 0 ? endTs + 1 : Date.UTC(start.getFullYear(), start.getMonth() + 1, 1), in: 0, out: 0 });
      }
    } else if (range === "3 months") {
      const step = Math.ceil(days / 12) * DAY;
      for (let i = 11; i >= 0; i--) {
        const start = endTs - (i + 1) * step;
        buckets.push({ start, end: start + step, in: 0, out: 0 });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const start = endTs - (i + 1) * DAY;
        buckets.push({ start, end: start + DAY, in: 0, out: 0 });
      }
    }

    for (const t of state.transactions) {
      const ts = new Date(t.date).getTime();
      if (ts > endTs + 1 || ts < endTs - days * DAY) continue;
      const idx = buckets.findIndex((b) => ts >= b.start && ts < b.end);
      if (idx === -1) continue;
      if (t.type === "stock-in") buckets[idx].in += t.quantity;
      else if (t.type === "stock-out") buckets[idx].out += Math.abs(t.quantity);
    }

    return buckets.map((b, i) => {
      let label: string;
      if (range === "7 days") label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(b.start).getDay()];
      else if (range === "30 days") label = `D${i + 1}`;
      else label = MONTHS[i % 12];
      return {
        label,
        "Stock In": b.in,
        "Stock Out": b.out,
      };
    });
  }, [state.transactions, range]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Bar dataKey="Stock In" fill="var(--primary)" name="Stock In" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Stock Out" fill="var(--chart-4)" name="Stock Out" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDistributionChart() {
  const { state } = useApp();
  
  const data = useMemo(() => {
    // Build category lookup from inventory
    const categoryByItemId = new Map(state.inventory.map(i => [i.id, i.category || "Uncategorized"]));
    const categories: Record<string, { in: number; out: number; count: number }> = {};
    
    for (const t of state.transactions) {
      const cat = categoryByItemId.get(t.itemId) || "Uncategorized";
      if (!categories[cat]) categories[cat] = { in: 0, out: 0, count: 0 };
      if (t.type === "stock-in") {
        categories[cat].in += t.quantity;
        categories[cat].count++;
      } else {
        categories[cat].out += Math.abs(t.quantity);
      }
    }
    
    return Object.entries(categories)
      .map(([category, values]) => ({
        category,
        ...values,
        total: values.in + values.out,
        net: values.in - values.out,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [state.transactions, state.inventory]);

  const maxValue = Math.max(...data.map(d => Math.max(d.in, d.out)), 1);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={160} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Bar dataKey="in" fill="var(--primary)" name="Stock In" radius={[0, 4, 4, 0]} />
        <Bar dataKey="out" fill="var(--chart-4)" name="Stock Out" radius={[0, 4, 4, 0]} />
        <Legend />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StockTrendChart({ range }: { range: InventoryRange }) {
  const { state } = useApp();

  const data = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const endTs = end.getTime();
    const days = range === "7 days" ? 7 : range === "30 days" ? 30 : range === "3 months" ? 90 : 365;

    interface Bucket {
      start: number;
      end: number;
      in: number;
      out: number;
      balance: number;
    }

    const buckets: Bucket[] = [];
    if (range === "1 year") {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(endTs);
        start.setDate(1);
        start.setMonth(start.getMonth() - i);
        buckets.push({ start: start.getTime(), end: i === 0 ? endTs + 1 : Date.UTC(start.getFullYear(), start.getMonth() + 1, 1), in: 0, out: 0, balance: 0 });
      }
    } else if (range === "3 months") {
      const step = Math.ceil(days / 12) * DAY;
      for (let i = 11; i >= 0; i--) {
        const start = endTs - (i + 1) * step;
        buckets.push({ start, end: start + step, in: 0, out: 0, balance: 0 });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const start = endTs - (i + 1) * DAY;
        buckets.push({ start, end: start + DAY, in: 0, out: 0, balance: 0 });
      }
    }

    let runningBalance = 0;
    for (const t of state.transactions) {
      const ts = new Date(t.date).getTime();
      if (ts > endTs + 1 || ts < endTs - days * DAY) continue;
      const idx = buckets.findIndex((b) => ts >= b.start && ts < b.end);
      if (idx === -1) continue;
      if (t.type === "stock-in") {
        buckets[idx].in += t.quantity;
        runningBalance += t.quantity;
      } else {
        buckets[idx].out += Math.abs(t.quantity);
        runningBalance -= Math.abs(t.quantity);
      }
      buckets[idx].balance = runningBalance;
    }

    return buckets.map((b, i) => {
      let label: string;
      if (range === "7 days") label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(b.start).getDay()];
      else if (range === "30 days") label = `D${i + 1}`;
      else label = MONTHS[i % 12];
      return {
        label,
        "Stock In": b.in,
        "Stock Out": b.out,
        "Balance": b.balance,
      };
    });
  }, [state.transactions, range]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Line type="monotone" dataKey="Balance" stroke="var(--chart-3)" strokeWidth={2} fill="url(#gradBalance)" name="Running Balance" dot={{ r: 3, strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopItemsChart() {
  const { state } = useApp();

  const data = useMemo(() => {
    const items: Record<string, { name: string; quantity: number; movements: number }> = {};
    
    for (const t of state.transactions) {
      const key = t.itemId;
      if (!items[key]) items[key] = { name: t.itemName, quantity: 0, movements: 0 };
      if (t.type === "stock-in") items[key].quantity += t.quantity;
      else items[key].quantity += t.quantity; // net change
      items[key].movements++;
    }
    
    return Object.entries(items)
      .map(([id, values]) => ({ id, ...values }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [state.transactions]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Bar dataKey="quantity" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Quantity">
          {data.map((_, i) => <Cell key={i} fill={`hsl(${i * 30}, 70%, 50%)`} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LowStockAlertChart() {
  const { state } = useApp();
  
  const data = useMemo(() => {
    const low = state.inventory.filter(i => i.quantity > 0 && i.quantity <= 10).length;
    const out = state.inventory.filter(i => i.quantity <= 0).length;
    const healthy = state.inventory.filter(i => i.quantity > 10).length;
    return [
      { label: "Healthy", value: healthy, color: "#10b981" },
      { label: "Low Stock (1-10)", value: low, color: "#f59e0b" },
      { label: "Out of Stock", value: out, color: "#ef4444" },
    ];
  }, [state.inventory]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={3}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm font-medium">{d.label}</span>
            <span className="text-muted-foreground text-sm flex-1 text-right">{formatNumber(d.value)}</span>
            <span className="text-xs text-muted-foreground">{(total > 0 ? (d.value / total * 100).toFixed(1) : 0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyComparisonChart() {
  const { state } = useApp();
  
  const data = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    
    const monthlyData: Record<string, { in: number; out: number }> = {};
    months.forEach(m => { monthlyData[m] = { in: 0, out: 0 }; });
    
    for (const t of state.transactions) {
      const month = t.date.slice(0, 7);
      if (monthlyData[month]) {
        if (t.type === "stock-in") monthlyData[month].in += t.quantity;
        else monthlyData[month].out += Math.abs(t.quantity);
      }
    }
    
    return months.map(m => ({
      month: m.slice(5) + "/" + m.slice(2, 4),
      "Stock In": monthlyData[m].in,
      "Stock Out": monthlyData[m].out,
      Net: monthlyData[m].in - monthlyData[m].out,
    }));
  }, [state.transactions]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Bar dataKey="in" fill="var(--primary)" name="Stock In" radius={[4, 4, 0, 0]} />
        <Bar dataKey="out" fill="var(--chart-4)" name="Stock Out" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}