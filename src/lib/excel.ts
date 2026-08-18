import * as XLSX from "xlsx";
import type { AssetMovement, Ticket } from "@/types";
import { computeDailyStock, dayLabel, issueCounts } from "@/lib/ticket-utils";

function fmt(value: unknown) {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

function dateOnly(date?: string) {
  return date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function sheet(rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = (Object.keys(rows[0] ?? {})).map(() => ({ wch: 22 }));
  return ws;
}

export function exportTicketsExcel(tickets: Ticket[], movements: AssetMovement[], filename = `tickets-export-${new Date().toISOString().slice(0, 10)}.xlsx`) {
  const summary = tickets.map((t) => {
    const counts = issueCounts(t.issues);
    return {
      "Ticket Number": t.id,
      Customer: fmt(t.customer),
      "Ticket Date": dateOnly(t.createdAt),
      "Ticket Status": t.status,
      "Total Assets": t.assets.length,
      "Total Issues": counts.total,
      "Open Issues": counts.open + counts.inProgress,
      "Resolved Issues": counts.resolved,
    };
  });

  const assetRows: Record<string, unknown>[] = [];
  const issueRows: Record<string, unknown>[] = [];
  for (const t of tickets) {
    const assetIdByAsset = new Map(t.assets.map((a) => [a.id, a.assetId]));
    for (const a of t.assets) {
      assetRows.push({
        "Ticket Number": t.id,
        "Asset ID": a.assetId,
        "Serial Number": fmt(a.serialNumber),
        "Item Type": a.itemType,
        "Item Description": a.name,
        "Current Location": a.currentLocation,
        "Current Status": a.status === "in" ? "Checked In" : a.status === "out" ? "Checked Out" : "In Transit",
        "Check-In Date": dateOnly(a.checkInDate),
        "Check-Out Date": dateOnly(a.checkOutDate),
      });
    }
    for (const iss of t.issues) {
      issueRows.push({
        "Ticket Number": t.id,
        "Asset ID": iss.assetId ? fmt(assetIdByAsset.get(iss.assetId)) : "—",
        "Issue Title": iss.title,
        "Issue Description": fmt(iss.description),
        Priority: iss.priority,
        Status: iss.status,
        "Assigned Technician": fmt(iss.assignedTo),
        "Created Date": dateOnly(iss.createdAt),
        "Resolved Date": dateOnly(iss.resolvedAt),
        "Resolution/Remarks": fmt(iss.resolution),
      });
    }
  }

  const movementRows = movements.map((m) => ({
    Date: new Date(m.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }),
    "Ticket Number": m.ticketId,
    "Asset ID": m.assetId,
    "Serial Number": fmt(m.serialNumber),
    "Item Type": m.itemType,
    "Movement Type": m.movementType,
    "From Location": m.fromLocation,
    "To Location": m.toLocation,
    "Performed By": m.performedBy,
    Remarks: fmt(m.remarks),
  }));

  const dailyRows = computeDailyStock(movements).map((d) => ({
    Date: dayLabel(d.date),
    "Opening Stock": d.opening,
    "Stock In": d.stockIn,
    "Stock Out": d.stockOut,
    Transfers: d.transfers,
    "Closing Stock": d.closing,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(summary), "Ticket Summary");
  XLSX.utils.book_append_sheet(wb, sheet(assetRows), "Assets");
  XLSX.utils.book_append_sheet(wb, sheet(issueRows), "Issues");
  XLSX.utils.book_append_sheet(wb, sheet(movementRows), "Inventory Transactions");
  XLSX.utils.book_append_sheet(wb, sheet(dailyRows), "Daily Stock");
  XLSX.writeFile(wb, filename);
}

export function exportMovementsExcel(movements: AssetMovement[], filename = `inventory-movements-${new Date().toISOString().slice(0, 10)}.xlsx`) {
  const rows = movements.map((m) => ({
    Date: new Date(m.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }),
    "Ticket Number": m.ticketId,
    "Asset ID": m.assetId,
    "Serial Number": fmt(m.serialNumber),
    "Item Type": m.itemType,
    "Item Name": m.itemName,
    "Movement Type": m.movementType,
    "From Location": m.fromLocation,
    "To Location": m.toLocation,
    "Performed By": m.performedBy,
    Remarks: fmt(m.remarks),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows), "Inventory Transactions");
  XLSX.writeFile(wb, filename);
}

export function exportInventoryExcel(items: Array<Record<string, unknown>>, filename = `inventory-export-${new Date().toISOString().slice(0, 10)}.xlsx`) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(items), "Inventory");
  XLSX.writeFile(wb, filename);
}

export function exportDailyStockExcel(movements: AssetMovement[], filename = `daily-stock-${new Date().toISOString().slice(0, 10)}.xlsx`) {
  const rows = computeDailyStock(movements).map((d) => ({
    Date: dayLabel(d.date),
    "Opening Stock": d.opening,
    "Stock In": d.stockIn,
    "Stock Out": d.stockOut,
    Transfers: d.transfers,
    "Closing Stock": d.closing,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows), "Daily Stock");
  XLSX.writeFile(wb, filename);
}