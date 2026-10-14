"use client";

import * as React from "react";
import { Plus, TicketCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import type { IssueStatus, Ticket } from "@/types";

interface IssueRow {
  key: string;
  issueId?: string;
  title: string;
  description: string;
  resolution: string;
  status: IssueStatus;
  assetId?: string;
  errors?: { title?: string; resolution?: string };
}

const issueStatuses: IssueStatus[] = ["open", "in-progress", "resolved", "closed"];

export function CloseTicketDialog({ open, onOpenChange, ticket }: { open: boolean; onOpenChange: (o: boolean) => void; ticket: Ticket | null }) {
  const { closeTicket, updateIssue, addTicketIssue } = useApp();
  const [rows, setRows] = React.useState<IssueRow[]>([]);
  const [summary, setSummary] = React.useState("");
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  const keyCounter = React.useRef(0);

  React.useEffect(() => {
    if (open && ticket) {
      keyCounter.current = 0;
      setRows(
        ticket.issues.slice(0, 1).map((iss) => ({
          key: `existing-${iss.id}`,
          issueId: iss.id,
          title: iss.title,
          description: iss.description ?? "",
          resolution: iss.resolution ?? "",
          status: iss.status,
          assetId: iss.assetId,
        }))
      );
      setSummary(ticket.resolution ?? "");
      setSummaryError(null);
    }
  }, [open, ticket]);
  // eslint-disable-line react-hooks/set-state-in-effect

  if (!ticket) return null;

  const addRow = () => {
    keyCounter.current += 1;
    setRows((prev) => [...prev, { key: `new-${keyCounter.current}`, title: "", description: "", resolution: "", status: "open" }]);
  };

  const updateRow = (key: string, patch: Partial<IssueRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, errors: undefined } : r)));
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const validate = () => {
    let valid = true;
    const next = rows.map((r) => {
      const errors: { title?: string; resolution?: string } = {};
      if (!r.title.trim()) {
        errors.title = "Issue title is required";
        valid = false;
      }
      if ((r.status === "resolved" || r.status === "closed") && !r.resolution.trim()) {
        errors.resolution = "Resolution is required for this status";
        valid = false;
      }
      return { ...r, errors };
    });
    setRows(next);
    if (!summary.trim()) {
      setSummaryError("Closing summary is required");
      valid = false;
    } else {
      setSummaryError(null);
    }
    return valid;
  };

  const onSubmit = () => {
    if (!ticket) return;
    if (!validate()) return;
    for (const r of rows) {
      const patch = {
        title: r.title.trim(),
        description: r.description.trim() || undefined,
        resolution: r.resolution.trim() || undefined,
        status: r.status,
        assetId: r.assetId || undefined,
      };
      if (r.issueId) {
        updateIssue(ticket.id, r.issueId, patch);
      } else {
        addTicketIssue(ticket.id, { ...patch, priority: "medium" });
      }
    }
    closeTicket(ticket.id, summary.trim(), []);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><TicketCheck className="text-success size-5" /> Close Ticket</DialogTitle>
          <DialogDescription>
            {ticket.id} — {ticket.title}. Every issue has its own title, description, resolution and status. Add as many issues as needed — the ticket is only closed after all issue details are saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {rows.length === 0 && (
            <div className="border-muted rounded-lg border border-dashed p-6 text-center">
              <p className="text-muted-foreground text-sm">No issues on this ticket yet. Add one below.</p>
            </div>
          )}

          {rows.map((row, index) => (
            <div key={row.key} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Issue {index + 1}</h4>
                {!row.issueId && (
                  <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => removeRow(row.key)} aria-label="Remove issue">
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Issue Title / Problem Title</label>
                  <Input
                    value={row.title}
                    onChange={(e) => updateRow(row.key, { title: e.target.value })}
                    placeholder="e.g. Power Not Working"
                    className={cn(row.errors?.title && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")}
                  />
                  {row.errors?.title && <p className="text-destructive mt-1 text-sm">{row.errors.title}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Issue Description</label>
                  <Textarea rows={2} value={row.description} onChange={(e) => updateRow(row.key, { description: e.target.value })} placeholder="Describe the problem in detail" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Resolution / Closing Remarks</label>
                    <Textarea
                      rows={2}
                      value={row.resolution}
                      onChange={(e) => updateRow(row.key, { resolution: e.target.value })}
                      placeholder="How was this issue resolved?"
                      className={cn(row.errors?.resolution && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")}
                    />
                    {row.errors?.resolution && <p className="text-destructive mt-1 text-sm">{row.errors.resolution}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Issue Status</label>
                    <Select value={row.status} onValueChange={(v) => updateRow(row.key, { status: v as IssueStatus })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {issueStatuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace("-", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Linked Asset <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Select
                    value={row.assetId ?? ""}
                    onValueChange={(v) => updateRow(row.key, { assetId: v || undefined })}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Link to an asset on this ticket" /></SelectTrigger>
                    <SelectContent>
                      {ticket.assets.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.assetId} — {a.itemType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="size-4" /> Add Issue
          </Button>

          <div className="rounded-xl border bg-muted/30 p-4">
            <label className="mb-1.5 block text-sm font-medium">Closing Summary <span className="text-muted-foreground font-normal">(ticket-level remarks)</span></label>
            <Textarea
              rows={2}
              value={summary}
              onChange={(e) => { setSummary(e.target.value); if (summaryError) setSummaryError(null); }}
              placeholder="Short summary of how the ticket was closed"
              className={cn(summaryError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")}
            />
            {summaryError && <p className="text-destructive mt-1 text-sm">{summaryError}</p>}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={onSubmit}><TicketCheck className="size-4" /> Save Issues &amp; Close Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}