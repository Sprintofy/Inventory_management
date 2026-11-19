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
    bg: colorScale[50],
    bgHover: colorScale[100],
    border: colorScale[200],
    text: colorScale[700],
    textDark: colorScale[900],
    icon: colorScale[500],
    ring: colorScale[300],
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
  pending: { bg: THEME_COLORS.amber[50], text: THEME_COLORS.amber[700], border: THEME_COLORS.amber[200], icon: THEME_COLORS.amber[500] },
  "Stock Out": { bg: THEME_COLORS.emerald[50], text: THEME_COLORS.emerald[700], border: THEME_COLORS.emerald[200], icon: THEME_COLORS.emerald[500] },
  cancelled: { bg: THEME_COLORS.rose[50], text: THEME_COLORS.rose[700], border: THEME_COLORS.rose[200], icon: THEME_COLORS.rose[500] },
  received: { bg: THEME_COLORS.sky[50], text: THEME_COLORS.sky[700], border: THEME_COLORS.sky[200], icon: THEME_COLORS.sky[500] },
  issued: { bg: THEME_COLORS.violet[50], text: THEME_COLORS.violet[700], border: THEME_COLORS.violet[200], icon: THEME_COLORS.violet[500] },
  active: { bg: THEME_COLORS.emerald[50], text: THEME_COLORS.emerald[700], border: THEME_COLORS.emerald[200], icon: THEME_COLORS.emerald[500] },
  inactive: { bg: THEME_COLORS.rose[50], text: THEME_COLORS.rose[700], border: THEME_COLORS.rose[200], icon: THEME_COLORS.rose[500] },
  completed: { bg: THEME_COLORS.sky[50], text: THEME_COLORS.sky[700], border: THEME_COLORS.sky[200], icon: THEME_COLORS.sky[500] },
  rejected: { bg: THEME_COLORS.rose[50], text: THEME_COLORS.rose[700], border: THEME_COLORS.rose[200], icon: THEME_COLORS.rose[500] },
  approved: { bg: THEME_COLORS.emerald[50], text: THEME_COLORS.emerald[700], border: THEME_COLORS.emerald[200], icon: THEME_COLORS.emerald[500] },
};

export function getStatusColors(status: string) {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || {
    bg: THEME_COLORS.indigo[50],
    text: THEME_COLORS.indigo[700],
    border: THEME_COLORS.indigo[200],
    icon: THEME_COLORS.indigo[500],
  };
}

export const ICON_BG_CLASSES = [
  "bg-primary/10 text-primary",
  "bg-sky-500/10 text-sky-500",
  "bg-emerald-500/10 text-emerald-500",
  "bg-amber-500/10 text-amber-500",
  "bg-rose-500/10 text-rose-500",
  "bg-violet-500/10 text-violet-500",
  "bg-indigo-500/10 text-indigo-500",
  "bg-teal-500/10 text-teal-500",
  "bg-orange-500/10 text-orange-500",
];

export function getIconBgClass(index: number) {
  return ICON_BG_CLASSES[index % ICON_BG_CLASSES.length];
}

export const CARD_GRADIENTS = [
  "from-primary/5 via-transparent to-sky-500/5",
  "from-sky-500/5 via-transparent to-emerald-500/5",
  "from-emerald-500/5 via-transparent to-amber-500/5",
  "from-amber-500/5 via-transparent to-rose-500/5",
  "from-rose-500/5 via-transparent to-violet-500/5",
  "from-violet-500/5 via-transparent to-indigo-500/5",
  "from-indigo-500/5 via-transparent to-teal-500/5",
  "from-teal-500/5 via-transparent to-orange-500/5",
  "from-orange-500/5 via-transparent to-primary/5",
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