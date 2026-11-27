# Track Routing, Phase Gates & Cross-Skill Handoffs

Use this reference to select the exact track and enforce clean phase handoffs across Antigravity, Claude Code, Codex, and Cursor.

## 1. Track Decision Matrix

| Signal in User Request | Track | Rationale |
|---|---|---|
| "Fix button spacing", "Fix broken filter", "Update one component prop" | **Track S** | Surgical minimal diff (`agency-minimal-change-engineer` discipline); avoid unsolicited refactors or re-researching the whole site. |
| "I already have hero images/animations; build the rest of the site", "Add /pricing and /about matching our homepage" | **Track M** | Mandatory Visual/Motion DNA extraction (`millar-deep-research`) + `.millar/style-dna.md` + matching secondary visuals (`millar-create-image`) + 6-axis Cross-Page Continuity audit. |
| "Build a new web app / marketing site from scratch", "Redesign our whole website" | **Track L** | Full discovery, Creative Divergence Protocol, Style DNA Contract, bespoke assets/motion, vertical-slice architecture, and full 5-layer QA gate. |

## 2. Phase Gate Artifacts (`.millar/`)

Store lightweight handoff documents in `.millar/` inside the project workspace (or in the task scratch directory if the repo restricts untracked files):

| Gate | Producer Skill | Artifact | Exit Condition |
|---|---|---|---|
| **Gate 1: Intent & DNA** | `millar-deep-research` | `.millar/research-dossier.md` | Every user asset/animation dissected; pinned constraints separated from open axes. |
| **Gate 2: Creative & Style Lock** | `millar-design` | `.millar/style-dna.md` | 12-axis Style DNA locked, Rut named & excluded, Secondary-Page Richness Contract written for every route. |
| **Gate 3: Visual & Motion Readiness** | `millar-create-image` + `millar-animation` | Assets + `.prompt.json` + Motion Thesis | Anchor + secondary-page visuals inspected; shared motion tokens & `prefers-reduced-motion` ready. |
| **Gate 4: Production Code** | `millar-build-web` | Working routes + unit tests | Deep modules, Server-First leaves, 5 UI states, zero mock placeholders, `typecheck` & `build` green. |
| **Gate 5: Ship-Readiness QA** | `millar-verify-web` | Test logs + screenshots | `validate_design` clean, Playwright interactive E2E green, `axe-core` 0 critical/serious, cross-page continuity `>= 4/5`, 2-axis Spec/Standards review clean. |

## 3. Clean Escalation to Non-Frontend Specialists

When a web project requires server infrastructure beyond frontend UI, keep Millar skills focused on design/frontend/QA and route backend domains cleanly:
- **API contracts / auth / multi-tenant permissions:** `agency-backend-architect`, `agency-api-platform-engineer`, `agency-identity-access-engineer`
- **Database schema / indexing / migrations:** `agency-database-optimizer`, `agency-database-reliability-engineer`
- **Payments / billing / webhooks:** `agency-payments-billing-engineer`
- **CI/CD, Cloudflare Workers, edge caching:** `agency-devops-automator`
- **Root-cause debugging, OWASP security hardening, performance bottlenecks & QA reproducer fixes:** `millar-diagnose-and-harden` (`scripts/millar-harden-scan.mjs` + `scripts/triage-repro-loop.mjs`)
- **Live multi-role full-stack black-box QA exploration:** `millar-autonomous-qa` (`scripts/run-qa-loop.mjs`)
