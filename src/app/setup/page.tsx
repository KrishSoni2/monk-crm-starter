import { redirect } from "next/navigation";
import { getAuthMode } from "@/lib/auth";
import { APP_NAME } from "@/modules";

export const dynamic = "force-dynamic";

// Shown on every page in production until APP_PASSWORD is set, so a fresh deploy
// is never left open to the internet.
export default function SetupPage() {
  if (getAuthMode() !== "setup-required") redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border p-card">
        <h1 className="text-xl">Set APP_PASSWORD to finish setup</h1>
        <p className="mt-3 text-muted-foreground">
          {APP_NAME} is locked because it&apos;s running in production without a password.
        </p>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Open your project on railway.com and click this app&apos;s service.</li>
          <li>
            Go to <span className="text-foreground">Variables</span> and add{" "}
            <code className="rounded-input bg-surface px-1 text-foreground">APP_PASSWORD</code> with a long passphrase.
          </li>
          <li>Railway redeploys automatically. Refresh this page in a minute and sign in.</li>
        </ol>
        <p className="mt-6 text-sm text-subtle">More help: docs/CONNECTIONS.md#app-password</p>
      </div>
    </main>
  );
}
