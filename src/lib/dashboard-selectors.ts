import type { Asset, Technician } from "@/types";
import type { RequestPriority } from "@/types";

/**
 * Shared frontend selectors used by the dashboard so every displayed metric
 * is derived from the same underlying mock data as the Tickets / Technicians /
 * Inventory pages. Do not hardcode values in dashboard components.
 */

export const ACTIVE_TICKET_STATUSES: any[] = ["open", "in-progress", "partially-resolved"];

export function inDepartment(ticket: any, department: string | "all") {
  return department === "all" || ticket.department === department;
}

export function getTotalTickets(tickets: any[]) {
  return tickets.length;
}

export function getTicketsByStatus(tickets: any[], department: string | "all" = "all") {
  const scoped = tickets.filter((t) => inDepartment(t, department));
  return {
    open: scoped.filter((t) => t.status === "open").length,
    inProgress: scoped.filter((t) => t.status === "in-progress").length,
    partiallyResolved: scoped.filter((t) => t.status === "partially-resolved").length,
    resolved: scoped.filter((t) => t.status === "resolved").length,
    closed: scoped.filter((t) => t.status === "closed").length,
  };
}

export function getOpenTickets(tickets: any[], department: string | "all" = "all") {
  return getTicketsByStatus(tickets, department).open;
}

export function getInProgressTickets(tickets: any[], department: string | "all" = "all") {
  return getTicketsByStatus(tickets, department).inProgress;
}

export function getResolvedTickets(tickets: any[], department: string | "all" = "all") {
  return getTicketsByStatus(tickets, department).resolved;
}

export function getClosedTickets(tickets: any[], department: string | "all" = "all") {
  return getTicketsByStatus(tickets, department).closed;
}

export function getTicketsByPriority(tickets: any[], department: string | "all" = "all"): Record<RequestPriority, number> {
  const scoped = tickets.filter((t) => inDepartment(t, department));
  return {
    low: scoped.filter((t) => t.priority === "low").length,
    medium: scoped.filter((t) => t.priority === "medium").length,
    high: scoped.filter((t) => t.priority === "high").length,
    critical: scoped.filter((t) => t.priority === "critical").length,
  };
}

export function getTicketsByCategory(tickets: any[], department: string | "all" = "all") {
  const scoped = tickets.filter((t) => inDepartment(t, department));
  const map = new Map<string, number>();
  for (const t of scoped) map.set(t.category, (map.get(t.category) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Active-ticket count per technician, calculated from actual ticket
 * assignments (ticket.technicianId → technician.id) rather than a stored
 * counter, so it always stays synchronized with the Tickets page.
 */
export function getTechnicianWorkload(tickets: any[]): Map<string, number> {
  const workload = new Map<string, number>();
  for (const t of tickets) {
    if (!t.technicianId || !ACTIVE_TICKET_STATUSES.includes(t.status)) continue;
    workload.set(t.technicianId, (workload.get(t.technicianId) ?? 0) + 1);
  }
  return workload;
}

export function getTotalTechnicians(technicians: Technician[]) {
  return technicians.length;
}

export function getAvailableTechnicians(technicians: Technician[]) {
  return technicians.filter((t) => t.availability === "Available" && t.status === "Active").length;
}

export function getBusyTechnicians(technicians: Technician[]) {
  return technicians.filter((t) => t.availability === "Busy").length;
}

export function getTotalAssets(assets: Asset[]) {
  return assets.length;
}

export function getAssetsByStatus(assets: Asset[]) {
  const map = new Map<string, number>();
  for (const a of assets) map.set(a.status, (map.get(a.status) ?? 0) + 1);
  return map;
}
