# Adding a module

A module is one tab in the sidebar with its own data and screens. Sales is the first
one, and every new module copies its shape, so your AI assistant always knows where
things go.

The fastest way: write a short build doc, then paste the prompt at the bottom into
Claude Code or Codex. The steps in between explain what it will do, so you can check
its work.

## 1. Write the build doc first

Copy `BUILD.md` to `docs/builds/<module-id>.md` (for example `docs/builds/proposals.md`)
and replace the content with your module. Keep the same five headings:

1. **Goal:** the problem, who uses it, what "done" means.
2. **Data model:** the tables and fields, in plain words.
3. **Screens:** what each screen shows and what you can do on it.
4. **Integrations:** any outside service, with its env vars and plan needed.
5. **Out of scope:** what this module will *not* do (this saves the most time).

The clearer this doc, the better the result. Ten minutes here saves hours later.

## 2. What gets built (the module shape)

```
src/modules/<module-id>/
  module.ts            # id, label, href, icon (lucide-react) for the sidebar
  types.ts             # shared types and constants
  stats.ts             # calculations, if the module has numbers
  components/          # this module's screens and pieces
  server/
    queries.ts         # database reads
    actions.ts         # database writes (server actions; each checks the session)
  integrations/        # outside services, each file with a CONNECTION banner
  demo/seed.ts         # fictional demo data, flagged so it can be removed safely

src/app/(app)/<module-id>/page.tsx      # thin page: load data, render components
src/app/(app)/<module-id>/loading.tsx   # skeleton while it loads
```

Plus:

- **Database:** new tables in `prisma/schema.prisma` under a comment header for the
  module, then `npm run db:migrate -- --name add_<module-id>`. Commit the migration
  folder it creates. Railway applies it on the next deploy.
- **Sidebar:** import the module's `module.ts` in `src/modules/index.ts` and add it to
  `MODULES`. The order there is the order in the sidebar.
- **Settings (if needed):** a card component in the module's `components/`, rendered on
  `src/app/(app)/settings/page.tsx`.
- **New env vars:** added to `.env.example` with a comment, a CONNECTION banner on the
  file that uses them, and a row plus section in `docs/CONNECTIONS.md`.
- **Tests:** in `tests/`. Plain logic gets a plain test; anything that saves to the
  database goes in a `*.db.test.ts` file.

## 3. Rules the AI must follow

These are in `CLAUDE.md`. The ones that matter most for a new module:

- Don't import from another module's folder. Shared code goes in `src/components` or `src/lib`.
- Colors only from `src/theme/theme.css`; one brand-colored button per screen.
- Optimistic updates: changes show instantly and save in the background (copy
  `src/modules/sales/components/use-bookings.ts`).
- Pages that read the database export `const dynamic = "force-dynamic"`.
- Migrations add, never drop or rename columns that hold data.
- No new npm packages without asking you first.
- Demo data is fictional and flagged.
- After every change: `npm test` and `npm run build` must pass.

## 4. Check it

1. `npm run dev`, then click the new tab in the sidebar.
2. Try every action in your build doc's Screens section, in light and dark mode.
3. Make a change, reload: it should still be there.
4. `npm test` and `npm run build` both pass.
5. Commit, push, and Railway deploys it (migrations run automatically).

## Ready-to-paste prompt

Replace the two `<...>` parts, then paste this into Claude Code or Codex from the
project folder:

```text
Read CLAUDE.md, then search the code for AI-GUIDE comments and read them.
Then read docs/ADDING-A-MODULE.md and my build doc at docs/builds/<module-id>.md.

Build a new module called "<Module name>" exactly as described in my build doc,
following the module structure in docs/ADDING-A-MODULE.md and using the Sales module
(src/modules/sales) as the pattern for everything: folder layout, server actions with
session checks, optimistic updates, loading and empty states, design tokens, and tests.

Before writing code, tell me in plain words:
1. the tables and fields you'll add to prisma/schema.prisma,
2. the screens and what each does,
3. any new env vars or outside services (and whether they need a paid plan),
4. anything in my build doc that's unclear or that you'd do differently.
Then wait for my OK.

After I approve: build it in small steps. After each step run `npm test` and
`npm run build`, fix every error, and tell me exactly what to click to test it.
Don't add npm packages without asking. Don't change the Sales module unless I ask.
Never put real customer data or secrets in code, seeds or commits.
```
