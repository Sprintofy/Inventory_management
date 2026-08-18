"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { movementLocations } from "@/components/operations/TicketAssetDialog";
import type { MovementType, TicketAsset } from "@/types";

const schema = z.object({
  movementType: z.string().min(1, "Select movement type"),
  fromLocation: z.string().min(1, "Select from location"),
  toLocation: z.string().min(1, "Select to location"),
  remarks: z.string().optional(),
});
type SV = z.output<typeof schema>;

export function MovementDialog({
  open,
  onOpenChange,
  ticketId,
  asset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ticketId: string;
  asset: TicketAsset;
}) {
  const { addMovement } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { movementType: "check-in", fromLocation: "", toLocation: "", remarks: "" },
  });
  const movementType = form.watch("movementType");

  React.useEffect(() => {
    if (open) {
      form.reset({
        movementType: "check-in",
        fromLocation: movementType === "check-out" ? "Technician Bench" : asset.currentLocation === "Customer" ? "Customer" : asset.currentLocation,
        toLocation: movementType === "check-out" ? "Customer" : "Repair Center",
        remarks: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form, asset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="text-primary size-5" /> Record Movement</DialogTitle>
          <DialogDescription>{asset.assetId} — {asset.name}. Every movement is stored as its own transaction and never overwritten.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => {
            addMovement(ticketId, asset.id, {
              serialNumber: asset.serialNumber,
              itemType: asset.itemType,
              itemName: asset.name,
              movementType: values.movementType as MovementType,
              fromLocation: values.fromLocation,
              toLocation: values.toLocation,
              remarks: values.remarks || undefined,
            });
            onOpenChange(false);
          })} className="space-y-4">
            <FormField control={form.control} name="movementType" render={({ field }) => (
              <FormItem>
                <FormLabel>Movement Type</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check-in">Check-In</SelectItem>
                      <SelectItem value="check-out">Check-Out</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="fromLocation" render={({ field }) => (
                <FormItem>
                  <FormLabel>From Location</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="From" /></SelectTrigger>
                      <SelectContent>
                        {movementLocations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="toLocation" render={({ field }) => (
                <FormItem>
                  <FormLabel>To Location</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="To" /></SelectTrigger>
                      <SelectContent>
                        {movementLocations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl><Textarea rows={2} placeholder="e.g. Received for repair, issued to technician…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Record Movement</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}