"use client";

import * as React from "react";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Star, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatCompact, formatCurrency, formatDate } from "@/lib/utils";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, deleteSupplier, can } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const supplier = state.suppliers.find((s) => s.id === id);

  const orders = useMemo(
    () => state.purchaseOrders.filter((po) => po.supplier === supplier?.name).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
    [state.purchaseOrders, supplier?.name]
  );

  if (!loading && !supplier) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={Truck} title="Supplier not found" description="This supplier doesn't exist." action={{ label: "Back to Suppliers", href: "/suppliers" }} />
      </div>
    );
  }

  if (loading || !supplier) {
    return <div className="space-y-6"><Skeleton className="h-24 w-full" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/suppliers")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <Truck className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{supplier.name}</h1>
              <StatusBadge status={supplier.status} />
            </div>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-sm">
              <Star className="text-warning size-3.5 fill-current" /> {supplier.rating.toFixed(1)} · {supplier.itemsSupplied} items supplied
            </p>
          </div>
        </div>
        {can("suppliers.manage") && (
          <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2.5"><Mail className="text-muted-foreground size-4" /><a href={`mailto:${supplier.email}`} className="hover:underline">{supplier.email}</a></p>
              <p className="flex items-center gap-2.5"><Phone className="text-muted-foreground size-4" />{supplier.phone}</p>
              <p className="flex items-center gap-2.5"><MapPin className="text-muted-foreground size-4" />{supplier.address}</p>
              <p className="text-muted-foreground border-t pt-3 text-xs">Contact: <span className="text-foreground font-medium">{supplier.contactPerson}</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-lg font-semibold">{supplier.purchaseOrders}</p>
                  <p className="text-muted-foreground text-xs">Orders</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-lg font-semibold">{supplier.itemsSupplied}</p>
                  <p className="text-muted-foreground text-xs">Items</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-lg font-semibold">{formatCompact(supplier.totalSpend)}</p>
                  <p className="text-muted-foreground text-xs">Spend</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <p className="text-muted-foreground text-xs font-medium">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.categories.map((c) => <StatusBadge key={c} status={c} dot={false} className="bg-muted text-muted-foreground" />)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Purchase History</CardTitle></CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <EmptyState icon={Truck} title="No purchase orders" description="Orders from this supplier will appear here." />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="px-4 py-2.5 text-left text-xs font-medium">PO Number</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium">Department</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium">Amount</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium">Order Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((po) => (
                      <tr key={po.id} className="border-t cursor-pointer hover:bg-muted/40" onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{po.poNumber}</td>
                        <td className="px-4 py-3 text-xs">{po.department}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(po.amount)}</td>
                        <td className="text-muted-foreground px-4 py-3 text-xs">{formatDate(po.orderDate)}</td>
                        <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this supplier?"
        description={`${supplier.name} will be permanently removed. Purchase history will be preserved.`}
        confirmLabel="Delete"
        onConfirm={() => {
          deleteSupplier(supplier.id);
          toast.success("Supplier deleted");
          router.push("/suppliers");
        }}
      />
    </div>
  );
}