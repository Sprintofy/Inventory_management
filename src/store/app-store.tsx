"use client";

import * as React from "react";
import { toast } from "sonner";
import type {
  Activity,
  Asset,
  AssetMovement,
  Category,
  Department,
  InventoryItem,
  Location,
  NotificationItem,
  PurchaseOrder,
  RequestRecord,
  Role,
  StockInRecord,
  StockOutRecord,
  StockTransaction,
  SubDepartment,
  Supplier,
  Ticket,
  TicketAsset,
  TicketIssue,
  Transfer,
  User,
} from "@/types";
import {
  activities as seedActivities,
  assetMovements as seedMovements,
  assets as seedAssets,
  categories as seedCategories,
  departments as seedDepartments,
  inventoryItems as seedInventory,
  locations as seedLocations,
  notifications as seedNotifications,
  purchaseOrders as seedPOs,
  requests as seedRequests,
  stockInRecords as seedStockIn,
  stockOutRecords as seedStockOut,
  suppliers as seedSuppliers,
  tickets as seedTickets,
  transactions as seedTransactions,
  transfers as seedTransfers,
  users as seedUsers,
  demoAccounts,
  computeStatus,
} from "@/data/mock";
import { uid } from "@/lib/utils";
import { ticketStatusFromIssues } from "@/lib/ticket-utils";

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
  | "global.view";

const rolePermissions: Record<Role, Permission[]> = {
  "super-admin": [
    "inventory.manage", "stock-in.create", "stock-out.create", "requests.create", "requests.approve",
    "transfers.create", "transfers.approve", "tickets.manage",
    "categories.manage", "locations.manage", "departments.manage", "users.manage", "reports.view",
    "activity.view", "settings.manage", "global.view",
  ],
  admin: [
    "inventory.manage", "stock-in.create", "stock-out.create", "requests.create", "requests.approve",
    "transfers.create", "transfers.approve", "po.create", "po.manage", "tickets.manage", "suppliers.manage", "assets.manage",
    "categories.manage", "locations.manage", "departments.manage", "users.manage", "reports.view",
    "activity.view", "settings.manage",
  ],
  "department-manager": [
    "inventory.manage", "requests.create", "requests.approve",
    "transfers.create", "transfers.approve",
    "categories.manage", "locations.manage", "reports.view",
  ],
  "department-user": ["inventory.manage", "requests.create", "transfers.create", "reports.view"],
  viewer: ["reports.view"],
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
  department: string; // selected department name or "all"
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  requests: RequestRecord[];
  tickets: Ticket[];
  movements: AssetMovement[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  assets: Asset[];
  categories: Category[];
  locations: Location[];
  transfers: Transfer[];
  stockIn: StockInRecord[];
  stockOut: StockOutRecord[];
  users: User[];
  departments: Department[];
  activities: Activity[];
  notifications: NotificationItem[];
  settings: Settings;
  mobileNavOpen: boolean;
}

type Action =
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" }
  | { type: "SET_DEPARTMENT"; department: string }
  | { type: "TOGGLE_NAV" }
  | { type: "SET_SETTINGS"; settings: Partial<Settings> }
  | { type: "ADD_ITEM"; item: InventoryItem }
  | { type: "UPDATE_ITEM"; item: InventoryItem }
  | { type: "ARCHIVE_ITEMS"; ids: string[] }
  | { type: "ASSIGN_DEPARTMENT"; ids: string[]; department: string }
  | { type: "CHANGE_LOCATION"; ids: string[]; location: string }
  | { type: "STOCK_IN"; itemId: string; quantity: number; ref: string; supplier: string; note?: string }
  | { type: "STOCK_OUT"; itemId: string; quantity: number; ref: string; recipient: string; purpose: string; note?: string }
  | { type: "UPDATE_STOCK_IN"; id: string; status: StockInRecord["status"] }
  | { type: "UPDATE_STOCK_OUT"; id: string; status: StockOutRecord["status"] }
  | { type: "ADD_TRANSFER"; transfer: Transfer }
  | { type: "UPDATE_TRANSFER"; id: string; status: Transfer["status"]; approvedBy?: string }
  | { type: "ADD_REQUEST"; request: RequestRecord }
  | { type: "UPDATE_REQUEST"; id: string; status: RequestRecord["status"] }
  | { type: "ADD_TICKET"; ticket: Ticket }
  | { type: "ADD_TICKET_ISSUE"; id: string; issue: TicketIssue }
  | { type: "UPDATE_TICKET_ISSUE"; ticketId: string; issueId: string; patch: Partial<TicketIssue> }
  | { type: "REMOVE_TICKET_ISSUE"; ticketId: string; issueId: string }
  | { type: "ADD_TICKET_ASSET"; ticketId: string; asset: TicketAsset }
  | { type: "UPDATE_TICKET_ASSET"; ticketId: string; assetId: string; patch: Partial<TicketAsset> }
  | { type: "REMOVE_TICKET_ASSET"; ticketId: string; assetId: string }
  | { type: "UPDATE_TICKET"; id: string; patch: Partial<Ticket> }
  | { type: "ADD_MOVEMENT"; movement: AssetMovement }
  | { type: "UPDATE_MOVEMENT"; id: string; patch: Partial<AssetMovement> }
  | { type: "REMOVE_MOVEMENT"; id: string }
  | { type: "ADD_PO"; po: PurchaseOrder }
  | { type: "UPDATE_PO"; id: string; status: PurchaseOrder["status"] }
  | { type: "ADD_SUPPLIER"; supplier: Supplier }
  | { type: "UPDATE_SUPPLIER"; supplier: Supplier }
  | { type: "DELETE_SUPPLIER"; id: string }
  | { type: "ADD_ASSET"; asset: Asset }
  | { type: "UPDATE_ASSET"; asset: Asset }
  | { type: "ADD_CATEGORY"; category: Category }
  | { type: "UPDATE_CATEGORY"; category: Category }
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "ADD_LOCATION"; location: Location }
  | { type: "UPDATE_LOCATION"; location: Location }
  | { type: "DELETE_LOCATION"; id: string }
  | { type: "ADD_USER"; user: User }
  | { type: "UPDATE_USER"; user: User }
  | { type: "DELETE_USER"; id: string }
  | { type: "ADD_DEPARTMENT"; department: Department }
  | { type: "UPDATE_DEPARTMENT"; department: Department }
  | { type: "DELETE_DEPARTMENT"; id: string }
  | { type: "ADD_SUB_DEPARTMENT"; departmentId: string; parentSubDepartmentId: string | null; subDepartment: SubDepartment }
  | { type: "UPDATE_SUB_DEPARTMENT"; departmentId: string; subDepartmentId: string; patch: Partial<SubDepartment> }
  | { type: "DELETE_SUB_DEPARTMENT"; departmentId: string; subDepartmentId: string }
  | { type: "ADD_ACTIVITY"; activity: Activity }
  | { type: "ADD_NOTIFICATION"; notification: NotificationItem }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "TOGGLE_SIDEBAR" };

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

function pushActivity(state: AppState, user: string, action: string, module: string, item: string, department: string): Activity {
  return {
    id: uid("ACT"),
    user,
    action,
    module,
    item,
    department,
    date: new Date().toISOString(),
  };
}

function mapSubs(subs: SubDepartment[], id: string, fn: (s: SubDepartment) => SubDepartment): SubDepartment[] {
  return subs.map((s) => (s.id === id ? fn(s) : { ...s, children: mapSubs(s.children, id, fn) }));
}

function filterSubs(subs: SubDepartment[], id: string): SubDepartment[] {
  return subs.filter((s) => s.id !== id).map((s) => ({ ...s, children: filterSubs(s.children, id) }));
}

function insertSub(subs: SubDepartment[], parentId: string | null, sub: SubDepartment): SubDepartment[] {
  if (parentId === null) return [...subs, sub];
  return subs.map((s) => (s.id === parentId ? { ...s, children: [...s.children, sub] } : { ...s, children: insertSub(s.children, parentId, sub) }));
}

function findSub(subs: SubDepartment[], id: string): SubDepartment | null {
  for (const s of subs) {
    if (s.id === id) return s;
    const found = findSub(s.children, id);
    if (found) return found;
  }
  return null;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.user, department: action.user.role === "super-admin" ? "all" : action.user.department };
    case "LOGOUT":
      return { ...state, user: null };
    case "SET_DEPARTMENT":
      return { ...state, department: action.department };
    case "TOGGLE_NAV":
      return { ...state, mobileNavOpen: !state.mobileNavOpen };
    case "TOGGLE_SIDEBAR":
      return { ...state, settings: { ...state.settings, sidebarCollapsed: !state.settings.sidebarCollapsed } };
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "ADD_ITEM":
      return { ...state, inventory: [action.item, ...state.inventory] };
    case "UPDATE_ITEM":
      return { ...state, inventory: state.inventory.map((i) => (i.id === action.item.id ? action.item : i)) };
    case "ARCHIVE_ITEMS":
      return { ...state, inventory: state.inventory.map((i) => (action.ids.includes(i.id) ? { ...i, archived: true } : i)) };
    case "ASSIGN_DEPARTMENT":
      return { ...state, inventory: state.inventory.map((i) => (action.ids.includes(i.id) ? { ...i, department: action.department } : i)) };
    case "CHANGE_LOCATION":
      return { ...state, inventory: state.inventory.map((i) => (action.ids.includes(i.id) ? { ...i, location: action.location } : i)) };
    case "STOCK_IN": {
      const now = new Date().toISOString();
      return {
        ...state,
        inventory: state.inventory.map((i) => {
          if (i.id !== action.itemId) return i;
          const qty = i.quantity + action.quantity;
          return { ...i, quantity: qty, status: computeStatus(qty, i.reorderLevel, i.maxStock), lastUpdated: now };
        }),
        transactions: [
          { id: uid("TXN"), type: "stock-in", reference: action.ref, itemId: action.itemId, itemName: state.inventory.find((i) => i.id === action.itemId)?.name ?? "", quantity: action.quantity, department: state.inventory.find((i) => i.id === action.itemId)?.department ?? state.department, supplier: action.supplier, createdBy: state.user?.name ?? "Admin", date: now, note: action.note },
          ...state.transactions,
        ],
      };
    }
    case "STOCK_OUT": {
      const now = new Date().toISOString();
      return {
        ...state,
        inventory: state.inventory.map((i) => {
          if (i.id !== action.itemId) return i;
          const qty = Math.max(0, i.quantity - action.quantity);
          return { ...i, quantity: qty, status: computeStatus(qty, i.reorderLevel, i.maxStock), lastUpdated: now };
        }),
        transactions: [
          { id: uid("TXN"), type: "stock-out", reference: action.ref, itemId: action.itemId, itemName: state.inventory.find((i) => i.id === action.itemId)?.name ?? "", quantity: -action.quantity, department: state.inventory.find((i) => i.id === action.itemId)?.department ?? state.department, createdBy: state.user?.name ?? "Admin", date: now, note: action.note },
          ...state.transactions,
        ],
        stockOut: [
          { id: uid("SOU"), reference: action.ref, date: now, itemName: state.inventory.find((i) => i.id === action.itemId)?.name ?? "", recipient: action.recipient, department: state.inventory.find((i) => i.id === action.itemId)?.department ?? state.department, purpose: action.purpose, quantity: action.quantity, status: "issued" },
          ...state.stockOut,
        ],
      };
    }
    case "UPDATE_STOCK_IN":
      return { ...state, stockIn: state.stockIn.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)) };
    case "UPDATE_STOCK_OUT":
      return { ...state, stockOut: state.stockOut.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)) };
    case "ADD_TRANSFER":
      return { ...state, transfers: [action.transfer, ...state.transfers] };
    case "UPDATE_TRANSFER":
      return {
        ...state,
        transfers: state.transfers.map((t) => (t.id === action.id ? { ...t, status: action.status, approvedBy: action.approvedBy ?? t.approvedBy, approvalDate: action.approvedBy ? new Date().toISOString() : t.approvalDate } : t)),
      };
    case "ADD_REQUEST":
      return { ...state, requests: [action.request, ...state.requests] };
    case "UPDATE_REQUEST":
      return { ...state, requests: state.requests.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)) };
    case "ADD_TICKET":
      return { ...state, tickets: [action.ticket, ...state.tickets] };
    case "ADD_TICKET_ISSUE":
      return { ...state, tickets: state.tickets.map((t) => (t.id === action.id ? { ...t, issues: [...t.issues, action.issue] } : t)) };
    case "UPDATE_TICKET_ISSUE":
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.ticketId ? { ...t, issues: t.issues.map((iss) => (iss.id === action.issueId ? { ...iss, ...action.patch } : iss)) } : t)),
      };
    case "REMOVE_TICKET_ISSUE":
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.ticketId ? { ...t, issues: t.issues.filter((iss) => iss.id !== action.issueId) } : t)),
      };
    case "ADD_TICKET_ASSET":
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.ticketId ? { ...t, assets: [...t.assets, action.asset] } : t)),
      };
    case "UPDATE_TICKET_ASSET":
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.ticketId ? { ...t, assets: t.assets.map((a) => (a.id === action.assetId ? { ...a, ...action.patch } : a)) } : t)),
      };
    case "REMOVE_TICKET_ASSET":
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.ticketId ? { ...t, assets: t.assets.filter((a) => a.id !== action.assetId) } : t)),
      };
    case "UPDATE_TICKET":
      return { ...state, tickets: state.tickets.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) };
    case "ADD_MOVEMENT":
      return { ...state, movements: [action.movement, ...state.movements] };
    case "UPDATE_MOVEMENT":
      return { ...state, movements: state.movements.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) };
    case "REMOVE_MOVEMENT":
      return { ...state, movements: state.movements.filter((m) => m.id !== action.id) };
    case "ADD_PO":
      return { ...state, purchaseOrders: [action.po, ...state.purchaseOrders] };
    case "UPDATE_PO":
      return { ...state, purchaseOrders: state.purchaseOrders.map((p) => (p.id === action.id ? { ...p, status: action.status } : p)) };
    case "ADD_SUPPLIER":
      return { ...state, suppliers: [action.supplier, ...state.suppliers] };
    case "UPDATE_SUPPLIER":
      return { ...state, suppliers: state.suppliers.map((s) => (s.id === action.supplier.id ? action.supplier : s)) };
    case "DELETE_SUPPLIER":
      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.id) };
    case "ADD_ASSET":
      return { ...state, assets: [action.asset, ...state.assets] };
    case "UPDATE_ASSET":
      return { ...state, assets: state.assets.map((a) => (a.id === action.asset.id ? action.asset : a)) };
    case "ADD_CATEGORY":
      return { ...state, categories: [action.category, ...state.categories] };
    case "UPDATE_CATEGORY":
      return { ...state, categories: state.categories.map((c) => (c.id === action.category.id ? action.category : c)) };
    case "DELETE_CATEGORY":
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) };
    case "ADD_LOCATION":
      return { ...state, locations: [action.location, ...state.locations] };
    case "UPDATE_LOCATION":
      return { ...state, locations: state.locations.map((l) => (l.id === action.location.id ? action.location : l)) };
    case "DELETE_LOCATION":
      return { ...state, locations: state.locations.filter((l) => l.id !== action.id) };
    case "ADD_USER":
      return { ...state, users: [action.user, ...state.users] };
    case "UPDATE_USER":
      return { ...state, users: state.users.map((u) => (u.id === action.user.id ? action.user : u)) };
    case "DELETE_USER":
      return { ...state, users: state.users.filter((u) => u.id !== action.id) };
    case "ADD_DEPARTMENT":
      return { ...state, departments: [...state.departments, action.department] };
    case "UPDATE_DEPARTMENT":
      return { ...state, departments: state.departments.map((d) => (d.id === action.department.id ? action.department : d)) };
    case "DELETE_DEPARTMENT":
      return { ...state, departments: state.departments.filter((d) => d.id !== action.id) };
    case "ADD_SUB_DEPARTMENT":
      return {
        ...state,
        departments: state.departments.map((d) => (d.id === action.departmentId ? { ...d, subDepartments: insertSub(d.subDepartments, action.parentSubDepartmentId, action.subDepartment) } : d)),
      };
    case "UPDATE_SUB_DEPARTMENT":
      return {
        ...state,
        departments: state.departments.map((d) => (d.id === action.departmentId ? { ...d, subDepartments: mapSubs(d.subDepartments, action.subDepartmentId, (s) => ({ ...s, ...action.patch })) } : d)),
      };
    case "DELETE_SUB_DEPARTMENT":
      return {
        ...state,
        departments: state.departments.map((d) => (d.id === action.departmentId ? { ...d, subDepartments: filterSubs(d.subDepartments, action.subDepartmentId) } : d)),
      };
    case "ADD_ACTIVITY":
      return { ...state, activities: [action.activity, ...state.activities] };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case "MARK_NOTIFICATIONS_READ":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    default:
      return state;
  }
}

const STORAGE_KEY = "inventoryos-state-v1";

function loadInitialState(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.inventory) || !Array.isArray(parsed.departments) || !Array.isArray(parsed.users)) {
      return initialState;
    }
    return { ...initialState, ...parsed } as AppState;
  } catch {
    return initialState;
  }
}

const initialState: AppState = {
  user: null,
  department: "all",
  inventory: seedInventory,
  transactions: seedTransactions,
  requests: seedRequests,
  tickets: seedTickets,
  movements: seedMovements,
  purchaseOrders: seedPOs,
  suppliers: seedSuppliers,
  assets: seedAssets,
  categories: seedCategories,
  locations: seedLocations,
  transfers: seedTransfers,
  stockIn: seedStockIn,
  stockOut: seedStockOut,
  users: seedUsers,
  departments: seedDepartments,
  activities: seedActivities,
  notifications: seedNotifications,
  settings: defaultSettings,
  mobileNavOpen: false,
};

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
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setDepartment: (d: string) => void;
  toggleNav: () => void;
  toggleSidebar: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  addItem: (item: InventoryItem) => void;
  updateItem: (item: InventoryItem) => void;
  archiveItems: (ids: string[]) => void;
  assignDepartment: (ids: string[], department: string) => void;
  changeLocation: (ids: string[], location: string) => void;
  stockIn: (itemId: string, quantity: number, supplier: string, note?: string) => void;
  stockOut: (itemId: string, quantity: number, recipient: string, purpose: string, note?: string) => void;
  updateStockInStatus: (id: string, status: StockInRecord["status"]) => void;
  updateStockOutStatus: (id: string, status: StockOutRecord["status"]) => void;
  adjustStock: (itemId: string, delta: number, note: string) => void;
  addTransfer: (t: Omit<Transfer, "id" | "transferNo" | "status" | "requestedBy" | "date">) => void;
  updateTransfer: (id: string, status: Transfer["status"]) => void;
  addRequest: (r: Omit<RequestRecord, "id" | "status" | "requestedBy" | "date">) => void;
  updateRequest: (id: string, status: RequestRecord["status"]) => void;
  addTicket: (t: Omit<Ticket, "id" | "status" | "createdBy" | "createdAt">) => void;
  addTicketIssue: (id: string, issue: Omit<TicketIssue, "id" | "createdAt">) => string | undefined;
  updateIssue: (ticketId: string, issueId: string, patch: Partial<TicketIssue>) => void;
  removeIssue: (ticketId: string, issueId: string) => void;
  addTicketAsset: (ticketId: string, asset: Omit<TicketAsset, "id">) => void;
  updateTicketAsset: (ticketId: string, assetId: string, patch: Partial<TicketAsset>) => void;
  removeTicketAsset: (ticketId: string, assetId: string) => void;
  addMovement: (ticketId: string, assetId: string, m: Omit<AssetMovement, "id" | "ticketId" | "assetId" | "date" | "performedBy">) => void;
  removeMovement: (id: string) => void;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  closeTicket: (id: string, resolution: string, resolvedIssueIds: string[]) => void;
  addPO: (po: Omit<PurchaseOrder, "id" | "status">) => void;
  updatePO: (id: string, status: PurchaseOrder["status"]) => void;
  addSupplier: (s: Supplier) => void;
  updateSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;
  addAsset: (a: Asset) => void;
  updateAsset: (a: Asset) => void;
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addLocation: (l: Location) => void;
  updateLocation: (l: Location) => void;
  deleteLocation: (id: string) => void;
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  addDepartment: (d: Department) => void;
  updateDepartment: (d: Department) => void;
  deleteDepartment: (id: string) => void;
  addSubDepartment: (departmentId: string, parentSubDepartmentId: string | null, sub: Omit<SubDepartment, "id">) => void;
  updateSubDepartment: (departmentId: string, subDepartmentId: string, patch: Partial<SubDepartment>) => void;
  deleteSubDepartment: (departmentId: string, subDepartmentId: string) => void;
  subDepartmentsFor: (department: string) => SubDepartment[];
  findSubDepartment: (departmentId: string, subDepartmentId: string) => SubDepartment | null;
  log: (action: string, module: string, item: string, department?: string) => void;
  markNotificationsRead: () => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, loadInitialState);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage may be unavailable or full — state still works in-memory
    }
  }, [state]);

  const role = state.user?.role ?? "super-admin";
  const permissions = React.useMemo(() => rolePermissions[role], [role]);

  const can = React.useCallback((p: Permission) => permissions.includes(p), [permissions]);

  const visibleDepartments = React.useMemo(() => {
    if (role === "super-admin" || role === "admin" || role === "department-manager" || role === "department-user") {
      return state.departments.map((d) => d.name);
    }
    if (state.user) return [state.user.department];
    return state.departments.map((d) => d.name);
  }, [role, state.user, state.departments]);

  const departmentOptions = React.useMemo(() => ["all", ...visibleDepartments], [visibleDepartments]);

  const activeDepartment = React.useMemo(() => {
    if (state.department !== "all" && visibleDepartments.includes(state.department)) return state.department;
    if (visibleDepartments.length === 1) return visibleDepartments[0];
    if (role === "department-manager" || role === "department-user") return visibleDepartments[0] ?? "all";
    return "all";
  }, [state.department, visibleDepartments, role]);

  const allItems = React.useMemo(() => state.inventory.filter((i) => !i.archived), [state.inventory]);

  const departmentItems = React.useMemo(() => {
    if (activeDepartment === "all") return allItems;
    return allItems.filter((i) => i.department === activeDepartment);
  }, [allItems, activeDepartment]);

  const log = React.useCallback(
    (action: string, module: string, item: string, department?: string) => {
      const a = pushActivity(state, state.user?.name ?? "Admin", action, module, item, department ?? activeDepartment === "all" ? "-" : activeDepartment);
      dispatch({ type: "ADD_ACTIVITY", activity: a });
    },
    [state, activeDepartment]
  );

  const login = React.useCallback((email: string, password: string) => {
    const account = demoAccounts.find((a) => a.email === email && a.password === password);
    if (!account) return false;
    const user = seedUsers.find((u) => u.email === email);
    if (!user) return false;
    dispatch({ type: "LOGIN", user });
    return true;
  }, []);

const logout = React.useCallback(() => dispatch({ type: "LOGOUT" }), []);

  const setDepartment = React.useCallback((d: string) => dispatch({ type: "SET_DEPARTMENT", department: d }), []);
  const toggleNav = React.useCallback(() => dispatch({ type: "TOGGLE_NAV" }), []);
  const toggleSidebar = React.useCallback(() => dispatch({ type: "TOGGLE_SIDEBAR" }), []);
  const updateSettings = React.useCallback((s: Partial<Settings>) => dispatch({ type: "SET_SETTINGS", settings: s }), []);

  const addItem = React.useCallback((item: InventoryItem) => dispatch({ type: "ADD_ITEM", item }), []);
  const updateItem = React.useCallback((item: InventoryItem) => dispatch({ type: "UPDATE_ITEM", item }), []);
  const archiveItems = React.useCallback((ids: string[]) => dispatch({ type: "ARCHIVE_ITEMS", ids }), []);
  const assignDepartment = React.useCallback((ids: string[], department: string) => dispatch({ type: "ASSIGN_DEPARTMENT", ids, department }), []);
  const changeLocation = React.useCallback((ids: string[], location: string) => dispatch({ type: "CHANGE_LOCATION", ids, location }), []);

  const stockIn = React.useCallback(
    (itemId: string, quantity: number, supplier: string, note?: string) => {
      const ref = uid("PO");
      dispatch({ type: "STOCK_IN", itemId, quantity, ref, supplier, note });
      const item = state.inventory.find((i) => i.id === itemId);
      toast.success(`Stock received — ${quantity} × ${item?.name ?? "item"}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "received stock", "Stock In", item?.name ?? "", item?.department ?? "-") });
    },
    [state]
  );

  const stockOut = React.useCallback(
    (itemId: string, quantity: number, recipient: string, purpose: string, note?: string) => {
      const item = state.inventory.find((i) => i.id === itemId);
      if (!item) return;
      if (quantity > item.quantity) {
        toast.error(`Insufficient stock — only ${item.quantity} available`);
        return;
      }
      const ref = uid("SO");
      dispatch({ type: "STOCK_OUT", itemId, quantity, ref, recipient, purpose, note });
      toast.success(`Stock issued — ${quantity} × ${item.name} to ${recipient}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "issued stock", "Stock Out", item.name, item.department) });
    },
    [state]
  );

  const updateStockInStatus = React.useCallback(
    (id: string, status: StockInRecord["status"]) => {
      dispatch({ type: "UPDATE_STOCK_IN", id, status });
      const r = state.stockIn.find((x) => x.id === id);
      toast.success(`Stock in record ${status}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `${status} stock in record`, "Stock In", r?.reference ?? "", r?.department ?? "-") });
    },
    [state]
  );

  const updateStockOutStatus = React.useCallback(
    (id: string, status: StockOutRecord["status"]) => {
      dispatch({ type: "UPDATE_STOCK_OUT", id, status });
      const r = state.stockOut.find((x) => x.id === id);
      toast.success(`Stock out record ${status}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `${status} stock out record`, "Stock Out", r?.reference ?? "", r?.department ?? "-") });
    },
    [state]
  );

  const adjustStock = React.useCallback(
    (itemId: string, delta: number, note: string) => {
      const item = state.inventory.find((i) => i.id === itemId);
      if (!item) return;
      if (delta < 0 && -delta > item.quantity) {
        toast.error(`Cannot adjust — only ${item.quantity} ${item.unit}s available`);
        return;
      }
      dispatch({ type: "STOCK_IN", itemId, quantity: delta, ref: uid("ADJ"), supplier: item.supplier ?? "Internal", note: `Stock adjustment: ${note}` });
      toast.success(`Stock adjusted by ${delta > 0 ? "+" : ""}${delta}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "adjusted stock", "Adjustments", item.name, item.department) });
    },
    [state]
  );

  const addTransfer = React.useCallback(
    (t: Omit<Transfer, "id" | "transferNo" | "status" | "requestedBy" | "date">) => {
      dispatch({ type: "ADD_TRANSFER", transfer: { ...t, id: uid("TRF"), transferNo: uid("TRF-2026"), status: "pending", requestedBy: state.user?.name ?? "Admin", date: new Date().toISOString() } });
      toast.success("Transfer created successfully");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "created transfer", "Transfers", t.itemName, t.fromDepartment) });
    },
    [state]
  );

  const updateTransfer = React.useCallback(
    (id: string, status: Transfer["status"]) => {
      dispatch({ type: "UPDATE_TRANSFER", id, status, approvedBy: status === "approved" || status === "in-transit" || status === "completed" ? state.user?.name ?? "Admin" : undefined });
      const t = state.transfers.find((x) => x.id === id);
      toast.success(`Transfer ${status.replace("-", " ")}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `${status} transfer`, "Transfers", t?.transferNo ?? "", t?.fromDepartment ?? "-") });
    },
    [state]
  );

  const addRequest = React.useCallback(
    (r: Omit<RequestRecord, "id" | "status" | "requestedBy" | "date">) => {
      dispatch({ type: "ADD_REQUEST", request: { ...r, id: uid("REQ-2026"), status: "pending", requestedBy: state.user?.name ?? "Admin", date: new Date().toISOString() } });
      toast.success("Request submitted successfully");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "submitted request", "Requests", r.itemName, r.department) });
    },
    [state]
  );

  const updateRequest = React.useCallback(
    (id: string, status: RequestRecord["status"]) => {
      dispatch({ type: "UPDATE_REQUEST", id, status });
      const r = state.requests.find((x) => x.id === id);
      toast.success(`Request ${status}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `${status} request`, "Requests", r?.id ?? "", r?.department ?? "-") });
    },
    [state]
  );

  const addTicket = React.useCallback(
    (t: Omit<Ticket, "id" | "status" | "createdBy" | "createdAt">) => {
      const now = new Date().toISOString();
      dispatch({ type: "ADD_TICKET", ticket: { ...t, id: uid("TKT-2026"), status: "open", createdBy: state.user?.name ?? "Admin", createdAt: now, issues: t.issues.map((iss) => ({ ...iss, createdAt: iss.createdAt ?? now })) } });
      toast.success("Ticket generated successfully");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "generated ticket", "Tickets", t.title, t.department) });
    },
    [state]
  );

  const addTicketIssue = React.useCallback(
    (id: string, issue: Omit<TicketIssue, "id" | "createdAt">) => {
      const newIssue: TicketIssue = { ...issue, id: uid("ISS"), createdAt: new Date().toISOString() };
      dispatch({ type: "ADD_TICKET_ISSUE", id, issue: newIssue });
      const t = state.tickets.find((x) => x.id === id);
      toast.success("Issue added to ticket");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "added issue to ticket", "Tickets", t?.title ?? "", t?.department ?? "-") });
      return newIssue.id;
    },
    [state]
  );

  const updateIssue = React.useCallback(
    (ticketId: string, issueId: string, patch: Partial<TicketIssue>) => {
      const t = state.tickets.find((x) => x.id === ticketId);
      if (!t) return;
      const issue = t.issues.find((iss) => iss.id === issueId);
      if (!issue) return;
      const now = new Date().toISOString();
      const next: Partial<TicketIssue> = { ...patch };
      if (patch.status && (patch.status === "resolved" || patch.status === "closed") && !patch.resolvedAt) next.resolvedAt = issue.resolvedAt ?? now;
      if (patch.status && (patch.status === "open" || patch.status === "in-progress")) next.resolvedAt = undefined;
      const issues = t.issues.map((iss) => (iss.id === issueId ? { ...iss, ...next } : iss));
      dispatch({ type: "UPDATE_TICKET_ISSUE", ticketId, issueId, patch: next });
      const status = ticketStatusFromIssues(issues, t.status);
      if (status !== t.status) dispatch({ type: "UPDATE_TICKET", id: ticketId, patch: { status } });
      toast.success(patch.status ? `Issue marked ${patch.status.replace("-", " ")}` : "Issue updated");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `${patch.status ?? "updated"} issue`, "Tickets", issue.title, t.department) });
    },
    [state]
  );

  const removeIssue = React.useCallback(
    (ticketId: string, issueId: string) => {
      const t = state.tickets.find((x) => x.id === ticketId);
      if (!t) return;
      const issues = t.issues.filter((iss) => iss.id !== issueId);
      dispatch({ type: "REMOVE_TICKET_ISSUE", ticketId, issueId });
      const status = ticketStatusFromIssues(issues, t.status);
      if (status !== t.status) dispatch({ type: "UPDATE_TICKET", id: ticketId, patch: { status } });
      toast.success("Issue removed");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "removed issue", "Tickets", t.title, t.department) });
    },
    [state]
  );

  const addTicketAsset = React.useCallback(
    (ticketId: string, asset: Omit<TicketAsset, "id">) => {
      dispatch({ type: "ADD_TICKET_ASSET", ticketId, asset: { ...asset, id: uid("TAS") } });
      const t = state.tickets.find((x) => x.id === ticketId);
      toast.success(`Asset ${asset.assetId} added to ticket`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "added asset to ticket", "Tickets", asset.assetId, t?.department ?? "-") });
    },
    [state]
  );

  const updateTicketAsset = React.useCallback(
    (ticketId: string, assetId: string, patch: Partial<TicketAsset>) => {
      dispatch({ type: "UPDATE_TICKET_ASSET", ticketId, assetId, patch });
      const t = state.tickets.find((x) => x.id === ticketId);
      toast.success("Asset updated");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "updated asset", "Tickets", assetId, t?.department ?? "-") });
    },
    [state]
  );

  const removeTicketAsset = React.useCallback(
    (ticketId: string, assetId: string) => {
      const t = state.tickets.find((x) => x.id === ticketId);
      if (!t) return;
      const asset = t.assets.find((a) => a.id === assetId);
      dispatch({ type: "REMOVE_TICKET_ASSET", ticketId, assetId });
      dispatch({ type: "UPDATE_TICKET", id: ticketId, patch: { issues: t.issues.filter((iss) => iss.assetId !== assetId) } });
      toast.success(`Asset ${asset?.assetId ?? assetId} removed`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "removed asset from ticket", "Tickets", asset?.assetId ?? assetId, t.department) });
    },
    [state]
  );

  const addMovement = React.useCallback(
    (ticketId: string, assetId: string, m: Omit<AssetMovement, "id" | "ticketId" | "assetId" | "date" | "performedBy">) => {
      const t = state.tickets.find((x) => x.id === ticketId);
      const asset = t?.assets.find((a) => a.id === assetId);
      if (!t || !asset) return;
      const now = new Date().toISOString();
      const movement: AssetMovement = { ...m, id: uid("MOV"), ticketId, assetId, date: now, performedBy: state.user?.name ?? "Admin" };
      dispatch({ type: "ADD_MOVEMENT", movement });
      dispatch({
        type: "UPDATE_TICKET_ASSET",
        ticketId,
        assetId,
        patch: {
          currentLocation: m.toLocation,
          previousLocation: m.fromLocation,
          status: m.movementType === "check-in" ? "in" : m.movementType === "check-out" ? "out" : "in-transit",
          checkInDate: m.movementType === "check-in" ? (asset.checkInDate ?? now) : asset.checkInDate,
          checkOutDate: m.movementType === "check-out" ? now : asset.checkOutDate,
        },
      });
      toast.success(`${m.movementType} recorded for ${asset.assetId}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `recorded ${m.movementType}`, "Inventory", asset.assetId, t.department) });
    },
    [state]
  );

  const removeMovement = React.useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_MOVEMENT", id });
      toast.success("Movement deleted");
    },
    []
  );

  const updateTicket = React.useCallback(
    (id: string, patch: Partial<Ticket>) => {
      const t = state.tickets.find((x) => x.id === id);
      dispatch({ type: "UPDATE_TICKET", id, patch });
      toast.success(`Ticket ${patch.status?.replace("-", " ") ?? "updated"}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `${patch.status ?? "updated"} ticket`, "Tickets", t?.title ?? "", t?.department ?? "-") });
    },
    [state]
  );

  const closeTicket = React.useCallback(
    (id: string, resolution: string, resolvedIssueIds: string[]) => {
      const now = new Date().toISOString();
      dispatch({
        type: "UPDATE_TICKET",
        id,
        patch: {
          status: "closed",
          closedBy: state.user?.name ?? "Admin",
          closedAt: now,
          resolution,
          issues: state.tickets.find((x) => x.id === id)?.issues.map((iss) => (resolvedIssueIds.includes(iss.id) ? { ...iss, status: "resolved" as const, resolvedAt: iss.resolvedAt ?? now, resolution: iss.resolution ?? resolution } : iss)) ?? [],
        },
      });
      const t = state.tickets.find((x) => x.id === id);
      toast.success("Ticket closed successfully");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "closed ticket", "Tickets", t?.title ?? "", t?.department ?? "-") });
    },
    [state]
  );

  const addPO = React.useCallback(
    (po: Omit<PurchaseOrder, "id" | "status">) => {
      dispatch({ type: "ADD_PO", po: { ...po, id: uid("PO"), status: "draft" } });
      toast.success("Purchase order created");
    },
    []
  );

  const updatePO = React.useCallback((id: string, status: PurchaseOrder["status"]) => {
    dispatch({ type: "UPDATE_PO", id, status });
    toast.success(`Purchase order ${status.replace("-", " ")}`);
  }, []);

  const addSupplier = React.useCallback((s: Supplier) => {
    dispatch({ type: "ADD_SUPPLIER", supplier: { ...s, id: uid("SUP") } });
    toast.success("Supplier added successfully");
  }, []);

  const updateSupplier = React.useCallback(
    (s: Supplier) => {
      dispatch({ type: "UPDATE_SUPPLIER", supplier: s });
      toast.success("Supplier updated successfully");
    },
    []
  );

  const deleteSupplier = React.useCallback((id: string) => {
    dispatch({ type: "DELETE_SUPPLIER", id });
    toast.success("Supplier deleted");
  }, []);

  const addAsset = React.useCallback((a: Asset) => {
    dispatch({ type: "ADD_ASSET", asset: a });
    toast.success("Asset added successfully");
  }, []);

  const updateAsset = React.useCallback(
    (a: Asset) => {
      dispatch({ type: "UPDATE_ASSET", asset: a });
      toast.success("Asset updated successfully");
    },
    []
  );

  const addCategory = React.useCallback((c: Category) => {
    dispatch({ type: "ADD_CATEGORY", category: c });
    toast.success("Category added successfully");
  }, []);

  const updateCategory = React.useCallback(
    (c: Category) => {
      dispatch({ type: "UPDATE_CATEGORY", category: c });
      toast.success("Category updated successfully");
    },
    []
  );

  const deleteCategory = React.useCallback((id: string) => {
    dispatch({ type: "DELETE_CATEGORY", id });
    toast.success("Category deleted");
  }, []);

  const addLocation = React.useCallback((l: Location) => {
    dispatch({ type: "ADD_LOCATION", location: l });
    toast.success("Location added successfully");
  }, []);

  const updateLocation = React.useCallback(
    (l: Location) => {
      dispatch({ type: "UPDATE_LOCATION", location: l });
      toast.success("Location updated successfully");
    },
    []
  );

  const deleteLocation = React.useCallback((id: string) => {
    dispatch({ type: "DELETE_LOCATION", id });
    toast.success("Location deleted");
  }, []);

  const addUser = React.useCallback(
    (u: User) => {
      dispatch({ type: "ADD_USER", user: u });
      toast.success("User added successfully");
    },
    []
  );

  const updateUser = React.useCallback(
    (u: User) => {
      dispatch({ type: "UPDATE_USER", user: u });
      toast.success("User updated successfully");
    },
    []
  );

  const deleteUser = React.useCallback((id: string) => {
    dispatch({ type: "DELETE_USER", id });
    toast.success("User deleted");
  }, []);

  const addDepartment = React.useCallback(
    (d: Department) => {
      dispatch({ type: "ADD_DEPARTMENT", department: d });
      toast.success("Department created successfully");
    },
    []
  );

  const updateDepartment = React.useCallback(
    (d: Department) => {
      dispatch({ type: "UPDATE_DEPARTMENT", department: d });
      toast.success("Department updated successfully");
    },
    []
  );

  const deleteDepartment = React.useCallback((id: string) => {
    dispatch({ type: "DELETE_DEPARTMENT", id });
    toast.success("Department deleted");
  }, []);

  const addSubDepartment = React.useCallback(
    (departmentId: string, parentSubDepartmentId: string | null, sub: Omit<SubDepartment, "id">) => {
      dispatch({ type: "ADD_SUB_DEPARTMENT", departmentId, parentSubDepartmentId, subDepartment: { ...sub, id: uid("SUB") } });
      toast.success("Sub-department added");
    },
    []
  );

  const updateSubDepartment = React.useCallback(
    (departmentId: string, subDepartmentId: string, patch: Partial<SubDepartment>) => {
      dispatch({ type: "UPDATE_SUB_DEPARTMENT", departmentId, subDepartmentId, patch });
      toast.success("Sub-department updated");
    },
    []
  );

  const deleteSubDepartment = React.useCallback(
    (departmentId: string, subDepartmentId: string) => {
      dispatch({ type: "DELETE_SUB_DEPARTMENT", departmentId, subDepartmentId });
      toast.success("Sub-department deleted");
    },
    []
  );

  const subDepartmentsFor = React.useCallback(
    (department: string) => state.departments.find((d) => d.name === department)?.subDepartments ?? [],
    [state.departments]
  );

  const findSubDepartment = React.useCallback(
    (departmentId: string, subDepartmentId: string) => {
      const dept = state.departments.find((d) => d.id === departmentId);
      return dept ? findSub(dept.subDepartments, subDepartmentId) : null;
    },
    [state.departments]
  );

  const markNotificationsRead = React.useCallback(() => dispatch({ type: "MARK_NOTIFICATIONS_READ" }), []);

  const value: AppContextValue = {
    state,
    user: state.user,
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
    archiveItems,
    assignDepartment,
    changeLocation,
    stockIn,
    stockOut,
    updateStockInStatus,
    updateStockOutStatus,
    adjustStock,
    addTransfer,
    updateTransfer,
    addRequest,
    updateRequest,
    addTicket,
    addTicketIssue,
    updateIssue,
    removeIssue,
    addTicketAsset,
    updateTicketAsset,
    removeTicketAsset,
    addMovement,
    removeMovement,
    updateTicket,
    closeTicket,
    addPO,
    updatePO,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addAsset,
    updateAsset,
    addCategory,
    updateCategory,
    deleteCategory,
    addLocation,
    updateLocation,
    deleteLocation,
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
    findSubDepartment,
    log,
    markNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
