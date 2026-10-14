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
  technicianId: z.string().optional(),
});
type SV = z.output<typeof schema>;

export function TicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, addTicket, subDepartmentsFor, activeDepartment, user } = useApp();
  const isScopedUser = user && user.role !== "super-admin" && (user.role === "user" || user.role === "department-manager" || user.role === "department-user");
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { title: "", description: "", category: "General", department: "", subDepartment: "", priority: "medium" },
  });
  const [issues, setIssues] = React.useState<string[]>([""]);
  const [issuesError, setIssuesError] = React.useState<string | null>(null);
  const [productIds, setProductIds] = React.useState<string[]>([]);

  const selectedDepartment = form.watch("department");
  const effectiveDept = isScopedUser ? activeDepartment : selectedDepartment;
  const subOptions = effectiveDept && effectiveDept !== "all" ? subDepartmentsFor(effectiveDept) : [];

  React.useEffect(() => {
    if (open) {
      form.reset({ title: "", description: "", category: "General", department: isScopedUser ? activeDepartment : "", subDepartment: user?.subDepartment ?? "", priority: "medium", technicianId: "" });
      setIssues([""]);
      setIssuesError(null);
      setProductIds([]);
    }
  }, [open, form, isScopedUser, activeDepartment, user?.subDepartment]);

  const updateIssue = (i: number, value: string) => {
    setIssues((prev) => prev.map((v, idx) => (idx === i ? value : v)));
    if (issuesError) setIssuesError(null);
  };

  const toggleProduct = (id: string) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const productOptions = React.useMemo(() => {
    const scope = isScopedUser ? activeDepartment : (selectedDepartment || "all");
    return state.inventory.filter((i) => (scope === "all" || i.department === scope)).slice(0, 100);
  }, [state.inventory, isScopedUser, activeDepartment, selectedDepartment]);

  const onSubmit = (values: SV) => {
    const trimmed = issues.map((t) => t.trim()).filter((t) => t.length > 0);
    if (trimmed.length === 0) {
      setIssuesError("Add at least one issue");
      return;
    }
    const dept = isScopedUser ? activeDepartment : values.department;
    const now = new Date().toISOString();
    const ticketIssues: TicketIssue[] = trimmed.map((text) => ({ id: uid("ISS"), title: text, priority: values.priority as RequestPriority, status: "open", createdAt: now }));
    const productSuffix = productIds.length > 0 ? ` (${productIds.length} product${productIds.length === 1 ? "" : "s"})` : "";
    addTicket({
      title: `${values.title}${productSuffix}`,
      description: `${values.description}${productIds.length > 0 ? `\n\nProducts: ${productIds.map((id) => state.inventory.find((i) => i.id === id)?.deviceName ?? id).join(", ")}` : ""}`,
      category: values.category || "General",
      department: dept,
      subDepartment: (isScopedUser ? (user?.subDepartment || values.subDepartment) : values.subDepartment) || undefined,
      priority: values.priority as RequestPriority,
      issues: ticketIssues,
      assets: [],
      customer: undefined,
      technicianId: values.technicianId || undefined,
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
            <FormItem>
              <FormLabel>Products (multiple select)</FormLabel>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">
                {productOptions.length === 0 && <p className="text-muted-foreground text-xs">No products in scope.</p>}
                {productOptions.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-accent">
                    <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="size-3.5 accent-primary" />
                    <span className="flex-1 truncate font-medium">{p.deviceName}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{p.sku}</span>
                  </label>
                ))}
              </div>
              {productIds.length > 0 && <p className="text-muted-foreground text-[11px]">{productIds.length} product{productIds.length === 1 ? "" : "s"} selected</p>}
            </FormItem>
            {!isScopedUser && (
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
            )}
            {isScopedUser && (
              <p className="bg-muted rounded-md px-3 py-2 text-xs">Department: <span className="font-medium">{activeDepartment}{user?.subDepartment ? ` / ${user.subDepartment}` : ""}</span> (auto)</p>
            )}
            {subOptions.length > 0 && !isScopedUser && (
              <FormField control={form.control} name="subDepartment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-department <span className="text-muted-foreground font-normal">(routed destination)</span></FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={`Route to ${effectiveDept} sub-department`} /></SelectTrigger>
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
            <FormField control={form.control} name="technicianId" render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Technician</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select technician (optional)" /></SelectTrigger>
                    <SelectContent>
                      {state.technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id} className="capitalize">
                          {tech.name} ({tech.employeeId}) - {tech.specialization}
                        </SelectItem>
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