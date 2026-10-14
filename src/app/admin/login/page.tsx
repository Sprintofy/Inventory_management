"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Boxes, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useApp } from "@/store/app-store";
import { demoAccounts } from "@/data/mock";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Solo Super Admin login — SAME UI as /login and /user/login, email + password only.
// Root user with full access to every department.
export default function AdminLoginPage() {
  const router = useRouter();
  const { login, state } = useApp();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginValues) => {
    setError(null);
    const normalized = values.email.trim().toLowerCase();
    const tech = state.technicians.find((t) => t.email.trim().toLowerCase() === normalized);
    if (tech) {
      setError("Technicians must sign in at /technician/login.");
      return;
    }
    // Pre-check role so dept users never land in admin portal.
    const live = state.users.find((x) => x.email.trim().toLowerCase() === normalized);
    const demo = demoAccounts.find((a) => a.email.toLowerCase() === normalized);
    const expectedRole = live?.role ?? demo?.role;
    if (expectedRole && expectedRole !== "super-admin" && expectedRole !== "admin") {
      setError("Users must sign in at /user/login.");
      return;
    }
    if (!login(values.email, values.password)) {
      setError("Invalid admin credentials.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border p-8 shadow-xl shadow-black/5">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="bg-primary flex size-12 items-center justify-center rounded-xl shadow-lg shadow-primary/25">
            <Boxes className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Altrox AI</h1>
            <p className="text-muted-foreground text-sm">Super Admin Login — Root Access</p>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><div className="relative"><Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input type="email" placeholder="admin@example.com" className="pl-9" {...field} /></div></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>Password</FormLabel><FormControl><div className="relative"><Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-9 pl-9" {...field} /><button type="button" onClick={() => setShowPassword((s) => !s)} className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></FormControl><FormMessage /></FormItem>
            )} />
            {error && <div className="bg-danger/10 text-danger flex items-center gap-2 rounded-md px-3 py-2 text-sm"><KeyRound className="size-4 shrink-0" />{error}</div>}
            <Button type="submit" className="w-full" size="lg"><ShieldCheck className="size-4" /> Sign in as Super Admin</Button>
          </form>
        </Form>
        <p className="text-muted-foreground mt-6 text-center text-xs">Demo: admin@example.com / password</p>
      </div>
    </div>
  );
}
