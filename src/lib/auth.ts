/* ============================================================
 * CONNECTION: App password (shared team login)
 * Required:   Yes in production, optional locally
 * Env vars:   APP_PASSWORD
 * Get it:     You choose it. Use a long passphrase.
 * Plan:       Free
 * If missing: Locally the app is open with a warning banner.
 *             In production every page shows "Set APP_PASSWORD".
 * Docs:       docs/CONNECTIONS.md#app-password
 * ============================================================ */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "crm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type AuthMode = "open" | "setup-required" | "protected";

// open:           no password, not production (local dev). Everything is allowed.
// setup-required: no password in production. Everything is locked.
// protected:      password set. A valid session cookie is required.
export function getAuthMode(): AuthMode {
  if (env.appPassword()) return "protected";
  return env.isProduction() ? "setup-required" : "open";
}

// The cookie signing key is derived from APP_PASSWORD, so changing the password
// signs everyone out. No extra secret to manage.
function signingKey(password: string) {
  return createHash("sha256").update(`crm-session:${password}`).digest();
}

function sign(payload: string, password: string) {
  return createHmac("sha256", signingKey(password)).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordMatches(attempt: string): boolean {
  const password = env.appPassword();
  if (!password) return false;
  // Hash both so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(attempt).digest("hex");
  const b = createHash("sha256").update(password).digest("hex");
  return safeEqual(a, b);
}

export function createSessionToken(): string {
  const password = env.appPassword();
  if (!password) throw new Error("APP_PASSWORD is not set");
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt, password)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  const password = env.appPassword();
  if (!password || !token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_SECONDS * 1000) return false;
  return safeEqual(signature, sign(issuedAt, password));
}

// Use at the top of every server action and page that reads or writes data.
// The proxy already gates pages, but server actions can be called directly, so
// they check again here.
export async function requireSession(): Promise<void> {
  const mode = getAuthMode();
  if (mode === "open") return;
  if (mode === "setup-required") throw new Error("APP_PASSWORD is not set");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) throw new Error("Not signed in");
}
