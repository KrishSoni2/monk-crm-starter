// Runs before each test file. Makes sure tests can never touch your real database or
// real Calendly account: DATABASE_URL points at TEST_DATABASE_URL (or nothing), and all
// Calendly and app secrets start unset. Tests set what they need themselves.
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL?.trim() ?? "";
for (const name of ["CALENDLY_TOKEN", "SYNC_SECRET", "CALENDLY_WEBHOOK_SIGNING_KEY", "APP_PASSWORD"]) {
  delete process.env[name];
}

export const hasTestDatabase = Boolean(process.env.DATABASE_URL);
