import { PageHeader } from "@/components/page-header";
import { isDemoMode } from "@/lib/env";
import { SalesWorkspace } from "@/modules/sales/components/sales-workspace";
import { SyncButton } from "@/modules/sales/components/sync-button";
import { getLastSyncRun } from "@/modules/sales/integrations/calendly/sync";
import { listBookings, listReps, prepareSalesData } from "@/modules/sales/server/queries";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  await prepareSalesData();
  const [bookings, reps, lastSync] = await Promise.all([listBookings(), listReps(), getLastSyncRun()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Sales"
        description="Every Calendly booking in one place."
        actions={
          <SyncButton
            demoMode={isDemoMode()}
            lastSyncedAt={lastSync?.finishedAt?.toISOString() ?? null}
            lastStatus={lastSync?.status ?? null}
          />
        }
      />
      <SalesWorkspace initialBookings={bookings} reps={reps} />
    </div>
  );
}
