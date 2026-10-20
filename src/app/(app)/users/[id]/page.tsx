"use client";

import { use } from "react";
import { ArrowLeft, Building2, CalendarDays, Mail, Shield, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate } from "@/lib/utils";
import { BackButton } from "@/components/ui/BackButton";
import type { User } from "@/types";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, user } = useApp();
  const loading = useFakeLoading(300);

  const u = state.users.find((x) => x.id === id);

  if (!loading && !u) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={UserCircle2}
          title="User not found"
          description="This user record doesn't exist."
          action={{ label: "Back to Users", href: "/users" }}
        />
      </div>
    );
  }

  if (loading || !u) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const isCurrentUser = u.id === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton label="Back to Users" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{u.name}</h1>
              <Badge variant={u.status === "active" ? "success" : u.status === "inactive" ? "destructive" : "secondary"}>
                {u.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">{u.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {u.role === "super-admin" && !isCurrentUser && (
            <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed" title="Super admin cannot be deleted">
              <span className="flex items-center gap-1.5">Delete</span>
            </Button>
          )}
        </div>
      </div>

      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm mb-2">
        <a href="/users" className="hover:text-foreground cursor-pointer">Users</a>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground font-medium">{u.name}</span>
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4"><CardContent className="px-5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">Email</p>
            <Mail className="text-muted-foreground size-4" />
          </div>
          <p className="mt-2 text-sm font-medium break-all">{u.email}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent className="px-5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">Role</p>
            <Shield className="text-muted-foreground size-4" />
          </div>
          <p className="mt-2 text-sm font-medium capitalize">{u.role}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent className="px-5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">Department</p>
            <Building2 className="text-muted-foreground size-4" />
          </div>
          <p className="mt-2 text-sm font-medium">{u.department}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent className="px-5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">Last Active</p>
            <CalendarDays className="text-muted-foreground size-4" />
          </div>
          <p className="mt-2 text-sm font-medium">{formatDate(u.lastActive)}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent className="px-5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">Employee ID</p>
            <UserCircle2 className="text-muted-foreground size-4" />
          </div>
          <p className="mt-2 text-sm font-medium">{u.employeeId}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent className="px-5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">Post</p>
            <Building2 className="text-muted-foreground size-4" />
          </div>
          <p className="mt-2 text-sm font-medium">{u.post ?? "—"}</p>
        </CardContent></Card>
        <Card className="py-4"><CardContent className="px-5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium">Sub-department</p>
            <Building2 className="text-muted-foreground size-4" />
          </div>
          <p className="mt-2 text-sm font-medium">{u.subDepartment ?? "—"}</p>
        </CardContent></Card>
      </div>

      {u.post && (
        <Card className="py-4"><CardContent className="py-3">
          <p className="text-muted-foreground text-xs font-medium">Post / Rank</p>
          <p className="mt-1 text-sm">{u.post}</p>
        </CardContent></Card>
      )}
    </div>
  );
}
