import { PageHeader } from "@/components/page-header";
import { getSalesOverview } from "@/modules/sales/server/queries";

export const dynamic = "force-dynamic";

// Stage 1 placeholder: proves the database and demo seed work. The bookings table,
// board and stats replace this in the next stages.
export default async function SalesPage() {
  const overview = await getSalesOverview();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Sales" description="Every Calendly booking in one place." />
      <div className="grid max-w-3xl grid-cols-3 gap-4">
        <Stat label="Bookings" value={overview.bookings} />
        <Stat label="Reps" value={overview.reps} />
        <Stat label="Call attempts" value={overview.callAttempts} />
      </div>
      <p className="text-sm text-subtle">The bookings table and board arrive in the next build stage.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line p-card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-medium tabular-nums">{value}</p>
    </div>
  );
}
