"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  Activity,
  Category,
  Department,
  InventoryItem,
  Role,
  StockInRecord,
  StockTransaction,
  User,
} from "@/types";
import { uid } from "@/lib/utils";
import type {
  StockInFiltersState,
  StockOutFiltersState,
} from "@/components/inventory/InventoryFilters";

// The API mounts every route under /api (see Inventory_api/src/app.ts) and its
// auth middleware only exempts /api/auth/login. A base URL without that prefix
// makes every login attempt fail with 403 Forbidden, so normalise it here.
const API_BASE = (() => {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "/api")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return "/api";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
})();
const TOKEN_KEY = "inventoryos-token";

async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["authorization"] = token;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.status && data.status >= 400)) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data.results;
}

export type Permission =
  | "inventory.manage"
  | "stock-in.create"
  | "stock-out.create"
  | "po.create"
  | "po.manage"
  | "tickets.manage"
  | "assets.manage"
  | "categories.manage"
  | "locations.manage"
  | "departments.manage"
  | "reports.view"
  | "activity.view"
  | "settings.manage"
  | "global.view";

const rolePermissions: Record<Role, Permission[]> = {
  "super-admin": [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "po.create",
    "po.manage",
    "tickets.manage",
    "assets.manage",
    "categories.manage",
    "locations.manage",
    "departments.manage",
    "reports.view",
    "activity.view",
    "settings.manage",
    "global.view",
  ],
  admin: [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "po.create",
    "po.manage",
    "tickets.manage",
    "assets.manage",
    "categories.manage",
    "locations.manage",
    "departments.manage",
    "reports.view",
    "activity.view",
    "settings.manage",
  ],
  user: [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "reports.view",
  ],
  "department-manager": [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "reports.view",
    "tickets.manage",
  ],
  "department-user": [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "reports.view",
  ],
  viewer: ["reports.view"],
  technician: [],
};

export interface Settings {
  orgName: string;
  defaultCurrency: string;
  timezone: string;
  defaultReorderLevel: number;
  lowStockThreshold: number;
  notifyLowStock: boolean;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  showNotifications: boolean;
}

interface AppState {
  user: User | null;
  department: string;
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  categories: Category[];
  stockIn: StockInRecord[];
  stockInRecords: StockInRecord[];
  stockInHistory: StockInRecord[];
  stockInStats: { totalIn: number; totalOut: number };
  departments: Department[];
  activities: Activity[];
  settings: Settings;
  mobileNavOpen: boolean;
  movements: never[];
}

const defaultSettings: Settings = {
  orgName: "Acme Manufacturing Pvt. Ltd.",
  defaultCurrency: "INR",
  timezone: "Asia/Kolkata",
  defaultReorderLevel: 10,
  lowStockThreshold: 10,
  notifyLowStock: true,
  theme: "light",
  sidebarCollapsed: false,
  showNotifications: true,
};

const emptyState = (user: User | null): AppState => ({
  user,
  department: "all",
  inventory: [],
  transactions: [],
  categories: [],
  stockIn: [],
  stockInRecords: [],
  stockInHistory: [],
  stockInStats: { totalIn: 0, totalOut: 0 },
  departments: [],
  activities: [],
  settings: defaultSettings,
  mobileNavOpen: false,
  movements: [],
});

function buildDepartments(
  depts: Array<Record<string, unknown>>,
): Department[] {
  return depts.map((d) => (d as unknown as Department));
}

interface AppContextValue {
  state: AppState;
  user: User | null;
  role: Role;
  permissions: Permission[];
  can: (p: Permission) => boolean;
  visibleDepartments: string[];
  departmentOptions: string[];
  activeDepartment: string;
  departmentItems: InventoryItem[];
  allItems: InventoryItem[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setDepartment: (d: string) => void;
  toggleNav: () => void;
  toggleSidebar: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  addItem: (item: InventoryItem) => void;
  updateItem: (item: InventoryItem) => void;
  stockIn: (
    itemId: string,
    quantity: number,
    note?: string,
    defect?: string,
  ) => void;
  stockOut: (
    id: string,
    remarks: string,
    technicianName?: string,
    secIcName?: string,
    defect?: string,
  ) => void;
  updateStockInStatus: (id: string, status: StockInRecord["status"]) => void;
  fetchStockIn: (filters: StockInFiltersState | any) => Promise<void>;
  fetchStockInStats: (filters: {
    dateFrom?: string;
    dateTo?: string;
    department?: string;
    type?: string;
    maintenanceType?: string;
    category?: string;
  }) => Promise<void>;
  fetchStockInHistory: (itemId: string) => Promise<void>;
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addDepartment: (d: Department) => void;
  updateDepartment: (d: Department) => void;
  deleteDepartment: (id: string) => void;
  log: (
    action: string,
    module: string,
    item: string,
    department?: string,
  ) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [state, setState] = React.useState<AppState>(emptyState(null));
  const [ready, setReady] = React.useState(false);

  const authCall = React.useCallback(
    async (path: string, options: RequestInit = {}) => {
      return apiFetch(path, options, token);
    },
    [token],
  );

  const loadAll = React.useCallback(async (t: string) => {
    const b = await apiFetch("/system/bootstrap", {}, t);
    return {
      departments: buildDepartments(b.departments),
      categories: b.categories,
      inventory: b.items,
      stockIn: b.stockIn,
      transactions: b.transactions,
      activities: b.activities,
    };
  }, []);

  const boot = React.useCallback(async () => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(TOKEN_KEY)
          : null;
      if (!stored) {
        setReady(true);
        return;
      }
      const me = await apiFetch("/auth/me", {}, stored);
      const user = me as User;
      const data = await loadAll(stored);
      setToken(stored);
      setState({
        ...emptyState(user),
        ...data,
        user,
        stockInRecords: data.stockIn,
        department:
          user.role === "super-admin" || user.role === "admin"
            ? "all"
            : user.department,
      });
    } catch {
      try {
        window.localStorage.removeItem(TOKEN_KEY);
      } catch {
        // ignore
      }
    } finally {
      setReady(true);
    }
  }, [loadAll]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void boot();
  }, [boot]);

  const role = state.user?.role ?? "super-admin";
  const permissions = React.useMemo(() => rolePermissions[role], [role]);

  const can = React.useCallback(
    (p: Permission) => permissions.includes(p),
    [permissions],
  );

  const visibleDepartments = React.useMemo(() => {
    if (role === "super-admin" || role === "admin") {
      return state.departments.map((d) => d.name);
    }
    if (
      role === "user" ||
      role === "department-manager" ||
      role === "department-user"
    ) {
      if (state.user) return [state.user.department];
      return [];
    }
    if (state.user) return [state.user.department];
    return state.departments.map((d) => d.name);
  }, [role, state.user, state.departments]);

  const departmentOptions = React.useMemo(() => {
    if (
      role === "user" ||
      role === "department-manager" ||
      role === "department-user"
    ) {
      return visibleDepartments;
    }
    return ["all", ...visibleDepartments];
  }, [visibleDepartments, role]);

  const activeDepartment = React.useMemo(() => {
    if (role === "super-admin" || role === "admin") {
      if (state.department && state.department !== "all") return state.department;
      return "all";
    }
    if (
      role === "user" ||
      role === "department-manager" ||
      role === "department-user"
    ) {
      return visibleDepartments[0] ?? state.user?.department ?? "all";
    }
    if (
      state.department !== "all" &&
      visibleDepartments.includes(state.department)
    )
      return state.department;
    if (visibleDepartments.length === 1) return visibleDepartments[0];
    return "all";
  }, [state.department, visibleDepartments, role, state.user]);

  const allItems = React.useMemo(() => state.inventory, [state.inventory]);

  const departmentItems = React.useMemo(() => {
    if (activeDepartment === "all") return allItems;
    return allItems.filter((i) => i.department === activeDepartment);
  }, [allItems, activeDepartment]);

  const fail = React.useCallback((e: unknown, fallback: string) => {
    toast.error(e instanceof Error ? e.message : fallback);
  }, []);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const t = data.token as string;
      const user = data.user as User;
      try {
        window.localStorage.setItem(TOKEN_KEY, t);
      } catch {
        // ignore
      }
      setToken(t);
      const loaded = await loadAll(t);
      setState({
        ...emptyState(user),
        ...loaded,
        user,
        stockInRecords: loaded.stockIn,
        department:
          user.role === "super-admin" || user.role === "admin"
            ? "all"
            : user.department,
      });
      return true;
    },
    [loadAll],
  );

  const logout = React.useCallback(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setState(emptyState(null));
  }, []);

  const setDepartment = React.useCallback(
    (d: string) => setState((s) => ({ ...s, department: d })),
    [],
  );
  const toggleNav = React.useCallback(
    () => setState((s) => ({ ...s, mobileNavOpen: !s.mobileNavOpen })),
    [],
  );
  const toggleSidebar = React.useCallback(
    () =>
      setState((s) => ({
        ...s,
        settings: {
          ...s.settings,
          sidebarCollapsed: !s.settings.sidebarCollapsed,
        },
      })),
    [],
  );
  const updateSettings = React.useCallback(
    (s: Partial<Settings>) =>
      setState((prev) => ({ ...prev, settings: { ...prev.settings, ...s } })),
    [],
  );

  const log = React.useCallback(
    (action: string, module: string, item: string, department?: string) => {
      const dept =
        department ?? (activeDepartment === "all" ? "-" : activeDepartment);
      const record = {
        id: uid("ACT"),
        user: state.user?.name ?? "Admin",
        action,
        module,
        item,
        department: dept,
        date: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        activities: [record as Activity, ...s.activities],
      }));
      void authCall("/system/activities", {
        method: "POST",
        body: JSON.stringify(record),
      }).catch(() => undefined);
    },
    [state.user, activeDepartment, authCall],
  );

  const addItem = React.useCallback(
    (item: InventoryItem) => {
      void (async () => {
        try {
          const created = await authCall("/inventory/items", {
            method: "POST",
            body: JSON.stringify(item),
          });
          setState((s) => ({
            ...s,
            inventory: [created as InventoryItem, ...s.inventory],
          }));
          toast.success("Inventory item added successfully");
        } catch (e) {
          fail(e, "Could not add item");
        }
      })();
    },
    [authCall, fail],
  );

  const updateItem = React.useCallback(
    (item: InventoryItem) => {
      void (async () => {
        try {
          const updated = await authCall(`/inventory/items/${item.id}`, {
            method: "PUT",
            body: JSON.stringify(item),
          });
          setState((s) => ({
            ...s,
            inventory: s.inventory.map((i) =>
              i.id === item.id ? (updated as InventoryItem) : i,
            ),
          }));
          toast.success("Inventory item updated successfully");
        } catch (e) {
          fail(e, "Could not update item");
        }
      })();
    },
    [authCall, fail],
  );

  const stockIn = React.useCallback(
    (itemId: string, quantity: number, note?: string, defect?: string) => {
      void (async () => {
        try {
          const data = await authCall("/inventory/stock-in", {
            method: "POST",
            body: JSON.stringify({ itemId, quantity, note, defect }),
          });
          setState((s) => ({
            ...s,
            inventory: s.inventory.map((i) =>
              i.id === data.item.id ? (data.item as InventoryItem) : i,
            ),
            transactions: [
              data.transaction as StockTransaction,
              ...s.transactions,
            ],
            stockIn: [data.record as StockInRecord, ...s.stockIn],
            stockInRecords: [
              data.record as StockInRecord,
              ...s.stockInRecords,
            ],
            activities: [data.activity as Activity, ...s.activities],
          }));
          const item = state.inventory.find((i) => i.id === itemId);
          toast.success(
            `Stock received — ${quantity} × ${item?.deviceName ?? data.item.deviceName}`,
          );
        } catch (e) {
          fail(e, "Could not record stock in");
        }
      })();
    },
    [authCall, fail, state.inventory],
  );

  const stockOut = React.useCallback(
    (
      id: string,
      remarks: string,
      technicianName?: string,
      secIcName?: string,
      defect?: string,
    ) => {
      void (async () => {
        try {
          const data = await authCall("/inventory/stock-out", {
            method: "POST",
            body: JSON.stringify({ id, remarks, technicianName, secIcName, defect }),
          });
          setState((s) => ({
            ...s,
            inventory: s.inventory.map((i) =>
              i.id === data.item.id ? (data.item as InventoryItem) : i,
            ),
            transactions: [
              data.transaction as StockTransaction,
              ...s.transactions,
            ],
            stockIn: s.stockIn.map((r) =>
              r.id === data.record.id ? (data.record as StockInRecord) : r,
            ),
            stockInRecords: s.stockInRecords.map((r) =>
              r.id === data.record.id ? (data.record as StockInRecord) : r,
            ),
            activities: [data.activity as Activity, ...s.activities],
          }));
          toast.success(`Stock issued — ${data.record.itemName}`);
        } catch (e) {
          fail(e, "Could not issue stock");
        }
      })();
    },
    [authCall, fail, state.inventory],
  );

  const updateStockInStatus = React.useCallback(
    (id: string, status: StockInRecord["status"]) => {
      void (async () => {
        try {
          await authCall(`/inventory/stock-in/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
          });
          setState((s) => ({
            ...s,
            stockIn: s.stockIn.map((r) => (r.id === id ? { ...r, status } : r)),
            stockInRecords: s.stockInRecords.map((r) =>
              r.id === id ? { ...r, status } : r,
            ),
          }));
          toast.success(`Stock in record ${status}`);
        } catch (e) {
          fail(e, "Could not update record");
        }
      })();
    },
    [authCall, fail],
  );

  const fetchStockIn = React.useCallback(
    async (filters: StockInFiltersState | any) => {
      try {
        const params = new URLSearchParams();
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        if (filters.status && filters.status !== "all")
          params.set("status", filters.status);
        if (filters.type && filters.type !== "all")
          params.set("type", filters.type);
        if (filters.maintenanceType && filters.maintenanceType !== "all")
          params.set("maintenanceType", filters.maintenanceType);
        if (filters.category && filters.category !== "all")
          params.set("category", filters.category);
        const data = await authCall(`/inventory/stock-in?${params.toString()}`);
        setState((s) => ({ ...s, stockInRecords: data.results || data }));
      } catch (e) {
        fail(e, "Could not fetch stock in records");
      }
    },
    [authCall, fail],
  );

  const fetchStockInStats = React.useCallback(
    async (filters: {
      dateFrom?: string;
      dateTo?: string;
      department?: string;
      type?: string;
      maintenanceType?: string;
      category?: string;
    }) => {
      try {
        const params = new URLSearchParams();
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        if (filters.department && filters.department !== "all")
          params.set("department", filters.department);
        if (filters.type && filters.type !== "all")
          params.set("type", filters.type);
        if (filters.maintenanceType && filters.maintenanceType !== "all")
          params.set("maintenanceType", filters.maintenanceType);
        if (filters.category && filters.category !== "all")
          params.set("category", filters.category);
        const data = await authCall(
          `/inventory/stock-in/stats?${params.toString()}`,
        );
        const stats = data.results || data || {};
        setState((s) => ({
          ...s,
          stockInStats: {
            totalIn: Number(stats.totalIn || 0),
            totalOut: Number(stats.totalOut || 0),
          },
        }));
      } catch (e) {
        fail(e, "Could not fetch stock totals");
      }
    },
    [authCall, fail],
  );

  const fetchStockInHistory = React.useCallback(
    async (itemId: string) => {
      try {
        const data = await authCall(
          `/inventory/stock-in/history?itemId=${encodeURIComponent(itemId)}`,
        );
        setState((s) => ({ ...s, stockInHistory: data.results || data }));
      } catch (e) {
        fail(e, "Could not fetch stock-in history");
      }
    },
    [authCall, fail],
  );

  const addCategory = React.useCallback(
    (c: Category) => {
      void (async () => {
        try {
          const created = await authCall("/catalog/categories", {
            method: "POST",
            body: JSON.stringify(c),
          });
          setState((s) => ({
            ...s,
            categories: [created as Category, ...s.categories],
          }));
          toast.success("Category added successfully");
        } catch (e) {
          fail(e, "Could not add category");
        }
      })();
    },
    [authCall, fail],
  );

  const updateCategory = React.useCallback(
    (c: Category) => {
      void (async () => {
        try {
          await authCall(`/catalog/categories/${c.id}`, {
            method: "PUT",
            body: JSON.stringify(c),
          });
          setState((s) => ({
            ...s,
            categories: s.categories.map((x) => (x.id === c.id ? c : x)),
          }));
          toast.success("Category updated successfully");
        } catch (e) {
          fail(e, "Could not update category");
        }
      })();
    },
    [authCall, fail],
  );

  const deleteCategory = React.useCallback(
    (id: string) => {
      void (async () => {
        try {
          await authCall(`/catalog/categories/${id}`, { method: "DELETE" });
          setState((s) => ({
            ...s,
            categories: s.categories.filter((c) => c.id !== id),
          }));
          toast.success("Category deleted");
        } catch (e) {
          fail(e, "Could not delete category");
        }
      })();
    },
    [authCall, fail],
  );

  const refreshDepartments = React.useCallback(async () => {
    const depts = await authCall("/departments");
    setState((s) => ({ ...s, departments: buildDepartments(depts) }));
  }, [authCall]);

  const addDepartment = React.useCallback(
    (d: Department) => {
      void (async () => {
        try {
          await authCall("/departments", {
            method: "POST",
            body: JSON.stringify(d),
          });
          await refreshDepartments();
          toast.success("Department created successfully");
        } catch (e) {
          fail(e, "Could not create department");
        }
      })();
    },
    [authCall, fail, refreshDepartments],
  );

  const updateDepartment = React.useCallback(
    (d: Department) => {
      void (async () => {
        try {
          await authCall(`/departments/${d.id}`, {
            method: "PUT",
            body: JSON.stringify(d),
          });
          await refreshDepartments();
          toast.success("Department updated successfully");
        } catch (e) {
          fail(e, "Could not update department");
        }
      })();
    },
    [authCall, fail, refreshDepartments],
  );

  const deleteDepartment = React.useCallback(
    (id: string) => {
      void (async () => {
        try {
          await authCall(`/departments/${id}`, { method: "DELETE" });
          setState((s) => ({
            ...s,
            departments: s.departments.filter((d) => d.id !== id),
          }));
          toast.success("Department deleted");
        } catch (e) {
          fail(e, "Could not delete department");
        }
      })();
    },
    [authCall, fail],
  );

  const value: AppContextValue = React.useMemo(
    () => ({
      state,
      user: state.user,
      role: ready ? role : "super-admin",
      permissions: ready ? permissions : rolePermissions["super-admin"],
      can: ready ? can : () => false,
      visibleDepartments: ready ? visibleDepartments : [],
      departmentOptions: ready ? departmentOptions : [],
      activeDepartment: ready ? activeDepartment : "all",
      departmentItems: ready ? departmentItems : [],
      allItems: ready ? allItems : [],
      login,
      logout,
      setDepartment,
      toggleNav,
      toggleSidebar,
      updateSettings,
      addItem,
      updateItem,
      stockIn,
      stockOut,
      updateStockInStatus,
      fetchStockIn,
      fetchStockInStats,
      fetchStockInHistory,
      addCategory,
      updateCategory,
      deleteCategory,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      log,
    }),
    [
      state,
      ready,
      role,
      permissions,
      can,
      visibleDepartments,
      departmentOptions,
      activeDepartment,
      departmentItems,
      allItems,
      login,
      logout,
      setDepartment,
      toggleNav,
      toggleSidebar,
      updateSettings,
      addItem,
      updateItem,
      stockIn,
      stockOut,
      updateStockInStatus,
      fetchStockIn,
      fetchStockInStats,
      fetchStockInHistory,
      addCategory,
      updateCategory,
      deleteCategory,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      log,
    ],
  );

  if (!ready) {
    return (
      <AppContext.Provider value={value}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="bg-muted size-3 animate-pulse rounded-full" />
            <div className="bg-muted size-3 animate-pulse rounded-full [animation-delay:150ms]" />
            <div className="bg-muted size-3 animate-pulse rounded-full [animation-delay:300ms]" />
          </div>
        </div>
      </AppContext.Provider>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
