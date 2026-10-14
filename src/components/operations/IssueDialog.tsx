"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import type { Ticket, TicketIssue } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Issue title is required"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
});
type SV = z.output<typeof schema>;

export function IssueDialog({
  open,
  onOpenChange,
  ticket,
  issue,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ticket: Ticket;
  issue: TicketIssue | null;
}) {
  const { state, addTicketIssue, updateIssue } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { title: "", description: "", assignedTo: "", resolution: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: issue?.title ?? "",
        description: issue?.description ?? "",
        assignedTo: issue?.assignedTo ?? "",
        resolution: issue?.resolution ?? "",
      });
    }
  }, [open, form, issue]);

  const onSubmit = (values: SV) => {
    if (issue) {
      updateIssue(ticket.id, issue.id, {
        title: values.title,
        description: values.description || undefined,
        assignedTo: values.assignedTo || undefined,
        resolution: values.resolution || undefined,
      });
    } else {
      addTicketIssue(ticket.id, {
        title: values.title,
        description: values.description || undefined,
        priority: "medium",
        status: "open",
        assignedTo: values.assignedTo || undefined,
        resolution: values.resolution || undefined,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ListChecks className="text-primary size-5" /> {issue ? "Edit Issue" : "Add Issue"}</DialogTitle>
          <DialogDescription>Record a problem on this ticket. Every issue is tracked and resolved independently.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Title</FormLabel>
                <FormControl><Input placeholder="e.g. Power Not Working" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Description</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Describe the problem in detail" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="assignedTo" render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Technician</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Assign technician" /></SelectTrigger>
                    <SelectContent>
                      {state.users.filter((u) => u.status === "active").map((u) => (
                        <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="resolution" render={({ field }) => (
              <FormItem>
                <FormLabel>Resolution / Remarks</FormLabel>
                <FormControl><Textarea rows={2} placeholder="How was this issue resolved?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{issue ? "Save Changes" : <><Plus className="size-4" /> Add Issue</>}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
