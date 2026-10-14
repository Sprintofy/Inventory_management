"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Boxes, MoreHorizontal, Plus, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { useFakeLoadingOn } from "@/hooks/use-fake-loading";
import { ReportFaultyAssetDialog } from "@/components/operations/ReportFaultyAssetDialog";
import { formatCompact, formatDate, uid } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Asset, AssetStatus } from "@/types";

const schema = z.object({
  assetId: z.string().min(2, "Asset ID is required"),
  name: z.string().min(2, "Asset name is required"),
  serialNumber: z.string().min(2, "Serial number is required"),
  category: z.string().min(1, "Select a category"),
  department: z.string().min(1, "Select a department"),
  assignedTo: z.string().optional(),
  location: z.string().min(1, "Select a location"),
  cost: z.coerce.number().min(0),
  warranty: z.string().min(1, "Warranty is required"),
  condition: z.string().min(1),
  status: z.string().min(1),
});
type SV = z.output<typeof schema>;

export default function AssetsPage() {
  const { state, visibleDepartments, activeDepartment, addAsset, updateAsset, can } = useApp();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Asset | null>(null);
  const [faultyOpen, setFaultyOpen] = React.useState(false);
  const [faultyAssetId, setFaultyAssetId] = React.useState<string | undefined>(undefined);
  const loading = useFakeLoadingOn(search);
  const pageSize = 10;

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { assetId: "", name: "", serialNumber: "", category: "", department: "", assignedTo: "", location: "", cost: 0, warranty: "1 year", condition: "new", status: "available" },
  });

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset(editing ? { ...editing, category: editing.category, cost: editing.cost } : {
        assetId: uid("AST"), name: "", serialNumber: "", category: "", department: visibleDepartments.length === 1 ? visibleDepartments[0] : "", assignedTo: "", location: "", cost: 0, warranty: "1 year", condition: "new", status: "available",
      });
    }
  }, [dialogOpen, editing, form, visibleDepartments]);

  const assets = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.assets.filter((a) => {
      if (activeDepartment !== "all" && a.department !== activeDepartment) return false;
      if (term && !(a.name.toLowerCase().includes(term) || a.assetId.toLowerCase().includes(term) || a.serialNumber.toLowerCase().includes(term) || (a.assignedTo ?? "").toLowerCase().includes(term))) return false;
      return true;
    });
  }, [state.assets, search, activeDepartment]);

  const paged = assets.slice((page - 1) * pageSize, page * pageSize);

  const onSubmit = (values: SV) => {
    const data: Asset = {
      id: editing?.id ?? uid("AST"),
      assetId: values.assetId,
      name: values.name,
      serialNumber: values.serialNumber,
      category: values.category,
      department: values.department,
      assignedTo: values.assignedTo || undefined,
      location: values.location,
      purchaseDate: editing?.purchaseDate ?? new Date().toISOString(),
      cost: values.cost,
      warranty: values.warranty,
      condition: values.condition as Asset["condition"],
      status: values.status as AssetStatus,
    };
    if (editing) updateAsset(data);
    else addAsset(data);
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assets"
        description="Track non-consumable assets with serial numbers and warranty."
        breadcrumb={[{ label: "Assets" }]}
        actions={can("assets.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add Asset</Button> : undefined}
      />

      <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search by asset ID, name, serial or assignee…" className="md:max-w-sm" />

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Asset</TableHead>
              <TableHead>Asset ID</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={11} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={11} className="p-0">
                <EmptyState icon={Boxes} title="No assets found" description="Try changing your search or add a new asset." action={{ label: "Add Asset", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((a) => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => router.push(`/assets/${a.id}`)}>
                <TableCell className="text-sm font-medium">{a.name}</TableCell>
                <TableCell className="font-mono text-xs">{a.assetId}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{a.serialNumber}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{a.category}</TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{a.department}</span></TableCell>
                <TableCell className="text-xs">{a.assignedTo ?? <span className="text-muted-foreground/60">—</span>}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{a.location}</TableCell>
                <TableCell className="text-sm font-medium tabular-nums">{formatCompact(a.cost)}</TableCell>
                <TableCell><StatusBadge status={a.condition} /></TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  {can("assets.manage") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`/assets/${a.id}`)}>View details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setFaultyAssetId(a.assetId); setFaultyOpen(true); }}>
                          <Wrench className="size-3.5" /> Report faulty
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(a); setDialogOpen(true); }}>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3"><Pagination total={assets.length} page={page} pageSize={pageSize} onPageChange={setPage} /></div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset" : "Add Asset"}</DialogTitle>
            <DialogDescription>Register an asset with identification and ownership details.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="assetId" render={({ field }) => (
                  <FormItem><FormLabel>Asset ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="serialNumber" render={({ field }) => (
                  <FormItem><FormLabel>Serial Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Asset Name</FormLabel><FormControl><Input placeholder="e.g. CNC Milling Machine M3" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{state.categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>Department</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{state.departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="assignedTo" render={({ field }) => (
                  <FormItem><FormLabel>Assigned To</FormLabel><FormControl><Input placeholder="Employee name (optional)" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{state.locations.map((l) => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem><FormLabel>Purchase Cost (₹)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="warranty" render={({ field }) => (
                  <FormItem><FormLabel>Warranty</FormLabel><FormControl><Input placeholder="e.g. 2 years" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="condition" render={({ field }) => (
                  <FormItem><FormLabel>Condition</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["new", "good", "fair", "poor"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["available", "assigned", "under-repair", "damaged", "lost", "retired"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("-", " ")}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? "Save Changes" : "Add Asset"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ReportFaultyAssetDialog open={faultyOpen} onOpenChange={setFaultyOpen} presetAssetId={faultyAssetId} />
    </div>
  );
}