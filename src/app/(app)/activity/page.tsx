"use client";

import * as React from "react";
import { useMemo } from "react";
import { Activity as ActivityIcon, FileText, FilterX } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/store/app-store";
import { formatDate, timeAgo } from "@/lib/utils";

const moduleTone: Record<string, string> = {
  "Inventory": "bg-primary/10 text-primary",
  "Stock In": "bg-success/10 text-success",
  "Stock Out": "bg-success/10 text-success",
  "Tickets": "bg-sky-500/10 text-sky-600",
  "Categories": "bg-emerald-500/10 text-emerald-600",
  "Departments": "bg-pink-500/10 text-pink-600",
  "Users": "bg-cyan-500/10 text-cyan-600",
  "Technicians": "bg-violet-500/10 text-violet-500",
};

// Modules with working UI in the current system. Logs from removed areas
// (Purchase Orders, Suppliers, Assets, Locations, Adjustments, Transfers,
// Requests) are hidden so the trail only shows actions still possible.
const POSSIBLE_MODULES = [
  "Inventory",
  "Stock In",
  "Stock Out",
  "Tickets",
  "Categories",
  "Departments",
  "Users",
  "Technicians",
];

export default function ActivityPage() {
  const { state } = useApp();
  const [query, setQuery] = React.useState("");
  const [user, setUser] = React.useState("all");
  const [module, setModule] = React.useState("all");
  const [dept, setDept] = React.useState("all");

  const visibleActivities = useMemo(
    () => state.activities.filter((a) => POSSIBLE_MODULES.includes(a.module)),
    [state.activities]
  );

  const users = useMemo(() => [...new Set(visibleActivities.map((a) => a.user))], [visibleActivities]);
  const modules = useMemo(() => POSSIBLE_MODULES.filter((m) => visibleActivities.some((a) => a.module === m)), [visibleActivities]);
  const departments = useMemo(() => [...new Set(visibleActivities.map((a) => a.department))], [visibleActivities]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return visibleActivities.filter((a) => {
      if (user !== "all" && a.user !== user) return false;
      if (module !== "all" && a.module !== module) return false;
      if (dept !== "all" && a.department !== dept) return false;
      if (term && !(a.action.toLowerCase().includes(term) || a.item.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [visibleActivities, query, user, module, dept]);

  const hasFilters = query || user !== "all" || module !== "all" || dept !== "all";

  return (
    <div className="space-y-5">
      <PageHeader title="Activity Log" description="Audit trail of every action across the system." breadcrumb={[{ label: "Activity Log" }]} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actions or items…" className="sm:max-w-xs" />
        <Select value={user} onValueChange={setUser}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="All users" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="All modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="All departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setUser("all"); setModule("all"); setDept("all"); }}>
            <FilterX className="size-3.5" /> Clear
          </Button>
        )}
      </div>

      <Card className="py-4">
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activity found" description="Try adjusting your filters." />
          ) : (
            <div className="relative ml-3 border-l-2 border-border pl-6">
              <div className="space-y-6">
                {filtered.slice(0, 50).map((a) => (
                  <div key={a.id} className="relative">
                    <span className="bg-primary absolute -left-[31px] top-1.5 size-2.5 rounded-full ring-4 ring-primary/15" />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-medium">{a.user}</span>
                      <Badge className={moduleTone[a.module] ?? "bg-muted text-muted-foreground"} variant="outline">{a.module}</Badge>
                      <span className="text-muted-foreground text-xs">{timeAgo(a.date)}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-sm">
                      <FileText className="mt-0.5 size-3.5 shrink-0 opacity-50" />
                      <span>{a.action}{a.item ? ` — ${a.item}` : ""}</span>
                    </p>
                    <p className="text-muted-foreground/70 mt-0.5 text-xs">{a.department} · {formatDate(a.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}