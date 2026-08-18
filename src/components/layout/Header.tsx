"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, HelpCircle, Menu, ShieldCheck } from "lucide-react";
import { useApp } from "@/store/app-store";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationsPopover } from "@/components/layout/NotificationsPopover";
import { DepartmentSelector } from "@/components/layout/DepartmentSelector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "department-manager": "Department Manager",
  "department-user": "Department User",
  viewer: "Viewer",
};

const pageTitles: Array<{ match: RegExp; title: string; crumb: string }> = [
  { match: /^\/dashboard$/, title: "Dashboard", crumb: "Dashboard" },
  { match: /^\/inventory$/, title: "Inventory", crumb: "Inventory" },
  { match: /^\/inventory\/.+/, title: "Item Details", crumb: "Inventory" },
  { match: /^\/stock-in/, title: "Stock In", crumb: "Stock In" },
  { match: /^\/stock-out/, title: "Stock Out", crumb: "Stock Out" },
  { match: /^\/transfers$/, title: "Transfers", crumb: "Transfers" },
  { match: /^\/transfers\/.+/, title: "Transfer Details", crumb: "Transfers" },
  { match: /^\/adjustments/, title: "Adjustments", crumb: "Adjustments" },
  { match: /^\/requests$/, title: "Inventory Requests", crumb: "Requests" },
  { match: /^\/requests\/.+/, title: "Request Details", crumb: "Requests" },
  { match: /^\/purchase-orders$/, title: "Purchase Orders", crumb: "Purchase Orders" },
  { match: /^\/purchase-orders\/.+/, title: "Purchase Order", crumb: "Purchase Orders" },
  { match: /^\/suppliers$/, title: "Suppliers", crumb: "Suppliers" },
  { match: /^\/suppliers\/.+/, title: "Supplier Profile", crumb: "Suppliers" },
  { match: /^\/assets$/, title: "Assets", crumb: "Assets" },
  { match: /^\/assets\/.+/, title: "Asset Details", crumb: "Assets" },
  { match: /^\/categories/, title: "Categories", crumb: "Categories" },
  { match: /^\/locations/, title: "Locations", crumb: "Locations" },
  { match: /^\/departments$/, title: "Departments", crumb: "Departments" },
  { match: /^\/departments\/.+/, title: "Department Overview", crumb: "Departments" },
  { match: /^\/users/, title: "Users", crumb: "Users" },
  { match: /^\/reports/, title: "Reports", crumb: "Reports" },
  { match: /^\/activity/, title: "Activity Log", crumb: "Activity Log" },
  { match: /^\/settings/, title: "Settings", crumb: "Settings" },
  { match: /^\/help/, title: "Help Center", crumb: "Help" },
];

export function Header() {
  const { user, role, state, toggleNav, switchRole, logout, visibleDepartments } = useApp();
  const pathname = usePathname();
  const meta = pageTitles.find((p) => p.match.test(pathname));

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleNav} aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>

      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="text-muted-foreground hidden sm:inline">Home</span>
        <ChevronRight className="text-muted-foreground/50 hidden size-3.5 sm:inline" />
        <span className="truncate font-medium">{meta?.crumb ?? "Overview"}</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <GlobalSearch />
        <NotificationsPopover />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:inline-flex" asChild>
              <a href="/help" aria-label="Help">
                <HelpCircle className="size-4.5" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Help Center</TooltipContent>
        </Tooltip>

        {user && (
          <DepartmentSelector className="hidden w-[180px] md:flex" />
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 pl-2 transition-colors hover:bg-accent">
                <Avatar className="size-8">
                  <AvatarFallback style={{ backgroundColor: user.color }} className="font-semibold text-white">
                    {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[140px] truncate text-sm leading-tight font-medium">{user.name}</span>
                  <span className="text-muted-foreground block text-xs leading-tight">{roleLabels[role]}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {roleLabels[role]} · {visibleDepartments.join(", ")}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                DEMO ROLE SWITCHER
              </DropdownMenuLabel>
              {(["super-admin", "admin", "department-manager", "department-user"] as const).map((r) => (
                <DropdownMenuItem key={r} onClick={() => switchRole(r)} className={cn(role === r && "bg-accent font-medium")}>
                  {roleLabels[r]}
                  {role === r && <span className="text-muted-foreground ml-auto text-xs">current</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
