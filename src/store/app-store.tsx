"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  Activity,
  Category,
  Department,
  InventoryItem,
  NotificationItem,
  RequestRecord,
  Role,
  StockInRecord,
  StockTransaction,
  SubDepartment,
  Supplier,
  Transfer,
  User,
  Technician,
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
  | "requests.create"
  | "requests.approve"
  | "transfers.create"
  | "transfers.approve"
  | "po.create"
  | "po.manage"
  | "tickets.manage"
  | "suppliers.manage"
  | "assets.manage"
  | "categories.manage"
  | "locations.manage"
  | "departments.manage"
  | "users.manage"
  | "reports.view"
  | "activity.view"
  | "settings.manage"
  | "global.view"
  | "technicians.manage";

const rolePermissions: Record<Role, Permission[]> = {
  "super-admin": [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "requests.create",
    "requests.approve",
    "transfers.create",
    "transfers.approve",
    "po.create",
    "po.manage",
    "tickets.manage",
    "suppliers.manage",
    "assets.manage",
    "categories.manage",
    "locations.manage",
    "departments.manage",
    "users.manage",
    "reports.view",
    "activity.view",
    "settings.manage",
    "global.view",
    "technicians.manage",
  ],
  admin: [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "requests.create",
    "requests.approve",
    "transfers.create",
    "transfers.approve",
    "po.create",
    "po.manage",
    "tickets.manage",
    "suppliers.manage",
    "assets.manage",
    "categories.manage",
    "locations.manage",
    "departments.manage",
    "users.manage",
    "reports.view",
    "activity.view",
    "settings.manage",
    "technicians.manage",
  ],
  user: [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "requests.create",
    "transfers.create",
    "reports.view",
  ],
  "department-manager": [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "requests.create",
    "transfers.create",
    "reports.view",
    "tickets.manage",
  ],
  "department-user": [
    "inventory.manage",
    "stock-in.create",
    "stock-out.create",
    "requests.create",
    "transfers.create",
    "reports.view",
  ],
  viewer: ["reports.view"],
  technician: [],
};

export interface Settings {
  orgName: string;
  defaultCurrency: string;
  timezone: string;
  defaultUnit: string;
  defaultReorderLevel: number;
  lowStockThreshold: number;
  notifyLowStock: boolean;
  notifyRequests: boolean;
  notifyTransfers: boolean;
  notifyPOs: boolean;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  showNotifications: boolean;
}

interface AppState {
  user: User | null;
  department: string;
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  requests: RequestRecord[];
  suppliers: Supplier[];
  categories: Category[];
  transfers: Transfer[];
  stockIn: StockInRecord[];
  stockInRecords: StockInRecord[];
  stockInHistory: StockInRecord[];
  users: User[];
  departments: Department[];
  activities: Activity[];
  notifications: NotificationItem[];
  technicians: Technician[];
  settings: Settings;
  mobileNavOpen: boolean;
  movements: never[];
}

const defaultSettings: Settings = {
  orgName: "Acme Manufacturing Pvt. Ltd.",
  defaultCurrency: "INR",
  timezone: "Asia/Kolkata",
  defaultUnit: "unit",
  defaultReorderLevel: 10,
  lowStockThreshold: 10,
  notifyLowStock: true,
  notifyRequests: true,
  notifyTransfers: true,
  notifyPOs: true,
  theme: "light",
  sidebarCollapsed: false,
  showNotifications: true,
};

const emptyState = (user: User | null): AppState => ({
  user,
  department: "all",
  inventory: [],
  transactions: [],
  requests: [],
  suppliers: [],
  categories: [],
  transfers: [],
  stockIn: [],
  stockInRecords: [],
  stockInHistory: [],
  users: [],
  departments: [],
  activities: [],
  notifications: [],
  technicians: [],
  settings: defaultSettings,
  mobileNavOpen: false,
  movements: [],
});

function nestSubs(flat: Array<Record<string, unknown>>): SubDepartment[] {
  const byId = new Map<string, SubDepartment>();
  for (const s of flat) {
    byId.set(s.id as string, {
      ...(s as unknown as SubDepartment),
      children: [],
    });
  }
  const roots: SubDepartment[] = [];
  for (const s of byId.values()) {
    const parentId = (s as unknown as Record<string, unknown>)
      .parentSubDepartmentId as string | null;
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent) parent.children.push(s);
    else roots.push(s);
  }
  return roots;
}

function buildDepartments(
  depts: Array<Record<string, unknown>>,
  subs: Array<Record<string, unknown>>,
): Department[] {
  return depts.map((d) => ({
    ...(d as object),
    subDepartments: nestSubs(
      subs.filter((s) => s.departmentId === (d as { id?: string }).id),
    ),
  })) as Department[];
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
  ) => void;
  stockOut: (id: string, remarks: string) => void;
  updateStockInStatus: (id: string, status: StockInRecord["status"]) => void;
  fetchStockIn: (filters: StockInFiltersState | any) => Promise<void>;
  fetchStockInHistory: (itemId: string) => Promise<void>;
  addTransfer: (
    t: Omit<Transfer, "id" | "transferNo" | "status" | "requestedBy" | "date">,
  ) => void;
  updateTransfer: (id: string, status: Transfer["status"]) => void;
  addRequest: (
    r: Omit<RequestRecord, "id" | "status" | "requestedBy" | "date">,
  ) => void;
  updateRequest: (id: string, status: RequestRecord["status"]) => void;
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  addDepartment: (d: Department) => void;
  updateDepartment: (d: Department) => void;
  deleteDepartment: (id: string) => void;
  addSubDepartment: (
    departmentId: string,
    parentSubDepartmentId: string | null,
    sub: Omit<SubDepartment, "id">,
  ) => void;
  updateSubDepartment: (
    departmentId: string,
    subDepartmentId: string,
    patch: Partial<SubDepartment>,
  ) => void;
  deleteSubDepartment: (departmentId: string, subDepartmentId: string) => void;
  subDepartmentsFor: (department: string) => SubDepartment[];
  addTechnician: (t: Omit<Technician, "id">) => void;
  updateTechnician: (t: Technician) => void;
  deleteTechnician: (id: string) => void;
  log: (
    action: string,
    module: string,
    item: string,
    department?: string,
  ) => void;
  markNotificationsRead: () => void;
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
      users: b.users,
      technicians: b.technicians,
      departments: buildDepartments(b.departments, b.subs),
      categories: b.categories,
      suppliers: b.suppliers,
      inventory: b.items,
      stockIn: b.stockIn,
      transactions: b.transactions,
      transfers: b.transfers,
      requests: b.requests,
      activities: b.activities,
      notifications: b.notifications,
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
    (itemId: string, quantity: number, note?: string) => {
      void (async () => {
        try {
          const data = await authCall("/inventory/stock-in", {
            method: "POST",
            body: JSON.stringify({ itemId, quantity, note }),
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
    (id: string, remarks: string) => {
      void (async () => {
        try {
          const data = await authCall("/inventory/stock-out", {
            method: "POST",
            body: JSON.stringify({ id, remarks }),
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
    async (filters: StockInFiltersState) => {
      try {
        const params = new URLSearchParams();
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        if (filters.status && filters.status !== "all")
          params.set("status", filters.status);
        const data = await authCall(`/inventory/stock-in?${params.toString()}`);
        setState((s) => ({ ...s, stockInRecords: data.results || data }));
      } catch (e) {
        fail(e, "Could not fetch stock in records");
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

  const addTransfer = React.useCallback(
    (
      t: Omit<
        Transfer,
        "id" | "transferNo" | "status" | "requestedBy" | "date"
      >,
    ) => {
      void (async () => {
        try {
          const created = await authCall("/system/transfers", {
            method: "POST",
            body: JSON.stringify({
              ...t,
              id: uid("TRF"),
              transferNo: uid("TRF-2026"),
              status: "pending",
              requestedBy: state.user?.name ?? "Admin",
              date: new Date().toISOString(),
            }),
          });
          setState((s) => ({
            ...s,
            transfers: [created as Transfer, ...s.transfers],
          }));
          toast.success("Transfer created successfully");
        } catch (e) {
          fail(e, "Could not create transfer");
        }
      })();
    },
    [authCall, fail, state.user],
  );

  const updateTransfer = React.useCallback(
    (id: string, status: Transfer["status"]) => {
      void (async () => {
        try {
          await authCall(`/system/transfers/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              status,
              approvedBy:
                status === "pending" || status === "rejected"
                  ? undefined
                  : (state.user?.name ?? "Admin"),
            }),
          });
          setState((s) => ({
            ...s,
            transfers: s.transfers.map((x) =>
              x.id === id
                ? { ...x, status, approvedBy: state.user?.name ?? x.approvedBy }
                : x,
            ),
          }));
          toast.success(`Transfer ${status.replace("-", " ")}`);
        } catch (e) {
          fail(e, "Could not update transfer");
        }
      })();
    },
    [authCall, fail, state.user],
  );

  const addRequest = React.useCallback(
    (r: Omit<RequestRecord, "id" | "status" | "requestedBy" | "date">) => {
      void (async () => {
        try {
          const created = await authCall("/system/requests", {
            method: "POST",
            body: JSON.stringify({
              ...r,
              id: uid("REQ-2026"),
              status: "pending",
              requestedBy: state.user?.name ?? "Admin",
              date: new Date().toISOString(),
            }),
          });
          setState((s) => ({
            ...s,
            requests: [created as RequestRecord, ...s.requests],
          }));
          toast.success("Request submitted successfully");
        } catch (e) {
          fail(e, "Could not submit request");
        }
      })();
    },
    [authCall, fail, state.user],
  );

  const updateRequest = React.useCallback(
    (id: string, status: RequestRecord["status"]) => {
      void (async () => {
        try {
          await authCall(`/system/requests/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status }),
          });
          setState((s) => ({
            ...s,
            requests: s.requests.map((r) =>
              r.id === id ? { ...r, status } : r,
            ),
          }));
          toast.success(`Request ${status}`);
        } catch (e) {
          fail(e, "Could not update request");
        }
      })();
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

  const addUser = React.useCallback(
    (u: User) => {
      void (async () => {
        try {
          const created = await authCall("/users", {
            method: "POST",
            body: JSON.stringify(u),
          });
          setState((s) => ({ ...s, users: [created as User, ...s.users] }));
          toast.success("User added successfully");
        } catch (e) {
          fail(e, "Could not add user");
        }
      })();
    },
    [authCall, fail],
  );

  const updateUser = React.useCallback(
    (u: User) => {
      void (async () => {
        try {
          const updated = await authCall(`/users/${u.id}`, {
            method: "PUT",
            body: JSON.stringify(u),
          });
          setState((s) => ({
            ...s,
            users: s.users.map((x) => (x.id === u.id ? (updated as User) : x)),
          }));
          toast.success("User updated successfully");
        } catch (e) {
          fail(e, "Could not update user");
        }
      })();
    },
    [authCall, fail],
  );

  const deleteUser = React.useCallback(
    (id: string) => {
      void (async () => {
        try {
          await authCall(`/users/${id}`, { method: "DELETE" });
          setState((s) => ({
            ...s,
            users: s.users.filter((u) => u.id !== id),
          }));
          toast.success("User deleted");
        } catch (e) {
          fail(e, "Could not delete user");
        }
      })();
    },
    [authCall, fail],
  );

  const refreshDepartments = React.useCallback(async () => {
    const [depts, subs] = await Promise.all([
      authCall("/departments"),
      authCall("/departments/subs/all"),
    ]);
    setState((s) => ({ ...s, departments: buildDepartments(depts, subs) }));
  }, [authCall]);

  const addDepartment = React.useCallback(
    (d: Department) => {
      void (async () => {
        try {
          await authCall("/departments", {
            method: "POST",
            body: JSON.stringify({ ...d, users: d.users ?? 0 }),
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

  const addSubDepartment = React.useCallback(
    (
      departmentId: string,
      parentSubDepartmentId: string | null,
      sub: Omit<SubDepartment, "id">,
    ) => {
      void (async () => {
        try {
          await authCall("/departments/subs", {
            method: "POST",
            body: JSON.stringify({
              ...sub,
              id: uid("SUB"),
              departmentId,
              parentSubDepartmentId,
            }),
          });
          await refreshDepartments();
          toast.success("Sub-department added");
        } catch (e) {
          fail(e, "Could not add sub-department");
        }
      })();
    },
    [authCall, fail, refreshDepartments],
  );

  const updateSubDepartment = React.useCallback(
    (
      departmentId: string,
      subDepartmentId: string,
      patch: Partial<SubDepartment>,
    ) => {
      void (async () => {
        try {
          await authCall(`/departments/subs/${subDepartmentId}`, {
            method: "PUT",
            body: JSON.stringify(patch),
          });
          await refreshDepartments();
          toast.success("Sub-department updated");
          void departmentId;
        } catch (e) {
          fail(e, "Could not update sub-department");
        }
      })();
    },
    [authCall, fail, refreshDepartments],
  );

  const deleteSubDepartment = React.useCallback(
    (departmentId: string, subDepartmentId: string) => {
      void (async () => {
        try {
          await authCall(`/departments/subs/${subDepartmentId}`, {
            method: "DELETE",
          });
          await refreshDepartments();
          toast.success("Sub-department deleted");
          void departmentId;
        } catch (e) {
          fail(e, "Could not delete sub-department");
        }
      })();
    },
    [authCall, fail, refreshDepartments],
  );

  const subDepartmentsFor = React.useCallback(
    (department: string) =>
      state.departments.find((d) => d.name === department)?.subDepartments ??
      [],
    [state.departments],
  );

  const addTechnician = React.useCallback(
    (t: Omit<Technician, "id">) => {
      void (async () => {
        try {
          const created = await authCall("/technicians", {
            method: "POST",
            body: JSON.stringify({ ...t, id: uid("TECH") }),
          });
          setState((s) => ({
            ...s,
            technicians: [created as Technician, ...s.technicians],
          }));
          toast.success("Technician added successfully");
        } catch (e) {
          fail(e, "Could not add technician");
        }
      })();
    },
    [authCall, fail],
  );

  const updateTechnician = React.useCallback(
    (t: Technician) => {
      void (async () => {
        try {
          const updated = await authCall(`/technicians/${t.id}`, {
            method: "PUT",
            body: JSON.stringify(t),
          });
          setState((s) => ({
            ...s,
            technicians: s.technicians.map((x) =>
              x.id === t.id ? (updated as Technician) : x,
            ),
          }));
          toast.success("Technician updated successfully");
        } catch (e) {
          fail(e, "Could not update technician");
        }
      })();
    },
    [authCall, fail],
  );

  const deleteTechnician = React.useCallback(
    (id: string) => {
      void (async () => {
        try {
          await authCall(`/technicians/${id}`, { method: "DELETE" });
          setState((s) => ({
            ...s,
            technicians: s.technicians.filter((t) => t.id !== id),
          }));
          toast.success("Technician deleted");
        } catch (e) {
          fail(e, "Could not delete technician");
        }
      })();
    },
    [authCall, fail],
  );

  const markNotificationsRead = React.useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    void authCall("/system/notifications/read", { method: "PUT" }).catch(
      () => undefined,
    );
  }, [authCall]);

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
      fetchStockInHistory,
      addTransfer,
      updateTransfer,
      addRequest,
      updateRequest,
      addCategory,
      updateCategory,
      deleteCategory,
      addUser,
      updateUser,
      deleteUser,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addSubDepartment,
      updateSubDepartment,
      deleteSubDepartment,
      subDepartmentsFor,
      addTechnician,
      updateTechnician,
      deleteTechnician,
      log,
      markNotificationsRead,
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
      fetchStockInHistory,
      addTransfer,
      updateTransfer,
      addRequest,
      updateRequest,
      addCategory,
      updateCategory,
      deleteCategory,
      addUser,
      updateUser,
      deleteUser,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addSubDepartment,
      updateSubDepartment,
      deleteSubDepartment,
      subDepartmentsFor,
      addTechnician,
      updateTechnician,
      deleteTechnician,
      log,
      markNotificationsRead,
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
