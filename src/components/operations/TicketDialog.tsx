"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ListChecks, Plus, Ticket, X } from "lucide-react";
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
import { cn, uid } from "@/lib/utils"; // ← FIX #1: added cn
import Link from "next/link";
import type { RequestPriority, TicketIssue } from "@/types";

/* ------------------------------------------------------------------ */
/*  Constants & Schema                                                 */
/* ------------------------------------------------------------------ */

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
  description: z
    .string()
    .min(10, "Describe the issue in at least 10 characters"),
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

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function NewTicketPage() {
  const { state, addTicket, subDepartmentsFor, activeDepartment, user } =
    useApp();

  const isScopedUser =
    !!user &&
    user.role !== "super-admin" &&
    ["user", "department-manager", "department-user"].includes(user.role);

  /* ---------- form ---------- */

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

  // FIX #3: watch values so they're available in JSX
  const watchedCategory = form.watch("category");
  const watchedDepartment = form.watch("department");
  const watchedSubDepartment = form.watch("subDepartment");
  const watchedPriority = form.watch("priority");

  /* ---------- local state ---------- */

  const [issues, setIssues] = React.useState<IssueFormValues[]>([emptyIssue()]);
  const [issuesError, setIssuesError] = React.useState<string | null>(null);
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [productSearch, setProductSearch] = React.useState("");

  /* ---------- derived ---------- */

  const effectiveDept = isScopedUser ? activeDepartment : watchedDepartment;
  const subOptions =
    effectiveDept && effectiveDept !== "all"
      ? subDepartmentsFor(effectiveDept)
      : [];

  // FIX #2: derive productOptions from inventory
  const productOptions = state.inventory ?? [];
  const filteredProducts = productOptions.filter(
    (p) =>
      !productSearch ||
      p.deviceName.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase()),
  );

  /* ---------- helpers ---------- */

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

  // FIX #4: parameter is `idx`, not `index`
  const removeIssue = (idx: number) =>
    setIssues((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );

  /* ---------- submit ---------- */

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

    // Navigate back to the tickets list
    window.history.back();
  };

  /* ---------------------------------------------------------------- */
  /*  RENDER — full page, no dialog                                    */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/tickets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Tickets
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Ticket className="size-6 text-primary" /> Generate Ticket
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new support ticket. A product can have multiple issues — add
          them all here.
        </p>
      </div>

      {/* FIX #5: <form> properly wraps everything */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* ---- Title ---- */}
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

        {/* ---- Description ---- */}
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

        {/* ---- Issues ---- */}
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

        {/* ---- Products (multi-select via checkboxes) ---- */}
        {/* FIX #6: replaced broken <Select multiple> with checkboxes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Products{" "}
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

        {/* ---- Category & Department (admin only) ---- */}
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

        {/* ---- Sub-department ---- */}
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

        {/* ---- Ticket Priority ---- */}
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

        {/* ---- Actions ---- */}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit">
            <Ticket className="mr-1.5 size-4" /> Create Ticket
          </Button>
          <Link href="/tickets">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
