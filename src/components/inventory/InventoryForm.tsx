"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, uid } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { InventoryItem, SubDepartment } from "@/types";
import { computeStatus } from "@/data/mock";

const formSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  sku: z.string().min(2, "SKU is required"),
  category: z.string().min(1, "Select a category"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  purchaseDate: z.string().optional(),
  serialNumber: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  location: z.string().min(1, "Select a location"),
  department: z.string().min(1, "Select a department"),
  subDepartment: z.string().optional(),
  supplier: z.string().optional(),
});

type FormValues = z.output<typeof formSchema>;

const steps = [
  { id: "basic", label: "Basic Info" },
  { id: "inventory", label: "Inventory" },
];

const stepFields: Record<string, (keyof FormValues)[]> = {
  basic: ["name", "sku", "category", "subcategory", "description", "purchaseDate", "serialNumber"],
  inventory: ["quantity", "unit", "location", "department", "subDepartment", "supplier"],
};

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
}

export function InventoryForm({ open, onOpenChange, item }: InventoryFormProps) {
  const { state, addItem, updateItem, log } = useApp();
  const [step, setStep] = React.useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: item?.name ?? "",
      sku: item?.sku ?? "",
      category: item?.category ?? "",
      subcategory: item?.subcategory ?? "",
      description: item?.description ?? "",
      purchaseDate: "",
      serialNumber: item?.serialNumber ?? "",
      quantity: item?.quantity ?? 0,
      unit: item?.unit ?? "unit",
      location: item?.location ?? "",
      department: item?.department ?? "",
      subDepartment: item?.subDepartment ?? "",
      supplier: item?.supplier ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      setStep(0);
      if (!item) form.reset();
    }
  }, [open, item, form]);

  const deptName = form.watch("department");
  const subOptions = React.useMemo(() => {
    if (!deptName) return [] as SubDepartment[];
    const dept = state.departments.find((d) => d.name === deptName);
    if (!dept) return [] as SubDepartment[];
    const out: SubDepartment[] = [];
    const walk = (subs: SubDepartment[]) => subs.forEach((s) => { out.push(s); walk(s.children); });
    walk(dept.subDepartments);
    return out;
  }, [deptName, state.departments]);

  const validateStep = async (i: number) => {
    const fields = stepFields[steps[i].id];
    const result = await form.trigger(fields as never);
    return result;
  };

  const next = async () => {
    if (await validateStep(step)) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = (values: FormValues) => {
    const prevMin = item?.minStock ?? 5;
    const prevReorder = item?.reorderLevel ?? 10;
    const prevMax = item?.maxStock ?? 100;
    const status = computeStatus(values.quantity, prevReorder, prevMax);
    const now = new Date().toISOString();
    const subDepartment = values.subDepartment || undefined;
    if (item) {
      updateItem({ ...item, ...values, assetNumber: item.assetNumber, batchNumber: item.batchNumber, condition: item.condition, warranty: item.warranty, notes: values.purchaseDate ? `Purchase: ${values.purchaseDate}` : item.notes, minStock: prevMin, reorderLevel: prevReorder, maxStock: prevMax, unitCost: item.unitCost, subDepartment, status, lastUpdated: now });
      log("updated inventory", "Inventory", values.name, values.department);
      toast.success("Inventory item updated successfully");
    } else {
      addItem({
        id: uid("INV"),
        name: values.name,
        sku: values.sku,
        category: values.category,
        subcategory: values.subcategory,
        description: values.description,
        department: values.department,
        subDepartment,
        location: values.location,
        quantity: values.quantity,
        unit: values.unit,
        minStock: prevMin,
        reorderLevel: prevReorder,
        maxStock: prevMax,
        unitCost: 0,
        supplier: values.supplier,
        serialNumber: values.serialNumber,
        status,
        lastUpdated: now,
        createdAt: now,
        notes: values.purchaseDate ? `Purchase: ${values.purchaseDate}` : undefined,
      });
      log("added inventory", "Inventory", values.name, values.department);
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
            {item ? "Update the details of this inventory item." : "Create a new item in your inventory. All fields marked are required."}
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
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/10 text-primary cursor-pointer" : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="size-3" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && <span className="bg-border h-px flex-1" />}
            </React.Fragment>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Item Name</FormLabel>
                    <FormControl><Input placeholder="e.g. MacBook Pro 14&quot;" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl><Input placeholder="e.g. IT-DEV-001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {state.categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subcategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <FormControl><Input placeholder="e.g. Laptops" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="serialNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl><Input placeholder="e.g. SN-2026-001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Short description of the item" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["unit", "box", "pack", "set", "pair", "roll", "drum", "ream", "coil", "kit", "can", "sheet"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>
                          {state.locations.map((l) => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
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
                      <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("subDepartment", ""); }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {state.departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subDepartment" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-department</FormLabel>
                    <FormControl>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                        <SelectContent>
                          {subOptions.length === 0 && <SelectItem value="__none" disabled>No sub-departments</SelectItem>}
                          {subOptions.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (optional)</FormLabel>
                    <FormControl>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                        <SelectContent>
                          {state.suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
                <Button type="submit">{item ? "Update Item" : "Save Item"}</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}