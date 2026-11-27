---
name: millar-web-workflow
description: "Master end-to-end web engineering conductor and creative workflow router (v0.3.0) uniting the 8 Millar skills (including millar-autonomous-qa) with Matt Pocock engineering discipline, Agency Agents studio roles, Anthropic canvas-design craft, and Impeccable anti-slop rigor. Always researches any named brand first (zero hardcoded palettes), authors all prompts in English, routes Track S/M/L cleanly, and gates completion on Zero-MCP mechanical auditing plus fresh-context independent review."
version: 0.3.0-draft.1
license: MIT
---

# Millar Web Workflow v0.3: End-to-End 5-Role Creative & Engineering Conductor

Orchestrate every web build as one continuous, gated pipeline from user intent and **Brand-First Research** through **Dual-Soul Creative Art Direction** (`canvas-design` engraving discipline + `Impeccable` craft-floor & storytelling rigor), clean Server-First frontend engineering, and zero-mercy independent verification. Choose the lightest track that fits the job so small edits stay surgical while multi-page sites achieve unforgettable `>= 9.0/10` craft with zero bureaucratic bloat.

## Non-Negotiable Ground Rules

1. **Brand-First Research (Zero Hardcoding):** If the user mentions ANY brand, research its real identity first (local `DESIGN.md`/`PRODUCT.md`, live connected MCP tools such as Millar MCP for Hahlex, or web research via `millar-deep-research`). NEVER hardcode one brand's colors or rules into another project.
2. **100% English Prompts & Technical Specs:** Author all image-generation prompts, art-direction prefixes, `.millar/*.md` design contracts, and reviewer briefs in crisp English. Render visible website and artwork copy in the user's requested locale (e.g., Vietnamese with full UTF-8 diacritics).
3. **Studio Role Accountability:** Never run on generic autopilot. Every phase activates explicit studio ownership:
   - *Phases 1-2:* Visual Storyteller + Brand Guardian + UX Architect (`millar-deep-research` -> `millar-design`).
   - *Phase 3:* Master Illustrator + Motion Choreographer (`millar-create-image` + `millar-animation`).
   - *Phase 4:* Frontend Developer + Software Architect + Minimal Change Engineer (`millar-build-web`).
   - *Phase 5:* Mechanical Auditor (`scripts/millar-audit.mjs`) + **Fresh-Context Independent Finish Reviewer** (`millar-verify-web`).

## Step 1: Classify the Track (S / M / L) Before Touching Code

Read [references/track-routing-and-gates.md](references/track-routing-and-gates.md) when boundaries are non-obvious, then declare one track upfront:

| Track | Scope | Required Pipeline |
|---|---|---|
| **Track S (Surgical Fix / Single Component)** | Bug fix, single control update, isolated refactor | `diagnosing-bugs` (if bug) -> `millar-build-web` (minimal-change mode) -> `millar-verify-web` (Layer 1 + `millar-audit.mjs` + Layer 2 + Layer 5 diff review) |
| **Track M (Secondary Pages Synced to Existing Site / Hero Assets)** | Adding `/features`, `/pricing`, `/about`, `/docs`, `/app` to a styled hero, named brand, or user-supplied imagery/animations | `millar-deep-research` (Brand Research + Visual/Motion DNA) -> `millar-design` (`.millar/style-dna.md`) -> `millar-create-image` + `millar-animation` -> `millar-build-web` -> `millar-verify-web` (All 5 Layers + Independent Finish Review) |
| **Track L (Full Website / Multi-Page App / Redesign)** | Greenfield website, landing + app suite, or visual overhaul | `grilling` (only if critical product tradeoffs are ambiguous) -> `millar-deep-research` -> Creative Divergence -> `millar-design` -> `millar-create-image` + `millar-animation` -> `millar-build-web` (vertical slices) -> `millar-verify-web` (All 5 Layers + Independent Finish Review) |

**Completion criterion:** Track (`S`, `M`, or `L`), named brand research path, affected routes, and Visitor Modes (`Persuade` / `Experience` / `Operate` / `Read`) declared before editing.

## Step 2: Run Brand Research & Creative Divergence (Track M & L Only)

Before locking `.millar/style-dna.md`, read [references/creative-divergence-protocol.md](references/creative-divergence-protocol.md) and establish:
1. **Researched Brand Truth (If Named):** Verified palette, light/dark polarity cadence, accent ceiling, typography, and cultural context from real sources (local files, live MCP, or web research).
2. **The Rut (Explicitly Banned):** Name the predictable category template AND all 4 generic AI defaults (including unbriefed warm-cream + serif + terracotta, dark neon SaaS, and overused training-data display fonts) and exclude them.
3. **Cultural & Material Anchor:** Ground open visual axes in 3+ concrete material/graphic families from the audience's real world, picking light vs. dark polarity from their physical use scene.
4. **One Authored Signature Moment:** Define one unforgettable interactive or visual centerpiece per `Persuade`/`Experience` page (and compounding micro-craft on `Operate`/`Read` screens).

**Completion criterion:** Creative direction and researched brand truth locked inside `.millar/style-dna.md` with zero category-default clichés.

## Step 3: Coordinate Specialist Context Pointers (Zero Duplication)

- **Ambiguous architecture or product tradeoffs:** invoke `grilling` before coding.
- **Module boundaries, seams, and testability:** apply `codebase-design` (deep modules) and `tdd` (vertical slices) inside `millar-build-web`.
- **Hard bugs or regressions:** invoke `diagnosing-bugs` before patching.
- **Backend APIs, schemas, auth, or deployment:** invoke the matching specialist (`agency-backend-architect`, `agency-database-optimizer`, `agency-identity-access-engineer`, `agency-devops-automator`).
- **Hahlex ecosystem projects:** query live canonical tokens, UI primitives, sections, and compliance checks from Millar MCP (`get_design_guidelines`, `get_design_tokens`, `get_component`, `get_visual_assets`, `validate_design`).

## Step 4: Execute Gated Handoffs (No Premature Self-Grading)

Pass explicit disk artifacts between phases so decisions never drift:
1. **Research -> Design:** `.millar/research-dossier.md` feeds `.millar/style-dna.md`.
2. **Design -> Visuals & Motion:** `.millar/style-dna.md` locks the 80% English Master Style Prefix (plus provenance sidecars) for `millar-create-image` and the 4-line Motion Thesis for `millar-animation`.
3. **Design + Visuals -> Code:** `millar-build-web` ships vertical slices with real interactive states, Server-First boundaries, browser surface theming, and Core Web Vitals hygiene.
4. **Code -> Ship Gate:** `millar-verify-web` runs standalone `scripts/millar-audit.mjs` (works with zero MCP!) + Millar MCP `validate_design` (when active) + Playwright E2E/WCAG + **Fresh-Context Independent Finish Reviewer** (`ship` | `fix` | `rebuild` | `recapture`).

**Completion criterion:** Every gate required by the active Track passed with observed evidence and independent finish-reviewer sign-off.
