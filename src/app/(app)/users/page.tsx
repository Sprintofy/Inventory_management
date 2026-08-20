"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { MoreHorizontal, Plus, ShieldCheck, ShieldOff, Trash2, UserCircle2, Users as UsersIcon } from "lucide-react";
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
import { useFakeLoadingOn } from "@/hooks/use-fake-loading";
import { formatDate, uid } from "@/lib/utils";
import type { User, Role } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  department: z.string().min(1, "Select a department"),
  role: z.string().min(1, "Select a role"),
  status: z.string().min(1),
});
type SV = z.output<typeof schema>;

export default function UsersPage() {
  const { state, addUser, updateUser, deleteUser, can } = useApp();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [deleting, setDeleting] = React.useState<User | null>(null);
  const loading = useFakeLoadingOn(search);
  const pageSize = 10;

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", email: "", department: "", role: "user", status: "active" },
  });

  React.useEffect(() => {
    if (dialogOpen) form.reset(editing ? { name: editing.name, email: editing.email, department: editing.department, role: editing.role, status: editing.status } : { name: "", email: "", department: "", role: "user", status: "active" });
  }, [dialogOpen, editing, form]);

  const users = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.users.filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.department.toLowerCase().includes(term) || u.role.toLowerCase().includes(term));
  }, [state.users, search]);

  const paged = users.slice((page - 1) * pageSize, page * pageSize);

  const onSubmit = (values: SV) => {
    if (editing) {
      updateUser({ ...editing, name: values.name, email: values.email, department: values.department, role: values.role as Role, status: values.status as User["status"] });
    } else {
      addUser({ id: uid("USR"), name: values.name, email: values.email, employeeId: uid("EMP"), department: values.department, role: values.role as Role, status: values.status as User["status"], lastActive: "Never", color: "#4f46e5" });
    }
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Manage users, their roles and access to the system."
        breadcrumb={[{ label: "Users" }]}
        actions={can("users.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add User</Button> : undefined}
      />

      <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search users by name, email, department or role…" className="md:max-w-sm" />

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-12 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={6} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={6} className="p-0">
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
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{u.department}</span></TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-xs font-medium capitalize">
                    <ShieldCheck className={u.role === "admin" ? "text-primary size-3.5" : "text-muted-foreground size-3.5"} />
                    {u.role.replace("-", " ")}
                  </span>
                </TableCell>
                <TableCell><Badge variant={u.status === "active" ? "success" : "neutral"} className="capitalize">{u.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-xs">{u.lastActive}</TableCell>
                <TableCell className="pr-4 text-right">
                  {can("users.manage") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => { setEditing(u); setDialogOpen(true); }}><UserCircle2 className="size-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const next = u.status === "active" ? "inactive" : "active";
                          updateUser({ ...u, status: next });
                          toast.success(`${u.name} ${next === "active" ? "activated" : "deactivated"}`);
                        }}>
                          {u.status === "active" ? <><ShieldOff className="size-3.5" /> Deactivate</> : <><ShieldCheck className="size-3.5" /> Activate</>}
                        </DropdownMenuItem>
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
            <DialogDescription>Set the user's profile, department and role.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. Alex Johnson" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="name@company.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>Department</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{state.departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Role</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
                      {(["super-admin", "admin", "department-manager", "department-user", "viewer"] as Role[]).map((r) => <SelectItem key={r} value={r} className="capitalize">{r === "department-manager" ? "Department" : r.replace("-", " ")}</SelectItem>)}
                    </SelectContent></Select></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></FormControl>
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