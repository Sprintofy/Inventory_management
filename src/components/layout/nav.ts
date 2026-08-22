import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Ticket,
  ShoppingCart,
  Truck,
  Boxes,
  FolderTree,
  MapPin,
  Building2,
  Users,
  BarChart3,
  ScrollText,
  Settings,
  LifeBuoy,
  User,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
  keywords?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL: Role[] = ["super-admin", "admin", "department-manager", "department-user", "viewer"];
const MANAGER: Role[] = ["super-admin", "admin", "department-manager"];
const ADMIN: Role[] = ["super-admin", "admin"];
const OP_STAFF: Role[] = ["super-admin", "admin", "department-manager"];
const ADMIN_ONLY: Role[] = ["admin"];
const DEPT_ROLES: Role[] = ["super-admin", "admin", "department-manager", "department-user"];

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL, keywords: ["home", "overview", "main"] }],
  },
  {
    label: "Inventory",
    items: [
      { title: "Inventory", href: "/inventory", icon: Package, roles: ALL, keywords: ["stock", "items", "sku", "products"] },
      { title: "Stock In", href: "/stock-in", icon: PackagePlus, roles: ADMIN, keywords: ["stock", "inbound", "receive", "receipts", "goods"] },
      { title: "Stock Out", href: "/stock-out", icon: PackageMinus, roles: ADMIN, keywords: ["stock", "outbound", "issue", "issued", "goods"] },
      { title: "Adjustments", href: "/adjustments", icon: SlidersHorizontal, roles: MANAGER, keywords: ["adjust", "correction", "write-off"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Tickets", href: "/tickets", icon: Ticket, roles: ADMIN, keywords: ["issue", "support", "complaint", "service"] },
      { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, roles: ADMIN_ONLY, keywords: ["po", "order", "orders", "procurement", "buy"] },
      { title: "Suppliers", href: "/suppliers", icon: Truck, roles: ADMIN_ONLY, keywords: ["vendor", "vendors", "supplier"] },
    ],
  },
  {
    label: "Assets",
    items: [
      { title: "Assets", href: "/assets", icon: Boxes, roles: ["admin", "viewer"], keywords: ["equipment", "hardware", "device"] },
      { title: "Categories", href: "/categories", icon: FolderTree, roles: OP_STAFF, keywords: ["category", "type", "classification"] },
      { title: "Locations", href: "/locations", icon: MapPin, roles: OP_STAFF, keywords: ["location", "site", "warehouse", "store", "shelf"] },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Departments", href: "/departments", icon: Building2, roles: DEPT_ROLES, keywords: ["department", "dept", "team", "division"] },
      { title: "Users", href: "/users", icon: Users, roles: ADMIN, keywords: ["user", "people", "staff", "employee", "account"] },
      { title: "Technicians", href: "/technicians", icon: User, roles: ADMIN, keywords: ["technician", "tech", "support", "staff"] },
    ],
  },
  {
    label: "Analytics",
    items: [{ title: "Reports", href: "/reports", icon: BarChart3, roles: ALL, keywords: ["report", "analytics", "insights"] }],
  },
  {
    label: "System",
    items: [
      { title: "Activity Log", href: "/activity", icon: ScrollText, roles: ADMIN, keywords: ["activity", "log", "audit", "history", "trail"] },
      { title: "Settings", href: "/settings", icon: Settings, roles: ADMIN, keywords: ["setting", "config", "preference"] },
    ],
  },
];

export const bottomNav: NavItem[] = [{ title: "Help", href: "/help", icon: LifeBuoy, roles: ALL }];

export function navForRole(role: Role): NavGroup[] {
  return navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
}

export function roleCanAccess(role: Role, href: string): boolean {
  const item = navGroups.flatMap((g) => g.items).find((i) => href === i.href || href.startsWith(`${i.href}/`));
  return !item?.roles || item.roles.includes(role);
}
