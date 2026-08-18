import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardList,
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
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL: Role[] = ["super-admin", "admin", "department-manager", "department-user", "viewer"];
const STAFF: Role[] = ["super-admin", "admin", "department-manager", "department-user"];
const MANAGER: Role[] = ["super-admin", "admin", "department-manager"];
const ADMIN: Role[] = ["super-admin", "admin"];
const OP_STAFF: Role[] = ["super-admin", "admin", "department-manager"];

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL }],
  },
  {
    label: "Inventory",
    items: [
      { title: "Inventory", href: "/inventory", icon: Package, roles: ALL },
      { title: "Stock In", href: "/stock-in", icon: PackagePlus, roles: STAFF },
      { title: "Stock Out", href: "/stock-out", icon: PackageMinus, roles: STAFF },
      { title: "Transfers", href: "/transfers", icon: ArrowLeftRight, roles: STAFF },
      { title: "Adjustments", href: "/adjustments", icon: SlidersHorizontal, roles: MANAGER },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Requests", href: "/requests", icon: ClipboardList, roles: STAFF },
      { title: "Tickets", href: "/tickets", icon: Ticket, roles: ADMIN },
      { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, roles: OP_STAFF },
      { title: "Suppliers", href: "/suppliers", icon: Truck, roles: OP_STAFF },
    ],
  },
  {
    label: "Assets",
    items: [
      { title: "Assets", href: "/assets", icon: Boxes, roles: ALL },
      { title: "Categories", href: "/categories", icon: FolderTree, roles: OP_STAFF },
      { title: "Locations", href: "/locations", icon: MapPin, roles: OP_STAFF },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Departments", href: "/departments", icon: Building2, roles: ADMIN },
      { title: "Users", href: "/users", icon: Users, roles: ADMIN },
    ],
  },
  {
    label: "Analytics",
    items: [{ title: "Reports", href: "/reports", icon: BarChart3, roles: ALL }],
  },
  {
    label: "System",
    items: [
      { title: "Activity Log", href: "/activity", icon: ScrollText, roles: ADMIN },
      { title: "Settings", href: "/settings", icon: Settings, roles: ADMIN },
    ],
  },
];

export const bottomNav: NavItem[] = [{ title: "Help", href: "/help", icon: LifeBuoy, roles: ALL }];

export function navForRole(role: Role): NavGroup[] {
  return navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
}
