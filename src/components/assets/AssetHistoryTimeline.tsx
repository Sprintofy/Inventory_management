"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  PackageCheck,
  TicketCheck,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { Asset } from "@/types";

/**
 * Full service history for a single asset, built from the same ticket +
 * movement records the repair flow writes to. Each entry shows the problem
 * that was reported, the technician's per-issue remarks, and when/how the
 * ticket was finally closed.
 */
export function AssetHistoryTimeline({ asset }: { asset: Asset }) {
  const { state } = useApp();

  const ticketHistory = React.useMemo(
    () =>
      state.tickets
        .filter((t) => t.assets.some((a) => a.assetId === asset.assetId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.tickets, asset.assetId]
  );

  const movements = React.useMemo(
    () =>
      state.movements
        .filter((m) => m.assetId === asset.assetId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.movements, asset.assetId]
  );

  if (ticketHistory.length === 0 && movements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service &amp; Repair History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No issues have been reported for this asset yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Service &amp; Repair History ({ticketHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticketHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tickets raised for this asset.</p>
          ) : (
            <ol className="relative space-y-6 border-l pl-6">
              {ticketHistory.map((t) => {
                const technician = state.technicians.find((x) => x.id === t.technicianId);
                const closed = t.status === "closed";

                return (
                  <li key={t.id} className="relative">
                    <span
                      className={`absolute -left-[31px] top-1 flex size-3.5 items-center justify-center rounded-full ring-4 ring-background ${
                        closed ? "bg-success" : "bg-warning"
                      }`}
                    >
                      {closed ? (
                        <TicketCheck className="size-2 text-white" />
                      ) : (
                        <Wrench className="size-2 text-white" />
                      )}
                    </span>

                    <div className="rounded-lg border">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/tickets/${t.id}`}
                            className="font-mono text-xs font-semibold hover:underline"
                          >
                            {t.id}
                          </Link>
                          <StatusBadge status={t.status} className="h-5 px-1.5 text-[11px]" />
                          {t.reissueCount ? (
                            <Badge variant="danger" className="text-[10px]">
                              Re-issued {t.reissueCount}×
                            </Badge>
                          ) : null}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          Reported {formatDateTime(t.createdAt)}
                        </span>
                      </div>

                      <div className="space-y-3 p-3">
                        <div>
                          <p className="text-sm font-medium">{t.title}</p>
                          {t.description && (
                            <p className="text-muted-foreground mt-0.5 text-xs">{t.description}</p>
                          )}
                        </div>

                        {t.issues.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                              <ClipboardList className="size-3.5" /> Issues &amp; remarks
                            </p>
                            {t.issues.map((issue) => {
                              const done = issue.status === "resolved" || issue.status === "closed";
                              return (
                                <div key={issue.id} className="rounded-md border p-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p
                                      className={`text-xs font-medium ${
                                        done ? "line-through decoration-muted-foreground/50" : ""
                                      }`}
                                    >
                                      {done ? (
                                        <CheckCircle2 className="text-success mr-1 inline size-3.5" />
                                      ) : (
                                        <CircleDot className="text-warning mr-1 inline size-3.5" />
                                      )}
                                      {issue.title}
                                    </p>
                                    <span className="text-muted-foreground text-[11px]">
                                      {issue.resolvedAt ? `Resolved ${formatDate(issue.resolvedAt)}` : "Open"}
                                    </span>
                                  </div>
                                  {issue.resolution && (
                                    <p className="text-muted-foreground mt-1.5 border-l-2 border-success/50 pl-2 text-xs italic">
                                      {issue.resolution}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {t.technicianRemark && (
                          <div className="bg-info/5 rounded-md border p-2.5">
                            <p className="text-info text-xs font-semibold">
                              Technician summary
                              {technician ? ` — ${technician.name}` : ""}
                              {t.submittedAt ? ` · ${formatDateTime(t.submittedAt)}` : ""}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs italic">{t.technicianRemark}</p>
                          </div>
                        )}

                        {t.lastReissueNote && (
                          <p className="text-danger text-xs">
                            <span className="font-semibold">Re-issued by Admin:</span> {t.lastReissueNote}
                          </p>
                        )}

                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs">
                          {technician && (
                            <span className="inline-flex items-center gap-1">
                              <Wrench className="size-3" /> {technician.name} ({technician.employeeId})
                            </span>
                          )}
                          {closed ? (
                            <span className="text-success inline-flex items-center gap-1">
                              <PackageCheck className="size-3" /> Closed by {t.closedBy} on{" "}
                              {formatDateTime(t.closedAt)}
                            </span>
                          ) : (
                            <span>Not closed yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movement History ({movements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-6">
              {movements.map((m) => (
                <li key={m.id} className="relative">
                  <span className="bg-primary absolute -left-[31px] top-1 size-3.5 rounded-full ring-4 ring-background" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      <ArrowRightLeft className="text-primary size-3.5" />
                      <span className="text-muted-foreground">{m.fromLocation}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{m.toLocation}</span>
                    </p>
                    <span className="text-muted-foreground text-xs">{formatDateTime(m.date)}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {m.movementType} · {m.performedBy}
                    {m.remarks ? ` · ${m.remarks}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
