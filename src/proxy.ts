/* ============================================================
 * CONNECTION: App password gate
 * Required:   Yes in production, optional locally
 * Env vars:   APP_PASSWORD
 * Get it:     You choose it. Set it in .env or Railway variables.
 * Plan:       Free
 * If missing: Locally the app is open with a warning banner.
 *             In production every page shows the "Set APP_PASSWORD" screen.
 * Docs:       docs/CONNECTIONS.md#app-password
 * ============================================================ */
import { NextResponse, type NextRequest } from "next/server";
import { getAuthMode, isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

// Paths that never need the password. Each one protects itself:
// /api/sync checks SYNC_SECRET, /api/webhooks checks the Calendly signature.
const PUBLIC_PATHS = ["/login", "/setup", "/api/health", "/api/sync", "/api/webhooks", "/api/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const mode = getAuthMode();
  if (mode === "open") return NextResponse.next();

  if (mode === "setup-required") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "APP_PASSWORD is not set" }, { status: 503 });
    }
    return NextResponse.rewrite(new URL("/setup", request.url));
  }

  if (isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Run on everything except Next's static files and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
