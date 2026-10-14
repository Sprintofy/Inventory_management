"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  Menu,
  Shield,
  Building2,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationsPopover } from "@/components/layout/NotificationsPopover";
import { DepartmentSelector } from "@/components/layout/DepartmentSelector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const roleLabels: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  user: "User",
  "department-manager": "User",
  "department-user": "User",
  viewer: "Viewer",
  technician: "Technician",
};

const pageTitles: Array<{ match: RegExp; title: string; crumb: string }> = [
  { match: /^\/dashboard$/, title: "Dashboard", crumb: "Dashboard" },
  { match: /^\/inventory$/, title: "Inventory", crumb: "Inventory" },
  { match: /^\/inventory\/.+/, title: "Item Details", crumb: "Inventory" },
  { match: /^\/stock-in/, title: "Stock In", crumb: "Stock In" },
  { match: /^\/stock-out/, title: "Stock Out", crumb: "Stock Out" },
  { match: /^\/categories/, title: "Categories", crumb: "Categories" },
  { match: /^\/departments$/, title: "Departments", crumb: "Departments" },
  {
    match: /^\/departments\/.+/,
    title: "Department Overview",
    crumb: "Departments",
  },
  { match: /^\/users/, title: "Users", crumb: "Users" },
  { match: /^\/reports/, title: "Reports", crumb: "Reports" },
  { match: /^\/activity/, title: "Activity Log", crumb: "Activity Log" },
  { match: /^\/tickets/, title: "Tickets", crumb: "Tickets" },
];

export function Header() {
  const { user, role, toggleNav, logout, visibleDepartments } = useApp();
  const pathname = usePathname();
  const meta = pageTitles.find((p) => p.match.test(pathname));

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "";

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleNav}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="text-muted-foreground hidden sm:inline">Home</span>
        <ChevronRight className="text-muted-foreground/50 hidden size-3.5 sm:inline" />
        <span className="truncate font-medium">
          {meta?.crumb ?? "Overview"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <GlobalSearch />
        <NotificationsPopover />

        {user && <DepartmentSelector className="hidden w-[180px] md:flex" />}

        {/* ── User Profile Dropdown ── */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:bg-accent flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 pl-2 transition-colors focus:outline-none">
                <Avatar className="ring-border size-8 ring-2 ring-offset-1">
                  <AvatarFallback
                    style={{ backgroundColor: user.color }}
                    className="text-xs font-semibold text-white"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[140px] truncate text-sm leading-tight font-medium">
                    {user.name}
                  </span>
                  <span className="text-muted-foreground block text-xs leading-tight">
                    {roleLabels[role]}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-0">
              {/* Profile Header */}
              <div className="flex items-start gap-3 px-4 py-3.5">
                <Avatar className="size-11 shrink-0">
                  <AvatarFallback
                    style={{ backgroundColor: user.color }}
                    className="text-sm font-bold text-white"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                  <span className="bg-primary/10 text-primary mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                    <Shield className="size-3" />
                    {roleLabels[role]}
                  </span>
                </div>
              </div>

              {/* Departments */}
              {visibleDepartments.length > 0 && (
                <>
                  <DropdownMenuSeparator className="my-0" />
                  <div className="px-4 py-2.5">
                    <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
                      <Building2 className="size-3" />
                      Departments
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {visibleDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="bg-muted text-muted-foreground inline-block rounded-md px-1.5 py-0.5 text-[11px]"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <DropdownMenuSeparator className="my-0" />

              {/* Logout */}
              <div className="p-1.5">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/30"
                >
                  <LogOut className="size-4" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}