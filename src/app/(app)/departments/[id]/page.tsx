"use client";

import * as React from "react";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Building2, ChevronRight, FileText, Layers, Package, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate } from "@/lib/utils";

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, can } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const dept = state.departments.find((d) => d.id === id);

  const items = useMemo(
    () => state.inventory.filter((i) => i.department === dept?.name && !i.archived),
    [state.inventory, dept]
  );
  const lowItems = items.filter((i) => i.status === "low-stock" || i.status === "out-of-stock");
  const openTickets = state.tickets.filter((t) => t.department === dept?.name && t.status !== "closed");
  const deptUsers = state.users.filter((u) => u.department === dept?.name);
  const activities = state.activities.filter((a) => a.department === dept?.name).slice(0, 5);

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
        {can("reports.view") && (
          <Button variant="outline" onClick={() => router.push(`/reports?dept=${encodeURIComponent(dept.name)}`)}>
            <BarChart3 className="size-4" /> Inventory Report
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="py-4"><CardContent>
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><Package className="size-3.5" /> Total Items</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{items.length}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent>
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><Ticket className="size-3.5" /> Open Tickets</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{openTickets.length}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent>
          <p className="text-warning flex items-center gap-2 text-xs"><FileText className="size-3.5" /> Low / Out of Stock</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{lowItems.length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><Layers className="text-primary size-4" /> Sub-departments <Badge variant="secondary">{dept.subDepartments.length}</Badge></CardTitle>
          {can("departments.manage") && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/departments?addSub=${encodeURIComponent(dept.id)}`)}>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Inventory Items</CardTitle>
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
                        <p className="text-sm font-medium">{i.name}</p>
                        <p className="text-muted-foreground text-xs">{i.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-xs">{i.location}</span>
                      <span className="text-sm font-semibold tabular-nums">{i.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Team Members</CardTitle>
              <Badge variant="secondary">{deptUsers.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {deptUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users in this department yet.</p>
              ) : (
                deptUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-muted-foreground text-xs">{u.role}</p>
                      </div>
                    </div>
                    <Badge variant={u.status === "active" ? "success" : "neutral"} className="capitalize">{u.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="text-sm">
                      <p className="line-clamp-1">{a.action}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(a.date)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}