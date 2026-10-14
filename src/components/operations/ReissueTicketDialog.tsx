"use client";

import * as React from "react";
import { RotateCcw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { formatDateTime } from "@/lib/utils";
import type { Ticket } from "@/types";

/**
 * Admin review loop — "not solved yet" branch.
 *
 * Sends the ticket back to the SAME technician: it returns to In Progress, the
 * issues reopen so they must be fixed again, and the reason is stored on the
 * ticket so the technician sees exactly what still needs work.
 */
export function ReissueTicketDialog({
  open,
  onOpenChange,
  ticket,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ticket: Ticket | null;
}) {
  const { state, reissueTicket } = useApp();
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) setNote("");
  }, [open, ticket?.id]);
  // eslint-disable-line react-hooks/set-state-in-effect

  if (!ticket) return null;

  const technician = state.technicians.find((t) => t.id === ticket.technicianId);
  const canReissue = Boolean(ticket.technicianId);

  const onSubmit = () => {
    reissueTicket(ticket.id, note);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="text-warning size-5" /> Re-issue Ticket
          </DialogTitle>
          <DialogDescription>
            {ticket.id} — {ticket.title}. The ticket goes back to the same technician and all issues are reopened.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex min-w-0 items-center gap-2">
              <Wrench className="text-primary size-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{technician?.name ?? "No technician assigned"}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {technician ? `${technician.employeeId} · ${technician.email}` : "Assign a technician first"}
                </p>
              </div>
            </div>
          </div>

          {ticket.technicianRemark && (
            <div className="bg-muted/40 rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">
                Technician&apos;s remark ({formatDateTime(ticket.submittedAt ?? ticket.completedAt ?? ticket.createdAt)})
              </p>
              <p className="mt-1 text-sm italic">{ticket.technicianRemark}</p>
            </div>
          )}

          <div>
            <label htmlFor="reissue-note" className="mb-1.5 block text-sm font-medium">
              What is still wrong? <span className="text-muted-foreground font-normal">(sent to the technician)</span>
            </label>
            <Textarea
              id="reissue-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Battery still drains within an hour — please check the adapter again"
            />
          </div>

          <p className="text-muted-foreground text-xs">
            All {ticket.issues.length} issue{ticket.issues.length === 1 ? "" : "s"} will be reopened and the ticket status
            returns to <span className="font-medium">In Progress</span>.
            {ticket.reissueCount ? ` This ticket has been re-issued ${ticket.reissueCount} time(s) already.` : ""}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canReissue}>
            <RotateCcw className="size-4" /> Re-issue to {technician?.name.split(" ")[0] ?? "technician"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
