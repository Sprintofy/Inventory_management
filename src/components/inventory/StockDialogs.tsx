"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { PackageMinus, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import type { InventoryItem } from "@/types";
import { formatNumber } from "@/lib/utils";

const stockInSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  supplier: z.string().min(1, "Select a supplier"),
  note: z.string().optional(),
});

const stockOutSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  recipient: z.string().min(2, "Recipient is required"),
  purpose: z.string().min(2, "Purpose is required"),
  note: z.string().optional(),
});

export function StockInDialog({ open, onOpenChange, presetItem }: { open: boolean; onOpenChange: (o: boolean) => void; presetItem?: InventoryItem | null }) {
  const { state, visibleDepartments, stockIn } = useApp();
  type SV = z.output<typeof stockInSchema>;
  const form = useForm<SV>({
    resolver: zodResolver(stockInSchema) as unknown as Resolver<SV>,
    defaultValues: { itemId: "", quantity: 1, supplier: "", note: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ itemId: presetItem?.id ?? "", quantity: presetItem ? Math.max(1, Math.round(presetItem.reorderLevel / 2)) : 1, supplier: presetItem?.supplier ?? "", note: "" });
    }
  }, [open, presetItem, form]);

  const selectedItem = state.inventory.find((i) => i.id === form.watch("itemId"));
  const quantity = form.watch("quantity") || 0;

  const onSubmit = (values: z.infer<typeof stockInSchema>) => {
    stockIn(values.itemId, values.quantity, values.supplier, values.note);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackagePlus className="text-success size-5" /> Record Stock In</DialogTitle>
          <DialogDescription>Receive inventory into stock. Quantity will be added to the item.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="itemId" render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {state.inventory.filter((i) => !i.archived && visibleDepartments.includes(i.department)).map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormDescription>{selectedItem ? `Current stock: ${formatNumber(selectedItem.quantity)} → ${formatNumber(selectedItem.quantity + quantity)}` : ""}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {state.suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem>
                <FormLabel>Note (optional)</FormLabel>
                <FormControl><Input placeholder="e.g. Purchase order reference" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-success hover:bg-success/90 text-white">Record Stock In</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function StockOutDialog({ open, onOpenChange, presetItem }: { open: boolean; onOpenChange: (o: boolean) => void; presetItem?: InventoryItem | null }) {
  const { state, visibleDepartments, stockOut } = useApp();
  type SV = z.output<typeof stockOutSchema>;
  const form = useForm<SV>({
    resolver: zodResolver(stockOutSchema) as unknown as Resolver<SV>,
    defaultValues: { itemId: "", quantity: 1, recipient: "", purpose: "", note: "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ itemId: presetItem?.id ?? "", quantity: presetItem ? Math.min(1, presetItem.quantity) : 1, recipient: "", purpose: "", note: "" });
  }, [open, presetItem, form]);

  const selectedItem = state.inventory.find((i) => i.id === form.watch("itemId"));
  const quantity = form.watch("quantity") || 0;
  const overAvailable = selectedItem && quantity > selectedItem.quantity;

  const onSubmit = (values: z.infer<typeof stockOutSchema>) => {
    stockOut(values.itemId, values.quantity, values.recipient, values.purpose, values.note);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackageMinus className="text-primary size-5" /> Issue Stock</DialogTitle>
          <DialogDescription>Issue inventory to a recipient. Stock quantity will be reduced.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="itemId" render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {state.inventory.filter((i) => !i.archived && visibleDepartments.includes(i.department) && i.quantity > 0).map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku}) — {i.quantity} left</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl><Input type="number" min={1} max={selectedItem?.quantity ?? 1} {...field} /></FormControl>
                  {selectedItem && (
                    <FormDescription className={overAvailable ? "text-destructive font-medium" : undefined}>
                      {overAvailable ? `Only ${selectedItem.quantity} available` : `Available: ${formatNumber(selectedItem.quantity)}`}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="recipient" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient / Employee</FormLabel>
                  <FormControl><Input placeholder="e.g. Divya Menon" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="purpose" render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <FormControl><Input placeholder="e.g. Project deployment" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem>
                <FormLabel>Note (optional)</FormLabel>
                <FormControl><Input placeholder="Additional remarks" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={overAvailable}>Issue Stock</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}