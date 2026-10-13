/* ============================================================
 * CONNECTION: Test database (optional)
 * Required:   Optional. Only for the database tests.
 * Env vars:   TEST_DATABASE_URL
 * Get it:     A SECOND, empty Postgres database (never your real one).
 *             Railway: add another Postgres service. Local: createdb crm_test.
 * Plan:       Railway usage-based pricing, or free locally
 * If missing: Database tests are skipped; all other tests still run.
 * Docs:       docs/CONNECTIONS.md#test-database
 * ============================================================ */
// Runs once before all tests. Brings the test database up to date with migrations.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export default function setup() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const testUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!testUrl) {
    console.log("\nTEST_DATABASE_URL is not set: skipping database tests (the others still run).\n");
    return;
  }
  // The database tests delete everything in the database they use.
  if (testUrl === process.env.DATABASE_URL?.trim()) {
    throw new Error("TEST_DATABASE_URL must be a different database from DATABASE_URL. The tests erase it.");
  }
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: testUrl } });
}
