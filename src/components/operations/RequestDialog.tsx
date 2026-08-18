"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import type { RequestPriority } from "@/types";

const schema = z.object({
  itemId: z.string().min(1, "Select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  priority: z.string().min(1, "Select priority"),
  subDepartment: z.string().optional(),
  reason: z.string().min(3, "Reason is required"),
});
type SV = z.output<typeof schema>;

export function RequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, activeDepartment, addRequest, subDepartmentsFor } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { itemId: "", quantity: 1, priority: "medium", subDepartment: "", reason: "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ itemId: "", quantity: 1, priority: "medium", subDepartment: "", reason: "" });
  }, [open, form]);

  const selectedItem = state.inventory.find((i) => i.id === form.watch("itemId"));
  const routedDepartment = selectedItem?.department ?? activeDepartment;
  const subOptions = subDepartmentsFor(routedDepartment);

  const onSubmit = (values: SV) => {
    addRequest({
      itemId: values.itemId,
      itemName: selectedItem?.name ?? "",
      quantity: values.quantity,
      priority: values.priority as RequestPriority,
      reason: values.reason,
      department: routedDepartment,
      subDepartment: values.subDepartment || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ClipboardList className="text-primary size-5" /> New Stock Request</DialogTitle>
          <DialogDescription>Request inventory for your department. Approval is required from management.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="itemId" render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("subDepartment", ""); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {state.inventory.filter((i) => !i.archived).map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {selectedItem && (
              <div className="bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Routed to:</span>
                <span className="inline-flex items-center gap-1">
                  {routedDepartment}
                  {subOptions.length > 0 && <span className="text-muted-foreground">/ {form.watch("subDepartment") || "select sub-department below"}</span>}
                </span>
              </div>
            )}
            {subOptions.length > 0 && (
              <FormField control={form.control} name="subDepartment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-department</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={`Route to ${routedDepartment} sub-department`} /></SelectTrigger>
                      <SelectContent>
                        {subOptions.map((s) => (
                          <SelectItem key={s.id} value={s.name}>{s.name} ({s.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["low", "medium", "high", "critical"] as const).map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Why is this stock needed?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}