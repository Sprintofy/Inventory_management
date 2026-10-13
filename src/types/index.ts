export type Role = "super-admin" | "admin" | "department-manager" | "department-user" | "viewer" | "technician";

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

export interface TicketIssue {
  id: string;
  assetId?: string;
  title: string;
  description?: string;
  priority: RequestPriority;
  status: IssueStatus;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface TicketAsset {
  id: string;
  assetId: string;
  serialNumber?: string;
  itemType: string;
  name: string;
  currentLocation: string;
  previousLocation?: string;
  status: TicketAssetStatus;
  checkInDate?: string;
  checkOutDate?: string;
  notes?: string;
}

export interface AssetMovement {
  id: string;
  ticketId: string;
  assetId: string;
  serialNumber?: string;
  itemType: string;
  itemName: string;
  movementType: MovementType;
  fromLocation: string;
  toLocation: string;
  performedBy: string;
  date: string;
  remarks?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  customer?: string;
  category: string;
  priority: RequestPriority;
  department: string;
  subDepartment?: string;
  createdBy: string;
  createdAt: string;
  status: TicketStatus;
  assets: TicketAsset[];
  issues: TicketIssue[];
  closedBy?: string;
  closedAt?: string;
  resolution?: string;
  technicianId?: string;
  technicianRemark?: string;
  completedAt?: string;
  /** When the technician last submitted the ticket back to the Admin as solved. */
  submittedAt?: string;
  /** How many times the Admin has sent this ticket back to the technician. */
  reissueCount?: number;
  /** Why the Admin re-issued the ticket the last time. */
  lastReissueNote?: string;
}

export interface SubDepartment {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  manager: string;
  users: number;
  status: "active" | "inactive";
  color: string;
  children: SubDepartment[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
  users: number;
  status: "active" | "inactive";
  color: string;
  subDepartments: SubDepartment[];
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  description?: string;
  department: string;
  subDepartment?: string;
  location: string;
  quantity: number;
  unit: string;
  minStock: number;
  reorderLevel: number;
  maxStock: number;
  unitCost: number;
  supplier?: string;
  serialNumber?: string;
  assetNumber?: string;
  batchNumber?: string;
  condition?: string;
  warranty?: string;
  notes?: string;
  status: StockStatus;
  lastUpdated: string;
  createdAt: string;
  archived?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
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
  id: string;
  reference: string;
  date: string;
  supplier: string;
  itemName: string;
  items: number;
  quantity: number;
  department: string;
  createdBy: string;
  status: "received" | "pending" | "cancelled";
}

export interface StockOutRecord {
  id: string;
  reference: string;
  date: string;
  itemName: string;
  recipient: string;
  department: string;
  purpose: string;
  quantity: number;
  status: "issued" | "pending" | "cancelled";
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
