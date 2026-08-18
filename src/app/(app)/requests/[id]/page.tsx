"use client";

import * as React from "react";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ClipboardList, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDateTime } from "@/lib/utils";

const priorityClass: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, updateRequest, can, stockIn } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const request = state.requests.find((r) => r.id === id);
  const item = useMemo(() => state.inventory.find((i) => i.id === request?.itemId), [state.inventory, request?.itemId]);

  if (!loading && !request) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={ClipboardList} title="Request not found" description="This request record doesn't exist." action={{ label: "Back to Requests", href: "/requests" }} />
      </div>
    );
  }

  if (loading || !request) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div></div>;
  }

  const approve = () => {
    updateRequest(request.id, "approved");
    if (item) stockIn(item.id, request.quantity, item.supplier ?? "Internal Transfer", `Fulfillment of ${request.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/requests")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{request.id}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {request.requestedBy} · {request.department}
            </p>
          </div>
        </div>
        {can("requests.approve") && request.status === "pending" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-destructive" onClick={() => updateRequest(request.id, "rejected")}>
              <X className="size-4" /> Reject
            </Button>
            <Button onClick={approve}><Check className="size-4" /> Approve & Fulfill</Button>
          </div>
        )}
        {request.status === "approved" && can("requests.approve") && (
          <Button onClick={() => { updateRequest(request.id, "completed"); toast.success("Request marked as completed"); }}>
            <Check className="size-4" /> Mark Completed
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Request Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                ["Item", request.itemName],
                ["Quantity", String(request.quantity)],
                ["Priority", request.priority],
                ["Status", request.status],
                ["Requested By", request.requestedBy],
                ["Department", request.department],
                ["Sub-department", request.subDepartment ?? "—"],
                ["Submitted", formatDateTime(request.date)],
                ["Current Stock", item ? `${item.quantity} ${item.unit}s` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 border-b pb-2">
                  <dt className="text-muted-foreground text-sm">{k}</dt>
                  <dd className="text-right text-sm font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">
              <h4 className="text-sm font-semibold">Reason</h4>
              <p className="text-muted-foreground mt-1.5 text-sm">{request.reason ?? "No reason provided."}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Item Overview</CardTitle></CardHeader>
          <CardContent>
            {item ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-muted-foreground font-mono text-xs">{item.sku}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-semibold tabular-nums">{item.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{item.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={item.status} />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/inventory/${item.id}`)}>View item</Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Item no longer in inventory.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}