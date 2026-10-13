"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useApp } from "@/store/app-store";
import { TECHNICIAN_DEMO_PASSWORD } from "@/data/mock";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function TechnicianLoginPage() {
  const router = useRouter();
  const { state, user, login } = useApp();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Every technician (seeded or Admin-created) can sign in with their own email.
  const technicians = React.useMemo(
    () => [...state.technicians].sort((a, b) => a.id.localeCompare(b.id)),
    [state.technicians]
  );

  // Already signed in as a technician → straight to their dashboard
  React.useEffect(() => {
    if (user?.role === "technician") router.replace("/technician/dashboard");
  }, [user, router]);

  const onSubmit = (values: LoginValues) => {
    setError(null);
    if (login(values.email.trim(), values.password)) {
      router.push("/technician/dashboard");
    } else {
      setError("Invalid credentials. Use your technician email and the demo password below.");
    }
  };

  const fillDemo = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", TECHNICIAN_DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border p-8 shadow-xl shadow-black/5">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="bg-warning/15 flex size-12 items-center justify-center rounded-xl shadow-lg shadow-warning/25">
            <Wrench className="text-warning size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Technician Portal</h1>
            <p className="text-muted-foreground text-sm">Altrox AI — Field Service Access</p>
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
                      <Input type="email" placeholder="your.name@nda.in" className="pl-9" {...field} />
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
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
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Technician accounts</span>
            <div className="bg-border h-px flex-1" />
          </div>
          <p className="text-muted-foreground mb-3 text-xs">
            Tap an account to fill its email. Every technician uses the demo password{" "}
            <span className="text-foreground font-mono font-semibold">{TECHNICIAN_DEMO_PASSWORD}</span>. You will only
            see the tickets assigned to you.
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {technicians.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => fillDemo(t.email)}
                disabled={t.status !== "Active"}
                className="hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="bg-warning/15 text-warning flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Wrench className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block text-sm font-medium">{t.name}</span>
                    {t.status !== "Active" && (
                      <Badge variant="neutral" className="gap-1 text-[10px]">
                        <ShieldAlert className="size-3" /> Inactive
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">{t.email}</span>
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">{TECHNICIAN_DEMO_PASSWORD}</span>
              </button>
            ))}
            {technicians.length === 0 && (
              <p className="text-muted-foreground text-sm">No technicians exist yet. Add one from the Admin panel.</p>
            )}
          </div>
        </div>

        <Link href="/login" className="text-muted-foreground hover:text-foreground mt-6 flex items-center justify-center gap-1.5 text-xs transition-colors">
          <ArrowLeft className="size-3.5" /> Back to staff login
        </Link>
      </div>
    </div>
  );
}
