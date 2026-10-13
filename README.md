# CRM Starter

> The full README (setup in under 15 minutes, deploy guides, cron setup) is written in
> build stage 5. This file currently holds notes that must make it into that version.

## Good to know

**The password lock follows `NODE_ENV`.** When `APP_PASSWORD` is empty:
- `npm run dev` (development) leaves the app open and shows a yellow warning bar.
- `npm start` or a Railway deploy (production, `NODE_ENV=production`) locks every page
  behind a "Set APP_PASSWORD" screen. That includes running `npm start` on your own
  computer. Set `APP_PASSWORD` in `.env` (local) or Railway variables to unlock it.

## Troubleshooting

**`npm install` reports "high severity vulnerabilities".** These warnings come from
the Prisma command-line tools (packages called `mysql2` and `deepmerge-ts` that Prisma
uses internally for migrations and other commands). They're safe to ignore: that code
only runs when you run a `prisma` command yourself, never inside your app while it
serves pages, and this app uses PostgreSQL, not MySQL. The only "fix" npm offers is
downgrading to an older Prisma major version, which would break the app. Don't run
`npm audit fix --force`.
