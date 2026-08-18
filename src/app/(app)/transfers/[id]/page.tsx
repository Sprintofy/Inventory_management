"use client";

import * as React from "react";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Check, CheckCircle2, Circle, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { TransferStatus } from "@/types";

const steps: Array<{ status: TransferStatus | "requested"; label: string }> = [
  { status: "requested", label: "Requested" },
  { status: "approved", label: "Approved" },
  { status: "in-transit", label: "In Transit" },
  { status: "completed", label: "Completed" },
];

function stepIndex(status: TransferStatus): number {
  if (status === "rejected") return -1;
  return steps.findIndex((s) => s.status === status);
}

export default function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, updateTransfer, can } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const transfer = state.transfers.find((t) => t.id === id);

  const item = useMemo(() => state.inventory.find((i) => i.id === transfer?.itemId), [state.inventory, transfer?.itemId]);

  if (!loading && !transfer) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={ArrowLeftRight} title="Transfer not found" description="This transfer record doesn't exist." action={{ label: "Back to Transfers", href: "/transfers" }} />
      </div>
    );
  }

  if (loading || !transfer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  const idx = stepIndex(transfer.status);
  const currentStep = Math.max(0, idx);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/transfers")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{transfer.transferNo}</h1>
              <StatusBadge status={transfer.status} />
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {transfer.fromDepartment} → {transfer.toDepartment} · {transfer.itemName}
            </p>
          </div>
        </div>
        {can("transfers.approve") && (transfer.status === "pending" || transfer.status === "approved" || transfer.status === "in-transit") && (
          <div className="flex items-center gap-2">
            {transfer.status === "pending" && (
              <>
                <Button variant="outline" className="text-destructive" onClick={() => updateTransfer(transfer.id, "rejected")}>
                  <X className="size-4" /> Reject
                </Button>
                <Button onClick={() => updateTransfer(transfer.id, "approved")}><Check className="size-4" /> Approve</Button>
              </>
            )}
            {transfer.status === "approved" && (
              <Button onClick={() => updateTransfer(transfer.id, "in-transit")}><ArrowLeftRight className="size-4" /> Mark In Transit</Button>
            )}
            {transfer.status === "in-transit" && (
              <Button onClick={() => updateTransfer(transfer.id, "completed")}><CheckCircle2 className="size-4" /> Mark Completed</Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Transfer Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {transfer.status === "rejected" ? (
              <div className="bg-danger/10 text-danger flex items-center gap-3 rounded-lg p-4 text-sm font-medium">
                <XCircle className="size-5" />
                This transfer was rejected by {transfer.approvedBy ?? "Admin"}
                {transfer.approvalDate && ` on ${formatDate(transfer.approvalDate)}`}.
              </div>
            ) : (
              <div className="flex items-center">
                {steps.map((s, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep && idx >= 0;
                  const isLast = i === steps.length - 1;
                  return (
                    <React.Fragment key={s.status}>
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn("flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                          done && "border-success bg-success/10 text-success",
                          active && "border-primary bg-primary/10 text-primary",
                          !done && !active && "border-border bg-muted/50 text-muted-foreground"
                        )}>
                          {done ? <CheckCircle2 className="size-5" /> : active ? <Circle className="size-4 fill-current" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                        </div>
                        <span className={cn("text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
                      </div>
                      {!isLast && <div className={cn("bg-border mx-2 mb-6 h-0.5 flex-1 rounded", i < currentStep && "bg-success")} />}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
            <div className="bg-muted/50 mt-6 grid gap-4 rounded-lg p-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">Requested by</p>
                <p className="mt-0.5 text-sm font-medium">{transfer.requestedBy}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{formatDateTime(transfer.date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Approved by</p>
                <p className="mt-0.5 text-sm font-medium">{transfer.approvedBy ?? "—"}</p>
                {transfer.approvalDate && <p className="text-muted-foreground mt-0.5 text-xs">{formatDateTime(transfer.approvalDate)}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transfer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Item</dt><dd className="font-medium">{transfer.itemName}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Quantity</dt><dd className="font-semibold tabular-nums">{transfer.quantity}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">From</dt><dd className="font-medium">{transfer.fromDepartment}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">To</dt><dd className="font-medium">{transfer.toDepartment}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={transfer.status} /></dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{transfer.reason}</p>
              {item && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/inventory/${item.id}`)}>
                  View item
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}