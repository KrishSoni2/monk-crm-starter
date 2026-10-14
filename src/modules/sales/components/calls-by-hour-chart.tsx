"use client";

import { Bar, BarChart, CartesianGrid, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HourBucket, HourMode } from "@/modules/sales/stats";

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "am" : "pm";
  return `${hour % 12 === 0 ? 12 : hour % 12}${suffix}`;
}

// Always show at least 8am-6pm; widen to include any hour that has calls.
function visibleHours(buckets: HourBucket[]) {
  const withCalls = buckets.filter((b) => b.answered + b.notAnswered > 0).map((b) => b.hour);
  const first = Math.min(8, ...withCalls);
  const last = Math.max(18, ...withCalls);
  return buckets.slice(first, last + 1);
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-chart-1" /> Answered
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-chart-2" /> No answer
      </span>
    </div>
  );
}

function HourTooltip({ active, payload }: { active?: boolean; payload?: { payload: HourBucket }[] }) {
  const bucket = payload?.[0]?.payload;
  if (!active || !bucket) return null;
  const total = bucket.answered + bucket.notAnswered;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground">
      <p className="font-medium">
        {hourLabel(bucket.hour)} to {hourLabel((bucket.hour + 1) % 24)}
      </p>
      {total === 0 ? (
        <p className="mt-1 text-muted-foreground">No calls</p>
      ) : (
        <p className="mt-1 text-muted-foreground tabular-nums">
          {total} {total === 1 ? "call" : "calls"} · {bucket.answered} answered ({Math.round((bucket.answered / total) * 100)}%)
        </p>
      )}
    </div>
  );
}

// Round only the top of each stack (4px). "Answered" sits at the bottom, so it gets the
// rounded top only when there's no "no answer" segment above it.
function AnsweredShape(props: BarShapeProps) {
  const top = (props.payload as HourBucket).notAnswered === 0;
  return <Rectangle {...props} radius={top ? [4, 4, 0, 0] : 0} />;
}

export function CallsByHourChart({
  buckets,
  mode,
  onModeChange,
}: {
  buckets: HourBucket[] | null;
  mode: HourMode;
  onModeChange: (mode: HourMode) => void;
}) {
  const data = buckets ? visibleHours(buckets) : [];
  const total = data.reduce((sum, b) => sum + b.answered + b.notAnswered, 0);

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-base font-medium">Call attempts by hour</CardTitle>
          <CardDescription>When people pick up. Use it to plan your calling blocks.</CardDescription>
        </div>
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as HourMode)}>
          <TabsList aria-label="Time zone">
            <TabsTrigger value="theirs" className="px-3">
              Their time
            </TabsTrigger>
            <TabsTrigger value="mine" className="px-3">
              My time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
      <Legend />

      {buckets && total === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-subtle">
          No call attempts in this range yet. Log calls from a booking&apos;s side panel.
        </div>
      ) : (
        <div className="mt-4 h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -24 }} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="hour"
                tickFormatter={hourLabel}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--subtle-foreground)", fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--subtle-foreground)", fontSize: 12 }}
              />
              <Tooltip content={<HourTooltip />} cursor={{ fill: "var(--accent)" }} isAnimationActive={false} />
              {/* Stacked: answered at the bottom; a 2px background-colored stroke separates the segments. */}
              <Bar
                dataKey="answered"
                stackId="calls"
                fill="var(--chart-1)"
                stroke="var(--card)"
                strokeWidth={2}
                shape={AnsweredShape}
                animationDuration={300}
              />
              <Bar
                dataKey="notAnswered"
                stackId="calls"
                fill="var(--chart-2)"
                stroke="var(--card)"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                animationDuration={300}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* The same numbers as a table, for screen readers. */}
      <table className="sr-only">
        <caption>Call attempts by hour ({mode === "theirs" ? "invitee's local time" : "your time"})</caption>
        <thead>
          <tr>
            <th>Hour</th>
            <th>Answered</th>
            <th>No answer</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b) => (
            <tr key={b.hour}>
              <td>{hourLabel(b.hour)}</td>
              <td>{b.answered}</td>
              <td>{b.notAnswered}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </CardContent>
    </Card>
  );
}
