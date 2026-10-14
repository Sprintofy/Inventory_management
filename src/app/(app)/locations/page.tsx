"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { MapPin, MoreHorizontal, Pencil, Plus, Trash2, Warehouse, Store, DoorOpen, LayoutGrid } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatNumber, uid } from "@/lib/utils";
import type { Location } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Location name is required"),
  type: z.string().min(1, "Select a type"),
});
type SV = z.output<typeof schema>;

const typeMeta: Record<string, { icon: React.ElementType; label: string; class: string }> = {
  warehouse: { icon: Warehouse, label: "Warehouse", class: "bg-primary/10 text-primary" },
  store: { icon: Store, label: "Store", class: "bg-success/10 text-success" },
  room: { icon: DoorOpen, label: "Room", class: "bg-warning/15 text-warning" },
  shelf: { icon: LayoutGrid, label: "Shelf", class: "bg-violet-500/10 text-violet-500" },
};

export default function LocationsPage() {
  const { state, addLocation, updateLocation, deleteLocation, can } = useApp();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Location | null>(null);
  const [deleting, setDeleting] = React.useState<Location | null>(null);
  const loading = useFakeLoading();

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", type: "store" },
  });

  React.useEffect(() => {
    if (dialogOpen) form.reset(editing ? { name: editing.name, type: editing.type } : { name: "", type: "store" });
  }, [dialogOpen, editing, form]);

  const locations = state.locations;

  const onSubmit = (values: SV) => {
    if (editing) updateLocation({ ...editing, name: values.name, type: values.type as Location["type"] });
    else addLocation({ id: uid("LOC"), name: values.name, type: values.type as Location["type"], items: 0 });
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Locations"
        description="Manage warehouses, stores, rooms and shelves across the organization."
        breadcrumb={[{ label: "Locations" }]}
        actions={can("locations.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add Location</Button> : undefined}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : locations.length === 0 ? (
        <Card className="py-0"><CardContent className="p-0">
          <EmptyState icon={MapPin} title="No locations yet" description="Add a location to start tracking inventory." action={{ label: "Add Location", onClick: () => setDialogOpen(true) }} />
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((l) => {
            const meta = typeMeta[l.type];
            const Icon = meta.icon;
            const itemCount = 0; // Location field removed
            return (
              <Card key={l.id} className="group relative py-5 transition-shadow hover:shadow-md">
                <CardContent className="px-5">
                  <div className="flex items-start justify-between">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${meta.class}`}>
                      <Icon className="size-5" />
                    </div>
                    {can("locations.manage") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => { setEditing(l); setDialogOpen(true); }}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(l)}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{l.name}</p>
                      <p className="text-muted-foreground text-xs capitalize">{meta.label}{l.parent ? ` · ${l.parent}` : ""}</p>
                    </div>
                    <Badge variant="secondary">{formatNumber(itemCount)} items</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>Locations define where inventory is stored.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. Cold Storage Room" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeMeta).map(([k, v]) => <SelectItem key={k} value={k} className="capitalize">{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? "Save Changes" : "Add Location"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this location?"
        description={`"${deleting?.name}" will be removed. Items stored there are not deleted.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            deleteLocation(deleting.id);
            toast.success("Location deleted");
          }
        }}
      />
    </div>
  );
}