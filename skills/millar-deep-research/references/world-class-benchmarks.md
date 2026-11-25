# World-Class Design & Motion Benchmark Reference

Use these verified design-engineering benchmarks to calibrate research queries and elevate aesthetic decisions. Extract *discipline* (hierarchy, pacing, proportion, motion clarity) rather than copying brand assets.

## 1. Visual Craft & Design System Benchmarks

| Reference Class | Benchmark Examples | What Discipline to Study |
|---|---|---|
| **Design System Portals & Docs** | Vercel Geist, Stripe Docs, Radix, Apple HIG | 3-column reading ergonomics, interactive live playgrounds, strict typographic hierarchy, crisp 1px structural rules, instant search (`Cmd+K`) |
| **Warm Editorial & Human AI** | Anthropic, Stripe Press, Are.na, Kinfolk | Archival cream/sand warmth, generous `65ch` prose rhythm, calm authority without stock-photo clutter, subtle earth pigments |
| **Precision Product Workspaces** | Linear, Raycast, Cron / Notion Calendar, Figma | High-density 1-glance clarity, keyboard-first affordances, zero decorative clutter, hairline tonal layering, tabular numeric precision |
| **Photo-Led & Narrative Launches** | Apple Product Pages, Teenage Engineering, Framer Showcases | Single focal hero statement, deliberate pacing between full-bleed visuals and quiet typographic pauses, cohesive lighting across every crop |
| **Architectural / Swiss Web** | Dieter Rams Braun Archive, Swiss Design Awards, Mono-grid portfolios | Exposed grid math, flush-left optical tension, extreme scale contrast, disciplined 1-accent focus |

## 2. Motion & Interaction Engineering Benchmarks

| Practitioner / Standard | Core Lesson to Apply |
|---|---|
| **Emil Kowalski (Animations on the Web / Sonner / Vaul)** | Fast interruptible springs for touch/pointer actions; realistic origin scaling (never `scale(0)` from nowhere); `scale(0.97)` tactile press; zero-delay consecutive tooltip swaps; exit faster than entrance. |
| **Rauno Freiberg (Interaction Design Guidelines)** | Compounding micro-details, velocity inheritance on gestures, fluid command palettes, physical restraint so motion feels felt rather than watched. |
| **W3C View Transitions API & CSS Scroll-Driven Animations** | Compositor-thread route morphing (`view-transition-name`) and declarative `animation-timeline: view()` / `scroll()` replacing heavy JS scroll listeners, with clean progressive fallbacks. |
| **WCAG 2.1 / 2.2 Motion Accessibility** | Mandatory `prefers-reduced-motion: reduce` alternative that strips spatial translation/parallax while preserving instant opacity/state confirmation so feedback remains legible. |

## 3. Targeted Web Search Queries for Agents

When running live research via `search_web` or `WebSearch`, combine domain + craft axis:
- **Layout & Editorial Pacing:** `"editorial web design" "<industry>" typography grid layout case study`
- **Animation Patterns:** `"Emil Kowalski" OR "Motion.dev" OR "CSS View Transitions" "<interaction type>" spring easing`
- **Color & Materiality:** `"editorial color palette" "<mood/material>" warm paper dark stage typography contrast`
- **Multi-Page Cohesion:** `"brand guidelines" web art direction photography lighting framing consistency`
