"use client";

import * as React from "react";
import { Boxes, CalendarClock, ChevronRight, CircleHelp, LogOut, Settings as SettingsIcon, ShieldCheck, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/store/app-store";

const sections = [
  {
    icon: Boxes,
    title: "Managing Inventory",
    items: [
      "Add items from the Inventory page using the Add Item wizard (name, category, department, location, quantities).",
      "Adjust stock levels with Stock In, Stock Out and Adjustments - changes are logged automatically.",
      "Use bulk actions to assign departments, change locations, export to CSV, or archive obsolete items.",
      "Search instantly with the global search (Ctrl/Cmd+K) - results jump to item details or filter the inventory list.",
    ],
  },
  {
    icon: Truck,
    title: "Stock Operations",
    items: [
      "Stock In records incoming goods (purchase or return) and updates quantities.",
      "Stock Out issues items against consumption; insufficient stock is blocked.",
      "Transfers move stock between departments and follow Requested to Approved to In Transit to Completed.",
      "Requests let team members ask for stock; Approve & Fulfill issues the items in one click.",
      "Purchase Orders track supplier orders; Receive Stock applies the quantities to inventory.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Roles & Access",
    items: [
      "Super Admin and Admin see everything and can manage organization settings.",
      "Department Managers manage their own department's inventory, requests and approvals.",
      "Department Users have read access plus request and stock-out capabilities for their department.",
      "Use the avatar menu in the header to switch demo roles instantly.",
    ],
  },
  {
    icon: CalendarClock,
    title: "Reports & Monitoring",
    items: [
      "The Dashboard shows KPIs, stock movement charts, department distribution and recent activity.",
      "Reports offers category value analysis, top items by value, and CSV export.",
      "The Activity Log is a full audit trail - filter by user, module, or department.",
      "Departments and Assets pages surface ownership, values, low stock and team details.",
    ],
  },
];

export default function HelpPage() {
  const { user, logout } = useApp();
  const router = useRouter();

  return (
    <div className="space-y-5">
      <PageHeader title="Help Center" description="Learn how to get the most out of InventoryOS." breadcrumb={[{ label: "Help" }]} />

      <Card className="bg-primary/5 border-primary/20 py-6">
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-semibold">Need a hand?</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Search the knowledge base or contact your administrator. {user?.name && <span className="font-medium text-foreground">You are signed in as {user.name}.</span>}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5 py-1.5 text-xs">
            <CircleHelp className="size-3.5" /> Demo environment
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="py-5 transition-shadow hover:shadow-md">
              <CardContent className="px-6">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold">{s.title}</h2>
                <ul className="mt-3 space-y-2.5">
                  {s.items.map((item) => (
                    <li key={item} className="text-muted-foreground flex items-start gap-2 text-sm">
                      <ChevronRight className="mt-0.5 size-3.5 shrink-0 opacity-50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="py-5">
        <CardContent className="flex flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold">Quick actions</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">Jump straight to the tools you use most.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/inventory?modal=new")}><Boxes className="size-3.5" /> Add Item</Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/reports")}><CalendarClock className="size-3.5" /> View Reports</Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/settings")}><SettingsIcon className="size-3.5" /> Settings</Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { logout(); router.push("/login"); }}><LogOut className="size-3.5" /> Sign Out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}