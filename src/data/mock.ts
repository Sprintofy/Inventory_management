import type {
  Activity,
  Asset,
  AssetMovement,
  Category,
  Department,
  InventoryItem,
  Location,
  PurchaseOrder,
  RequestRecord,
  StockInRecord,
  StockOutRecord,
  StockTransaction,
  Supplier,
  Ticket,
  TicketAsset,
  TicketIssue,
  Transfer,
  User,
  Technician,
  DemoAccount,
  NotificationItem,
} from "@/types";

function iso(offsetMs: number) {
  return new Date(Date.now() - offsetMs).toISOString();
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const departments: Department[] = [
  {
    id: "dep-it", name: "IT", code: "IT", manager: "Priya Sharma", users: 28, status: "active", color: "#4f46e5",
    subDepartments: [
      {
        id: "sub-it-hw", departmentId: "dep-it", name: "Hardware Support", code: "IT-HW", manager: "Aditya Patel", users: 8, status: "active", color: "#6366f1",
        children: [
          { id: "sub-it-hw-prn", departmentId: "dep-it", name: "Printer & Peripherals", code: "IT-HW-PP", manager: "Aditya Patel", users: 3, status: "active", color: "#818cf8", children: [] },
          { id: "sub-it-hw-wrk", departmentId: "dep-it", name: "Workstation Repair", code: "IT-HW-WR", manager: "Aditya Patel", users: 5, status: "active", color: "#a5b4fc", children: [] },
        ],
      },
      {
        id: "sub-it-sw", departmentId: "dep-it", name: "Software Support", code: "IT-SW", manager: "Neha Kulkarni", users: 10, status: "active", color: "#8b5cf6",
        children: [
          {
            id: "sub-it-sw-erp", departmentId: "dep-it", name: "ERP & Business Apps", code: "IT-SW-ERP", manager: "Neha Kulkarni", users: 4, status: "active", color: "#a78bfa",
            children: [
              { id: "sub4-it-sw-erp-sap", departmentId: "dep-it", name: "SAP Support", code: "IT-SW-ERP-SAP", manager: "Neha Kulkarni", users: 2, status: "active", color: "#c4b5fd", children: [] },
              { id: "sub4-it-sw-erp-tly", departmentId: "dep-it", name: "Tally Support", code: "IT-SW-ERP-TLY", manager: "Neha Kulkarni", users: 2, status: "active", color: "#ddd6fe", children: [] },
            ],
          },
          { id: "sub-it-sw-off", departmentId: "dep-it", name: "Office Suite Support", code: "IT-SW-OS", manager: "Neha Kulkarni", users: 3, status: "active", color: "#c4b5fd", children: [] },
          { id: "sub-it-sw-osd", departmentId: "dep-it", name: "OS & Drivers", code: "IT-SW-OD", manager: "Neha Kulkarni", users: 3, status: "active", color: "#ddd6fe", children: [] },
        ],
      },
      {
        id: "sub-it-net", departmentId: "dep-it", name: "Network & Security", code: "IT-NS", manager: "Priya Sharma", users: 6, status: "active", color: "#a855f7",
        children: [
          { id: "sub-it-net-ops", departmentId: "dep-it", name: "Network Operations", code: "IT-NS-NO", manager: "Priya Sharma", users: 4, status: "active", color: "#c084fc", children: [] },
          { id: "sub-it-net-sec", departmentId: "dep-it", name: "Cyber Security Monitoring", code: "IT-NS-CS", manager: "Priya Sharma", users: 2, status: "active", color: "#d8b4fe", children: [] },
        ],
      },
      { id: "sub-it-sys", departmentId: "dep-it", name: "Systems Administration", code: "IT-SA", manager: "Priya Sharma", users: 4, status: "inactive", color: "#6d28d9", children: [] },
    ],
  },
  {
    id: "dep-eng", name: "Engineering", code: "ENG", manager: "Rajesh Kumar", users: 42, status: "active", color: "#0ea5e9",
    subDepartments: [
      {
        id: "sub-eng-mech", departmentId: "dep-eng", name: "Mechanical Engineering", code: "ENG-ME", manager: "Farhan Ali", users: 16, status: "active", color: "#0ea5e9",
        children: [
          { id: "sub-eng-mech-des", departmentId: "dep-eng", name: "Machine Design", code: "ENG-ME-MD", manager: "Farhan Ali", users: 9, status: "active", color: "#38bdf8", children: [] },
          { id: "sub-eng-mech-tool", departmentId: "dep-eng", name: "Tooling Engineering", code: "ENG-ME-TE", manager: "Farhan Ali", users: 7, status: "active", color: "#7dd3fc", children: [] },
        ],
      },
      {
        id: "sub-eng-elec", departmentId: "dep-eng", name: "Electrical Engineering", code: "ENG-EE", manager: "Divya Menon", users: 12, status: "active", color: "#06b6d4",
        children: [
          { id: "sub-eng-elec-ctl", departmentId: "dep-eng", name: "Control Systems", code: "ENG-EE-CS", manager: "Divya Menon", users: 7, status: "active", color: "#22d3ee", children: [] },
          { id: "sub-eng-elec-pwr", departmentId: "dep-eng", name: "Power Distribution", code: "ENG-EE-PD", manager: "Divya Menon", users: 5, status: "active", color: "#67e8f9", children: [] },
        ],
      },
      {
        id: "sub-eng-design", departmentId: "dep-eng", name: "Design & R&D", code: "ENG-DR", manager: "Rajesh Kumar", users: 9, status: "active", color: "#22d3ee",
        children: [
          { id: "sub-eng-design-pd", departmentId: "dep-eng", name: "Product Design", code: "ENG-DR-PD", manager: "Rajesh Kumar", users: 5, status: "active", color: "#67e8f9", children: [] },
          { id: "sub-eng-design-lab", departmentId: "dep-eng", name: "Prototyping Lab", code: "ENG-DR-PL", manager: "Rajesh Kumar", users: 4, status: "active", color: "#a5f3fc", children: [] },
        ],
      },
      { id: "sub-eng-qa", departmentId: "dep-eng", name: "Quality Assurance", code: "ENG-QA", manager: "Rohan Gupta", users: 5, status: "inactive", color: "#0891b2", children: [] },
    ],
  },
  {
    id: "dep-admin", name: "Administration", code: "ADM", manager: "Anita Desai", users: 18, status: "active", color: "#10b981",
    subDepartments: [
      {
        id: "sub-adm-office", departmentId: "dep-admin", name: "Office Management", code: "ADM-OM", manager: "Anita Desai", users: 9, status: "active", color: "#10b981",
        children: [
          { id: "sub-adm-office-fo", departmentId: "dep-admin", name: "Front Office", code: "ADM-OM-FO", manager: "Anita Desai", users: 5, status: "active", color: "#34d399", children: [] },
          { id: "sub-adm-office-rec", departmentId: "dep-admin", name: "Records & Archives", code: "ADM-OM-RA", manager: "Anita Desai", users: 4, status: "active", color: "#6ee7b7", children: [] },
        ],
      },
      {
        id: "sub-adm-fac", departmentId: "dep-admin", name: "Facilities", code: "ADM-FC", manager: "Anita Desai", users: 6, status: "active", color: "#34d399",
        children: [
          { id: "sub-adm-fac-hk", departmentId: "dep-admin", name: "Housekeeping", code: "ADM-FC-HK", manager: "Anita Desai", users: 4, status: "active", color: "#6ee7b7", children: [] },
          { id: "sub-adm-fac-ss", departmentId: "dep-admin", name: "Site Services", code: "ADM-FC-SS", manager: "Anita Desai", users: 2, status: "active", color: "#a7f3d0", children: [] },
        ],
      },
      { id: "sub-adm-recep", departmentId: "dep-admin", name: "Reception & Front Desk", code: "ADM-RF", manager: "Anita Desai", users: 3, status: "active", color: "#6ee7b7", children: [] },
    ],
  },
  {
    id: "dep-log", name: "Logistics", code: "LOG", manager: "Vikram Singh", users: 35, status: "active", color: "#f59e0b",
    subDepartments: [
      {
        id: "sub-log-wh", departmentId: "dep-log", name: "Warehouse Operations", code: "LOG-WH", manager: "Karan Johar", users: 18, status: "active", color: "#f59e0b",
        children: [
          { id: "sub-log-wh-rec", departmentId: "dep-log", name: "Goods Receiving", code: "LOG-WH-GR", manager: "Karan Johar", users: 7, status: "active", color: "#fbbf24", children: [] },
          { id: "sub-log-wh-dis", departmentId: "dep-log", name: "Goods Dispatch", code: "LOG-WH-GD", manager: "Karan Johar", users: 6, status: "active", color: "#fcd34d", children: [] },
          { id: "sub-log-wh-sto", departmentId: "dep-log", name: "Storage & Racking", code: "LOG-WH-SR", manager: "Karan Johar", users: 5, status: "active", color: "#fde68a", children: [] },
        ],
      },
      {
        id: "sub-log-trans", departmentId: "dep-log", name: "Transport & Dispatch", code: "LOG-TD", manager: "Vikram Singh", users: 12, status: "active", color: "#fbbf24",
        children: [
          { id: "sub-log-trans-fle", departmentId: "dep-log", name: "Vehicle Fleet", code: "LOG-TD-VF", manager: "Vikram Singh", users: 8, status: "active", color: "#fcd34d", children: [] },
          { id: "sub-log-trans-rou", departmentId: "dep-log", name: "Delivery Routing", code: "LOG-TD-DR", manager: "Vikram Singh", users: 4, status: "active", color: "#fde68a", children: [] },
        ],
      },
      {
        id: "sub-log-inv", departmentId: "dep-log", name: "Inventory Control", code: "LOG-IC", manager: "Vikram Singh", users: 5, status: "active", color: "#fcd34d",
        children: [
          { id: "sub-log-inv-aud", departmentId: "dep-log", name: "Stock Audits", code: "LOG-IC-SA", manager: "Vikram Singh", users: 3, status: "active", color: "#fde68a", children: [] },
          { id: "sub-log-inv-cyc", departmentId: "dep-log", name: "Cycle Counting", code: "LOG-IC-CC", manager: "Vikram Singh", users: 2, status: "active", color: "#fef9c3", children: [] },
        ],
      },
    ],
  },
  {
    id: "dep-maint", name: "Maintenance", code: "MNT", manager: "Suresh Nair", users: 26, status: "active", color: "#ef4444",
    subDepartments: [
      {
        id: "sub-mnt-mach", departmentId: "dep-maint", name: "Machine Maintenance", code: "MNT-MM", manager: "Suresh Nair", users: 12, status: "active", color: "#ef4444",
        children: [
          { id: "sub-mnt-mach-pm", departmentId: "dep-maint", name: "Preventive Maintenance", code: "MNT-MM-PM", manager: "Suresh Nair", users: 7, status: "active", color: "#f87171", children: [] },
          { id: "sub-mnt-mach-br", departmentId: "dep-maint", name: "Breakdown Repairs", code: "MNT-MM-BR", manager: "Suresh Nair", users: 5, status: "active", color: "#fca5a5", children: [] },
        ],
      },
      {
        id: "sub-mnt-bldg", departmentId: "dep-maint", name: "Building Maintenance", code: "MNT-BM", manager: "Suresh Nair", users: 8, status: "active", color: "#f87171",
        children: [
          { id: "sub-mnt-bldg-hvac", departmentId: "dep-maint", name: "HVAC & Utilities", code: "MNT-BM-HU", manager: "Suresh Nair", users: 5, status: "active", color: "#fca5a5", children: [] },
          { id: "sub-mnt-bldg-civ", departmentId: "dep-maint", name: "Civil Repairs", code: "MNT-BM-CR", manager: "Suresh Nair", users: 3, status: "active", color: "#fecaca", children: [] },
        ],
      },
      { id: "sub-mnt-elect", departmentId: "dep-maint", name: "Electrical & Plumbing", code: "MNT-EP", manager: "Pooja Reddy", users: 6, status: "active", color: "#fca5a5", children: [] },
    ],
  },
  {
    id: "dep-train", name: "Training", code: "TRN", manager: "Meera Iyer", users: 12, status: "active", color: "#8b5cf6",
    subDepartments: [
      { id: "sub-trn-onb", departmentId: "dep-train", name: "Onboarding & Induction", code: "TRN-OI", manager: "Meera Iyer", users: 4, status: "active", color: "#8b5cf6", children: [] },
      {
        id: "sub-trn-tech", departmentId: "dep-train", name: "Technical Training", code: "TRN-TT", manager: "Meera Iyer", users: 5, status: "active", color: "#a78bfa",
        children: [
          { id: "sub-trn-tech-mach", departmentId: "dep-train", name: "Machinery Training", code: "TRN-TT-MT", manager: "Meera Iyer", users: 3, status: "active", color: "#c4b5fd", children: [] },
          { id: "sub-trn-tech-saf", departmentId: "dep-train", name: "Safety Training", code: "TRN-TT-ST", manager: "Meera Iyer", users: 2, status: "active", color: "#ddd6fe", children: [] },
        ],
      },
      { id: "sub-trn-lab", departmentId: "dep-train", name: "Training Lab", code: "TRN-LB", manager: "Meera Iyer", users: 3, status: "active", color: "#c4b5fd", children: [] },
    ],
  },
  {
    id: "dep-fin", name: "Finance", code: "FIN", manager: "Arun Mehta", users: 15, status: "active", color: "#14b8a6",
    subDepartments: [
      {
        id: "sub-fin-acct", departmentId: "dep-fin", name: "Accounting", code: "FIN-AC", manager: "Arun Mehta", users: 7, status: "active", color: "#14b8a6",
        children: [
          { id: "sub-fin-acct-gl", departmentId: "dep-fin", name: "General Ledger", code: "FIN-AC-GL", manager: "Arun Mehta", users: 3, status: "active", color: "#2dd4bf", children: [] },
          { id: "sub-fin-acct-ap", departmentId: "dep-fin", name: "Accounts Payable", code: "FIN-AC-AP", manager: "Arun Mehta", users: 2, status: "active", color: "#5eead4", children: [] },
          { id: "sub-fin-acct-ar", departmentId: "dep-fin", name: "Accounts Receivable", code: "FIN-AC-AR", manager: "Arun Mehta", users: 2, status: "active", color: "#99f6e4", children: [] },
        ],
      },
      {
        id: "sub-fin-bud", departmentId: "dep-fin", name: "Budgeting & Planning", code: "FIN-BP", manager: "Arun Mehta", users: 4, status: "active", color: "#2dd4bf",
        children: [
          { id: "sub-fin-bud-cap", departmentId: "dep-fin", name: "Capital Planning", code: "FIN-BP-CP", manager: "Arun Mehta", users: 2, status: "active", color: "#5eead4", children: [] },
          { id: "sub-fin-bud-cst", departmentId: "dep-fin", name: "Cost Control", code: "FIN-BP-CC", manager: "Arun Mehta", users: 2, status: "active", color: "#99f6e4", children: [] },
        ],
      },
      { id: "sub-fin-proc", departmentId: "dep-fin", name: "Procurement Finance", code: "FIN-PF", manager: "Arun Mehta", users: 4, status: "active", color: "#5eead4", children: [] },
    ],
  },
  {
    id: "dep-hr", name: "Human Resources", code: "HR", manager: "Kavita Rao", users: 14, status: "active", color: "#f43f5e",
    subDepartments: [
      {
        id: "sub-hr-rec", departmentId: "dep-hr", name: "Recruitment", code: "HR-RC", manager: "Kavita Rao", users: 5, status: "active", color: "#f43f5e",
        children: [
          { id: "sub-hr-rec-src", departmentId: "dep-hr", name: "Sourcing & Screening", code: "HR-RC-SS", manager: "Kavita Rao", users: 3, status: "active", color: "#fb7185", children: [] },
          { id: "sub-hr-rec-int", departmentId: "dep-hr", name: "Interview Scheduling", code: "HR-RC-IS", manager: "Kavita Rao", users: 2, status: "active", color: "#fda4af", children: [] },
        ],
      },
      {
        id: "sub-hr-pay", departmentId: "dep-hr", name: "Payroll & Benefits", code: "HR-PB", manager: "Kavita Rao", users: 5, status: "active", color: "#fb7185",
        children: [
          { id: "sub-hr-pay-pro", departmentId: "dep-hr", name: "Payroll Processing", code: "HR-PB-PP", manager: "Kavita Rao", users: 3, status: "active", color: "#fda4af", children: [] },
          { id: "sub-hr-pay-ben", departmentId: "dep-hr", name: "Benefits Administration", code: "HR-PB-BA", manager: "Kavita Rao", users: 2, status: "active", color: "#fecdd3", children: [] },
        ],
      },
      { id: "sub-hr-train", departmentId: "dep-hr", name: "Employee Relations", code: "HR-ER", manager: "Kavita Rao", users: 4, status: "active", color: "#fda4af", children: [] },
    ],
  },
  {
    id: "dep-proc", name: "Procurement", code: "PRC", manager: "Deepak Verma", users: 11, status: "active", color: "#6366f1",
    subDepartments: [
      {
        id: "sub-prc-buy", departmentId: "dep-proc", name: "Buying & Sourcing", code: "PRC-BS", manager: "Deepak Verma", users: 5, status: "active", color: "#6366f1",
        children: [
          { id: "sub-prc-buy-raw", departmentId: "dep-proc", name: "Raw Material Buying", code: "PRC-BS-RM", manager: "Deepak Verma", users: 3, status: "active", color: "#818cf8", children: [] },
          { id: "sub-prc-buy-ind", departmentId: "dep-proc", name: "Indirect Spend", code: "PRC-BS-IS", manager: "Deepak Verma", users: 2, status: "active", color: "#a5b4fc", children: [] },
        ],
      },
      {
        id: "sub-prc-vend", departmentId: "dep-proc", name: "Vendor Management", code: "PRC-VM", manager: "Deepak Verma", users: 3, status: "active", color: "#818cf8",
        children: [
          { id: "sub-prc-vend-onb", departmentId: "dep-proc", name: "Vendor Onboarding", code: "PRC-VM-VO", manager: "Deepak Verma", users: 2, status: "active", color: "#a5b4fc", children: [] },
          { id: "sub-prc-vend-per", departmentId: "dep-proc", name: "Vendor Performance", code: "PRC-VM-VP", manager: "Deepak Verma", users: 1, status: "active", color: "#c7d2fe", children: [] },
        ],
      },
      { id: "sub-prc-cont", departmentId: "dep-proc", name: "Contracts & Compliance", code: "PRC-CC", manager: "Deepak Verma", users: 3, status: "active", color: "#a5b4fc", children: [] },
    ],
  },
  {
    id: "dep-ops", name: "Operations", code: "OPS", manager: "Sanjay Gupta", users: 31, status: "active", color: "#84cc16",
    subDepartments: [
      {
        id: "sub-ops-prod", departmentId: "dep-ops", name: "Production", code: "OPS-PD", manager: "Sanjay Gupta", users: 18, status: "active", color: "#84cc16",
        children: [
          { id: "sub-ops-prod-pln", departmentId: "dep-ops", name: "Production Planning", code: "OPS-PD-PP", manager: "Sanjay Gupta", users: 8, status: "active", color: "#a3e635", children: [] },
          { id: "sub-ops-prod-sfc", departmentId: "dep-ops", name: "Shop Floor Control", code: "OPS-PD-SF", manager: "Sanjay Gupta", users: 10, status: "active", color: "#bef264", children: [] },
        ],
      },
      {
        id: "sub-ops-safety", departmentId: "dep-ops", name: "Safety & Compliance", code: "OPS-SC", manager: "Sanjay Gupta", users: 7, status: "active", color: "#a3e635",
        children: [
          { id: "sub-ops-safety-ins", departmentId: "dep-ops", name: "Safety Inspections", code: "OPS-SC-SI", manager: "Sanjay Gupta", users: 4, status: "active", color: "#bef264", children: [] },
          { id: "sub-ops-safety-inc", departmentId: "dep-ops", name: "Incident Management", code: "OPS-SC-IM", manager: "Sanjay Gupta", users: 3, status: "active", color: "#d9f99d", children: [] },
        ],
      },
      { id: "sub-ops-qa", departmentId: "dep-ops", name: "Operations Quality", code: "OPS-OQ", manager: "Sanjay Gupta", users: 6, status: "active", color: "#bef264", children: [] },
    ],
  },
];

export const categories: Category[] = [
  { id: "cat-it", name: "IT Equipment", description: "Computers, peripherals, networking hardware", items: 245, color: "#4f46e5" },
  { id: "cat-office", name: "Office Equipment", description: "Furniture, stationery, office machines", items: 382, color: "#0ea5e9" },
  { id: "cat-tools", name: "Tools", description: "Hand tools, power tools, measurement", items: 1240, color: "#10b981" },
  { id: "cat-spare", name: "Spare Parts", description: "Machine spares, consumables, components", items: 4820, color: "#f59e0b" },
  { id: "cat-safety", name: "Safety Equipment", description: "PPE, fire safety, first aid", items: 312, color: "#ef4444" },
  { id: "cat-clean", name: "Cleaning Supplies", description: "Industrial and office cleaning", items: 156, color: "#8b5cf6" },
  { id: "cat-electrical", name: "Electrical", description: "Cables, switches, lighting", items: 890, color: "#14b8a6" },
  { id: "cat-stationery", name: "Stationery", description: "Office consumables and printing", items: 430, color: "#6366f1" },
];

export const locations: Location[] = [
  { id: "loc-main", name: "Main Warehouse", type: "warehouse", items: 1245 },
  { id: "loc-it", name: "IT Store", type: "store", items: 582 },
  { id: "loc-eng", name: "Engineering Store", type: "store", items: 921 },
  { id: "loc-log", name: "Logistics Bay", type: "warehouse", items: 730 },
  { id: "loc-admin", name: "Administration Room", type: "room", items: 148 },
  { id: "loc-server", name: "Server Room", type: "room", items: 96 },
  { id: "loc-train", name: "Training Lab", type: "room", items: 210 },
  { id: "loc-tool", name: "Tool Shed", type: "store", items: 445 },
  { id: "loc-spares", name: "Spares Rack A", type: "shelf", items: 820 },
  { id: "loc-spares-b", name: "Spares Rack B", type: "shelf", items: 610 },
  { id: "loc-maint", name: "Maintenance Workshop", type: "room", items: 350 },
];

const depColor = (name: string) => departments.find((d) => d.name === name)?.color ?? "#6b7280";

const subDepartmentMap: Record<string, Record<string, string>> = {
  IT: {
    Laptops: "Hardware Support",
    Monitors: "Hardware Support",
    Printers: "Hardware Support",
    Peripherals: "Hardware Support",
    Tablets: "Hardware Support",
    "AV Equipment": "Hardware Support",
    Storage: "Hardware Support",
    Networking: "Network & Security",
    Power: "Network & Security",
    Cables: "Network & Security",
  },
  Engineering: {
    Laptops: "Design & R&D",
    Lubricants: "Mechanical Engineering",
    Fasteners: "Mechanical Engineering",
    Bearings: "Mechanical Engineering",
    Belts: "Mechanical Engineering",
    Consumables: "Mechanical Engineering",
    Filters: "Mechanical Engineering",
    Seals: "Mechanical Engineering",
    Lubrication: "Mechanical Engineering",
  },
  Administration: {
    Paper: "Office Management",
    Pens: "Office Management",
    Notes: "Office Management",
    Printing: "Office Management",
    Furniture: "Office Management",
    Machines: "Office Management",
    Chemicals: "Facilities",
    Equipment: "Facilities",
    Consumables: "Facilities",
  },
  Maintenance: {
    "Power Tools": "Machine Maintenance",
    Measurement: "Machine Maintenance",
    "Hand Tools": "Machine Maintenance",
    Lubrication: "Machine Maintenance",
    Cables: "Electrical & Plumbing",
    Switches: "Electrical & Plumbing",
    Lighting: "Electrical & Plumbing",
    Power: "Electrical & Plumbing",
  },
  Operations: {
    "Fire Safety": "Safety & Compliance",
    "First Aid": "Safety & Compliance",
    PPE: "Safety & Compliance",
  },
  Logistics: {
    "Material Handling": "Warehouse Operations",
    Packaging: "Warehouse Operations",
    Traffic: "Warehouse Operations",
  },
  Training: {
    Tablets: "Training Lab",
    "AV Equipment": "Training Lab",
    Display: "Training Lab",
  },
  Finance: {
    Laptops: "Accounting",
  },
};

function subDepartmentFor(department: string, subcategory?: string): string | undefined {
  return subcategory ? subDepartmentMap[department]?.[subcategory] : undefined;
}

const heroItems: InventoryItem[] = [
  {
    id: "INV-001",
    name: "MacBook Pro 14\"",
    sku: "IT-DEV-001",
    category: "IT Equipment",
    subcategory: "Laptops",
    description: "Apple MacBook Pro 14-inch, M3 Pro chip, 18GB RAM, 512GB SSD",
    department: "IT",
    location: "Main Warehouse",
    quantity: 24,
    unit: "unit",
    minStock: 5,
    reorderLevel: 10,
    maxStock: 60,
    unitCost: 145000,
    supplier: "TechNova Distributors",
    condition: "New",
    warranty: "12 months",
    notes: "Standard developer machine",
    status: "in-stock",
    lastUpdated: iso(3 * HOUR),
    createdAt: iso(210 * DAY),
  },
  {
    id: "INV-002",
    name: "Dell UltraSharp 27\" Monitor",
    sku: "IT-DSP-014",
    category: "IT Equipment",
    subcategory: "Monitors",
    description: "Dell UltraSharp U2723QE 4K USB-C Hub Monitor",
    department: "IT",
    location: "IT Store",
    quantity: 58,
    unit: "unit",
    minStock: 10,
    reorderLevel: 20,
    maxStock: 120,
    unitCost: 42000,
    supplier: "TechNova Distributors",
    condition: "New",
    warranty: "36 months",
    status: "in-stock",
    lastUpdated: iso(1 * DAY),
    createdAt: iso(180 * DAY),
  },
  {
    id: "INV-003",
    name: "HP LaserJet Pro M404dn",
    sku: "IT-PRT-008",
    category: "IT Equipment",
    subcategory: "Printers",
    description: "HP LaserJet Pro M404dn monochrome laser printer",
    department: "Administration",
    location: "Administration Room",
    quantity: 4,
    unit: "unit",
    minStock: 2,
    reorderLevel: 3,
    maxStock: 12,
    unitCost: 28000,
    supplier: "OfficeWorld Supplies",
    status: "low-stock",
    lastUpdated: iso(2 * DAY),
    createdAt: iso(320 * DAY),
  },
  {
    id: "INV-004",
    name: "A4 Paper (500 sheets, Ream)",
    sku: "OFF-PPR-001",
    category: "Stationery",
    subcategory: "Paper",
    description: "Premium A4 copier paper, 75 gsm, 500 sheets per ream",
    department: "Administration",
    location: "Administration Room",
    quantity: 640,
    unit: "ream",
    minStock: 100,
    reorderLevel: 200,
    maxStock: 1500,
    unitCost: 350,
    supplier: "OfficeWorld Supplies",
    status: "in-stock",
    lastUpdated: iso(5 * HOUR),
    createdAt: iso(90 * DAY),
  },
  {
    id: "INV-005",
    name: 'Makita Cordless Drill 18V',
    sku: "TLS-DRL-022",
    category: "Tools",
    subcategory: "Power Tools",
    description: "Makita DDF486 18V Li-ion cordless drill driver",
    department: "Maintenance",
    location: "Tool Shed",
    quantity: 12,
    unit: "unit",
    minStock: 4,
    reorderLevel: 6,
    maxStock: 30,
    unitCost: 12500,
    supplier: "IndustrialMart",
    condition: "Good",
    warranty: "24 months",
    status: "in-stock",
    lastUpdated: iso(6 * DAY),
    createdAt: iso(400 * DAY),
  },
  {
    id: "INV-006",
    name: "Bosch Angle Grinder GWS 750",
    sku: "TLS-GRD-007",
    category: "Tools",
    subcategory: "Power Tools",
    description: "Bosch GWS 750-100 angle grinder, 750W",
    department: "Maintenance",
    location: "Tool Shed",
    quantity: 2,
    unit: "unit",
    minStock: 3,
    reorderLevel: 5,
    maxStock: 20,
    unitCost: 8900,
    supplier: "IndustrialMart",
    condition: "Good",
    warranty: "12 months",
    status: "low-stock",
    lastUpdated: iso(4 * DAY),
    createdAt: iso(250 * DAY),
  },
  {
    id: "INV-007",
    name: "Hydraulic Oil 20L Drum",
    sku: "SPR-HYD-018",
    category: "Spare Parts",
    subcategory: "Lubricants",
    description: "ISO VG 68 hydraulic oil, 20 litre drum",
    department: "Engineering",
    location: "Engineering Store",
    quantity: 0,
    unit: "drum",
    minStock: 5,
    reorderLevel: 10,
    maxStock: 60,
    unitCost: 6400,
    supplier: "PetroSupply Co.",
    batchNumber: "B-2026-041",
    status: "out-of-stock",
    lastUpdated: iso(12 * HOUR),
    createdAt: iso(150 * DAY),
  },
  {
    id: "INV-008",
    name: "Safety Helmet (White)",
    sku: "SFT-HLM-003",
    category: "Safety Equipment",
    subcategory: "PPE",
    description: "ISI certified industrial safety helmet, white",
    department: "Operations",
    location: "Main Warehouse",
    quantity: 340,
    unit: "unit",
    minStock: 50,
    reorderLevel: 100,
    maxStock: 800,
    unitCost: 480,
    supplier: "SafeGuard PPE",
    status: "in-stock",
    lastUpdated: iso(3 * DAY),
    createdAt: iso(120 * DAY),
  },
  {
    id: "INV-009",
    name: 'Dell Latitude 7440 Laptop',
    sku: "IT-LPT-045",
    category: "IT Equipment",
    subcategory: "Laptops",
    description: "Dell Latitude 7440, i7-1365U, 16GB, 512GB SSD",
    department: "Engineering",
    location: "Engineering Store",
    quantity: 31,
    unit: "unit",
    minStock: 6,
    reorderLevel: 12,
    maxStock: 80,
    unitCost: 98500,
    supplier: "TechNova Distributors",
    status: "in-stock",
    lastUpdated: iso(18 * HOUR),
    createdAt: iso(140 * DAY),
  },
  {
    id: "INV-010",
    name: "Stainless Steel Fasteners M8x25",
    sku: "SPR-FST-112",
    category: "Spare Parts",
    subcategory: "Fasteners",
    description: "M8 x 25mm stainless steel hex bolts, pack of 100",
    department: "Engineering",
    location: "Spares Rack A",
    quantity: 1250,
    unit: "pack",
    minStock: 200,
    reorderLevel: 400,
    maxStock: 3000,
    unitCost: 1200,
    supplier: "MetalWorks Ltd.",
    batchNumber: "B-2026-038",
    status: "in-stock",
    lastUpdated: iso(2 * DAY),
    createdAt: iso(200 * DAY),
  },
];

const itemTemplates: Array<Omit<InventoryItem, "id" | "quantity" | "status" | "lastUpdated" | "createdAt" | "unitCost">> = [
  { name: 'Logitech MX Master 3S Mouse', sku: "IT-MSE-021", category: "IT Equipment", subcategory: "Peripherals", department: "IT", location: "IT Store", unit: "unit", minStock: 8, reorderLevel: 15, maxStock: 80, supplier: "TechNova Distributors", description: "Wireless performance mouse", serialNumber: "SN-MX3S-" },
  { name: 'Keychron K8 Pro Keyboard', sku: "IT-KBD-033", category: "IT Equipment", subcategory: "Peripherals", department: "IT", location: "IT Store", unit: "unit", minStock: 5, reorderLevel: 10, maxStock: 50, supplier: "TechNova Distributors", description: "Mechanical keyboard, hot-swappable" },
  { name: "Cisco Catalyst 2960 Switch", sku: "IT-NTW-002", category: "IT Equipment", subcategory: "Networking", department: "IT", location: "Server Room", unit: "unit", minStock: 1, reorderLevel: 2, maxStock: 10, supplier: "NetCore Systems", description: "48-port gigabit managed switch", serialNumber: "SN-C2960-" },
  { name: "Ubiquiti UniFi AP AC Pro", sku: "IT-NTW-011", category: "IT Equipment", subcategory: "Networking", department: "IT", location: "Server Room", unit: "unit", minStock: 3, reorderLevel: 6, maxStock: 25, supplier: "NetCore Systems", description: "Dual-band enterprise access point", serialNumber: "SN-UAP-" },
  { name: "APC UPS 1500VA", sku: "IT-UPS-005", category: "IT Equipment", subcategory: "Power", department: "IT", location: "Server Room", unit: "unit", minStock: 2, reorderLevel: 4, maxStock: 15, supplier: "NetCore Systems", description: "Line-interactive UPS with AVR" },
  { name: 'Lenovo ThinkPad T14 Gen 4', sku: "IT-LPT-052", category: "IT Equipment", subcategory: "Laptops", department: "Finance", location: "Main Warehouse", unit: "unit", minStock: 4, reorderLevel: 8, maxStock: 40, supplier: "TechNova Distributors", description: "Ryzen 7 PRO, 16GB, 512GB SSD" },
  { name: 'iPad Air 11" 256GB', sku: "IT-TBL-009", category: "IT Equipment", subcategory: "Tablets", department: "Training", location: "Training Lab", unit: "unit", minStock: 3, reorderLevel: 5, maxStock: 20, supplier: "TechNova Distributors", description: "Tablet for training sessions" },
  { name: "Epson EB-X49 Projector", sku: "IT-PRJ-003", category: "IT Equipment", subcategory: "AV Equipment", department: "Training", location: "Training Lab", unit: "unit", minStock: 1, reorderLevel: 2, maxStock: 8, supplier: "OfficeWorld Supplies", description: "XGA 3600 lumen projector" },
  { name: "Poly Studio P15 Camera", sku: "IT-CAM-006", category: "IT Equipment", subcategory: "AV Equipment", department: "Administration", location: "Administration Room", unit: "unit", minStock: 2, reorderLevel: 3, maxStock: 12, supplier: "TechNova Distributors", description: "4K video bar for conference rooms" },
  { name: "Cat6 Patch Cable 3m", sku: "IT-CBL-101", category: "Electrical", subcategory: "Cables", department: "IT", location: "IT Store", unit: "box", minStock: 20, reorderLevel: 40, maxStock: 200, supplier: "NetCore Systems", description: "PVC jacket, UTP, 3 metre" },
  { name: "USB-C Dock Station", sku: "IT-DCK-014", category: "IT Equipment", subcategory: "Peripherals", department: "IT", location: "IT Store", unit: "unit", minStock: 5, reorderLevel: 10, maxStock: 60, supplier: "TechNova Distributors", description: "13-in-1 triple display dock" },
  { name: 'Samsung T7 1TB SSD', sku: "IT-STR-028", category: "IT Equipment", subcategory: "Storage", department: "IT", location: "IT Store", unit: "unit", minStock: 4, reorderLevel: 8, maxStock: 40, supplier: "TechNova Distributors", description: "Portable external SSD, USB 3.2" },
  { name: "Ergonomic Office Chair", sku: "OFF-FUR-011", category: "Office Equipment", subcategory: "Furniture", department: "Administration", location: "Administration Room", unit: "unit", minStock: 6, reorderLevel: 10, maxStock: 60, supplier: "OfficeWorld Supplies", description: "Mesh back, lumbar support, 5-year warranty" },
  { name: "Standing Desk 140cm", sku: "OFF-FUR-024", category: "Office Equipment", subcategory: "Furniture", department: "Administration", location: "Main Warehouse", unit: "unit", minStock: 4, reorderLevel: 6, maxStock: 30, supplier: "OfficeWorld Supplies", description: "Electric height adjustable desk" },
  { name: "Paper Shredder (Cross-cut)", sku: "OFF-MCH-007", category: "Office Equipment", subcategory: "Machines", department: "Administration", location: "Administration Room", unit: "unit", minStock: 1, reorderLevel: 2, maxStock: 6, supplier: "OfficeWorld Supplies", description: "Security level P-4 shredder" },
  { name: "Whiteboard 4x6 ft", sku: "OFF-SPL-013", category: "Office Equipment", subcategory: "Display", department: "Training", location: "Training Lab", unit: "unit", minStock: 2, reorderLevel: 4, maxStock: 15, supplier: "OfficeWorld Supplies", description: "Magnetic dry-erase board with stand" },
  { name: "Ballpoint Pens (Box of 50)", sku: "OFF-STN-041", category: "Stationery", subcategory: "Pens", department: "Administration", location: "Administration Room", unit: "box", minStock: 30, reorderLevel: 50, maxStock: 300, supplier: "OfficeWorld Supplies", description: "Blue ink, 0.7mm tip" },
  { name: "Sticky Notes 3x3\" (Pack of 12)", sku: "OFF-STN-056", category: "Stationery", subcategory: "Notes", department: "Administration", location: "Administration Room", unit: "pack", minStock: 20, reorderLevel: 40, maxStock: 200, supplier: "OfficeWorld Supplies", description: "Assorted colours" },
  { name: "Laminating Pouches A4", sku: "OFF-STN-062", category: "Stationery", subcategory: "Printing", department: "Administration", location: "Administration Room", unit: "pack", minStock: 15, reorderLevel: 25, maxStock: 150, supplier: "OfficeWorld Supplies", description: "80 micron, pack of 100" },
  { name: 'DeWalt Impact Driver 20V', sku: "TLS-IMP-009", category: "Tools", subcategory: "Power Tools", department: "Maintenance", location: "Tool Shed", unit: "unit", minStock: 3, reorderLevel: 5, maxStock: 20, supplier: "IndustrialMart", description: "Brushless cordless impact driver" },
  { name: "Digital Multimeter Fluke 117", sku: "TLS-MSR-004", category: "Tools", subcategory: "Measurement", department: "Maintenance", location: "Maintenance Workshop", unit: "unit", minStock: 2, reorderLevel: 4, maxStock: 15, supplier: "IndustrialMart", description: "True-RMS multimeter with backlight", serialNumber: "SN-FLK117-" },
  { name: "Measuring Tape 5m", sku: "TLS-MSR-021", category: "Tools", subcategory: "Measurement", department: "Maintenance", location: "Maintenance Workshop", unit: "unit", minStock: 10, reorderLevel: 15, maxStock: 60, supplier: "IndustrialMart", description: "Steel blade, ABS case" },
  { name: "Pipe Wrench 24 inch", sku: "TLS-HND-033", category: "Tools", subcategory: "Hand Tools", department: "Maintenance", location: "Maintenance Workshop", unit: "unit", minStock: 4, reorderLevel: 6, maxStock: 25, supplier: "IndustrialMart", description: "Heavy-duty cast iron pipe wrench" },
  { name: "Claw Hammer 16oz", sku: "TLS-HND-047", category: "Tools", subcategory: "Hand Tools", department: "Maintenance", location: "Tool Shed", unit: "unit", minStock: 8, reorderLevel: 12, maxStock: 40, supplier: "IndustrialMart", description: "Fibreglass handle, anti-vibration" },
  { name: "Screwdriver Set (32 pcs)", sku: "TLS-HND-058", category: "Tools", subcategory: "Hand Tools", department: "Maintenance", location: "Tool Shed", unit: "set", minStock: 5, reorderLevel: 8, maxStock: 30, supplier: "IndustrialMart", description: "CRV steel, cushioned grips" },
  { name: "Cordless Circular Saw", sku: "TLS-SAW-006", category: "Tools", subcategory: "Power Tools", department: "Maintenance", location: "Tool Shed", unit: "unit", minStock: 2, reorderLevel: 3, maxStock: 10, supplier: "IndustrialMart", description: "18V brushless 165mm blade" },
  { name: "Grease Gun (Manual)", sku: "TLS-GUN-012", category: "Tools", subcategory: "Lubrication", department: "Engineering", location: "Engineering Store", unit: "unit", minStock: 3, reorderLevel: 5, maxStock: 15, supplier: "PetroSupply Co.", description: "Pistol grip, 400g cartridge" },
  { name: "Bearing 6205-2RS", sku: "SPR-BRG-034", category: "Spare Parts", subcategory: "Bearings", department: "Engineering", location: "Spares Rack A", unit: "unit", minStock: 20, reorderLevel: 40, maxStock: 200, supplier: "MetalWorks Ltd.", description: "Deep groove ball bearing, sealed" },
  { name: "V-Belt A-38", sku: "SPR-BLT-021", category: "Spare Parts", subcategory: "Belts", department: "Engineering", location: "Spares Rack A", unit: "unit", minStock: 15, reorderLevel: 30, maxStock: 150, supplier: "MetalWorks Ltd.", description: "Rubber V-belt for drive systems" },
  { name: "Cutting Disc 4 inch (Box 25)", sku: "SPR-CNS-066", category: "Spare Parts", subcategory: "Consumables", department: "Engineering", location: "Spares Rack B", unit: "box", minStock: 10, reorderLevel: 20, maxStock: 100, supplier: "MetalWorks Ltd.", description: "Metal cutting discs 4 inch" },
  { name: "Grinding Wheel 7 inch", sku: "SPR-CNS-071", category: "Spare Parts", subcategory: "Consumables", department: "Engineering", location: "Spares Rack B", unit: "unit", minStock: 8, reorderLevel: 15, maxStock: 60, supplier: "MetalWorks Ltd.", description: "Aluminium oxide grinding wheel" },
  { name: "Welding Electrodes 2.5mm (5kg)", sku: "SPR-WLD-013", category: "Spare Parts", subcategory: "Consumables", department: "Engineering", location: "Spares Rack B", unit: "box", minStock: 5, reorderLevel: 10, maxStock: 50, supplier: "MetalWorks Ltd.", description: "E6013 general purpose electrodes" },
  { name: "Oil Filter Element", sku: "SPR-FLT-029", category: "Spare Parts", subcategory: "Filters", department: "Engineering", location: "Spares Rack A", unit: "unit", minStock: 12, reorderLevel: 25, maxStock: 120, supplier: "PetroSupply Co.", description: "Hydraulic system filter element" },
  { name: "Air Filter Element", sku: "SPR-FLT-030", category: "Spare Parts", subcategory: "Filters", department: "Engineering", location: "Spares Rack A", unit: "unit", minStock: 12, reorderLevel: 25, maxStock: 120, supplier: "PetroSupply Co.", description: "Compressor air intake filter" },
  { name: "Rubber Gasket Sheet 3mm", sku: "SPR-GSK-018", category: "Spare Parts", subcategory: "Seals", department: "Engineering", location: "Spares Rack B", unit: "sheet", minStock: 10, reorderLevel: 20, maxStock: 80, supplier: "MetalWorks Ltd.", description: "1m x 1m nitrile rubber sheet" },
  { name: "Copper Wire 2.5sqmm (90m)", sku: "ELE-CBL-007", category: "Electrical", subcategory: "Cables", department: "Maintenance", location: "Maintenance Workshop", unit: "coil", minStock: 5, reorderLevel: 10, maxStock: 40, supplier: "ElectroWares", description: "FR PVC insulated copper wire" },
  { name: "MCB 16A Single Pole", sku: "ELE-MCB-021", category: "Electrical", subcategory: "Switches", department: "Maintenance", location: "Maintenance Workshop", unit: "unit", minStock: 10, reorderLevel: 20, maxStock: 80, supplier: "ElectroWares", description: "C-curve miniature circuit breaker" },
  { name: "LED Tube Light 18W", sku: "ELE-LGT-014", category: "Electrical", subcategory: "Lighting", department: "Maintenance", location: "Maintenance Workshop", unit: "unit", minStock: 20, reorderLevel: 40, maxStock: 150, supplier: "ElectroWares", description: "T8 4ft LED tube, cool white" },
  { name: "Extension Board 6 Socket", sku: "ELE-PWR-009", category: "Electrical", subcategory: "Power", department: "Maintenance", location: "Maintenance Workshop", unit: "unit", minStock: 8, reorderLevel: 15, maxStock: 60, supplier: "ElectroWares", description: "6-way surge protected power strip" },
  { name: "Fire Extinguisher ABC 4kg", sku: "SFT-FIR-002", category: "Safety Equipment", subcategory: "Fire Safety", department: "Operations", location: "Main Warehouse", unit: "unit", minStock: 5, reorderLevel: 10, maxStock: 40, supplier: "SafeGuard PPE", description: "Dry powder, ISI certified" },
  { name: "First Aid Kit (20 pcs)", sku: "SFT-FST-008", category: "Safety Equipment", subcategory: "First Aid", department: "Operations", location: "Main Warehouse", unit: "kit", minStock: 10, reorderLevel: 15, maxStock: 60, supplier: "SafeGuard PPE", description: "Industrial first aid kit" },
  { name: "Safety Goggles (Clear)", sku: "SFT-GGL-011", category: "Safety Equipment", subcategory: "PPE", department: "Operations", location: "Main Warehouse", unit: "unit", minStock: 30, reorderLevel: 50, maxStock: 250, supplier: "SafeGuard PPE", description: "Anti-fog polycarbonate goggles" },
  { name: "Safety Gloves Nitrile (Box 100)", sku: "SFT-GLV-017", category: "Safety Equipment", subcategory: "PPE", department: "Operations", location: "Main Warehouse", unit: "box", minStock: 15, reorderLevel: 30, maxStock: 150, supplier: "SafeGuard PPE", description: "Powder-free examination gloves" },
  { name: "Safety Boots Size 8", sku: "SFT-BTS-006", category: "Safety Equipment", subcategory: "PPE", department: "Operations", location: "Main Warehouse", unit: "pair", minStock: 10, reorderLevel: 20, maxStock: 80, supplier: "SafeGuard PPE", description: "Steel toe leather safety boots" },
  { name: "Reflective Safety Vest", sku: "SFT-VST-013", category: "Safety Equipment", subcategory: "PPE", department: "Logistics", location: "Logistics Bay", unit: "unit", minStock: 20, reorderLevel: 40, maxStock: 150, supplier: "SafeGuard PPE", description: "High visibility orange vest" },
  { name: "Industrial Floor Cleaner 5L", sku: "CLN-FLR-009", category: "Cleaning Supplies", subcategory: "Chemicals", department: "Administration", location: "Administration Room", unit: "can", minStock: 10, reorderLevel: 20, maxStock: 80, supplier: "CleanPro Industries", description: "Heavy-duty degreaser concentrate" },
  { name: "Microfiber Mop (Pack 5)", sku: "CLN-MOP-004", category: "Cleaning Supplies", subcategory: "Equipment", department: "Administration", location: "Administration Room", unit: "pack", minStock: 8, reorderLevel: 15, maxStock: 60, supplier: "CleanPro Industries", description: "Reusable flat mop heads" },
  { name: "Disposable Garbage Bags Large", sku: "CLN-BAG-022", category: "Cleaning Supplies", subcategory: "Consumables", department: "Administration", location: "Administration Room", unit: "roll", minStock: 20, reorderLevel: 40, maxStock: 200, supplier: "CleanPro Industries", description: "50 x 70 cm, roll of 30" },
  { name: "Pallet Jack 2.5 Ton", sku: "LOG-HND-002", category: "Tools", subcategory: "Material Handling", department: "Logistics", location: "Logistics Bay", unit: "unit", minStock: 2, reorderLevel: 4, maxStock: 10, supplier: "IndustrialMart", description: "Hydraulic pallet jack, 1150mm forks" },
  { name: "Cardboard Boxes (Pack 25)", sku: "LOG-PKG-008", category: "Office Equipment", subcategory: "Packaging", department: "Logistics", location: "Logistics Bay", unit: "pack", minStock: 30, reorderLevel: 50, maxStock: 250, supplier: "PackRight Co.", description: "Heavy duty double wall, 18x18x18 in" },
  { name: "Stretch Wrap Film 500m", sku: "LOG-PKG-014", category: "Office Equipment", subcategory: "Packaging", department: "Logistics", location: "Logistics Bay", unit: "roll", minStock: 15, reorderLevel: 25, maxStock: 100, supplier: "PackRight Co.", description: "2kg machine pallet wrap" },
  { name: "Safety Cones (Set 4)", sku: "LOG-SAF-003", category: "Safety Equipment", subcategory: "Traffic", department: "Logistics", location: "Logistics Bay", unit: "set", minStock: 3, reorderLevel: 5, maxStock: 20, supplier: "SafeGuard PPE", description: "45cm reflective safety cones" },
];

const suppliersList = [
  "TechNova Distributors",
  "OfficeWorld Supplies",
  "IndustrialMart",
  "PetroSupply Co.",
  "MetalWorks Ltd.",
  "SafeGuard PPE",
  "CleanPro Industries",
  "ElectroWares",
  "PackRight Co.",
  "NetCore Systems",
  "PaperMill Trading",
  "HydraParts Inc.",
  "GreenTech Energy",
  "Precision Tools Co.",
  "QuickFix Hardware",
];

let seq = 11;
const now = Date.now();

export const inventoryItems: InventoryItem[] = [
  ...heroItems.map((h) => ({ ...h, subDepartment: h.subDepartment ?? subDepartmentFor(h.department, h.subcategory) })),
  ...itemTemplates.map((t, i) => {
    const seed = (i * 7919 + seq) % 101;
    const qty = seed % 7 === 0 ? 0 : Math.round(Math.pow(seed / 10, 1.6) * 3) + 2;
    const unitCost = 450 + ((seed * 137 + 61) % 900) * 8;
    const lastUpdated = iso(((seed % 14) + 1) * 8 * HOUR);
    const status = qty === 0 ? "out-of-stock" : qty <= t.reorderLevel ? "low-stock" : qty >= t.maxStock ? "overstock" : "in-stock";
    const id = `INV-${String(seq).padStart(3, "0")}`;
    seq++;
    return {
      ...t,
      id,
      quantity: qty,
      unitCost,
      supplier: suppliersList[i % suppliersList.length],
      status,
      lastUpdated,
      createdAt: iso(((seed % 18) + 3) * 30 * DAY),
      subDepartment: subDepartmentFor(t.department, t.subcategory),
    } as InventoryItem;
  }),
];

export const users: User[] = [
  { id: "USR-001", name: "Arjun Mehta", email: "admin@example.com", employeeId: "EMP-0001", department: "Administration", role: "super-admin", status: "active", lastActive: iso(4 * MINUTE), color: "#4f46e5" },
  { id: "USR-002", name: "Priya Sharma", email: "manager@example.com", employeeId: "EMP-0012", department: "IT", role: "department-manager", status: "active", lastActive: iso(25 * MINUTE), color: "#0ea5e9" },
  { id: "USR-003", name: "Rohan Gupta", email: "user@example.com", employeeId: "EMP-0034", department: "Engineering", role: "department-user", status: "active", lastActive: iso(12 * MINUTE), color: "#10b981" },
  { id: "USR-004", name: "Rajesh Kumar", email: "rajesh.kumar@inventoryos.co", employeeId: "EMP-0009", department: "Engineering", role: "department-manager", status: "active", lastActive: iso(1 * HOUR), color: "#f59e0b" },
  { id: "USR-005", name: "Anita Desai", email: "anita.desai@inventoryos.co", employeeId: "EMP-0015", department: "Administration", role: "department-manager", status: "active", lastActive: iso(2 * HOUR), color: "#ef4444" },
  { id: "USR-006", name: "Vikram Singh", email: "vikram.singh@inventoryos.co", employeeId: "EMP-0021", department: "Logistics", role: "department-manager", status: "active", lastActive: iso(3 * HOUR), color: "#8b5cf6" },
  { id: "USR-007", name: "Suresh Nair", email: "suresh.nair@inventoryos.co", employeeId: "EMP-0027", department: "Maintenance", role: "department-manager", status: "active", lastActive: iso(5 * HOUR), color: "#14b8a6" },
  { id: "USR-008", name: "Meera Iyer", email: "meera.iyer@inventoryos.co", employeeId: "EMP-0031", department: "Training", role: "department-manager", status: "active", lastActive: iso(6 * HOUR), color: "#f43f5e" },
  { id: "USR-009", name: "Arun Mehta", email: "arun.mehta@inventoryos.co", employeeId: "EMP-0038", department: "Finance", role: "department-manager", status: "active", lastActive: iso(1 * DAY), color: "#6366f1" },
  { id: "USR-010", name: "Kavita Rao", email: "kavita.rao@inventoryos.co", employeeId: "EMP-0042", department: "Human Resources", role: "department-manager", status: "active", lastActive: iso(2 * DAY), color: "#84cc16" },
  { id: "USR-011", name: "Deepak Verma", email: "deepak.verma@inventoryos.co", employeeId: "EMP-0046", department: "Procurement", role: "department-manager", status: "active", lastActive: iso(3 * DAY), color: "#0d9488" },
  { id: "USR-012", name: "Sanjay Gupta", email: "sanjay.gupta@inventoryos.co", employeeId: "EMP-0049", department: "Operations", role: "department-manager", status: "active", lastActive: iso(4 * DAY), color: "#a855f7" },
  { id: "USR-013", name: "Neha Kulkarni", email: "neha.kulkarni@inventoryos.co", employeeId: "EMP-0055", department: "IT", role: "department-user", status: "active", lastActive: iso(35 * MINUTE), color: "#f97316" },
  { id: "USR-014", name: "Aditya Patel", email: "aditya.patel@inventoryos.co", employeeId: "EMP-0058", department: "IT", role: "department-user", status: "active", lastActive: iso(2 * HOUR), color: "#ec4899" },
  { id: "USR-015", name: "Farhan Ali", email: "farhan.ali@inventoryos.co", employeeId: "EMP-0062", department: "Engineering", role: "department-user", status: "active", lastActive: iso(4 * HOUR), color: "#06b6d4" },
  { id: "USR-016", name: "Divya Menon", email: "divya.menon@inventoryos.co", employeeId: "EMP-0066", department: "Engineering", role: "department-user", status: "active", lastActive: iso(7 * HOUR), color: "#d946ef" },
  { id: "USR-017", name: "Karan Johar", email: "karan.johar@inventoryos.co", employeeId: "EMP-0070", department: "Logistics", role: "department-user", status: "active", lastActive: iso(9 * HOUR), color: "#16a34a" },
  { id: "USR-018", name: "Pooja Reddy", email: "pooja.reddy@inventoryos.co", employeeId: "EMP-0074", department: "Maintenance", role: "department-user", status: "invited", lastActive: "-", color: "#64748b" },
  { id: "USR-019", name: "Siddharth Jain", email: "siddharth.jain@inventoryos.co", employeeId: "EMP-0078", department: "Finance", role: "viewer", status: "active", lastActive: iso(2 * DAY), color: "#b45309" },
  { id: "USR-020", name: "Ishita Bose", email: "ishita.bose@inventoryos.co", employeeId: "EMP-0081", department: "Human Resources", role: "viewer", status: "inactive", lastActive: iso(21 * DAY), color: "#78716c" },
];

export const transactions: StockTransaction[] = [
  { id: "TXN-001", type: "stock-in", reference: "PO-2026-0148", itemId: "INV-001", itemName: 'MacBook Pro 14"', quantity: 10, department: "IT", supplier: "TechNova Distributors", createdBy: "Admin", date: iso(38 * MINUTE), note: "Purchase order received" },
  { id: "TXN-002", type: "stock-in", reference: "PO-2026-0147", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: 12, department: "IT", supplier: "TechNova Distributors", createdBy: "Priya Sharma", date: iso(3 * HOUR), note: "Partial delivery" },
  { id: "TXN-003", type: "stock-out", reference: "SO-2026-0192", itemId: "INV-001", itemName: 'MacBook Pro 14"', quantity: -2, department: "IT", createdBy: "Manager", date: iso(5 * HOUR), note: "Issued to Engineering" },
  { id: "TXN-004", type: "transfer", reference: "TRF-2026-041", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: -4, department: "IT", toDepartment: "Training", createdBy: "Admin", date: iso(8 * HOUR), note: "IT → Training" },
  { id: "TXN-005", type: "adjustment", reference: "ADJ-2026-033", itemId: "INV-007", itemName: "Hydraulic Oil 20L Drum", quantity: -2, department: "Engineering", createdBy: "Rajesh Kumar", date: iso(12 * HOUR), note: "Damaged stock write-off" },
  { id: "TXN-006", type: "stock-in", reference: "PO-2026-0145", itemId: "INV-010", itemName: "Stainless Steel Fasteners M8x25", quantity: 50, department: "Engineering", supplier: "MetalWorks Ltd.", createdBy: "Admin", date: iso(26 * HOUR), note: "Full delivery" },
  { id: "TXN-007", type: "stock-out", reference: "SO-2026-0191", itemId: "INV-010", itemName: "Stainless Steel Fasteners M8x25", quantity: -30, department: "Engineering", createdBy: "Rohan Gupta", date: iso(30 * HOUR), note: "Issued to assembly line 2" },
  { id: "TXN-008", type: "stock-out", reference: "SO-2026-0190", itemId: "INV-009", itemName: 'Dell Latitude 7440 Laptop', quantity: -1, department: "Engineering", createdBy: "Manager", date: iso(2 * DAY), note: "New hire equipment" },
  { id: "TXN-009", type: "stock-in", reference: "PO-2026-0144", itemId: "INV-008", itemName: "Safety Helmet (White)", quantity: 60, department: "Operations", supplier: "SafeGuard PPE", createdBy: "Sanjay Gupta", date: iso(2 * DAY), note: "Full delivery" },
  { id: "TXN-010", type: "transfer", reference: "TRF-2026-040", itemId: "INV-009", itemName: 'Dell Latitude 7440 Laptop', quantity: -3, department: "Engineering", toDepartment: "Finance", createdBy: "Admin", date: iso(3 * DAY), note: "Engineering → Finance" },
  { id: "TXN-011", type: "stock-in", reference: "PO-2026-0142", itemId: "INV-004", itemName: "A4 Paper (500 sheets, Ream)", quantity: 100, department: "Administration", supplier: "OfficeWorld Supplies", createdBy: "Anita Desai", date: iso(3 * DAY), note: "Full delivery" },
  { id: "TXN-012", type: "stock-out", reference: "SO-2026-0189", itemId: "INV-004", itemName: "A4 Paper (500 sheets, Ream)", quantity: -40, department: "Administration", createdBy: "Admin", date: iso(4 * DAY), note: "Monthly stationery issue" },
  { id: "TXN-013", type: "stock-out", reference: "SO-2026-0188", itemId: "INV-006", itemName: "Bosch Angle Grinder GWS 750", quantity: -2, department: "Maintenance", createdBy: "Suresh Nair", date: iso(4 * DAY), note: "Issued to field team" },
  { id: "TXN-014", type: "stock-in", reference: "PO-2026-0140", itemId: "INV-005", itemName: 'Makita Cordless Drill 18V', quantity: 4, department: "Maintenance", supplier: "IndustrialMart", createdBy: "Suresh Nair", date: iso(5 * DAY), note: "Full delivery" },
  { id: "TXN-015", type: "adjustment", reference: "ADJ-2026-032", itemId: "INV-003", itemName: "HP LaserJet Pro M404dn", quantity: -1, department: "Administration", createdBy: "Anita Desai", date: iso(5 * DAY), note: "Sent for repair" },
  { id: "TXN-016", type: "stock-in", reference: "PO-2026-0138", itemId: "INV-005", itemName: 'Makita Cordless Drill 18V', quantity: 6, department: "Maintenance", supplier: "IndustrialMart", createdBy: "Admin", date: iso(6 * DAY), note: "Full delivery" },
  { id: "TXN-017", type: "stock-out", reference: "SO-2026-0187", itemId: "INV-008", itemName: "Safety Helmet (White)", quantity: -25, department: "Operations", createdBy: "Sanjay Gupta", date: iso(6 * DAY), note: "Site deployment" },
  { id: "TXN-018", type: "transfer", reference: "TRF-2026-039", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: -2, department: "IT", toDepartment: "Finance", createdBy: "Priya Sharma", date: iso(7 * DAY), note: "IT → Finance" },
  { id: "TXN-019", type: "stock-in", reference: "PO-2026-0135", itemId: "INV-004", itemName: "A4 Paper (500 sheets, Ream)", quantity: 80, department: "Administration", supplier: "OfficeWorld Supplies", createdBy: "Admin", date: iso(7 * DAY), note: "Full delivery" },
  { id: "TXN-020", type: "stock-out", reference: "SO-2026-0186", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: -3, department: "IT", createdBy: "Neha Kulkarni", date: iso(8 * DAY), note: "Setup for new joiners" },
  { id: "TXN-021", type: "stock-in", reference: "PO-2026-0133", itemId: "INV-006", itemName: "Bosch Angle Grinder GWS 750", quantity: 3, department: "Maintenance", supplier: "IndustrialMart", createdBy: "Admin", date: iso(9 * DAY), note: "Full delivery" },
  { id: "TXN-022", type: "stock-out", reference: "SO-2026-0185", itemId: "INV-005", itemName: 'Makita Cordless Drill 18V', quantity: -2, department: "Maintenance", createdBy: "Suresh Nair", date: iso(10 * DAY), note: "Workshop issue" },
  { id: "TXN-023", type: "adjustment", reference: "ADJ-2026-031", itemId: "INV-001", itemName: 'MacBook Pro 14"', quantity: -1, department: "IT", createdBy: "Priya Sharma", date: iso(10 * DAY), note: "Damage during transit" },
  { id: "TXN-024", type: "stock-in", reference: "PO-2026-0130", itemId: "INV-009", itemName: 'Dell Latitude 7440 Laptop', quantity: 8, department: "Engineering", supplier: "TechNova Distributors", createdBy: "Rajesh Kumar", date: iso(11 * DAY), note: "Full delivery" },
  { id: "TXN-025", type: "stock-out", reference: "SO-2026-0184", itemId: "INV-007", itemName: "Hydraulic Oil 20L Drum", quantity: -3, department: "Engineering", createdBy: "Rohan Gupta", date: iso(11 * DAY), note: "Machine maintenance" },
  { id: "TXN-026", type: "transfer", reference: "TRF-2026-038", itemId: "INV-001", itemName: 'MacBook Pro 14"', quantity: -1, department: "IT", toDepartment: "Engineering", createdBy: "Admin", date: iso(12 * DAY), note: "IT → Engineering" },
  { id: "TXN-027", type: "stock-in", reference: "PO-2026-0128", itemId: "INV-001", itemName: 'MacBook Pro 14"', quantity: 8, department: "IT", supplier: "TechNova Distributors", createdBy: "Priya Sharma", date: iso(13 * DAY), note: "Full delivery" },
  { id: "TXN-028", type: "stock-out", reference: "SO-2026-0183", itemId: "INV-009", itemName: 'Dell Latitude 7440 Laptop', quantity: -2, department: "Engineering", createdBy: "Admin", date: iso(14 * DAY), note: "Issued to design team" },
  { id: "TXN-029", type: "stock-in", reference: "PO-2026-0126", itemId: "INV-008", itemName: "Safety Helmet (White)", quantity: 50, department: "Operations", supplier: "SafeGuard PPE", createdBy: "Sanjay Gupta", date: iso(15 * DAY), note: "Full delivery" },
  { id: "TXN-030", type: "stock-out", reference: "SO-2026-0182", itemId: "INV-003", itemName: "HP LaserJet Pro M404dn", quantity: -1, department: "Administration", createdBy: "Anita Desai", date: iso(16 * DAY), note: "Replacement unit" },
];

export const requests: RequestRecord[] = [
  { id: "REQ-2026-089", requestedBy: "Rohan Gupta", department: "Engineering", subDepartment: "Mechanical Engineering", itemId: "INV-009", itemName: 'Dell Latitude 7440 Laptop', quantity: 2, priority: "high", date: iso(45 * MINUTE), status: "pending", reason: "New project team members joining" },
  { id: "REQ-2026-088", requestedBy: "Farhan Ali", department: "Engineering", subDepartment: "Mechanical Engineering", itemId: "INV-007", itemName: "Hydraulic Oil 20L Drum", quantity: 4, priority: "critical", date: iso(4 * HOUR), status: "pending", reason: "Machine 3 hydraulic system empty" },
  { id: "REQ-2026-087", requestedBy: "Neha Kulkarni", department: "IT", subDepartment: "Hardware Support", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: 5, priority: "medium", date: iso(8 * HOUR), status: "approved", reason: "New joiner onboarding" },
  { id: "REQ-2026-086", requestedBy: "Karan Johar", department: "Logistics", subDepartment: "Warehouse Operations", itemId: "LOG-PKG-008", itemName: "Cardboard Boxes (Pack 25)", quantity: 10, priority: "low", date: iso(1 * DAY), status: "completed", reason: "Monthly dispatch packaging" },
  { id: "REQ-2026-085", requestedBy: "Divya Menon", department: "Engineering", subDepartment: "Electrical Engineering", itemId: "INV-010", itemName: "Stainless Steel Fasteners M8x25", quantity: 20, priority: "medium", date: iso(2 * DAY), status: "completed", reason: "Assembly line restock" },
  { id: "REQ-2026-084", requestedBy: "Suresh Nair", department: "Maintenance", subDepartment: "Machine Maintenance", itemId: "INV-006", itemName: "Bosch Angle Grinder GWS 750", quantity: 3, priority: "high", date: iso(2 * DAY), status: "partially-fulfilled", reason: "Field repair kits" },
  { id: "REQ-2026-083", requestedBy: "Meera Iyer", department: "Training", subDepartment: "Training Lab", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: 4, priority: "medium", date: iso(3 * DAY), status: "approved", reason: "Training lab upgrade" },
  { id: "REQ-2026-082", requestedBy: "Pooja Reddy", department: "Maintenance", subDepartment: "Electrical & Plumbing", itemId: "INV-008", itemName: "Safety Helmet (White)", quantity: 15, priority: "low", date: iso(3 * DAY), status: "completed", reason: "Contractor onboarding" },
  { id: "REQ-2026-081", requestedBy: "Karan Johar", department: "Logistics", subDepartment: "Warehouse Operations", itemId: "TLS-HND-002", itemName: "Pallet Jack 2.5 Ton", quantity: 1, priority: "high", date: iso(4 * DAY), status: "pending", reason: "Warehouse expansion" },
  { id: "REQ-2026-080", requestedBy: "Anita Desai", department: "Administration", subDepartment: "Office Management", itemId: "INV-003", itemName: "HP LaserJet Pro M404dn", quantity: 2, priority: "medium", date: iso(4 * DAY), status: "rejected", reason: "Draft approval — budget review" },
  { id: "REQ-2026-079", requestedBy: "Aditya Patel", department: "IT", subDepartment: "Hardware Support", itemId: "INV-001", itemName: 'MacBook Pro 14"', quantity: 1, priority: "critical", date: iso(5 * DAY), status: "completed", reason: "VP replacement device" },
  { id: "REQ-2026-078", requestedBy: "Rohan Gupta", department: "Engineering", subDepartment: "Design & R&D", itemId: "INV-005", itemName: 'Makita Cordless Drill 18V', quantity: 2, priority: "medium", date: iso(6 * DAY), status: "approved", reason: "Prototyping bench" },
  { id: "REQ-2026-077", requestedBy: "Sanjay Gupta", department: "Operations", subDepartment: "Safety & Compliance", itemId: "SFT-FIR-002", itemName: "Fire Extinguisher ABC 4kg", quantity: 4, priority: "high", date: iso(7 * DAY), status: "completed", reason: "Compliance requirement" },
  { id: "REQ-2026-076", requestedBy: "Ishita Bose", department: "Human Resources", subDepartment: "Payroll & Benefits", itemId: "OFF-FUR-011", itemName: "Ergonomic Office Chair", quantity: 6, priority: "low", date: iso(8 * DAY), status: "completed", reason: "Office refresh" },
  { id: "REQ-2026-075", requestedBy: "Arun Mehta", department: "Finance", subDepartment: "Accounting", itemId: "INV-009", itemName: 'Dell Latitude 7440 Laptop', quantity: 1, priority: "medium", date: iso(9 * DAY), status: "rejected", reason: "No budget this quarter" },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-01", poNumber: "PO-2026-0148", supplier: "TechNova Distributors", department: "IT", items: [{ name: 'MacBook Pro 14"', qty: 10, cost: 145000 }], amount: 1450000, orderDate: iso(6 * DAY), expectedDelivery: iso(8 * DAY), status: "received" },
  { id: "PO-02", poNumber: "PO-2026-0147", supplier: "TechNova Distributors", department: "IT", items: [{ name: 'Dell UltraSharp 27" Monitor', qty: 12, cost: 42000 }], amount: 504000, orderDate: iso(7 * DAY), expectedDelivery: iso(10 * DAY), status: "received" },
  { id: "PO-03", poNumber: "PO-2026-0146", supplier: "MetalWorks Ltd.", department: "Engineering", items: [{ name: "Stainless Steel Fasteners M8x25", qty: 100, cost: 1200 }, { name: "Bearing 6205-2RS", qty: 40, cost: 850 }], amount: 154000, orderDate: iso(8 * DAY), expectedDelivery: iso(14 * DAY), status: "partially-received" },
  { id: "PO-04", poNumber: "PO-2026-0145", supplier: "OfficeWorld Supplies", department: "Administration", items: [{ name: "A4 Paper (500 sheets, Ream)", qty: 200, cost: 350 }, { name: "Ballpoint Pens (Box of 50)", qty: 60, cost: 480 }], amount: 98800, orderDate: iso(9 * DAY), expectedDelivery: iso(12 * DAY), status: "ordered" },
  { id: "PO-05", poNumber: "PO-2026-0144", supplier: "IndustrialMart", department: "Maintenance", items: [{ name: 'Makita Cordless Drill 18V', qty: 6, cost: 12500 }, { name: "Cordless Circular Saw", qty: 2, cost: 18500 }], amount: 112000, orderDate: iso(10 * DAY), expectedDelivery: iso(15 * DAY), status: "approved" },
  { id: "PO-06", poNumber: "PO-2026-0143", supplier: "SafeGuard PPE", department: "Operations", items: [{ name: "Safety Helmet (White)", qty: 100, cost: 480 }, { name: "Safety Boots Size 8", qty: 40, cost: 2200 }], amount: 136000, orderDate: iso(11 * DAY), expectedDelivery: iso(16 * DAY), status: "pending-approval" },
  { id: "PO-07", poNumber: "PO-2026-0142", supplier: "PetroSupply Co.", department: "Engineering", items: [{ name: "Hydraulic Oil 20L Drum", qty: 20, cost: 6400 }, { name: "Grease Gun (Manual)", qty: 5, cost: 1400 }], amount: 135000, orderDate: iso(12 * DAY), expectedDelivery: iso(18 * DAY), status: "draft" },
  { id: "PO-08", poNumber: "PO-2026-0141", supplier: "ElectroWares", department: "Maintenance", items: [{ name: "LED Tube Light 18W", qty: 80, cost: 320 }, { name: "MCB 16A Single Pole", qty: 40, cost: 260 }], amount: 36000, orderDate: iso(13 * DAY), expectedDelivery: iso(17 * DAY), status: "cancelled" },
  { id: "PO-09", poNumber: "PO-2026-0140", supplier: "NetCore Systems", department: "IT", items: [{ name: "Cisco Catalyst 2960 Switch", qty: 2, cost: 65000 }, { name: "Ubiquiti UniFi AP AC Pro", qty: 6, cost: 16000 }], amount: 226000, orderDate: iso(15 * DAY), expectedDelivery: iso(20 * DAY), status: "received" },
  { id: "PO-10", poNumber: "PO-2026-0139", supplier: "PackRight Co.", department: "Logistics", items: [{ name: "Cardboard Boxes (Pack 25)", qty: 60, cost: 950 }, { name: "Stretch Wrap Film 500m", qty: 30, cost: 700 }], amount: 78000, orderDate: iso(16 * DAY), expectedDelivery: iso(22 * DAY), status: "ordered" },
];

export const suppliers: Supplier[] = [
  { id: "SUP-01", name: "TechNova Distributors", contactPerson: "Rakesh Bansal", email: "sales@technova.co.in", phone: "+91 98200 12345", address: "Pune, Maharashtra", categories: ["IT Equipment"], itemsSupplied: 34, purchaseOrders: 22, totalSpend: 4280000, status: "active", rating: 4.8 },
  { id: "SUP-02", name: "OfficeWorld Supplies", contactPerson: "Sunita Joshi", email: "orders@officeworld.in", phone: "+91 98111 45678", address: "Mumbai, Maharashtra", categories: ["Office Equipment", "Stationery"], itemsSupplied: 28, purchaseOrders: 19, totalSpend: 1640000, status: "active", rating: 4.5 },
  { id: "SUP-03", name: "IndustrialMart", contactPerson: "Gopal Iyer", email: "sales@industrialmart.in", phone: "+91 98333 78901", address: "Chennai, Tamil Nadu", categories: ["Tools", "Spare Parts"], itemsSupplied: 41, purchaseOrders: 26, totalSpend: 3120000, status: "active", rating: 4.7 },
  { id: "SUP-04", name: "PetroSupply Co.", contactPerson: "Harish Nambiar", email: "quotes@petrosupply.co.in", phone: "+91 98444 23456", address: "Vadodara, Gujarat", categories: ["Spare Parts"], itemsSupplied: 12, purchaseOrders: 9, totalSpend: 980000, status: "active", rating: 4.2 },
  { id: "SUP-05", name: "MetalWorks Ltd.", contactPerson: "Nitin Choudhary", email: "enquiry@metalworks.in", phone: "+91 98555 34567", address: "Faridabad, Haryana", categories: ["Spare Parts", "Tools"], itemsSupplied: 19, purchaseOrders: 14, totalSpend: 1240000, status: "active", rating: 4.4 },
  { id: "SUP-06", name: "SafeGuard PPE", contactPerson: "Lata Pillai", email: "sales@safeguardppe.in", phone: "+91 98666 45678", address: "Coimbatore, Tamil Nadu", categories: ["Safety Equipment"], itemsSupplied: 22, purchaseOrders: 15, totalSpend: 860000, status: "active", rating: 4.6 },
  { id: "SUP-07", name: "CleanPro Industries", contactPerson: "Manoj Tiwari", email: "info@cleanpro.in", phone: "+91 98777 56789", address: "Ghaziabad, Uttar Pradesh", categories: ["Cleaning Supplies"], itemsSupplied: 14, purchaseOrders: 11, totalSpend: 320000, status: "active", rating: 4.1 },
  { id: "SUP-08", name: "ElectroWares", contactPerson: "Shweta Kapoor", email: "orders@electrowares.in", phone: "+91 98888 67890", address: "Delhi NCR", categories: ["Electrical"], itemsSupplied: 25, purchaseOrders: 17, totalSpend: 540000, status: "active", rating: 4.3 },
  { id: "SUP-09", name: "PackRight Co.", contactPerson: "Venkat Rao", email: "sales@packright.in", phone: "+91 98999 78901", address: "Bengaluru, Karnataka", categories: ["Office Equipment"], itemsSupplied: 9, purchaseOrders: 7, totalSpend: 210000, status: "active", rating: 4.0 },
  { id: "SUP-10", name: "NetCore Systems", contactPerson: "Imran Shaikh", email: "sales@netcore.systems", phone: "+91 99000 89012", address: "Hyderabad, Telangana", categories: ["IT Equipment", "Electrical"], itemsSupplied: 17, purchaseOrders: 12, totalSpend: 1890000, status: "active", rating: 4.9 },
  { id: "SUP-11", name: "PaperMill Trading", contactPerson: "Ritu Malhotra", email: "contact@papermill.in", phone: "+91 99111 90123", address: "Agra, Uttar Pradesh", categories: ["Stationery"], itemsSupplied: 6, purchaseOrders: 5, totalSpend: 145000, status: "active", rating: 3.9 },
  { id: "SUP-12", name: "HydraParts Inc.", contactPerson: "Farooq Khan", email: "info@hydraparts.in", phone: "+91 99222 01234", address: "Jamshedpur, Jharkhand", categories: ["Spare Parts"], itemsSupplied: 11, purchaseOrders: 8, totalSpend: 430000, status: "inactive", rating: 3.7 },
  { id: "SUP-13", name: "GreenTech Energy", contactPerson: "Ananya Sen", email: "sales@greentech.energy", phone: "+91 99333 12345", address: "Nagpur, Maharashtra", categories: ["Electrical", "Spare Parts"], itemsSupplied: 8, purchaseOrders: 6, totalSpend: 275000, status: "active", rating: 4.4 },
  { id: "SUP-14", name: "Precision Tools Co.", contactPerson: "Arvind Shetty", email: "sales@precisiontools.in", phone: "+91 99444 23456", address: "Ahmedabad, Gujarat", categories: ["Tools"], itemsSupplied: 15, purchaseOrders: 10, totalSpend: 610000, status: "active", rating: 4.5 },
  { id: "SUP-15", name: "QuickFix Hardware", contactPerson: "Sandeep Verma", email: "orders@quickfix.in", phone: "+91 99555 34567", address: "Ludhiana, Punjab", categories: ["Tools", "Spare Parts"], itemsSupplied: 13, purchaseOrders: 9, totalSpend: 385000, status: "inactive", rating: 3.6 },
];

const assetSeeds: Array<Omit<Asset, "id" | "serialNumber" | "purchaseDate" | "warranty">> = [
  { 
    assetId: "AST-1001", 
    name: 'MacBook Pro 14" — Dev Laptop', 
    category: "IT Equipment", 
    department: "IT", 
    assignedTo: "Priya Sharma", 
    location: "IT Store", 
    cost: 145000, 
    condition: "good" as const, 
    status: "assigned" as const,
    hardware: {
      cpu: "Apple M3 Pro 12-core",
      ram: "18GB Unified Memory",
      storage: "512GB SSD",
      gpu: "Apple 19-core GPU",
      display: "14.2-inch Liquid Retina XDR",
      battery: "70Wh",
      network: "Wi-Fi 6E, Bluetooth 5.3"
    },
    software: [
      { name: "macOS Sonoma", version: "14.5", licenseStatus: "Licensed" },
      { name: "Microsoft Office 365", version: "2024", licenseStatus: "Licensed" },
      { name: "Adobe Creative Cloud", version: "2024", licenseStatus: "Licensed" }
    ],
    warrantyDetails: {
      provider: "Apple",
      status: "Active",
      startDate: "2023-09-15",
      expiryDate: "2026-09-15"
    }
  },
  { 
    assetId: "AST-1002", 
    name: "Server Rack R1", 
    category: "IT Equipment", 
    department: "IT", 
    location: "Server Room", 
    cost: 850000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1003", 
    name: "Cisco Core Switch", 
    category: "IT Equipment", 
    department: "IT", 
    location: "Server Room", 
    cost: 320000, 
    condition: "good" as const, 
    status: "assigned" as const,
    hardware: {
      cpu: "Cisco Nexus 9000 Series Processor",
      ram: "32GB DDR4",
      storage: "N/A",
      gpu: "N/A",
      display: "N/A",
      battery: "N/A",
      network: "40x 100GbE QSFP28, 4x 400GbE QSFP-DD"
    },
    software: [
      { name: "Cisco NX-OS", version: "10.2(3)", licenseStatus: "Licensed" }
    ],
    warrantyDetails: {
      provider: "Cisco Systems",
      status: "Active",
      startDate: "2022-01-10",
      expiryDate: "2025-01-10"
    }
  },
  { 
    assetId: "AST-1003", 
    name: "Cisco Core Switch", 
    category: "IT Equipment", 
    department: "IT", 
    location: "Server Room", 
    cost: 320000, 
    condition: "good" as const, 
    status: "assigned" as const
  },
  { 
    assetId: "AST-1004", 
    name: "HP ProLiant Server DL380", 
    category: "IT Equipment", 
    department: "IT", 
    location: "Server Room", 
    cost: 540000, 
    condition: "fair" as const, 
    status: "under-repair" as const
  },
  { 
    assetId: "AST-1005", 
    name: "CNC Milling Machine M3", 
    category: "Tools", 
    department: "Engineering", 
    location: "Engineering Store", 
    cost: 2400000, 
    condition: "good" as const, 
    status: "assigned" as const
  },
  { 
    assetId: "AST-1006", 
    name: "Forklift 3T — Unit 2", 
    category: "Tools", 
    department: "Logistics", 
    location: "Logistics Bay", 
    cost: 1850000, 
    condition: "fair" as const, 
    status: "under-repair" as const
  },
  { 
    assetId: "AST-1007", 
    name: "Air Compressor 100L", 
    category: "Tools", 
    department: "Maintenance", 
    location: "Maintenance Workshop", 
    cost: 340000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1008", 
    name: "Diesel Generator 62.5kVA", 
    category: "Electrical", 
    department: "Operations", 
    location: "Main Warehouse", 
    cost: 980000, 
    condition: "good" as const, 
    status: "assigned" as const
  },
  { 
    assetId: "AST-1009", 
    name: "Projector Epson EB-X49", 
    category: "IT Equipment", 
    department: "Training", 
    assignedTo: "Meera Iyer", 
    location: "Training Lab", 
    cost: 62000, 
    condition: "good" as const, 
    status: "assigned" as const,
    hardware: {
      cpu: "Epson Image Processing Engine",
      ram: "256MB DDR3",
      storage: "N/A",
      gpu: "N/A",
      display: "WXGA (1280x800)",
      battery: "N/A",
      network: "Wi-Fi 5, Ethernet"
    },
    software: [
      { name: "Epson Projector Software", version: "3.2.1", licenseStatus: "Licensed" }
    ],
    warrantyDetails: {
      provider: "Epson",
      status: "Active",
      startDate: "2023-06-20",
      expiryDate: "2026-06-20"
    }
  },
  { 
    assetId: "AST-1010", 
    name: "Conference Room Display 65\"", 
    category: "IT Equipment", 
    department: "Administration", 
    location: "Administration Room", 
    cost: 185000, 
    condition: "good" as const, 
    status: "assigned" as const,
    hardware: {
      cpu: "N/A",
      ram: "N/A",
      storage: "N/A",
      gpu: "N/A",
      display: "65-inch 4K UHD LED",
      battery: "N/A",
      network: "Wi-Fi 6, Bluetooth 5.2, Ethernet"
    },
    software: [
      { name: "Smart TV Platform", version: "Tizen 6.5", licenseStatus: "Licensed" }
    ],
    warrantyDetails: {
      provider: "Samsung",
      status: "Active",
      startDate: "2023-03-10",
      expiryDate: "2028-03-10"
    }
  },
  { 
    assetId: "AST-1011", 
    name: "Lathe Machine (Heavy)", 
    category: "Tools", 
    department: "Engineering", 
    location: "Engineering Store", 
    cost: 3100000, 
    condition: "poor" as const, 
    status: "damaged" as const
  },
  { 
    assetId: "AST-1012", 
    name: "Welding Machine MIG 400A", 
    category: "Tools", 
    department: "Maintenance", 
    location: "Maintenance Workshop", 
    cost: 145000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1013", 
    name: "Pallet Racking System — Aisle 2", 
    category: "Office Equipment", 
    department: "Logistics", 
    location: "Main Warehouse", 
    cost: 750000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1014", 
    name: "Industrial UPS 20kVA", 
    category: "Electrical", 
    department: "IT", 
    location: "Server Room", 
    cost: 420000, 
    condition: "fair" as const, 
    status: "under-repair" as const
  },
  { 
    assetId: "AST-1015", 
    name: "Water Pump 5HP", 
    category: "Electrical", 
    department: "Maintenance", 
    location: "Maintenance Workshop", 
    cost: 48000, 
    condition: "poor" as const, 
    status: "retired" as const
  },
  { 
    assetId: "AST-1016", 
    name: 'iPad Air 11" — Training Kit', 
    category: "IT Equipment", 
    department: "Training", 
    assignedTo: "Meera Iyer", 
    location: "Training Lab", 
    cost: 55000, 
    condition: "good" as const, 
    status: "assigned" as const,
    hardware: {
      cpu: "Apple M1",
      ram: "8GB Unified Memory",
      storage: "64GB SSD",
      gpu: "Apple 7-core GPU",
      display: "10.9-inch Liquid Retina",
      battery: "28.9Wh",
      network: "Wi-Fi 6, Bluetooth 5.2"
    },
    software: [
      { name: "iPadOS", version: "17.5", licenseStatus: "Licensed" },
      { name: "Microsoft Teams", version: "1449/1.0.0", licenseStatus: "Licensed" }
    ],
    warrantyDetails: {
      provider: "Apple",
      status: "Active",
      startDate: "2023-10-05",
      expiryDate: "2025-10-05"
    }
  },
  { 
    assetId: "AST-1017", 
    name: "Security Camera NVR System", 
    category: "IT Equipment", 
    department: "Operations", 
    location: "Main Warehouse", 
    cost: 260000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1018", 
    name: "Label Printer Dymo 450", 
    category: "Office Equipment", 
    department: "Logistics", 
    location: "Logistics Bay", 
    cost: 24000, 
    condition: "fair" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1019", 
    name: "Barcode Scanner (Industrial)", 
    category: "IT Equipment", 
    department: "Logistics", 
    assignedTo: "Karan Johar", 
    location: "Logistics Bay", 
    cost: 38000, 
    condition: "good" as const, 
    status: "assigned" as const,
    hardware: {
      cpu: "Honeywell Image Processing Engine",
      ram: "512MB DDR3",
      storage: "N/A",
      gpu: "N/A",
      display: "N/A",
      battery: "N/A",
      network: "USB 3.0, RS-232"
    },
    software: [
      { name: "Honeywell Scanner SDK", version: "2.1.0", licenseStatus: "Licensed" }
    ],
    warrantyDetails: {
      provider: "Honeywell",
      status: "Active",
      startDate: "2022-11-30",
      expiryDate: "2025-11-30"
    }
  },
  { 
    assetId: "AST-1020", 
    name: "Laser Cutting Table", 
    category: "Tools", 
    department: "Engineering", 
    location: "Engineering Store", 
    cost: 1200000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1021", 
    name: "Test Bench — Electronics", 
    category: "Tools", 
    department: "Engineering", 
    location: "Engineering Store", 
    cost: 260000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1022", 
    name: 'MacBook Pro 16" — Design', 
    category: "IT Equipment", 
    department: "Engineering", 
    assignedTo: "Divya Menon", 
    location: "Engineering Store", 
    cost: 210000, 
    condition: "good" as const, 
    status: "assigned" as const,
    hardware: {
      cpu: "Apple M3 Max 16-core",
      ram: "36GB Unified Memory",
      storage: "1TB SSD",
      gpu: "Apple 40-core GPU",
      display: "16.2-inch Liquid Retina XDR",
      battery: "100Wh",
      network: "Wi-Fi 6E, Bluetooth 5.3"
    },
    software: [
      { name: "macOS Sonoma", version: "14.5", licenseStatus: "Licensed" },
      { name: "Adobe Creative Cloud", version: "2024", licenseStatus: "Licensed" },
      { name: "Final Cut Pro", version: "10.6.2", licenseStatus: "Licensed" }
    ],
    warrantyDetails: {
      provider: "Apple",
      status: "Active",
      startDate: "2023-12-15",
      expiryDate: "2026-12-15"
    }
  },
  { 
    assetId: "AST-1023", 
    name: "Xerox WorkCentre 6515", 
    category: "Office Equipment", 
    department: "Administration", 
    location: "Administration Room", 
    cost: 98000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1024", 
    name: "Heavy Duty Shredder", 
    category: "Office Equipment", 
    department: "Finance", 
    location: "Main Warehouse", 
    cost: 45000, 
    condition: "fair" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1025", 
    name: "Compactor Machine 15T", 
    category: "Spare Parts", 
    department: "Operations", 
    location: "Main Warehouse", 
    cost: 340000, 
    condition: "poor" as const, 
    status: "damaged" as const
  },
  { 
    assetId: "AST-1026", 
    name: "Conveyor Drive Motor 7.5kW", 
    category: "Spare Parts", 
    department: "Logistics", 
    location: "Logistics Bay", 
    cost: 89000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1027", 
    name: "Digital Weighing Scale 300kg", 
    category: "Tools", 
    department: "Logistics", 
    location: "Logistics Bay", 
    cost: 32000, 
    condition: "good" as const, 
    status: "assigned" as const
  },
  { 
    assetId: "AST-1028", 
    name: "Automatic Door System", 
    category: "Electrical", 
    department: "Administration", 
    location: "Administration Room", 
    cost: 150000, 
    condition: "good" as const, 
    status: "available" as const
  },
  { 
    assetId: "AST-1029", 
    name: "Solar Inverter 5kW", 
    category: "Electrical", 
    department: "Operations", 
    location: "Main Warehouse", 
    cost: 130000, 
    condition: "poor" as const, 
    status: "retired" as const
  },
  { 
    assetId: "AST-1030", 
    name: "3D Printer Ultimaker S5", 
    category: "IT Equipment", 
    department: "Engineering", 
    location: "Engineering Store", 
    cost: 420000, 
    condition: "good" as const, 
    status: "available" as const,
    hardware: {
      cpu: "Dual-core ARM Cortex-A9",
      ram: "1GB DDR3",
      storage: "8GB eMMC",
      gpu: "Vivante GC2000",
      display: "2.4-inch Color LCD",
      battery: "N/A",
      network: "Wi-Fi 4, Ethernet, USB 2.0"
    },
    software: [
      { name: "Ultimaker Firmware", version: "7.8.0", licenseStatus: "Licensed" },
      { name: "Ultimaker Cura", version: "5.6.0", licenseStatus: "Open Source" }
    ],
    warrantyDetails: {
      provider: "Ultimaker",
      status: "Active",
      startDate: "2023-07-22",
      expiryDate: "2026-07-22"
    }
  },
];

export const assets: Asset[] = assetSeeds.map((a, i): Asset => ({
  ...a,
  id: `AST-${String(i + 1).padStart(3, "0")}`,
  serialNumber: `SN-${a.category === "IT Equipment" ? "IT" : "EQ"}-${String(10000 + i * 137)}`,
  purchaseDate: iso(((i % 12) + 6) * 30 * DAY),
  warranty: `${(i % 4) + 1} year${i % 4 ? "s" : ""}`,
  department: a.department,
}));

export const transfers: Transfer[] = [
  { id: "TRF-01", transferNo: "TRF-2026-041", fromDepartment: "IT", toDepartment: "Training", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: 4, reason: "Training lab setup", requestedBy: "Priya Sharma", date: iso(6 * HOUR), status: "completed", approvedBy: "Admin", approvalDate: iso(5 * HOUR) },
  { id: "TRF-02", transferNo: "TRF-2026-042", fromDepartment: "Engineering", toDepartment: "Finance", itemId: "INV-009", itemName: 'Dell Latitude 7440 Laptop', quantity: 3, reason: "Finance team expansion", requestedBy: "Rajesh Kumar", date: iso(1 * DAY), status: "in-transit", approvedBy: "Admin", approvalDate: iso(20 * HOUR) },
  { id: "TRF-03", transferNo: "TRF-2026-043", fromDepartment: "IT", toDepartment: "Engineering", itemId: "INV-001", itemName: 'MacBook Pro 14"', quantity: 1, reason: "Design team request", requestedBy: "Priya Sharma", date: iso(2 * DAY), status: "approved", approvedBy: "Admin", approvalDate: iso(2 * DAY) },
  { id: "TRF-04", transferNo: "TRF-2026-044", fromDepartment: "Maintenance", toDepartment: "Engineering", itemId: "INV-005", itemName: 'Makita Cordless Drill 18V', quantity: 2, reason: "Site work support", requestedBy: "Suresh Nair", date: iso(3 * DAY), status: "pending" },
  { id: "TRF-05", transferNo: "TRF-2026-045", fromDepartment: "Logistics", toDepartment: "Operations", itemId: "SFT-FIR-002", itemName: "Fire Extinguisher ABC 4kg", quantity: 6, reason: "Site compliance", requestedBy: "Vikram Singh", date: iso(4 * DAY), status: "rejected", approvedBy: "Admin", approvalDate: iso(4 * DAY) },
  { id: "TRF-06", transferNo: "TRF-2026-046", fromDepartment: "Engineering", toDepartment: "Maintenance", itemId: "INV-007", itemName: "Hydraulic Oil 20L Drum", quantity: 4, reason: "Machine servicing", requestedBy: "Rajesh Kumar", date: iso(5 * DAY), status: "completed", approvedBy: "Admin", approvalDate: iso(5 * DAY) },
  { id: "TRF-07", transferNo: "TRF-2026-047", fromDepartment: "Administration", toDepartment: "Training", itemId: "OFF-SPL-013", itemName: "Whiteboard 4x6 ft", quantity: 3, reason: "Classroom refresh", requestedBy: "Anita Desai", date: iso(6 * DAY), status: "in-transit", approvedBy: "Admin", approvalDate: iso(6 * DAY) },
  { id: "TRF-08", transferNo: "TRF-2026-048", fromDepartment: "IT", toDepartment: "Finance", itemId: "INV-002", itemName: 'Dell UltraSharp 27" Monitor', quantity: 2, reason: "Finance new hires", requestedBy: "Priya Sharma", date: iso(7 * DAY), status: "pending" },
];

export const stockInRecords: StockInRecord[] = [
  { id: "SIN-01", reference: "PO-2026-0148", date: iso(38 * MINUTE), supplier: "TechNova Distributors", itemName: 'MacBook Pro 14"', items: 1, quantity: 10, department: "IT", createdBy: "Admin", status: "received" },
  { id: "SIN-02", reference: "PO-2026-0147", date: iso(3 * HOUR), supplier: "TechNova Distributors", itemName: 'Dell UltraSharp 27" Monitor', items: 1, quantity: 12, department: "IT", createdBy: "Priya Sharma", status: "received" },
  { id: "SIN-03", reference: "PO-2026-0145", date: iso(26 * HOUR), supplier: "MetalWorks Ltd.", itemName: "Stainless Steel Fasteners M8x25", items: 1, quantity: 50, department: "Engineering", createdBy: "Admin", status: "received" },
  { id: "SIN-04", reference: "PO-2026-0144", date: iso(2 * DAY), supplier: "SafeGuard PPE", itemName: "Safety Helmet (White)", items: 1, quantity: 60, department: "Operations", createdBy: "Sanjay Gupta", status: "received" },
  { id: "SIN-05", reference: "PO-2026-0142", date: iso(3 * DAY), supplier: "OfficeWorld Supplies", itemName: "A4 Paper (500 sheets, Ream)", items: 1, quantity: 100, department: "Administration", createdBy: "Anita Desai", status: "received" },
  { id: "SIN-06", reference: "PO-2026-0140", date: iso(5 * DAY), supplier: "IndustrialMart", itemName: 'Makita Cordless Drill 18V', items: 1, quantity: 4, department: "Maintenance", createdBy: "Suresh Nair", status: "received" },
  { id: "SIN-07", reference: "PO-2026-0138", date: iso(6 * DAY), supplier: "IndustrialMart", itemName: 'Makita Cordless Drill 18V', items: 1, quantity: 6, department: "Maintenance", createdBy: "Admin", status: "received" },
  { id: "SIN-08", reference: "PO-2026-0135", date: iso(7 * DAY), supplier: "OfficeWorld Supplies", itemName: "A4 Paper (500 sheets, Ream)", items: 1, quantity: 80, department: "Administration", createdBy: "Admin", status: "received" },
];

export const stockOutRecords: StockOutRecord[] = [
  { id: "SOU-01", reference: "SO-2026-0192", date: iso(5 * HOUR), itemName: 'MacBook Pro 14"', recipient: "Rohan Gupta", department: "Engineering", purpose: "New project team", quantity: 2, status: "issued" },
  { id: "SOU-02", reference: "SO-2026-0191", date: iso(30 * HOUR), itemName: "Stainless Steel Fasteners M8x25", recipient: "Assembly Line 2", department: "Engineering", purpose: "Production restock", quantity: 30, status: "issued" },
  { id: "SOU-03", reference: "SO-2026-0190", date: iso(2 * DAY), itemName: 'Dell Latitude 7440 Laptop', recipient: "Divya Menon", department: "Engineering", purpose: "New hire equipment", quantity: 1, status: "issued" },
  { id: "SOU-04", reference: "SO-2026-0189", date: iso(4 * DAY), itemName: "A4 Paper (500 sheets, Ream)", recipient: "Admin Wing", department: "Administration", purpose: "Monthly stationery issue", quantity: 40, status: "issued" },
  { id: "SOU-05", reference: "SO-2026-0188", date: iso(4 * DAY), itemName: "Bosch Angle Grinder GWS 750", recipient: "Field Team B", department: "Maintenance", purpose: "Field maintenance", quantity: 2, status: "issued" },
  { id: "SOU-06", reference: "SO-2026-0187", date: iso(6 * DAY), itemName: "Safety Helmet (White)", recipient: "Site Crew", department: "Operations", purpose: "Site deployment", quantity: 25, status: "issued" },
  { id: "SOU-07", reference: "SO-2026-0186", date: iso(8 * DAY), itemName: 'Dell UltraSharp 27" Monitor', recipient: "New Joiners", department: "IT", purpose: "Onboarding setup", quantity: 3, status: "issued" },
  { id: "SOU-08", reference: "SO-2026-0185", date: iso(10 * DAY), itemName: 'Makita Cordless Drill 18V', recipient: "Workshop", department: "Maintenance", purpose: "Workshop issue", quantity: 2, status: "issued" },
];

const activityLog: Array<[string, string, string, string, string, number]> = [
  ["Admin", "added inventory", "Inventory", 'MacBook Pro 14"', "IT", 38],
  ["Priya Sharma", "approved request", "Requests", "REQ-2026-087", "IT", 52],
  ["Rohan Gupta", "submitted request", "Requests", "REQ-2026-088", "Engineering", 70],
  ["Priya Sharma", "approved transfer", "Transfers", "TRF-2026-041", "IT", 85],
  ["Vikram Singh", "submitted request", "Requests", "REQ-2026-087", "Logistics", 110],
  ["Admin", "received purchase order", "Purchase Orders", "PO-2026-0148", "IT", 130],
  ["Suresh Nair", "created transfer", "Transfers", "TRF-2026-044", "Maintenance", 155],
  ["Neha Kulkarni", "issued stock", "Stock Out", "SO-2026-0192", "IT", 180],
  ["Rajesh Kumar", "updated inventory", "Inventory", "INV-009", "Engineering", 210],
  ["Anita Desai", "added category", "Categories", "Cleaning Supplies", "Administration", 240],
  ["Admin", "updated supplier", "Suppliers", "TechNova Distributors", "-", 270],
  ["Priya Sharma", "created purchase order", "Purchase Orders", "PO-2026-0149", "IT", 300],
  ["Rohan Gupta", "performed stock out", "Stock Out", "INV-010", "Engineering", 360],
  ["Sanjay Gupta", "updated location", "Locations", "Main Warehouse", "Operations", 420],
  ["Admin", "added asset", "Assets", "AST-1030", "Engineering", 480],
  ["Karan Johar", "submitted request", "Requests", "REQ-2026-086", "Logistics", 540],
  ["Meera Iyer", "approved request", "Requests", "REQ-2026-083", "Training", 620],
  ["Arun Mehta", "viewed report", "Reports", "Inventory Valuation", "Finance", 700],
  ["Divya Menon", "updated inventory", "Inventory", "INV-010", "Engineering", 780],
  ["Admin", "rejected transfer", "Transfers", "TRF-2026-045", "Logistics", 900],
  ["Suresh Nair", "completed transfer", "Transfers", "TRF-2026-046", "Maintenance", 1100],
  ["Priya Sharma", "added user", "Users", "USR-021", "IT", 1300],
  ["Anita Desai", "exported report", "Reports", "Low Stock Report", "Administration", 1500],
  ["Rohan Gupta", "performed stock in", "Stock In", "INV-010", "Engineering", 1750],
  ["Admin", "updated settings", "Settings", "Notification preferences", "-", 2100],
];

export const activities: Activity[] = activityLog.map(([user, action, module, item, department, ago], i) => ({
  id: `ACT-${String(i + 1).padStart(3, "0")}`,
  user,
  action,
  module,
  item,
  department,
  date: iso(ago * MINUTE),
}));

const ticketIssue = (i: number, title: string, opts: Partial<TicketIssue> & { agoMin: number }): TicketIssue => ({
  id: `ISS-${String(i).padStart(3, "0")}`,
  title,
  priority: "medium",
  status: "open",
  createdAt: iso(opts.agoMin * MINUTE),
  ...opts,
});

const ticketAsset = (i: number, a: Omit<TicketAsset, "id">): TicketAsset => ({
  id: `TAS-${String(i).padStart(3, "0")}`,
  ...a,
});

export const tickets: Ticket[] = [
  {
    id: "TKT-2026-014", title: "Server Room AC not cooling", description: "The air conditioner in the server room is not cooling below 28°C. Temperature trending up, risk of hardware failure.", customer: "IT Infrastructure", category: "Maintenance", priority: "critical", department: "IT", subDepartment: "Network & Security", createdBy: "Admin", createdAt: iso(40 * MINUTE), status: "open",
    assets: [
      ticketAsset(1, { assetId: "ACU-01", serialNumber: "SN-ACU-2101", itemType: "AC Unit", name: "Server Room Air Conditioner 5TR", currentLocation: "Repair Center", previousLocation: "Customer", status: "in", checkInDate: iso(2 * DAY) }),
      ticketAsset(2, { assetId: "FAN-01", serialNumber: "SN-FAN-8840", itemType: "Fan", name: "Ceiling Fan — Server Room Backup", currentLocation: "Repair Center", previousLocation: "Customer", status: "in", checkInDate: iso(2 * DAY) }),
    ],
    issues: [
      ticketIssue(1, "AC not cooling below 28°C", { agoMin: 38, priority: "critical", assignedTo: "Suresh Nair", description: "Compressor runs but no cooling effect observed." }),
      ticketIssue(2, "Ambient temperature rising above threshold", { agoMin: 30, priority: "high", assignedTo: "Suresh Nair", description: "Server room temperature trending above 30°C." }),
      ticketIssue(3, "Condenser drain line blocked", { agoMin: 25, priority: "medium", assignedTo: "Pooja Reddy", description: "Water leaking near the indoor unit." }),
    ],
    technicianId: "TECH-001",
    technicianRemark: "Checked capacitor and refrigerant levels. AC unit requires professional servicing.",
    completedAt: undefined,
  },
  {
    id: "TKT-2026-013", title: "Laptop battery swelling — MacBook Pro", description: "MacBook Pro 14\" assigned to Finance shows a swollen battery. Needs replacement before it damages the chassis.", customer: "Arun Mehta", category: "IT Support", priority: "high", department: "Finance", subDepartment: "Accounting", createdBy: "Arun Mehta", createdAt: iso(3 * HOUR), status: "in-progress",
    assets: [
      ticketAsset(3, { assetId: "PC-001", serialNumber: "SN-MBP-3391", itemType: "PC", name: "MacBook Pro 14\" — Finance", currentLocation: "Customer", previousLocation: "Technician Bench", status: "out", checkInDate: iso(3 * DAY), checkOutDate: iso(4 * HOUR) }),
    ],
    issues: [
      ticketIssue(4, "Swollen battery — risk of chassis damage", { agoMin: 170, priority: "critical", status: "resolved", resolvedAt: iso(5 * HOUR), resolution: "Battery pack replaced under warranty", assignedTo: "Aditya Patel", description: "Battery swelling visible on bottom case." }),
      ticketIssue(5, "Post-replacement diagnostics", { agoMin: 170, priority: "high", status: "in-progress", assignedTo: "Aditya Patel", description: "Run full diagnostics after battery swap." }),
    ],
    technicianId: "TECH-002",
  },
  {
    id: "TKT-2026-012", title: "Hydraulic oil stock replenishment", description: "Machine 3 hydraulic system is out of oil. Need urgent restock of ISO VG 68 drums and a spill kit inspection.", customer: "Machine Shop", category: "Inventory", priority: "critical", department: "Engineering", subDepartment: "Mechanical Engineering", createdBy: "Rajesh Kumar", createdAt: iso(6 * HOUR), status: "partially-resolved",
    assets: [
      ticketAsset(4, { assetId: "MCH-03", serialNumber: "SN-MCH-0312", itemType: "Machine", name: "Hydraulic Press — Machine 3", currentLocation: "Engineering Store", status: "in" }),
      ticketAsset(5, { assetId: "SPK-01", serialNumber: "SN-SPK-4401", itemType: "Spill Kit", name: "Spill Kit — Machine 3 bay", currentLocation: "Engineering Store", status: "in" }),
    ],
    issues: [
      ticketIssue(6, "Machine 3 hydraulic oil out of stock", { agoMin: 350, priority: "critical", status: "in-progress", assignedTo: "Rohan Gupta", description: "ISO VG 68 level below minimum." }),
      ticketIssue(7, "Restock ISO VG 68 drums (PO raised)", { agoMin: 340, priority: "high", status: "resolved", resolvedAt: iso(2 * HOUR), resolution: "PO-2026-0142 raised with PetroSupply Co.", assignedTo: "Deepak Verma" }),
      ticketIssue(8, "Spill kit inspection", { agoMin: 330, priority: "medium", status: "open", assignedTo: "Farhan Ali", description: "Check expiry and contents of spill kit." }),
    ],
    technicianId: "TECH-003",
  },
  {
    id: "TKT-2026-011", title: "New hire onboarding — 12 workstations", description: "12 new joiners joining next Monday. Need laptops, monitors and docking stations staged and configured.", customer: "HR Onboarding", category: "IT Support", priority: "high", department: "IT", subDepartment: "Hardware Support", createdBy: "Priya Sharma", createdAt: iso(1 * DAY), status: "open",
    assets: [
      ticketAsset(6, { assetId: "LAP-001", serialNumber: "SN-LPT-5520", itemType: "Laptop", name: "Dell Latitude 7440 — New Joiner", currentLocation: "Engineering", previousLocation: "Main Warehouse", status: "out", checkOutDate: iso(1 * DAY) }),
      ticketAsset(7, { assetId: "MON-001", serialNumber: "SN-MON-1180", itemType: "Monitor", name: "Dell UltraSharp 27\" — New Joiner", currentLocation: "Engineering", previousLocation: "IT Store", status: "out", checkOutDate: iso(1 * DAY) }),
      ticketAsset(8, { assetId: "DOC-001", serialNumber: "SN-DCK-7702", itemType: "Docking Station", name: "USB-C Dock — New Joiner", currentLocation: "IT Store", status: "in" }),
    ],
    issues: [
      ticketIssue(9, "Stage 12 laptops", { agoMin: 1400, priority: "high", assignedTo: "Aditya Patel", description: "Image and configure laptops for new joiners." }),
      ticketIssue(10, "Stage 12 monitors", { agoMin: 1400, priority: "medium", assignedTo: "Neha Kulkarni", description: "Stage monitors with cables." }),
      ticketIssue(11, "Configure docking stations", { agoMin: 1400, priority: "medium", assignedTo: "Aditya Patel", description: "Pair docks with laptops." }),
    ],
    technicianId: "TECH-002",
  },
  {
    id: "TKT-2026-010", title: "Warehouse racking safety inspection", description: "Aisle 2 pallet racking has a bent upright from forklift impact. Schedule structural inspection and repair.", customer: "Warehouse Ops", category: "Maintenance", priority: "high", department: "Logistics", subDepartment: "Warehouse Operations", createdBy: "Vikram Singh", createdAt: iso(2 * DAY), status: "in-progress",
    assets: [
      ticketAsset(9, { assetId: "RAK-02", serialNumber: "SN-RAK-2210", itemType: "Rack", name: "Pallet Racking — Aisle 2 Upright", currentLocation: "Main Warehouse", status: "in" }),
    ],
    issues: [
      ticketIssue(12, "Bent upright on Aisle 2 racking", { agoMin: 2850, priority: "high", status: "in-progress", assignedTo: "Suresh Nair", description: "Visible deformation from forklift impact." }),
      ticketIssue(13, "Structural inspection scheduled", { agoMin: 2800, priority: "medium", assignedTo: "Karan Johar", description: "Third-party inspection to be scheduled." }),
    ],
    technicianId: "TECH-001",
    technicianRemark: "Inspected bent upright, documented damage. Structural engineer scheduled for review.",
    completedAt: undefined,
  },
  {
    id: "TKT-2026-009", title: "Printer toner out — Admin wing", description: "HP LaserJet Pro M404dn in the admin wing shows low toner. Requesting replacement cartridge.", customer: "Admin Wing", category: "Inventory", priority: "medium", department: "Administration", subDepartment: "Office Management", createdBy: "Anita Desai", createdAt: iso(2 * DAY), status: "open",
    assets: [
      ticketAsset(10, { assetId: "PRN-01", serialNumber: "SN-PRN-3355", itemType: "Printer", name: "HP LaserJet Pro M404dn", currentLocation: "Repair Center", previousLocation: "Administration Room", status: "in", checkInDate: iso(1 * DAY) }),
    ],
    issues: [
      ticketIssue(14, "Toner cartridge low", { agoMin: 2860, priority: "medium", assignedTo: "Neha Kulkarni", description: "Printer reports low toner." }),
      ticketIssue(15, "Replacement cartridge stock", { agoMin: 2850, priority: "low", assignedTo: "Anita Desai", description: "Check replacement cartridge availability." }),
    ],
    technicianId: "TECH-004",
  },
  {
    id: "TKT-2026-008", title: "Fire extinguisher compliance check", description: "Annual fire safety audit next week. All ABC extinguishers need pressure check and tagging.", customer: "Safety Team", category: "Safety", priority: "medium", department: "Operations", subDepartment: "Safety & Compliance", createdBy: "Sanjay Gupta", createdAt: iso(3 * DAY), status: "closed", closedBy: "Admin", closedAt: iso(1 * DAY), resolution: "All 14 extinguishers inspected, tagged and logged in compliance register",
    assets: [
      ticketAsset(11, { assetId: "EXT-01", serialNumber: "SN-EXT-1001", itemType: "Extinguisher", name: "Fire Extinguisher ABC 4kg", currentLocation: "Main Warehouse", status: "in", checkInDate: iso(3 * DAY), checkOutDate: iso(1 * DAY) }),
      ticketAsset(12, { assetId: "EXT-02", serialNumber: "SN-EXT-1002", itemType: "Extinguisher", name: "Fire Extinguisher ABC 4kg", currentLocation: "Main Warehouse", status: "in", checkInDate: iso(3 * DAY), checkOutDate: iso(1 * DAY) }),
    ],
    issues: [
      ticketIssue(16, "Pressure check on all extinguishers", { agoMin: 4260, priority: "high", status: "resolved", resolvedAt: iso(1 * DAY), resolution: "All extinguishers within pressure range.", assignedTo: "Sanjay Gupta" }),
      ticketIssue(17, "Tagging and compliance register", { agoMin: 4250, priority: "medium", status: "resolved", resolvedAt: iso(1 * DAY), resolution: "Tagged and logged in compliance register.", assignedTo: "Sanjay Gupta" }),
    ],
  },
  {
    id: "TKT-2026-007", title: "Training lab projector flickering", description: "Epson EB-X49 projector in training lab flickers after 20 minutes of use. Likely lamp end-of-life.", customer: "Training Lab", category: "Maintenance", priority: "low", department: "Training", subDepartment: "Training Lab", createdBy: "Meera Iyer", createdAt: iso(4 * DAY), status: "closed", closedBy: "Admin", closedAt: iso(2 * DAY), resolution: "Lamp replaced under warranty, projector recalibrated",
    assets: [
      ticketAsset(13, { assetId: "PRJ-01", serialNumber: "SN-PRJ-0098", itemType: "Projector", name: "Epson EB-X49 Projector", currentLocation: "Training Lab", previousLocation: "Technician Bench", status: "out", checkInDate: iso(5 * DAY), checkOutDate: iso(3 * DAY) }),
    ],
    issues: [
      ticketIssue(18, "Projector lamp flickering", { agoMin: 5730, priority: "low", status: "resolved", resolvedAt: iso(2 * DAY), resolution: "Lamp replaced under warranty.", assignedTo: "Aditya Patel" }),
      ticketIssue(19, "Recalibrate projector after lamp swap", { agoMin: 5700, priority: "low", status: "resolved", resolvedAt: iso(2 * DAY), resolution: "Projector recalibrated and verified.", assignedTo: "Aditya Patel" }),
    ],
    technicianId: "TECH-005",
  },
  {
    id: "TKT-2026-006", title: "Stationery requisition for Q3", description: "Quarterly stationery requisition — pens, sticky notes, laminating pouches and A4 paper for all departments.", customer: "All Departments", category: "Procurement", priority: "low", department: "Administration", subDepartment: "Facilities", createdBy: "Anita Desai", createdAt: iso(5 * DAY), status: "closed", closedBy: "Admin", closedAt: iso(3 * DAY), resolution: "PO-2026-0145 raised and ordered from OfficeWorld Supplies",
    assets: [
      ticketAsset(14, { assetId: "STN-01", itemType: "Stationery", name: "Q3 Stationery Bundle", currentLocation: "Administration Room", status: "in" }),
    ],
    issues: [
      ticketIssue(20, "Consolidate department stationery list", { agoMin: 7180, priority: "low", status: "resolved", resolvedAt: iso(3 * DAY), resolution: "List consolidated across departments.", assignedTo: "Anita Desai" }),
      ticketIssue(21, "Raise purchase order", { agoMin: 7150, priority: "low", status: "resolved", resolvedAt: iso(3 * DAY), resolution: "PO raised with OfficeWorld Supplies.", assignedTo: "Deepak Verma" }),
    ],
  },
  {
    id: "TKT-2026-005", title: "Conveyor belt drive motor noise", description: "Conveyor drive motor 7.5kW in logistics bay making grinding noise during startup. Needs inspection.", customer: "Logistics Bay", category: "Maintenance", priority: "high", department: "Logistics", subDepartment: "Transport & Dispatch", createdBy: "Vikram Singh", createdAt: iso(6 * DAY), status: "in-progress",
    assets: [
      ticketAsset(15, { assetId: "MOT-01", serialNumber: "SN-MOT-5577", itemType: "Motor", name: "Conveyor Drive Motor 7.5kW", currentLocation: "Technician Bench", previousLocation: "Maintenance Workshop", status: "in-transit", checkInDate: iso(4 * DAY) }),
    ],
    issues: [
      ticketIssue(22, "Grinding noise during startup", { agoMin: 8580, priority: "high", status: "in-progress", assignedTo: "Pooja Reddy", description: "Grinding noise heard during startup." }),
      ticketIssue(23, "Bearing inspection", { agoMin: 8550, priority: "medium", assignedTo: "Pooja Reddy", description: "Inspect and replace bearings if needed." }),
    ],
    technicianId: "TECH-008",
  },
  {
    id: "TKT-2026-004", title: "Wi-Fi dead zone — Engineering floor", description: "Engineering floor has weak Wi-Fi near the CAD workstations. Access point needed or existing one relocated.", customer: "Engineering", category: "IT Support", priority: "medium", department: "Engineering", subDepartment: "Design & R&D", createdBy: "Rajesh Kumar", createdAt: iso(7 * DAY), status: "closed", closedBy: "Admin", closedAt: iso(5 * DAY), resolution: "Ubiquiti UniFi AP installed at CAD bay, coverage verified",
    assets: [
      ticketAsset(16, { assetId: "AP-01", serialNumber: "SN-UAP-3344", itemType: "Access Point", name: "Ubiquiti UniFi AP AC Pro", currentLocation: "Engineering Store", status: "in" }),
    ],
    issues: [
      ticketIssue(24, "Weak Wi-Fi at CAD workstations", { agoMin: 10020, priority: "medium", status: "resolved", resolvedAt: iso(5 * DAY), resolution: "Coverage verified after AP install.", assignedTo: "Neha Kulkarni" }),
      ticketIssue(25, "Install/relocate access point", { agoMin: 10000, priority: "medium", status: "resolved", resolvedAt: iso(5 * DAY), resolution: "AP installed at CAD bay.", assignedTo: "Aditya Patel" }),
    ],
    technicianId: "TECH-007",
  },
  {
    id: "TKT-2026-003", title: "CNC machine coolant leak", description: "CNC Milling Machine M3 shows coolant leak under the spindle. Floor mat saturated, needs cleanup and seal replacement.", customer: "Machine Shop", category: "Maintenance", priority: "high", department: "Engineering", subDepartment: "Mechanical Engineering", createdBy: "Rohan Gupta", createdAt: iso(8 * DAY), status: "closed", closedBy: "Admin", closedAt: iso(6 * DAY), resolution: "Spindle seal replaced, coolant topped up and leak tested",
    assets: [
      ticketAsset(17, { assetId: "CNC-03", serialNumber: "SN-CNC-0312", itemType: "Machine", name: "CNC Milling Machine M3", currentLocation: "Engineering Store", previousLocation: "Repair Center", status: "out", checkInDate: iso(7 * DAY), checkOutDate: iso(6 * DAY) }),
    ],
    issues: [
      ticketIssue(26, "Coolant leak under spindle", { agoMin: 11480, priority: "high", status: "resolved", resolvedAt: iso(6 * DAY), resolution: "Leak contained after seal replacement.", assignedTo: "Farhan Ali" }),
      ticketIssue(27, "Replace spindle seal", { agoMin: 11460, priority: "high", status: "resolved", resolvedAt: iso(6 * DAY), resolution: "Spindle seal replaced.", assignedTo: "Farhan Ali" }),
      ticketIssue(28, "Cleanup saturated floor mat", { agoMin: 11440, priority: "low", status: "resolved", resolvedAt: iso(6 * DAY), resolution: "Floor mat cleaned and replaced.", assignedTo: "Rohan Gupta" }),
    ],
    technicianId: "TECH-008",
  },
  {
    id: "TKT-2026-002", title: "Safety boots shortage", description: "Site crew safety boots size 8 below reorder level. Requesting purchase of 20 pairs before next deployment.", customer: "Site Crew", category: "Procurement", priority: "medium", department: "Operations", subDepartment: "Production", createdBy: "Sanjay Gupta", createdAt: iso(9 * DAY), status: "closed", closedBy: "Admin", closedAt: iso(7 * DAY), resolution: "Purchase order placed with SafeGuard PPE for 40 pairs",
    assets: [
      ticketAsset(18, { assetId: "BTS-08", itemType: "Boots", name: "Safety Boots Size 8 — Bulk Pack", currentLocation: "Main Warehouse", status: "in" }),
    ],
    issues: [
      ticketIssue(29, "Size 8 boots below reorder level", { agoMin: 12920, priority: "medium", status: "resolved", resolvedAt: iso(7 * DAY), resolution: "Stock below reorder level confirmed.", assignedTo: "Sanjay Gupta" }),
      ticketIssue(30, "Place purchase order for 20+ pairs", { agoMin: 12900, priority: "medium", status: "resolved", resolvedAt: iso(7 * DAY), resolution: "PO placed for 40 pairs.", assignedTo: "Deepak Verma" }),
    ],
  },
  {
    id: "TKT-2026-001", title: "UPS battery backup failing", description: "APC UPS 1500VA in server room drops to battery backup immediately on power cut. Batteries need replacement.", customer: "Server Room", category: "IT Support", priority: "critical", department: "IT", subDepartment: "Network & Security", createdBy: "Priya Sharma", createdAt: iso(10 * DAY), status: "closed", closedBy: "Admin", closedAt: iso(8 * DAY), resolution: "Battery pack replaced under service contract, runtime tested",
    assets: [
      ticketAsset(19, { assetId: "UPS-01", serialNumber: "SN-UPS-1500", itemType: "UPS", name: "APC UPS 1500VA", currentLocation: "Server Room", previousLocation: "Technician Bench", status: "out", checkInDate: iso(9 * DAY), checkOutDate: iso(8 * DAY) }),
    ],
    issues: [
      ticketIssue(31, "Battery backup failing on power cut", { agoMin: 14350, priority: "critical", status: "resolved", resolvedAt: iso(8 * DAY), resolution: "Runtime test passed after replacement.", assignedTo: "Aditya Patel" }),
      ticketIssue(32, "Replace battery pack", { agoMin: 14330, priority: "critical", status: "resolved", resolvedAt: iso(8 * DAY), resolution: "Battery pack replaced under contract.", assignedTo: "Aditya Patel" }),
      ticketIssue(33, "Runtime test after replacement", { agoMin: 14310, priority: "high", status: "resolved", resolvedAt: iso(8 * DAY), resolution: "Runtime verified at 40+ minutes.", assignedTo: "Neha Kulkarni" }),
    ],
    technicianId: "TECH-002",
  },
];

export const assetMovements: AssetMovement[] = [
  { id: "MOV-001", ticketId: "TKT-2026-014", assetId: "ACU-01", serialNumber: "SN-ACU-2101", itemType: "AC Unit", itemName: "Server Room Air Conditioner 5TR", movementType: "check-in", fromLocation: "Customer", toLocation: "Repair Center", performedBy: "Admin", date: iso(2 * DAY), remarks: "Received for cooling fault" },
  { id: "MOV-002", ticketId: "TKT-2026-014", assetId: "ACU-01", serialNumber: "SN-ACU-2101", itemType: "AC Unit", itemName: "Server Room Air Conditioner 5TR", movementType: "transfer", fromLocation: "Repair Center", toLocation: "Technician Bench", performedBy: "Suresh Nair", date: iso(1 * DAY), remarks: "Assigned to AC technician" },
  { id: "MOV-003", ticketId: "TKT-2026-014", assetId: "FAN-01", serialNumber: "SN-FAN-8840", itemType: "Fan", itemName: "Ceiling Fan — Server Room Backup", movementType: "check-in", fromLocation: "Customer", toLocation: "Repair Center", performedBy: "Admin", date: iso(2 * DAY), remarks: "Backup fan for server room" },
  { id: "MOV-004", ticketId: "TKT-2026-013", assetId: "PC-001", serialNumber: "SN-MBP-3391", itemType: "PC", itemName: "MacBook Pro 14\" — Finance", movementType: "check-in", fromLocation: "Customer", toLocation: "Repair Center", performedBy: "Arun Mehta", date: iso(3 * DAY), remarks: "Swollen battery" },
  { id: "MOV-005", ticketId: "TKT-2026-013", assetId: "PC-001", serialNumber: "SN-MBP-3391", itemType: "PC", itemName: "MacBook Pro 14\" — Finance", movementType: "transfer", fromLocation: "Repair Center", toLocation: "Technician Bench", performedBy: "Admin", date: iso(2 * DAY), remarks: "Handed to technician" },
  { id: "MOV-006", ticketId: "TKT-2026-013", assetId: "PC-001", serialNumber: "SN-MBP-3391", itemType: "PC", itemName: "MacBook Pro 14\" — Finance", movementType: "check-out", fromLocation: "Technician Bench", toLocation: "Customer", performedBy: "Aditya Patel", date: iso(4 * HOUR), remarks: "Battery replaced, returned to customer" },
  { id: "MOV-007", ticketId: "TKT-2026-011", assetId: "LAP-001", serialNumber: "SN-LPT-5520", itemType: "Laptop", itemName: "Dell Latitude 7440 — New Joiner", movementType: "check-out", fromLocation: "Main Warehouse", toLocation: "Engineering", performedBy: "Priya Sharma", date: iso(1 * DAY), remarks: "Issued for onboarding" },
  { id: "MOV-008", ticketId: "TKT-2026-011", assetId: "MON-001", serialNumber: "SN-MON-1180", itemType: "Monitor", itemName: "Dell UltraSharp 27\" — New Joiner", movementType: "check-out", fromLocation: "IT Store", toLocation: "Engineering", performedBy: "Neha Kulkarni", date: iso(1 * DAY), remarks: "Issued for onboarding" },
  { id: "MOV-009", ticketId: "TKT-2026-009", assetId: "PRN-01", serialNumber: "SN-PRN-3355", itemType: "Printer", itemName: "HP LaserJet Pro M404dn", movementType: "check-in", fromLocation: "Administration Room", toLocation: "Repair Center", performedBy: "Anita Desai", date: iso(1 * DAY), remarks: "Toner issue diagnosis" },
  { id: "MOV-010", ticketId: "TKT-2026-007", assetId: "PRJ-01", serialNumber: "SN-PRJ-0098", itemType: "Projector", itemName: "Epson EB-X49 Projector", movementType: "check-in", fromLocation: "Training Lab", toLocation: "Repair Center", performedBy: "Meera Iyer", date: iso(5 * DAY), remarks: "Lamp flickering" },
  { id: "MOV-011", ticketId: "TKT-2026-007", assetId: "PRJ-01", serialNumber: "SN-PRJ-0098", itemType: "Projector", itemName: "Epson EB-X49 Projector", movementType: "transfer", fromLocation: "Repair Center", toLocation: "Technician Bench", performedBy: "Admin", date: iso(4 * DAY), remarks: "Lamp replacement" },
  { id: "MOV-012", ticketId: "TKT-2026-007", assetId: "PRJ-01", serialNumber: "SN-PRJ-0098", itemType: "Projector", itemName: "Epson EB-X49 Projector", movementType: "check-out", fromLocation: "Technician Bench", toLocation: "Training Lab", performedBy: "Aditya Patel", date: iso(3 * DAY), remarks: "Returned after repair" },
  { id: "MOV-013", ticketId: "TKT-2026-005", assetId: "MOT-01", serialNumber: "SN-MOT-5577", itemType: "Motor", itemName: "Conveyor Drive Motor 7.5kW", movementType: "check-in", fromLocation: "Logistics Bay", toLocation: "Maintenance Workshop", performedBy: "Vikram Singh", date: iso(4 * DAY), remarks: "Grinding noise" },
  { id: "MOV-014", ticketId: "TKT-2026-005", assetId: "MOT-01", serialNumber: "SN-MOT-5577", itemType: "Motor", itemName: "Conveyor Drive Motor 7.5kW", movementType: "transfer", fromLocation: "Maintenance Workshop", toLocation: "Technician Bench", performedBy: "Suresh Nair", date: iso(3 * DAY), remarks: "Bearing inspection" },
  { id: "MOV-015", ticketId: "TKT-2026-003", assetId: "CNC-03", serialNumber: "SN-CNC-0312", itemType: "Machine", itemName: "CNC Milling Machine M3", movementType: "check-in", fromLocation: "Engineering Store", toLocation: "Repair Center", performedBy: "Rohan Gupta", date: iso(7 * DAY), remarks: "Coolant leak" },
  { id: "MOV-016", ticketId: "TKT-2026-003", assetId: "CNC-03", serialNumber: "SN-CNC-0312", itemType: "Machine", itemName: "CNC Milling Machine M3", movementType: "check-out", fromLocation: "Repair Center", toLocation: "Engineering Store", performedBy: "Farhan Ali", date: iso(6 * DAY), remarks: "Repair completed" },
  { id: "MOV-017", ticketId: "TKT-2026-001", assetId: "UPS-01", serialNumber: "SN-UPS-1500", itemType: "UPS", itemName: "APC UPS 1500VA", movementType: "check-in", fromLocation: "Server Room", toLocation: "Repair Center", performedBy: "Priya Sharma", date: iso(9 * DAY), remarks: "Battery backup failing" },
  { id: "MOV-018", ticketId: "TKT-2026-001", assetId: "UPS-01", serialNumber: "SN-UPS-1500", itemType: "UPS", itemName: "APC UPS 1500VA", movementType: "transfer", fromLocation: "Repair Center", toLocation: "Technician Bench", performedBy: "Admin", date: iso(8 * DAY), remarks: "Battery replacement" },
  { id: "MOV-019", ticketId: "TKT-2026-001", assetId: "UPS-01", serialNumber: "SN-UPS-1500", itemType: "UPS", itemName: "APC UPS 1500VA", movementType: "check-out", fromLocation: "Technician Bench", toLocation: "Server Room", performedBy: "Aditya Patel", date: iso(8 * DAY), remarks: "Runtime verified, reinstalled" },
  { id: "MOV-020", ticketId: "TKT-2026-014", assetId: "FAN-01", serialNumber: "SN-FAN-8840", itemType: "Fan", itemName: "Ceiling Fan — Server Room Backup", movementType: "transfer", fromLocation: "Repair Center", toLocation: "Technician Bench", performedBy: "Suresh Nair", date: iso(20 * HOUR), remarks: "Motor test pending" },
];

export const notifications: NotificationItem[] = [
  { id: "NTF-01", title: "Low stock alert", description: "Bosch Angle Grinder GWS 750 is below reorder level", date: iso(25 * MINUTE), read: false, type: "warning" },
  { id: "NTF-02", title: "Stock request pending", description: "REQ-2026-088 — Hydraulic Oil (Critical) awaits approval", date: iso(1 * HOUR), read: false, type: "danger" },
  { id: "NTF-03", title: "Purchase order received", description: "PO-2026-0148 delivered — MacBook Pro 14\"", date: iso(2 * HOUR), read: false, type: "success" },
  { id: "NTF-04", title: "Transfer approved", description: "TRF-2026-043 approved by Admin", date: iso(5 * HOUR), read: true, type: "info" },
  { id: "NTF-05", title: "Out of stock", description: "Hydraulic Oil 20L Drum is out of stock", date: iso(12 * HOUR), read: true, type: "warning" },
];

export const demoAccounts: DemoAccount[] = [
  { email: "admin@example.com", password: "admin123", role: "super-admin", name: "Arjun Mehta" },
  { email: "manager@example.com", password: "manager123", role: "department-manager", name: "Priya Sharma", department: "IT" },
  { email: "user@example.com", password: "user123", role: "department-user", name: "Rohan Gupta", department: "Engineering" },
];

export const chartSeries = {
  "7 days": {
    days: 7,
    stockIn: [12, 18, 9, 22, 15, 28, 34],
    stockOut: [8, 14, 12, 10, 18, 16, 22],
  },
  "30 days": {
    days: 30,
    stockIn: [120, 145, 132, 168, 154, 189, 175, 210, 195, 184, 220, 238, 205, 192, 240, 215, 228, 250, 232, 218, 245, 260, 238, 255, 270, 252, 265, 280, 258, 275],
    stockOut: [95, 110, 104, 128, 122, 118, 140, 132, 148, 138, 155, 162, 150, 142, 165, 158, 170, 168, 160, 172, 180, 175, 185, 178, 190, 182, 175, 188, 180, 192],
  },
  "3 months": {
    days: 90,
    stockIn: [420, 460, 440, 510, 480, 530, 505, 560, 540, 585, 555, 610],
    stockOut: [380, 395, 410, 430, 425, 450, 440, 465, 458, 475, 468, 490],
  },
  "1 year": {
    days: 365,
    stockIn: [4200, 4500, 4300, 4900, 4700, 5200, 5050, 5500, 5300, 5800, 5600, 6100],
    stockOut: [3850, 4000, 3950, 4300, 4200, 4500, 4400, 4700, 4550, 4900, 4800, 5050],
  },
} as const;

export const stockHealth = [
  { label: "Healthy", value: 10580, color: "#10b981" },
  { label: "Low Stock", value: 184, color: "#f59e0b" },
  { label: "Critical", value: 74, color: "#f97316" },
  { label: "Out of Stock", value: 32, color: "#ef4444" },
];

export const departmentNames = departments.map((d) => d.name);
export { depColor };

export function getDepartment(name: string) {
  return departments.find((d) => d.name === name) ?? departments[0];
}

export function computeStatus(qty: number, reorderLevel: number, maxStock: number): InventoryItem["status"] {
  if (qty <= 0) return "out-of-stock";
  if (qty <= reorderLevel) return "low-stock";
  if (qty >= maxStock) return "overstock";
  return "in-stock";
}

export function itemsForDepartment(department: string) {
  return inventoryItems.filter((i) => i.department === department && !i.archived);
}

// Configurable workload thresholds for technicians (frontend-only config).
// 0–(mediumFrom-1) → low/green, mediumFrom–(highFrom-1) → medium/orange, >= highFrom → high/red
export const workloadThresholds = { mediumFrom: 4, highFrom: 7 };

export function workloadLevel(activeTickets: number): "low" | "medium" | "high" {
  if (activeTickets >= workloadThresholds.highFrom) return "high";
  if (activeTickets >= workloadThresholds.mediumFrom) return "medium";
  return "low";
}

// Technician data for the Technician Management feature
export const technicians: Technician[] = [
  {
    id: "TECH-001",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    employeeId: "EMP-0101",
    specialization: "Hardware",
    availability: "Available",
    status: "Active",
    activeTickets: 2,
    resolvedTickets: 28,
    phone: "+91 98765 43210",
    lastActive: iso(15 * MINUTE),
    color: "#4f46e5",
  },
  {
    id: "TECH-002",
    name: "Amit Patel",
    email: "amit@example.com",
    employeeId: "EMP-0102",
    specialization: "Software",
    availability: "Busy",
    status: "Active",
    activeTickets: 2,
    resolvedTickets: 35,
    phone: "+91 98765 43211",
    lastActive: iso(8 * MINUTE),
    color: "#0ea5e9",
  },
  {
    id: "TECH-003",
    name: "Priya Shah",
    email: "priya@example.com",
    employeeId: "EMP-0103",
    specialization: "Network",
    availability: "Available",
    status: "Active",
    activeTickets: 1,
    resolvedTickets: 19,
    phone: "+91 98765 43212",
    lastActive: iso(22 * MINUTE),
    color: "#10b981",
  },
  {
    id: "TECH-004",
    name: "Sneha Gupta",
    email: "sneha@example.com",
    employeeId: "EMP-0104",
    specialization: "Hardware",
    availability: "Busy",
    status: "Active",
    activeTickets: 1,
    resolvedTickets: 22,
    phone: "+91 98765 43213",
    lastActive: iso(5 * MINUTE),
    color: "#f59e0b",
  },
  {
    id: "TECH-005",
    name: "Vikram Singh",
    email: "vikram@example.com",
    employeeId: "EMP-0105",
    specialization: "Software",
    availability: "Available",
    status: "Active",
    activeTickets: 0,
    resolvedTickets: 31,
    phone: "+91 98765 43214",
    lastActive: iso(18 * MINUTE),
    color: "#8b5cf6",
  },
  {
    id: "TECH-006",
    name: "Ananya Desai",
    email: "ananya@example.com",
    employeeId: "EMP-0106",
    specialization: "Network",
    availability: "Offline",
    status: "Inactive",
    activeTickets: 0,
    resolvedTickets: 15,
    phone: "+91 98765 43215",
    lastActive: iso(2 * DAY),
    color: "#6b7280",
  },
  {
    id: "TECH-007",
    name: "Karan Mehta",
    email: "karan@example.com",
    employeeId: "EMP-0107",
    specialization: "Hardware",
    availability: "Available",
    status: "Active",
    activeTickets: 0,
    resolvedTickets: 18,
    phone: "+91 98765 43216",
    lastActive: iso(12 * MINUTE),
    color: "#ef4444",
  },
  {
    id: "TECH-008",
    name: "Deepika Reddy",
    email: "deepika@example.com",
    employeeId: "EMP-0108",
    specialization: "Software",
    availability: "Available",
    status: "Active",
    activeTickets: 1,
    resolvedTickets: 27,
    phone: "+91 98765 43217",
    lastActive: iso(7 * MINUTE),
    color: "#14b8a6",
  },
];
