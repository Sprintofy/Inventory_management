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
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: "No rows" }]);
  const keys = Object.keys(rows[0] ?? { Note: "No rows" });
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
  "Device Name",
  "Brand",
  "Model Number",
  "SKU",
  "Category",
  "Department",
  "Sub Department",
  "Quantity",
  "Unit",
  "Supplier",
  "Serial Number",
  "Description",
  "Specifications",
  "Warranty Period",
  "Notes",
  "Status",
  "Last Updated",
  "Created At",
];

const inventoryRow = (i: InventoryItem): (string | number)[] => [
  i.deviceName,
  fmt(i.brand),
  fmt(i.modelNumber),
  i.sku,
  i.category,
  i.department,
  fmt(i.subDepartment),
  i.quantity,
  i.unit,
  fmt(i.supplier),
  fmt(i.serialNumber),
  fmt(i.description),
  fmt(i.specifications),
  fmt(i.warrantyPeriod),
  fmt(i.notes),
  i.status,
  dateOnly(i.lastUpdated),
  dateOnly(i.createdAt),
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
    aoa.push(["Total", "", "", "", "", "", "", items.reduce((s, i) => s + i.quantity, 0)]);
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

  const numericCols = [7];
  for (let r = 4; r < 4 + items.length; r++) {
    for (const c of numericCols) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "number") cell.z = "#,##0";
    }
  }

  if (items.length > 0) {
    const last = 5 + items.length;
    for (const c of numericCols) {
      const cell = ws[XLSX.utils.encode_cell({ r: last, c })];
      if (cell && typeof cell.v === "number") cell.z = "#,##0";
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
      id: "INV-SAMPLE-1",
      deviceName: "MacBook Pro 14\" — Dev Laptop",
      brand: "Apple",
      modelNumber: "MacBook Pro 14 M3",
      sku: "IT-DEV-001",
      category: "IT Equipment",
      description: "Apple MacBook Pro 14-inch, M3 Pro chip, 18GB RAM, 512GB SSD",
      specifications: "M3 Pro, 18GB RAM, 512GB SSD",
      warrantyPeriod: "12 months",
      department: "TRG BRANCH",
      subDepartment: undefined,
      quantity: 24,
      unit: "unit",
      supplier: "TechNova Distributors",
      serialNumber: "SN-MBP-1001",
      notes: "Standard developer machine",
      status: "in-stock",
      lastUpdated: now,
      createdAt: now,
    },
    {
      id: "INV-SAMPLE-2",
      deviceName: "Safety Helmet (White)",
      brand: "SafeGuard",
      modelNumber: "SG-HLM-WHT",
      sku: "SFT-HLM-003",
      category: "Safety Equipment",
      department: "ADM BR",
      quantity: 100,
      unit: "unit",
      supplier: "SafeGuard PPE",
      status: "in-stock",
      lastUpdated: now,
      createdAt: now,
    },
  ] as InventoryItem[];

  const ws = inventorySheet(sampleItems);
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as (string | number)[][];
  aoa[1] = ["Template — replace the sample rows below with your inventory data. Status and Last Updated are auto-computed on import."];
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
