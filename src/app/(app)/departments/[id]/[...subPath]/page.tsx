"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, ChevronRight, Layers, MoreHorizontal, Package, Pencil, Plus, Ticket as TicketIcon, Trash2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SubDepartmentDialog } from "@/components/departments/SubDepartmentDialog";
import { AssignManagerDialog } from "@/components/departments/AssignManagerDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate } from "@/lib/utils";
import type { Department, SubDepartment } from "@/types";

function walkPath(dept: Department, ids: string[]): { node: SubDepartment | null; crumbs: SubDepartment[] } {
  let level = dept.subDepartments;
  const crumbs: SubDepartment[] = [];
  for (const id of ids) {
    const node = level.find((s) => s.id === id);
    if (!node) return { node: null, crumbs };
    crumbs.push(node);
    level = node.children;
  }
  return { node: crumbs[crumbs.length - 1] ?? null, crumbs };
}

export default function SubDepartmentDetailPage({ params }: { params: Promise<{ id: string; subPath: string[] }> }) {
  const { id, subPath } = use(params);
  const { state, can, deleteSubDepartment, updateSubDepartment } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(250);

  const dept = state.departments.find((d) => d.id === id);
  const { node, crumbs } = dept ? walkPath(dept, subPath ?? []) : { node: null, crumbs: [] };

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SubDepartment | null>(null);
  const [deleting, setDeleting] = React.useState<{ parent: SubDepartment; sub: SubDepartment } | null>(null);
  const [managerOpen, setManagerOpen] = React.useState(false);

  const childHref = (s: SubDepartment) => `/departments/${dept?.id}/${[...(subPath ?? []), s.id].join("/")}`;

  const routedTickets = React.useMemo(
    () => (dept && node ? state.tickets.filter((t) => t.department === dept.name && t.subDepartment === node.name) : []),
    [state.tickets, dept, node]
  );

  const scopeNames = React.useMemo(() => {
    const names: string[] = [];
    const walk = (s: SubDepartment) => {
      names.push(s.name);
      s.children.forEach(walk);
    };
    if (node) walk(node);
    return names;
  }, [node]);

  const nodeItems = React.useMemo(
    () => (dept && node ? state.inventory.filter((i) => i.department === dept.name && scopeNames.includes(i.subDepartment ?? "")) : []),
    [state.inventory, dept, node, scopeNames]
  );

  if (!loading && (!dept || !node)) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={Layers}
          title="Sub-department not found"
          description="This sub-department doesn't exist. It may have been deleted."
          action={{ label: "Back to Departments", href: "/departments" }}
        />
      </div>
    );
  }

  if (loading || !dept || !node) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div></div>;
  }

  const crumbHref = (i: number) => `/departments/${dept.id}/${crumbs.slice(0, i + 1).map((c) => c.id).join("/")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(crumbs.length > 1 ? crumbHref(crumbs.length - 2) : `/departments/${dept.id}`)} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex size-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: node.color }}>
            <Layers className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{node.name}</h1>
              <Badge variant={node.status === "active" ? "success" : "neutral"}>{node.status}</Badge>
              {node.children.length === 0 && <Badge variant="secondary">Leaf</Badge>}
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">{node.code} · Manager: {node.manager}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can("reports.view") && (
            <Button variant="outline" onClick={() => router.push(`/reports?dept=${encodeURIComponent(dept.name)}&sub=${encodeURIComponent(node.name)}`)}>
              <BarChart3 className="size-4" /> Inventory Report
            </Button>
          )}
          {can("departments.manage") && (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="size-4" /> Add Sub-department
            </Button>
          )}
          {can("departments.manage") && (
            <Button variant="outline" onClick={() => setManagerOpen(true)}>
              <UsersIcon className="size-4" /> Assign Manager
            </Button>
          )}
        </div>
      </div>

      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        <button type="button" className="hover:text-foreground cursor-pointer" onClick={() => router.push("/departments")}>Departments</button>
        <ChevronRight className="size-3.5" />
        <button type="button" className="hover:text-foreground cursor-pointer" onClick={() => router.push(`/departments/${dept.id}`)}>{dept.name}</button>
        {crumbs.map((c, i) => (
          <React.Fragment key={c.id}>
            <ChevronRight className="size-3.5" />
            {i === crumbs.length - 1 ? (
              <span className="text-foreground font-medium">{c.name}</span>
            ) : (
              <button type="button" className="hover:text-foreground cursor-pointer" onClick={() => router.push(crumbHref(i))}>{c.name}</button>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="py-4"><CardContent>
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><Layers className="size-3.5" /> Sub-departments</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{node.children.length}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent>
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><TicketIcon className="size-3.5" /> Routed Tickets</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{routedTickets.length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><Layers className="text-primary size-4" /> Sub-departments of {node.name} <Badge variant="secondary">{node.children.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent>
          {node.children.length === 0 ? (
            <p className="text-muted-foreground text-sm">No further sub-departments here. This is the deepest level of the hierarchy.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {node.children.map((s) => (
                <div
                  key={s.id}
                  className="group cursor-pointer rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
                  onClick={() => router.push(childHref(s))}
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
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting({ parent: node, sub: s }); }}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
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
          <CardTitle className="flex items-center gap-2 text-base"><Package className="text-primary size-4" /> Inventory Items <Badge variant="secondary">{nodeItems.length}</Badge></CardTitle>
          <Badge variant="outline" className="text-muted-foreground font-normal">{dept.name} · {node.name}</Badge>
        </CardHeader>
        <CardContent>
          {nodeItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">No inventory assigned to {node.name} or its sub-departments.</p>
          ) : (
            <div className="space-y-2">
              {nodeItems.slice(0, 6).map((i) => (
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
              {nodeItems.length > 6 && <p className="text-muted-foreground pt-1 text-center text-xs">+{nodeItems.length - 6} more items — see the Inventory Report</p>}
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
            <p className="text-muted-foreground text-sm">No tickets routed to {node.name}.</p>
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
        parentSub={node}
        editing={editing}
      />

      <AssignManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        title={`Assign Manager — ${node.name}`}
        description="Pick a user as this sub-department's manager. The current manager is shown below."
        current={node.manager}
        onSave={(manager) => {
          updateSubDepartment(dept.id, node.id, { manager });
          toast.success(`Manager assigned — ${manager}`);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this sub-department?"
        description={deleting ? `"${deleting.sub.name}" and its ${deleting.sub.children.length} nested sub-departments will be removed from ${deleting.parent.name}.` : undefined}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            deleteSubDepartment(dept.id, deleting.sub.id);
            toast.success("Sub-department deleted");
          }
        }}
      />
    </div>
  );
}