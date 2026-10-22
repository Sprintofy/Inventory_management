"use client";

import { use, useMemo, useState } from "react";
import { ArrowLeft, CircleDot, Check, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import type { Ticket, TicketIssue } from "@/types";

export default function TicketResolvePage({ params }: { params: Promise<{ id: string; issueId: string }> }) {
  const { id } = use(params);
  const { issueId } = use(params);
  const { state, updateIssue } = useApp();
  const loading = useFakeLoading(300);
  const [comment, setComment] = useState<string>("");
  const [commentError, setCommentError] = useState<string | undefined>(undefined);

  const ticket = useMemo(() => state.tickets.find((t) => t.id === id), [state.tickets, id]);
  const issue = useMemo(() => ticket?.issues.find((i) => i.id === issueId), [ticket, issueId]);

  if (!loading && !ticket) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={TicketIcon} title="Ticket not found" description="This ticket record doesn't exist." action={{ label: "Back to Tickets", href: "/tickets" }} />
      </div>
    );
  }

  if (loading || !ticket) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div></div>;
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={TicketIcon} title="Issue not found" description="This issue doesn't exist on this ticket." action={{ label: "Back to Ticket", href: `/tickets/${id}` }} />
      </div>
    );
  }

  const resolveIssue = () => {
    if (!comment.trim()) {
      setCommentError("Resolution remark is required");
      return;
    }
    setCommentError(undefined);
    updateIssue(ticket.id, issueId, {
      status: "resolved",
      resolution: comment.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/tickets/${ticket.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" /> Back to Ticket
            </Button>
          </Link>
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
      </div>

      {/* Current Issue Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issue to Resolve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              ["Issue Title", issue.title],
              ["Issue Description", issue.description ?? "—"],
              ["Issue Status", issue.status],
              ["Created", formatDateTime(issue.createdAt)],
              [issue.resolvedAt ? "Resolved At" : "Not Resolved Yet", issue.resolvedAt ? formatDateTime(issue.resolvedAt) : "Not yet resolved"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b pb-2">
                <dt className="text-muted-foreground text-sm">{k}</dt>
                <dd className="text-right text-sm font-medium capitalize">{v}</dd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolution Remark</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Resolution Remark</label>
              <Textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was this issue resolved?"
                className={commentError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"}
              />
              {commentError && <p className="text-destructive mt-1 text-sm">{commentError}</p>}
            </div>
            <div className="flex flex-row gap-2">
              <Link href={`/tickets/${ticket.id}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="button" onClick={resolveIssue} disabled={!comment.trim()}>
                Submit Resolution
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}