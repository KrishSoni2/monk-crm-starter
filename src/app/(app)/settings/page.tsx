import { PageHeader } from "@/components/page-header";
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
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Sales reps and connections." />
      <RepsManager initialReps={reps} />
      <CalendlyStatus />
    </div>
  );
}
