export type WorkloadLevelKey = "low" | "medium" | "high" | "critical";

export interface WorkloadLevel {
  key: WorkloadLevelKey;
  label: string;
  color: string;
  bg: string;
}

export function workloadLevel(val: unknown = 0): WorkloadLevel {
  const count =
    typeof val === "number" ? val : Array.isArray(val) ? val.length : 0;

  const key: WorkloadLevelKey =
    count >= 10
      ? "critical"
      : count >= 7
        ? "high"
        : count >= 3
          ? "medium"
          : "low";

  const presets: Record<
    WorkloadLevelKey,
    { label: string; color: string; bg: string }
  > = {
    low: { label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    medium: { label: "Medium", color: "text-blue-500", bg: "bg-blue-500/10" },
    high: { label: "High", color: "text-amber-500", bg: "bg-amber-500/10" },
    critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10" },
  };

  return { key, ...presets[key] };
}
