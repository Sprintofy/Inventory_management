"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Building2, FileDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { formatNumber, uid, downloadCSV } from "@/lib/utils";
import type { Department } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Code is required"),
  manager: z.string().min(2, "Manager is required"),
  status: z.string().min(1),
});
type SV = z.output<typeof schema>;

const palette = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f43f5e", "#6366f1", "#84cc16"];

export default function DepartmentsPage() {
  const { state, addDepartment, updateDepartment, deleteDepartment, can } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [deleting, setDeleting] = React.useState<Department | null>(null);
  const loading = useFakeLoading();

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", code: "", manager: "", status: "active" },
  });

  React.useEffect(() => {
    if (dialogOpen) form.reset(editing ? { name: editing.name, code: editing.code, manager: editing.manager, status: editing.status } : { name: "", code: "", manager: "", status: "active" });
  }, [dialogOpen, editing, form]);

  const departments = state.departments;

  const onSubmit = (values: SV) => {
    if (editing) {
      updateDepartment({ ...editing, name: values.name, code: values.code, manager: values.manager, status: values.status as Department["status"] });
    } else {
      addDepartment({ id: uid("DEP"), name: values.name, code: values.code, manager: values.manager, status: values.status as Department["status"], color: palette[state.departments.length % palette.length] });
    }
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments"
        description={`Manage departments · ${departments.length} total with inventory counts`}
        breadcrumb={[{ label: "Departments" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              downloadCSV(`departments-${new Date().toISOString().slice(0, 10)}.csv`, departments.map((d) => ({ Name: d.name, Code: d.code, Manager: d.manager, Items: state.inventory.filter((i) => i.department === d.name).length })));
              toast.success(`Exported ${departments.length} departments`);
            }}><FileDown className="size-4" /> Export</Button>
            {can("departments.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add Department</Button> : undefined}
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : departments.length === 0 ? (
        <Card className="py-0"><CardContent className="p-0">
          <EmptyState icon={Building2} title="No departments yet" description="Create a department to organize inventory ownership." action={{ label: "Add Department", onClick: () => setDialogOpen(true) }} />
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => {
            const items = state.inventory.filter((i) => i.department === d.name);
            const openTickets = 0;
            return (
              <Card key={d.id} className="group relative cursor-pointer py-5 transition-shadow hover:shadow-md" onClick={() => router.push(`/departments/${d.id}`)}>
                <CardContent className="px-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg text-white" style={{ backgroundColor: d.color }}>
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{d.name}</p>
                        <p className="text-muted-foreground font-mono text-xs">{d.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={d.status === "active" ? "success" : "neutral"}>{d.status}</Badge>
                      {can("departments.manage") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(d); setDialogOpen(true); }}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(d); }}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3 text-xs">Manager: <span className="text-foreground font-medium">{d.manager}</span></p>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-center">
                    <div><p className="text-sm font-semibold">{formatNumber(items.length)}</p><p className="text-muted-foreground text-[10px]">Items</p></div>
                    <div><p className="text-sm font-semibold">{openTickets}</p><p className="text-muted-foreground text-[10px]">Tickets</p></div>
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
            <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>Departments own inventory.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Department Name</FormLabel><FormControl><Input placeholder="e.g. Quality" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="e.g. QLT" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="manager" render={({ field }) => (
                  <FormItem><FormLabel>Manager</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
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
                <Button type="submit">{editing ? "Save Changes" : "Create Department"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this department?"
        description={`"${deleting?.name}" will be removed. Its inventory items are not deleted.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            deleteDepartment(deleting.id);
            toast.success("Department deleted");
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
