"use client";

import * as React from "react";
import { TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

export function CloseTicketDialog({ open, onOpenChange, ticket }: { open: boolean; onOpenChange: (o: boolean) => void; ticket: Ticket | null }) {
  const { closeTicket } = useApp();
  const [notes, setNotes] = React.useState("");
  const [notesError, setNotesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && ticket) {
      setNotes(ticket.resolution ?? "");
      setNotesError(null);
    }
  }, [open, ticket]);
  // eslint-disable-line react-hooks/set-state-in-effect

  if (!ticket) return null;

  const onSubmit = () => {
    if (!ticket) return;
    if (!notes.trim()) {
      setNotesError("Admin notes are required to close the ticket");
      return;
    }
    setNotesError(null);
    closeTicket(
      ticket.id,
      notes.trim(),
      ticket.issues.map((i) => i.id),
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><TicketCheck className="text-success size-5" /> Close Ticket</DialogTitle>
          <DialogDescription>
            {ticket.id} — {ticket.title}. Review the issues below, add your resolution remarks, then close the ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {ticket.issues.length === 0 ? (
            <div className="border-muted rounded-lg border border-dashed p-6 text-center">
              <p className="text-muted-foreground text-sm">No issues on this ticket.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ticket.issues.map((issue, index) => (
                <div key={issue.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold">
                      ISSUE {index + 1}
                    </span>
                    <p className="text-sm font-semibold">{issue.title}</p>
                    <StatusBadge status={issue.status} />
                  </div>
                  {issue.description && (
                    <p className="text-muted-foreground mt-1.5 text-xs">{issue.description}</p>
                  )}
                  <div className="mt-2 rounded-lg border-l-2 border-success/50 bg-success/5 p-3">
                    <p className="text-[11px] font-semibold tracking-wide text-success uppercase">Resolution</p>
                    <p className="text-muted-foreground mt-1 text-xs italic">
                      {issue.resolution?.trim() || "— No resolution recorded —"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-muted/30 p-4">
            <label className="mb-1.5 block text-sm font-medium">Resolution Remarks <span className="text-destructive">*</span></label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); if (notesError) setNotesError(null); }}
              placeholder="Add your resolution remarks for this ticket"
              className={cn(notesError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")}
            />
            {notesError && <p className="text-destructive mt-1 text-sm">{notesError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={onSubmit}><TicketCheck className="size-4" /> Close Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
