"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const { allItems, activeDepartment } = useApp();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return allItems
      .filter((i) => {
        const deptOk = activeDepartment === "all" || i.department === activeDepartment;
        return deptOk && (i.name.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term) || i.category.toLowerCase().includes(term) || (i.serialNumber ?? "").toLowerCase().includes(term));
      })
      .slice(0, 7);
  }, [q, allItems, activeDepartment]);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="border-input bg-background hover:bg-accent/50 text-muted-foreground flex h-9 w-full max-w-[320px] cursor-pointer items-center gap-2 rounded-md border px-3 text-sm shadow-xs transition-colors md:w-72">
          <Search className="size-4" />
          <span className="flex-1 text-left">Search inventory, SKUs…</span>
          <kbd className="bg-muted hidden rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline">⌘K</kbd>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end" sideOffset={8}>
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Search className="text-muted-foreground size-4" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items, SKUs, serials…"
            className="h-7 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {q && results.length === 0 && <p className="text-muted-foreground px-3 py-6 text-center text-sm">No results for “{q}”</p>}
          {!q && <p className="text-muted-foreground px-3 py-6 text-center text-sm">Type to search across {allItems.length} items</p>}
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => go(`/inventory/${item.id}`)}
              className="hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-muted-foreground text-xs">
                  {item.sku} · {item.department}
                </p>
              </div>
              <StatusBadge status={item.status} dot={false} className="text-[10px]" />
            </button>
          ))}
          {results.length > 0 && (
            <button
              onClick={() => go(`/inventory?q=${encodeURIComponent(q)}`)}
              className="text-primary hover:bg-accent mt-1 flex w-full cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-xs font-medium"
            >
              View all results <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { cn };
