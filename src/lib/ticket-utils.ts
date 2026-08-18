import type { AssetMovement, TicketIssue, TicketStatus } from "@/types";

export interface IssueCounts {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

export function issueCounts(issues: TicketIssue[]): IssueCounts {
  return {
    open: issues.filter((i) => i.status === "open").length,
    inProgress: issues.filter((i) => i.status === "in-progress").length,
    resolved: issues.filter((i) => i.status === "resolved" || i.status === "closed").length,
    total: issues.length,
  };
}

export function ticketStatusFromIssues(issues: TicketIssue[], current: TicketStatus): TicketStatus {
  if (issues.length === 0) return "open";
  const { open, inProgress, resolved, total } = issueCounts(issues);
  if (resolved === total) return "resolved";
  if (resolved > 0) return "partially-resolved";
  if (inProgress > 0) return "in-progress";
  if (open > 0) return "open";
  return current;
}

export interface DailyStockRow {
  date: string;
  opening: number;
  stockIn: number;
  stockOut: number;
  transfers: number;
  closing: number;
}

export function computeDailyStock(movements: AssetMovement[]): DailyStockRow[] {
  const byDay = new Map<string, { stockIn: number; stockOut: number; transfers: number }>();
  for (const m of movements) {
    const day = new Date(m.date).toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { stockIn: 0, stockOut: 0, transfers: 0 };
    if (m.movementType === "check-in") entry.stockIn += 1;
    else if (m.movementType === "check-out") entry.stockOut += 1;
    else entry.transfers += 1;
    byDay.set(day, entry);
  }
  const days = [...byDay.keys()].sort();
  let opening = 0;
  return days.map((day) => {
    const { stockIn, stockOut, transfers } = byDay.get(day)!;
    const closing = opening + stockIn - stockOut;
    const row: DailyStockRow = { date: day, opening, stockIn, stockOut, transfers, closing };
    opening = closing;
    return row;
  });
}

export function dayLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}