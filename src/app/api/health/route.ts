// Railway's healthcheck calls this after every deploy. It deliberately does NOT touch
// the database: its only job is to say "the web server is up". Keep it that way, or a
// slow database could make Railway think every deploy failed.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
