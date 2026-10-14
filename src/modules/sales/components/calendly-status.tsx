import { Check, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env, isDemoMode } from "@/lib/env";
import { getLastSyncRun } from "@/modules/sales/integrations/calendly/sync";

// Shows which Calendly settings are present. It only ever reports "set" or "not set",
// never the values themselves.
function Row({ label, set, hint }: { label: string; set: boolean; hint: string }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      {set ? (
        <Check className="mt-0.5 size-4 shrink-0 text-positive" strokeWidth={2} />
      ) : (
        <Minus className="mt-0.5 size-4 shrink-0 text-subtle" strokeWidth={2} />
      )}
      <div className="min-w-0 text-sm">
        <p>
          <code className="font-medium text-foreground">{label}</code>{" "}
          <span className="text-muted-foreground">{set ? "is set" : "is not set"}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
    </li>
  );
}

export async function CalendlyStatus() {
  const last = await getLastSyncRun();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Calendly connection</CardTitle>
        <CardDescription>
          {isDemoMode()
            ? "Not connected. You're seeing demo data until CALENDLY_TOKEN is set."
            : "Connected. Bookings sync from Calendly."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          <Row label="CALENDLY_TOKEN" set={Boolean(env.calendlyToken())} hint="Needed to sync bookings. Works on the free plan." />
          <Row label="SYNC_SECRET" set={Boolean(env.syncSecret())} hint="Lets the Railway cron sync every 15 minutes." />
          <Row
            label="CALENDLY_WEBHOOK_SIGNING_KEY"
            set={Boolean(env.webhookSigningKey())}
            hint="Optional instant updates. Paid Calendly plans only."
          />
        </ul>
        <div className="text-sm">
          {last ? (
            <p className="text-muted-foreground">
              Last sync ({last.source}): <span className="text-foreground">{last.status}</span>
              {" · "}
              {last.created} new, {last.updated} updated, {last.skipped} skipped
              {last.error ? ` · ${last.error}` : ""}
            </p>
          ) : (
            <p className="text-muted-foreground">No sync has run yet.</p>
          )}
          <p className="mt-1 text-xs text-subtle">Setup steps: docs/CONNECTIONS.md#calendly</p>
        </div>
      </CardContent>
    </Card>
  );
}
