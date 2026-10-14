# Design

Simple, calm and easy to read, in the spirit of Apple's interfaces. Three Japanese ideas
guide every screen:

- **Ma (negative space):** generous whitespace. Space separates things before lines do.
- **Kanso (simplicity):** every element earns its place. If it doesn't help someone do
  their job, it goes.
- **Shibui (restraint):** quiet colors and soft depth. Cards lift gently off the page;
  nothing shouts.

## Where things live

| What | File |
|---|---|
| Every color, shadow, radius and size | `src/theme/theme.css` (the only theme file) |
| Type helpers, motion, reduced motion | `src/app/globals.css` |
| shadcn/ui components | `src/components/ui/` |
| App shell: sidebar, header pill, page masthead, app name | `src/components/layout/` |
| Login and setup screens | `src/components/auth/auth-shell.tsx` |

## Rebrand in one line

Open `src/theme/theme.css` and change `--brand`:

```css
--brand: #FF2929;   /* change this */
```

That recolors the main buttons, focus rings, the small labels above page titles, the
active sidebar item, the app-name tile and the login panel glow, in light and dark mode.
**Change `--brand`, never `--accent`.** In shadcn, `accent` means the soft grey hover
background, not your brand color.

The app name comes from `APP_NAME` in `src/modules/index.ts`. The sidebar shows its first
letter in a brand-colored tile. To use a logo image instead, follow the comment in
`src/components/layout/app-mark.tsx`.

## Surfaces

Three tiers, from back to front:

1. **Canvas** (`bg-canvas`): the page itself, a faint warm off-white (warm charcoal in dark mode).
2. **Card** (`bg-card` + `shadow-card` + `rounded-xl`): white panels that lift off the
   canvas with a soft two-layer shadow. Every page starts with a masthead card.
3. **Inset** (`bg-inset` or `bg-muted/30`): a quiet box inside a card, like the call
   attempt form.

## Colors

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#F5F4F2` | `#201F1D` | Page background |
| `--card` | `#FFFFFF` | `#2F2F2D` | Cards, panels, menus |
| `--background` | `#FFFFFF` | `#262624` | Inputs and plain areas |
| `--sidebar` | `#FAFAFA` | `#262624` | Sidebar |
| `--surface` / `--inset` | `#FAFAFA` | `#2F2F2D` / `#363634` | Table header, soft boxes |
| `--accent` | `#F5F5F5` | `#3D3D3B` | Hover background (shadcn meaning) |
| `--border` | `#E5E5E5` | `#3D3D3B` | All 1px lines |
| `--foreground` | `#1A1A1A` | `#F5F5F5` | Main text |
| `--muted-foreground` | `#666666` | `#A3A3A3` | Secondary text |
| `--subtle-foreground` | `#999999` | `#737373` | Hints, empty values, timestamps |
| `--brand` | `#FF2929` | `#FF2929` | Main action and brand accents |

In components, use the Tailwind classes, never hex values: `bg-canvas`, `bg-card`,
`bg-inset`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-subtle`,
`bg-primary` (the brand), `shadow-card`. Need a new color? Add a token to the theme file
in both the light and the dark block.

**Where the brand color goes:**

- The single main action on a screen (`<Button>` default variant: Sync now, Sign in,
  Add rep, Join call). Everything else is `variant="outline"` or `variant="ghost"`.
- Small accents that say "this is your app": the eyebrow label above each page title
  (`text-primary/80`), the app-name tile, the active sidebar icon, email and phone links,
  focus rings, the login panel glow.
- Never for status or data.

## Status pills

Booking statuses are soft tinted pills (`rounded-full`), each with its own token pair in
the theme file (`bg-status-showed text-status-showed-foreground`, and so on):

| Status | Pill |
|---|---|
| Booked | Grey |
| Showed | Blue |
| No-show | Red |
| Not qualified | Purple |
| Closed | Green |
| Lost | Red |
| Canceled (tag) | Orange |

The pill always carries its word, so status is never color alone. Pills and their
mapping live in `src/modules/sales/components/status-badge.tsx`.

## Type

- Inter, 16px body text, line height 1.5.
- Page titles: `text-3xl`, semibold, slightly tightened. Section and card titles: medium (500).
- Small uppercase labels: `.text-eyebrow` (above page titles) and `.text-section-label`
  (section headings inside panels), both in `globals.css`.
- Numbers that line up (times, counts, stats) use `tabular-nums`.

## Spacing and shape

- 4px grid: every gap and padding is a multiple of 4.
- Page padding 24px (16px on phones), with room at the top for the header pill. Cards use
  16 to 24px inside. Pages sit in a centered column (`PageShell`, max 1280px).
- Radius: cards and board columns 12px (`rounded-xl`), small boxes 8px (`rounded-lg`),
  buttons, inputs and selects 6px (`rounded-md`), pills fully round.

## Shell

- **Sidebar:** built from `src/modules/index.ts`. 240px wide, collapsible to 64px icons
  (the choice is remembered per browser). Collapse, Settings and Sign out sit at the
  bottom; collapsed items show a tooltip. Below the `md` breakpoint it becomes a top bar
  with a menu button that opens a drawer.
- **Header pill:** floating at the top right. It opens on hover or focus to show the
  theme toggle and the account menu.
- **Masthead:** every page opens with `PageMasthead` (eyebrow, title, subtitle, actions on
  the right), from `src/components/layout/page-shell.tsx`.
- **Login:** a split screen. A dark brand panel on the left with the app name, the form on
  the canvas on the right. The panel hides on phones.

## Tables

- Rows are at least 48px (`h-row`). Booking rows show two lines (name over email, date over
  time), so they come out around 56px.
- The first column sticks while the table scrolls sideways. Never squeeze columns to fit.
- Quick edits (rep, status) happen right in the row and save optimistically. Clicking
  anywhere else on the row opens the side panel.
- Empty values read as quiet grey words ("Not yet", "None", "Unassigned"), not blanks.

## Motion

- Short and gentle, on one curve (`--ease-settle`): pages settle in over 240ms, the side
  panel slides in, board cards follow the pointer 1:1 and settle when dropped, buttons
  give a tiny press.
- Nothing animates for decoration.
- `prefers-reduced-motion` turns animations off (`src/app/globals.css`).

## Optimistic updates

Every change shows on screen immediately and saves in the background. If a save fails,
only that change is undone and a short message says what happened. Never make people
wait on a spinner to see their own edit. The pattern is in
`src/modules/sales/components/use-bookings.ts`.

## States every screen needs

- **Loading:** a quiet skeleton in the shape of the page (`loading.tsx` next to the page).
- **Empty:** a short sentence saying what will appear and how (e.g. "New Calendly
  bookings show up here after the next sync").
- **Error:** plain words and what to try next (`src/app/(app)/error.tsx`).

## Charts

- Use `--chart-1` and `--chart-2`: two steps of one blue, checked for color-blind safety
  in light and dark mode. If you change them, keep two clearly different steps of a single
  hue.
- Charts sit in a card. Thin grid lines, no axis lines, a legend for 2+ series, a tooltip
  on hover, and a hidden table for screen readers.

## Adding a shadcn/ui component

`npx shadcn@latest add <name>`, then check the new file in `src/components/ui/`:

1. No hard-coded colors. Use tokens (for example `bg-scrim` for overlays, not `bg-black/50`).
2. No heavy shadows or backdrop blur. Cards use `shadow-card`; menus and popovers may keep
   shadcn's small `shadow-md`.
3. No `next-themes` import (our theme toggle handles dark mode; see `ui/sonner.tsx`).
4. Import Radix from the combined `radix-ui` package, like the existing components.
5. Radius: cards `rounded-xl`, buttons and inputs `rounded-md`, pills `rounded-full`.
