import { redirect } from "next/navigation";
import { getAuthMode } from "@/lib/auth";
import { APP_NAME } from "@/modules";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;
  if (getAuthMode() === "open") redirect(next);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action="/api/auth/login"
        method="post"
        className="w-full max-w-sm rounded-card border border-line bg-bg p-card"
      >
        <h1 className="text-xl">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted">Enter the team password to continue.</p>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="password" className="mt-6 block text-sm text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-2 h-10 w-full rounded-input border border-line bg-bg px-3 outline-none focus:border-accent"
        />
        {error && <p className="mt-3 text-sm text-negative">That password didn&apos;t match. Try again.</p>}
        <button
          type="submit"
          className="mt-6 h-10 w-full rounded-button bg-accent text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
