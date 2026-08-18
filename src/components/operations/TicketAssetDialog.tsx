"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Boxes, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import type { TicketAsset, TicketAssetStatus } from "@/types";

export const assetItemTypes = ["PC", "Laptop", "CPU", "Fan", "Monitor", "Printer", "UPS", "Switch", "AC Unit", "Machine", "Projector", "Extinguisher", "Motor", "Rack", "Access Point", "Spill Kit", "Boots", "Stationery", "Other"];

export const movementLocations = ["Customer", "Technician", "Technician Bench", "Repair Center", "Main Warehouse", "IT Store", "Engineering Store", "Logistics Bay", "Server Room", "Training Lab", "Maintenance Workshop", "Administration Room"];

const schema = z.object({
  assetId: z.string().min(2, "Asset ID is required (e.g. PC-001)"),
  serialNumber: z.string().optional(),
  itemType: z.string().min(1, "Select item type"),
  name: z.string().min(3, "Item name/description is required"),
  currentLocation: z.string().min(1, "Select current location"),
  status: z.string().min(1, "Select status"),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  notes: z.string().optional(),
});
type SV = z.output<typeof schema>;

export function TicketAssetDialog({
  open,
  onOpenChange,
  ticketId,
  asset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ticketId: string;
  asset: TicketAsset | null;
}) {
  const { addTicketAsset, updateTicketAsset } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { assetId: "", serialNumber: "", itemType: "", name: "", currentLocation: "", status: "in", checkInDate: "", checkOutDate: "", notes: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        assetId: asset?.assetId ?? "",
        serialNumber: asset?.serialNumber ?? "",
        itemType: asset?.itemType ?? "",
        name: asset?.name ?? "",
        currentLocation: asset?.currentLocation ?? "",
        status: asset?.status ?? "in",
        checkInDate: asset?.checkInDate ? new Date(asset.checkInDate).toISOString().slice(0, 10) : "",
        checkOutDate: asset?.checkOutDate ? new Date(asset.checkOutDate).toISOString().slice(0, 10) : "",
        notes: asset?.notes ?? "",
      });
    }
  }, [open, form, asset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Boxes className="text-primary size-5" /> {asset ? "Edit Asset" : "Add Asset"}</DialogTitle>
          <DialogDescription>A ticket can carry many assets — PCs, CPUs, fans, monitors and other equipment. Each asset is tracked independently.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => {
            const payload = {
              assetId: values.assetId,
              serialNumber: values.serialNumber || undefined,
              itemType: values.itemType,
              name: values.name,
              currentLocation: values.currentLocation,
              status: values.status as TicketAssetStatus,
              checkInDate: values.checkInDate ? new Date(values.checkInDate).toISOString() : undefined,
              checkOutDate: values.checkOutDate ? new Date(values.checkOutDate).toISOString() : undefined,
              notes: values.notes || undefined,
            };
            if (asset) updateTicketAsset(ticketId, asset.id, payload);
            else addTicketAsset(ticketId, payload);
            onOpenChange(false);
          })} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="assetId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset ID</FormLabel>
                  <FormControl><Input placeholder="e.g. PC-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="serialNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl><Input placeholder="e.g. SN-PC-1001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="itemType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {assetItemTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Checked In</SelectItem>
                        <SelectItem value="out">Checked Out</SelectItem>
                        <SelectItem value="in-transit">In Transit</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name / Description</FormLabel>
                <FormControl><Input placeholder="e.g. Dell OptiPlex 7010 Desktop" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="currentLocation" render={({ field }) => (
              <FormItem>
                <FormLabel>Current Location</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {movementLocations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="checkInDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-In Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="checkOutDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-Out Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Optional remarks about this asset" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{asset ? "Save Changes" : <><Plus className="size-4" /> Add Asset</>}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}