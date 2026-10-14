import { PageMasthead, PageShell } from "@/components/layout/page-shell";
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
    <PageShell>
      <PageMasthead
        eyebrow="Sales"
        title="Bookings & outcomes"
        subtitle="Every Calendly booking in one place: who was called, who answered, and how it ended."
        actions={
          <SyncButton
            demoMode={isDemoMode()}
            lastSyncedAt={lastSync?.finishedAt?.toISOString() ?? null}
            lastStatus={lastSync?.status ?? null}
          />
        }
      />
      <SalesWorkspace initialBookings={bookings} reps={reps} />
    </PageShell>
  );
}
