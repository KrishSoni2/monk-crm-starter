import { PageHeader } from "@/components/page-header";
import { SalesWorkspace } from "@/modules/sales/components/sales-workspace";
import { listBookings, listReps, prepareSalesData } from "@/modules/sales/server/queries";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  await prepareSalesData();
  const [bookings, reps] = await Promise.all([listBookings(), listReps()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Sales" description="Every Calendly booking in one place." />
      <SalesWorkspace initialBookings={bookings} reps={reps} />
    </div>
  );
}
