import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAuthMode } from "@/lib/auth";
import { APP_NAME } from "@/modules";

export const dynamic = "force-dynamic";

// Shown on every page in production until APP_PASSWORD is set, so a fresh deploy
// is never left open to the internet.
export default function SetupPage() {
  if (getAuthMode() !== "setup-required") redirect("/");

  return (
    <AuthShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Set APP_PASSWORD to finish setup</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {APP_NAME} is locked because it&apos;s running in production without a password.
          </p>
        </div>
        <ol className="list-decimal space-y-2 rounded-xl border bg-card p-6 pl-10 text-sm text-muted-foreground shadow-card">
          <li>Open your project on railway.com and click this app&apos;s service.</li>
          <li>
            Go to <span className="text-foreground">Variables</span> and add{" "}
            <code className="rounded-sm bg-muted px-1 text-foreground">APP_PASSWORD</code> with a long passphrase.
          </li>
          <li>Railway redeploys automatically. Refresh this page in a minute and sign in.</li>
        </ol>
        <p className="text-xs text-subtle">More help: docs/CONNECTIONS.md#app-password</p>
      </div>
    </AuthShell>
  );
}
