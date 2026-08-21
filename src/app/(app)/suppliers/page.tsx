"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Plus, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { useFakeLoadingOn } from "@/hooks/use-fake-loading";
import { formatCompact, uid } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import type { Supplier } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number"),
  address: z.string().min(3, "Address is required"),
  categories: z.string().min(1, "Select a category"),
  status: z.string().min(1),
});
type SV = z.output<typeof schema>;

export default function SuppliersPage() {
  const { state, addSupplier, updateSupplier, can } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const loading = useFakeLoadingOn(searchParams.toString());

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", contactPerson: "", email: "", phone: "", address: "", categories: "", status: "active" },
  });

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset(
        editing
          ? { name: editing.name, contactPerson: editing.contactPerson, email: editing.email, phone: editing.phone, address: editing.address, categories: editing.categories[0] ?? "", status: editing.status }
          : { name: "", contactPerson: "", email: "", phone: "", address: "", categories: "", status: "active" }
      );
    }
  }, [dialogOpen, editing, form]);

  const suppliers = state.suppliers;

  const onSubmit = (values: SV) => {
    const data: Supplier = {
      id: editing?.id ?? uid("SUP"),
      name: values.name,
      contactPerson: values.contactPerson,
      email: values.email,
      phone: values.phone,
      address: values.address,
      categories: [values.categories],
      itemsSupplied: editing?.itemsSupplied ?? 0,
      purchaseOrders: editing?.purchaseOrders ?? 0,
      totalSpend: editing?.totalSpend ?? 0,
      status: values.status as Supplier["status"],
      rating: editing?.rating ?? 4,
    };
    if (editing) updateSupplier(data);
    else addSupplier(data);
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Suppliers"
        description="Manage vendors and track purchasing performance."
        breadcrumb={[{ label: "Suppliers" }]}
        actions={can("suppliers.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add Supplier</Button> : undefined}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="py-0"><CardContent className="p-0">
          <EmptyState icon={Truck} title="No suppliers yet" description="Add a supplier to start tracking purchasing." action={{ label: "Add Supplier", onClick: () => setDialogOpen(true) }} />
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="group cursor-pointer py-5 transition-shadow hover:shadow-md" onClick={() => router.push(`/suppliers/${s.id}`)}>
              <CardContent className="px-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                      <Truck className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-muted-foreground text-xs">{s.contactPerson}</p>
                    </div>
                  </div>
                  <Badge variant={s.status === "active" ? "success" : "neutral"}>{s.status}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.categories.map((c) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
                </div>
                <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
                  <div><p className="text-foreground text-sm font-semibold">{s.itemsSupplied}</p>Items</div>
                  <div><p className="text-foreground text-sm font-semibold">{s.purchaseOrders}</p>Orders</div>
                  <div><p className="text-foreground text-sm font-semibold">{formatCompact(s.totalSpend)}</p>Spend</div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <Star className="text-warning size-3.5 fill-current" />
                  <span className="text-sm font-medium">{s.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-xs">rating</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            <DialogDescription>Enter supplier contact and category information.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g. TechNova" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="e.g. Rakesh Bansal" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="sales@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+91 98xxx xxxxx" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea rows={2} placeholder="City, State" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="categories" render={({ field }) => (
                  <FormItem><FormLabel>Primary Category</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {state.categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? "Save Changes" : "Add Supplier"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}