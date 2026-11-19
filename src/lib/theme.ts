"use client";

export const THEME_COLORS = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
};

export const CATEGORY_COLORS = [
  THEME_COLORS.primary,
  THEME_COLORS.sky,
  THEME_COLORS.emerald,
  THEME_COLORS.amber,
  THEME_COLORS.rose,
  THEME_COLORS.violet,
  THEME_COLORS.indigo,
  THEME_COLORS.teal,
  THEME_COLORS.orange,
];

export function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export function getColorVariants(colorScale: typeof THEME_COLORS.primary) {
  return {
    bg: colorScale[100],
    bgHover: colorScale[200],
    border: colorScale[300],
    text: colorScale[800],
    textDark: colorScale[900],
    icon: colorScale[500],
    ring: colorScale[400],
  };
}

export const DEPARTMENT_COLORS = [
  "#3b82f6", // primary
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f97316", // orange
  "#ec4899", // pink
];

export function getDepartmentColor(index: number) {
  return DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
}

export const STATUS_COLORS = {
  pending: { bg: THEME_COLORS.amber[200], text: THEME_COLORS.amber[900], border: THEME_COLORS.amber[400], icon: THEME_COLORS.amber[500] },
  "Stock Out": { bg: THEME_COLORS.emerald[200], text: THEME_COLORS.emerald[900], border: THEME_COLORS.emerald[400], icon: THEME_COLORS.emerald[500] },
  cancelled: { bg: THEME_COLORS.rose[200], text: THEME_COLORS.rose[900], border: THEME_COLORS.rose[400], icon: THEME_COLORS.rose[500] },
  received: { bg: THEME_COLORS.sky[200], text: THEME_COLORS.sky[900], border: THEME_COLORS.sky[400], icon: THEME_COLORS.sky[500] },
  issued: { bg: THEME_COLORS.violet[200], text: THEME_COLORS.violet[900], border: THEME_COLORS.violet[400], icon: THEME_COLORS.violet[500] },
  active: { bg: THEME_COLORS.emerald[200], text: THEME_COLORS.emerald[900], border: THEME_COLORS.emerald[400], icon: THEME_COLORS.emerald[500] },
  inactive: { bg: THEME_COLORS.rose[200], text: THEME_COLORS.rose[900], border: THEME_COLORS.rose[400], icon: THEME_COLORS.rose[500] },
  completed: { bg: THEME_COLORS.sky[200], text: THEME_COLORS.sky[900], border: THEME_COLORS.sky[400], icon: THEME_COLORS.sky[500] },
  rejected: { bg: THEME_COLORS.rose[200], text: THEME_COLORS.rose[900], border: THEME_COLORS.rose[400], icon: THEME_COLORS.rose[500] },
  approved: { bg: THEME_COLORS.emerald[200], text: THEME_COLORS.emerald[900], border: THEME_COLORS.emerald[400], icon: THEME_COLORS.emerald[500] },
};

export function getStatusColors(status: string) {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || {
    bg: THEME_COLORS.indigo[200],
    text: THEME_COLORS.indigo[900],
    border: THEME_COLORS.indigo[400],
    icon: THEME_COLORS.indigo[500],
  };
}

export const ICON_BG_CLASSES = [
  "bg-primary/20 text-primary",
  "bg-sky-500/20 text-sky-500",
  "bg-emerald-500/20 text-emerald-500",
  "bg-amber-500/20 text-amber-500",
  "bg-rose-500/20 text-rose-500",
  "bg-violet-500/20 text-violet-500",
  "bg-indigo-500/20 text-indigo-500",
  "bg-teal-500/20 text-teal-500",
  "bg-orange-500/20 text-orange-500",
];

export function getIconBgClass(index: number) {
  return ICON_BG_CLASSES[index % ICON_BG_CLASSES.length];
}

export const CARD_GRADIENTS = [
  "from-primary/25 via-sky-500/15 to-transparent",
  "from-sky-500/25 via-emerald-500/15 to-transparent",
  "from-emerald-500/25 via-amber-500/15 to-transparent",
  "from-amber-500/25 via-rose-500/15 to-transparent",
  "from-rose-500/25 via-violet-500/15 to-transparent",
  "from-violet-500/25 via-indigo-500/15 to-transparent",
  "from-indigo-500/25 via-teal-500/15 to-transparent",
  "from-teal-500/25 via-orange-500/15 to-transparent",
  "from-orange-500/25 via-primary/15 to-transparent",
];

export function getCardGradient(index: number) {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

export const CHART_PALETTE = [
  "#3b82f6", // primary
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f97316", // orange
  "#ec4899", // pink
];

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getChartColor(index: number, alpha = 1) {
  const hex = CHART_PALETTE[index % CHART_PALETTE.length];
  return alpha < 1 ? hexToRgba(hex, alpha) : hex;
}

export const PAGE_GRADIENTS = {
  dashboard: "from-primary/10 via-sky-500/5 to-emerald-500/5",
  inventory: "from-sky-500/10 via-emerald-500/5 to-teal-500/5",
  stockIn: "from-amber-500/10 via-orange-500/5 to-rose-500/5",
  reports: "from-violet-500/10 via-indigo-500/5 to-primary-500/5",
  technicians: "from-emerald-500/10 via-teal-500/5 to-sky-500/5",
  categories: "from-rose-500/10 via-violet-500/5 to-primary-500/5",
};

export function getPageGradient(page: keyof typeof PAGE_GRADIENTS) {
  return PAGE_GRADIENTS[page];
}