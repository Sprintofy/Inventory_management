"use client";

import * as React from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";

const typeClass: Record<string, string> = {
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function NotificationsPopover() {
  const { state, markNotificationsRead } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative" aria-label="Notifications">
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="bg-danger absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="end" sideOffset={10}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-muted-foreground text-xs">{unread} unread</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={markNotificationsRead}>
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {state.notifications.map((n) => (
            <div key={n.id} className={cn("flex gap-3 border-b px-4 py-3 last:border-0", !n.read && "bg-accent/40")}>
              <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", n.read ? "bg-muted" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] capitalize", typeClass[n.type])}>{n.type}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{n.description}</p>
                <p className="text-muted-foreground/70 mt-1 text-[11px]">{timeAgo(n.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
