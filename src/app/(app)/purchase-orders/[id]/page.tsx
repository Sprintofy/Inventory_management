"use client";

import * as React from "react";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Check, ChevronDown, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { POStatus } from "@/types";

const flow: POStatus[] = ["draft", "pending-approval", "approved", "ordered", "partially-received", "received"];

export default function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, updatePO, can, stockIn } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const po = state.purchaseOrders.find((p) => p.id === id);

  if (!loading && !po) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={ShoppingCart} title="Purchase order not found" description="This purchase order doesn't exist." action={{ label: "Back to Purchase Orders", href: "/purchase-orders" }} />
      </div>
    );
  }

  if (loading || !po) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div></div>;
  }

  const flowIdx = flow.indexOf(po.status);
  const current = Math.max(0, flowIdx);

  const receive = () => {
    po.items.forEach((item) => {
      const inv = state.inventory.find((i) => i.name === item.name);
      if (inv) stockIn(inv.id, item.qty, po.supplier, `Delivery of ${po.poNumber}`);
      else toast.info(`Item "${item.name}" not in inventory — add it first to receive stock`);
    });
    if (flowIdx < flow.length - 1) updatePO(po.id, flow[flowIdx + 1]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/purchase-orders")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{po.poNumber}</h1>
              <StatusBadge status={po.status} />
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">{po.supplier} · {po.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can("po.manage") && (
            <>
              <Select value={po.status} onValueChange={(v) => updatePO(po.id, v as POStatus)}>
                <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {flow.map((s) => <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>)}
                  <SelectItem value="cancelled">cancelled</SelectItem>
                </SelectContent>
              </Select>
              {(po.status === "ordered" || po.status === "partially-received") && (
                <Button onClick={receive}><Check className="size-4" /> Receive Stock</Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Order Items</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-2.5 text-left text-xs font-medium">Item</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium">Unit Cost</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.qty}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.cost)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(item.qty * item.cost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{formatCurrency(po.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Order Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {flow.map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className={i <= current && po.status !== "cancelled" ? "bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full" : "bg-muted text-muted-foreground flex size-5 items-center justify-center rounded-full"}>
                      {i <= current && po.status !== "cancelled" ? <Check className="size-3" /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                    </span>
                    <span className={i <= current && po.status !== "cancelled" ? "text-sm font-medium capitalize" : "text-muted-foreground text-sm capitalize"}>{s.replace("-", " ")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Order date</dt><dd className="font-medium">{formatDate(po.orderDate)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Expected delivery</dt><dd className="flex items-center gap-1.5 font-medium"><CalendarClock className="size-3.5" />{formatDate(po.expectedDelivery)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Supplier</dt><dd className="font-medium"><Truck className="mr-1 inline size-3.5" />{po.supplier}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Department</dt><dd className="font-medium">{po.department}</dd></div>
              </dl>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => router.push(`/suppliers?q=${encodeURIComponent(po.supplier)}`)}>
                View supplier
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { ChevronDown };