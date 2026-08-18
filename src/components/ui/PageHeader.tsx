import * as React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="min-w-0 space-y-1.5">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Home
            </Link>
            {breadcrumb.map((c, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="size-3 text-muted-foreground/50" />
                {c.href ? (
                  <Link href={c.href} className="hover:text-foreground transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{c.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
