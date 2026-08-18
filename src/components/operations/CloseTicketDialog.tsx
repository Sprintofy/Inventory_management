"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { CircleCheck, Plus, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

const schema = z.object({
  resolution: z.string().min(5, "Describe how the ticket was resolved"),
});
type SV = z.output<typeof schema>;

export function CloseTicketDialog({ open, onOpenChange, ticket }: { open: boolean; onOpenChange: (o: boolean) => void; ticket: Ticket | null }) {
  const { closeTicket, addTicketIssue } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { resolution: "" },
  });
  const [selected, setSelected] = React.useState<string[]>([]);
  const [newIssue, setNewIssue] = React.useState("");

  React.useEffect(() => {
    if (open && ticket) {
      form.reset({ resolution: ticket.resolution ?? "" });
      setSelected(ticket.issues.filter((iss) => !iss.resolved).map((iss) => iss.id));
      setNewIssue("");
    }
  }, [open, form, ticket]);

  if (!ticket) return null;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submitIssue = () => {
    const text = newIssue.trim();
    if (text.length < 3) return;
    const newId = addTicketIssue(ticket.id, text);
    if (newId) setSelected((prev) => [...prev, newId]);
    setNewIssue("");
  };

  const onSubmit = (values: SV) => {
    closeTicket(ticket.id, values.resolution, selected);
    onOpenChange(false);
  };

  const openIssues = ticket.issues.filter((iss) => !iss.resolved);
  const resolvedIssues = ticket.issues.filter((iss) => iss.resolved);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><TicketCheck className="text-success size-5" /> Close Ticket</DialogTitle>
          <DialogDescription>
            {ticket.id} — {ticket.title}. Select which issues are resolved. Unresolved issues stay open if the ticket is reopened.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-semibold">Issues ({openIssues.length} open)</h4>
              {openIssues.length === 0 ? (
                <p className="text-muted-foreground text-sm">No open issues — all already resolved.</p>
              ) : (
                <div className="space-y-2">
                  {openIssues.map((iss) => (
                    <label key={iss.id} className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors", selected.includes(iss.id) ? "border-success/50 bg-success/5" : "hover:bg-muted/50")}>
                      <Checkbox
                        className="mt-0.5"
                        checked={selected.includes(iss.id)}
                        onCheckedChange={() => toggle(iss.id)}
                      />
                      <span className="text-sm font-medium leading-snug">{iss.text}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitIssue()}
                  placeholder="Add another issue before closing…"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={submitIssue} disabled={!newIssue.trim()}>
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
              {resolvedIssues.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold">Previously resolved</h4>
                  <div className="space-y-2">
                    {resolvedIssues.map((iss) => (
                      <div key={iss.id} className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-2.5 opacity-70">
                        <CircleCheck className="text-success mt-0.5 size-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm leading-snug line-through decoration-muted-foreground/50">{iss.text}</p>
                          {iss.resolvedAt && <p className="text-muted-foreground mt-0.5 text-xs">Resolved {new Date(iss.resolvedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <FormField control={form.control} name="resolution" render={({ field }) => (
              <FormItem>
                <FormLabel>Resolution summary</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Describe how the issues were resolved" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Close Ticket</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}