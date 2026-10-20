"use client";

import * as React from "react";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CircleDot, FileDown, MoreHorizontal, Pencil, Plus, RotateCcw, Ticket, TicketCheck, Trash2, User, Wrench } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CloseTicketDialog } from "@/components/operations/CloseTicketDialog";
import { ReissueTicketDialog } from "@/components/operations/ReissueTicketDialog";
import { IssueDialog } from "@/components/operations/IssueDialog";
import { AssignTechnicianDialog } from "@/components/operations/AssignTechnicianDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate, formatDateTime } from "@/lib/utils";
import { exportTicketsExcel } from "@/lib/excel";
import { issueCounts } from "@/lib/ticket-utils";
import type { RequestPriority, TicketIssue } from "@/types";

const priorityClass: Record<RequestPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

function IssueItem({
  issue,
  admin,
  onEdit,
  onDelete,
}: {
  issue: TicketIssue;
  admin: boolean;
  onEdit: (i: TicketIssue) => void;
  onDelete: (i: TicketIssue) => void;
}) {
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
  const { state, can, updateIssue, removeIssue } = useApp();
  const loading = useFakeLoading(300);
  const [closeOpen, setCloseOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<TicketIssue | null>(null);
  const [deleteIssue, setDeleteIssue] = useState<TicketIssue | null>(null);
  const [assignTechnicianOpen, setAssignTechnicianOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

  const ticket = useMemo(() => state.tickets.find((t) => t.id === id), [state.tickets, id]);
  const assignedTechnician = useMemo(() => state.technicians.find((t) => t.id === ticket?.technicianId), [state.technicians, ticket]);
  const admin = can("tickets.manage");

  const counts = useMemo(() => (ticket ? issueCounts(ticket.issues) : { open: 0, inProgress: 0, resolved: 0, total: 0 }), [ticket]);

  // A ticket the technician has submitted back for the Admin to review.
  const awaitingReview = ticket?.status === "work-completed" || ticket?.status === "resolved";

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

  const markIssueResolved = (issueId: string) => {
    updateIssue(ticket!.id, issueId, { status: "resolved" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
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

            {/* --- Admin review of a technician-submitted (solved) ticket --- */}
            {awaitingReview && (
              <>
                <Button variant="outline" onClick={() => setReissueOpen(true)} disabled={!ticket.technicianId}>
                  <RotateCcw className="size-4" /> Re-issue to Technician
                </Button>
                <Button onClick={() => setCloseOpen(true)}>
                  <TicketCheck className="size-4" /> Close Ticket
                </Button>
              </>
            )}

            {!awaitingReview && ticket.status !== "closed" && (
              <Button onClick={() => setCloseOpen(true)}><TicketCheck className="size-4" /> Close Ticket</Button>
            )}
          </div>
        )}
      </div>

      {/* Technician Assignment */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {assignedTechnician ? (
              <>
                <Link href={`/technicians/${assignedTechnician.id}`} className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {assignedTechnician.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </Link>
                <div>
                  <p className="text-muted-foreground text-xs">Assigned Technician</p>
                  <p className="text-sm font-medium">{assignedTechnician.name}</p>
                  <p className="text-muted-foreground text-xs">{assignedTechnician.specialization} Specialist</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                  <User className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Assigned Technician</p>
                  <p className="text-muted-foreground text-sm font-medium">No technician assigned</p>
                </div>
              </>
            )}
          </div>
          {admin && (
            <Button
              variant={ticket.technicianId ? "outline" : "default"}
              disabled={ticket.status === "closed"}
              onClick={() => { setSelectedTechnicianId(ticket.technicianId ?? null); setAssignTechnicianOpen(true); }}
            >
              <User className="size-4" /> {ticket.technicianId ? "Change Technician" : "Assign Technician"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

              {/* Re-issue history */}
              {ticket.reissueCount ? (
                <div className="bg-danger/5 mt-6 rounded-lg border p-4">
                  <h4 className="text-danger flex items-center gap-1.5 text-sm font-semibold">
                    <RotateCcw className="size-4" /> Re-issued {ticket.reissueCount} time{ticket.reissueCount === 1 ? "" : "s"}
                  </h4>
                  {ticket.lastReissueNote && (
                    <p className="text-muted-foreground mt-1.5 text-sm">{ticket.lastReissueNote}</p>
                  )}
                </div>
              ) : null}

              {/* Technician's resolution remarks — the Admin review loop */}
              {ticket.technicianRemark && (
                <div className={`mt-6 rounded-lg border p-4 ${awaitingReview ? "bg-info/5" : "bg-muted/30"}`}>
                  <h4 className="text-info flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                    <Wrench className="size-4" /> Technician Remarks
                    {assignedTechnician && <span className="text-muted-foreground font-normal">— {assignedTechnician.name}</span>}
                    {ticket.submittedAt && (
                      <span className="text-muted-foreground font-normal">
                        · submitted {formatDateTime(ticket.submittedAt)}
                      </span>
                    )}
                  </h4>
                  <p className="text-muted-foreground mt-1.5 text-sm italic">{ticket.technicianRemark}</p>
                  {awaitingReview && (
                    <p className="text-info mt-2 text-xs font-medium">
                      Awaiting your review — close the ticket or re-issue it back to the technician.
                    </p>
                  )}
                </div>
              )}

              {ticket.status === "closed" && ticket.resolution && (
                <div className="mt-6 rounded-lg border bg-success/5 p-4">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-success"><TicketCheck className="size-4" /> Resolution</h4>
                  <p className="text-muted-foreground mt-1.5 text-sm">{ticket.resolution}</p>
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
                        <p className="text-muted-foreground text-xs">{iss.assignedTo ?? "Unassigned"}</p>
                      </div>
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
                {awaitingReview && (
                  <>
                    <p className="text-muted-foreground text-xs">
                      The technician submitted this ticket as solved. Review the remarks and decide.
                    </p>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setReissueOpen(true)} disabled={!ticket.technicianId}>
                      <RotateCcw className="size-3.5" /> Re-issue to {assignedTechnician?.name.split(" ")[0] ?? "technician"}
                    </Button>
                    <Button size="sm" className="w-full justify-start" onClick={() => setCloseOpen(true)}>
                      <TicketCheck className="size-3.5 text-success" /> Close Ticket
                    </Button>
                  </>
                )}
                {!awaitingReview && ticket.issues.filter((iss) => iss.status === "open" || iss.status === "in-progress").map((iss) => (
                  <Button key={iss.id} variant="outline" size="sm" className="w-full justify-start" onClick={() => markIssueResolved(iss.id)}>
                    <Check className="size-3.5 text-success" /> Resolve: {iss.title}
                  </Button>
                ))}
                {!awaitingReview && ticket.issues.every((iss) => iss.status === "resolved" || iss.status === "closed") && ticket.issues.length > 0 && (
                  <Button size="sm" className="w-full" onClick={() => setCloseOpen(true)}><TicketCheck className="size-4" /> Close Ticket</Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Issues ({ticket.issues.length})</CardTitle>
            {admin && (
              <Button size="sm" onClick={() => { setEditingIssue(null); setIssueDialogOpen(true); }}>
                <Plus className="size-4" /> Add Issue
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {ticket.issues.length === 0 ? (
            <p className="text-muted-foreground text-sm">No issues recorded for this ticket.</p>
          ) : (
            <div className="space-y-2">
              {ticket.issues.map((iss) => (
                <IssueItem key={iss.id} issue={iss} admin={admin} onEdit={(i) => { setEditingIssue(i); setIssueDialogOpen(true); }} onDelete={(i) => setDeleteIssue(i)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {issueDialogOpen && (
        <IssueDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen} ticket={ticket} issue={editingIssue} />
      )}
      <CloseTicketDialog open={closeOpen} onOpenChange={setCloseOpen} ticket={ticket} />
      <ReissueTicketDialog open={reissueOpen} onOpenChange={setReissueOpen} ticket={ticket} />
      <ConfirmDialog
        open={!!deleteIssue}
        onOpenChange={(o) => !o && setDeleteIssue(null)}
        title="Delete issue?"
        description={deleteIssue ? `"${deleteIssue.title}" will be removed from this ticket.` : ""}
        confirmLabel="Delete Issue"
        onConfirm={() => { if (deleteIssue) removeIssue(ticket.id, deleteIssue.id); setDeleteIssue(null); }}
      />
      <AssignTechnicianDialog
        open={assignTechnicianOpen}
        onOpenChange={setAssignTechnicianOpen}
        ticket={ticket}
        selectedTechnicianId={selectedTechnicianId}
        onSelectTechnician={setSelectedTechnicianId}
      />
    </div>
  );
}
