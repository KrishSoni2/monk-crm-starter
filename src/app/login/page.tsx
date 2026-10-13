import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <form action="/api/auth/login" method="post" className="w-full max-w-sm rounded-card border p-card">
        <h1 className="text-xl">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the team password to continue.</p>
        <input type="hidden" name="next" value={next} />
        <Label htmlFor="password" className="mt-6 text-muted-foreground">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-2 h-10"
        />
        {error && <p className="mt-3 text-sm text-destructive">That password didn&apos;t match. Try again.</p>}
        <Button type="submit" className="mt-6 h-10 w-full">
          Sign in
        </Button>
      </form>
    </main>
  );
}
