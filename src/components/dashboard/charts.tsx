"use client";

import { useMemo } from "react";
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
import type { StockTransaction } from "@/types";

export type InventoryRange = "7 days" | "30 days" | "3 months" | "1 year";

const DAY = 86400000;

const RANGE_DAYS: Record<InventoryRange, number> = {
  "7 days": 7,
  "30 days": 30,
  "3 months": 90,
  "1 year": 365,
};

interface Bucket {
  start: number;
  end: number;
  in: number;
  out: number;
}

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

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function ChartEmpty({ height }: { height: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center" style={{ height }}>
      <p className="text-sm font-medium">No stock movements in this range</p>
      <p className="text-muted-foreground text-xs">Movements appear here after a stock-in or stock-out.</p>
    </div>
  );
}

function createBuckets(range: InventoryRange): Bucket[] {
  const today = startOfToday();
  const buckets: Bucket[] = [];

  if (range === "1 year") {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(1);
      start.setMonth(start.getMonth() - i);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      buckets.push({ start: start.getTime(), end: end.getTime(), in: 0, out: 0 });
    }
    return buckets;
  }

  if (range === "3 months") {
    const step = Math.ceil(RANGE_DAYS[range] / 12) * DAY;
    const end = today + DAY;
    for (let i = 11; i >= 0; i--) {
      const start = end - (i + 1) * step;
      buckets.push({ start, end: start + step, in: 0, out: 0 });
    }
    return buckets;
  }

  const days = RANGE_DAYS[range];
  for (let i = days - 1; i >= 0; i--) {
    const start = today - i * DAY;
    buckets.push({ start, end: start + DAY, in: 0, out: 0 });
  }
  return buckets;
}

function bucketLabel(range: InventoryRange, start: number) {
  const date = new Date(start);
  if (range === "7 days") {
    return date.toLocaleDateString("en-IN", { weekday: "short" });
  }
  if (range === "30 days" || range === "3 months") {
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function bucketIndex(buckets: Bucket[], ts: number) {
  return buckets.findIndex((b) => ts >= b.start && ts < b.end);
}

function inScope(t: StockTransaction, department: string) {
  if (department === "all") return true;
  return t.department === department || t.toDepartment === department;
}

function netQuantity(t: StockTransaction) {
  if (t.type === "stock-in") return t.quantity;
  if (t.type === "stock-out") return -Math.abs(t.quantity);
  return t.quantity;
}

function scopedTransactions(transactions: StockTransaction[], department: string) {
  return transactions.filter((t) => inScope(t, department));
}

export function InventoryChart({ range }: { range: InventoryRange }) {
  const { state, activeDepartment } = useApp();

  const data = useMemo(() => {
    const buckets = createBuckets(range);

    for (const t of scopedTransactions(state.transactions, activeDepartment)) {
      const idx = bucketIndex(buckets, new Date(t.date).getTime());
      if (idx === -1) continue;
      if (t.type === "stock-in") buckets[idx].in += t.quantity;
      else if (t.type === "stock-out") buckets[idx].out += Math.abs(t.quantity);
    }

    return buckets.map((b) => ({
      label: bucketLabel(range, b.start),
      "Stock In": b.in,
      "Stock Out": b.out,
      Net: b.in - b.out,
    }));
  }, [state.transactions, activeDepartment, range]);

  const hasData = data.some((d) => d["Stock In"] > 0 || d["Stock Out"] > 0);
  if (!hasData) return <ChartEmpty height={280} />;

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
  const sorted = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 8);
  const rest = sorted.slice(8);
  const restValue = rest.reduce((s, d) => s + d.value, 0);
  const slices = restValue > 0 ? [...top, { name: "Others", value: restValue, color: "#94a3b8" }] : top;

  if (total <= 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium">No stock recorded yet</p>
        <p className="text-muted-foreground max-w-[220px] text-xs">
          Department distribution appears once devices are stocked in.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-5 sm:flex-row">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} paddingAngle={2} strokeWidth={0}>
              {slices.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight">{formatNumber(total)}</span>
          <span className="text-muted-foreground text-xs">Units</span>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-1 flex-col gap-2 sm:max-h-[240px] sm:overflow-y-auto sm:pr-1">
        {slices.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground flex-1 truncate text-sm">{d.name}</span>
            <span className="text-sm font-medium tabular-nums">{formatNumber(d.value)}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{(d.value / total * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockMovementChart({ range }: { range: InventoryRange }) {
  const { state, activeDepartment } = useApp();

  const data = useMemo(() => {
    const buckets = createBuckets(range);

    for (const t of scopedTransactions(state.transactions, activeDepartment)) {
      const idx = bucketIndex(buckets, new Date(t.date).getTime());
      if (idx === -1) continue;
      if (t.type === "stock-in") buckets[idx].in += t.quantity;
      else if (t.type === "stock-out") buckets[idx].out += Math.abs(t.quantity);
    }

    return buckets.map((b) => ({
      label: bucketLabel(range, b.start),
      "Stock In": b.in,
      "Stock Out": b.out,
    }));
  }, [state.transactions, activeDepartment, range]);

  const hasData = data.some((d) => d["Stock In"] > 0 || d["Stock Out"] > 0);
  if (!hasData) return <ChartEmpty height={240} />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Stock In" fill="var(--primary)" name="Stock In" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Stock Out" fill="var(--chart-4)" name="Stock Out" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDistributionChart() {
  const { state, activeDepartment } = useApp();

  const data = useMemo(() => {
    const categoryByItemId = new Map(state.inventory.map((i) => [i.id, i.category || "Uncategorized"]));
    const categories: Record<string, { in: number; out: number; count: number }> = {};

    for (const t of scopedTransactions(state.transactions, activeDepartment)) {
      const category = t.category || categoryByItemId.get(t.itemId) || "Uncategorized";
      if (!categories[category]) categories[category] = { in: 0, out: 0, count: 0 };
      if (t.type === "stock-in") {
        categories[category].in += t.quantity;
        categories[category].count++;
      } else if (t.type === "stock-out") {
        categories[category].out += Math.abs(t.quantity);
        categories[category].count++;
      }
    }

    return Object.entries(categories)
      .map(([category, values]) => ({
        category,
        ...values,
        total: values.in + values.out,
        net: values.in - values.out,
      }))
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [state.transactions, state.inventory, activeDepartment]);

  if (data.length === 0) return <ChartEmpty height={300} />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={160} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="in" fill="var(--primary)" name="Stock In" radius={[0, 4, 4, 0]} />
        <Bar dataKey="out" fill="var(--chart-4)" name="Stock Out" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StockTrendChart({ range }: { range: InventoryRange }) {
  const { state, activeDepartment } = useApp();

  const data = useMemo(() => {
    const buckets = createBuckets(range);
    const scoped = scopedTransactions(state.transactions, activeDepartment);
    const rangeStart = buckets[0]?.start ?? 0;

    let runningBalance = 0;
    for (const t of scoped) {
      if (new Date(t.date).getTime() < rangeStart) runningBalance += netQuantity(t);
    }

    for (const t of scoped) {
      const idx = bucketIndex(buckets, new Date(t.date).getTime());
      if (idx === -1) continue;
      if (t.type === "stock-in") buckets[idx].in += t.quantity;
      else if (t.type === "stock-out") buckets[idx].out += Math.abs(t.quantity);
    }

    return buckets.map((b) => {
      runningBalance += b.in - b.out;
      return {
        label: bucketLabel(range, b.start),
        "Stock In": b.in,
        "Stock Out": b.out,
        Balance: runningBalance,
      };
    });
  }, [state.transactions, activeDepartment, range]);

  if (!data.some((d) => d.Balance !== 0)) return <ChartEmpty height={280} />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Line type="monotone" dataKey="Balance" stroke="var(--chart-3)" strokeWidth={2} name="Running Balance" dot={{ r: 3, strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopItemsChart() {
  const { state, activeDepartment } = useApp();

  const data = useMemo(() => {
    const items: Record<string, { name: string; in: number; out: number; movements: number }> = {};

    for (const t of scopedTransactions(state.transactions, activeDepartment)) {
      if (t.type !== "stock-in" && t.type !== "stock-out") continue;
      const key = t.itemId;
      if (!items[key]) items[key] = { name: t.itemName, in: 0, out: 0, movements: 0 };
      if (t.type === "stock-in") items[key].in += t.quantity;
      else items[key].out += Math.abs(t.quantity);
      items[key].movements++;
    }

    return Object.entries(items)
      .map(([id, values]) => ({ id, ...values, total: values.in + values.out }))
      .filter((i) => i.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [state.transactions, activeDepartment]);

  if (data.length === 0) return <ChartEmpty height={280} />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={62} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="in" fill="var(--primary)" name="Stock In" radius={[4, 4, 0, 0]} />
        <Bar dataKey="out" fill="var(--chart-4)" name="Stock Out" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyComparisonChart() {
  const { state, activeDepartment } = useApp();

  const data = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const monthly: Record<string, { in: number; out: number }> = {};
    months.forEach((m) => {
      monthly[m] = { in: 0, out: 0 };
    });

    for (const t of scopedTransactions(state.transactions, activeDepartment)) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) continue;
      if (t.type === "stock-in") monthly[key].in += t.quantity;
      else if (t.type === "stock-out") monthly[key].out += Math.abs(t.quantity);
    }

    return months.map((m) => {
      const [year, month] = m.split("-");
      return {
        month: new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", { month: "short" }),
        "Stock In": monthly[m].in,
        "Stock Out": monthly[m].out,
        Net: monthly[m].in - monthly[m].out,
      };
    });
  }, [state.transactions, activeDepartment]);

  const hasData = data.some((d) => d["Stock In"] > 0 || d["Stock Out"] > 0);
  if (!hasData) return <ChartEmpty height={260} />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={0} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Stock In" fill="var(--primary)" name="Stock In" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Stock Out" fill="var(--chart-4)" name="Stock Out" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
