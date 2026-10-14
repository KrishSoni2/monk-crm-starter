"use client";

import { CalendarDays, LayoutGrid, Table2, UserRound } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InitialsAvatar } from "@/modules/sales/components/rep-label";
import { DATE_RANGES, type DateRange, type SalesFilters } from "@/modules/sales/stats";
import type { RepRow } from "@/modules/sales/types";

export type SalesView = "table" | "board";

// One row of filters above everything they affect: stats, list, board and chart.
export function FiltersBar({
  filters,
  onChange,
  reps,
  view,
  onViewChange,
}: {
  filters: SalesFilters;
  onChange: (filters: SalesFilters) => void;
  reps: RepRow[];
  view: SalesView;
  onViewChange: (view: SalesView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <Select value={filters.range} onValueChange={(range) => onChange({ ...filters, range: range as DateRange })}>
          <SelectTrigger className="h-8 w-[140px]" aria-label="Date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <UserRound className="size-4 text-muted-foreground" />
        <Select value={filters.rep} onValueChange={(rep) => onChange({ ...filters, rep })}>
          <SelectTrigger className="h-8 w-[160px]" aria-label="Rep">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reps</SelectItem>
            {reps.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <span className="flex items-center gap-2">
                  <InitialsAvatar name={r.name} color={r.color} className="size-5 [&_[data-slot=avatar-fallback]]:text-[10px]" />
                  {r.name}
                </span>
              </SelectItem>
            ))}
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={view} onValueChange={(v) => onViewChange(v as SalesView)} className="ml-auto">
        <TabsList>
          <TabsTrigger value="table" className="gap-2 px-3">
            <Table2 className="size-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="board" className="gap-2 px-3">
            <LayoutGrid className="size-4" />
            Board
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
