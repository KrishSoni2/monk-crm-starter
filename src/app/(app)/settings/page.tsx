import { PageHeader } from "@/components/page-header";
import { RepsManager } from "@/modules/sales/components/reps-manager";
import { listReps, prepareSalesData } from "@/modules/sales/server/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await prepareSalesData();
  const reps = await listReps();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Sales reps and connections." />
      <RepsManager initialReps={reps} />
    </div>
  );
}
