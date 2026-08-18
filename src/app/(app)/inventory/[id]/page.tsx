"use client";

import * as React from "react";
import Link from "next/link";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  FileText,
  Layers,
  MapPin,
  MoreHorizontal,
  Package,
  PackageMinus,
  PackagePlus,
  Pencil,
  Tag,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StockHistory } from "@/components/inventory/StockHistory";
import { InventoryForm } from "@/components/inventory/InventoryForm";
import { StockInDialog, StockOutDialog } from "@/components/inventory/StockDialogs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, updateItem, archiveItems, can } = useApp();
  const router = useRouter();
  const loading = useFakeLoading(300);

  const item = state.inventory.find((i) => i.id === id);

  const [editOpen, setEditOpen] = React.useState(false);
  const [stockInOpen, setStockInOpen] = React.useState(false);
  const [stockOutOpen, setStockOutOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const history = useMemo(
    () => state.transactions.filter((t) => t.itemId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.transactions, id]
  );

  if (!loading && !item) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={Package}
          title="Item not found"
          description="This inventory item doesn't exist or was archived."
          action={{ label: "Back to Inventory", href: "/inventory" }}
        />
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

  const totalValue = item.quantity * item.unitCost;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/inventory")} aria-label="Back to Inventory">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{item.name}</h1>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">{item.sku}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setStockInOpen(true)}><PackagePlus className="size-4" /> Stock In</Button>
          <Button variant="outline" onClick={() => setStockOutOpen(true)} disabled={item.quantity === 0}><PackageMinus className="size-4" /> Stock Out</Button>
          {can("inventory.manage") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><MoreHorizontal className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setArchiveOpen(true)}>Archive item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <p className="text-muted-foreground text-xs font-medium">Reorder Level</p>
              <Layers className="text-warning size-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatNumber(item.reorderLevel)}</p>
            <p className="text-muted-foreground text-xs">Min: {item.minStock} · Max: {item.maxStock}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Inventory Value</p>
              <TrendingUp className="text-success size-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(totalValue)}</p>
            <p className="text-muted-foreground text-xs">@ {formatCurrency(item.unitCost)} / {item.unit}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Location</p>
              <MapPin className="text-sky-500 size-4" />
            </div>
            <p className="mt-2 text-lg font-semibold">{item.location}</p>
            <p className="text-muted-foreground text-xs">{item.department}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="py-0">
        <Tabs defaultValue="overview">
          <div className="border-b px-6 pt-4">
            <TabsList className="bg-transparent h-auto w-full justify-start gap-6 rounded-none border-b-0 p-0">
              {[
                { v: "overview", l: "Overview" },
                { v: "history", l: "Stock History" },
                { v: "transactions", l: "Transactions" },
                { v: "assets", l: "Assets" },
                { v: "documents", l: "Documents" },
              ].map((t) => (
                <TabsTrigger key={t.v} value={t.v} className="data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground rounded-none border-b-2 border-transparent px-1 pb-3 text-sm hover:text-foreground data-[state=active]:border-primary">
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold">Item Information</h3>
                <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {[
                    { k: "Category", v: item.category, icon: Tag },
                    { k: "Subcategory", v: item.subcategory ?? "—" },
                    { k: "Department", v: item.department, icon: Building2 },
                    { k: "Supplier", v: item.supplier ?? "—" },
                    { k: "Unit", v: item.unit },
                    { k: "Condition", v: item.condition ?? "—" },
                    { k: "Warranty", v: item.warranty ?? "—" },
                    { k: "Created", v: formatDate(item.createdAt), icon: CalendarDays },
                    { k: "Serial Number", v: item.serialNumber ?? "—" },
                    { k: "Asset Number", v: item.assetNumber ?? "—" },
                    { k: "Batch Number", v: item.batchNumber ?? "—" },
                    { k: "Last Updated", v: formatDate(item.lastUpdated) },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center justify-between gap-4 border-b pb-2">
                      <dt className="text-muted-foreground text-sm">{row.k}</dt>
                      <dd className="text-right text-sm font-medium">{row.v}</dd>
                    </div>
                  ))}
                </dl>
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
              </div>
              <div>
                <h3 className="text-sm font-semibold">Stock Levels</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium tabular-nums">{item.quantity} / {item.maxStock}</span>
                    </div>
                    <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                      <div
                        className={
                          item.status === "out-of-stock" ? "bg-danger h-full rounded-full" :
                          item.status === "low-stock" ? "bg-warning h-full rounded-full" :
                          "bg-success h-full rounded-full"
                        }
                        style={{ width: `${Math.min(100, (item.quantity / Math.max(1, item.maxStock)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-muted/60 flex items-center justify-between rounded-lg px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Reorder point</span>
                    <span className="font-medium tabular-nums">{item.reorderLevel}</span>
                  </div>
                  <div className="bg-muted/60 flex items-center justify-between rounded-lg px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="p-6">
            <StockHistory transactions={history} itemName={item.name} />
          </TabsContent>

          <TabsContent value="transactions" className="p-6">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    {["Reference", "Type", "Quantity", "Department", "Date", "By"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr><td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">No transactions</td></tr>
                  )}
                  {history.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-2.5 font-mono text-xs">{t.reference}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={t.type} dot={false} /></td>
                      <td className={t.quantity > 0 ? "text-success px-4 py-2.5 font-medium tabular-nums" : "text-primary px-4 py-2.5 font-medium tabular-nums"}>{t.quantity > 0 ? "+" : ""}{t.quantity}</td>
                      <td className="text-muted-foreground px-4 py-2.5 text-xs">{t.department}{t.toDepartment ? ` → ${t.toDepartment}` : ""}</td>
                      <td className="text-muted-foreground px-4 py-2.5 text-xs">{formatDate(t.date)}</td>
                      <td className="px-4 py-2.5 text-xs">{t.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="p-6">
            {item.serialNumber || item.assetNumber ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-muted/60 flex items-center gap-3 rounded-lg p-4">
                  <Package className="text-primary size-5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Serial Number</p>
                    <p className="font-mono text-sm">{item.serialNumber ?? "—"}</p>
                  </div>
                </div>
                <div className="bg-muted/60 flex items-center gap-3 rounded-lg p-4">
                  <Tag className="text-warning size-5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Asset Number</p>
                    <p className="font-mono text-sm">{item.assetNumber ?? "—"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Package} title="No assets linked" description="This item is not registered as an asset." />
            )}
          </TabsContent>

          <TabsContent value="documents" className="p-6">
            <EmptyState
              icon={FileText}
              title="No documents"
              description="Attach invoices, warranties or certificates to this item."
              action={{ label: "Upload Document", onClick: () => toast.info("Document upload will be available with the backend") }}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <InventoryForm open={editOpen} onOpenChange={setEditOpen} item={item} />
      <StockInDialog open={stockInOpen} onOpenChange={setStockInOpen} presetItem={item} />
      <StockOutDialog open={stockOutOpen} onOpenChange={setStockOutOpen} presetItem={item} />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive this item?"
        description={`${item.name} will be hidden from inventory lists. Its history will be preserved.`}
        confirmLabel="Archive"
        onConfirm={() => {
          archiveItems([item.id]);
          toast.success(`${item.name} archived`);
          router.push("/inventory");
        }}
      />
    </div>
  );
}

export { ChevronDown };