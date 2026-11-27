# Core Web Vitals, Semantic SEO & UX Copy Hygiene

## 1. Core Web Vitals Engineering Targets (p75 Mobile)

| Metric | Target | Concrete Implementation Rules |
|---|---|---|
| **LCP (Largest Contentful Paint)** | `< 2.5s` | Never lazy-load hero images or primary headlines; set `priority` / `fetchPriority="high"` on LCP media; inline critical CSS tokens; stream slow secondary panels inside `<Suspense>`; use declarative **Speculation Rules API** (`prefetch`/`prerender` on moderate eagerness) for near-instant MPA/route navigations. |
| **INP (Interaction to Next Paint)** | `< 200ms` | Keep client bundles lean via RSC; avoid long main-thread tasks (`> 50ms`); wrap heavy search/filter/tab updates in React 19 `useTransition` / `useActionState`; break up CPU loops with `scheduler.yield()`; attribute slow frames via the **Long Animation Frames (LoAF)** API; never animate layout-reflow properties (`width`, `height`, `top`, `left`). |
| **CLS (Cumulative Layout Shift)** | `< 0.1` | Always declare explicit `width`/`height` or `aspect-ratio` on every image, SVG, canvas, and embed; host/preload fonts with `next/font` (`display: "swap"`); reserve `min-height` for dynamic banners or skeletons; add `scroll-margin-top` so sticky headers never obscure focused targets (WCAG 2.2 SC 2.4.11). |

## 2. Semantic HTML & Technical SEO Baseline

- **One `<h1>` per page** matching the page's primary intent; logical heading outline (`h1 -> h2 -> h3`, never skipping levels solely for font size).
- **Landmarks:** `<header>`, `<nav aria-label="...">`, single `<main id="...">`, `<aside>` (when relevant), and top-level `<footer>` strictly outside `<main>`.
- **Metadata:** Unique `<title>` (`<= 60` chars), clear `<meta name="description">` (`120-155` chars), canonical URL, OpenGraph title/description/image, and `lang` attribute (`en` / `vi`) matching page copy.
- **Structured Data:** Add valid JSON-LD (`Organization`, `SoftwareApplication`, `Article`, `FAQPage`) on public marketing/docs routes where relevant, using strictly truthful data (never fabricated ratings or fake customer counts).

## 3. UX Copy & Bilingual Vietnamese Hygiene

- **Action-Named Controls:** Buttons state the exact outcome ("Create workspace", "Deprecate token", "Retry sync") instead of vague "Submit" or "OK".
- **Helpful Errors:** Name what failed and the exact recovery path ("Workspace name must be at least 3 characters." / "Unable to reach endpoint. Retry or check network.").
- **Truthful Content Only:** Zero Lorem Ipsum, zero fake testimonials, zero invented uptime numbers. Label demonstration data transparently when illustrating a greenfield product.
- **Zero Em-Dash Rule (Hahlex Surfaces):** Avoid `U+2014` in all Hahlex-controlled UI labels, copy, and docs; use colons, parentheses, or clean sentence breaks (never alter user-provided or quoted external data).
- **Vietnamese Typography (`:lang(vi)`):** Verify stacked diacritics (`ệ`, `ư`, `ỗ`, `ắ`, `ồ`, `ử`) have generous display line-height (`>= 1.20`) and top headroom so clipped lines never occur on hero headings or buttons.
