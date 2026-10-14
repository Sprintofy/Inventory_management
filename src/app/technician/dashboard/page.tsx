"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock,
  Inbox,
  LogOut,
  MapPin,
  Package,
  Timer,
  User,
  Wrench,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/types";

const priorityClass: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

/** Statuses where the technician still has work to do. */
const ACTIVE = ["open", "in-progress", "partially-resolved"];
/** Ticket handed back to the Admin, waiting for a review decision. */
const AWAITING_REVIEW = ["work-completed", "resolved"];

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const openIssues = ticket.issues.filter((i) => i.status === "open" || i.status === "in-progress");
  const awaitingReview = AWAITING_REVIEW.includes(ticket.status);
  const asset = ticket.assets[0];

  return (
    <Link
      href={`/technician/tickets/${ticket.id}`}
      className="block rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            {ticket.reissueCount ? (
              <Badge variant="danger" className="gap-1 text-[10px]">
                <AlertTriangle className="size-3" /> Re-issued {ticket.reissueCount}×
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm font-medium">{ticket.title}</p>
          <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${priorityClass[ticket.priority]}`}>
              {ticket.priority}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {ticket.department}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> Assigned {timeAgo(ticket.createdAt)}
            </span>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
      </div>

      {asset && (
        <p className="text-muted-foreground bg-muted/40 mt-3 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-xs">
          <Package className="size-3.5 shrink-0" />
          <span className="font-mono font-medium text-foreground">{asset.assetId}</span>
          <span className="truncate">{asset.name}</span>
        </p>
      )}

      {ticket.lastReissueNote && !awaitingReview && (
        <p className="bg-danger/10 text-danger mt-3 rounded-lg px-3 py-2 text-xs">
          <span className="font-semibold">Sent back by Admin:</span> {ticket.lastReissueNote}
        </p>
      )}

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
        <span>
          <CircleDot className="mr-1 inline size-3" />
          {openIssues.length} open issue{openIssues.length === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="mr-1 size-3" />
          {ticket.issues.filter((i) => i.status === "resolved" || i.status === "closed").length} resolved
        </span>
        {awaitingReview && ticket.submittedAt && (
          <span className="text-success inline-flex items-center gap-1">
            <Timer className="size-3" /> Submitted {formatDateTime(ticket.submittedAt)}
          </span>
        )}
      </div>

      {openIssues.length > 0 && (
        <ul className="mt-2 space-y-1">
          {openIssues.map((i) => (
            <li key={i.id} className="text-muted-foreground text-xs">
              • {i.title}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const { state, user, logout } = useApp();
  const loading = useFakeLoading(300);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
  setMounted(true);
}, []);
// eslint-disable-line react-hooks/set-state-in-effect

  // Guard: only a signed-in technician may view this page.
  React.useEffect(() => {
    if (!mounted) return;
    if (!user || user.role !== "technician") router.replace("/login");
  }, [mounted, user, router]);

  const tech = React.useMemo(
    () => state.technicians.find((t) => t.id === user?.id),
    [state.technicians, user]
  );

  /**
   * Strict scoping: a technician only ever sees the tickets the Admin assigned
   * to them (ticket.technicianId === their own id). Nothing else from the
   * ticket register is exposed.
   */
  const myTickets = React.useMemo(() => {
    if (!user) return [];
    return state.tickets
      .filter((t) => t.technicianId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.tickets, user]);

  const stats = React.useMemo(
    () => ({
      assigned: myTickets.length,
      active: myTickets.filter((t) => ACTIVE.includes(t.status)).length,
      awaiting: myTickets.filter((t) => AWAITING_REVIEW.includes(t.status)).length,
      closed: myTickets.filter((t) => t.status === "closed").length,
    }),
    [myTickets]
  );

  const [tab, setTab] = React.useState<"active" | "review" | "closed">("active");

  const visible = React.useMemo(() => {
    if (tab === "active") return myTickets.filter((t) => ACTIVE.includes(t.status));
    if (tab === "review") return myTickets.filter((t) => AWAITING_REVIEW.includes(t.status));
    return myTickets.filter((t) => t.status === "closed");
  }, [myTickets, tab]);

  if (!mounted || !user || loading) {
    return (
      <div className="bg-muted/40 min-h-screen">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-14 w-full animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "active" as const, label: "Assigned to me", count: stats.active },
    { key: "review" as const, label: "Awaiting review", count: stats.awaiting },
    { key: "closed" as const, label: "Closed", count: stats.closed },
  ];

  return (
    <div className="bg-muted/40 min-h-screen">
      <header className="bg-card sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary/15 flex size-9 items-center justify-center rounded-xl">
              <User className="text-primary size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Technician Portal</p>
              <p className="text-muted-foreground text-xs">
                {tech ? `${tech.name} · ${tech.employeeId}` : user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tech && <StatusBadge status={tech.availability} />}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut className="size-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Welcome back, {tech?.name.split(" ")[0] ?? "Technician"}
          </h1>
          <p className="text-muted-foreground text-sm">
            These are the tickets and issues assigned to you by the Admin. Open a ticket to add your remarks and submit it
            back as solved.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile icon={ClipboardList} label="Total assigned" value={stats.assigned} tone="bg-primary/10 text-primary" />
          <StatTile icon={Wrench} label="In progress" value={stats.active} tone="bg-warning/15 text-warning" />
          <StatTile
            icon={Timer}
            label="Awaiting admin review"
            value={stats.awaiting}
            tone="bg-info/15 text-info"
          />
          <StatTile icon={CheckCircle2} label="Closed" value={stats.closed} tone="bg-success/15 text-success" />
        </div>

        {myTickets.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No tickets assigned to you"
            description="When the Admin generates a ticket and assigns it to you, it will appear here."
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === t.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {t.label}
                  <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums">{t.count}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {visible.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Nothing here right now"
                  description={
                    tab === "review"
                      ? "Tickets you submit as solved will wait here for the Admin's review."
                      : tab === "closed"
                        ? "Closed tickets will be listed here once the Admin approves them."
                        : "You have no open assignments."
                  }
                />
              ) : (
                visible.map((t) => <TicketCard key={t.id} ticket={t} />)
              )}
            </div>
          </>
        )}
      </main>

      <p className="text-muted-foreground flex items-center justify-center gap-1.5 px-4 pb-6 text-center text-xs">
        <ClipboardList className="size-3.5" /> You only see tickets assigned to you by the Admin. Last sign-in:{" "}
        {formatDate(user.lastActive)}
      </p>
    </div>
  );
}
