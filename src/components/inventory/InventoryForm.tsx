"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn, uid } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { InventoryItem, SubDepartment } from "@/types";

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
  sku: z.string().min(2, "SKU is required"),
  supplier: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  status: z.enum(["active", "inactive"]),
  department: z.string().min(1, "Department is required"),
  subDepartment: z.string().optional(),
  layer2: z.string().optional(),
  layer3: z.string().optional(),
});

type FormValues = z.output<typeof formSchema>;

const steps = [
  { id: "basic", label: "Basic Info" },
  { id: "details", label: "Details" },
  { id: "inventory", label: "Inventory" },
];

const stepFields: Record<string, (keyof FormValues)[]> = {
  basic: [
    "deviceName",
    "brand",
    "modelNumber",
    "category",
    "sku",
    "supplier",
    "department",
    "subDepartment",
  ],
  details: ["description", "specifications", "warrantyPeriod", "serialNumber", "notes"],
  inventory: ["quantity", "unit", "status"],};

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
    subDepartment: "",
    layer2: "",
    layer3: "",
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
    subDepartment: "",
    layer2: "",
    layer3: "",
  };
  if (item.subDepartment) {
    const path = findPath(tree, item.subDepartment);
    if (path) {
      base.subDepartment = path[0] ?? "";
      base.layer2 = path[1] ?? "";
      base.layer3 = path[2] ?? "";
    } else {
      base.subDepartment = item.subDepartment;
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
}

export function InventoryForm({
  open,
  onOpenChange,
  item,
}: InventoryFormProps) {
  const { state, activeDepartment, subDepartmentsFor, addItem, updateItem, log } = useApp();
  const [step, setStep] = React.useState(0);

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
      setStep(0);
      if (item) form.reset(valuesOf(item, subDepartmentsFor(item.department)));
      else
        form.reset(
          emptyValues(activeDepartment === "all" ? "" : activeDepartment),
        );
    }
  }, [open, item, form, activeDepartment, subDepartmentsFor]);
  // eslint-disable-line react-hooks/set-state-in-effect

  const watchedDepartment = form.watch("department");
  const watchedSub = form.watch("subDepartment");
  const watchedLayer2 = form.watch("layer2");
  const topSubs = React.useMemo(
    () => (watchedDepartment ? subDepartmentsFor(watchedDepartment) : []),
    [watchedDepartment, subDepartmentsFor],
  );
  const layer2Options = React.useMemo(
    () => (watchedSub ? (findNode(topSubs, watchedSub)?.children ?? []) : []),
    [watchedSub, topSubs],
  );
  const layer3Options = React.useMemo(
    () =>
      watchedLayer2
        ? (findNode(layer2Options, watchedLayer2)?.children ?? [])
        : [],
    [watchedLayer2, layer2Options],
  );

  const validateStep = async (i: number) => {
    const fields = stepFields[steps[i].id];
    const result = await form.trigger(fields as never);
    return result;
  };

  const next = async () => {
    if (await validateStep(step))
      setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

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
        values.layer3?.trim() ||
        values.layer2?.trim() ||
        values.subDepartment?.trim() ||
        undefined,
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

    onOpenChange(false);
  };

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

        <div className="mb-2 flex items-center gap-1">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-primary/10 text-primary cursor-pointer"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <span className="bg-border h-px flex-1" />
              )}
            </React.Fragment>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {step === 0 && (
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
                            {state.categories.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
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
                      <FormLabel>SKU</FormLabel>
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
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue("subDepartment", "");
                            form.setValue("layer2", "");
                            form.setValue("layer3", "");
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
                <FormField
                  control={form.control}
                  name="subDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-department (optional)</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue("layer2", "");
                            form.setValue("layer3", "");
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select sub-department" />
                          </SelectTrigger>
                          <SelectContent>
                            {topSubs.length === 0 ? (
                              <SelectItem value="__none" disabled>
                                No sub-departments
                              </SelectItem>
                            ) : (
                              topSubs.map((s) => (
                                <SelectItem key={s.id} value={s.name}>
                                  {s.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {layer2Options.length > 0 && (
                  <FormField
                    control={form.control}
                    name="layer2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layer 2 (optional)</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(v) => {
                              field.onChange(v);
                              form.setValue("layer3", "");
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select layer 2" />
                            </SelectTrigger>
                            <SelectContent>
                              {layer2Options.map((s) => (
                                <SelectItem key={s.id} value={s.name}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {layer3Options.length > 0 && (
                  <FormField
                    control={form.control}
                    name="layer3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layer 3 (optional)</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select layer 3" />
                            </SelectTrigger>
                            <SelectContent>
                              {layer3Options.map((s) => (
                                <SelectItem key={s.id} value={s.name}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {step === 1 && (
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
            )}

            {step === 2 && (
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
            )}

            <DialogFooter className="border-t pt-4">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={prev}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button type="button" onClick={next}>
                  Next <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit">
                  {item ? "Update Item" : "Save Item"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
