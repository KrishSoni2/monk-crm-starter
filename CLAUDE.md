# CLAUDE.md

Instructions for Claude Code, Codex and any AI assistant working in this repo.
Start every task by reading this file, then search the code for `AI-GUIDE:` comments.

## What this is

CRM Starter (monk-crm-starter): a small CRM shell for one business. It ships with one module, the
**Sales Dashboard** (Calendly bookings), and is built so new modules are added the
same way. The people running it are mostly not developers, so keep things simple,
readable and explained.

## Stack

- Next.js (App Router) + TypeScript, single app (no separate backend)
- Tailwind CSS
- Prisma + PostgreSQL (Railway Postgres)
- shadcn/ui components (Radix base, in `src/components/ui`) + lucide-react icons
- sonner (toasts, via shadcn), recharts + react-is (charts), @dnd-kit/core (drag and drop)
- Deployed on Railway
- Node 24 (pinned in `.node-version`; `engines` allows >=22)
- Prisma pinned to **7.10.0** stable. Never upgrade to a release candidate.

**Do not add dependencies** beyond these without asking the owner first. No other UI
kits, icon packs, state libraries, auth libraries or date libraries: use the built-in
`Intl` APIs for dates and time zones (helpers in `src/lib/format.ts`).

**shadcn/ui:** add components with `npx shadcn@latest add <name>`. Then check the new
file for: hard-coded colors (use tokens), heavy shadows or backdrop blur (remove them),
`next-themes` imports (use our theme toggle instead; see `src/components/ui/sonner.tsx`),
and radius (buttons `rounded-md` = 6px, inputs `rounded-sm` = 4px, cards `rounded-lg` = 8px).
In shadcn, `accent` means the grey hover background, not the brand color.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install packages (also runs `prisma generate`) |
| `npm run dev` | Start locally at http://localhost:3000 |
| `npm run build` | Production build. **Must pass at the end of every change** |
| `npm test` | Runs the tests. **Run after every change**, together with `npm run build` |
| `npm run db:deploy` | Apply existing migrations (first local run; Railway does this on start) |
| `npm run db:migrate -- --name what_changed` | Create and apply a migration after editing `prisma/schema.prisma` (local only) |
| `npm run secret` | Print a random 64-character secret (for SYNC_SECRET, webhook key) |
| `npm run db:studio` | Browse the database |
| `npm run calendly:webhook -- create` | Register the optional Calendly webhook (`-- list`, `-- delete <uri>`) |
| `npm run cron:sync` | What the Railway cron runs: asks the app to sync (needs APP_URL, SYNC_SECRET) |

Railway runs `prisma migrate deploy` at start, never at build. Never run `migrate dev`
against production.

## After every change

1. `npm test`. All tests must pass. Database tests run only when `TEST_DATABASE_URL`
   is set (a separate, empty database; the tests erase it). Never point it at real data.
2. `npm run build`. Must pass.
3. If you changed behaviour, add or update a test in `tests/`. Pure logic gets a plain
   test; anything that saves to the database goes in a `*.db.test.ts` file.

## Rules

- **Secrets live only in `.env`** (local) or Railway variables (production). Never
  commit them, print them, log them, or put them in error messages. `.env.example`
  lists every variable with an empty value.
- **Password gate:** `APP_PASSWORD` unset locally = open with a warning banner;
  unset in production = locked behind a "Set APP_PASSWORD" screen.
- **Demo data is flagged** (`source = DEMO`, `isDemo`). Code that removes demo data
  must filter on those flags and never delete anything else.
- **No real data.** Seed names, companies and emails are clearly fictional
  (`@example.com`).
- **Every file that touches an external service or required config starts with a
  CONNECTION banner** (format below). Update `docs/CONNECTIONS.md` when you add one.
- **Optimistic updates everywhere:** UI changes immediately, saves in the background,
  rolls back with a short message if the save fails.
- **Pages that read the database** export `const dynamic = "force-dynamic"`.
- **Imports used at runtime go in `dependencies`**, not `devDependencies`.
- **Migrations are additive.** Don't drop or rename columns that hold data; add new
  ones instead.
- Keep `package-lock.json` in sync with every dependency change.
- Before pushing a deploy change: `rm -rf node_modules && npm ci && npm run build`.

### CONNECTION banner format

```ts
/* ============================================================
 * CONNECTION: <Service name>
 * Required:   Yes | Optional (<what happens without it>)
 * Env vars:   <VAR_ONE>, <VAR_TWO>
 * Get it:     <where to click to get it>
 * Plan:       <cost or plan needed>
 * If missing: <exact behaviour>
 * Docs:       docs/CONNECTIONS.md#<anchor>
 * ============================================================ */
```

## Design rules

Full detail in `docs/DESIGN.md`. The short version:

- **Ma, Kanso, Shibui:** generous whitespace, every element earns its place, no heavy
  shadows or gradients.
- **Colors come from tokens only** (`src/theme/theme.css`). Never hard-code hex values
  in components.
  - Light: background `#FFFFFF`, surface `#FAFAFA`, border `#E5E5E5`, text `#1A1A1A` /
    `#666666` / `#999999`.
  - Dark: background `#262624`, surface `#2F2F2D`, border `#3D3D3B`, text `#F5F5F5` /
    `#A3A3A3` / `#737373`.
- **One brand color** (`--brand`, default `#FF2929`, exposed to shadcn as `primary`),
  used for the single main action on a screen (`<Button>` default variant). Not for
  decoration, not for status. Everything else is a `variant="outline"` or `"ghost"` button.
- Inter, 16px body, medium-weight (500) headings.
- 4px grid. 32px page padding, 24px card padding. Radius: 8px cards, 6px buttons,
  4px inputs.
- Fixed 240px left sidebar, generated from the modules config. Below the `md`
  breakpoint it folds into a top bar with a menu button that opens it as a drawer.
- Rebrand by changing `--brand` in `src/theme/theme.css`, never `--accent`.
- Tables: 48px rows, sticky first column, scroll sideways instead of squeezing.
- Motion is gentle and short: side panel slides in, board drag is smooth. Respect
  `prefers-reduced-motion`.
- Every list has an empty state and a loading state.

## Module structure

Every module lives in its own folder with the same shape. **Sales is the pattern to
copy.**

```
src/modules/<module-id>/
  module.ts            # Registers the module: id, label, href, icon. Imported by src/modules/index.ts
  types.ts             # Shared types and constants for this module
  components/          # React components used only by this module
  stats.ts             # Calculations, pure functions used by the page (if the module has numbers)
  server/
    queries.ts         # Database reads
    actions.ts         # Server actions (writes). Each checks the session
  integrations/        # External services this module talks to (each file has a CONNECTION banner)
    calendly/          #   client.ts (API), normalize.ts (API -> row), store.ts (save), sync.ts, webhook.ts
  demo/seed.ts         # Fictional demo data for this module

src/app/(app)/<module-id>/page.tsx     # Thin page: loads data, renders the module's components
src/app/(app)/<module-id>/loading.tsx  # Skeleton shown while the page loads
```

Shared code lives outside modules:

```
src/modules/index.ts   # The modules config array that drives the sidebar (AI-GUIDE)
src/theme/theme.css    # Design tokens, shadcn colors and the brand color (AI-GUIDE)
src/components/ui/     # shadcn/ui components (Button, Input, Select, Sheet, ...)
src/components/        # App shell: sidebar, page header, notices, theme toggle
src/lib/               # db, auth, env helpers
src/proxy.ts           # Password gate (Next.js request proxy)
prisma/schema.prisma   # Database schema (AI-GUIDE)
tests/                 # vitest tests; helpers/mock-calendly.ts fakes the Calendly API
scripts/               # Plain Node scripts: webhook registration, cron sync
railway.toml           # App service: build, migrate-on-start, healthcheck
railway.cron.toml      # Cron service: runs `npm run cron:sync` every 15 minutes
```

Modules must not import from each other's folders. If two modules need the same
thing, move it to `src/components` or `src/lib`.

To add a module, follow `docs/ADDING-A-MODULE.md`.

## Key docs

- `AGENTS.md`: points other AI tools (Codex reads AGENTS.md) to this file. Its marked
  block is managed by `next dev`; only edit outside the markers.
- `BUILD.md`: the Sales module's build doc (the template for new modules)
- `docs/CONNECTIONS.md`: every external service and env var
- `docs/DESIGN.md`: design system
- `docs/ADDING-A-MODULE.md`: how to add a tab
- `README.md`: setup and deploy

## Progress

- [x] Stage 0: Study reference, write BUILD.md and CLAUDE.md
- [x] Stage 1: Foundation (Next.js, theme, Prisma schema, seed, sidebar shell, password gate, health route, Railway config)
- [x] Stage 2: Bookings (table view, side panel, reps settings, call attempts, on demo data)
- [x] Stage 3: Board and stats (board with drag, stats row, filters, call-attempts-by-hour chart)
- [x] Stage 4: Calendly (polling sync, Sync now, /api/sync, optional webhooks, demo fallback, connection banners)
- [x] Review fixes: No-show reset on reschedule, vitest suite (`npm test`)
- [x] Stage 5: Docs and polish (README, docs, AI-GUIDE pass, empty, loading and error states, dark mode, collapsible sidebar on small screens)
- [x] Stage 6: Final check (scan repo and history for copied code, real names, URLs, secrets)
