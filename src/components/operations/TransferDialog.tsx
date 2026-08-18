"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";

const schema = z.object({
  fromDepartment: z.string().min(1, "Select source department"),
  toDepartment: z.string().min(1, "Select destination department"),
  itemId: z.string().min(1, "Select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().min(3, "Reason is required"),
});
type SV = z.output<typeof schema>;

export function TransferDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, visibleDepartments, addTransfer } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { fromDepartment: "", toDepartment: "", itemId: "", quantity: 1, reason: "" },
  });

  React.useEffect(() => {
    if (open) {
      const from = visibleDepartments.length === 1 ? visibleDepartments[0] : "";
      form.reset({ fromDepartment: from, toDepartment: "", itemId: "", quantity: 1, reason: "" });
    }
  }, [open, visibleDepartments, form]);

  const fromDept = form.watch("fromDepartment");
  const selectedItem = state.inventory.find((i) => i.id === form.watch("itemId"));
  const qty = form.watch("quantity") || 0;
  const over = selectedItem && qty > selectedItem.quantity;

  const onSubmit = (values: SV) => {
    addTransfer({
      fromDepartment: values.fromDepartment,
      toDepartment: values.toDepartment,
      itemId: values.itemId,
      itemName: selectedItem?.name ?? "",
      quantity: values.quantity,
      reason: values.reason,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="text-primary size-5" /> New Transfer</DialogTitle>
          <DialogDescription>Move inventory between departments. The transfer will require approval.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="fromDepartment" render={({ field }) => (
                <FormItem>
                  <FormLabel>From Department</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="From" /></SelectTrigger>
                      <SelectContent>
                        {visibleDepartments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="toDepartment" render={({ field }) => (
                <FormItem>
                  <FormLabel>To Department</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="To" /></SelectTrigger>
                      <SelectContent>
                        {state.departments.filter((d) => d.name !== fromDept).map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="itemId" render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {state.inventory.filter((i) => !i.archived && i.quantity > 0 && (!fromDept || i.department === fromDept)).map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku}) — {i.quantity} available</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl><Input type="number" min={1} max={selectedItem?.quantity ?? 1} {...field} /></FormControl>
                <FormDescription className={over ? "text-destructive font-medium" : undefined}>
                  {over ? `Only ${selectedItem?.quantity} available for transfer` : selectedItem ? `Available: ${selectedItem.quantity}` : ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Why is this transfer needed?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={over}>Create Transfer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}