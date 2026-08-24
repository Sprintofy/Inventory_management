"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Boxes, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useApp } from "@/store/app-store";
import { demoAccounts } from "@/data/mock";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

const demoList = [
  { label: "Super Admin", email: demoAccounts[0].email, password: demoAccounts[0].password, icon: ShieldCheck, color: "bg-danger/10 text-danger" },
  { label: "Department", email: demoAccounts[1].email, password: demoAccounts[1].password, icon: UserRound, color: "bg-warning/15 text-warning" },
  { label: "Department User", email: demoAccounts[2].email, password: demoAccounts[2].password, icon: UserRound, color: "bg-primary/10 text-primary" },
  { label: "Technician", email: "technician@gmail.com", password: "123456", icon: Wrench, color: "bg-warning/15 text-warning" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginValues) => {
    setError(null);
    if (login(values.email, values.password)) {
      const account = demoAccounts.find((a) => a.email === values.email && a.password === values.password);
      const isDeptRole = account?.role === "department-manager" || account?.role === "department-user";
      router.push(isDeptRole ? "/departments" : "/dashboard");
    } else {
      setError("Invalid credentials. Use one of the demo accounts below.");
    }
  };

  const fillDemo = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
    setError(null);
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
            <p className="text-muted-foreground text-sm">Enterprise Inventory Management</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input type="email" placeholder="you@company.com" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-9 pl-9" {...field} />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="bg-danger/10 text-danger flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                <KeyRound className="size-4 shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>
        </Form>

        <div className="mt-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Demo accounts</span>
            <div className="bg-border h-px flex-1" />
          </div>
          <div className="space-y-2">
            {demoList.map((d) => (
              <button
                key={d.email}
                onClick={() => fillDemo(d.email, d.password)}
                className="hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors"
              >
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${d.color}`}>
                  <d.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{d.label}</span>
                  <span className="text-muted-foreground block truncate text-xs">{d.email}</span>
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">{d.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}