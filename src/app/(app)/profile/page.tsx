"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Mail, Shield, Building2, Save, UserCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApp } from "@/store/app-store";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";

const profileSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
    department: z.string().min(1, "Select a department"),
    subDepartment: z.string().optional(),
    post: z.string().min(2, "Post / rank is required"),
  })
  .refine((data) => {
    if (data.newPassword && !data.confirmPassword) return false;
    if (!data.newPassword && data.confirmPassword) return false;
    if (data.newPassword && data.newPassword !== data.confirmPassword) return false;
    return true;
  }, {
    message: "Confirm password must match new password",
    path: ["confirmPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { state, user, updateUser } = useApp();
  const [saving, setSaving] = React.useState(false);

  const me = state.users.find((u) => u.id === user?.id);

  if (!me) {
    router.push("/dashboard");
    return null;
  }

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileValues>,
    defaultValues: {
      name: me.name,
      email: me.email,
      newPassword: "",
      confirmPassword: "",
      department: me.department,
      subDepartment: me.subDepartment ?? "",
      post: me.post ?? "",
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    try {
      const updated: User = {
        ...me,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        department: values.department,
        subDepartment: values.subDepartment?.trim() || undefined,
        post: values.post.trim(),
      };
      if (values.newPassword && values.newPassword.length >= 6) {
        (updated as any).password = values.newPassword;
      }
      setSaving(true);
      await updateUser(updated);
      toast.success("Profile updated successfully");
      router.push("/profile");
    } catch (e: any) {
      toast.error(e?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const deptOptions = state.departments.map((d) => d.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Details"
        description="Update your name, email, password, department and post."
        breadcrumb={[{ label: "Users", href: "/users" }, { label: "Profile" }]}
        actions={
          <Button variant="outline" asChild>
            <a href="/dashboard">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </a>
          </Button>
        }
      />

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Manish Jawale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mail ID</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password (leave blank to keep current)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {deptOptions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
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
                name="subDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-department (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Layer 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="post"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post / Rank</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Col, Maj, OIC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="text-muted-foreground text-sm">
                <span className="font-medium">Role:</span>{" "}
                <span className="capitalize">{me.role}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                (role cannot be changed from profile)
              </span>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="size-4 mr-2" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserCircle2 className="size-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Current Profile</h3>
        </div>
        <dl className="grid gap-y-3 sm:grid-cols-2 text-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{me.name}</dd>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium font-mono">{me.email}</dd>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium capitalize">{me.role}</dd>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <dt className="text-muted-foreground">Department</dt>
            <dd className="font-medium">{me.department}</dd>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <dt className="text-muted-foreground">Employee ID</dt>
            <dd className="font-medium">{me.employeeId}</dd>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <dt className="text-muted-foreground">Last Active</dt>
            <dd className="font-medium font-mono">{formatDate(me.lastActive)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
