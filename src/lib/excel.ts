import * as XLSX from "xlsx";
import type { AssetMovement, InventoryItem, Ticket } from "@/types";
import { computeDailyStock, dayLabel, issueCounts } from "@/lib/ticket-utils";

function fmt(value: unknown) {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

function dateOnly(date?: string) {
  return date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function sheet(rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = Object.keys(rows[0] ?? {});
  ws["!cols"] = keys.map((k) => {
    let maxLen = k.length;
    for (const r of rows) {
      const len = String(r[k] ?? "").length;
      if (len > maxLen) maxLen = len;
      if (maxLen >= 42) break;
    }
    return { wch: Math.min(42, Math.max(12, maxLen + 3)) };
  });
  return ws;
}

const INVENTORY_HEADERS = [
  "Item Name",
  "SKU",
  "Category",
  "Subcategory",
  "Department",
  "Location",
  "Quantity",
  "Unit",
  "Min Stock",
  "Reorder Level",
  "Max Stock",
  "Unit Cost",
  "Total Value",
  "Supplier",
  "Serial Number",
  "Asset Number",
  "Batch Number",
  "Condition",
  "Warranty",
  "Status",
  "Last Updated",
];

const inventoryRow = (i: InventoryItem): (string | number)[] => [
  i.name,
  i.sku,
  i.category,
  fmt(i.subcategory),
  i.department,
  i.location,
  i.quantity,
  i.unit,
  i.minStock,
  i.reorderLevel,
  i.maxStock,
  i.unitCost,
  i.quantity * i.unitCost,
  fmt(i.supplier),
  fmt(i.serialNumber),
  fmt(i.assetNumber),
  fmt(i.batchNumber),
  fmt(i.condition),
  fmt(i.warranty),
  i.status,
  dateOnly(i.lastUpdated),
];

function inventorySheet(items: InventoryItem[]) {
  const rows = items.map(inventoryRow);
  const colCount = INVENTORY_HEADERS.length;
  const aoa: (string | number)[][] = [
    ["Inventory Report"],
    [`Exported on ${dateOnly(new Date().toISOString())} • ${items.length} item${items.length === 1 ? "" : "s"}`],
    [],
    [...INVENTORY_HEADERS],
    ...rows,
    [],
  ];
  if (items.length > 0) {
    aoa.push(["Total", "", "", "", "", "", items.reduce((s, i) => s + i.quantity, 0), "", "", "", "", "", items.reduce((s, i) => s + i.quantity * i.unitCost, 0)]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }];
  ws["!cols"] = INVENTORY_HEADERS.map((header, ci) => {
    let maxLen = header.length;
    for (const r of rows) {
      const len = String(r[ci] ?? "").length;
      if (len > maxLen) maxLen = len;
      if (maxLen >= 40) break;
    }
    return { wch: Math.min(40, Math.max(12, maxLen + 3)) };
  });
  ws["!rows"] = [{ hpt: 26 }, { hpt: 15 }, { hpt: 6 }, { hpt: 20 }];

  const numericCols = [6, 8, 9, 10, 11, 12];
  for (let r = 4; r < 4 + items.length; r++) {
    for (const c of numericCols) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "number") cell.z = c === 11 || c === 12 ? "₹#,##0" : "#,##0";
    }
  }

  if (items.length > 0) {
    const last = 5 + items.length; // totals row (after blank spacer)
    for (const c of numericCols) {
      const cell = ws[XLSX.utils.encode_cell({ r: last, c })];
      if (cell && typeof cell.v === "number") cell.z = c === 11 || c === 12 ? "₹#,##0" : "#,##0";
    }
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: 3 + items.length, c: colCount - 1 } }) };
  }

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

export function exportInventoryExcel(items: InventoryItem[], filename = `inventory-export-${new Date().toISOString().slice(0, 10)}.xlsx`) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, inventorySheet(items), "Inventory");
  XLSX.writeFile(wb, filename);
}

export function exportInventoryTemplate(filename = `inventory-import-template-${new Date().toISOString().slice(0, 10)}.xlsx`) {
  const now = new Date().toISOString();
  const sampleItems = [
    {
      name: "MacBook Pro 14\" — Dev Laptop",
      sku: "IT-DEV-001",
      category: "IT Equipment",
      subcategory: "Laptops",
      description: "Apple MacBook Pro 14-inch, M3 Pro chip, 18GB RAM, 512GB SSD",
      department: "IT",
      subDepartment: "Hardware Support",
      location: "Main Warehouse",
      quantity: 24,
      unit: "unit",
      minStock: 5,
      reorderLevel: 10,
      maxStock: 60,
      unitCost: 145000,
      supplier: "TechNova Distributors",
      serialNumber: "SN-MBP-1001",
      assetNumber: "AST-2001",
      batchNumber: "B-2026-001",
      condition: "New",
      warranty: "12 months",
      notes: "Standard developer machine",
      status: "in-stock",
      lastUpdated: now,
      createdAt: now,
    },
    {
      name: "Safety Helmet (White)",
      sku: "SFT-HLM-003",
      category: "Safety Equipment",
      subcategory: "PPE",
      department: "Operations",
      location: "Main Warehouse",
      quantity: 100,
      unit: "unit",
      minStock: 50,
      reorderLevel: 100,
      maxStock: 800,
      unitCost: 480,
      supplier: "SafeGuard PPE",
      condition: "New",
      status: "in-stock",
      lastUpdated: now,
      createdAt: now,
    },
  ] as InventoryItem[];

  const ws = inventorySheet(sampleItems);
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as (string | number)[][];
  aoa[1] = ["Template — replace the sample rows below with your inventory data. Status, Total Value and Last Updated are auto-computed on import."];
  const rebuilt = XLSX.utils.aoa_to_sheet(aoa);
  rebuilt["!merges"] = ws["!merges"];
  rebuilt["!cols"] = ws["!cols"];
  rebuilt["!rows"] = ws["!rows"];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, rebuilt, "Inventory Template");
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