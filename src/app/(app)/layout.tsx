import { Notice } from "@/components/notice";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { getAuthMode } from "@/lib/auth";
import { env, isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const authMode = getAuthMode();
  const hasDatabase = Boolean(env.databaseUrl());

  return (
    <div className="min-h-screen">
      <Sidebar demoMode={isDemoMode()} canSignOut={authMode === "protected"} />
      <div className="min-w-0 md:ml-sidebar">
        <MobileNav demoMode={isDemoMode()} canSignOut={authMode === "protected"} />
        {authMode === "open" && (
          <Notice>
            No APP_PASSWORD is set, so anyone who can reach this app can use it. That&apos;s fine on your own
            computer. Set one before you deploy (see docs/CONNECTIONS.md#app-password).
          </Notice>
        )}
        <main className="p-4 md:p-page">{hasDatabase ? children : <DatabaseMissing />}</main>
      </div>
    </div>
  );
}

function DatabaseMissing() {
  return (
    <div className="max-w-xl rounded-card border p-card">
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
