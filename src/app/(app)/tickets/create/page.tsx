"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ListChecks, Plus, Ticket, X, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { uid, cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import type { RequestPriority, SubDepartment, TicketIssue } from "@/types";

const ticketCategories = [
  "IT Support",
  "Maintenance",
  "Inventory",
  "Procurement",
  "Safety",
  "General",
];

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z
    .string()
    .min(10, "Describe the issue in at least 10 characters"),
  category: z.string().min(1, "Select a category"),
  department: z.string().min(1, "Select a department"),
  subDepartment: z.string().optional(),
  subDepartment2: z.string().optional(),
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
  const router = useRouter();
  const { state, addTicket, subDepartmentsFor, activeDepartment, user } =
    useApp();

  const isScopedUser =
    user &&
    user.role !== "super-admin" &&
    (user.role === "user" ||
      user.role === "department-manager" ||
      user.role === "department-user");

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: {
      title: "",
      description: "",
      category: "General",
      department: "",
      subDepartment: "",
      subDepartment2: "",
      priority: "medium",
    },
  });

  const watchedCategory = form.watch("category");
  const watchedDepartment = form.watch("department");
  const watchedSubDepartment = form.watch("subDepartment");
  const watchedSubDepartment2 = form.watch("subDepartment2");
  const watchedPriority = form.watch("priority");

  const values = form.watch();

  const [issues, setIssues] = React.useState<IssueFormValues[]>([
    { title: "", description: "", priority: "medium", assignedTo: "" },
  ]);
  const [issuesError, setIssuesError] = React.useState<string | null>(null);
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [productSearch, setProductSearch] = React.useState("");

  const selectedDepartment = form.watch("department");
  const effectiveDept = isScopedUser ? activeDepartment : selectedDepartment;

  // Level 1 sub-departments of the selected department
  const level1Options =
    effectiveDept && effectiveDept !== "all"
      ? subDepartmentsFor(effectiveDept)
      : [];

  // Level 2 sub-departments (children) of the selected level-1 sub-department
  const level2Options: SubDepartment[] =
    watchedSubDepartment
      ? level1Options.find((s) => s.name === watchedSubDepartment)?.children ??
        []
      : [];

  // Products in scope (stock-in items only)
  const productOptions = React.useMemo(() => {
    return state.inventory.filter((item) => {
      const inStock = (item.quantity ?? 0) > 0;
      if (!inStock) return false;
      if (isScopedUser && activeDepartment && activeDepartment !== "all") {
        return item.department === activeDepartment;
      }
      return true;
    });
  }, [state.inventory, isScopedUser, activeDepartment]);

  const validateIssue = (issue: IssueFormValues) => {
    if (!issue.title.trim()) return "Issue title is required";
    if (!issue.description.trim()) return "Issue description is required";
    if (!issue.priority.trim()) return "Priority is required";
    return null;
  };

  const updateIssueField = (
    index: number,
    field: keyof IssueFormValues,
    value: string,
  ) => {
    setIssues((prev) =>
      prev.map((iss, idx) =>
        idx === index ? { ...iss, [field]: value } : iss,
      ),
    );
  };

  const addIssue = () => {
    setIssues([
      ...issues,
      { title: "", description: "", priority: "medium", assignedTo: "" },
    ]);
  };

  const removeIssue = (index: number) => {
    if (issues.length > 1) {
      setIssues(issues.filter((_, i) => i !== index));
    }
  };

  const toggleProduct = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
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

    setIssuesError(null);

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

    const productSuffix =
      productIds.length > 0
        ? ` (${productIds.length} product${productIds.length === 1 ? "" : "s"})`
        : "";

    // The last selected sub-department becomes the actual department.
    // Priority: level 2 > level 1 > parent department.
    const finalDepartment =
      values.subDepartment2 ||
      values.subDepartment ||
      values.department ||
      "";

    addTicket({
      title: `${values.title}${productSuffix}`,
      description: `${values.description}${
        productIds.length > 0
          ? `\n\nProducts: ${productIds
              .map(
                (id) =>
                  state.inventory.find((i) => i.id === id)?.deviceName ?? id,
              )
              .join(", ")}`
          : ""
      }`,
      category: values.category || "General",
      department: isScopedUser ? activeDepartment : finalDepartment,
      subDepartment: undefined,
      priority: values.priority as RequestPriority,
      issues: ticketIssues,
      itemIds: productIds,
      assets: [],
      customer: undefined,
    });

    router.push("/tickets");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets">
            <ArrowLeft className="size-4 mr-1" /> Back to Tickets
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Generate Ticket"
        description="Create a new support ticket. A product can have multiple issues — add them all here. Only admins can generate and close tickets."
      />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 bg-card border rounded-lg p-6"
      >
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Title
          </label>
          <Input
            placeholder="Short summary of the product / issue"
            {...form.register("title")}
            className={cn(
              form.getFieldState("title")?.invalid &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            )}
          />
          {form.formState.errors.title && (
            <p className="text-destructive text-sm">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Description
          </label>
          <Textarea
            rows={3}
            placeholder="Describe the problem in detail"
            {...form.register("description")}
            className={cn(
              form.getFieldState("description")?.invalid &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            )}
          />
          {form.formState.errors.description && (
            <p className="text-destructive text-sm">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {/* Issues */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <ListChecks className="size-3.5" /> Issues{" "}
            <span className="text-muted-foreground font-normal">
              (add multiple issues)
            </span>
          </label>
          <div className="space-y-3">
            {issues.map((issue, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 p-4 border rounded-lg bg-background"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Issue {i + 1}
                  </span>
                  {issues.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Remove issue"
                      onClick={() => removeIssue(i)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>

                <Input
                  placeholder={`Issue ${i + 1} — e.g. Screen flickering`}
                  value={issue.title}
                  onChange={(e) => updateIssueField(i, "title", e.target.value)}
                />
                <Textarea
                  rows={2}
                  placeholder="Describe the problem in detail"
                  value={issue.description}
                  onChange={(e) =>
                    updateIssueField(i, "description", e.target.value)
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Priority
                    </label>
                    <Select
                      value={issue.priority}
                      onValueChange={(v) => updateIssueField(i, "priority", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {(["low", "medium", "high", "critical"] as const).map(
                          (p) => (
                            <SelectItem
                              key={p}
                              value={p}
                              className="capitalize"
                            >
                              {p}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Assigned Technician
                    </label>
                    <Select
                      value={issue.assignedTo || ""}
                      onValueChange={(v) =>
                        updateIssueField(i, "assignedTo", v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assign technician (optional)" />
                      </SelectTrigger>
                      <SelectContent>
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
              <p className="text-destructive text-sm">{issuesError}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIssue}
            >
              <Plus className="size-3.5 mr-1" /> Add Issue
            </Button>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Products{" "}
            <span className="text-muted-foreground font-normal">
              (multiple select, stock-in items only)
            </span>
          </label>
          <Input
            placeholder="Search products…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="h-9 text-sm"
          />
          <div className="border rounded-md max-h-56 overflow-y-auto">
            {productOptions.length === 0 ? (
              <p className="text-muted-foreground text-sm p-3">
                No products in scope
              </p>
            ) : (
              productOptions
                .filter(
                  (p) =>
                    !productSearch ||
                    p.deviceName
                      .toLowerCase()
                      .includes(productSearch.toLowerCase()) ||
                    (p.sku || "")
                      .toLowerCase()
                      .includes(productSearch.toLowerCase()),
                )
                .map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={productIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="size-4"
                    />
                    <span>
                      {p.deviceName}{" "}
                      <span className="text-muted-foreground text-xs">
                        ({p.sku})
                      </span>
                    </span>
                  </label>
                ))
            )}
          </div>
          {productIds.length > 0 && (
            <p className="text-muted-foreground text-[11px]">
              {productIds.length} product{productIds.length === 1 ? "" : "s"}{" "}
              selected
            </p>
          )}
        </div>

        {/* Department / Category */}
        {!isScopedUser ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Category
              </label>
              <Select
                value={watchedCategory}
                onValueChange={(v) => form.setValue("category", v)}
              >
                <SelectTrigger className="w-full">
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
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Department
              </label>
              <Select
                value={watchedDepartment}
                onValueChange={(v) => {
                  form.setValue("department", v);
                  form.setValue("subDepartment", "");
                  form.setValue("subDepartment2", "");
                }}
              >
                <SelectTrigger className="w-full">
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
              {form.formState.errors.department && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.department.message}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="bg-muted rounded-md px-3 py-2 text-xs">
            Department:{" "}
            <span className="font-medium">
              {activeDepartment}
              {user?.subDepartment ? ` / ${user.subDepartment}` : ""}
            </span>{" "}
            (auto)
          </p>
        )}

        {/* Level 1 Sub-department */}
        {level1Options.length > 0 && !isScopedUser && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Sub-department
              <span className="text-muted-foreground font-normal">
                (level 1)
              </span>
            </label>
            <Select
              value={watchedSubDepartment || ""}
              onValueChange={(v) => {
                form.setValue("subDepartment", v || undefined);
                form.setValue("subDepartment2", "");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sub-department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {level1Options.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Level 2 Sub-department (children of level 1) */}
        {level2Options.length > 0 && !isScopedUser && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Sub-department
              <span className="text-muted-foreground font-normal">
                (level 2)
              </span>
            </label>
            <Select
              value={watchedSubDepartment2 || ""}
              onValueChange={(v) => form.setValue("subDepartment2", v || undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sub-sub-department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {level2Options.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Priority */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Priority
          </label>
          <Select
            value={watchedPriority}
            onValueChange={(v) => form.setValue("priority", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["low", "medium", "high", "critical"] as const).map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" asChild>
            <Link href="/tickets">Cancel</Link>
          </Button>
          <Button type="submit">
            <Ticket className="size-4 mr-1" /> Generate Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}
