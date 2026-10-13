import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// `npm test` runs everything in tests/. Database tests only run when TEST_DATABASE_URL
// is set (see tests/global-setup.ts); the rest need nothing.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
