"use client";

import * as React from "react";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Boxes, CalendarDays, Package, Pencil, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { AssetHistoryTimeline } from "@/components/assets/AssetHistoryTimeline";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatCompact, formatDate } from "@/lib/utils";

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const asset = state.assets.find((a) => a.id === id);

  const history = useMemo(() => {
    if (!asset) return [];
    return state.transactions.filter((t) => t.itemName === asset.name || t.note?.includes(asset.assetId)).slice(0, 5);
  }, [state.transactions, asset]);

  if (!loading && !asset) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={Boxes} title="Asset not found" description="This asset doesn't exist." action={{ label: "Back to Assets", href: "/assets" }} />
      </div>
    );
  }

  if (loading || !asset) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div></div>;
  }

  const user = state.users.find((u) => u.name === asset.assignedTo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/assets")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{asset.name}</h1>
              <StatusBadge status={asset.status} />
            </div>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">{asset.assetId} · {asset.serialNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/assets?edit=${asset.id}`)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Asset Information</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                ["Category", asset.category],
                ["Department", asset.department],
                ["Condition", asset.condition],
                ["Status", asset.status],
                ["Purchase Date", formatDate(asset.purchaseDate)],
                ["Cost", formatCompact(asset.cost)],
                ["Warranty", asset.warranty],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 border-b pb-2">
                  <dt className="text-muted-foreground text-sm">{k}</dt>
                  <dd className="text-right text-sm font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
            <CardContent>
              {asset.assignedTo ? (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{asset.assignedTo}</p>
                    <p className="text-muted-foreground text-xs">{user?.email ?? "Employee"}</p>
                    <p className="text-muted-foreground text-xs">{user?.department}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not assigned — available.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                  <CalendarDays className="size-4 opacity-40" /> No stock activity recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><Package className="size-3.5" />{t.type}</span>
                      <span className="text-xs">{formatDate(t.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Step 6 — full service/repair history for this specific asset */}
      <AssetHistoryTimeline asset={asset} />
    </div>
  );
}