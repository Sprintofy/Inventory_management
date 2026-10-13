"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertTriangle, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/store/app-store";
import type { Asset, RequestPriority } from "@/types";

const schema = z.object({
  assetId: z.string().min(1, "Select the faulty laptop / computer"),
  issueTitle: z.string().min(3, "Problem title is required"),
  issueDescription: z.string().min(10, "Describe the problem in at least 10 characters"),
  priority: z.string().min(1),
  department: z.string().min(1, "Select a department"),
  notes: z.string().optional(),
});
type SV = z.output<typeof schema>;

const priorities: RequestPriority[] = ["low", "medium", "high", "critical"];

/**
 * Step 1 of the Service & Repair flow.
 *
 * The Admin receives a laptop/computer that already exists in the asset
 * register (previous inventory) as a faulty item. Submitting this:
 *  - records a Stock In entry for the faulty return,
 *  - flags the master Asset as `under-repair`,
 *  - generates a ticket carrying that asset + the reported issue,
 *    ready to be assigned to a technician.
 *
 * Inventory quantities and the existing "Record Stock In" dialog are untouched.
 */
export function ReportFaultyAssetDialog({
  open,
  onOpenChange,
  presetAssetId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetAssetId?: string;
}) {
  const { state, visibleDepartments, reportFaultyAsset } = useApp();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [createdTicketId, setCreatedTicketId] = React.useState<string | null>(null);

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: {
      assetId: "",
      issueTitle: "",
      issueDescription: "",
      priority: "medium",
      department: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      assetId: presetAssetId ?? "",
      issueTitle: "",
      issueDescription: "",
      priority: "medium",
      department: visibleDepartments.length === 1 ? visibleDepartments[0] : "",
      notes: "",
    });
    setSearch("");
    setCreatedTicketId(null);
  }, [open, presetAssetId, form, visibleDepartments]);

  const candidates = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.assets
      .filter((a) => visibleDepartments.includes(a.department))
      .filter((a) => a.status !== "retired" && a.status !== "lost")
      .filter(
        (a) =>
          !term ||
          a.name.toLowerCase().includes(term) ||
          a.assetId.toLowerCase().includes(term) ||
          a.serialNumber.toLowerCase().includes(term) ||
          a.category.toLowerCase().includes(term)
      )
      .slice(0, 40);
  }, [state.assets, search, visibleDepartments]);

  const selected = state.assets.find((a) => a.assetId === form.watch("assetId")) as Asset | undefined;

  const onSubmit = (values: SV) => {
    const ticketId = reportFaultyAsset({
      assetId: values.assetId,
      issueTitle: values.issueTitle.trim(),
      issueDescription: values.issueDescription.trim(),
      priority: values.priority as RequestPriority,
      department: values.department,
      notes: values.notes?.trim() || undefined,
    });
    if (ticketId) setCreatedTicketId(ticketId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setCreatedTicketId(null);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="text-warning size-5" /> Report Faulty Asset (Stock In)
          </DialogTitle>
          <DialogDescription>
            Receive a computer or laptop from previous inventory as a faulty item. The asset is flagged
            &quot;Under Repair&quot; and a repair ticket is generated automatically.
          </DialogDescription>
        </DialogHeader>

        {createdTicketId ? (
          <div className="space-y-4">
            <div className="bg-success/10 text-success rounded-lg border p-4 text-sm">
              <p className="font-semibold">Faulty asset received</p>
              <p className="text-muted-foreground mt-1">
                Ticket <span className="font-mono font-semibold">{createdTicketId}</span> was generated and the asset is
                now marked &quot;Under Repair&quot;.
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg border p-3 text-xs">
              <p className="font-semibold">Next step</p>
              <p className="text-muted-foreground mt-1">
                Open the ticket and assign a technician. The technician logs in with their own email, adds remarks and
                submits it back as solved — then you close the ticket to make the asset available again.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreatedTicketId(null)}>
                Report another
              </Button>
              <Button onClick={() => { onOpenChange(false); router.push(`/tickets/${createdTicketId}`); }}>
                Open ticket
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faulty Item (from previous inventory)</FormLabel>
                    <div className="relative">
                      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, asset ID or serial number..."
                        className="pl-9"
                      />
                    </div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select the laptop / computer" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((a) => (
                          <SelectItem key={a.id} value={a.assetId}>
                            {a.assetId} — {a.name}
                          </SelectItem>
                        ))}
                        {candidates.length === 0 && (
                          <div className="text-muted-foreground px-2 py-6 text-center text-sm">
                            No matching assets found.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selected && (
                <div className="bg-muted/40 space-y-1.5 rounded-lg border p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{selected.name}</span>
                    <StatusBadge status={selected.status} className="h-5 px-1.5 text-[11px]" />
                  </div>
                  <p className="text-muted-foreground font-mono">{selected.assetId} · SN {selected.serialNumber}</p>
                  <p className="text-muted-foreground">
                    {selected.category} · {selected.department} · {selected.location}
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="issueTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Laptop will not power on" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Describe the symptoms the user reported"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((p) => (
                              <SelectItem key={p} value={p} className="capitalize">
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.departments.map((d) => (
                              <SelectItem key={d.id} value={d.name}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Handed over by branch IT" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="bg-warning/10 text-warning-foreground flex gap-2 rounded-lg border p-3 text-xs">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                  The asset status changes to <span className="font-semibold">Under Repair</span> and a Stock In record is
                  created. Inventory stock quantities are not changed.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Receive Faulty Asset</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
