"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatDate } from "@/lib/utils";
import { uid } from "@/lib/toast-utils";

const schema = z.object({
  itemId: z.string().min(1, "Select an item"),
  direction: z.string().min(1, "Select adjustment type"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  note: z.string().min(2, "Note is required"),
});
type SV = z.output<typeof schema>;

export default function AdjustmentsPage() {
  const { state, activeDepartment, adjustStock, log } = useApp();
  const loading = useFakeLoading();
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const pageSize = 10;

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { itemId: "", direction: "positive", quantity: 1, note: "" },
  });

  React.useEffect(() => {
    if (dialogOpen) form.reset({ itemId: "", direction: "positive", quantity: 1, note: "" });
  }, [dialogOpen, form]);

  const selectedItem = state.inventory.find((i) => i.id === form.watch("itemId"));
  const direction = form.watch("direction");
  const qty = form.watch("quantity") || 0;
  const over = selectedItem && direction === "negative" && qty > selectedItem.quantity;

  const records = React.useMemo(() => {
    return state.transactions.filter((t) => {
      if (t.type !== "adjustment") return false;
      if (activeDepartment !== "all" && t.department !== activeDepartment) return false;
      return true;
    });
  }, [state.transactions, activeDepartment]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  const onSubmit = (values: SV) => {
    const item = state.inventory.find((i) => i.id === values.itemId);
    if (!item) return;
    const delta = values.direction === "positive" ? values.quantity : -values.quantity;
    adjustStock(values.itemId, delta, values.note);
    log(`adjusted stock (${values.direction})`, "Adjustments", item.name, item.department);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Adjustments"
        description="Correct stock levels for damages, write-offs and count discrepancies."
        breadcrumb={[{ label: "Adjustments" }]}
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> New Adjustment</Button>}
      />

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Reference</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={7} className="py-2"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && paged.length === 0 && (
              <TableRow><TableCell colSpan={7} className="p-0">
                <EmptyState icon={SlidersHorizontal} title="No adjustments" description="Stock adjustments will appear here." action={{ label: "New Adjustment", onClick: () => setDialogOpen(true) }} />
              </TableCell></TableRow>
            )}
            {!loading && paged.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs font-medium">{t.reference}</TableCell>
                <TableCell className="text-sm font-medium">{t.itemName}</TableCell>
                <TableCell><span className="bg-muted inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{t.department}</span></TableCell>
                <TableCell className={t.quantity > 0 ? "text-success font-semibold tabular-nums" : "text-danger font-semibold tabular-nums"}>{t.quantity > 0 ? "+" : ""}{t.quantity}</TableCell>
                <TableCell className="text-muted-foreground max-w-[220px] truncate text-xs">{t.note}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(t.date)}</TableCell>
                <TableCell className="text-xs">{t.createdBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3"><Pagination total={records.length} page={page} pageSize={pageSize} onPageChange={setPage} /></div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><SlidersHorizontal className="text-primary size-5" /> New Adjustment</DialogTitle>
            <DialogDescription>Record a stock correction. Quantities can be increased or decreased.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="itemId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {state.inventory.filter((i) => !i.archived).map((i) => (
                          <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="direction" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Increase (+)</SelectItem>
                          <SelectItem value="negative">Decrease (−)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl><Input type="number" min={1} max={selectedItem?.quantity && direction === "negative" ? selectedItem.quantity : undefined} {...field} /></FormControl>
                    <FormDescription className={over ? "text-destructive font-medium" : undefined}>
                      {over ? `Only ${selectedItem.quantity} available` : selectedItem ? `Current: ${selectedItem.quantity}` : ""}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="e.g. Damaged during transit" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={over}>Save Adjustment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { AlertTriangle };