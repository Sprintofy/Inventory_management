"use client";

import * as React from "react";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Boxes, Check, CircleDot, FileDown, ListChecks, MoreHorizontal, Pencil, Plus, Ticket, TicketCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CloseTicketDialog } from "@/components/operations/CloseTicketDialog";
import { TicketAssetDialog } from "@/components/operations/TicketAssetDialog";
import { IssueDialog } from "@/components/operations/IssueDialog";
import { MovementDialog } from "@/components/operations/MovementDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate, formatDateTime } from "@/lib/utils";
import { exportTicketsExcel } from "@/lib/excel";
import { issueCounts, ticketStatusFromIssues } from "@/lib/ticket-utils";
import type { IssueStatus, RequestPriority, Ticket as TicketRecord, TicketAsset, TicketIssue, TicketStatus } from "@/types";

const priorityClass: Record<RequestPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

const issueStatuses: IssueStatus[] = ["open", "in-progress", "resolved", "closed"];

function IssueItem({
  issue,
  ticket,
  admin,
  onEdit,
  onDelete,
}: {
  issue: TicketIssue;
  ticket: TicketRecord;
  admin: boolean;
  onEdit: (i: TicketIssue) => void;
  onDelete: (i: TicketIssue) => void;
}) {
  const { updateIssue } = useApp();
  const asset = ticket.assets.find((a) => a.id === issue.assetId);
  const resolved = issue.status === "resolved" || issue.status === "closed";
  return (
    <div className={`rounded-lg border p-3 ${resolved ? "bg-success/5 opacity-80" : "bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {resolved ? (
            <Check className="text-success mt-0.5 size-4 shrink-0" />
          ) : (
            <CircleDot className="text-warning mt-0.5 size-4 shrink-0" />
          )}
          <div className="min-w-0">
            <p className={`text-sm font-medium leading-snug ${resolved ? "line-through decoration-muted-foreground/50" : ""}`}>{issue.title}</p>
            {issue.description && <p className="text-muted-foreground mt-1 text-xs">{issue.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${priorityClass[issue.priority]}`}>{issue.priority}</span>
              <StatusBadge status={issue.status} />
              {asset && <span className="bg-muted inline-flex items-center rounded-md px-1.5 py-0.5 font-medium"><Boxes className="mr-1 size-3" />{asset.assetId}</span>}
              {issue.assignedTo && <span className="text-muted-foreground">Assigned: {issue.assignedTo}</span>}
              <span className="text-muted-foreground" title={formatDateTime(issue.createdAt)}>Created {formatDate(issue.createdAt)}</span>
              {issue.resolvedAt && <span className="text-success" title={formatDateTime(issue.resolvedAt)}>Resolved {formatDate(issue.resolvedAt)}</span>}
            </div>
            {issue.resolution && (
              <p className="text-muted-foreground mt-2 border-l-2 border-success/50 pl-2 text-xs italic">{issue.resolution}</p>
            )}
          </div>
        </div>
        {admin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {issueStatuses.filter((s) => s !== issue.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => updateIssue(ticket.id, issue.id, { status: s })} className="capitalize">
                  Mark {s.replace("-", " ")}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(issue)}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(issue)}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, can, updateTicket, updateIssue, removeIssue, removeTicketAsset } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);
  const [closeOpen, setCloseOpen] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<TicketAsset | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<TicketIssue | null>(null);
  const [issueAssetId, setIssueAssetId] = useState<string | undefined>(undefined);
  const [movementAsset, setMovementAsset] = useState<TicketAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<TicketAsset | null>(null);
  const [deleteIssue, setDeleteIssue] = useState<TicketIssue | null>(null);

  const ticket = useMemo(() => state.tickets.find((t) => t.id === id), [state.tickets, id]);
  const admin = can("tickets.manage");

  const counts = useMemo(() => (ticket ? issueCounts(ticket.issues) : { open: 0, inProgress: 0, resolved: 0, total: 0 }), [ticket]);

  if (!loading && !ticket) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={Ticket} title="Ticket not found" description="This ticket record doesn't exist." action={{ label: "Back to Tickets", href: "/tickets" }} />
      </div>
    );
  }

  if (loading || !ticket) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div></div>;
  }

  const assetMovements = (asset: TicketAsset) => state.movements.filter((m) => m.ticketId === ticket!.id && m.assetId === asset.assetId);

  const setTicketStatus = (status: TicketStatus) => {
    if (status === "resolved" && counts.resolved !== counts.total && counts.total > 0) {
      toast.error("All issues must be resolved first");
      return;
    }
    if (status === "partially-resolved" && counts.resolved === 0) {
      toast.error("Resolve at least one issue first");
      return;
    }
    updateTicket(ticket!.id, { status });
  };

  const markIssueResolved = (issueId: string) => {
    updateIssue(ticket!.id, issueId, { status: "resolved" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/tickets")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{ticket.id}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {ticket.createdBy} · {ticket.department}{ticket.customer ? ` · Customer: ${ticket.customer}` : ""}
            </p>
          </div>
        </div>
        {admin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => { exportTicketsExcel([ticket], state.movements); toast.success("Exported ticket to Excel"); }}>
              <FileDown className="size-4" /> Export
            </Button>
            {ticket.status === "open" && (
              <Button variant="outline" onClick={() => setTicketStatus("in-progress")}>Mark In Progress</Button>
            )}
            {ticket.status === "in-progress" && (
              <>
                <Button variant="outline" onClick={() => setTicketStatus("partially-resolved")}>Partially Resolved</Button>
                <Button variant="outline" onClick={() => setTicketStatus("open")}>Reopen</Button>
              </>
            )}
            {ticket.status === "partially-resolved" && (
              <>
                <Button variant="outline" onClick={() => setTicketStatus("resolved")}>Mark Resolved</Button>
                <Button variant="outline" onClick={() => setTicketStatus("open")}>Reopen</Button>
              </>
            )}
            {ticket.status === "resolved" && (
              <Button variant="outline" onClick={() => setTicketStatus("open")}>Reopen</Button>
            )}
            {ticket.status !== "closed" && (
              <Button onClick={() => setCloseOpen(true)}><TicketCheck className="size-4" /> Close Ticket</Button>
            )}
            {ticket.status === "closed" && (
              <Button variant="outline" onClick={() => { updateTicket(ticket.id, { status: ticketStatusFromIssues(ticket.issues, "resolved"), closedBy: undefined, closedAt: undefined, resolution: undefined }); toast.success("Ticket reopened"); }}>
                <Check className="size-4" /> Reopen Ticket
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg"><Boxes className="size-5" /></div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{ticket.assets.length}</p>
              <p className="text-muted-foreground text-xs">Assets on ticket</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-warning/15 text-warning flex size-10 items-center justify-center rounded-lg"><CircleDot className="size-5" /></div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{counts.open}</p>
              <p className="text-muted-foreground text-xs">Issues open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-info/15 text-info flex size-10 items-center justify-center rounded-lg"><MoreHorizontal className="size-5" /></div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{counts.inProgress}</p>
              <p className="text-muted-foreground text-xs">Issues in progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-success/15 text-success flex size-10 items-center justify-center rounded-lg"><Check className="size-5" /></div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{counts.resolved}/{counts.total}</p>
              <p className="text-muted-foreground text-xs">Issues resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {[
                  ["Title", ticket.title],
                  ["Customer", ticket.customer ?? "—"],
                  ["Category", ticket.category],
                  ["Department", ticket.department],
                  ["Sub-department", ticket.subDepartment ?? "—"],
                  ["Priority", ticket.priority],
                  ["Status", ticket.status],
                  ["Created By", ticket.createdBy],
                  ["Created", formatDateTime(ticket.createdAt)],
                  ...(ticket.closedBy ? [["Closed By", ticket.closedBy] as [string, string], ["Closed At", formatDateTime(ticket.closedAt ?? "")] as [string, string]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 border-b pb-2">
                    <dt className="text-muted-foreground text-sm">{k}</dt>
                    <dd className="text-right text-sm font-medium capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <h4 className="text-sm font-semibold">Description</h4>
                <p className="text-muted-foreground mt-1.5 text-sm">{ticket.description}</p>
              </div>
              {ticket.status === "closed" && ticket.resolution && (
                <div className="mt-6 rounded-lg border bg-success/5 p-4">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-success"><TicketCheck className="size-4" /> Resolution</h4>
                  <p className="text-muted-foreground mt-1.5 text-sm">{ticket.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Boxes className="text-primary size-4" /> Assets ({ticket.assets.length})</CardTitle>
                {admin && (
                  <Button size="sm" onClick={() => { setEditingAsset(null); setAssetDialogOpen(true); }}>
                    <Plus className="size-4" /> Add Asset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {ticket.assets.length === 0 ? (
                <EmptyState icon={Boxes} title="No assets on this ticket" description="Add PCs, CPUs, fans, monitors and other equipment to this ticket." action={admin ? { label: "Add Asset", onClick: () => { setEditingAsset(null); setAssetDialogOpen(true); } } : undefined} />
              ) : (
                <div className="space-y-5">
                  {ticket.assets.map((asset) => {
                    const movements = assetMovements(asset);
                    const assetIssues = ticket.issues.filter((iss) => iss.assetId === asset.id);
                    return (
                      <div key={asset.id} className="rounded-xl border">
                        <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold">{asset.assetId}</span>
                              <span className="bg-primary/10 text-primary inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{asset.itemType}</span>
                              <StatusBadge status={asset.status} />
                            </div>
                            <p className="mt-1 text-sm font-medium">{asset.name}</p>
                            {asset.serialNumber && <p className="text-muted-foreground font-mono mt-0.5 text-xs">SN: {asset.serialNumber}</p>}
                            <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                              <span>Location: <span className="font-medium text-foreground">{asset.currentLocation}</span></span>
                              {asset.previousLocation && <span>Previous: <span className="font-medium text-foreground">{asset.previousLocation}</span></span>}
                              {asset.checkInDate && <span>In: {formatDate(asset.checkInDate)}</span>}
                              {asset.checkOutDate && <span>Out: {formatDate(asset.checkOutDate)}</span>}
                            </div>
                            {asset.notes && <p className="text-muted-foreground mt-1 text-xs italic">{asset.notes}</p>}
                          </div>
                          {admin && (
                            <div className="flex shrink-0 items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setMovementAsset(asset)}>Record Movement</Button>
                              <Button variant="outline" size="icon-sm" onClick={() => { setEditingAsset(asset); setAssetDialogOpen(true); }} aria-label="Edit asset"><Pencil className="size-3.5" /></Button>
                              <Button variant="outline" size="icon-sm" className="text-destructive" onClick={() => setDeleteAsset(asset)} aria-label="Remove asset"><Trash2 className="size-3.5" /></Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 p-4">
                          <div className="flex items-center justify-between">
                            <h5 className="flex items-center gap-1.5 text-sm font-semibold">
                              <ListChecks className="text-primary size-4" /> Issues ({assetIssues.length})
                            </h5>
                            {admin && (
                              <Button variant="outline" size="sm" onClick={() => { setEditingIssue(null); setIssueAssetId(asset.id); setIssueDialogOpen(true); }}>
                                <Plus className="size-3.5" /> Add Issue
                              </Button>
                            )}
                          </div>
                          {assetIssues.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No issues recorded for {asset.assetId}.</p>
                          ) : (
                            <div className="space-y-2">
                              {assetIssues.map((iss) => (
                                <IssueItem key={iss.id} issue={iss} ticket={ticket} admin={admin} onEdit={(i) => { setEditingIssue(i); setIssueAssetId(asset.id); setIssueDialogOpen(true); }} onDelete={(i) => setDeleteIssue(i)} />
                              ))}
                            </div>
                          )}

                          {movements.length > 0 && (
                            <div className="mt-4">
                              <h5 className="mb-2 text-sm font-semibold">Movement History ({movements.length})</h5>
                              <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-muted/40 text-muted-foreground">
                                    <tr>
                                      <th className="px-3 py-2 font-medium">Date</th>
                                      <th className="px-3 py-2 font-medium">Type</th>
                                      <th className="px-3 py-2 font-medium">From → To</th>
                                      <th className="px-3 py-2 font-medium">By</th>
                                      <th className="px-3 py-2 font-medium">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {movements.map((m) => (
                                      <tr key={m.id} className="border-t">
                                        <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{formatDateTime(m.date)}</td>
                                        <td className="px-3 py-2"><StatusBadge status={m.movementType} /></td>
                                        <td className="px-3 py-2"><span className="text-muted-foreground">{m.fromLocation}</span> → <span className="font-medium">{m.toLocation}</span></td>
                                        <td className="px-3 py-2">{m.performedBy}</td>
                                        <td className="text-muted-foreground px-3 py-2">{m.remarks ?? "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Priority</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${priorityClass[ticket.priority]}`}>{ticket.priority} priority</span>
                <p className="text-muted-foreground text-sm">
                  {ticket.priority === "critical" ? "Requires immediate attention and resolution." :
                   ticket.priority === "high" ? "Should be resolved as soon as possible." :
                   ticket.priority === "medium" ? "Needs attention within normal turnaround time." :
                   "No immediate urgency — resolve when convenient."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">All Issues</CardTitle></CardHeader>
            <CardContent>
              {ticket.issues.length === 0 ? (
                <p className="text-muted-foreground text-sm">No issues defined for this ticket.</p>
              ) : (
                <div className="space-y-2">
                  {ticket.issues.map((iss) => (
                    <div key={iss.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{iss.title}</p>
                        <p className="text-muted-foreground text-xs">{iss.assetId ? `Asset: ${ticket.assets.find((a) => a.id === iss.assetId)?.assetId ?? iss.assetId} · ` : ""}{iss.assignedTo ?? "Unassigned"}</p>
                      </div>
                      <StatusBadge status={iss.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {admin && (
            <Card>
              <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {ticket.issues.filter((iss) => iss.status === "open" || iss.status === "in-progress").map((iss) => (
                  <Button key={iss.id} variant="outline" size="sm" className="w-full justify-start" onClick={() => markIssueResolved(iss.id)}>
                    <Check className="size-3.5 text-success" /> Resolve: {iss.title}
                  </Button>
                ))}
                {ticket.issues.every((iss) => iss.status === "resolved" || iss.status === "closed") && ticket.issues.length > 0 && (
                  <Button size="sm" className="w-full" onClick={() => setCloseOpen(true)}><TicketCheck className="size-4" /> Close Ticket</Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TicketAssetDialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen} ticketId={ticket.id} asset={editingAsset} />
      {issueDialogOpen && (
        <IssueDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen} ticket={ticket} issue={editingIssue} defaultAssetId={issueAssetId} />
      )}
      {movementAsset && (
        <MovementDialog open={!!movementAsset} onOpenChange={(o) => !o && setMovementAsset(null)} ticketId={ticket.id} asset={movementAsset} />
      )}
      <CloseTicketDialog open={closeOpen} onOpenChange={setCloseOpen} ticket={ticket} />
      <ConfirmDialog
        open={!!deleteAsset}
        onOpenChange={(o) => !o && setDeleteAsset(null)}
        title={`Remove ${deleteAsset?.assetId}?`}
        description={`This removes "${deleteAsset?.name}" and its issues from the ticket. Historical movements are kept for audit.`}
        confirmLabel="Remove Asset"
        onConfirm={() => { if (deleteAsset) removeTicketAsset(ticket.id, deleteAsset.id); setDeleteAsset(null); }}
      />
      <ConfirmDialog
        open={!!deleteIssue}
        onOpenChange={(o) => !o && setDeleteIssue(null)}
        title="Delete issue?"
        description={deleteIssue ? `"${deleteIssue.title}" will be removed from this ticket.` : ""}
        confirmLabel="Delete Issue"
        onConfirm={() => { if (deleteIssue) removeIssue(ticket.id, deleteIssue.id); setDeleteIssue(null); }}
      />
    </div>
  );
}