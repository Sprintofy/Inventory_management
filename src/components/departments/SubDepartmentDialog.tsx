"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";
import type { Department, SubDepartment } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  manager: z.string().min(2, "Manager is required"),
  status: z.string().min(1),
});
type SV = z.output<typeof schema>;

interface SubDepartmentDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  department: Department | null;
  parentSub: SubDepartment | null;
  editing: SubDepartment | null;
}

export function SubDepartmentDialog({
  open,
  onOpenChange,
  department,
  parentSub,
  editing,
}: SubDepartmentDialogProps) {
  const { addSubDepartment, updateSubDepartment } = useApp();
  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", code: "", manager: "", status: "active" },
  });

  React.useEffect(() => {
    if (open)
      form.reset(
        editing
          ? {
              name: editing.name,
              code: editing.code,
              manager: editing.manager,
              status: editing.status,
            }
          : { name: "", code: "", manager: "", status: "active" },
      );
  }, [open, editing, form]);

  const scope = parentSub
    ? `${parentSub.name} (${department?.name ?? ""})`
    : (department?.name ?? "");
  const level = parentSub ? "Sub-department" : "Sub-department";

  const onSubmit = (values: SV) => {
    if (!department) return;
    if (editing) {
      updateSubDepartment(department.id, editing.id, {
        name: values.name,
        code: values.code,
        manager: values.manager,
        status: values.status as SubDepartment["status"],
      });
    } else {
      addSubDepartment(department.id, parentSub?.id ?? null, {
        departmentId: department.id,
        name: values.name,
        code: values.code,
        manager: values.manager,
        users: 0,
        status: values.status as SubDepartment["status"],
        color: parentSub?.color ?? department.color,
        children: [],
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Sub-department" : `Add ${level} under ${scope}`}
          </DialogTitle>
          <DialogDescription>
            Sub-departments can contain further sub-departments and receive
            routed requests and tickets.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hardware Support" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. IT-HW" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {editing ? "Save Changes" : "Create Sub-department"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
