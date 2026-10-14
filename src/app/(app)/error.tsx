"use client";

import { Button } from "@/components/ui/button";

// Shown if a page fails to load (for example the database is unreachable). Details go
// to the server log, not the screen.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border bg-card p-6 shadow-card">
      <h1 className="text-xl">Something went wrong loading this page</h1>
      <p className="mt-3 text-muted-foreground">
        The most common cause is the database being unreachable. Check that DATABASE_URL is right and the database
        is running, then try again. On Railway, the app&apos;s Deploy Logs show the details.
      </p>
      <Button variant="outline" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
