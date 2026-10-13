/* ============================================================
 * CONNECTION: PostgreSQL (Railway Postgres)
 * Required:   Yes
 * Env vars:   DATABASE_URL
 * Get it:     Railway > your Postgres service > Variables.
 *             On Railway use ${{Postgres.DATABASE_URL}} (private).
 *             Locally use the DATABASE_PUBLIC_URL value.
 * Plan:       Railway usage-based pricing (Hobby plan is enough)
 * If missing: Pages that read data show an error explaining
 *             DATABASE_URL isn't set. /api/health still works.
 * Docs:       docs/CONNECTIONS.md#railway-postgres
 * ============================================================ */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

function createClient() {
  const connectionString = env.databaseUrl();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env (local) or Railway variables. See docs/CONNECTIONS.md#railway-postgres",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Reuse one client across hot reloads in dev so we don't open a new pool every save.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}
