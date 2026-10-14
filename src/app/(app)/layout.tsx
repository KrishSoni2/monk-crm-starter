import { AppShell } from "@/components/layout/app-shell";
import { SetupNotice } from "@/components/layout/page-shell";
import { getAuthMode } from "@/lib/auth";
import { env, isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const authMode = getAuthMode();
  const hasDatabase = Boolean(env.databaseUrl());

  return (
    <AppShell
      demoMode={isDemoMode()}
      canSignOut={authMode === "protected"}
      notice={
        authMode === "open" ? (
          <SetupNotice>
            No APP_PASSWORD is set, so anyone who can reach this app can use it. That&apos;s fine on your own
            computer. Set one before you deploy (see docs/CONNECTIONS.md#app-password).
          </SetupNotice>
        ) : null
      }
    >
      {hasDatabase ? children : <DatabaseMissing />}
    </AppShell>
  );
}

function DatabaseMissing() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border bg-card p-6 shadow-card">
      <h1 className="text-xl">Connect a database to get started</h1>
      <p className="mt-3 text-muted-foreground">
        DATABASE_URL isn&apos;t set. Copy <code className="text-foreground">.env.example</code> to{" "}
        <code className="text-foreground">.env</code>, paste your Railway Postgres public URL into DATABASE_URL, then
        restart the app.
      </p>
      <p className="mt-4 text-sm text-subtle">Step by step: README.md and docs/CONNECTIONS.md#railway-postgres</p>
    </div>
  );
}
