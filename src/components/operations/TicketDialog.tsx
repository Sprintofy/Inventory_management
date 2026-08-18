"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ListChecks, Plus, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { uid } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RequestPriority, TicketIssue } from "@/types";

const ticketCategories = ["IT Support", "Maintenance", "Inventory", "Procurement", "Safety", "General"];

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Describe the issue in at least 10 characters"),
  category: z.string().min(1, "Select a category"),
  department: z.string().min(1, "Select a department"),
  subDepartment: z.string().optional(),
  priority: z.string().min(1, "Select priority"),
});
type SV = z.output<typeof schema>;

export function TicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, addTicket, subDepartmentsFor } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { title: "", description: "", category: "", department: "", subDepartment: "", priority: "medium" },
  });
  const [issues, setIssues] = React.useState<string[]>([""]);
  const [issuesError, setIssuesError] = React.useState<string | null>(null);

  const selectedDepartment = form.watch("department");
  const subOptions = selectedDepartment ? subDepartmentsFor(selectedDepartment) : [];

  React.useEffect(() => {
    if (open) {
      form.reset({ title: "", description: "", category: "", department: "", subDepartment: "", priority: "medium" });
      setIssues([""]);
      setIssuesError(null);
    }
  }, [open, form]);

  const updateIssue = (i: number, value: string) => {
    setIssues((prev) => prev.map((v, idx) => (idx === i ? value : v)));
    if (issuesError) setIssuesError(null);
  };

  const onSubmit = (values: SV) => {
    const trimmed = issues.map((t) => t.trim()).filter((t) => t.length > 0);
    if (trimmed.length === 0) {
      setIssuesError("Add at least one issue");
      return;
    }
    const ticketIssues: TicketIssue[] = trimmed.map((text) => ({ id: uid("ISS"), text, resolved: false }));
    addTicket({
      title: values.title,
      description: values.description,
      category: values.category,
      department: values.department,
      subDepartment: values.subDepartment || undefined,
      priority: values.priority as RequestPriority,
      issues: ticketIssues,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Ticket className="text-primary size-5" /> Generate Ticket</DialogTitle>
          <DialogDescription>Create a new support ticket. A product can have multiple issues — add them all here. Only admins can generate and close tickets.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="Short summary of the product / issue" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Describe the problem in detail" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormItem>
              <FormLabel className="flex items-center gap-1.5"><ListChecks className="size-3.5" /> Issues <span className="text-muted-foreground font-normal">(select which are resolved when closing)</span></FormLabel>
              <div className="space-y-2">
                {issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Input
                      value={issue}
                      onChange={(e) => updateIssue(i, e.target.value)}
                      placeholder={`Issue ${i + 1} — e.g. Screen flickering`}
                      className={cn(issuesError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")}
                    />
                    <Button type="button" variant="ghost" size="icon-sm" className="mt-0.5" aria-label="Remove issue" onClick={() => setIssues((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {issuesError && <p className="text-destructive text-sm">{issuesError}</p>}
              <Button type="button" variant="outline" size="sm" onClick={() => setIssues((prev) => [...prev, ""])}>
                <Plus className="size-3.5" /> Add Issue
              </Button>
            </FormItem>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {ticketCategories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("subDepartment", ""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {state.departments.map((d) => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            {subOptions.length > 0 && (
              <FormField control={form.control} name="subDepartment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-department <span className="text-muted-foreground font-normal">(routed destination)</span></FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={`Route to ${selectedDepartment} sub-department`} /></SelectTrigger>
                      <SelectContent>
                        {subOptions.map((s) => (
                          <SelectItem key={s.id} value={s.name}>{s.name} ({s.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["low", "medium", "high", "critical"] as const).map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Generate Ticket</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}