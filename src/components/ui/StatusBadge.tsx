import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  "in-stock": { label: "In Stock", variant: "success" },
  "low-stock": { label: "Low Stock", variant: "warning" },
  "out-of-stock": { label: "Out of Stock", variant: "danger" },
  overstock: { label: "Overstock", variant: "info" },
  available: { label: "Available", variant: "success" },
  assigned: { label: "Assigned", variant: "info" },
  "under-repair": { label: "Under Repair", variant: "warning" },
  damaged: { label: "Damaged", variant: "danger" },
  lost: { label: "Lost", variant: "neutral" },
  retired: { label: "Retired", variant: "neutral" },
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  "in-transit": { label: "In Transit", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  "partially-fulfilled": { label: "Partially Fulfilled", variant: "info" },
  draft: { label: "Draft", variant: "neutral" },
  "pending-approval": { label: "Pending Approval", variant: "warning" },
  ordered: { label: "Ordered", variant: "info" },
  "partially-received": { label: "Partially Received", variant: "info" },
  received: { label: "Received", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
  invited: { label: "Invited", variant: "info" },
  issued: { label: "Issued", variant: "success" },
  open: { label: "Open", variant: "info" },
  "in-progress": { label: "In Progress", variant: "warning" },
  "partially-resolved": { label: "Partially Resolved", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  "work-completed": { label: "Solved — Awaiting Review", variant: "success" },
  "closed": { label: "Closed", variant: "neutral" },
  in: { label: "Checked In", variant: "success" },
  out: { label: "Checked Out", variant: "info" },
  "stock-in": { label: "Stock In", variant: "success" },
  "stock-out": { label: "Stock Out", variant: "info" },
  transfer: { label: "Transfer", variant: "warning" },
  adjustment: { label: "Adjustment", variant: "neutral" },
  low: { label: "Low", variant: "neutral" },
  medium: { label: "Medium", variant: "info" },
  high: { label: "High", variant: "warning" },
  critical: { label: "Critical", variant: "danger" },
  "super-admin": { label: "Super Admin", variant: "danger" },
  admin: { label: "Admin", variant: "info" },
  "department-manager": { label: "Department", variant: "warning" },
  "department-user": { label: "Department User", variant: "neutral" },
  viewer: { label: "Viewer", variant: "neutral" },
  technician: { label: "Technician", variant: "info" },
  new: { label: "New", variant: "success" },
  good: { label: "Good", variant: "success" },
  fair: { label: "Fair", variant: "warning" },
  poor: { label: "Poor", variant: "danger" },
};

export function StatusBadge({ status, className, dot = true }: { status: string; className?: string; dot?: boolean }) {
  const entry = statusMap[status.toLowerCase()] ?? { label: status, variant: "neutral" as StatusVariant };
  return (
    <Badge variant={entry.variant} className={cn("gap-1.5 font-medium", className)}>
      {dot && <span className={cn("size-1.5 rounded-full bg-current")} />}
      {entry.label}
    </Badge>
  );
}
