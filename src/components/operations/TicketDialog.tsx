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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useApp } from "@/store/app-store";
import { uid } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .min(10, "Describe the issue in at least 10 characters"),
  category: z.string().min(1, "Select a category"),
  department: z.string().min(1, "Select a department"),
  subDepartment: z.string().optional(),
  subDepartment2: z.string().optional(),
  priority: z.string().min(1, "Select priority"),
  productId: z.string().optional(),
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
      subDepartment2: "",
      priority: "medium",
      productId: "",
    },
  });

  const watchedCategory = form.watch("category");
  const watchedDepartment = form.watch("department");
  const watchedSubDepartment = form.watch("subDepartment");
  const watchedSubDepartment2 = form.watch("subDepartment2");
  const watchedPriority = form.watch("priority");

  const [issues, setIssues] = React.useState<IssueFormValues[]>([emptyIssue()]);
  const [issuesError, setIssuesError] = React.useState<string | null>(null);
  const [productSearch, setProductSearch] = React.useState("");

  React.useEffect(() => {
    if (open) {
      form.reset();
      setIssues([emptyIssue()]);
      setIssuesError(null);
      setProductSearch("");
    }
  }, [open, form]);

  const effectiveDept = isScopedUser ? activeDepartment : watchedDepartment;

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

  const productOptions = state.inventory ?? [];
  const filteredProducts = productOptions.filter(
    (p) =>
      !productSearch ||
      p.deviceName.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase()),
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

    const now = new Date().toISOString();

    const selectedProduct = values.productId
      ? state.inventory.find((inv) => inv.id === values.productId)
      : undefined;

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

    const itemIds = values.productId ? [values.productId] : [];

    const suffix = selectedProduct ? ` (${selectedProduct.deviceName})` : "";

    // The last selected sub-department becomes the actual department.
    // Priority: level 2 > level 1 > parent department.
    const finalDepartment =
      values.subDepartment2 ||
      values.subDepartment ||
      values.department ||
      "";

    addTicket({
      title: `${values.title}${suffix}`,
      description: `${values.description}${
        selectedProduct
          ? `\n\nProduct: ${selectedProduct.deviceName}${
              selectedProduct.sku ? ` (${selectedProduct.sku})` : ""
            }`
          : ""
      }`,
      category: values.category || "General",
      department: isScopedUser ? activeDepartment : finalDepartment,
      subDepartment: undefined,
      priority: values.priority as RequestPriority,
      issues: ticketIssues,
      itemIds,
      assets: [],
      customer: undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="text-primary size-5" /> Generate Ticket
          </DialogTitle>
          <DialogDescription>
            Create a new support ticket. Select one product and add the issues.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Short summary of the product / issue"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the problem in detail"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <fieldset className="space-y-3">
              <legend className="flex items-center gap-1.5 text-sm font-medium">
                <ListChecks className="size-3.5" /> Issues
                <span className="font-normal text-muted-foreground">
                  (add multiple)
                </span>
              </legend>

              {issues.map((issue, i) => (
                <div
                  key={i}
                  className="relative space-y-3 rounded-lg border p-4"
                >
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
                    onChange={(e) =>
                      updateIssueField(i, "title", e.target.value)
                    }
                  />
                  <Textarea
                    rows={2}
                    placeholder="Describe this issue"
                    value={issue.description}
                    onChange={(e) => {
                      updateIssueField(i, "description", e.target.value);
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Priority
                      </label>
                      <Select
                        value={issue.priority}
                        onValueChange={(v) =>
                          updateIssueField(i, "priority", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem
                              key={p}
                              value={p}
                              className="capitalize"
                            >
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
                      <Input
                        value={issue.assignedTo || ""}
                        onChange={(e) =>
                          updateIssueField(i, "assignedTo", e.target.value)
                        }
                        placeholder="Enter technician name (optional)"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {issuesError && (
                <p className="text-sm text-destructive">{issuesError}</p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIssue}
              >
                <Plus className="mr-1 size-3.5" /> Add Issue
              </Button>
            </fieldset>

            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={(v) => field.onChange(v || undefined)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        <Input
                          placeholder="Search products…"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="h-9 text-sm mb-2"
                        />
                        {filteredProducts.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">
                            No products found
                          </p>
                        ) : (
                          filteredProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.deviceName}
                              {p.sku && (
                                <span className="ml-auto text-muted-foreground text-xs">
                                  ({p.sku})
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isScopedUser && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue("subDepartment", "");
                            form.setValue("subDepartment2", "");
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

            {/* Level 1 Sub-department */}
            {level1Options.length > 0 && !isScopedUser && (
              <FormField
                control={form.control}
                name="subDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sub-department
                      <span className="font-normal text-muted-foreground">
                        (level 1)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || "__none__"}
                        onValueChange={(v) => {
                          field.onChange(v === "__none__" ? "" : v);
                          form.setValue("subDepartment2", "");
                        }}
                      >
                        <SelectTrigger>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Level 2 Sub-department (children of level 1) */}
            {level2Options.length > 0 && !isScopedUser && (
              <FormField
                control={form.control}
                name="subDepartment2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sub-department
                      <span className="font-normal text-muted-foreground">
                        (level 2)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || "__none__"}
                        onValueChange={(v) =>
                          field.onChange(v === "__none__" ? "" : v)
                        }
                      >
                        <SelectTrigger>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Priority</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
