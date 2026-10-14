import { PageMasthead, PageShell } from "@/components/layout/page-shell";
import { CalendlyStatus } from "@/modules/sales/components/calendly-status";
import { RepsManager } from "@/modules/sales/components/reps-manager";
import { listReps, prepareSalesData } from "@/modules/sales/server/queries";

export const dynamic = "force-dynamic";

// AI-GUIDE: The Settings page. Each module adds its own settings as a card component
// (e.g. RepsManager, CalendlyStatus). To add one, build it in your module's components/
// folder and render it below.
export default async function SettingsPage() {
  await prepareSalesData();
  const reps = await listReps();

  return (
    <PageShell maxWidth="6xl">
      <PageMasthead eyebrow="Settings" title="Team & connections" subtitle="Your sales reps and how the app connects to Calendly." />
      <div className="grid gap-6 lg:grid-cols-2">
        <RepsManager initialReps={reps} />
        <CalendlyStatus />
      </div>
    </PageShell>
  );
}
