// One place to read configuration. Values are trimmed so a stray space pasted into
// Railway doesn't break anything. These helpers never return or log secret values
// to the browser: only booleans like "is it set?" leave the server.

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const env = {
  databaseUrl: () => read("DATABASE_URL"),
  appPassword: () => read("APP_PASSWORD"),
  calendlyToken: () => read("CALENDLY_TOKEN"),
  syncSecret: () => read("SYNC_SECRET"),
  webhookSigningKey: () => read("CALENDLY_WEBHOOK_SIGNING_KEY"),
  appUrl: () => read("APP_URL"),
  isProduction: () => process.env.NODE_ENV === "production",
};

// Demo mode: no Calendly token, so the app runs on fictional seed data.
export const isDemoMode = () => !env.calendlyToken();
