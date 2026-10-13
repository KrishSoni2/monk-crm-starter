"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RepDot } from "@/modules/sales/components/rep-label";
import { segmentItemClass } from "@/modules/sales/components/segment";
import { DATE_RANGES, type DateRange, type SalesFilters } from "@/modules/sales/stats";
import type { RepRow } from "@/modules/sales/types";

export type SalesView = "table" | "board";

// One row of filters above everything they affect: stats, list and chart.
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
      <ToggleGroup
        type="single"
        value={filters.range}
        onValueChange={(v) => v && onChange({ ...filters, range: v as DateRange })}
        aria-label="Date range"
      >
        {DATE_RANGES.map((r) => (
          <ToggleGroupItem key={r.value} value={r.value} className={segmentItemClass}>
            {r.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Select value={filters.rep} onValueChange={(rep) => onChange({ ...filters, rep })}>
        <SelectTrigger className="w-44" aria-label="Rep">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All reps</SelectItem>
          {reps.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              <RepDot color={r.color} />
              {r.name}
            </SelectItem>
          ))}
          <SelectItem value="unassigned">Unassigned</SelectItem>
        </SelectContent>
      </Select>

      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && onViewChange(v as SalesView)}
        aria-label="View"
        className="ml-auto"
      >
        <ToggleGroupItem value="table" className={segmentItemClass}>
          <Table2 />
          Table
        </ToggleGroupItem>
        <ToggleGroupItem value="board" className={segmentItemClass}>
          <LayoutGrid />
          Board
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
