"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ListChecks, Plus, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { uid } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
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

interface IssueFormValues {
  title: string;
  description: string;
  priority: string;
  assignedTo: string;
}

export default function TicketCreatePage() {
  const { state, addTicket, subDepartmentsFor, activeDepartment, user } = useApp();
  const isScopedUser = user && user.role !== "super-admin" && (user.role === "user" || user.role === "department-manager" || user.role === "department-user");
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { title: "", description: "", category: "General", department: "", subDepartment: "", priority: "medium" },
  });
  const [issues, setIssues] = React.useState<IssueFormValues[]>([{ title: "", description: "", priority: "medium", assignedTo: "" }]);
  const [issuesError, setIssuesError] = React.useState<string | null>(null);
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [productSearch, setProductSearch] = React.useState("");

  const selectedDepartment = form.watch("department");
  const effectiveDept = isScopedUser ? activeDepartment : selectedDepartment;
  const subOptions = effectiveDept && effectiveDept !== "all" ? subDepartmentsFor(effectiveDept) : [];

  React.useEffect(() => {
    setIssues([{ title: "", description: "", priority: "medium", assignedTo: "" }]);
    setIssuesError(null);
    setProductIds([]);
  }, []);

  const validateIssue = (issue: IssueFormValues) => {
    if (!issue.title.trim()) return "Issue title is required";
    if (!issue.description.trim()) return "Issue description is required";
    if (!issue.priority.trim()) return "Priority is required";
    return null;
  };

  const updateIssueField = (index: number, field: keyof IssueFormValues, value: string) => {
    setIssues((prev) => prev.map((iss, idx) => (idx === index ? { ...iss, [field]: value } : iss)));
  };

  const addIssue = () => {
    setIssues([...issues, { title: "", description: "", priority: "medium", assignedTo: "" }]);
  };

  const removeIssue = (index: number) => {
    if (issues.length > 1) {
      setIssues(issues.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (values: SV) => {
    const trimmed = issues.filter((issue) => issue.title.trim().length > 0);
    if (trimmed.length === 0) {
      setIssuesError("Add at least one issue");
      return;
    }

    for (const issue of trimmed) {
      const error = validateIssue(issue);
      if (error) {
        setIssuesError(error);
        return;
      }
    }

    const dept = isScopedUser ? activeDepartment : values.department;
    const now = new Date().toISOString();
    const ticketIssues: TicketIssue[] = trimmed.map((issue) => ({
      id: uid("ISS"),
      title: issue.title,
      description: issue.description,
      priority: issue.priority as RequestPriority,
      status: "open",
      createdAt: now,
      assignedTo: issue.assignedTo || undefined,
      resolution: undefined,
    }));

    const productSuffix = productIds.length > 0 ? ` (${productIds.length} product${productIds.length === 1 ? "" : "s"})` : "";
    addTicket({
      title: `${values.title}${productSuffix}`,
      description: `${values.description}${productIds.length > 0 ? `\n\nProducts: ${productIds.map((id) => state.inventory.find((i) => i.id === id)?.deviceName ?? id).join(", ")}` : ""}`,
      category: values.category || "General",
      department: dept,
      subDepartment: (isScopedUser ? (user?.subDepartment || values.subDepartment) : values.subDepartment) || undefined,
      priority: values.priority as RequestPriority,
      issues: ticketIssues,
      itemIds: productIds,
      assets: [],
      customer: undefined,
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            <Input placeholder="Short summary of the product / issue" {...form.register("title", { required: "Title is required", minLength: 3 })} className={cn(form.getFieldState("title")?.isTouched && form.getFieldState("title")?.invalid && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")} />
            {form.getFieldState("title")?.isTouched && form.getFieldState("title")?.error && (
              <p className="text-destructive text-sm">{form.getFieldState("title")?.error?.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <Textarea rows={2} placeholder="Describe the problem in detail" {...form.register("description", { minLength: 10, message: "Describe the issue in at least 10 characters" })} className={cn(form.getFieldState("description")?.isTouched && form.getFieldState("description")?.invalid && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")} />
            {form.getFieldState("description")?.isTouched && form.getFieldState("description")?.error && (
              <p className="text-destructive text-sm">{form.getFieldState("description")?.error?.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><ListChecks className="size-3.5" /> Issues <span className="text-muted-foreground font-normal">(add multiple issues)</span></label>
            <div className="space-y-2">
              {issues.map((issue, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <Input placeholder={`Issue ${i + 1} — e.g. Screen flickering`} value={issue.title} onChange={(e) => updateIssueField(i, "title", e.target.value)} className={cn(issuesError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")} />
                    <Textarea rows={2} placeholder="Describe the problem in detail" value={issue.description} onChange={(e) => updateIssueField(i, "description", e.target.value)} className={cn(issuesError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Priority</label>
                      <Select value={issue.priority} onValueChange={(v) => updateIssueField(i, "priority", v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select priority" /></SelectTrigger>
                        <SelectContent>{(["low", "medium", "high", "critical"] as const).map((p) => (<SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Assigned Technician</label>
                      <Select value={issue.assignedTo || ""} onValueChange={(v) => updateIssueField(i, "assignedTo", v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Assign technician (optional)" /></SelectTrigger>
                        <SelectContent>{state.users.filter((u) => u.status === "active").map((u) => (<SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" className="mt-0.5" aria-label="Remove issue" onClick={() => removeIssue(index)}><X className="size-4" /></Button>
                  </div>
                ))}
                {issuesError && <p className="text-destructive text-sm">{issuesError}</p>}
                <Button type="button" variant="outline" size="sm" onClick={addIssue}>
                  <Plus className="size-3.5" /> Add Issue
                </Button>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Products (multiple select, stock-in items only)</label>
                <Select multiple onValueChange={(value: string | string[]) => setProductIds(Array.isArray(value) ? value : [value])} placeholder="Select products">
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select products" /></SelectTrigger>
                  <SelectContent>
                    <Input placeholder="Search products…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="h-8 text-xs mb-2 w-full" />
                    {productOptions.length === 0 ? <SelectItem value="" disabled>No products in scope</SelectItem> : productOptions.filter((p) => !productSearch || p.deviceName.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())).map((p) => (<SelectItem key={p.id} value={p.id}>{p.deviceName} ({p.sku})</SelectItem>))}
                  </SelectContent>
                </Select>
                {productIds.length > 0 && (
                  <p className="text-muted-foreground text-[11px]">{productIds.length} product{productIds.length === 1 ? "" : "s"} selected</p>
                )}
              </div>
              {!isScopedUser && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <Select value={values.category} onValueChange={(v) => form.setValue("category", v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{ticketCategories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <Select value={values.department} onValueChange={(v) => { form.setValue("department", v); form.setValue("subDepartment", ""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>{state.departments.map((d) => (<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {isScopedUser && (
                <p className="bg-muted rounded-md px-3 py-2 text-xs">Department: <span className="font-medium">{activeDepartment}{user?.subDepartment ? ` / ${user.subDepartment}` : ""}</span> (auto)</p>
              )}
              {subOptions.length > 0 && !isScopedUser && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Sub-department <span className="text-muted-foreground font-normal">(routed destination)</span></label>
                  <Select value={form.getValue("subDepartment")} onValueChange={(v) => form.setValue("subDepartment", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder={`Route to ${effectiveDept} sub-department`} /></SelectTrigger>
                    <SelectContent>{subOptions.map((s) => (<SelectItem key={s.id} value={s.name}>{s.name} ({s.code})</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <Select value={values.priority} onValueChange={(v) => form.setValue("priority", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["low", "medium", "high", "critical"] as const).map((p) => (<SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      );
  );
}
