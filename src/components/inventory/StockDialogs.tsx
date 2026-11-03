"use client";

import * as React from "react";
import { PackagePlus, Clock, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import type { InventoryItem, StockInRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

interface StockLine {
  itemId: string;
  quantity: number;
}

/**
 * Right-side panel showing a selected product's stock-in history with remarks.
 */
function ProductHistoryPanel({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const { state, fetchStockInHistory } = useApp();

  React.useEffect(() => {
    if (!itemId) return;
    fetchStockInHistory(itemId);
  }, [itemId, fetchStockInHistory]);

  const history = React.useMemo(
    () =>
      state.stockInHistory
        .filter((r: StockInRecord) => r.itemId === itemId)
        .sort(
          (a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime(),
        ),
    [state.stockInHistory, itemId],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-muted pb-1.5">
        <PackagePlus className="text-primary size-4" />
        <h3 className="text-sm font-semibold">Stock-In History</h3>
      </div>
      <p className="text-xs text-muted-foreground">{itemName}</p>

      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          No stock-in records found for this product.
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((r) => (
            <div key={r.id} className="rounded-lg border bg-muted/30 p-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-primary">
                  WO {r.workOrderId}
                </span>
                <span className="text-muted-foreground">Job {r.jobNo}</span>
              </div>
              <div className="grid gap-1 text-[11px] sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground block">Date In</span>
                  <span className="font-medium">{formatDate(r.dateIn)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Qty</span>
                  <span className="font-medium tabular-nums">
                    +{formatNumber(r.quantity)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <span className={`font-medium ${
                    r.status === "Sent" ? "text-destructive" : "text-success"
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
              {r.remarks && (
                <div className="mt-1">
                  <span className="text-muted-foreground text-[10px] block">
                    Remarks
                  </span>
                  <span className="text-sm">{r.remarks}</span>
                </div>
              )}
              <div className="text-[10px] text-muted-foreground mt-1">
                By {r.createdBy} · {r.department}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-muted mt-2 pt-1.5">
        <p className="text-[10px] text-muted-foreground text-center">
          History updates when you select a product.
        </p>
      </div>
    </div>
  );
}

export function StockInDialog({
  open,
  onOpenChange,
  fullPage = false,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  fullPage?: boolean;
}) {
  const { state, stockIn, visibleDepartments, user } = useApp();
  const [itemId, setItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [defect, setDefect] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setItemId("");
      setQuantity(1);
      setNote("");
      setDefect("");
    }
  }, [open]);

  const selectedItem = state.inventory.find((i) => i.id === itemId);
  const overAvailable = selectedItem && quantity > selectedItem.quantity;

  const options = state.inventory.filter(
    (i) =>
      visibleDepartments.length === 0 ||
      visibleDepartments.includes(i.department),
  );

  const valid = !!itemId && quantity >= 1;

  const onSubmit = () => {
    if (!valid) {
      toast.error("Select a product and quantity");
      return;
    }
    stockIn(itemId, quantity, note || undefined, defect || undefined);
    if (!fullPage) {
      onOpenChange(false);
    } else {
      window.location.href = "/stock-in";
    }
  };

  const renderContent = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Product</Label>
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {options.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.deviceName} (Reg No. {i.sku}) · Type {i.type} ·{" "}
                {formatNumber(i.quantity)} in stock
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity</Label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Number(e.target.value) || 1))
            }
          />
          {selectedItem && (
            <p className="text-muted-foreground text-[11px]">
              Available: {formatNumber(selectedItem.quantity)}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Note (optional)</Label>
          <Input
            placeholder="Remarks for this stock-in"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Defect</Label>
          <Input
            placeholder="Defect description (alphanumeric)"
            value={defect}
            onChange={(e) => setDefect(e.target.value)}
          />
        </div>
      </div>

      {/* Auto-generated fields (read-only) */}
      {selectedItem && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Work Order Id</Label>
              <Input
                className="bg-muted/50"
                readOnly
                placeholder="Auto-generated on save"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Job No</Label>
              <Input
                className="bg-muted/50"
                readOnly
                placeholder="Auto-generated on save"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date In</Label>
              <Input
                className="bg-muted/50"
                readOnly
                placeholder="Auto-calculated on save"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Product Type</Label>
              <Input
                className="bg-muted/50"
                readOnly
                value={selectedItem.type}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPU Type</Label>
              <Input
                className="bg-muted/50"
                readOnly
                value={selectedItem.cpuType ?? "-"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const selectedItemForHistory = itemId ? selectedItem : undefined;

  if (fullPage) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Record Stock In"
          description="Receive inventory. Work Order Id and Job No are auto-generated."
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-6"
        >
          {renderContent()}
          <div className="flex flex-row gap-2 pt-4">
            <Link href="/stock-in">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={!valid}
              className="bg-success hover:bg-success/90 text-white"
            >
              Record Stock In
            </Button>
          </div>
        </form>
        {selectedItemForHistory && (
          <Card className="border rounded-xl p-4">
            <ProductHistoryPanel
              itemId={selectedItemForHistory.id}
              itemName={selectedItemForHistory.deviceName}
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[900px] ${
          selectedItemForHistory ? "grid grid-cols-12 gap-6" : ""
        }`}
      >
        <DialogHeader className="col-span-full">
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="text-success size-5" /> Record Stock In
          </DialogTitle>
          <DialogDescription>
            Receive inventory. Work Order Id and Job No are auto-generated.
          </DialogDescription>
        </DialogHeader>

        <div className="col-span-7 space-y-4">{renderContent()}</div>

        {selectedItemForHistory && (
          <div className="col-span-5 space-y-4">
            <Card>
              <CardContent className="p-4">
                <ProductHistoryPanel
                  itemId={selectedItemForHistory.id}
                  itemName={selectedItemForHistory.deviceName}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="col-span-full border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!valid}
            onClick={onSubmit}
            className="bg-success hover:bg-success/90 text-white"
          >
            Record Stock In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
