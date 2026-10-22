"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ListChecks, Plus, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";
import { cn, uid } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RequestPriority, TicketIssue } from "@/types";

const ticketCategories = [
  "IT Support",
  "Maintenance",
  "Inventory",
  "Procurement",
  "Safety",
  "General",
];

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
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

const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const emptyIssue = (): IssueFormValues => ({
  title: "",
  description: "",
  priority: "medium",
  assignedTo: "",
});

interface TicketCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TicketCreateDialog({
  open,
  onOpenChange,
}: TicketCreateDialogProps) {
  const { state, addTicket, subDepartmentsFor, activeDepartment, user } =
    useApp();

  const isScopedUser =
    !!user &&
    user.role !== "super-admin" &&
    ["user", "department-manager", "department-user"].includes(user.role);

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: {
      title: "",
      description: "",
      category: "General",
      department: "",
      subDepartment: "",
      priority: "medium",
    },
  });

  const watchedCategory = form.watch("category");
  const watchedDepartment = form.watch("department");
  const watchedSubDepartment = form.watch("subDepartment");
  const watchedPriority = form.watch("priority");

  const [issues, setIssues] = React.useState<IssueFormValues[]>([emptyIssue()]);
  const [issuesError, setIssuesError] = React.useState<string | null>(null);
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [productSearch, setProductSearch] = React.useState("");

  React.useEffect(() => {
    if (open) {
      form.reset();
      setIssues([emptyIssue()]);
      setIssuesError(null);
      setProductIds([]);
      setProductSearch("");
    }
  }, [open, form]);

  const effectiveDept = isScopedUser ? activeDepartment : watchedDepartment;
  const subOptions =
    effectiveDept && effectiveDept !== "all"
      ? subDepartmentsFor(effectiveDept)
      : [];

  const productOptions = state.inventory ?? [];
  const filteredProducts = productOptions.filter(
    (p) =>
      !productSearch ||
      p.deviceName.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase()),
  );

  const toggleProduct = (id: string) =>
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const updateIssueField = (
    idx: number,
    field: keyof IssueFormValues,
    value: string,
  ) =>
    setIssues((prev) =>
      prev.map((iss, i) => (i === idx ? { ...iss, [field]: value } : iss)),
    );

  const addIssue = () => setIssues((prev) => [...prev, emptyIssue()]);

  const removeIssue = (idx: number) =>
    setIssues((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );

  const onSubmit = (values: SV) => {
    const trimmed = issues.filter((iss) => iss.title.trim().length > 0);

    if (trimmed.length === 0) {
      setIssuesError("Add at least one issue");
      return;
    }

    for (const iss of trimmed) {
      if (!iss.description.trim()) {
        setIssuesError("Every issue needs a description");
        return;
      }
      if (!iss.priority.trim()) {
        setIssuesError("Every issue needs a priority");
        return;
      }
    }

    setIssuesError(null);

    const dept = isScopedUser ? activeDepartment : values.department;
    const now = new Date().toISOString();

    const ticketIssues: TicketIssue[] = trimmed.map((iss) => ({
      id: uid("ISS"),
      title: iss.title,
      description: iss.description,
      priority: iss.priority as RequestPriority,
      status: "open",
      createdAt: now,
      assignedTo: iss.assignedTo || undefined,
      resolution: undefined,
    }));

    const suffix =
      productIds.length > 0
        ? ` (${productIds.length} product${productIds.length === 1 ? "" : "s"})`
        : "";

    addTicket({
      title: `${values.title}${suffix}`,
      description: `${values.description}${
        productIds.length > 0
          ? `\n\nProducts: ${productIds
              .map(
                (id) =>
                  state.inventory.find((inv) => inv.id === id)?.deviceName ??
                  id,
              )
              .join(", ")}`
          : ""
      }`,
      category: values.category || "General",
      department: dept,
      subDepartment:
        (isScopedUser
          ? user?.subDepartment || values.subDepartment
          : values.subDepartment) || undefined,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="text-primary size-5" /> Generate Ticket
          </DialogTitle>
          <DialogDescription>
            Create a new support ticket. A product can have multiple issues — add them all here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Short summary of the product / issue"
              {...form.register("title")}
              className={cn(
                form.formState.errors.title &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              rows={3}
              placeholder="Describe the problem in detail"
              {...form.register("description")}
              className={cn(
                form.formState.errors.description &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="flex items-center gap-1.5 text-sm font-medium">
              <ListChecks className="size-3.5" /> Issues
              <span className="font-normal text-muted-foreground">
                (add multiple)
              </span>
            </legend>

            {issues.map((issue, i) => (
              <div key={i} className="relative space-y-3 rounded-lg border p-4">
                {issues.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    aria-label="Remove issue"
                    onClick={() => removeIssue(i)}
                  >
                    <X className="size-4" />
                  </Button>
                )}

                <Input
                  placeholder={`Issue ${i + 1} — e.g. Screen flickering`}
                  value={issue.title}
                  onChange={(e) => updateIssueField(i, "title", e.target.value)}
                />
                <Textarea
                  rows={2}
                  placeholder="Describe this issue"
                  value={issue.description}
                  onChange={(e) =>
                    updateIssueField(i, "description", e.target.value)
                  }
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Priority
                    </label>
                    <Select
                      value={issue.priority}
                      onValueChange={(v) => updateIssueField(i, "priority", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Technician
                    </label>
                    <Select
                      value={issue.assignedTo || "__none__"}
                      onValueChange={(v) =>
                        updateIssueField(
                          i,
                          "assignedTo",
                          v === "__none__" ? "" : v,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {state.users
                          .filter((u) => u.status === "active")
                          .map((u) => (
                            <SelectItem key={u.id} value={u.name}>
                              {u.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            {issuesError && (
              <p className="text-sm text-destructive">{issuesError}</p>
            )}

            <Button type="button" variant="outline" size="sm" onClick={addIssue}>
              <Plus className="mr-1 size-3.5" /> Add Issue
            </Button>
          </fieldset>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Products
              <span className="font-normal text-muted-foreground">
                (stock-in items)
              </span>
            </label>

            <Input
              placeholder="Search products…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="h-9 text-sm"
            />

            <div className="max-h-44 divide-y overflow-y-auto rounded-md border">
              {filteredProducts.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No products found
                </p>
              ) : (
                filteredProducts.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={productIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="rounded border-input"
                    />
                    {p.deviceName}
                    {p.sku && (
                      <span className="text-muted-foreground">({p.sku})</span>
                    )}
                  </label>
                ))
              )}
            </div>

            {productIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {productIds.length} product
                {productIds.length === 1 ? "" : "s"} selected
              </p>
            )}
          </div>

          {!isScopedUser && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={watchedCategory}
                  onValueChange={(v) => form.setValue("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={watchedDepartment}
                  onValueChange={(v) => {
                    form.setValue("department", v);
                    form.setValue("subDepartment", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {isScopedUser && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs">
              Department:{" "}
              <span className="font-medium">
                {activeDepartment}
                {user?.subDepartment ? ` / ${user.subDepartment}` : ""}
              </span>{" "}
              (auto)
            </p>
          )}

          {subOptions.length > 0 && !isScopedUser && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Sub-department{" "}
                <span className="font-normal text-muted-foreground">
                  (routed destination)
                </span>
              </label>
              <Select
                value={watchedSubDepartment || "__none__"}
                onValueChange={(v) =>
                  form.setValue("subDepartment", v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={`Route to ${effectiveDept} sub-department`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {subOptions.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Ticket Priority</label>
            <Select
              value={watchedPriority}
              onValueChange={(v) => form.setValue("priority", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Ticket className="mr-1.5 size-4" /> Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
