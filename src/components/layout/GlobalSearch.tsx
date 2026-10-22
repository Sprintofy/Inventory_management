"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { roleCanAccess } from "@/components/layout/nav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: string;
  label: string;
  sublabel: string;
  href: string;
  detailsHref?: string;
}

interface ResultSection {
  type: string;
  items: SearchResult[];
}

const PER_TYPE_LIMIT = 4;
const MAX_RESULTS = 12;

export function GlobalSearch() {
  const { state, departmentItems, activeDepartment, role } = useApp();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  // Keyboard shortcut (⌘K on Mac, Ctrl+K on Windows/Linux) to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sections = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const deptOk = (d: string) => activeDepartment === "all" || d === activeDepartment;
    const allowed = (href: string) => roleCanAccess(role, href);
    const match = (...fields: Array<string | undefined>) =>
      fields.some((f) => (f ?? "").toLowerCase().includes(term));

    const out: ResultSection[] = [];
    const add = (type: string, items: SearchResult[]) => {
      if (items.length > 0) out.push({ type, items });
    };

    if (allowed("/inventory")) {
      add(
        "Inventory",
        departmentItems
          .filter((i) => match(i.deviceName, i.sku, i.serialNumber, i.category))
          .slice(0, PER_TYPE_LIMIT)
          .map((i) => ({ id: i.id, type: "Inventory", label: i.deviceName, sublabel: `${i.sku} · ${i.department}`, href: `/inventory/${i.id}` })),
      );
    }

    if (allowed("/stock-in")) {
      add(
        "Stock In",
        state.stockIn
          .filter((r) => deptOk(r.department) && match(r.reference, r.supplier, r.itemName))
          .slice(0, PER_TYPE_LIMIT)
          .map((r) => ({ id: r.id, type: "Stock In", label: r.reference, sublabel: `${r.itemName} · ${r.supplier}`, href: "/stock-in" })),
      );
    }

    if (allowed("/stock-out")) {
      add(
        "Stock Out",
        state.stockOut
          .filter((r) => deptOk(r.department) && match(r.reference, r.itemName, r.recipient))
          .slice(0, PER_TYPE_LIMIT)
          .map((r) => ({ id: r.id, type: "Stock Out", label: r.reference, sublabel: `${r.itemName} · ${r.recipient}`, href: "/stock-out" })),
      );
    }

    if (allowed("/tickets")) {
      add(
        "Tickets",
        state.tickets
          .filter((t) => deptOk(t.department) && match(t.id, t.title, t.customer, t.category))
          .slice(0, PER_TYPE_LIMIT)
          .map((t) => ({ id: t.id, type: "Tickets", label: t.title, sublabel: `${t.id} · ${t.department}`, href: `/tickets/${t.id}` })),
      );
    }

    if (allowed("/users")) {
      add(
        "Users",
        state.users
          .filter((u) => match(u.name, u.email, u.department, u.role))
          .slice(0, PER_TYPE_LIMIT)
          .map((u) => ({ id: u.id, type: "Users", label: u.name, sublabel: `${u.email} · ${u.department}`, href: `/users/${u.id}` })),
      );
    }

    if (allowed("/departments")) {
      add(
        "Departments",
        state.departments
          .filter((d) => match(d.name, d.code, d.manager))
          .slice(0, PER_TYPE_LIMIT)
          .map((d) => ({ id: d.id, type: "Departments", label: d.name, sublabel: `${d.code} · ${d.manager}`, href: `/departments/${d.id}` })),
      );
    }

    if (allowed("/categories")) {
      add(
        "Categories",
        state.categories
          .filter((c) => match(c.name, c.description))
          .slice(0, PER_TYPE_LIMIT)
          .map((c) => ({ id: c.id, type: "Categories", label: c.name, sublabel: `${c.items} items`, href: "/categories" })),
      );
    }

    return out;
  }, [q, state, departmentItems, activeDepartment, role]);

  const totalResults = sections.reduce((n, s) => n + s.items.length, 0);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  let shown = 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex h-9 w-full max-w-[320px] items-center md:w-80">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 size-4 select-none" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search anything..."
            className="border-input bg-background hover:bg-accent/30 focus:border-ring focus:ring-ring h-full w-full rounded-md border pl-9 pr-12 text-sm outline-none transition-colors focus:ring-1"
          />
          {!q ? (
            <kbd className="bg-muted text-muted-foreground pointer-events-none absolute right-2.5 rounded border px-1.5 py-0.5 text-[10px] font-medium hidden md:inline">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          ) : (
            <button
              type="button"
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground absolute right-2.5 rounded-full p-0.5 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[340px] p-0 shadow-md"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto p-1.5">
          {q && totalResults === 0 && (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              No results for “{q.trim()}”
            </p>
          )}
          {!q && (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Type to search across your modules
            </p>
          )}
          {sections.map((section) =>
            section.items.map((r) => {
              if (shown >= MAX_RESULTS) return null;
              shown += 1;
              const isFirstOfType = section.items[0].id === r.id;
              return (
                <React.Fragment key={r.id}>
                  {isFirstOfType && (
                    <p className="text-muted-foreground mt-2 mb-1 px-3 text-[10px] font-semibold tracking-widest uppercase first:mt-0">
                      {section.type}
                    </p>
                  )}
                  <button
                    onClick={() => go(r.href)}
                    className="hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.label}</p>
                      <p className="text-muted-foreground truncate text-xs">{r.sublabel}</p>
                    </div>
                    <span
                      className={cn(
                        "bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                      )}
                    >
                      {r.type}
                    </span>
                  </button>
                </React.Fragment>
              );
            }),
          )}
          {(() => {
            const hasInventory = sections.some((s) => s.type === "Inventory");
            return hasInventory ? (
              <button
                onClick={() => go(`/inventory?q=${encodeURIComponent(q.trim())}`)}
                className="text-primary hover:bg-accent mt-1 flex w-full cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-xs font-medium"
              >
                View all inventory results <ArrowRight className="size-3" />
              </button>
            ) : null;
          })()}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { cn };