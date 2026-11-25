# Web Architecture & Frontend Craft Checklist

## 1. Deep Module & Feature-Driven Organization

Prefer feature-scoped modules over sprawling flat folders:
```text
src/
  app/                  # Thin route orchestrators (page.tsx, layout.tsx, metadata)
  features/<domain>/    # Cohesive deep modules (logic, data adapters, feature UI, tests)
  components/           # Shared design-system primitives & layout frames
  lib/                  # Pure utilities, typed clients, token helpers
```
- **Deletion Test:** If removing a wrapper component or hook makes complexity disappear instead of multiplying across callers, delete the pass-through wrapper.
- **Two-Adapter Rule:** Only introduce an abstraction seam when two concrete implementations exist (e.g. real API + in-memory test fake, or light + dark register adapters).
- **Accept Dependencies:** Pass fetchers, clocks, or formatters into pure domain modules so tests stay deterministic and sub-second.

## 2. React / Next.js Server-Client Boundary Discipline

- **Server by Default:** Keep `layout.tsx`, `page.tsx`, static copy, and read queries on the server.
- **Push `"use client"` Down:** Isolate stateful interactivity (search bars, modals, theme toggles, interactive playgrounds) into lean leaf components.
- **Slot Composition:** Pass Server Components as `children` into Client layout wrappers (shells, drawers, dialogs) instead of marking the entire subtree `"use client"`.
- **Zero Hydration Mismatches:** Never branch initial render markup on `window`, `Date.now()`, `Math.random()`, or `localStorage`; read browser-only state inside `useEffect` or sync cleanly via cookie/header/CSS media query.
- **Server vs. Client State:** Never copy server-fetched lists into global client stores unless live optimistic editing genuinely requires it.

## 3. Forms, Tables & Interactive Ergonomics

- **Forms:** Explicit `<label htmlFor>`, `aria-invalid`, `aria-describedby` linked to `role="alert"` error messages, disabled/busy submit button during async flights, keyboard submission via `Enter`.
- **Tables & Lists:** Tabular numerals (`font-variant-numeric: tabular-nums`) right-aligned on numeric columns, `-` for empty cells, real working `FilterBar` with removable filter pills and `Clear all`, and responsive `mobileCard` transformation below `640px` so zero horizontal scrollbars appear.
- **Dialogs & Drawers:** Trap or contain focus, close on `Escape`, block accidental backdrop dismissal when a form is `dirty`, and restore focus to the trigger button on close.
- **Single Primary CTA Discipline:** Maximum one `primary` CTA per `PageHeader` or dialog footer so visual hierarchy stays unmistakable.

## 4. Responsive Breakpoint Floor

Design and verify fluidly across all three canonical widths:
- **Mobile (`375px-390px`):** `0px` horizontal overflow (`scrollWidth <= innerWidth`), accessible mobile drawer navigation, `>= 40-44px` touch targets, stacked or card-adapted tables.
- **Tablet (`768px`):** Clean 2-column or adapted rail without cramped sidebars.
- **Desktop (`1280px-1440px`):** Generous breathing room, `65-75ch` prose line length, sticky navigation/TOC rails cleanly separated from primary content.
