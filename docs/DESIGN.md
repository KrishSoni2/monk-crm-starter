# Design

Simple, calm and easy to read, in the spirit of Apple's interfaces. Three Japanese ideas
guide every screen:

- **Ma (negative space):** generous whitespace. Space separates things before lines do.
- **Kanso (simplicity):** every element earns its place. If it doesn't help someone do
  their job, it goes.
- **Shibui (restraint):** quiet colors, no heavy shadows, no gradients, no blur.

## Where things live

| What | File |
|---|---|
| Every color, radius and size | `src/theme/theme.css` (the only place colors are defined) |
| shadcn/ui components | `src/components/ui/` |
| App shell (sidebar, page header, notices) | `src/components/` |

## Rebrand in one line

Open `src/theme/theme.css` and change `--brand`:

```css
--brand: #FF2929;   /* change this */
```

That recolors the main buttons, focus rings and the active sidebar icon in light and
dark mode. **Change `--brand`, never `--accent`.** In shadcn, `accent` means the soft
grey hover background, not your brand color.

## Colors

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#262624` | Page |
| `--surface` | `#FAFAFA` | `#2F2F2D` | Sidebar, table header, quiet panels |
| `--inset` | `#F7F7F7` | `#363634` | Soft boxes inside a panel |
| `--border` | `#E5E5E5` | `#3D3D3B` | All 1px lines |
| `--foreground` | `#1A1A1A` | `#F5F5F5` | Main text |
| `--muted-foreground` | `#666666` | `#A3A3A3` | Secondary text |
| `--subtle-foreground` | `#999999` | `#737373` | Hints, empty values |
| `--brand` | `#FF2929` | `#FF2929` | The one main action |

In components, use the Tailwind classes, never hex values: `bg-background`, `bg-surface`,
`bg-inset`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-subtle`,
`bg-primary` (the brand).

**One brand-colored button per screen,** for the main action (Sync now, Sign in, Add rep,
Join call). Everything else is `variant="outline"` or `variant="ghost"`. Status is never
shown with the brand color. Statuses are quiet text badges, and only "Closed" gets a
touch of green.

## Type

- Inter, 16px body text, line height 1.5.
- Headings use medium weight (500), never bold.
- Numbers that line up (times, counts) use `tabular-nums`.

## Spacing and shape

- 4px grid: every gap and padding is a multiple of 4.
- Page padding 32px (`p-page`), 16px on phones. Card padding 24px (`p-card`).
- Radius: cards 8px (`rounded-lg` / `rounded-card`), buttons 6px (`rounded-md`), inputs
  4px (`rounded-sm`).
- Sidebar: fixed, 240px wide, built from `src/modules/index.ts`. On small screens it
  folds into a menu button that opens it as a drawer.

## Tables

- Rows are 48px tall (`h-row`).
- The first column sticks while the table scrolls sideways. Never squeeze columns to fit.
- Empty values read as quiet grey words ("Not yet", "None", "Unassigned"), not blanks.

## Motion

- Short and gentle: the side panel slides in over 300ms; board cards follow the pointer
  1:1 and settle in 180ms when dropped.
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
- Thin grid lines, no axis lines, a legend for 2+ series, a tooltip on hover, and a hidden
  table for screen readers.

## Adding a shadcn/ui component

`npx shadcn@latest add <name>`, then check the new file in `src/components/ui/`:

1. No hard-coded colors (use tokens).
2. No heavy shadows or backdrop blur (remove `shadow-lg`, `backdrop-blur`).
3. No `next-themes` import (our theme toggle handles dark mode; see `ui/sonner.tsx`).
4. Radius: buttons `rounded-md`, inputs `rounded-sm`, cards `rounded-lg`.
