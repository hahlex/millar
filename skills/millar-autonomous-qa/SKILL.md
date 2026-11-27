---
name: millar-autonomous-qa
description: "Autonomous end-to-end QA skill executing a continuous 8-stage testing loop (discover, plan, execute, observe, verify, reproduce, report, explore further) with hybrid depth modes (smoke, standard, deep-business), origin-scoped multi-role/multi-tenant browser sessions, frontier-based UI/ARIA/occlusion/i18n exploration, passive HAR-to-OpenAPI synthesis for Schemathesis, 4-axis differential authorization matrices, concurrency/resilience/AI evaluation, multi-channel causal outcome verification, and self-contained interactive HTML reporting."
version: 0.4.1-draft.1
license: MIT
---

# Millar Autonomous QA

Execute continuous, evidence-backed quality assurance against live non-production applications without modifying target application source code, leaking credentials, or exceeding runtime and cost budgets.

## Core Principles

1. **Non-Production Safety First**: Never send active QA traffic before `scripts/safety-guard.mjs` confirms loopback or explicitly authorized non-production targets and verifies remaining runtime, request, and AI-call budgets.
2. **Outcome Over HTTP 200**: A `200 OK` response is necessary but insufficient. Cross-verify real state across API payloads, Postgres databases, Redis/RQ queues, Mailpit email delivery, container logs, and Langfuse traces.
3. **Config-Driven Portability**: Target URLs, static catalogs, repository paths, DB/Redis env names, and test credentials come from `--config <path>` or CLI flags, never hardcoded application assumptions.
4. **Honest Triage**: Separate `confirmed_bug` (reproducible defect or invariant violation), `spec_gap` (missing OpenAPI contract, undocumented behavior, or ambiguous requirement), and `runtime_degraded` (unreachable optional dependency or timed-out service), plus `skipped_non_applicable` when a mode has no active surface.
5. **Zero Target Mutation**: Target repositories under test are strictly read-only. Never edit target source files to hide, work around, or fix discovered bugs.
6. **Zero U+2014 Em-Dash Discipline**: All skill files, scripts, ledgers, traces, regression scripts, and generated HTML reports must contain zero `U+2014` em-dash characters.

## CWD and Tool Cache Isolation Rule

Always execute `millar-autonomous-qa` scripts and external QA tools with `cwd` set to the `millar-autonomous-qa` skill directory (for example `skills/millar-autonomous-qa` or `~/.agents/skills/millar-autonomous-qa`) or an isolated temporary directory, NEVER inside a target application repository.
Before invoking Python/Hypothesis/pytest/Promptfoo runners, set:
- `HYPOTHESIS_STORAGE_DIRECTORY` inside `test-results/.hypothesis` (or `%LOCALAPPDATA%\millar-autonomous-qa\`)
- `PROMPTFOO_CONFIG_DIR` inside `test-results/.promptfoo` (or `%LOCALAPPDATA%\millar-autonomous-qa\`)
- `PYTEST_CACHE_DIR` inside `test-results/.pytest_cache`

This prevents `.hypothesis/`, `.schemathesis/`, `.pytest_cache/`, or `.promptfoo/` directories from ever polluting target repositories.

## First-Time Runtime Setup (Inside Skill Directory)

Run once from the installed `millar-autonomous-qa` skill folder before executing browser, Python fuzzing, Docker, or AI modes:
- **Node runners (`Playwright`, `Chrome DevTools MCP`, `Promptfoo`):** `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install`
- **Python runners (`Schemathesis`, `Hypothesis`, `pytest`, `httpx`, `psycopg`, `redis`):** `UV_PROJECT_ENVIRONMENT="$LOCALAPPDATA/millar-autonomous-qa/venv" uv sync` (or `~/.local/share/millar-autonomous-qa/venv` on macOS/Linux)
- **Optional Docker runners (`k6`, `Toxiproxy`):** ensure Docker daemon is running (`grafana/k6:latest`, `ghcr.io/shopify/toxiproxy:latest`).

## Continuous 8-Stage QA Loop & Hybrid Depth Modes

`scripts/run-qa-loop.mjs` drives the continuous testing loop across three execution depths (`--depth=smoke | standard | deep-business`) and records every iteration plus persistent frontier state in `memory/coverage-ledger.json`:

- **`--depth=smoke`**: Fast CI gate (2 routes/role, non-interactive UI crawl, capped API probes, skips persona workflows).
- **`--depth=standard`** (default): Full Phase 1+2 autonomous loop (origin-scoped headers, structured authenticated `4xx` capture, ARIA/occlusion/blank-screen/i18n checks, frontier expansion across iterations, passive HAR-to-OpenAPI synthesis feeding Schemathesis, 4-axis differential authorization matrix, k6, Toxiproxy, Promptfoo with multilingual Unicode refusal checks & built-in SSE provider, and multi-channel causal verification).
- **`--depth=deep-business`**: Everything in `standard` PLUS raises route exploration caps and runs `scripts/runners/workflow-scenarios.mjs` (Spec-Driven Persona Workflow Planner -> `memory/workflow-plan.md` + multi-step causal API/DB/Mailpit/Lifecycle workflow executor).

1. **`discover`**: Run `scripts/discover-surface.mjs` to probe live frontend HTML routes, `/healthz` and `/readyz`, `/openapi.json`, OIDC metadata, optional AI health, and optional static catalogs (`--repo-path`, `viewRegistry.ts`, `route-catalog.generated.ts`).
2. **`plan`**: Map enabled testing modes (`--modes`), depth tier (`--depth`), and remaining budget slices to registered runners (`ui-explorer.mjs`, `cdp-diagnostics.mjs`, `auth-matrix.mjs`, `api-fuzz-stateful.py`, `concurrency-k6.mjs`, `resilience-toxiproxy.mjs`, `ai-eval-promptfoo.mjs`, `workflow-scenarios.mjs`); skip unapplicable modes cleanly (`skipped_non_applicable`).
3. **`execute`**: Run planned tools sequentially while checking `memory/run-budget.json` before each step, passing per-role frontier exclusion/discovery lists into Playwright, synthesizing `memory/synthesized-openapi.json` passively from observed API traffic when `/openapi.json` is unavailable, and enforcing configurable per-runner timeouts (`--ai-timeout-ms`, default `90000`ms).
4. **`observe`**: Parse Contract 2 JSON outputs, collect traces and screenshots, separate **Exercised** vs **Discovered/Catalog** coverage honestly, filter Vite/CDN static assets from CDP API metrics, and atomically update `requestsUsed` and `aiCallsUsed`.
5. **`verify`**: Run `scripts/verify-outcomes.mjs` to correlate `X-Request-Id` across API responses, Postgres (`--expect-pg-min-rows`), Redis/RQ (flagging stuck queues with `rqWorkerCount === 0`), Mailpit (`--expect-mailpit-within-ms` causal polling), Langfuse, and Docker logs.
6. **`reproduce`**: Deduplicate findings into `memory/findings-ledger.json` and emit standalone syntax-verified regression scripts (`.mjs` or `.py`) under `memory/regressions/` with origin-scoped headers and explicit exit codes (`0` resolved, `1` still reproduces, `2` auth env required, `3` degraded/timeout).
7. **`report`**: Persist updated ledgers and generate a self-contained single-file HTML report v2 via `scripts/report-html.mjs` (canonically deduplicated artifact paths, clickable links, inline screenshot thumbnails + lightbox, client-side finding filters, honest Exercised vs Discovered KPIs, and clean run audit without internal skill log noise unless `--include-skill-log` is passed).
8. **`explore further`**: Persist `coverageLedger.frontier` (`visitedRoutesByRole`, `exercisedRoutes`, `discoveredRoutes`, `exercisedEndpoints`) so Iteration 2+ automatically targets unvisited discovered routes instead of repeating Iteration 1.

## Multi-Role, Multi-Tenant & 4-Axis Security Workflow

1. Discover available non-production dev accounts and auth flows (OIDC password/token exchange or seeded local accounts configured for the target).
2. Create isolated browser contexts (`browser.newContext()`) with **origin-scoped `context.route()` header injection** (NEVER global `extraHTTPHeaders`, preventing `Authorization` or `X-*` tenant headers from leaking to third-party origins like Google Fonts/CDNs).
3. Run `scripts/runners/auth-matrix.mjs` across ALL configured roles (zero slice cap, including `guardian` and `custom_*` roles) covering four differential security axes:
   - **Axis 1 (Cross-Tenant BOLA)**: Replay Tenant A observed entity IDs with Tenant B credentials.
   - **Axis 2 (Cross-Campus / Sub-Tenant BOLA Read & Write)**: Replay foreign-campus entity IDs and cross-campus write probes under scoped campus roles.
   - **Axis 3 (Vertical & Custom Role Parity)**: Verify privileged endpoints block all restricted/custom roles and custom role filter keys (`?role=custom_*`) do not trigger `422 PATTERN_MISMATCH`.
   - **Axis 4 (Semantic Body Leak Diffing)**: Flag HTTP `200` responses containing role-forbidden patterns (`forbiddenResponsePatterns`, e.g. `hr.payroll_`) or foreign entity IDs (`forbiddenEntityIds`).

## 9 Supported Testing Modes

| Mode | Primary Tool(s) | Focus |
| --- | --- | --- |
| `exploratory` | Playwright + Chrome DevTools MCP | Origin-scoped multi-role UI crawl, frontier expansion, structured authenticated `4xx`/`5xx`, ARIA snapshots, safe tab probing, button occlusion, blank-screen, React `flushSync`, i18n/em-dash audit, authenticated CDP Web Vitals (static assets filtered) |
| `stateful` | Schemathesis + Hypothesis + `workflow-scenarios.mjs` | Multi-step CRUD lifecycles, passive HAR-to-OpenAPI synthesis when `/openapi.json` is `404`, and `--depth=deep-business` spec-driven persona workflows |
| `property` | Hypothesis + Schemathesis | Invariant verification and minimal shrunk counterexamples across valid domain inputs |
| `negative` | Schemathesis + Playwright | Boundary, malformed JSON, invalid types, `GET -> PUT` round-trip `4xx` schema drift detection, and form validation |
| `concurrency` | k6 (Docker) + Postgres checks | Authenticated multi-header bursts, `k6WriteRace` idempotency/duplicate-commit detection, p95 latency thresholds |
| `authorization` | `auth-matrix.mjs` + Hypothesis + Playwright | 4-Axis Differential Matrix (Cross-Tenant BOLA, Cross-Campus Read/Write, Vertical + ALL Custom Roles, Semantic Body Leak Diffing) |
| `resilience` | Toxiproxy (Docker) + Playwright `page.route()` | Authenticated business endpoint TCP faults (latency, reset, recovery) and authenticated client `503`/abort degradation |
| `ai` | Promptfoo + Built-in SSE Provider + Langfuse | Unicode-normalized EN/VI prompt-injection refusal, optional `llm-rubric`, configurable `--ai-timeout-ms` (`90000`ms), built-in `sse-thread-turns` / `http-json` declarative provider |
| `outcome_verification` | `verify-outcomes.mjs` (`psycopg`, `redis`, Mailpit, Docker, Langfuse) | End-to-end causal verification beyond HTTP `200`, including stuck RQ queue (`rqWorkerCount === 0`), `--expect-mailpit-within-ms`, and `--expect-pg-min-rows` |

## Triage Rubric: Bug vs Spec Gap vs Runtime Degraded

- **`confirmed_bug`**: Reproducible unhandled 5xx, broken JSON on HTTP 200, cross-tenant/RBAC authorization leak, silent downstream drop (API 200/201 with missing DB row or expected Mailpit email), race duplicate commit, or uncaught browser/container exception.
- **`spec_gap`**: Missing `/openapi.json` or schema mismatch without server crash, undocumented query/response fields, ambiguous role behavior not specified in contracts, or missing idempotency contract.
- **`runtime_degraded`**: Optional dependency timeout or closed port (for example an unstarted local AI service or stopped worker) handled gracefully without corrupting state.

## Closed-Loop Remediation Handoff (`millar-diagnose-and-harden`)

Remember `millar-autonomous-qa` is strictly read-only on target application source code. Once `memory/findings-ledger.json` and standalone reproducers in `memory/regressions/` are generated, hand off confirmed defects directly to **`millar-diagnose-and-harden`** (`node <harden-skill-dir>/scripts/triage-repro-loop.mjs --from-qa-ledger <path-to-findings-ledger.json>`) to isolate root causes, apply minimal-diff fixes, lock permanent regression tests, and re-run the generated reproducers until exit `0` (`RESOLVED`).

## Reference Guides

- [references/tool-selection.md](references/tool-selection.md) -- Evaluated 9 candidate tools, non-redundancy rationale, installed versions, and Windows isolation notes.
- [references/qa-loop-and-modes.md](references/qa-loop-and-modes.md) -- Detailed 8-stage loop state machine, playbooks for all 9 modes, triage rules, and regression promotion.
- [references/safety-and-guardrails.md](references/safety-and-guardrails.md) -- Non-prod verification, budget enforcement, isolated accounts, CWD/cache isolation, and cleanup scope.
- [references/outcome-verification.md](references/outcome-verification.md) -- Multi-channel verification across API `X-Request-Id`, Postgres, Redis/RQ, Mailpit, Docker logs, and Langfuse.
- [references/self-validation-log.md](references/self-validation-log.md) -- Structured template and audit log for empirical self-validation runs and skill improvements.
