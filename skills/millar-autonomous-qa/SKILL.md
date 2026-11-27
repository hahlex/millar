---
name: millar-autonomous-qa
description: "Autonomous end-to-end QA skill executing a continuous 8-stage testing loop (discover, plan, execute, observe, verify, reproduce, report, explore further) across multi-role and multi-tenant sessions, UI/API/stateful/property/negative/concurrency/authorization/resilience/AI modes, non-production safety guards, budget enforcement, multi-channel outcome verification, and self-contained HTML reporting."
version: 0.1.0-draft.1
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

## Continuous 8-Stage QA Loop

`scripts/run-qa-loop.mjs` drives the continuous testing loop and records every iteration in `memory/coverage-ledger.json`:

1. **`discover`**: Run `scripts/discover-surface.mjs` to probe live frontend HTML routes, `/healthz` and `/readyz`, `/openapi.json`, OIDC metadata, optional AI health, and optional static catalogs (`--repo-path`, `viewRegistry.ts`, `route-catalog.generated.ts`).
2. **`plan`**: Map enabled testing modes (`--modes`) and remaining budget slices to registered runners or baseline probes; skip unapplicable modes cleanly (`skipped_non_applicable`).
3. **`execute`**: Run planned tools sequentially while checking `memory/run-budget.json` before each step and enforcing per-runner timeouts so a hanging port never stalls the loop.
4. **`observe`**: Parse Contract 2 JSON outputs, collect traces and artifacts, and atomically update `requestsUsed` and `aiCallsUsed`.
5. **`verify`**: Run `scripts/verify-outcomes.mjs` to correlate `X-Request-Id` across API responses, Postgres, Redis/RQ, Mailpit, Langfuse, and Docker logs.
6. **`reproduce`**: Deduplicate findings into `memory/findings-ledger.json` and emit standalone syntax-verified regression scripts (`.mjs`, `.py`, or `.spec.ts`) under `memory/regressions/`.
7. **`report`**: Persist updated ledgers and optionally generate a self-contained single-file HTML report via `scripts/report-html.mjs`.
8. **`explore further`**: Evaluate uncovered routes, endpoints, roles, and remaining budget to decide whether to start another iteration or conclude cleanly.

## Multi-Role and Multi-Tenant Simulation Workflow

1. Discover available non-production dev accounts and auth flows (OIDC password/token exchange or seeded local accounts configured for the target).
2. Create isolated browser contexts (`browser.newContext()` with separate `storageState`) or distinct API auth headers per `(role, tenant)` pair (for example `owner`, `admin`, `manager`, `teacher`, `viewer`, `student`, `guardian` across `tenantA` and `tenantB`).
3. Exercise CRUD (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and UI flows per role, then replay cross-tenant and lower-privilege tokens against privileged or foreign-tenant endpoints to verify strict `401`/`403`/`404` enforcement.

## 9 Supported Testing Modes

| Mode | Primary Tool(s) | Focus |
| --- | --- | --- |
| `exploratory` | Playwright + Chrome DevTools MCP | Multi-role/tenant UI navigation, console/pageerror/network checks, Core Web Vitals & CDP diagnostics |
| `stateful` | Schemathesis + Hypothesis | Multi-step `POST -> GET -> PATCH -> DELETE` API lifecycle workflows and entity persistence |
| `property` | Hypothesis + Schemathesis | Invariant verification and minimal shrunk counterexamples across valid domain inputs |
| `negative` | Schemathesis + Playwright | Boundary, malformed JSON, invalid types, and form validation rejecting bad inputs with 4xx (zero 5xx) |
| `concurrency` | k6 (Docker) + Postgres checks | Burst load, double-submit/idempotency race detection, p95/p99 latency thresholds |
| `authorization` | Hypothesis + Playwright | Cross-role privilege escalation and cross-tenant IDOR matrix |
| `resilience` | Toxiproxy (Docker) + Playwright `page.route()` | Backend TCP faults (latency, reset, timeout) and client HTTP fault degradation/recovery |
| `ai` | Promptfoo + Langfuse | Groundedness, JSON schema adherence, prompt-injection & PII red-teaming (skipped if AI offline or `maxAiCalls === 0`) |
| `outcome_verification` | `verify-outcomes.mjs` (`psycopg`, `redis`, Mailpit, Docker, Langfuse) | End-to-end correlation beyond HTTP status codes |

## Triage Rubric: Bug vs Spec Gap vs Runtime Degraded

- **`confirmed_bug`**: Reproducible unhandled 5xx, broken JSON on HTTP 200, cross-tenant/RBAC authorization leak, silent downstream drop (API 200/201 with missing DB row or expected Mailpit email), race duplicate commit, or uncaught browser/container exception.
- **`spec_gap`**: Missing `/openapi.json` or schema mismatch without server crash, undocumented query/response fields, ambiguous role behavior not specified in contracts, or missing idempotency contract.
- **`runtime_degraded`**: Optional dependency timeout or closed port (for example an unstarted local AI service or stopped worker) handled gracefully without corrupting state.

## Reference Guides

- [references/tool-selection.md](references/tool-selection.md) -- Evaluated 9 candidate tools, non-redundancy rationale, installed versions, and Windows isolation notes.
- [references/qa-loop-and-modes.md](references/qa-loop-and-modes.md) -- Detailed 8-stage loop state machine, playbooks for all 9 modes, triage rules, and regression promotion.
- [references/safety-and-guardrails.md](references/safety-and-guardrails.md) -- Non-prod verification, budget enforcement, isolated accounts, CWD/cache isolation, and cleanup scope.
- [references/outcome-verification.md](references/outcome-verification.md) -- Multi-channel verification across API `X-Request-Id`, Postgres, Redis/RQ, Mailpit, Docker logs, and Langfuse.
- [references/self-validation-log.md](references/self-validation-log.md) -- Structured template and audit log for empirical self-validation runs and skill improvements.
