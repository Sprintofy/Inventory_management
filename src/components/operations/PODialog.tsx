"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { formatCurrency, uid } from "@/lib/utils";

const schema = z.object({
  supplier: z.string().min(1, "Select a supplier"),
  department: z.string().min(1, "Select a department"),
  itemName: z.string().min(2, "Item name is required"),
  qty: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  cost: z.coerce.number().min(0, "Enter a valid cost"),
  expectedDelivery: z.string().min(1, "Expected delivery is required"),
});
type SV = z.output<typeof schema>;

export function PODialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, visibleDepartments, addPO } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { supplier: "", department: "", itemName: "", qty: 1, cost: 0, expectedDelivery: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        supplier: "",
        department: visibleDepartments.length === 1 ? visibleDepartments[0] : "",
        itemName: "",
        qty: 1,
        cost: 0,
        expectedDelivery: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      });
    }
  }, [open, visibleDepartments, form]);

  const qty = form.watch("qty") || 0;
  const cost = form.watch("cost") || 0;

  const onSubmit = (values: SV) => {
    addPO({
      poNumber: uid("PO-2026"),
      supplier: values.supplier,
      department: values.department,
      items: [{ name: values.itemName, qty: values.qty, cost: values.cost }],
      amount: values.qty * values.cost,
      orderDate: new Date().toISOString(),
      expectedDelivery: new Date(values.expectedDelivery).toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShoppingCart className="text-primary size-5" /> New Purchase Order</DialogTitle>
          <DialogDescription>Create a draft purchase order. It can be submitted for approval.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {state.suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {state.departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="itemName" render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl><Input placeholder="e.g. Cisco Catalyst 2960 Switch" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="qty" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost (₹)</FormLabel>
                  <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expectedDelivery" render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Delivery</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="bg-muted/60 flex items-center justify-between rounded-lg px-4 py-3 text-sm">
              <span className="text-muted-foreground">Order total</span>
              <span className="font-semibold tabular-nums">{formatCurrency(qty * cost)}</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create Draft PO</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}