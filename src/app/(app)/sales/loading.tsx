import { Skeleton } from "@/components/ui/skeleton";

// Shown while the Sales page loads: the masthead, stat cards and table in outline.
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-8 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-lg border bg-card p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
