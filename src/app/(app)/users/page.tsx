"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Eye, MoreHorizontal, Plus, Trash2, UserCircle2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { useFakeLoadingOn } from "@/hooks/use-fake-loading";
import { uid } from "@/lib/utils";
import type { SubDepartment, User } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(),
  department: z.string().min(1, "Select a department"),
  subDepartment: z.string().optional(),
  post: z.string().min(2, "Post / rank is required (Army field)"),
});
type SV = z.output<typeof schema>;

export default function UsersPage() {
  const { state, addUser, updateUser, deleteUser, can } = useApp();
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [deleting, setDeleting] = React.useState<User | null>(null);
  const [viewing, setViewing] = React.useState<User | null>(null);
  const loading = useFakeLoadingOn(search);
  const pageSize = 10;

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", email: "", password: "password", department: "", subDepartment: "", post: "" },
  });

  const deptName = form.watch("department");
  const subOptions = React.useMemo(() => {
    const d = state.departments.find((x) => x.name === deptName);
    if (!d) return [] as SubDepartment[];
    const out: SubDepartment[] = [];
    const walk = (subs: SubDepartment[]) => subs.forEach((s) => { out.push(s); walk(s.children); });
    walk(d.subDepartments);
    return out;
  }, [deptName, state.departments]);

  React.useEffect(() => {
    if (dialogOpen) form.reset(editing ? { name: editing.name, email: editing.email, password: "", department: editing.department, subDepartment: editing.subDepartment ?? "", post: editing.post ?? "" } : { name: "", email: "", password: "password", department: "", subDepartment: "", post: "" });
  }, [dialogOpen, editing, form]);

  const users = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.users.filter((u) => {
      if (term && !(u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.department.toLowerCase().includes(term) || (u.post ?? "").toLowerCase().includes(term) || (u.subDepartment ?? "").toLowerCase().includes(term))) return false;
      // Date-wise filtering on lastActive
      if (dateFrom || dateTo) {
        if (u.lastActive === "Never" || u.lastActive === "-") return false;
        const t = new Date(u.lastActive).getTime();
        if (dateFrom && t < new Date(dateFrom).getTime()) return false;
        if (dateTo && t > new Date(dateTo + "T23:59:59").getTime()) return false;
      }
      return true;
    });
  }, [state.users, search, dateFrom, dateTo]);

  const paged = users.slice((page - 1) * pageSize, page * pageSize);

  const onSubmit = (values: SV) => {
    // Every user is a scoped "user" — no role picker (Mar 10).
    // Blank password on edit keeps the stored hash.
    if (editing) {
      updateUser({ ...editing, name: values.name, email: values.email, password: values.password || undefined, department: values.department, subDepartment: values.subDepartment || undefined, post: values.post, role: editing.role === "super-admin" ? editing.role : "user" });
    } else {
      addUser({ id: uid("USR"), name: values.name, email: values.email, password: values.password || "password", employeeId: uid("EMP"), department: values.department, subDepartment: values.subDepartment || undefined, post: values.post, role: "user", status: "active", lastActive: "Never", color: "#4f46e5" });
    }
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description={`Department users · ${users.length} total · each signs in with email + password`}
        breadcrumb={[{ label: "Users" }]}
        actions={can("users.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add User</Button> : undefined}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} onClear={() => setSearch("")} placeholder="Search by name, email, department, post…" className="md:max-w-sm" />
        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 w-auto text-xs" aria-label="From date" />
          <span className="text-muted-foreground text-xs">to</span>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 w-auto text-xs" aria-label="To date" />
          {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User / Mail</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-12 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={5} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={5} className="p-0">
                <EmptyState icon={UsersIcon} title="No users found" description="Try changing your search or add a new user." action={{ label: "Add User", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                      {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-muted-foreground text-xs">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{u.department}</span>
                  {u.subDepartment && <span className="text-muted-foreground mt-0.5 block text-[11px]">{u.subDepartment}</span>}
                </TableCell>
                <TableCell className="text-xs">{u.post ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{u.lastActive}</TableCell>
                <TableCell className="pr-4 text-right">
                  {can("users.manage") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setViewing(u)}><Eye className="size-3.5" /> View details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(u); setDialogOpen(true); }}><UserCircle2 className="size-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(u)}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3"><Pagination total={users.length} page={page} pageSize={pageSize} onPageChange={setPage} /></div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>Set name, mail, password, department, sub-department and post. Users see only their department&apos;s data.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. Alex Johnson" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Mail ID</FormLabel><FormControl><Input type="email" placeholder="name@company.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password{editing ? " (blank keeps current)" : ""}</FormLabel><FormControl><Input type="text" placeholder={editing ? "Leave blank to keep current" : "Min 6 characters"} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="post" render={({ field }) => (
                  <FormItem><FormLabel>Post (Army)</FormLabel><FormControl><Input placeholder="e.g. Col, Maj, OIC" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>Department</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("subDepartment", ""); }}><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{state.departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subDepartment" render={({ field }) => (
                  <FormItem><FormLabel>Sub-department</FormLabel>
                    <FormControl><Select value={field.value ?? ""} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent>{subOptions.length === 0 ? <SelectItem value="__none" disabled>No sub-departments</SelectItem> : subOptions.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? "Save Changes" : "Create User"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View details (Mar 10) */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>Full profile of the selected user.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full text-sm font-semibold">{viewing.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</div>
                <div><p className="font-medium">{viewing.name}</p><p className="text-muted-foreground text-xs">{viewing.email}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-xs">
                <div><p className="text-muted-foreground">Employee ID</p><p className="font-medium">{viewing.employeeId}</p></div>
                <div><p className="text-muted-foreground">Post</p><p className="font-medium">{viewing.post ?? "—"}</p></div>
                <div><p className="text-muted-foreground">Department</p><p className="font-medium">{viewing.department}</p></div>
                <div><p className="text-muted-foreground">Sub-department</p><p className="font-medium">{viewing.subDepartment ?? "—"}</p></div>
                <div><p className="text-muted-foreground">Last Active</p><p className="font-medium">{viewing.lastActive}</p></div>
                <div><p className="text-muted-foreground">Login</p><p className="font-mono text-[11px]">{viewing.email} / ••••••</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewing(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this user?"
        description={`${deleting?.name} (${deleting?.email}) will be removed from the system.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            deleteUser(deleting.id);
            toast.success("User deleted");
          }
        }}
      />
    </div>
  );
}
