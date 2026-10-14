"use client";

import * as React from "react";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Building2, ChevronRight, FileDown, Layers, MoreHorizontal, Package, Pencil, Plus, Ticket as TicketIcon, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SubDepartmentDialog } from "@/components/departments/SubDepartmentDialog";
import { AssignManagerDialog } from "@/components/departments/AssignManagerDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { downloadCSV, formatDate } from "@/lib/utils";
import type { SubDepartment } from "@/types";

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, can, updateDepartment, deleteSubDepartment } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const dept = state.departments.find((d) => d.id === id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubDepartment | null>(null);
  const [deleting, setDeleting] = useState<SubDepartment | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);

  const items = useMemo(
    () => state.inventory.filter((i) => i.department === dept?.name),
    [state.inventory, dept]
  );
  const routedTickets = React.useMemo(
    () => (dept ? state.tickets.filter((t) => t.department === dept.name) : []),
    [state.tickets, dept]
  );

  if (!loading && !dept) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={Building2} title="Department not found" description="This department doesn't exist." action={{ label: "Back to Departments", href: "/departments" }} />
      </div>
    );
  }

  if (loading || !dept) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/departments")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex size-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: dept.color }}>
            <Building2 className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{dept.name}</h1>
              <Badge variant={dept.status === "active" ? "success" : "neutral"}>{dept.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">{dept.code} · Manager: {dept.manager}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can("reports.view") && (
            <>
              <Button variant="outline" onClick={() => {
                downloadCSV(`${dept.name}-export-${new Date().toISOString().slice(0, 10)}.csv`, items.map((i) => ({ Name: i.deviceName, SKU: i.sku, Quantity: i.quantity })));
                toast.success(`Exported ${items.length} items`);
              }}><FileDown className="size-4" /> Export</Button>
              <Button variant="outline" onClick={() => router.push(`/reports?dept=${encodeURIComponent(dept.name)}`)}>
                <BarChart3 className="size-4" /> Inventory Report
              </Button>
            </>
          )}
          {can("departments.manage") && (
            <Button variant="outline" onClick={() => setManagerOpen(true)}>
              <User className="size-4" /> Assign Manager
            </Button>
          )}
        </div>
      </div>

      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        <button type="button" className="hover:text-foreground cursor-pointer" onClick={() => router.push("/departments")}>Departments</button>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{dept.name}</span>
      </nav>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="py-4"><CardContent>
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><Layers className="size-3.5" /> Sub-departments</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dept.subDepartments.length}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent>
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><TicketIcon className="size-3.5" /> Routed Tickets</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{routedTickets.length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><Layers className="text-primary size-4" /> Sub-departments of {dept.name} <Badge variant="secondary">{dept.subDepartments.length}</Badge></CardTitle>
          {can("departments.manage") && (
            <Button variant="outline" size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="size-3.5" /> Add Sub-department
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {dept.subDepartments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sub-departments defined for this department.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dept.subDepartments.map((s) => (
                <div
                  key={s.id}
                  className="group cursor-pointer rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
                  onClick={() => router.push(`/departments/${dept.id}/${s.id}`)}
                  title={`Open ${s.name}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-md text-white" style={{ backgroundColor: s.color }}>
                        <Layers className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-muted-foreground font-mono text-xs">{s.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={s.status === "active" ? "success" : "neutral"}>{s.status}</Badge>
                      {can("departments.manage") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="size-6" onClick={(e) => e.stopPropagation()} aria-label={`Manage ${s.name}`}>
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(s); setDialogOpen(true); }}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(s); }}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <ChevronRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2.5 text-xs">Manager: <span className="text-foreground font-medium">{s.manager}</span></p>
                  <p className="text-muted-foreground text-xs">{s.users} member{s.users === 1 ? "" : "s"} · {s.children.length > 0 ? `${s.children.length} sub-department${s.children.length === 1 ? "" : "s"}` : "leaf"}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><Package className="text-primary size-4" /> Inventory Items <Badge variant="secondary">{items.length}</Badge></CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push(`/inventory?dept=${encodeURIComponent(dept.name)}`)}>View All</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No inventory assigned to this department.</p>
          ) : (
            <div className="space-y-2">
              {items.slice(0, 6).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                      <Package className="text-muted-foreground size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{i.deviceName}</p>
                      <p className="text-muted-foreground font-mono text-xs">{i.sku} · {i.subDepartment ?? dept.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold tabular-nums">{i.quantity}</span>
                  </div>
                </div>
              ))}
              {items.length > 6 && <p className="text-muted-foreground pt-1 text-center text-xs">+{items.length - 6} more items — see the Inventory Report</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><TicketIcon className="text-primary size-4" /> Routed Tickets</CardTitle>
          <Badge variant="secondary">{routedTickets.length}</Badge>
        </CardHeader>
        <CardContent>
          {routedTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tickets routed to {dept.name}.</p>
          ) : (
            <div className="space-y-2">
              {routedTickets.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-muted-foreground text-xs">{t.id} · {t.category}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={t.status === "closed" ? "success" : t.status === "in-progress" ? "info" : "warning"} className="capitalize">{t.status}</Badge>
                    <p className="text-muted-foreground mt-1 text-xs">{formatDate(t.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SubDepartmentDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        department={dept}
        parentSub={null}
        editing={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this sub-department?"
        description={deleting ? `"${deleting.name}" and its ${deleting.children.length} nested sub-departments will be removed from ${dept.name}.` : undefined}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            deleteSubDepartment(dept.id, deleting.id);
            toast.success("Sub-department deleted");
            setDeleting(null);
          }
        }}
      />

      <AssignManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        title={`Assign Manager — ${dept.name}`}
        description="Pick a user as this department's manager. The current manager is shown below."
        current={dept.manager}
        onSave={(manager) => {
          updateDepartment({ ...dept, manager });
          toast.success(`Manager assigned — ${manager}`);
        }}
      />
    </div>
  );
}
