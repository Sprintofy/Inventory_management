"use client";

import * as React from "react";
import { CalendarRange, FilterX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/store/app-store";

export interface InventoryFiltersState {
  department: string;
  category: string;
  supplier: string;
  dateFrom: string;
  dateTo: string;
}

export const emptyFilters: InventoryFiltersState = {
  department: "all",
  category: "all",
  supplier: "all",
  dateFrom: "",
  dateTo: "",
};

export function InventoryFilters({
  filters,
  onChange,
}: {
  filters: InventoryFiltersState;
  onChange: (f: InventoryFiltersState) => void;
}) {
  const { state, visibleDepartments } = useApp();
  const activeCount = Object.entries(filters).filter(([, v]) => v !== "all" && v !== "").length;

  const set = (patch: Partial<InventoryFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <Badge className="bg-primary text-primary-foreground absolute -top-2 -right-2 size-4 rounded-full p-0 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Filters</p>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 text-xs" onClick={() => onChange(emptyFilters)}>
              <FilterX className="size-3.5" /> Clear all
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={filters.department} onValueChange={(v) => set({ department: v })}>
                <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {visibleDepartments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={filters.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {state.categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Supplier</Label>
              <Select value={filters.supplier} onValueChange={(v) => set({ supplier: v })}>
                <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {state.suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-xs">
              <CalendarRange className="size-3.5" /> Updated between
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" size={4} value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} className="h-8 text-xs" />
              <Input type="date" size={4} value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Stock In Filters
export interface StockInFiltersState {
  supplier: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const emptyStockInFilters: StockInFiltersState = {
  supplier: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
};

export function StockInFilters({
  filters,
  onChange,
  suppliers,
}: {
  filters: StockInFiltersState;
  onChange: (f: StockInFiltersState) => void;
  suppliers: string[];
}) {
  const activeCount = Object.entries(filters).filter(([, v]) => v !== "all" && v !== "").length;

  const set = (patch: Partial<StockInFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <Badge className="bg-primary text-primary-foreground absolute -top-2 -right-2 size-4 rounded-full p-0 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Filters</p>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 text-xs" onClick={() => onChange(emptyStockInFilters)}>
              <FilterX className="size-3.5" /> Clear all
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Supplier</Label>
              <Select value={filters.supplier} onValueChange={(v) => set({ supplier: v })}>
                <SelectTrigger size="sm" className="w-full"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger size="sm" className="w-full"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <Label className="flex items-center gap-1.5 text-xs">
              <CalendarRange className="size-3.5" /> Date between
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} className="h-8 text-xs" aria-label="From date" />
              <Input type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} className="h-8 text-xs" aria-label="To date" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Stock Out Filters
export interface StockOutFiltersState {
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const emptyStockOutFilters: StockOutFiltersState = {
  status: "all",
  dateFrom: "",
  dateTo: "",
};

export function StockOutFilters({
  filters,
  onChange,
}: {
  filters: StockOutFiltersState;
  onChange: (f: StockOutFiltersState) => void;
}) {
  const activeCount = Object.entries(filters).filter(([, v]) => v !== "all" && v !== "").length;

  const set = (patch: Partial<StockOutFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <Badge className="bg-primary text-primary-foreground absolute -top-2 -right-2 size-4 rounded-full p-0 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Filters</p>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 text-xs" onClick={() => onChange(emptyStockOutFilters)}>
              <FilterX className="size-3.5" /> Clear all
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger size="sm" className="w-full"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <Label className="flex items-center gap-1.5 text-xs">
              <CalendarRange className="size-3.5" /> Date between
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} className="h-8 text-xs" aria-label="From date" />
              <Input type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} className="h-8 text-xs" aria-label="To date" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}