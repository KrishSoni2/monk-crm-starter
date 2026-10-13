import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

// Stage 1 placeholder. Reps management and the Calendly connection status come next.
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Sales reps and connections." />
      <p className="text-sm text-subtle">Rep management arrives in the next build stage.</p>
    </div>
  );
}
