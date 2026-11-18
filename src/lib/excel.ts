import * as XLSX from "xlsx";
import type { InventoryItem } from "@/types";

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
  "Type",
  "Maintenance Type",
  "Date of Vintage",
  "Roll of CPU",
  "Reg No.",
  "Category",
  "Department",
  "Quantity",
  "Notes",
  "Status",
  "Last Updated",
  "Created At",
];

const inventoryRow = (i: InventoryItem): (string | number)[] => [
  i.deviceName,
  fmt(i.brand),
  fmt(i.type),
  fmt(i.maintenanceType),
  fmt(i.dateOfVintage),
  fmt(i.cpuType),
  i.sku,
  i.category,
  i.department,
  i.quantity,
  fmt(i.notes),
  i.status,
  dateOnly(i.lastUpdated),
  dateOnly(i.createdAt),
];

function inventorySheet(items: InventoryItem[]) {
  const rows = items.map(inventoryRow);
  const ws = XLSX.utils.aoa_to_sheet([INVENTORY_HEADERS, ...rows]);
  return ws;
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
      type: "C" as const,
      maintenanceType: "SER" as const,
      dateOfVintage: "2021",
      cpuType: "SA" as const,
      sku: "IT-DEV-001",
      category: "IT Equipment",
      department: "TRG BRANCH",
      quantity: 24,
      notes: "Standard developer machine",
      status: "active",
      lastUpdated: now,
      createdAt: now,
    },
    {
      id: "INV-SAMPLE-2",
      deviceName: "Safety Helmet (White)",
      brand: "SafeGuard",
      type: "NC" as const,
      maintenanceType: "BER" as const,
      dateOfVintage: "2019",
      cpuType: "CAN" as const,
      sku: "SFT-HLM-003",
      category: "Safety Equipment",
      department: "ADM BR",
      quantity: 100,
      status: "active",
      lastUpdated: now,
      createdAt: now,
    },
  ] as unknown as InventoryItem[];

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
