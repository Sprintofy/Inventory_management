"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/store/app-store";
import { uid } from "@/lib/utils";
import { exportInventoryTemplate } from "@/lib/excel";
import type { InventoryItem } from "@/types";

type ParsedItem = Omit<InventoryItem, "id" | "status" | "lastUpdated" | "createdAt">;

interface ParsedRow {
  row: number;
  item: ParsedItem;
  errors: string[];
}

const HEADER_FIELDS: Record<string, string> = {
  devicename: "deviceName",
  itemname: "deviceName",
  name: "deviceName",
  item: "deviceName",
  brand: "brand",
  type: "type",
  dateofvintage: "dateOfVintage",
  vintage: "dateOfVintage",
  cputype: "cpuType",
  rollofcpu: "cpuType",
  sku: "sku",
  code: "sku",
  category: "category",
  department: "department",
  quantity: "quantity",
  qty: "quantity",
  qtyonhand: "quantity",
  notes: "notes",
  remarks: "notes",
};

const REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: "deviceName", label: "Device Name" },
  { field: "sku", label: "Reg No." },
  { field: "category", label: "Category" },
  { field: "department", label: "Department" },
];

const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pick(raw: Record<string, unknown>, aliases: string[]): unknown {
  for (const a of aliases) {
    const v = raw[a];
    if (v !== "" && v !== undefined && v !== null) return v;
  }
  return "";
}

export function InventoryImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addItem, log, state } = useApp();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<ParsedRow[]>([]);
  const [dragging, setDragging] = React.useState(false);

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setFileName(null);
      setRows([]);
      setDragging(false);
    }
    onOpenChange(o);
  };

  const parseFile = async (file: File) => {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error(
        "Unsupported file type. Please upload an .xlsx, .xls or .csv file.",
      );
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        toast.error("No sheets found in the selected file.");
        return;
      }
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
      });
      if (raw.length === 0) {
        toast.error("The selected file has no data rows.");
        return;
      }

      const headerKeys = Object.keys(raw[0]).map(normalizeKey);
      const requiredPresent = REQUIRED_FIELDS.map((f) => f.field).filter((f) =>
        Object.entries(HEADER_FIELDS).some(
          ([hk, field]) => field === f && headerKeys.includes(hk),
        ),
      );
      const missing = REQUIRED_FIELDS.filter(
        (f) => !requiredPresent.includes(f.field),
      );
      if (missing.length > 0) {
        toast.error(
          `File is missing required columns: ${missing.map((m) => m.label).join(", ")}`,
        );
        return;
      }

      const parsed: ParsedRow[] = raw.map((r, idx) => {
        const rowNum = idx + 2;
        const get = (field: string) => {
          const aliases = Object.keys(HEADER_FIELDS).filter(
            (hk) => HEADER_FIELDS[hk] === field,
          );
          return rawAlias(headerKeys, r, aliases);
        };
        const errors: string[] = [];
        for (const req of REQUIRED_FIELDS) {
          const v = get(req.field);
          const clean = String(v ?? "").trim();
          if (clean === "" || v === null || v === undefined)
            errors.push(`${req.label} is required`);
        }

        const quantity = toNumber(get("quantity"));
        if (quantity === null) errors.push("Quantity must be a number");
        else if (quantity < 0) errors.push("Quantity cannot be negative");

        const sku = String(get("sku") ?? "").trim();
        if (
          !errors.includes("Reg No. is required") &&
          state.inventory.some((i) => i.sku.toLowerCase() === sku.toLowerCase())
        ) {
          errors.push(`Reg No. "${sku}" already exists in inventory`);
        }

        const rawType = String(get("type") ?? "").trim().toUpperCase();
        if (rawType && rawType !== "W" && rawType !== "C" && rawType !== "NC") {
          errors.push("Type must be W, C or NC");
        }

        return {
          row: rowNum,
          errors,
          item: {
            deviceName: String(get("deviceName") ?? "").trim(),
            brand: String(get("brand") ?? "").trim() || "—",
            type: (rawType || "C") as "W" | "C" | "NC",
            dateOfVintage:
              String(get("dateOfVintage") ?? "").trim() || undefined,
            cpuType: (String(get("cpuType") ?? "").trim() || undefined) as
              | "CAN"
              | "NCAN"
              | "SA"
              | undefined,
            sku,
            category: String(get("category") ?? "").trim(),
            department: String(get("department") ?? "").trim(),
            quantity: quantity ?? 0,
            notes: String(get("notes") ?? "").trim() || undefined,
          },
        };
      });

      setRows(parsed);
      setFileName(file.name);
      const bad = parsed.filter((p) => p.errors.length > 0).length;
      if (bad > 0) {
        toast.warning(
          `Parsed ${parsed.length} rows — ${bad} row${bad === 1 ? "" : "s"} have errors and will be skipped.`,
        );
      } else {
        toast.success(
          `Parsed ${parsed.length} row${parsed.length === 1 ? "" : "s"} successfully.`,
        );
      }
    } catch {
      toast.error(
        "Could not read the file. Make sure it is a valid Excel/CSV file.",
      );
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void parseFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void parseFile(file);
  };

  const onImport = () => {
    const valid = rows.filter((r) => r.errors.length === 0);
    const now = new Date().toISOString();
    for (const { item } of valid) {
      addItem({
        ...item,
        id: uid("INV"),
        status: "active",
        lastUpdated: now,
        createdAt: now,
      });
      log("imported inventory", "Inventory", item.deviceName, item.department);
    }
    const skipped = rows.length - valid.length;
    toast.success(
      `Imported ${valid.length} item${valid.length === 1 ? "" : "s"} successfully.`,
    );
    if (skipped > 0)
      toast.warning(
        `${skipped} row${skipped === 1 ? "" : "s"} skipped due to errors.`,
      );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="text-primary size-5" /> Import Inventory
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to add multiple items to inventory. Each
            row must follow the same fields used in the inventory.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="space-y-3">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40 hover:bg-accent/50"}`}
            >
              <Upload className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">
                Click to choose a file or drag &amp; drop it here
              </p>
              <p className="text-muted-foreground text-xs">
                Supported formats: .xlsx, .xls, .csv
              </p>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={onPickFile}
              />
            </label>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Required columns: Device Name, Reg No., Category, Department
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportInventoryTemplate();
                  toast.success("Import template downloaded");
                }}
              >
                <Download className="size-3.5" /> Download Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="text-primary size-4" />
                <span className="font-medium">{fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  <CheckCircle2 className="mr-1 inline size-3" />
                  {validCount} valid
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 inline size-3" />
                    {invalidRows.length} with errors
                  </Badge>
                )}
              </div>
            </div>

            {invalidRows.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-destructive mb-2 text-xs font-semibold">
                  Rows that will be skipped
                </p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {invalidRows.slice(0, 8).map((r) => (
                    <p key={r.row} className="text-muted-foreground text-xs">
                      <span className="font-mono font-medium text-foreground">
                        Row {r.row}:
                      </span>{" "}
                      {r.errors.join("; ")}
                    </p>
                  ))}
                  {invalidRows.length > 8 && (
                    <p className="text-muted-foreground text-xs">
                      …and {invalidRows.length - 8} more
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRows([]);
                  setFileName(null);
                }}
              >
                Choose Another File
              </Button>
              <Button onClick={onImport} disabled={validCount === 0}>
                <Upload className="size-4" /> Import {validCount} Item
                {validCount === 1 ? "" : "s"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function rawAlias(
  headerKeys: string[],
  raw: Record<string, unknown>,
  aliases: string[],
): unknown {
  const normalized = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [normalizeKey(k), v]),
  );
  return pick(normalized, aliases);
}
