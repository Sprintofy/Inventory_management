"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, LifeBuoy, LogOut, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { navForRole, bottomNav } from "@/components/layout/nav";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  user: "User",
  "department-manager": "User",
  "department-user": "User",
  viewer: "Viewer",
  technician: "Technician",
};

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { user, role, logout, toggleSidebar } = useApp();
  const pathname = usePathname();
  const [menuQuery, setMenuQuery] = React.useState("");
  const groups = navForRole(role);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" || pathname === "/" : pathname.startsWith(href));

  const term = menuQuery.trim().toLowerCase();
  const filtering = term.length > 0;

  const visibleGroups = React.useMemo(() => {
    if (!filtering) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.title.toLowerCase().includes(term) ||
            g.label.toLowerCase().includes(term) ||
            (i.keywords ?? []).some((k) => k.includes(term)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, term, filtering]);

  const flatMatches = filtering ? visibleGroups.flatMap((g) => g.items) : [];

  const handleNavigate = () => {
    onNavigate?.();
    setMenuQuery("");
  };

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

      {/* Menu search — filters sidebar navigation items */}
      {!collapsed && (
        <div className="shrink-0 px-3 pt-3">
          <div className="relative">
            <Search className="text-sidebar-foreground/40 pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <input
              value={menuQuery}
              onChange={(e) => setMenuQuery(e.target.value)}
              placeholder="Search menu…"
              aria-label="Search menu"
              className="border-white/10 bg-white/5 text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:bg-white/10 focus:border-white/20 h-9 w-full rounded-lg border pr-8 pl-9 text-sm outline-none transition-colors"
            />
            {menuQuery && (
              <button
                onClick={() => setMenuQuery("")}
                className="text-sidebar-foreground/50 hover:text-white absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
                aria-label="Clear menu search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4"> */}
      <nav className="sidebar-scroll flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {filtering && flatMatches.length === 0 && (
          <p className="text-sidebar-foreground/50 px-3 py-6 text-center text-xs">
            No menus found for “{menuQuery.trim()}”
          </p>
        )}
        {filtering ? (
          <div className="space-y-0.5">
            {flatMatches.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                collapsed={collapsed}
                active={isActive(item.href)}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        ) : (
          groups.map((group) => (
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
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </div>
          ))
        )}
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
              onNavigate={handleNavigate}
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
