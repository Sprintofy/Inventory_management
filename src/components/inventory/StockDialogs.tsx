"use client";

import * as React from "react";
import { PackageMinus, PackagePlus, Plus, Trash2, Package, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";
import { useApp } from "@/store/app-store";
import type { InventoryItem, StockInRecord, StockOutRecord, Ticket } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StockLine {
  itemId: string;
  quantity: number;
}

interface HistoryRecord {
  id: string;
  reference: string;
  date: string;
  quantity: number;
  department?: string;
  purpose?: string;
  supplier?: string;
  createdBy?: string;
  recipient?: string;
  status?: string;
}

/**
 * Right-side panel showing a selected product's stock-in and stock-out history.
 */
function ProductHistoryPanel({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const { state, fetchStockInHistory, fetchStockOutHistory, fetchTicketHistory } = useApp();

  React.useEffect(() => {
    if (!itemId) return;
    fetchStockInHistory(itemId);
    fetchStockOutHistory(itemId);
    fetchTicketHistory(itemId);
  }, [itemId, fetchStockInHistory, fetchStockOutHistory, fetchTicketHistory]);

  const inHistory = state.stockInHistory.filter(
    (r: StockInRecord) => r.itemId === itemId,
  );
  const outHistory = state.stockOutHistory.filter(
    (r: StockOutRecord) => r.itemId === itemId,
  );

  const ticketHistory = (state.ticketHistory as Ticket[]).filter(
    (t: Ticket) => t.itemIds.includes(itemId),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-muted pb-1.5">
        <Package className="text-primary size-4" />
        <h3 className="text-sm font-semibold">Product History</h3>
      </div>
      <p className="text-xs text-muted-foreground">{itemName}</p>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-semibold text-success">
            ▲ Stock In
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            ({inHistory.length})
          </span>
        </div>
        {inHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No stock-in records yet.
          </p>
        ) : (
          <div className="space-y-1">
            {inHistory.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-xs bg-muted/30 rounded p-2"
              >
                <div className="min-w-[110px]">
                  <div className="text-xs font-medium">{formatDate(r.date)}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {r.reference}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-success">+{r.quantity}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {r.department || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-semibold text-destructive">
            ▼ Stock Out
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            ({outHistory.length})
          </span>
        </div>
        {outHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No stock-out records yet.
          </p>
        ) : (
          <div className="space-y-1">
            {outHistory.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-xs bg-muted/30 rounded p-2"
              >
                <div className="min-w-[110px]">
                  <div className="text-xs font-medium">{formatDate(r.date)}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {r.reference}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-destructive">
                    -{r.quantity}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {r.purpose || r.department || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-semibold text-primary">
            🎫 Tickets
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            ({ticketHistory.length})
          </span>
        </div>
        {ticketHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No tickets raised for this product yet.
          </p>
        ) : (
          <div className="space-y-1">
            {ticketHistory.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-xs bg-muted/30 rounded p-2"
              >
                <div className="min-w-[110px]">
                  <div className="text-xs font-medium">{t.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {t.id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-primary">
                    {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-muted mt-2 pt-1.5">
        <p className="text-[10px] text-muted-foreground text-center">
          History updates when you select a product.
        </p>
      </div>
    </div>
  );
}

/**
 * Multi-item Stock In (Mar 6) — no Supplier tab.
 * Department is derived from the item / logged-in user scope.
 */
export function StockInDialog({
  open,
  onOpenChange,
  presetItem,
  fullPage = false,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetItem?: InventoryItem | null;
  fullPage?: boolean;
}) {
  const { state, visibleDepartments, stockIn, user } = useApp();
  const [lines, setLines] = React.useState<StockLine[]>([{ itemId: "", quantity: 1 }]);
  const [note, setNote] = React.useState("");
  const [historyItemId, setHistoryItemId] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setLines(presetItem ? [{ itemId: presetItem.id, quantity: 1 }] : [{ itemId: "", quantity: 1 }]);
      setNote("");
      setHistoryItemId("");
    }
  }, [open, presetItem]);

  // Track the first line's selected item for the history panel.
  React.useEffect(() => {
    setHistoryItemId(lines[0]?.itemId ?? "");
  }, [lines]);

  const options = React.useMemo(
    () =>
      state.inventory.filter((i) => (visibleDepartments.length === 0 || visibleDepartments.includes(i.department))),
    [state.inventory, visibleDepartments]
  );

  const updateLine = (idx: number, patch: Partial<StockLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const valid = lines.length > 0 && lines.every((l) => l.itemId && l.quantity >= 1);

  const onSubmit = () => {
    if (!valid) {
      toast.error("Select an item and quantity for every row");
      return;
    }
    for (const l of lines) {
      const item = state.inventory.find((i) => i.id === l.itemId);
      stockIn(l.itemId, l.quantity, item?.supplier ?? "Internal", note || undefined);
    }
    if (!fullPage) {
      onOpenChange(false);
    } else {
      window.location.href = "/stock-in";
    }
  };

  const renderContent = () => (
    <div className="space-y-3">
      {lines.map((l, idx) => {
        const sel = state.inventory.find((i) => i.id === l.itemId);
        return (
          <div key={idx} className="flex items-end gap-2 rounded-lg border p-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Item {idx + 1}</Label>
              <Select value={l.itemId} onValueChange={(v) => updateLine(idx, { itemId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.deviceName} ({i.sku}) — {formatNumber(i.quantity)} in stock
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sel && (
                <p className="text-muted-foreground text-[11px]">
                  Current: {formatNumber(sel.quantity)} →{" "}
                  {formatNumber(sel.quantity + (l.quantity || 0))}
                </p>
              )}
            </div>
            <div className="w-24 space-y-1.5">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                min={1}
                value={l.quantity}
                onChange={(e) =>
                  updateLine(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })
                }
              />
            </div>
            {lines.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                aria-label="Remove row"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setLines((prev) => [...prev, { itemId: "", quantity: 1 }])}
      >
        <Plus className="size-3.5" /> Add another item
      </Button>
      <div className="space-y-1.5">
        <Label className="text-xs">Note (optional)</Label>
        <Input
          placeholder="e.g. Purchase order reference"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );

  const selectedItem = historyItemId ? state.inventory.find((i) => i.id === historyItemId) : undefined;

  if (fullPage) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Record Stock In"
          description="Add one or more items. Quantity is added to each item's stock."
          breadcrumb={[
            { label: "Stock In", href: "/stock-in" },
            { label: "Record Stock In" },
          ]}
          actions={
            <>
              <Link href="/stock-in">
                <Button variant="outline">Back</Button>
              </Link>
            </>
          }
        />
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
          {renderContent()}
          <div className="flex flex-row gap-2 pt-4">
            <Link href="/stock-in">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={!valid} className="bg-success hover:bg-success/90 text-white">
              Record Stock In ({lines.length})
            </Button>
          </div>
        </form>
        {selectedItem && (
          <Card className="border rounded-xl p-4">
            <ProductHistoryPanel itemId={selectedItem.id} itemName={selectedItem.deviceName} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto sm:max-w-[900px] ${selectedItem ? "grid grid-cols-12 gap-6" : ""}`}
      >
        <DialogHeader className="col-span-full">
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="text-success size-5" /> Record Stock In
          </DialogTitle>
          <DialogDescription>
            Add one or more items. Quantity is added to each item&apos;s stock.
          </DialogDescription>
        </DialogHeader>

        <div className="col-span-7 space-y-3">
          {renderContent()}
        </div>

        {selectedItem && (
          <div className="col-span-5 space-y-3">
            <Card>
              <CardContent className="p-4">
                <ProductHistoryPanel
                  itemId={selectedItem.id}
                  itemName={selectedItem.deviceName}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="col-span-full border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!valid}
            onClick={onSubmit}
            className="bg-success hover:bg-success/90 text-white"
          >
            Record Stock In ({lines.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Stock Out — Recipient / Employee removed (Mar 7).
 * Issues to the item's own department with a purpose only.
 */
export function StockOutDialog({
  open,
  onOpenChange,
  presetItem,
  fullPage = false,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetItem?: InventoryItem | null;
  fullPage?: boolean;
}) {
  const router = useRouter();
  const { state, visibleDepartments, stockOut, user } = useApp();
  const [itemId, setItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [purpose, setPurpose] = React.useState("");
  const [note, setNote] = React.useState("");
  const [reference, setReference] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setItemId(presetItem?.id ?? "");
      setQuantity(1);
      setPurpose("");
      setNote("");
      setReference(`SO-${Date.now().toString().slice(-6)}`);
    }
  }, [open, presetItem]);

  const selectedItem = state.inventory.find((i) => i.id === itemId);
  const overAvailable = selectedItem && quantity > selectedItem.quantity;
  const closedItemIds = React.useMemo(
    () => new Set(state.tickets.filter((t) => t.status === "closed").flatMap((t) => t.itemIds ?? [])),
    [state.tickets]
  );
  const options = state.inventory.filter(
    (i) =>
      (visibleDepartments.length === 0 || visibleDepartments.includes(i.department)) &&
      i.quantity > 0 &&
      closedItemIds.has(i.id),
  );

  const onSubmit = () => {
    if (!itemId || quantity < 1 || purpose.trim().length < 2) {
      toast.error("Select an item, quantity and purpose");
      return;
    }
    if (overAvailable) {
      toast.error(`Only ${selectedItem?.quantity} available`);
      return;
    }
    stockOut(itemId, quantity, user?.name ?? "Department", purpose.trim(), note || undefined, reference);
    if (!fullPage) {
      onOpenChange(false);
    } else {
      window.location.href = "/stock-out";
    }
  };

  const renderContent = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Reference</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Item (closed tickets only)</Label>
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {options.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.deviceName} ({i.sku}) — {i.quantity} left
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {options.length === 0 && (
          <p className="text-muted-foreground text-[11px]">
            No items with closed tickets — only items from closed tickets can be issued.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity</Label>
          <Input
            type="number"
            min={1}
            max={selectedItem?.quantity ?? 1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Number(e.target.value) || 1))
            }
          />
          {selectedItem && (
            <p className={overAvailable ? "text-destructive text-[11px] font-medium" : "text-muted-foreground text-[11px]"}>
              {overAvailable ? `Only ${selectedItem.quantity} available` : `Available: ${formatNumber(selectedItem.quantity)}`}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Purpose</Label>
          <Input placeholder="e.g. Project deployment" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Note (optional)</Label>
        <Input placeholder="Additional remarks" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Issue Stock"
          description="Issue inventory from your department. Stock quantity will be reduced."
          breadcrumb={[
            { label: "Stock Out", href: "/stock-out" },
            { label: "Issue Stock" },
          ]}
          actions={
            <>
              <Link href="/stock-out">
                <Button variant="outline">Back</Button>
              </Link>
            </>
          }
        />
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
          {renderContent()}
          <div className="flex flex-row gap-2 pt-4">
            <Link href="/stock-out">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={!!overAvailable || !itemId || purpose.trim().length < 2}
              className="bg-success hover:bg-success/90 text-white"
            >
              Issue Stock
            </Button>
          </div>
        </form>
        {selectedItem && (
          <Card className="border rounded-xl p-4">
            <ProductHistoryPanel itemId={selectedItem.id} itemName={selectedItem.deviceName} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[900px] ${selectedItem ? "grid grid-cols-12 gap-6" : ""}`}
      >
        <DialogHeader className="col-span-full">
          <DialogTitle className="flex items-center gap-2">
            <PackageMinus className="text-primary size-5" /> Issue Stock
          </DialogTitle>
          <DialogDescription>
            Issue inventory from your department. Stock quantity will be reduced.
          </DialogDescription>
        </DialogHeader>

        <div className="col-span-7 space-y-4">
          {renderContent()}
        </div>

        {selectedItem && (
          <div className="col-span-5 space-y-4">
            <Card>
              <CardContent className="p-4">
                <ProductHistoryPanel itemId={selectedItem.id} itemName={selectedItem.deviceName} />
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="col-span-full border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!!overAvailable || !itemId || purpose.trim().length < 2}
            onClick={onSubmit}
            className="bg-success hover:bg-success/90 text-white"
          >
            Issue Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
