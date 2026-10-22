import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  variant?: "empty" | "search" | "error";
}

export function EmptyState({ icon: Icon = SearchX, title, description, action, variant = "empty" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Icon className={variant === "error" ? "size-5 text-danger" : "text-muted-foreground size-5"} />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>}
      </div>
      {action &&
        (action.href ? (
          <Button asChild size="sm" className="mt-1">
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button size="sm" className="mt-1" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
