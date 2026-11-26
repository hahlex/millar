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

## 5. Operate Mode & Base CSS Hardening Checklist (Prevents Real Browser & A11y Bugs)

Apply these rules automatically on every `Operate` console, dashboard, editorial archive, or interactive table/drawer UI:
- **`[hidden]` & `<figure>` Base Reset:** Always include `[hidden] { display: none !important; }` AND `figure { margin: 0; }` in base CSS so `display: flex`/`grid` never overrides HTML `hidden` across mutually exclusive UI states (`Default` / `Loading` / `Empty` / `Error`) and UA default `40px` figure margins never pinch hero or catalog plates.
- **Zero Favicon 404 Noise:** Include a lightweight inline SVG `<link rel="icon" href="data:image/svg+xml,...">` on static HTML pages so local preview servers never emit spurious `/favicon.ico` 404 console/network errors.
- **`SVGElement.hidden` Hazard:** Never toggle `.hidden = true` on `<svg>` nodes (unlike `HTMLElement`, `SVGElement` lacks a native `hidden` reflector); toggle a CSS class or `style.display` + `aria-hidden="true"`.
- **WCAG SC 1.4.11 Control Border Contrast (`>= 3.0:1`):** Unselected inputs, selects, filter pills, and row action buttons MUST use a border token achieving `>= 3.0:1` contrast against their container surface in BOTH Light and Dark themes.
- **State Control Locking & Mobile Sort Scoping:** Disable search/filter/sort controls during `Error` and `Loading` states, and keep responsive mobile sort bars nested inside the active data-table container so they never leak above `Empty`, `Loading`, or `Error` panels.
- **Modal Drawer Isolation & Safe Focus Restore:** Apply `inert` to background `<main>`/`<header>`/`<footer>` + lock body scroll when a slide-over drawer opens. On `Escape`/close, restore focus via a deterministic fallback chain (`originatingRowButton -> firstVisibleRowButton -> searchInput -> main`) so focus never drops to `<body>` if a drawer action filtered out the inspected row.
