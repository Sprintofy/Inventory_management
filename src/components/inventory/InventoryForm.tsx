"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/PageHeader";
import { Textarea } from "@/components/ui/textarea";
import { cn, uid } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { InventoryItem } from "@/types";
import Link from "next/link";

const formSchema = z.object({
  deviceName: z.string().min(2, "Device name is required"),
  brand: z.string().min(2, "Brand is required"),
  type: z.enum(["SER", "BER"]),
  dateOfVintage: z
    .string()
    .max(64, "Date of vintage must be 64 characters or less")
    .optional(),
  category: z.string().min(1, "Select a category"),
  notes: z.string().optional(),
  sku: z.string().min(2, "Reg No. is required"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  status: z.enum(["active", "inactive"]),
  department: z.string().min(1, "Department is required"),
  cpuType: z.enum(["CAN", "NCAN", "SA"]).optional(),
});

type FormValues = z.output<typeof formSchema>;

function emptyValues(department: string): FormValues {
  return {
    deviceName: "",
    brand: "",
    type: "SER" as const,
    dateOfVintage: "",
    category: "",
    notes: "",
    sku: "",
    quantity: 0,
    status: "active" as const,
    department,
    cpuType: undefined,
  };
}

function valuesOf(item: InventoryItem): FormValues {
  return {
    deviceName: item.deviceName,
    brand: item.brand,
    type: item.type,
    dateOfVintage: item.dateOfVintage ?? "",
    category: item.category,
    notes: item.notes ?? "",
    sku: item.sku,
    quantity: item.quantity,
    status: item.status,
    department: item.department,
    cpuType: item.cpuType,
  };
}

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  fullPage?: boolean;
}

export function InventoryForm({
  open,
  onOpenChange,
  item,
  fullPage = false,
}: InventoryFormProps) {
  const { state, activeDepartment, addItem, updateItem, log } = useApp();

  const existingSku = (sku: string, excludeId?: string) =>
    state.inventory.some(
      (i) =>
        i.sku.trim().toLowerCase() === sku.trim().toLowerCase() &&
        i.id !== excludeId,
    );

  const departmentOptions = React.useMemo(
    () =>
      activeDepartment === "all"
        ? state.departments.map((d) => d.name)
        : [activeDepartment],
    [activeDepartment, state.departments],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: item
      ? valuesOf(item)
      : emptyValues(activeDepartment === "all" ? "" : activeDepartment),
  });

  React.useEffect(() => {
    if (open) {
      if (item) form.reset(valuesOf(item));
      else
        form.reset(
          emptyValues(activeDepartment === "all" ? "" : activeDepartment),
        );
    }
  }, [open, item, form, activeDepartment]);

  const watchedDepartment = form.watch("department");

  const onSubmit = (values: FormValues) => {
    const now = new Date().toISOString();

    const status = values.status;

    const payload = {
      deviceName: values.deviceName.trim(),
      brand: values.brand.trim(),
      type: values.type,
      dateOfVintage: values.dateOfVintage?.trim() || undefined,
      category: values.category,
      notes: values.notes?.trim() || undefined,
      sku: values.sku.trim(),
      quantity: values.quantity,
      department: values.department,
      cpuType: values.cpuType,
    };

    if (item) {
      if (existingSku(values.sku.trim(), item.id)) {
        toast.error(`Reg No. "${values.sku.trim()}" already exists.`);
        return;
      }
      updateItem({
        ...item,
        ...payload,
        status,
        lastUpdated: now,
      });

      log("updated inventory", "Inventory", values.deviceName, "");
      toast.success("Inventory item updated successfully");
    } else {
      if (existingSku(values.sku.trim())) {
        toast.error(`Reg No. "${values.sku.trim()}" already exists.`);
        return;
      }
      addItem({
        ...payload,
        id: uid("INV"),
        status,
        lastUpdated: now,
        createdAt: now,
      });

      log("added inventory", "Inventory", values.deviceName, "");
      toast.success("Inventory item added successfully");
    }

    if (!fullPage) {
      onOpenChange(false);
    } else {
      window.location.href = "/inventory";
    }
  };

  const renderFormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Info */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Basic Info
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Device Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. MacBook Pro 14"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Apple" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SER">SER</SelectItem>
                        <SelectItem value="BER">BER</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfVintage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Vintage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 2019" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.categories.map((c, idx) => (
                          <SelectItem key={`cat-${c.id}-${idx}`} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reg No.</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. IT-DEV-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpuType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll of CPU</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select CPU roll" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CAN">CAN</SelectItem>
                        <SelectItem value="NKN">NKN</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Section 2: Details */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Additional notes about this item"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Section 3: Inventory */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Inventory
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {fullPage ? (
          <div className="flex flex-row gap-2 pt-4">
            <Link href="/inventory">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">{item ? "Update Item" : "Save Item"}</Button>
          </div>
        ) : (
          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{item ? "Update Item" : "Save Item"}</Button>
          </DialogFooter>
        )}
      </form>
    </Form>
  );

  if (fullPage) {
    return (
      <div className="space-y-5">
        <PageHeader
          title={item ? "Edit Inventory Item" : "Add Inventory Item"}
          description={
            item
              ? "Update the details of this inventory item."
              : "Create a new item in your inventory."
          }
          breadcrumb={[
            { label: "Inventory", href: "/inventory" },
            { label: item ? "Edit Item" : "Add Item" },
          ]}
          actions={
            <>
              <Link href="/inventory">
                <Button variant="outline">Back</Button>
              </Link>
            </>
          }
        />
        {renderFormContent()}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
          <DialogDescription>
            {item
              ? "Update the details of this inventory item."
              : "Create a new item in your inventory. All fields marked are required."}
          </DialogDescription>
        </DialogHeader>
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  );
}
