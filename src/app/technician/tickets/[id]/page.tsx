"use client";

import * as React from "react";
import Link from "next/link";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Check,
  CircleDot,
  Clock,
  Inbox,
  MapPin,
  MessageSquare,
  Package,
  PlayCircle,
  Send,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

const priorityClass: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

export default function TechnicianTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { state, user, updateTicketStatus, submitTicketSolution } = useApp();

  // One remark per issue, keyed by issue id.
  const [remarks, setRemarks] = React.useState<Record<string, string>>({});
  const [summary, setSummary] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  // eslint-disable-line react-hooks/set-state-in-effect

  // Guard: a technician may only open a ticket assigned to them.
  React.useEffect(() => {
    if (!mounted) return;
    if (!user || user.role !== "technician") router.replace("/technician/login");
  }, [mounted, user, router]);

  const ticket = useMemo(() => state.tickets.find((t) => t.id === id), [state.tickets, id]);
  const mine = Boolean(user && ticket && ticket.technicianId === user.id);

  const assignedTechnician = useMemo(
    () => state.technicians.find((t) => t.id === ticket?.technicianId),
    [state.technicians, ticket]
  );

  // Seed the per-issue remark inputs from whatever is already recorded.
  React.useEffect(() => {
    if (!ticket) return;
    const seeded: Record<string, string> = {};
    for (const issue of ticket.issues) seeded[issue.id] = issue.resolution ?? '';
    setRemarks(seeded);
    setErrors({});
  }, [ticket?.id]);
  // eslint-disable-line react-hooks/exhaustive-deps
  // eslint-disable-line react-hooks/set-state-in-effect

  if (!mounted || !user) {
    return (
      <div className="bg-muted/40 flex min-h-screen items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon={Inbox}
          title="Ticket not found"
          description="This ticket does not exist."
          action={{ label: "Back to my tickets", href: "/technician/dashboard" }}
        />
      </div>
    );
  }

  // Hard scoping: never render another technician's ticket.
  if (!mine) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon={ShieldCheck}
          title="Not assigned to you"
          description="You can only open tickets that the Admin has assigned to you."
          action={{ label: "Back to my tickets", href: "/technician/dashboard" }}
        />
      </div>
    );
  }

  const pendingIssues = ticket.issues.filter((i) => i.status === "open" || i.status === "in-progress");
  const awaitingReview = ticket.status === "work-completed" || ticket.status === "resolved";
  const closed = ticket.status === "closed";

  const setRemark = (issueId: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [issueId]: value }));
    if (errors[issueId]) setErrors((prev) => ({ ...prev, [issueId]: "" }));
  };

  const onSubmit = () => {
    // Every pending issue needs its own remark.
    const nextErrors: Record<string, string> = {};
    for (const issue of pendingIssues) {
      if (!(remarks[issue.id] ?? "").trim()) {
        nextErrors[issue.id] = "Add a remark for this issue";
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    submitTicketSolution(ticket.id, summary, remarks);
  };

  const missingCount = pendingIssues.filter((i) => !(remarks[i.id] ?? "").trim()).length;

  return (
    <div className="bg-muted/40 min-h-screen">
      <header className="bg-card sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/technician/dashboard")}>
            <ArrowLeft className="size-4" /> My tickets
          </Button>
          <span className="text-muted-foreground font-mono text-xs">{ticket.id}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{ticket.title}</h1>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${priorityClass[ticket.priority]}`}>
              {ticket.priority} priority
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {ticket.department}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> Raised {formatDateTime(ticket.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wrench className="size-3" /> {assignedTechnician?.name ?? "You"}
            </span>
          </div>
        </div>

        {ticket.reissueCount ? (
          <div className="text-danger rounded-xl border bg-danger/10 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-4" /> Re-issued by the Admin {ticket.reissueCount} time
              {ticket.reissueCount === 1 ? "" : "s"}
            </p>
            {ticket.lastReissueNote && <p className="mt-1">{ticket.lastReissueNote}</p>}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reported issue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{ticket.description}</p>
          </CardContent>
        </Card>

        {ticket.assets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asset on ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ticket.assets.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Package className="text-primary size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">{a.assetId}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {a.name}
                        {a.serialNumber ? ` · SN: ${a.serialNumber}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <Badge variant="neutral" className="text-[10px]">
                      {a.currentLocation}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/*
          Per-issue remarks. Every issue on this ticket has its own input, so a
          ticket with multiple issues produces multiple individual remarks
          instead of one shared note.
        */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Issues &amp; my remarks</CardTitle>
              <span className="text-muted-foreground text-xs">
                {ticket.issues.length - pendingIssues.length}/{ticket.issues.length} resolved
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.issues.length === 0 && <p className="text-muted-foreground text-sm">No issues listed.</p>}

            {ticket.issues.map((issue, index) => {
              const done = issue.status === "resolved" || issue.status === "closed";
              const locked = closed || awaitingReview;

              return (
                <div key={issue.id} className={cn("rounded-lg border p-3", done && "bg-success/5")}>
                  <div className="flex items-start gap-2.5">
                    {done ? (
                      <Check className="text-success mt-0.5 size-4 shrink-0" />
                    ) : (
                      <CircleDot className="text-warning mt-0.5 size-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold">
                          ISSUE {index + 1}
                        </span>
                        <p className={cn("text-sm font-medium", done && "line-through decoration-muted-foreground/50")}>
                          {issue.title}
                        </p>
                      </div>

                      {issue.description && (
                        <p className="text-muted-foreground mt-1 text-xs">{issue.description}</p>
                      )}

                      <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                        <StatusBadge status={issue.status} className="h-5 px-1.5 text-[11px]" />
                        <span>Raised {formatDate(issue.createdAt)}</span>
                        {issue.resolvedAt && <span className="text-success">Resolved {formatDate(issue.resolvedAt)}</span>}
                      </div>

                      {/* Remark input for THIS issue only */}
                      {!done && !locked && (
                        <div className="mt-3">
                          <label
                            htmlFor={`remark-${issue.id}`}
                            className="mb-1.5 flex items-center gap-1.5 text-xs font-medium"
                          >
                            <MessageSquare className="size-3.5" /> Remark for issue {index + 1}
                            <span className="text-destructive">*</span>
                          </label>
                          <Textarea
                            id={`remark-${issue.id}`}
                            rows={2}
                            value={remarks[issue.id] ?? ""}
                            onChange={(e) => setRemark(issue.id, e.target.value)}
                            placeholder={`How did you fix "${issue.title}"?`}
                            aria-invalid={Boolean(errors[issue.id])}
                            className={cn(errors[issue.id] && "border-destructive focus-visible:border-destructive")}
                          />
                          {errors[issue.id] && (
                            <p className="text-destructive mt-1 text-xs">{errors[issue.id]}</p>
                          )}
                        </div>
                      )}

                      {/* Recorded remark (locked once submitted/closed) */}
                      {(done || locked) && issue.resolution && (
                        <p className="text-muted-foreground mt-2 border-l-2 border-success/50 pl-2 text-xs italic">
                          {issue.resolution}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {closed ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-success/5 rounded-lg border p-4">
                <p className="text-success flex items-center gap-1.5 text-sm font-semibold">
                  <ShieldCheck className="size-4" /> Closed by {ticket.closedBy} on {formatDateTime(ticket.closedAt)}
                </p>
                {ticket.resolution && <p className="text-muted-foreground mt-2 text-sm">{ticket.resolution}</p>}
              </div>
            </CardContent>
          </Card>
        ) : awaitingReview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-info/10 rounded-lg border p-4 text-sm">
                <p className="text-info font-semibold">Submitted to the Admin — awaiting review</p>
                <p className="text-muted-foreground mt-1">
                  Submitted {formatDateTime(ticket.submittedAt ?? ticket.completedAt)}. The Admin will either close the
                  ticket or re-issue it back to you.
                </p>
                {ticket.technicianRemark && (
                  <p className="text-muted-foreground mt-2 border-l-2 border-info/50 pl-2 text-xs italic">
                    {ticket.technicianRemark}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall summary (optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Optional ticket-level note for the Admin. Each issue already has its own remark above."
              />
              <div className="flex flex-wrap items-center gap-2">
                {ticket.status === "open" && (
                  <Button variant="outline" onClick={() => updateTicketStatus(ticket.id, "in-progress")}>
                    <PlayCircle className="size-4" /> Start work
                  </Button>
                )}
                <Button onClick={onSubmit} disabled={pendingIssues.length === 0}>
                  <Send className="size-4" /> Submit Resolved
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {pendingIssues.length === 0
                  ? "All issues are already resolved."
                  : missingCount > 0
                    ? `${missingCount} issue${missingCount === 1 ? "" : "s"} still need${missingCount === 1 ? "s" : ""} a remark before you can submit.`
                    : `All ${pendingIssues.length} issues have a remark — submit for the Admin's review.`}
              </p>
            </CardContent>
          </Card>
        )}

        {ticket.assets.length > 0 && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Boxes className="size-3.5" /> Once the Admin closes this ticket, the asset is marked available again.
          </p>
        )}

        <div className="pb-4 text-center">
          <Link href="/technician/dashboard" className="text-muted-foreground hover:text-foreground text-xs underline">
            Back to my tickets
          </Link>
        </div>
      </main>
    </div>
  );
}
