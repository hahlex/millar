# Performance, Waterfall & Bottleneck Diagnosis Playbook

Follow a **measure-first, impact-ordered** workflow. Never micro-optimize loops or scatter `useMemo` before proving where milliseconds are actually spent.

## 1. Impact-Ordered Priority Ladder

Fix bottlenecks strictly from highest to lowest wall-clock leverage:

| Priority | Bottleneck Class | Typical Symptom | Primary Fix Pattern |
| --- | --- | --- | --- |
| **1 (Critical)** | **Async Waterfalls & N+1 Queries** | Slow TTFB/LCP, sequential `await` inside loops, N+1 ORM queries per list item | Parallelize independent I/O with `Promise.all()` / `asyncio.gather()`, batch SQL with `WHERE id = ANY($1)` or `JOIN`, evaluate cheap sync guards before `await`, stream slow panels with `<Suspense>` |
| **2 (Critical)** | **Oversized Client Bundles & Hydration** | High TBT/INP, slow cold mobile load, megabytes of client JS | Keep pages/layouts as Server Components (`0 KB` client JS), push `"use client"` to lean leaves, eliminate barrel imports (`lodash`, `moment`, `* as Icons`), lazy-load heavy below-the-fold charts/editors |
| **3 (High)** | **Main-Thread Long Tasks & Layout Thrash** | INP `> 200ms`, sluggish typing/filtering, dropped frames | Wrap non-urgent state updates in React 19 `useTransition` / `useActionState`, yield heavy loops via `scheduler.yield()`, animate compositor properties (`transform`, `opacity`) and native CSS primitives (`animation-timeline`, `[popover]`, `@starting-style`), inspect **LoAF** (Long Animation Frames) |
| **4 (High)** | **LCP Resource Discovery & CLS** | LCP `> 2.5s`, CLS `> 0.1` | Never lazy-load hero LCP media (`fetchPriority="high"`), preload critical fonts (`display: swap`), declare explicit `width`/`height`/`aspect-ratio`, add declarative Speculation Rules for key MPA/route transitions |
| **5 (Medium)** | **Unbounded I/O & Missing Caching** | Intermittent worker hangs, repeated expensive queries | Enforce `AbortSignal.timeout()` / `timeout=` on all outbound HTTP calls, add composite DB indexes verified via `EXPLAIN (ANALYZE, BUFFERS)`, add `Cache-Control` / `ETag` on static/read-heavy responses |

## 2. Measurement Discipline (Before & After Proof)

Every performance fix MUST include quantitative before-and-after evidence:
- **Frontend CWV:** Record LCP, INP/LoAF, CLS, and JS transfer size via Chrome DevTools MCP (`performance_start_trace` + `LCPBreakdown` / `CLSCulprits` / `RenderBlocking`), Playwright `performance` entries, or `millar-audit.mjs --url=...`.
- **Backend Latency:** Run a pinned multi-iteration timing check via `scripts/triage-repro-loop.mjs --runs=5` (comparing `median` and `p95` ms before vs. after) and capture Postgres `EXPLAIN (ANALYZE, BUFFERS)` query plans when touching SQL/ORM queries.
- **Skip zero-impact churn:** If an optimization yields negligible measured improvement (`< 5%` or `< 10ms` on a fast path), drop the complexity and keep code readable.
