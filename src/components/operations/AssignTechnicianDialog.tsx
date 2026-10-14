"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { getTechnicianWorkload } from "@/lib/dashboard-selectors";
import { workloadLevel, type WorkloadLevelKey } from "@/lib/workload";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ticket: Ticket;
  selectedTechnicianId: string | null;
  onSelectTechnician: (id: string | null) => void;
}

const schema = z.object({
  technicianId: z.string().min(1, "Please select a technician"),
});
type SV = z.output<typeof schema>;

const workloadClass: Record<WorkloadLevelKey, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-danger/10 text-danger",
  critical: "bg-danger/15 text-danger",
};

export function AssignTechnicianDialog({ open, onOpenChange, ticket, selectedTechnicianId, onSelectTechnician }: AssignTechnicianDialogProps) {
  const { state, updateTicket } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { technicianId: selectedTechnicianId ?? "" },
  });

  const watched = form.watch("technicianId");

  // Active-ticket counts derived from actual ticket assignments — the same
  // source the dashboard and Technicians page use, so all views stay in sync.
  const workload = React.useMemo(() => getTechnicianWorkload(state.tickets), [state.tickets]);

  React.useEffect(() => {
    if (open) {
      form.reset({ technicianId: selectedTechnicianId ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = React.useMemo(
    () => state.technicians.find((t) => t.id === watched),
    [state.technicians, watched]
  );

  // Real workload breakdown for the selected technician, computed from tickets in state
  const breakdown = React.useMemo(() => {
    if (!selected) return null;
    const active = state.tickets.filter((t) => t.technicianId === selected.id && (t.status === "open" || t.status === "in-progress" || t.status === "partially-resolved"));
    return {
      high: active.filter((t) => t.priority === "critical" || t.priority === "high").length,
      medium: active.filter((t) => t.priority === "medium").length,
      low: active.filter((t) => t.priority === "low").length,
      total: active.length,
    };
  }, [selected, state.tickets]);

  const onSubmit = (values: SV) => {
    updateTicket(ticket.id, { technicianId: values.technicianId });
    onOpenChange(false);
    onSelectTechnician(values.technicianId);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset({ technicianId: selectedTechnicianId ?? "" }); onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User className="text-primary size-5" /> Assign Technician</DialogTitle>
          <DialogDescription>Select a technician to assign to this ticket.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Ticket</p>
              <p className="font-mono text-xs font-semibold">{ticket.id}</p>
              <p className="mt-0.5 text-sm font-medium">{ticket.title}</p>
            </div>

            <FormField control={form.control} name="technicianId" render={({ field }) => (
              <FormItem><FormLabel>Select Technician</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(v) => { field.onChange(v); }}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select a technician" /></SelectTrigger>
                    <SelectContent>
                      {state.technicians.map((tech) => {
                        const level = workloadLevel(workload.get(tech.id) ?? 0);
                        return (
                          <SelectItem key={tech.id} value={tech.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{tech.name}</span>
                              <span className="text-muted-foreground text-xs">{tech.specialization}</span>
                              <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium", workloadClass[level.key])}>
                                {workload.get(tech.id) ?? 0} active
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {selected && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {selected.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{selected.name}</p>
                    <p className="text-muted-foreground text-xs">{selected.specialization} Specialist</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Active Tickets</span><span className="font-medium">{breakdown?.total ?? workload.get(selected.id) ?? 0}</span></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Workload</span><span className={cn("rounded-full px-2 py-0.5 font-medium capitalize", workloadClass[workloadLevel(breakdown?.total ?? workload.get(selected.id) ?? 0).key])}>{workloadLevel(breakdown?.total ?? workload.get(selected.id) ?? 0).label}</span></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">High Priority</span><span className="font-medium">{breakdown?.high ?? 0}</span></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Medium Priority</span><span className="font-medium">{breakdown?.medium ?? 0}</span></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Low Priority</span><span className="font-medium">{breakdown?.low ?? 0}</span></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Resolved</span><span className="font-medium">{selected.resolvedTickets}</span></div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={!watched}>
                {ticket.technicianId ? "Change Technician" : "Assign Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
