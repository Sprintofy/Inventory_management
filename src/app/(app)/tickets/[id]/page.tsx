"use client";

import * as React from "react";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CircleCheck, CircleDot, Plus, Ticket, TicketCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CloseTicketDialog } from "@/components/operations/CloseTicketDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDateTime } from "@/lib/utils";
import type { RequestPriority } from "@/types";

const priorityClass: Record<RequestPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, can, updateTicket, addTicketIssue } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);
  const [closeOpen, setCloseOpen] = React.useState(false);

  const ticket = useMemo(() => state.tickets.find((t) => t.id === id), [state.tickets, id]);
  const admin = can("tickets.manage");
  const [newIssue, setNewIssue] = React.useState("");

  const submitIssue = () => {
    if (!ticket) return;
    const text = newIssue.trim();
    if (text.length < 3) {
      toast.error("Issue description must be at least 3 characters");
      return;
    }
    addTicketIssue(ticket.id, text);
    setNewIssue("");
  };

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
              {ticket.createdBy} · {ticket.department}
            </p>
          </div>
        </div>
        {admin && (
          <div className="flex items-center gap-2">
            {ticket.status === "open" && (
              <Button variant="outline" onClick={() => updateTicket(ticket.id, { status: "in-progress" })}>
                Mark In Progress
              </Button>
            )}
            {ticket.status === "in-progress" && (
              <Button variant="outline" onClick={() => { updateTicket(ticket.id, { status: "open" }); toast.success("Ticket reopened"); }}>
                Reopen
              </Button>
            )}
            {ticket.status !== "closed" && (
              <Button onClick={() => setCloseOpen(true)}><TicketCheck className="size-4" /> Close Ticket</Button>
            )}
            {ticket.status === "closed" && (
              <Button variant="outline" onClick={() => { updateTicket(ticket.id, { status: "open", closedBy: undefined, closedAt: undefined, resolution: undefined }); toast.success("Ticket reopened"); }}>
                <Check className="size-4" /> Reopen Ticket
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Ticket Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                ["Title", ticket.title],
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
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold">
                Issues
                <span className="text-muted-foreground ml-2 font-normal">{ticket.issues.filter((i) => i.resolved).length}/{ticket.issues.length} resolved</span>
              </h4>
              {ticket.issues.length === 0 ? (
                <p className="text-muted-foreground text-sm">No issues defined for this ticket.</p>
              ) : (
                <div className="space-y-2">
                  {ticket.issues.map((iss) => (
                    <div key={iss.id} className={`flex items-start gap-2.5 rounded-lg border p-3 ${iss.resolved ? "bg-success/5 opacity-70" : "bg-card"}`}>
                      {iss.resolved ? (
                        <CircleCheck className="text-success mt-0.5 size-4 shrink-0" />
                      ) : (
                        <CircleDot className="text-warning mt-0.5 size-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm leading-snug font-medium ${iss.resolved ? "line-through decoration-muted-foreground/50" : ""}`}>{iss.text}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {iss.resolved ? `Resolved${iss.resolvedAt ? ` · ${formatDateTime(iss.resolvedAt)}` : ""}` : "Open — awaiting resolution"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {admin && ticket.status !== "closed" && (
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitIssue()}
                    placeholder="Add another issue for this product…"
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={submitIssue} disabled={!newIssue.trim()}><Plus className="size-4" /> Add</Button>
                </div>
              )}
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
      </div>

      <CloseTicketDialog open={closeOpen} onOpenChange={setCloseOpen} ticket={ticket} />
    </div>
  );
}