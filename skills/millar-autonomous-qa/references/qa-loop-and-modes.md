# Continuous QA Loop and Testing Modes Playbook

This reference defines the 8-stage continuous QA loop state machine, playbooks for all 9 testing modes, `skipped_non_applicable` rules, defect classification (`confirmed_bug` vs `spec_gap` vs `runtime_degraded`), and regression test promotion.

## 1. The 8-Stage Continuous Loop State Machine

Each iteration appended to `memory/coverage-ledger.json` records ISO-8601 timestamps and statuses (`completed`, `degraded`, `skipped`, `failed`, `stopped_budget_exhausted`) for all 8 stages:

1. **`discover`**: Execute `node scripts/discover-surface.mjs` to collect reachable UI routes, API health (`/healthz`, `/readyz`), OpenAPI endpoints (`/openapi.json`), OIDC metadata, optional AI health, and optional static route catalogs supplied via `--repo-path` or `--config`.
2. **`plan`**: Filter enabled `--modes`, compute remaining request/AI-call/minute budget slices, and map modes to registered runners in `scripts/runners/` (falling back to non-mutating baseline surface probes if a mode runner is not installed).
3. **`execute`**: Run each planned task sequentially while verifying remaining budget before each step. Enforce hard per-runner timeouts so a hanging port never stalls the loop.
4. **`observe`**: Parse Contract 2 JSON outputs from each tool, collect trace paths (`memory/traces/`) and screenshots, and atomically increment `memory/run-budget.json`.
5. **`verify`**: Run `node scripts/verify-outcomes.mjs` to verify downstream persistence and side effects (API correlation, Mailpit, Postgres, Redis/RQ, Docker logs, Langfuse).
6. **`reproduce`**: Normalize and deduplicate findings into `memory/findings-ledger.json`, generate standalone reproducible scripts in `memory/regressions/`, and syntax-check every generated `.mjs` (`node --check`) or `.py` (`python -m py_compile`) reproducer.
7. **`report`**: Persist `coverage-ledger.json` and `findings-ledger.json` atomically; invoke `node scripts/report-html.mjs` when `--out-report` is provided.
8. **`explore_further`**: Compare newly covered routes, endpoints, roles, and modes against discovered surface and remaining budget to decide whether to continue to `iteration + 1` or terminate cleanly.

## 2. Playbooks for All 9 Testing Modes

### 2.1 `exploratory` (Playwright + Chrome DevTools MCP)
- **Entry Condition**: Reachable frontend `--target-url`.
- **Actions**: Launch isolated browser contexts (`browser.newContext()`) per configured role/tenant with **origin-scoped `context.route()` header injection** (never global `extraHTTPHeaders`), traverse unvisited frontier routes across iterations, inspect ARIA accessibility snapshots, click safe read-only tabs (`--interactive`), check button occlusion, blank screens, React `flushSync` warnings, and i18n/em-dash DOM hygiene, capture structured authenticated `4xx` API errors (with exact URL, status, and JSON error code) alongside `5xx`/`console.error`/`pageerror`, record redacted API traffic to `memory/traces/observed-api-traffic.json`, and run authenticated CDP Web Vitals diagnostics with Vite/CDN static assets filtered out of API KPIs.
- **Pass Criteria**: Zero uncaught `pageerror`, zero unexpected `console.error`, zero authenticated `4xx`/`5xx` API failures, zero occluded primary action buttons or blank screens.

### 2.2 `stateful` (Schemathesis + Hypothesis `RuleBasedStateMachine` + `workflow-scenarios.mjs`)
- **Entry Condition**: Reachable `--api-url` with live OpenAPI schema, passively synthesized `memory/synthesized-openapi.json` (via `scripts/lib/har-to-openapi.mjs`), or configured CRUD / `workflows[]` definitions.
- **Actions**: Chain `POST` creation -> `GET` read -> `PUT`/`PATCH` update -> `DELETE` cleanup using captured resource IDs and QA-prefixed identifiers; flag `GET -> PUT` round-trip `4xx` schema mismatches explicitly as `spec_gap`; in `--depth=deep-business`, execute spec-driven multi-step persona workflows with causal Mailpit/Postgres/post-revocation checks and guaranteed `cleanup: true` steps.
- **Pass Criteria**: Persisted entities match written attributes, causal downstream outcomes succeed, and deleted/revoked entities return `403`/`404` on subsequent reads.

### 2.3 `property` (Hypothesis + Schemathesis)
- **Entry Condition**: Reachable `--api-url` with parameterized endpoints or domain invariants.
- **Actions**: Generate diverse valid inputs including Unicode / Vietnamese diacritics (`Tieng Viet`), boundary lengths, and numeric ranges; verify round-trip serialization and idempotent `GET` invariants; shrink any failure to a minimal counterexample.
- **Pass Criteria**: All property invariants hold across generated examples without unhandled 5xx errors.

### 2.4 `negative` (Schemathesis + Playwright Form Validation)
- **Entry Condition**: Reachable `--api-url` or frontend forms.
- **Actions**: Send missing required fields, wrong JSON types, invalid path IDs, malformed JSON bodies, and oversized strings.
- **Pass Criteria**: Explicit `400`/`404`/`422` validation responses; zero `500` responses or stack-trace leaks.

### 2.5 `concurrency` (k6 Docker + Postgres Uniqueness Checks)
- **Entry Condition**: Reachable `--api-url` with idempotent or state-mutating endpoints and Docker `grafana/k6` available.
- **Actions**: Run bounded virtual-user bursts (`--vus`, `--iterations`) with full multi-header role auth (`Authorization` + tenant/membership headers) and optional `cfg.k6WriteRace` write payloads sharing an `Idempotency-Key`; verify p95 latency and duplicate prevention.
- **Pass Criteria**: Duplicate submissions are rejected (`409`) or deduplicated cleanly (`<= 1` HTTP `200`/`201`) with zero duplicate database rows.

### 2.6 `authorization` (4-Axis Differential `auth-matrix.mjs` + Hypothesis + Playwright)
- **Entry Condition**: Two or more configured roles, campuses, or tenants (ALL configured roles participate without slice caps, including `guardian` and `custom_*` roles).
- **Actions**: Harvest observed entity URLs from Playwright traffic and execute 4 differential axes: (1) Cross-Tenant BOLA replay, (2) Cross-Campus / Sub-Tenant BOLA read & write probes, (3) Vertical RBAC + custom-role filter parity (`?role=custom_*` must not return `422`), and (4) Semantic Body Leak Diffing on HTTP `200` payloads against `forbiddenResponsePatterns` / `forbiddenEntityIds`.
- **Pass Criteria**: Strict `401`/`403`/`404` isolation across tenant/campus/role boundaries and zero semantic body leaks.

### 2.7 `resilience` (Toxiproxy Docker + Playwright `page.route()`)
- **Entry Condition**: Reachable frontend/API and Docker `ghcr.io/shopify/toxiproxy` (or Playwright `page.route()` for client faults).
- **Actions**: Proxy authenticated business endpoints (`cfg.resilienceAuthProbePath` or auto-detected `/v1/session`, `/v1/education/courses` before `/healthz` fallback) through ephemeral Toxiproxy containers with latency and `reset_peer` toxics; run authenticated Playwright `503`/abort route fault injection and verify clean recovery. Always clean up ephemeral proxies in `finally`.
- **Pass Criteria**: Bounded timeouts without process crash; clean recovery after fault removal.

### 2.8 `ai` (Promptfoo + Built-in Declarative SSE Provider + Langfuse)
- **Entry Condition**: Reachable `--ai-url`, `--ai-provider`, or `cfg.aiProviderType` (`sse-thread-turns` / `http-json`) AND `maxAiCalls > 0`.
- **Actions**: Evaluate groundedness, Unicode-normalized multilingual (EN/VI, handling `U+2019` curly apostrophes) prompt-injection refusal, optional `llm-rubric`, and custom `cfg.aiTests` within `maxAiCalls` and configurable `--ai-timeout-ms` (`90000`ms default); key findings by stable `testIdx` and exit `3` (`DEGRADED_TIMEOUT`) on reproducer timeout instead of false `exit 1`.
- **Pass Criteria**: Schema-valid responses and verified refusal of system-prompt/PII exfiltration.

### 2.9 `outcome_verification` (`scripts/verify-outcomes.mjs`)
- **Entry Condition**: Any active API, Mailpit, Postgres, Redis, Langfuse, or Docker log channel.
- **Actions**: Attach `X-Request-Id` to probes, verify JSON integrity, match expected Mailpit messages, query Postgres/Redis state via `scripts/python-env.mjs`, check Langfuse health, and scan container logs.
- **Pass Criteria**: Observed downstream state matches API responses without silent drops or unhandled exceptions.

## 3. `skipped_non_applicable` Rules

A runner or mode MUST emit `status: "skipped_non_applicable"` (rather than failing or fabricating results) when:
- `--max-ai-calls 0` is set, or `--ai-url` is omitted/unreachable/timing out for `ai` mode.
- No OpenAPI schema (`404`) and no static route catalog exist for schema-driven fuzzing.
- Only one role/tenant is configured and no unauthenticated/cross-tenant endpoint exists for `authorization` checks.
- Docker daemon or optional DB/Redis/Mailpit channels are not configured for the target environment.

## 4. Defect Classification Rubric

| Classification | Definition | Examples |
| --- | --- | --- |
| `confirmed_bug` | Reproducible violation of correctness, security, data integrity, or availability | Unhandled HTTP `500`, malformed JSON on HTTP `200`, cross-tenant `200` IDOR leak, API `201` with missing Mailpit/DB outcome, double-submit race creating duplicates |
| `spec_gap` | Missing, incomplete, or inconsistent specification/contract without functional crash | `/openapi.json` returning `404`, undocumented error shape, missing idempotency contract documentation |
| `runtime_degraded` | Unreachable or timing-out optional local service or dependency | AI service port timing out, stopped RQ worker, unreachable optional Langfuse instance |

## 5. Regression Test Promotion

1. Every newly confirmed defect (or reproducible finding) discovered in `execute` or `verify` is assigned a monotonic ID (`QA-001`, `QA-002`, ...) and deduplicated by `classification|endpointOrRoute`.
2. Phase `reproduce` emits an executable script into `memory/regressions/` (`.mjs`, `.py`, or `.spec.ts`) accepting `--target-url` / `--api-url` and exiting non-zero when the bug reproduces.
3. Every generated script must pass syntax verification (`node --check` or `python -m py_compile`) before being recorded in `memory/findings-ledger.json`.
