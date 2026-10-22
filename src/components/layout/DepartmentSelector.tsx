"use client";

import * as React from "react";
import { Building2, Check } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DepartmentSelector({ className }: { className?: string }) {
  const { role, visibleDepartments, state, setDepartment, activeDepartment } = useApp();
  const isGlobal = role === "super-admin" || role === "admin";

  if (!isGlobal && visibleDepartments.length === 1) {
    return (
      <div className={className}>
        <div className="border-input flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm shadow-xs">
          <Building2 className="text-muted-foreground size-3.5" />
          <span className="font-medium">{visibleDepartments[0]}</span>
        </div>
      </div>
    );
  }

  return (
    <Select value={state.department} onValueChange={setDepartment}>
      <SelectTrigger className={className}>
        <Building2 className="text-muted-foreground size-3.5" />
        <SelectValue placeholder="Select department" />
      </SelectTrigger>
      <SelectContent align="end">
        {isGlobal && (
          <SelectItem value="all">
            <Building2 className="size-3.5" />
            All Departments
          </SelectItem>
        )}
        {visibleDepartments.map((d) => (
          <SelectItem key={d} value={d}>
            {d}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { Check };
