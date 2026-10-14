import { AlertCircle, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthMode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;
  if (getAuthMode() === "open") redirect(next);

  return (
    <AuthShell>
      <form action="/api/auth/login" method="post" className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Enter your team password to continue.</p>
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            That password didn&apos;t match. Try again.
          </p>
        )}

        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="h-11 bg-card"
          />
        </div>

        <Button type="submit" className="group h-11 w-full text-sm">
          Sign in
          <ArrowRight className="ml-2 size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </Button>
      </form>
    </AuthShell>
  );
}
