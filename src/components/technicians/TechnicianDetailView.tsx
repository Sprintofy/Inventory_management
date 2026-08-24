"use client";

import * as React from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ListChecks, Mail, Phone, User, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types";

const priorityClass: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/10 text-danger",
};

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={`/tickets/${ticket.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs text-muted-foreground">{ticket.id}</p>
        <p className="truncate text-sm font-medium">{ticket.title}</p>
        <p className="text-muted-foreground truncate text-xs">{ticket.customer ?? ticket.department}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityClass[ticket.priority] ?? ""}`}>{ticket.priority}</span>
        <StatusBadge status={ticket.status} />
      </div>
    </Link>
  );
}

// The complete Admin Panel → Technician detail page (info, workload,
// assigned tickets, work history, activity). `basePath` controls where the
// back navigation points so the Technician Dashboard can reuse this view.
export function TechnicianDetailView({ id, basePath = "/technicians" }: { id: string; basePath?: string }) {
  const { state } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const technician = state.technicians.find((t) => t.id === id);

  const assignedTickets = useMemo(() => {
    if (!technician) return [];
    return state.tickets.filter((t) => t.technicianId === technician.id);
  }, [state.tickets, technician]);

  const openTickets = useMemo(() => assignedTickets.filter((t) => t.status === "open"), [assignedTickets]);
  const inProgressTickets = useMemo(() => assignedTickets.filter((t) => t.status === "in-progress" || t.status === "partially-resolved"), [assignedTickets]);
  const workHistory = useMemo(() => assignedTickets.filter((t) => t.status === "resolved" || t.status === "closed"), [assignedTickets]);

  const activity = useMemo(() => {
    if (!technician) return [];
    return state.activities.filter((a) => a.user === technician.name).slice(0, 12);
  }, [state.activities, technician]);

  const workloadColor = !technician ? "" : technician.activeTickets >= 7 ? "text-danger" : technician.activeTickets >= 4 ? "text-warning" : "text-success";
  const totalAssigned = assignedTickets.length + (technician?.resolvedTickets ?? 0);

  if (!loading && !technician) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={User} title="Technician not found" description="This technician doesn't exist." action={{ label: "Back to Technicians", href: basePath }} />
      </div>
    );
  }

  if (loading || !technician) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(basePath)} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full text-sm font-semibold">
            {technician.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{technician.name}</h1>
              <StatusBadge status={technician.availability} />
              <StatusBadge status={technician.status} dot={false} />
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">{technician.specialization} Specialist · <span className="font-mono text-xs">{technician.employeeId}</span></p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Technician Information</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                ["Email", technician.email],
                ["Phone", technician.phone ?? "Not provided"],
                ["Specialization", technician.specialization],
                ["Availability", technician.availability],
                ["Status", technician.status],
                ["Last Active", technician.lastActive ? formatDate(technician.lastActive) : "Never"],
              ].map(([k, v]) => (
                <div key={k} className="border-b pb-2">
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="mt-0.5 text-sm font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" /> {technician.email}</span>
              {technician.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" /> {technician.phone}</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Current Workload</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg border p-3">
                <p className={`text-2xl font-semibold ${workloadColor}`}>{openTickets.length}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">Open Tickets</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className={`text-2xl font-semibold ${workloadColor}`}>{inProgressTickets.length}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">In Progress</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold text-success">{workHistory.length}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">Resolved</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">{totalAssigned}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">Total Assigned</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-center text-xs">
              Workload indicator: 0–3 low · 4–6 medium · 7+ high
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Assigned Tickets ({assignedTickets.length})</TabsTrigger>
          <TabsTrigger value="history">Work History ({workHistory.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Performance Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs">Resolution Rate</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {(technician.resolvedTickets + technician.activeTickets) > 0
                      ? `${Math.round((technician.resolvedTickets / (technician.resolvedTickets + technician.activeTickets)) * 100)}%`
                      : "0%"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs">Lifetime Resolved</p>
                  <p className="mt-1 text-2xl font-semibold">{technician.resolvedTickets}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs">Currently Active</p>
                  <p className={`mt-1 text-2xl font-semibold ${workloadColor}`}>{openTickets.length + inProgressTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recently Assigned Tickets</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {assignedTickets.slice(0, 3).map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
              {assignedTickets.length === 0 && (
                <EmptyState icon={ListChecks} title="No assigned tickets" description="This technician has no currently assigned tickets." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-5">
          {assignedTickets.length === 0 ? (
            <EmptyState icon={ListChecks} title="No assigned tickets" description="This technician has no currently assigned tickets." />
          ) : (
            <Card>
              <CardContent className="space-y-3">
                {assignedTickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          {workHistory.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No completed work yet" description="Resolved and closed tickets for this technician will appear here." />
          ) : (
            <Card>
              <CardContent className="space-y-3">
                {workHistory.map((ticket) => (
                  <div key={ticket.id}>
                    <TicketRow ticket={ticket} />
                    {ticket.resolution && (
                      <p className="text-muted-foreground mt-1 ml-1 line-clamp-2 text-xs">Resolution: {ticket.resolution}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          {activity.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No recent activity recorded" description="Actions performed by this technician will appear here." />
          ) : (
            <Card>
              <CardContent>
                <ol className="relative space-y-6 border-l pl-5">
                  {activity.map((a) => (
                    <li key={a.id} className="relative">
                      <span className="bg-primary absolute -left-[26px] top-1 size-2.5 rounded-full" />
                      <p className="text-sm font-medium capitalize">{a.action} · <span className="text-muted-foreground font-normal">{a.item}</span></p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{a.module} · {formatDate(a.date)}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
