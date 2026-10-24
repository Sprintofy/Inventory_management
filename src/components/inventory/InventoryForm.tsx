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
import type { InventoryItem, SubDepartment } from "@/types";
import Link from "next/link";

const formSchema = z.object({
  deviceName: z.string().min(2, "Device name is required"),
  brand: z.string().min(2, "Brand is required"),
  modelNumber: z.string().min(2, "Model number is required"),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  specifications: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
  sku: z.string().min(2, "Reg No. is required"),
  supplier: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  status: z.enum(["active", "inactive"]),
  department: z.string().min(1, "Department is required"),
  subLevels: z.array(z.string()).optional(),
});

type FormValues = z.output<typeof formSchema>;

function emptyValues(department: string): FormValues {
  return {
    deviceName: "",
    brand: "",
    modelNumber: "",
    category: "",
    description: "",
    specifications: "",
    warrantyPeriod: "",
    serialNumber: "",
    notes: "",
    sku: "",
    supplier: "",
    quantity: 0,
    unit: "unit",
    status: "active" as const,
    department,
    subLevels: [],
  };
}

function valuesOf(item: InventoryItem, tree: SubDepartment[]): FormValues {
  const base = {
    deviceName: item.deviceName,
    brand: item.brand,
    modelNumber: item.modelNumber,
    category: item.category,
    description: item.description ?? "",
    specifications: item.specifications ?? "",
    warrantyPeriod: item.warrantyPeriod ?? "",
    serialNumber: item.serialNumber ?? "",
    notes: item.notes ?? "",
    sku: item.sku,
    supplier: item.supplier ?? "",
    quantity: item.quantity,
    unit: item.unit,
    status: item.status,
    department: item.department,
    subLevels: [] as string[],
  };
  if (item.subDepartment) {
    const path = findPath(tree, item.subDepartment);
    if (path && path.length > 0) {
      base.subLevels = path;
    } else {
      base.subLevels = [item.subDepartment];
    }
  }
  return base;
}

function findNode(subs: SubDepartment[], name: string): SubDepartment | null {
  for (const s of subs) {
    if (s.name === name) return s;
    const found = findNode(s.children, name);
    if (found) return found;
  }
  return null;
}

function findPath(subs: SubDepartment[], name: string, trail: string[] = []): string[] | null {
  for (const s of subs) {
    if (s.name === name) return [...trail, s.name];
    const found = findPath(s.children, name, [...trail, s.name]);
    if (found) return found;
  }
  return null;
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
  const { state, activeDepartment, subDepartmentsFor, addItem, updateItem, log } = useApp();

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
      ? valuesOf(item, subDepartmentsFor(item.department))
      : emptyValues(activeDepartment === "all" ? "" : activeDepartment),
  });

  React.useEffect(() => {
    if (open) {
      if (item) form.reset(valuesOf(item, subDepartmentsFor(item.department)));
      else
        form.reset(
          emptyValues(activeDepartment === "all" ? "" : activeDepartment),
        );
    }
  }, [open, item, form, activeDepartment, subDepartmentsFor]);

  const watchedDepartment = form.watch("department");
  const watchedLevels = form.watch("subLevels") ?? [];

  const topSubs = React.useMemo(
    () => (watchedDepartment ? subDepartmentsFor(watchedDepartment) : []),
    [watchedDepartment, subDepartmentsFor],
  );

  const levelChain = React.useMemo(() => {
    const chain: { options: SubDepartment[]; value: string }[] = [];
    let pool = topSubs;
    chain.push({ options: pool, value: watchedLevels[0] ?? "" });
    for (let k = 0; k < watchedLevels.length; k++) {
      const node = watchedLevels[k]
        ? findNode(pool, watchedLevels[k])
        : null;
      if (!node || node.children.length === 0) break;
      pool = node.children;
      chain.push({ options: pool, value: watchedLevels[k + 1] ?? "" });
    }
    return chain;
  }, [topSubs, watchedLevels]);

  const setLevel = (k: number, v: string) => {
    const next = [...(form.getValues("subLevels") ?? [])].slice(0, k);
    if (v) next[k] = v;
    form.setValue("subLevels", next, { shouldDirty: true });
  };

  const onSubmit = (values: FormValues) => {
    const now = new Date().toISOString();

    const status = values.status;

    const payload = {
      deviceName: values.deviceName.trim(),
      brand: values.brand.trim(),
      modelNumber: values.modelNumber.trim(),
      category: values.category,
      description: values.description?.trim() || undefined,
      specifications: values.specifications?.trim() || undefined,
      warrantyPeriod: values.warrantyPeriod?.trim() || undefined,
      serialNumber: values.serialNumber?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      sku: values.sku.trim(),
      supplier: values.supplier?.trim() || undefined,
      quantity: values.quantity,
      unit: values.unit,
      department: values.department,
      subDepartment:
        [...(values.subLevels ?? [])]
          .reverse()
          .find((v) => v.trim() !== "") || undefined,
    };

    if (item) {
      updateItem({
        ...item,
        ...payload,
        status,
        lastUpdated: now,
      });

      log("updated inventory", "Inventory", values.deviceName, "");
      toast.success("Inventory item updated successfully");
    } else {
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
              name="modelNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. MacBook Pro 14 M3"
                      {...field}
                    />
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
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
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ABC Supplies" {...field} />
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
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("subLevels", []);
                      }}
                    >
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
            {levelChain.map((level, k) => {
              const kept =
                level.value &&
                !level.options.some((s) => s.name === level.value)
                  ? level.value
                  : null;
              return (
                <FormField
                  key={k}
                  control={form.control}
                  name="subLevels"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        {k === 0
                          ? "Sub-department (optional)"
                          : `Layer ${k + 1} (optional)`}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={level.value ?? ""}
                          onValueChange={(v) => setLevel(k, v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                k === 0
                                  ? "Select sub-department"
                                  : `Select layer ${k + 1}`
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {level.options.length === 0 && !kept ? (
                              <SelectItem value="__none" disabled>
                                {k === 0
                                  ? "No sub-departments"
                                  : "No further layers"}
                              </SelectItem>
                            ) : (
                              <>
                                {kept && (
                                  <SelectItem value={kept}>
                                    {kept} (kept)
                                  </SelectItem>
                                )}
                                {level.options.map((s) => (
                                  <SelectItem key={s.id} value={s.name}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
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
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Short description of the item"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specifications"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Specifications</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Technical specifications"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. SN-MBP-1001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warrantyPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty Period</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "unit",
                          "box",
                          "pack",
                          "set",
                          "pair",
                          "roll",
                          "drum",
                          "ream",
                          "coil",
                          "kit",
                          "can",
                          "sheet",
                        ].map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
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
            <Button type="submit">
              {item ? "Update Item" : "Save Item"}
            </Button>
          </div>
        ) : (
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {item ? "Update Item" : "Save Item"}
            </Button>
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
