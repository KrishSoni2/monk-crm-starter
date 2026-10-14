"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { syncNow } from "@/modules/sales/server/actions";

// Connection status (a pulsing dot when connected) plus the one brand-colored button.
export function SyncButton({
  demoMode,
  lastSyncedAt,
  lastStatus,
}: {
  demoMode: boolean;
  lastSyncedAt: string | null;
  lastStatus: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  // Tick the "4 min ago" label (client only, to avoid a server/browser mismatch).
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  function run() {
    if (demoMode) {
      toast("Calendly isn't connected yet", {
        description:
          "You're looking at demo data. Add CALENDLY_TOKEN to .env (or your Railway variables), restart the app, then press Sync now. See docs/CONNECTIONS.md#calendly.",
        duration: 10_000,
      });
      return;
    }
    setSyncing(true);
    syncNow()
      .then((result) => {
        if (result.ok) toast.success(result.data.message);
        else toast.error(result.error);
        startTransition(() => router.refresh());
      })
      .catch(() => toast.error("Sync failed. Check your connection and try again."))
      .finally(() => setSyncing(false));
  }

  const busy = syncing || pending;
  const failed = lastStatus === "error" || lastStatus === "partial";
  const label = demoMode
    ? "Calendly not connected"
    : lastSyncedAt && now
      ? `Synced ${timeAgo(lastSyncedAt, now)}${lastStatus === "error" ? " (failed)" : lastStatus === "partial" ? " (some events failed)" : ""}`
      : lastSyncedAt
        ? ""
        : "Never synced";

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <span className="relative flex size-2">
          {!demoMode && !failed && <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-60" />}
          <span className={cn("relative inline-flex size-2 rounded-full", demoMode ? "bg-subtle" : failed ? "bg-negative" : "bg-positive")} />
        </span>
        {busy ? "Syncing…" : label}
      </div>
      <Button onClick={run} disabled={busy}>
        <RefreshCw className={cn("size-4", busy && "animate-spin")} />
        Sync now
      </Button>
    </div>
  );
}
