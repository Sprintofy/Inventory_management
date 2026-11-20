"use client";

import * as React from "react";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Building2, ChevronRight, FileDown, MoreHorizontal, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { downloadCSV, formatDate } from "@/lib/utils";

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, can, updateDepartment, deleteDepartment } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const dept = state.departments.find((d) => d.id === id);

  const items = useMemo(
    () => state.inventory.filter((i) => i.department === dept?.name),
    [state.inventory, dept]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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
          <BackButton label="Back" />
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
                downloadCSV(`${dept.name}-export-${new Date().toISOString().slice(0, 10)}.csv`, items.map((i) => ({ Name: i.deviceName, "Reg No.": i.sku, Quantity: i.quantity }))); toast.success(`Exported ${items.length} items`); }}><FileDown className="size-4" /> Export</Button>
              <Button variant="outline" onClick={() => router.push(`/reports?dept=${encodeURIComponent(dept.name)}`)}><BarChart3 className="size-4" /> Inventory Report</Button>
            </>
          )}
          {can("departments.manage") && (
            <></>
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
          <p className="text-muted-foreground flex items-center gap-2 text-xs"><Package className="size-3.5" /> Inventory Items</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{items.length}</p>
        </CardContent></Card>
      </div>

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
                      <p className="text-muted-foreground font-mono text-xs">Reg No. {i.sku} · {dept.name}</p>
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

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this department?"
        description={deleting ? `"${deleting}" will be removed from ${dept.name}.` : undefined}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            deleteDepartment(deleting);
            toast.success("Department deleted");
            router.push("/departments");
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
