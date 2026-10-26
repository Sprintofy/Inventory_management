 "use client";

import * as React from "react";
import Link from "next/link";
import { use, useMemo } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Layers,
  MapPin,
  Package,
  PackageMinus,
  PackagePlus,
  Pencil,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InventoryForm } from "@/components/inventory/InventoryForm";
import { StockInDialog, StockOutDialog } from "@/components/inventory/StockDialogs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { BackButton } from "@/components/ui/BackButton";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, can } = useApp();
  const loading = useFakeLoading(300);
  const [dateFilter, setDateFilter] = React.useState<"all" | "today" | "week" | "month">("all");

  const item = state.inventory.find((i) => i.id === id);

  const [editOpen, setEditOpen] = React.useState(false);
  const [stockInOpen, setStockInOpen] = React.useState(false);
  const [stockOutOpen, setStockOutOpen] = React.useState(false);

  const history = useMemo(
    () => state.transactions.filter((t) => t.itemId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.transactions, id]
  );

  const inHistory = useMemo(() => history.filter((t) => t.type === "stock-in"), [history]);
  const outHistory = useMemo(() => history.filter((t) => t.type === "stock-out"), [history]);

  const ticketHistory = useMemo(() => {
    return state.tickets
      .filter((t) => {
        const itemIds = t.itemIds || [];
        if (!itemIds.includes(item!.id)) return false;
        if (dateFilter === "all") return true;
        const d = new Date(t.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateFilter === "today") return d.toDateString() === today.toDateString();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        if (dateFilter === "week") return d >= weekAgo;
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        if (dateFilter === "month") return d >= monthAgo;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.tickets, id, dateFilter]);

  if (!loading && !item) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={Package} title="Item not found" description="This inventory item doesn't exist." action={{ label: "Back to Inventory", href: "/inventory" }} />
      </div>
    );
  }

  if (loading || !item) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton label="Back to Inventory" />
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{item.deviceName}</h1>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-muted-foreground mt-0.5 font-mono text-xs">Reg No. {item.sku}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setStockInOpen(true)}><PackagePlus className="size-4" /> Stock In</Button>
          <Button variant="outline" onClick={() => setStockOutOpen(true)} disabled={item.quantity === 0}><PackageMinus className="size-4" /> Stock Out</Button>
          {can("inventory.manage") && (
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="size-4" /> Edit</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent className="px-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Current Stock</p>
              <Package className="text-primary size-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatNumber(item.quantity)} <span className="text-muted-foreground text-sm font-normal">{item.unit}s</span>
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Status</p>
              <StatusBadge status={item.status} />
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Last Updated</p>
              <CalendarDays className="text-success size-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatDate(item.lastUpdated)}</p>
            <p className="text-muted-foreground text-xs">Created: {formatDate(item.createdAt)}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Brand</p>
              <Tag className="text-sky-500 size-4" />
            </div>
            <p className="mt-2 text-lg font-semibold">{item.brand}</p>
            <p className="text-muted-foreground text-xs">{item.modelNumber}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="py-0">
        <Tabs defaultValue="overview">
          <TabsList className="px-6 pt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="in-out">In / Out History</TabsTrigger>
            <TabsTrigger value="tickets">Ticket History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold">Item Information</h3>
                <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {[
                    { k: "Device Name", v: item.deviceName },
                    { k: "Brand", v: item.brand },
                    { k: "Model Number", v: item.modelNumber },
                    { k: "Category", v: item.category },
                    { k: "Sub Department", v: item.subDepartment ?? "—" },
                    { k: "Department", v: item.department },
                    { k: "Supplier", v: item.supplier ?? "—" },
                    { k: "Unit", v: item.unit },
                    { k: "Specifications", v: item.specifications ?? "—" },
                    { k: "Warranty Period", v: item.warrantyPeriod ?? "—" },
                    { k: "Created", v: formatDate(item.createdAt) },
                    { k: "Last Updated", v: formatDate(item.lastUpdated) },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center justify-between gap-4 border-b pb-2">
                      <dt className="text-muted-foreground text-sm">{row.k}</dt>
                      <dd className="text-right text-sm font-medium">{row.v}</dd>
                    </div>
                  ))}
                  {item.description && (
                    <div className="mt-5">
                      <h4 className="text-sm font-semibold">Description</h4>
                      <p className="text-muted-foreground mt-1.5 text-sm">{item.description}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold">Notes</h4>
                      <p className="text-muted-foreground mt-1.5 text-sm">{item.notes}</p>
                    </div>
                  )}
                </dl>
                <div>
                  <h3 className="text-sm font-semibold">Stock Levels</h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium tabular-nums">{item.quantity}</span>
                    </div>
                  </div>
                  <div className="bg-muted/60 flex items-center justify-between rounded-lg px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="in-out" className="space-y-6 p-6">
            <div>
              <h4 className="mb-3 text-sm font-semibold">Stock In History ({inHistory.length})</h4>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      {["Reference", "Quantity", "Department", "Date", "By"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {inHistory.length === 0 && (
                      <tr><td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">No stock in records</td></tr>
                    )}
                    {inHistory.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-2.5 font-mono text-xs">{t.reference}</td>
                        <td className="text-success px-4 py-2.5 font-medium tabular-nums">+{t.quantity}</td>
                        <td className="text-muted-foreground px-4 py-2.5 text-xs">{t.department}{t.toDepartment ? ` → ${t.toDepartment}` : ""}</td>
                        <td className="text-muted-foreground px-4 py-2.5 text-xs">{formatDate(t.date)}</td>
                        <td className="px-4 py-2.5 text-xs">{t.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Stock Out History ({outHistory.length})</h4>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      {["Reference", "Quantity", "Department", "Date", "By"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {outHistory.length === 0 && (
                      <tr><td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">No stock out records</td></tr>
                    )}
                    {outHistory.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-2.5 font-mono text-xs">{t.reference}</td>
                        <td className="text-primary px-4 py-2.5 font-medium tabular-nums">{t.quantity}</td>
                        <td className="text-muted-foreground px-4 py-2.5 text-xs">{t.department}{t.toDepartment ? ` → ${t.toDepartment}` : ""}</td>
                        <td className="text-muted-foreground px-4 py-2.5 text-xs">{formatDate(t.date)}</td>
                        <td className="px-4 py-2.5 text-xs">{t.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="size-3.5 mr-2" />
                    Ticket History
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Filter by Date</label>
                    <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as "all" | "today" | "week" | "month")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Total Tickets</span>
                    <span className="text-xl font-bold">{ticketHistory.length}</span>
                  </div>
                  {ticketHistory.length === 0 ? (
                    <div className="rounded-lg border border-muted/50 p-4 text-center text-muted-foreground text-sm">
                      No ticket history for this product yet.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-muted/50 p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 text-muted-foreground">
                            <th className="px-4 py-2.5 text-left font-medium">Ticket ID</th>
                            <th className="px-4 py-2.5 text-left font-medium">Title</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium">Date</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium">Priority</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium">Status</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium">Technician</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticketHistory.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-muted/50">
                              <td className="px-4 py-2.5 font-mono text-xs">{ticket.id}</td>
                              <td className="px-4 py-2.5 text-sm">{ticket.title}</td>
                              <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatDate(ticket.createdAt)}</td>
                              <td className="px-4 py-2.5 text-xs">{ticket.priority}</td>
                              <td className="px-4 py-2.5 text-xs font-medium"><StatusBadge status={ticket.status} /></td>
                              <td className="px-4 py-2.5 text-muted-foreground text-xs">{ticket.createdBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {ticketHistory.map((ticket) => (
                        <div key={ticket.id} className="rounded-lg border border-muted/50 p-4 mt-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="text-xs font-medium">{ticket.title}</span>
                            <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span className="text-muted-foreground">{ticket.description || "No description"}</span>
                            <span className="text-xs font-mono text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="text-xs font-medium">Issue Type:</span>
                              <span className="font-medium">{ticket.category}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="text-xs font-medium">Technician:</span>
                              <span className="font-medium">{ticket.technicianId || "Not assigned"}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="text-xs font-medium">Status:</span>
                              <span className="font-medium text-sm capitalize">{ticket.status}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="text-xs font-medium">Resolution:</span>
                              <span className="font-medium text-sm">{ticket.resolution || "Pending"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          </Tabs>
        </Card>

        <InventoryForm open={editOpen} onOpenChange={setEditOpen} item={item} />
        <StockInDialog open={stockInOpen} onOpenChange={setStockInOpen} presetItem={item} />
        <StockOutDialog open={stockOutOpen} onOpenChange={setStockOutOpen} presetItem={item} />
      </div>
    );
  }
