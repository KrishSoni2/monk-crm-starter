/* ============================================================
 * CONNECTION: PostgreSQL (Railway Postgres) for the Prisma CLI
 * Required:   Yes
 * Env vars:   DATABASE_URL
 * Get it:     Railway > your Postgres service > Variables
 *             (use DATABASE_PUBLIC_URL for local dev)
 * Plan:       Railway usage-based pricing (Hobby plan is enough)
 * If missing: Migrations and Prisma Studio can't run. `prisma generate`
 *             still works, so a fresh `npm install` never fails.
 * Docs:       docs/CONNECTIONS.md#railway-postgres
 * ============================================================ */
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// The Prisma CLI doesn't read .env by itself. Node can, with no extra package.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
