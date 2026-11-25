---
name: millar-web-workflow
description: "Master end-to-end web engineering conductor and creative workflow router combining the 7 Millar skills (millar-deep-research, millar-design, millar-create-image, millar-animation, millar-build-web, millar-verify-web) with Matt Pocock skills (grilling, codebase-design, tdd, code-review, diagnosing-bugs), Agency Agents specialists, Impeccable craft floor, canvas-design, and Millar MCP. Use when building a website, multi-page web app, redesign, or feature end-to-end so the agent follows disciplined phase gates, elevates creative originality, and verifies real browser quality before handoff."
version: 0.1.0-draft.1
license: MIT
---

# Millar Web Workflow: End-to-End Creative & Engineering Conductor

Orchestrate every web build as one continuous, gated pipeline from user intent through creative art direction, disciplined frontend engineering, and real-browser verification. Choose the lightest track that fits the task so small edits stay surgical while multi-page sites achieve unforgettable, cohesive craft.

## Step 1: Classify the Track (S / M / L) Before Touching Code

Read [references/track-routing-and-gates.md](references/track-routing-and-gates.md) when track boundaries or phase gates are non-obvious, then declare one track upfront:

| Track | Scope | Required Pipeline |
|---|---|---|
| **Track S (Surgical Fix / Single Component)** | Bug fix, single control update, isolated refactor | `diagnosing-bugs` (if bug) -> `millar-build-web` (minimal-change mode) -> `millar-verify-web` (Layers 1-2) |
| **Track M (New Page Synced to Existing Site / Hero Assets)** | Adding secondary pages (`/features`, `/pricing`, `/about`, `/docs`, `/app`) to a styled hero or user-supplied imagery/animations | `millar-deep-research` (extract Visual/Motion DNA) -> `millar-design` (lock `.millar/style-dna.md`) -> `millar-create-image` + `millar-animation` -> `millar-build-web` -> `millar-verify-web` (All 5 Layers + Cross-Page Continuity) |
| **Track L (Full Website / Multi-Page App / Redesign)** | Greenfield website, landing + app suite, or visual overhaul | `grilling` (only if critical decisions are ambiguous) -> `millar-deep-research` -> Creative Divergence -> `millar-design` -> `millar-create-image` + `millar-animation` -> `millar-build-web` (vertical slices) -> `millar-verify-web` (All 5 Layers) |

**Completion criterion:** Track (`S`, `M`, or `L`), affected routes, Visitor Modes (`Persuade` / `Experience` / `Operate` / `Read`), and required companion skills are declared before editing.

## Step 2: Run Creative Divergence (Track M & L Only, Never Skip)

Generic AI uniformity ("dark neon blob + Inter + 3 equal cards + fake vanity metrics + eyebrow kickers") happens when an agent skips creative positioning. Before finalizing `.millar/style-dna.md`, read [references/creative-divergence-protocol.md](references/creative-divergence-protocol.md) and lock:

1. **The Rut (Explicitly Banned):** Name the exact predictable template this product category always ships and exclude it.
2. **Cultural & Material Anchor:** Ground the aesthetic in the audience's real artifacts, print traditions, or physical spaces (while honoring every user-pinned brief or Hahlex invariant).
3. **One Authored Signature Moment:** Define one bespoke interactive or visual centerpiece that makes the site memorable (e.g., interactive live specimen, calibrated editorial proportion plate, shared-element route morph, or tactile mechanical control).
4. **Creative Commitment by Mode:** Full creative risk on `Persuade` / `Experience`; surgical density, calm hierarchy, and refined micro-details on `Operate` / `Read`.

**Completion criterion:** Creative direction is committed inside `.millar/style-dna.md` with zero category-default cliches.

## Step 3: Coordinate Specialist Context Pointers (Zero Duplication)

Route specialized work to existing authoritative skills rather than re-inventing their rules:

- **Ambiguous product or architecture tradeoffs:** invoke `grilling` (Matt Pocock) before coding.
- **Module boundaries, seams, and testability:** apply `codebase-design` (deep modules) and `tdd` (vertical slices) inside `millar-build-web`.
- **Hard bugs or regressions:** invoke `diagnosing-bugs` before patching.
- **Backend APIs, database schemas, auth, or deployment:** invoke the matching Agency Agents specialist (`agency-backend-architect`, `agency-database-optimizer`, `agency-identity-access-engineer`, `agency-devops-automator`).
- **Hahlex ecosystem projects:** ground every token, primitive, section, visual asset, and compliance audit in Millar MCP (`get_design_guidelines`, `get_design_tokens`, `get_component`, `get_visual_assets`, `validate_design`).

## Step 4: Execute Gated Handoffs (No Premature Completion)

Pass explicit disk artifacts between phases so later steps cannot lose early decisions:

1. **Research -> Design:** `.millar/research-dossier.md` feeds `.millar/style-dna.md`.
2. **Design -> Assets & Motion:** `.millar/style-dna.md` locks the 80% Master Style Prefix for `millar-create-image` and the 4-line Motion Thesis for `millar-animation`.
3. **Design + Assets -> Code:** `millar-build-web` implements vertical slices consuming locked tokens, real interactive states, Server-First boundaries, and Core Web Vitals hygiene.
4. **Code -> Ship Gate:** `millar-verify-web` runs all applicable QA layers (Static/MCP + Interactive Playwright + Visual Cross-Page Screenshots + WCAG `axe-core`/Keyboard/Reduced-Motion + 2-Axis Spec-vs-Standards Review).

**Completion criterion:** Every gate required by the active Track (`S`, `M`, or `L`) has passed with observed evidence, zero unverified claims, and honest reporting of remaining human aesthetic or screen-reader checks.
