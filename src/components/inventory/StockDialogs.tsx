"use client";

import * as React from "react";
import { PackageMinus, PackagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import type { InventoryItem } from "@/types";
import { formatNumber } from "@/lib/utils";

interface StockLine {
  itemId: string;
  quantity: number;
}

/**
 * Multi-item Stock In (Mar 6) — no Supplier tab.
 * Department is derived from the item / logged-in user scope.
 */
export function StockInDialog({ open, onOpenChange, presetItem }: { open: boolean; onOpenChange: (o: boolean) => void; presetItem?: InventoryItem | null }) {
  const { state, visibleDepartments, stockIn } = useApp();
  const [lines, setLines] = React.useState<StockLine[]>([{ itemId: "", quantity: 1 }]);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setLines(presetItem ? [{ itemId: presetItem.id, quantity: 1 }] : [{ itemId: "", quantity: 1 }]);
      setNote("");
    }
  }, [open, presetItem]);
  // eslint-disable-line react-hooks/set-state-in-effect

  const options = React.useMemo(
    () => state.inventory.filter((i) => (visibleDepartments.length === 0 || visibleDepartments.includes(i.department))),
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackagePlus className="text-success size-5" /> Record Stock In</DialogTitle>
          <DialogDescription>Add one or more items. Quantity is added to each item&apos;s stock.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {lines.map((l, idx) => {
            const sel = state.inventory.find((i) => i.id === l.itemId);
            return (
              <div key={idx} className="flex items-end gap-2 rounded-lg border p-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Item {idx + 1}</Label>
                  <Select value={l.itemId} onValueChange={(v) => updateLine(idx, { itemId: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {options.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.deviceName} ({i.sku}) — {formatNumber(i.quantity)} in stock</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sel && <p className="text-muted-foreground text-[11px]">Current: {formatNumber(sel.quantity)} → {formatNumber(sel.quantity + (l.quantity || 0))}</p>}
                </div>
                <div className="w-24 space-y-1.5">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                </div>
                {lines.length > 1 && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} aria-label="Remove row">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, { itemId: "", quantity: 1 }])}>
            <Plus className="size-3.5" /> Add another item
          </Button>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input placeholder="e.g. Purchase order reference" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!valid} onClick={onSubmit} className="bg-success hover:bg-success/90 text-white">Record Stock In ({lines.length})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Stock Out — Recipient / Employee removed (Mar 7).
 * Issues to the item's own department with a purpose only.
 */
export function StockOutDialog({ open, onOpenChange, presetItem }: { open: boolean; onOpenChange: (o: boolean) => void; presetItem?: InventoryItem | null }) {
  const { state, visibleDepartments, stockOut, user } = useApp();
  const [itemId, setItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [purpose, setPurpose] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setItemId(presetItem?.id ?? "");
      setQuantity(1);
      setPurpose("");
      setNote("");
    }
  }, [open, presetItem]);
  // eslint-disable-line react-hooks/set-state-in-effect

  const selectedItem = state.inventory.find((i) => i.id === itemId);
  const overAvailable = selectedItem && quantity > selectedItem.quantity;
  const closedItemIds = React.useMemo(
    () => new Set(state.tickets.filter((t) => t.status === "closed").flatMap((t) => t.itemIds ?? [])),
    [state.tickets]
  );
  const options = state.inventory.filter((i) => (visibleDepartments.length === 0 || visibleDepartments.includes(i.department)) && i.quantity > 0 && closedItemIds.has(i.id));

  const onSubmit = () => {
    if (!itemId || quantity < 1 || purpose.trim().length < 2) {
      toast.error("Select an item, quantity and purpose");
      return;
    }
    if (overAvailable) {
      toast.error(`Only ${selectedItem?.quantity} available`);
      return;
    }
    // Recipient removed — issue is recorded against the user's department scope.
    stockOut(itemId, quantity, user?.name ?? "Department", purpose.trim(), note || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackageMinus className="text-primary size-5" /> Issue Stock</DialogTitle>
          <DialogDescription>Issue inventory from your department. Stock quantity will be reduced.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Item (closed tickets only)</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
              <SelectContent>
                {options.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.deviceName} ({i.sku}) — {i.quantity} left</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {options.length === 0 && (
              <p className="text-muted-foreground text-[11px]">No items with closed tickets — only items from closed tickets can be issued.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input type="number" min={1} max={selectedItem?.quantity ?? 1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!!overAvailable || !itemId || purpose.trim().length < 2} onClick={onSubmit}>Issue Stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
