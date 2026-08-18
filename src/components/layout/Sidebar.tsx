"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { navForRole, bottomNav } from "@/components/layout/nav";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function NavLink({
  href,
  icon: Icon,
  title,
  collapsed,
  active,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        active ? "bg-primary text-white shadow-sm" : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      {!collapsed && <span className="truncate">{title}</span>}
      {active && !collapsed && <span className="bg-white/90 ml-auto size-1.5 rounded-full" />}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="bg-white text-foreground shadow-md">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

const roleLabels: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "department-manager": "Department Manager",
  "department-user": "Department User",
  viewer: "Viewer",
};

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { user, role, state, switchRole, logout, toggleSidebar } = useApp();
  const pathname = usePathname();
  const groups = navForRole(role);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" || pathname === "/" : pathname.startsWith(href));

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "gap-2.5 px-5",
        )}
      >
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center"
          onClick={onNavigate}
        >
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm leading-tight font-semibold tracking-tight text-white">
                Altrox AI
              </p>
              <p className="text-sidebar-foreground/50 text-[10px] leading-tight tracking-wide uppercase">
                Enterprise Inventory
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="text-sidebar-foreground/50 hover:text-white ml-auto hidden cursor-pointer rounded-md p-1 transition-colors lg:block"
          aria-label="Toggle sidebar"
        >
          <ChevronsLeft
            className={cn(
              "size-4 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4"> */}
      <nav className="sidebar-scroll flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-sidebar-foreground/40 mb-1.5 px-3 text-[10px] font-semibold tracking-widest uppercase">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  collapsed={collapsed}
                  active={isActive(item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="space-y-0.5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              title={item.title}
              collapsed={collapsed}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <Separator className="my-3 bg-white/10" />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/10 cursor-pointer",
                  collapsed && "justify-center",
                )}
              >
                <Avatar className="size-8">
                  <AvatarFallback
                    style={{ backgroundColor: user.color }}
                    className="font-semibold text-white"
                  >
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">
                      {user.name}
                    </span>
                    <span className="text-sidebar-foreground/50 block truncate text-xs">
                      {roleLabels[role]}
                    </span>
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-60"
            >
              <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                DEMO ROLE SWITCHER
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                [
                  "super-admin",
                  "admin",
                  "department-manager",
                  "department-user",
                ] as const
              ).map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => switchRole(r)}
                  className={cn(role === r && "bg-accent font-medium")}
                >
                  {roleLabels[r]}
                  {role === r && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      current
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={logout}
                className="cursor-pointer"
              >
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { state, toggleNav } = useApp();
  const collapsed = state.settings.sidebarCollapsed;
  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 transition-all duration-300 lg:block", collapsed && "w-[68px]")}>
        <SidebarContent collapsed={collapsed} />
      </aside>
      <Sheet
        open={state.mobileNavOpen}
        onOpenChange={(open) => {
          if (!open) toggleNav();
        }}
      >
        <SheetContent side="left" className="w-[290px] bg-sidebar p-0">
          <SidebarContent collapsed={false} onNavigate={toggleNav} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export { LifeBuoy };
