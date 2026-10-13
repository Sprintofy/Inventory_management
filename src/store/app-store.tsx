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
  RequestPriority,
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
  TicketStatus,
  Transfer,
  User,
  Technician,
  DemoAccount,
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
    technicians as seedTechnicians,
    stockInRecords as seedStockIn,
    stockOutRecords as seedStockOut,
    suppliers as seedSuppliers,
    tickets as seedTickets,
    transactions as seedTransactions,
    transfers as seedTransfers,
    users as seedUsers,
    demoAccounts,
    computeStatus,
    TECHNICIAN_DEMO_PASSWORD,
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
  | "global.view"
  | "technicians.manage";

const rolePermissions: Record<Role, Permission[]> = {
  "super-admin": [
    "inventory.manage", "stock-in.create", "stock-out.create", "requests.create", "requests.approve",
    "transfers.create", "transfers.approve", "tickets.manage",
    "categories.manage", "locations.manage", "departments.manage", "users.manage", "reports.view",
    "activity.view", "settings.manage", "global.view", "technicians.manage",
  ],
  admin: [
    "inventory.manage", "stock-in.create", "stock-out.create", "requests.create", "requests.approve",
    "transfers.create", "transfers.approve", "po.create", "po.manage", "tickets.manage", "suppliers.manage", "assets.manage",
    "categories.manage", "locations.manage", "departments.manage", "users.manage", "reports.view",
    "activity.view", "settings.manage", "technicians.manage",
  ],
  "department-manager": [
    "inventory.manage", "requests.create", "requests.approve",
    "transfers.create", "transfers.approve",
    "categories.manage", "locations.manage", "reports.view",
  ],
  "department-user": ["inventory.manage", "requests.create", "transfers.create", "reports.view"],
  viewer: ["reports.view"],
  // Technicians manage their own assignments and the technicians list/detail pages.
  technician: ["technicians.manage"],
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
  technicians: Technician[];
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
  | { type: "ADD_STOCK_IN_RECORD"; record: StockInRecord }
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
  | {
      type: "CLOSE_TICKET";
      id: string;
      resolution: string;
      resolvedIssueIds: string[];
      closedBy: string;
      closedAt: string;
      returnedAssetIds: string[];
    }
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
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "ADD_TECHNICIAN"; technician: Technician }
  | { type: "UPDATE_TECHNICIAN"; technician: Technician }
  | { type: "DELETE_TECHNICIAN"; id: string };

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
    case "ADD_STOCK_IN_RECORD":
      return { ...state, stockIn: [action.record, ...state.stockIn] };
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
    case "CLOSE_TICKET": {
      // One atomic update so the issues/asset changes computed from the same
      // snapshot are never overwritten by a later dispatch built from stale state.
      const ticket = state.tickets.find((t) => t.id === action.id);
      if (!ticket) return state;
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.id
            ? {
                ...t,
                status: "closed",
                closedBy: action.closedBy,
                closedAt: action.closedAt,
                resolution: action.resolution,
                issues: t.issues.map((iss) =>
                  action.resolvedIssueIds.includes(iss.id)
                    ? { ...iss, status: "resolved" as const, resolvedAt: iss.resolvedAt ?? action.closedAt, resolution: iss.resolution ?? action.resolution }
                    : iss
                ),
                // The repaired item is handed back, so the ticket asset is
                // checked out and dated.
                assets: t.assets.map((a) => ({
                  ...a,
                  status: "out" as const,
                  checkOutDate: a.checkOutDate ?? action.closedAt,
                  currentLocation: a.currentLocation || "Technician Bench",
                })),
              }
            : t
        ),
        // Repaired assets become available again.
        assets: state.assets.map((a) =>
          action.returnedAssetIds.includes(a.assetId) ? { ...a, status: "available" as const } : a
        ),
      };
    }
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
    case "ADD_TECHNICIAN":
      return { ...state, technicians: [action.technician, ...state.technicians] };
    case "UPDATE_TECHNICIAN":
      return { ...state, technicians: state.technicians.map((t) => (t.id === action.technician.id ? action.technician : t)) };
    case "DELETE_TECHNICIAN":
      return { ...state, technicians: state.technicians.filter((t) => t.id !== action.id) };
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

// Bumped to v3: the seeded tickets now carry technician assignments and the
// technician portal resolves accounts by email, so cached demo state from an
// older session is discarded and the new seed data is used.
const STORAGE_KEY = "inventoryos-state-v3";

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
  technicians: seedTechnicians,
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
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  updateTicketRemark: (id: string, remark: string) => void;
  submitTicketSolution: (id: string, remark: string, issueResolutions?: Record<string, string>) => void;
  reissueTicket: (id: string, note: string) => void;
  reportFaultyAsset: (input: {
    assetId: string;
    issueTitle: string;
    issueDescription: string;
    priority: RequestPriority;
    department: string;
    notes?: string;
  }) => string | undefined;
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
  addTechnician: (t: Omit<Technician, "id">) => void;
  updateTechnician: (t: Technician) => void;
  deleteTechnician: (id: string) => void;
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

  /**
   * Dummy authentication for the demo app.
   *
   * Technicians sign in to the Technician Portal with their OWN email address
   * plus the shared demo password (`TECHNICIAN_DEMO_PASSWORD`). The resolved
   * `User.id` is the technician's id, which is what every technician-facing
   * screen uses to scope tickets/issues to that person. Technicians created by
   * an Admin are resolved from live state too, so they can sign in as well.
   *
   * Staff accounts keep using the `demoAccounts` table.
   */
  const login = React.useCallback(
    (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();

      const technician = state.technicians.find((t) => t.email.trim().toLowerCase() === normalized);
      if (technician) {
        if (password !== TECHNICIAN_DEMO_PASSWORD) return false;
        if (technician.status !== "Active") {
          toast.error(`${technician.name} is deactivated. Contact your administrator.`);
          return false;
        }
        dispatch({
          type: "LOGIN",
          user: {
            id: technician.id,
            name: technician.name,
            email: technician.email,
            employeeId: technician.employeeId,
            department: "Maintenance",
            role: "technician",
            status: "active",
            lastActive: new Date().toISOString(),
            color: technician.color ?? "#4f46e5",
          },
        });
        return true;
      }

      const account = demoAccounts.find((a) => a.email.toLowerCase() === normalized && a.password === password && a.role !== "technician");
      if (!account) return false;
      const user = seedUsers.find((u) => u.email.toLowerCase() === normalized);
      if (!user) return false;
      dispatch({ type: "LOGIN", user });
      return true;
    },
    [state.technicians]
  );

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

  /**
   * Admin closes a ticket that the technician marked as solved.
   * Besides stamping the ticket as closed, every linked asset is returned:
   * the master Asset becomes `available` again and a check-out movement is
   * recorded so the asset's history timeline shows the return.
   */
  const closeTicket = React.useCallback(
    (id: string, resolution: string, resolvedIssueIds: string[]) => {
      const now = new Date().toISOString();
      const t = state.tickets.find((x) => x.id === id);
      if (!t) return;

      const linkedAssets = t.assets
        .map((ta) => state.assets.find((a) => a.assetId === ta.assetId))
        .filter((a): a is Asset => Boolean(a));

      dispatch({
        type: "CLOSE_TICKET",
        id,
        resolution,
        resolvedIssueIds,
        closedBy: state.user?.name ?? "Admin",
        closedAt: now,
        returnedAssetIds: linkedAssets.map((a) => a.assetId),
      });

      for (const asset of linkedAssets) {
        dispatch({
          type: "ADD_MOVEMENT",
          movement: {
            id: uid("MOV"),
            ticketId: id,
            assetId: asset.assetId,
            serialNumber: asset.serialNumber,
            itemType: asset.category,
            itemName: asset.name,
            movementType: "check-out",
            fromLocation: t.assets.find((ta) => ta.assetId === asset.assetId)?.currentLocation ?? "Technician Bench",
            toLocation: asset.location,
            performedBy: state.user?.name ?? "Admin",
            date: now,
            remarks: `Repaired and returned \u2014 ticket ${id} closed. ${resolution}`.trim(),
          },
        });
      }

      toast.success(
        linkedAssets.length > 0
          ? `Ticket closed \u2014 ${linkedAssets.map((a) => a.assetId).join(", ")} marked available`
          : "Ticket closed successfully"
      );
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "closed ticket", "Tickets", t.title, t.department) });
    },
    [state]
  );

  const updateTicketStatus = React.useCallback(
    (id: string, status: TicketStatus) => {
      const t = state.tickets.find((x) => x.id === id);
      if (!t) return;
      // Technicians may only move their OWN ticket forward through the
      // work-in-progress -> work-completed steps. Closing and re-issuing stay
      // Admin-only.
      if (state.user?.role === "technician" && t.technicianId !== state.user.id) {
        toast.error("You can only update tickets assigned to you");
        return;
      }
      if (state.user?.role === "technician" && status !== "in-progress" && status !== "work-completed") {
        toast.error("Technicians can only start work or submit the ticket as solved");
        return;
      }
      const now = new Date().toISOString();
      const patch: Partial<Ticket> = { status };
      if (status === "work-completed") patch.completedAt = now;
      if (status === "in-progress") {
        patch.completedAt = undefined;
        patch.submittedAt = undefined;
      }
      dispatch({ type: "UPDATE_TICKET", id, patch });
      const statusLabels: Record<TicketStatus, string> = {
        open: "Open",
        "in-progress": "In Progress",
        "partially-resolved": "Partially Resolved",
        resolved: "Resolved",
        closed: "Closed",
        "work-completed": "Work Completed",
      };
      toast.success(`Ticket status updated to ${statusLabels[status]}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", `${statusLabels[status]} ticket`, "Tickets", t.title, t.department) });
    },
    [state]
  );

  const updateTicketRemark = React.useCallback(
    (id: string, remark: string) => {
      dispatch({ type: "UPDATE_TICKET", id, patch: { technicianRemark: remark } });
      const t = state.tickets.find((x) => x.id === id);
      toast.success("Technician remark saved");
      if (t) {
        dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "technician remark updated", "Tickets", t.title, t.department) });
      }
    },
    [state]
  );

  /**
   * Technician submits the ticket back to the Admin as resolved.
   *
   * A ticket can carry many issues, so each issue keeps its OWN remark
   * (`issueResolutions[issueId]`); the ticket-level `remark` is an optional
   * overall summary. Every open issue must have a remark before the ticket can
   * be submitted. The ticket moves to `work-completed` so the Admin sees it
   * awaiting review.
   */
  const submitTicketSolution = React.useCallback(
    (id: string, remark: string, issueResolutions: Record<string, string> = {}) => {
      const t = state.tickets.find((x) => x.id === id);
      if (!t) return;
      if (state.user?.role === "technician" && t.technicianId !== state.user.id) {
        toast.error("You can only submit tickets assigned to you");
        return;
      }

      const pending = t.issues.filter((i) => i.status === "open" || i.status === "in-progress");
      const missing = pending.filter((i) => !(issueResolutions[i.id] ?? "").trim());
      if (missing.length > 0) {
        toast.error(`Add a remark for every issue \u2014 ${missing.length} still missing`);
        return;
      }

      const now = new Date().toISOString();
      const summary =
        remark.trim() ||
        pending.map((i) => `${i.title}: ${(issueResolutions[i.id] ?? "").trim()}`).join("\n");

      dispatch({
        type: "UPDATE_TICKET",
        id,
        patch: {
          status: "work-completed",
          technicianRemark: summary,
          submittedAt: now,
          completedAt: now,
          issues: t.issues.map((iss) => {
            const own = (issueResolutions[iss.id] ?? "").trim();
            if (iss.status === "resolved" || iss.status === "closed") {
              // Keep any remark already recorded for an already-resolved issue.
              return own ? { ...iss, resolution: own } : iss;
            }
            return {
              ...iss,
              status: "resolved" as const,
              resolvedAt: now,
              resolution: own || iss.resolution || summary,
            };
          }),
        },
      });
      toast.success("Ticket submitted to Admin as resolved");
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "submitted ticket as resolved", "Tickets", t.title, t.department) });
    },
    [state]
  );

  /**
   * Admin sends a solved ticket back to the SAME technician when the fix did
   * not hold. The ticket returns to `in-progress`, its issues reopen so the
   * technician has to fix them again, and the reason is kept on the ticket.
   */
  const reissueTicket = React.useCallback(
    (id: string, note: string) => {
      const t = state.tickets.find((x) => x.id === id);
      if (!t) return;
      if (!t.technicianId) {
        toast.error("Assign a technician before re-issuing this ticket");
        return;
      }
      dispatch({
        type: "UPDATE_TICKET",
        id,
        patch: {
          status: "in-progress",
          completedAt: undefined,
          submittedAt: undefined,
          reissueCount: (t.reissueCount ?? 0) + 1,
          lastReissueNote: note.trim() || undefined,
          issues: t.issues.map((iss) => ({
            ...iss,
            status: "open" as const,
            resolvedAt: undefined,
            resolution: undefined,
          })),
        },
      });
      const tech = state.technicians.find((x) => x.id === t.technicianId);
      toast.success(`Ticket re-issued to ${tech?.name ?? "technician"}`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "re-issued ticket to technician", "Tickets", t.title, t.department) });
    },
    [state]
  );

  /**
   * Step 1 of the service flow \u2014 "Stock In" of a faulty asset.
   *
   * The Admin picks a computer/laptop that already exists in the asset
   * register, describes the problem, and this creates (a) a Stock In record for
   * the faulty return, (b) marks the master Asset as `under-repair`, and
   * (c) a ticket carrying that asset plus the reported issue, ready to be
   * assigned to a technician. Inventory quantities are never touched.
   */
  const reportFaultyAsset = React.useCallback(
    (input: {
      assetId: string;
      issueTitle: string;
      issueDescription: string;
      priority: Ticket["priority"];
      department: string;
      notes?: string;
    }) => {
      const asset = state.assets.find((a) => a.assetId === input.assetId || a.id === input.assetId);
      if (!asset) {
        toast.error("Select an asset from the register");
        return;
      }
      const now = new Date().toISOString();
      const ticketId = uid("TKT-2026");
      const ticketAssetId = uid("TAS");

      dispatch({
        type: "ADD_STOCK_IN_RECORD",
        record: {
          id: uid("SI"),
          reference: uid("SI-2026"),
          date: now,
          supplier: "Internal \u2014 Faulty Return",
          itemName: asset.name,
          items: 1,
          quantity: 1,
          department: input.department || asset.department,
          createdBy: state.user?.name ?? "Admin",
          status: "received",
        },
      });

      dispatch({ type: "UPDATE_ASSET", asset: { ...asset, status: "under-repair" } });

      dispatch({
        type: "ADD_TICKET",
        ticket: {
          id: ticketId,
          title: `${asset.name} \u2014 ${input.issueTitle}`,
          description: input.issueDescription,
          category: asset.category === "IT Equipment" ? "IT Support" : "Maintenance",
          department: input.department || asset.department,
          priority: input.priority,
          createdBy: state.user?.name ?? "Admin",
          createdAt: now,
          status: "open",
          assets: [
            {
              id: ticketAssetId,
              assetId: asset.assetId,
              serialNumber: asset.serialNumber,
              itemType: asset.category,
              name: asset.name,
              currentLocation: asset.location,
              status: "in",
              checkInDate: now,
              notes: input.notes,
            },
          ],
          issues: [
            {
              id: uid("ISS"),
              assetId: ticketAssetId,
              title: input.issueTitle,
              description: input.issueDescription,
              priority: input.priority,
              status: "open",
              createdAt: now,
            },
          ],
        },
      });

      toast.success(`Faulty asset received \u2014 ticket ${ticketId} generated`);
      dispatch({ type: "ADD_ACTIVITY", activity: pushActivity(state, state.user?.name ?? "Admin", "received faulty asset", "Stock In", asset.name, input.department || asset.department) });
      return ticketId;
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

    const addTechnician = React.useCallback(
      (t: Omit<Technician, "id">) => {
        dispatch({ type: "ADD_TECHNICIAN", technician: { ...t, id: uid("TECH") } });
        toast.success("Technician added successfully");
      },
      []
    );

    const updateTechnician = React.useCallback(
      (t: Technician) => {
        dispatch({ type: "UPDATE_TECHNICIAN", technician: t });
        toast.success("Technician updated successfully");
      },
      []
    );

    const deleteTechnician = React.useCallback(
      (id: string) => {
        dispatch({ type: "DELETE_TECHNICIAN", id });
        toast.success("Technician deleted");
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
  updateTicketStatus,
  updateTicketRemark,
  submitTicketSolution,
  reissueTicket,
  reportFaultyAsset,
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
  addTechnician,
  updateTechnician,
  deleteTechnician,
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
