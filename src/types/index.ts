export type Role = "super-admin" | "admin" | "user" | "department-manager" | "department-user" | "viewer" | "technician";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "overstock";

export type TransferStatus = "pending" | "approved" | "in-transit" | "completed" | "rejected";

export type RequestStatus = "pending" | "approved" | "rejected" | "partially-fulfilled" | "completed";

export type RequestPriority = "low" | "medium" | "high" | "critical";

export type POStatus = "draft" | "pending-approval" | "approved" | "ordered" | "partially-received" | "received" | "cancelled";

export type AssetStatus = "available" | "assigned" | "under-repair" | "damaged" | "lost" | "retired";

export type AssetCondition = "new" | "good" | "fair" | "poor";

export type TransactionType = "stock-in" | "stock-out" | "transfer" | "adjustment";

export type TicketStatus = "open" | "in-progress" | "partially-resolved" | "resolved" | "closed" | "work-completed";

export type IssueStatus = "open" | "in-progress" | "resolved" | "closed";

export type TicketAssetStatus = "in" | "out" | "in-transit";

export type MovementType = "check-in" | "check-out" | "transfer";

export interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
  status: "active" | "inactive";
  color: string;
}

export interface InventoryItem {
  id: string;
  deviceName: string;
  brand: string;
  type: "SER" | "BER";
  dateOfVintage?: string;
  category: string;
  notes?: string;
  sku: string;
  quantity: number;
  status: "active" | "inactive";
  lastUpdated: string;
  createdAt: string;
  department: string;
  cpuType?: "CAN" | "NCAN" | "SA";
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Login password (demo plain-text). Seeded users default to DEFAULT_USER_PASSWORD. */
  password?: string;
  employeeId: string;
  department: string;
  subDepartment?: string;
  /** Army rank / post (e.g. Col, Maj, OIC). */
  post?: string;
  role: Role;
  status: "active" | "invited" | "inactive";
  lastActive: string;
  color: string;
}

export interface StockTransaction {
  id: string;
  type: TransactionType;
  reference: string;
  itemId: string;
  itemName: string;
  quantity: number;
  department: string;
  toDepartment?: string;
  supplier?: string;
  createdBy: string;
  date: string;
  note?: string;
}

export interface RequestRecord {
  id: string;
  requestedBy: string;
  department: string;
  subDepartment?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  priority: RequestPriority;
  date: string;
  status: RequestStatus;
  reason?: string;
}

export interface PurchaseOrderItem {
  name: string;
  qty: number;
  cost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  department: string;
  items: PurchaseOrderItem[];
  amount: number;
  orderDate: string;
  expectedDelivery: string;
  status: POStatus;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  categories: string[];
  itemsSupplied: number;
  purchaseOrders: number;
  totalSpend: number;
  status: "active" | "inactive";
  rating: number;
}

export interface Asset {
  id: string;
  assetId: string;
  name: string;
  serialNumber: string;
  category: string;
  department: string;
  assignedTo?: string;
  location: string;
  purchaseDate: string;
  cost: number;
  warranty: string;
  condition: AssetCondition;
  status: AssetStatus;
  // Extended fields for detailed asset information
  hardware?: {
    cpu: string;
    ram: string;
    storage: string;
    gpu: string;
    display: string;
    battery: string;
    network: string;
  };
  software?: Array<{
    name: string;
    version: string;
    licenseStatus: string;
  }>;
  warrantyDetails?: {
    provider: string;
    status: "Active" | "Expiring Soon" | "Expired";
    startDate: string;
    expiryDate: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string;
  items: number;
  color: string;
}

export interface Location {
  id: string;
  name: string;
  type: "warehouse" | "store" | "room" | "shelf";
  items: number;
  parent?: string;
}

export interface Transfer {
  id: string;
  transferNo: string;
  fromDepartment: string;
  toDepartment: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  requestedBy: string;
  date: string;
  status: TransferStatus;
  approvedBy?: string;
  approvalDate?: string;
}

export interface StockInRecord {
  id: number | string;
  workOrderId: string;
  jobNo: string;
  dateIn: string;
  dateOut: string | null;
  remarks: string | null;
  defect: string | null;
  technicianName: string | null;
  secIcName: string | null;
  itemId: string;
  itemName: string;
  productType: string;
  quantity: number;
  department: string;
  createdBy: string;
  status: "pending" | "Stock Out" | "cancelled";
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  module: string;
  item: string;
  department: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  type: "info" | "success" | "warning" | "danger";
}

export interface DemoAccount {
  email: string;
  password: string;
  role: Role;
  name: string;
  department?: string;
}

export type PageSection =
  | "Overview"
  | "Inventory"
  | "Stock In"
  | "Stock Out"
  | "Transfers"
  | "Adjustments"
  | "Operations"
  | "Requests"
  | "Tickets"
  | "Purchase Orders"
  | "Suppliers"
  | "Assets"
  | "Categories"
  | "Locations"
  | "Organization"
  | "Departments"
  | "Users"
  | "Analytics"
  | "Reports"
  | "System"
  | "Activity Log"
  | "Settings"
  | "Technicians";

export interface Technician {
  id: string;
  name: string;
  email: string;
  /** Login password (demo plain-text). Defaults to TECHNICIAN_DEMO_PASSWORD. */
  password?: string;
  employeeId: string;
  specialization: string;
  availability: "Available" | "Busy" | "Offline";
  status: "Active" | "Inactive";
  activeTickets: number;
  resolvedTickets: number;
  phone?: string;
  lastActive?: string;
  color?: string;
}
