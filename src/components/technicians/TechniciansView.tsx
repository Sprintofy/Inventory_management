"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Check, MoreHorizontal, Plus, Trash2, UserCircle2, Users as UsersIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/store/app-store";
import { getTechnicianWorkload } from "@/lib/dashboard-selectors";
import { useFakeLoadingOn } from "@/hooks/use-fake-loading";
import { TECHNICIAN_DEMO_PASSWORD } from "@/data/mock";
import type { Technician } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  employeeId: z.string().min(1, "Employee ID is required"),
  specialization: z.string().min(1, "Select a specialization"),
  phone: z.string().optional(),
});
type SV = z.output<typeof schema>;

// Admin Panel → Technicians tab. Stat blocks + availability removed (Mar 11).
// Technicians are issue-resolvers only; password added for solo login.
export function TechniciansView({ basePath = "/technicians" }: { basePath?: string }) {
  const { state, addTechnician, updateTechnician, deleteTechnician, can } = useApp();
  const [search, setSearch] = React.useState("");
  const [specializationFilter, setSpecializationFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<"name" | "activeTickets" | "resolvedTickets">("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Technician | null>(null);
  const [deleting, setDeleting] = React.useState<Technician | null>(null);
  const loading = useFakeLoadingOn(search);
  const pageSize = 10;

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", email: "", password: TECHNICIAN_DEMO_PASSWORD, employeeId: "", specialization: "", phone: "" },
  });

  React.useEffect(() => {
    if (dialogOpen) form.reset(editing ? {
      name: editing.name,
      email: editing.email,
      password: editing.password ?? TECHNICIAN_DEMO_PASSWORD,
      employeeId: editing.employeeId,
      specialization: editing.specialization,
      phone: editing.phone ?? ""
    } : { name: "", email: "", password: TECHNICIAN_DEMO_PASSWORD, employeeId: "", specialization: "", phone: "" });
  }, [dialogOpen, editing, form]);

  const specializations = React.useMemo(
    () => [...new Set(state.technicians.map((t) => t.specialization))].sort(),
    [state.technicians]
  );

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.technicians.filter((t) => {
      const matchesTerm = !term ||
        t.name.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term) ||
        t.employeeId.toLowerCase().includes(term) ||
        t.specialization.toLowerCase().includes(term);
      const matchesSpec = specializationFilter === "all" || t.specialization === specializationFilter;
      return matchesTerm && matchesSpec;
    });
  }, [state.technicians, search, specializationFilter]);

  const sorted = React.useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const workload = React.useMemo(() => getTechnicianWorkload(state.tickets), [state.tickets]);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const onSubmit = (values: SV) => {
    if (editing) {
      updateTechnician({ ...editing,
        name: values.name,
        email: values.email,
        password: values.password,
        employeeId: values.employeeId,
        specialization: values.specialization,
        phone: values.phone
      });
    } else {
      addTechnician({
        name: values.name,
        email: values.email,
        password: values.password,
        employeeId: values.employeeId,
        specialization: values.specialization,
        availability: "Available",
        status: "Active",
        phone: values.phone,
        activeTickets: 0,
        resolvedTickets: 0,
        color: "#4f46e5"
      });
    }
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Technicians"
        description={`Issue resolvers only · ${filtered.length} total · each signs in with email + password`}
        breadcrumb={[{ label: "Technicians" }]}
        actions={can("technicians.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add Technician</Button> : undefined}
      />

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <SearchInput
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onClear={() => { setSearch(""); setPage(1); }}
          placeholder="Search technician..."
          className="md:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={specializationFilter} onValueChange={(v) => { setSpecializationFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select specialization" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              {specializations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                  Technician {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
                </button>
              </TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>
                <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("activeTickets")}>
                  Active Tickets {sortKey === "activeTickets" && (sortDir === "asc" ? "↑" : "↓")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("resolvedTickets")}>
                  Resolved {sortKey === "resolvedTickets" && (sortDir === "asc" ? "↑" : "↓")}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={6} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={6} className="p-0">
                <EmptyState icon={UsersIcon} title="No technicians found" description="Try changing your search or add a new technician." action={can("technicians.manage") ? { label: "Add Technician", onClick: () => setDialogOpen(true) } : undefined} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link href={`${basePath}/${t.id}`} className="group flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                      {t.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:underline">{t.name}</p>
                      <p className="text-muted-foreground text-xs">{t.employeeId} · {t.email}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{t.specialization}</span></TableCell>
                <TableCell className="text-sm tabular-nums">{workload.get(t.id) ?? 0}</TableCell>
                <TableCell className="text-sm tabular-nums">{t.resolvedTickets}</TableCell>
                <TableCell><Badge variant={t.status === "Active" ? "success" : "neutral"} className="capitalize">{t.status}</Badge></TableCell>
                <TableCell className="pr-4 text-right">
                  {can("technicians.manage") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => { setEditing(t); setDialogOpen(true); }}><UserCircle2 className="size-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const next = t.status === "Active" ? "Inactive" : "Active";
                          updateTechnician({ ...t, status: next as Technician["status"] });
                          toast.success(`${t.name} ${next === "Active" ? "activated" : "deactivated"}`);
                        }}>
                          {t.status === "Active" ? <><Check className="size-3.5" /> Deactivate</> : <><Check className="size-3.5" /> Activate</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(t)}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3"><Pagination total={sorted.length} page={page} pageSize={pageSize} onPageChange={setPage} /></div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Technician" : "Add Technician"}</DialogTitle>
            <DialogDescription>Set name, email, password and specialization. No availability / status fields.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. Alex Johnson" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="name@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="text" placeholder="Min 6 characters" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="employeeId" render={({ field }) => (
                <FormItem><FormLabel>Employee ID</FormLabel><FormControl><Input placeholder="e.g. EMP-0101" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="specialization" render={({ field }) => (
                <FormItem><FormLabel>Specialization</FormLabel>
                  <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue placeholder="Select specialization" /></SelectTrigger><SelectContent>
                    {(["Hardware", "Software", "Network", "Database", "Security", "Cloud", "DevOps", "Mobile"] as const).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent></Select></FormControl>
                <FormMessage />
              </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+91 XXXXX XXXXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? "Save Changes" : "Create Technician"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this technician?"
        description={`${deleting?.name} (${deleting?.employeeId}) will be removed from the system.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            deleteTechnician(deleting.id);
            toast.success("Technician deleted");
          }
        }}
      />
    </div>
  );
}
