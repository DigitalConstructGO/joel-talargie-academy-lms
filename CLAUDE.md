# Design System — Mandatory Rules

This LMS has one design system, established from the uploaded admin/student
dashboard reference. It applies to **every** surface: public website, auth,
student dashboard, admin dashboard, forms, tables, cards, charts, modals,
notifications, settings, payments, courses, certificates, email templates,
error/empty/loading states — everything. Users should never be able to tell
which section of the app they're in from visual style alone; only
functionality and navigation should differ.

Never design a page in isolation. Never introduce a new color, radius,
shadow, or type scale for a single screen. If a screen needs something the
system doesn't have yet, extend the system (add a token, extend a shared
component) rather than hand-rolling a one-off.

## Source of truth

- Tokens: [apps/web/src/app/globals.css](apps/web/src/app/globals.css) — all
  color, radius, shadow, and animation tokens live here as CSS variables,
  mapped into Tailwind v4 via `@theme inline`. Never hardcode a hex/rgb/hsl
  color or an arbitrary border-radius/shadow value in a component — use the
  token (`bg-primary`, `text-muted-foreground`, `rounded-xl`,
  `shadow-md`, etc.).
- Base components: [apps/web/src/components/ui/](apps/web/src/components/ui/)
  — shadcn-style primitives (button, card, table, dialog, sheet, form,
  badge, tabs, etc.). Reuse these; don't create a second button or card
  component. If a variant is missing, add it to the existing component.
- Cross-app shared components (used by more than one app in the monorepo)
  belong in [packages/ui/src/](packages/ui/src/index.ts), not duplicated
  per-app.
- Dark mode is driven exclusively by the `.dark` class (via `next-themes`,
  `attribute="class"`). Never add a `prefers-color-scheme` media query to
  `globals.css` — that would let the OS silently override a user's explicit
  theme choice.
- When referencing a CSS custom property inside a Tailwind arbitrary value,
  always wrap it explicitly — `w-[var(--sidebar-width)]`, not the bare
  `w-[--sidebar-width]`. The bare form was v3-only sugar; under this
  project's Tailwind v4 it silently produces no `width` rule at all (found
  live in `ui/sidebar.tsx`, `calendar.tsx`, and `chart.tsx` — the sidebar
  was rendering at content-based width instead of the intended 256px,
  which is what caused it to visually overlap the page content).

## Key visual language (already encoded in tokens — don't fight it)

- **Brand/primary**: saturated green (`--primary` / `--brand`), used
  consistently for every CTA, active state, focus ring, and "positive"
  indicator (`--success` shares the same hue).
- **Sidebar**: permanently dark navy (`--sidebar*` tokens), independent of
  the light/dark theme toggle — do not theme the sidebar light.
- **Shape**: pill-shaped buttons/badges/inputs (`--radius-md` = 1.25rem,
  exceeds half the height of default control sizes) and generously rounded
  cards (`--radius-xl`). Don't use sharp corners or a different radius scale
  on a new component.
- **Cards**: white/`--card` background, soft layered shadow
  (`--shadow-sm`/`md`/`lg`/`xl`), comfortable padding, hover animation.
- **Charts**: use `--chart-1` through `--chart-5` in order for series color;
  don't invent new chart colors.
- **Auth surfaces**: soft pastel gradient wash (`--auth-gradient-*`) behind
  the auth card — reuse for any full-bleed auth/onboarding screen.

## When building a new page or component

1. Check `apps/web/src/components/ui/` and `packages/ui/src/` first — reuse
   before creating.
2. Use semantic Tailwind classes backed by the tokens above, never raw
   color/spacing values.
3. Match existing patterns for the same UI kind (a new table looks like the
   existing tables; a new modal looks like the existing dialogs) — check an
   existing instance in `apps/web/src/components/` before building a new
   one from scratch.
4. Cover loading (skeleton), empty, and error states using the same
   token/component language as the populated state — these are not exempt
   from the design system.

# Skeleton Loading System — Mandatory Rules

No async page, component, widget, table, chart, form, card, image, video,
list, or API-backed section may ever show a blank screen, a layout-shifting
flash, or bare "Loading..." text. Every one of them gets a skeleton that
mirrors the shape of its loaded state — same card shape, same grid, same
sidebar width, same header height, same radius/spacing/color tokens (see
the design-system section above). The loading state should look like the
finished UI with content dimmed out, not a generic spinner.

## Current state vs. target

- The shared primitive already exists:
  [apps/web/src/components/ui/skeleton.tsx](apps/web/src/components/ui/skeleton.tsx)
  (`<Skeleton />`, `animate-pulse` + `bg-primary/10`, respects the
  design tokens). Always build new skeletons out of this primitive — never
  a raw `<div className="bg-gray-200 animate-pulse" />`.
- A first set of skeleton components already lives under
  [apps/web/src/components/dashboard/skeletons/](apps/web/src/components/dashboard/skeletons/)
  (card, chart, dashboard, form, header, list, notification, profile,
  sidebar, table). These were built dashboard-first; treat them as the
  pattern to follow, but new skeletons that aren't dashboard-specific
  (course cards, certificate cards, payment cards, public-site skeletons,
  etc.) go in a top-level `apps/web/src/components/skeletons/` directory so
  they're reusable across public/auth/student/admin surfaces, with a
  barrel `index.ts`. Don't fork a second skeleton primitive — both
  locations build on the same `<Skeleton />`.
- No `loading.tsx` files exist yet under `apps/web/src/app/`. Add one per
  route segment (public, auth, student dashboard, admin dashboard, course
  pages, profile, payments, certificates, reports, settings, etc.) using
  the matching skeleton component — don't leave a route to fall back to a
  blank Next.js default.

## Rules

- **Preserve layout**: skeletons must reserve the exact final layout (card
  dimensions, table columns, chart aspect ratio, image/video aspect ratio)
  so nothing shifts when real content arrives.
- **Every reusable component gets a matching skeleton**: if you add
  `CourseCard`, add `CourseCardSkeleton` alongside it (same rule for
  instructor, certificate, payment, and any other card type; same rule for
  every `DataTable` usage — support 5/10/20/dynamic row counts via props
  like the existing `TableSkeleton`'s `rows`/`columns`).
- **TanStack Query integration**: use query `isLoading`/`isFetching`/
  `isPlaceholderData` to drive skeletons automatically on initial load,
  refetch, pagination, filter changes, and search — not just first mount.
- **Pagination & filtering**: never blank the screen on page/filter/search
  changes. Prefer TanStack Query's `placeholderData` (keep previous data
  visible) or show the skeleton only in place of the data region, never the
  whole page chrome.
- **Media**: images, videos, avatars, documents, and PDF previews all need
  a loading placeholder that reserves their aspect ratio.
- **Animation & accessibility**: shimmer/pulse only, smooth fade-in/out,
  no flashing; respect `prefers-reduced-motion` (disable the animation, not
  the skeleton); mark skeleton containers `aria-hidden` / `aria-busy` so
  screen readers don't announce placeholder content as real content.
