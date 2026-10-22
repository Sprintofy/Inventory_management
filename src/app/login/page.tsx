"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Boxes, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useApp } from "@/store/app-store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useApp();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Invalid credentials.",
      );
    }
  };

  React.useEffect(() => {
    if (!user) return;
    router.push("/dashboard");
  }, [user, router]);

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

      </div>
    </div>
  );
}