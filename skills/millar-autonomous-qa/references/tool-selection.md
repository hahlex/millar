# Tool Selection and Non-Redundancy Architecture (R1)

Nine candidate QA tools were evaluated for the `millar-autonomous-qa` Millar skill: seven were selected (`Playwright`, `Chrome DevTools MCP`, `Schemathesis`, `Hypothesis`, `k6`, `Toxiproxy`, and `Promptfoo`) and two were skipped (`Agentic Test Explorer` and `RESTler`) to eliminate functional overlap, unnecessary language runtimes, and duplicate LLM API billing. All selected tools run in strict isolation without polluting global user packages or target application repositories: Node dependencies live inside the skill directory's `node_modules` (reusing system Chrome `158.0.8127.88` and existing `%LOCALAPPDATA%\ms-playwright` binaries via `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`), Python QA libraries live in an external `uv`-managed virtual environment at `%LOCALAPPDATA%\millar-autonomous-qa\venv` (`Python 3.11.9`, resolved via `scripts/python-env.mjs`) so `scripts/check-em-dash.mjs` never scans third-party `site-packages`, and heavy binary services (`k6`, `Toxiproxy`) execute in ephemeral Docker `--rm` containers.

## 1. Evaluation Matrix of All 9 R1 Candidate Tools

| Tool | Category | Decision | Installed / Verified Version | Environment / Isolation | Primary Responsibility |
| --- | --- | --- | --- | --- | --- |
| `Agentic Test Explorer` (`srbarrios/agentic-test-explorer`) | AI Browser Swarm | **Skipped** | `N/A (not installed)` | None | Redundant LangGraph+Playwright supervisor duplicating the host skill loop |
| `Playwright CLI / MCP` (`playwright`, `@playwright/test`) | Browser & HTTP Automation | **Selected** | `1.65.1` (`channel: "chrome"` -> `158.0.8127.88`) | Project-local `node_modules` + system Chrome / `%LOCALAPPDATA%\ms-playwright` | UI exploration, multi-role/tenant `browser.newContext()`, `APIRequestContext`, traces, regression spec generation |
| `Chrome DevTools MCP` (`chrome-devtools-mcp`) | Deep Browser Diagnostics | **Selected** | `1.14.0` | Project-local `node_modules` (on-demand stdio MCP / `chrome-devtools` CLI) | CDP console/network capture, performance traces (LCP/INP/CLS), Lighthouse audits, heap snapshots |
| `Schemathesis` (`schemathesis`) | OpenAPI Property & Stateful Fuzzer | **Selected** | `4.34.2` | Isolated `uv` venv at `%LOCALAPPDATA%\millar-autonomous-qa\venv` (`Python 3.11.9`) | OpenAPI schema-driven negative fuzzing, stateful link chaining, 5xx and contract violation detection |
| `RESTler` (`microsoft/restler-fuzzer`) | Stateful REST Fuzzer | **Skipped** | `N/A (not installed)` | None (requires `.NET 8` SDK, not installed) | Redundant OpenAPI stateful REST fuzzer covered by Schemathesis |
| `Hypothesis` (`hypothesis` + `pytest` + `httpx` + `psycopg[binary]` + `redis`) | Property & State Machine Testing | **Selected** | `hypothesis 6.170.17` / `pytest 9.2.0` / `httpx 0.29.0` / `psycopg 3.3.9` / `redis 8.2.0` | Isolated `uv` venv at `%LOCALAPPDATA%\millar-autonomous-qa\venv` (`Python 3.11.9`) | Custom `RuleBasedStateMachine` workflows, cross-role/tenant RBAC & IDOR matrices, domain invariants, DB/API outcome checks |
| `k6` (`grafana/k6:latest`) | Concurrency & Load Runner | **Selected** | `k6 v2.4.0 (commit/dd9395906d, go1.27.3, linux/amd64)` | Docker (`--rm --add-host=host.docker.internal:host-gateway`) | Synchronized VU bursts, double-submit/race-condition detection, p95/p99 latency thresholds |
| `Toxiproxy` (`ghcr.io/shopify/toxiproxy:latest`) | Backend TCP Fault Proxy | **Selected** | `toxiproxy-server version 2.13.0` | Docker (`--rm`, HTTP control API `:8474`) | Backend dependency TCP fault injection (latency, timeout, reset, bandwidth) complementing Playwright `page.route()` |
| `Promptfoo` (`promptfoo`) | LLM Eval & AI Red-Teaming | **Selected** | `0.126.0` | Project-local `node_modules` | AI/LLM endpoint evaluation, JSON/citation assertions, prompt-injection & PII red-teaming |

## 2. Explicit Non-Redundancy Rationale (Why 7 Selected, 2 Skipped)

- **`Agentic Test Explorer` -> Skipped (covered by Playwright + `autonomous-qa` Skill Loop)**:
  - **Overlap**: Both drive Playwright browser sessions from persona-oriented plans and emit repeatable regression scripts.
  - **Why skipped**: Installing a third-party LangGraph supervisor duplicates the host agent's continuous reasoning loop (`discover -> plan -> execute -> observe -> verify -> reproduce -> report -> explore further`), adds a separate Python browser wrapper alongside Node Playwright, and introduces redundant LLM API token costs.
- **`RESTler` -> Skipped (covered by Schemathesis)**:
  - **Overlap**: Both compile OpenAPI specifications to fuzz negative inputs and chain stateful `POST -> GET -> PATCH -> DELETE` API calls.
  - **Why skipped**: `Schemathesis` runs natively inside the isolated `uv` Python virtual environment, integrates directly with `pytest` and `Hypothesis`, requires zero compilation step, and avoids requiring the missing `.NET 8` SDK.
- **Why `Playwright` and `Chrome DevTools MCP` are complementary (not redundant)**:
  - `Playwright` owns deterministic multi-context browser automation, `storageState` auth isolation across roles and tenants, `APIRequestContext`, `page.route()` client fault injection, and trace/regression exports.
  - `Chrome DevTools MCP` owns deep Chrome DevTools Protocol diagnostics (`performance_start_trace`, `lighthouse_audit`, `take_heapsnapshot`, raw CDP network/console inspection) invoked on-demand without duplicating Playwright's core test runner.
- **Why `Schemathesis` and `Hypothesis` are complementary (not redundant)**:
  - `Schemathesis` automatically derives property, negative, and stateful link tests from the target's OpenAPI schema.
  - `Hypothesis` (`RuleBasedStateMachine`) encodes domain-specific invariants, cross-role/cross-tenant RBAC and IDOR authorization matrices, and direct Postgres/Redis outcome consistency checks that OpenAPI specifications do not express.
- **Why `Toxiproxy` and `Playwright page.route()` are complementary**:
  - `Toxiproxy` injects TCP-level faults (latency, connection reset, bandwidth limits, timeouts) between backend services and infrastructure dependencies (`Postgres`, `Redis`, `Keycloak`, HTTP upstreams).
  - `Playwright page.route()` injects client/browser-level HTTP faults (`503`, offline, aborted or throttled responses) inside frontend user flows.

## 3. R4 Testing-Mode to Tool Mapping

| R4 Mode / Capability | Primary Tool | Supporting Tool / Channel | Outcome Verification |
| --- | --- | --- | --- |
| `exploratory` (UI & multi-role/tenant exploration) | `Playwright` (`browser.newContext()`) | `Chrome DevTools MCP` (CDP diagnostics) | Rendered DOM assertions, console/network zero-error checks, saved Playwright traces |
| `http-crud` (`GET/POST/PUT/PATCH/DELETE` execution) | `Playwright` (`APIRequestContext`) | `httpx` (Python) | HTTP status/schema checks paired with DB/cache state verification |
| `stateful` (multi-step lifecycle workflows) | `Schemathesis` (`--stateful=links` / `as_state_machine()`) | `Hypothesis` (`RuleBasedStateMachine`) | Cross-step resource ID consistency and persisted entity state |
| `property-based` (invariants & minimal counterexamples) | `Hypothesis` | `Schemathesis` | Mathematical/domain invariants and shrunk minimal failing examples |
| `negative` (malformed/boundary/error paths) | `Schemathesis` (API fuzzing) | `Playwright` (UI form validation) | Explicit 4xx validation responses, zero unhandled 5xx responses |
| `authorization` (RBAC, cross-tenant isolation, IDOR) | `Hypothesis` (token-replay matrix) | `Playwright` (multi-context sessions) | Strict 401/403/404 isolation across roles and tenant boundaries |
| `concurrency` (race conditions, double-submit, load) | `k6` (Docker `grafana/k6:latest`) | `psycopg` Postgres duplicate/state queries | Uniqueness/idempotency invariants, p95/p99 latency thresholds |
| `resilience` (fault injection & degradation) | `Toxiproxy` (Docker `ghcr.io/shopify/toxiproxy:latest`) | `Playwright` (`page.route()` client faults) | Graceful degradation, bounded retries, recovery after toxic removal |
| `ai-feature` (LLM accuracy, schema, prompt-injection red-team) | `Promptfoo` | Langfuse (`:3400`) trace correlation | JSON/citation assertions, injection resistance, or explicit `skipped_non_applicable` if AI backend is offline |
| `outcome-verification` (beyond HTTP 200) | `psycopg` (`education_db :5432`, `ai_db :5433`) + `redis` (`:6379`, `:6380`) | Mailpit API (`:8025`), Docker logs, Langfuse (`:3400`) | Direct database row, cache key, email delivery, and background log correlation |

## 4. Environment Isolation & Windows Runtime Notes

- **Node Workspace (`d:\projects\millar\staging\autonomous-qa\`)**:
  - Isolated private ESM package (`"private": true`, `"type": "module"`, `"engines": { "node": ">=22.22.0" }`), outside root `pnpm-workspace.yaml` (`packages/*`, `apps/*`) and root `vitest.config.ts`.
  - Installed with `$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="1"` and `$env:PUPPETEER_SKIP_DOWNLOAD="true"` (without running `npx playwright install`). Runners launch Playwright with `{ channel: "chrome" }` (system Chrome `158.0.8127.88`) to avoid downloading duplicate `chromium-1255` binaries into `%LOCALAPPDATA%\ms-playwright`.
- **External Python `uv` Virtualenv (`%LOCALAPPDATA%\millar-autonomous-qa\venv`)**:
  - Millar's `d:\projects\millar\scripts\check-em-dash.mjs` scans workspace subdirectories for `U+2014` and does not include `.venv` in `IGNORE_DIRS`. Keeping the `uv` virtual environment outside `d:\projects\millar` at `%LOCALAPPDATA%\millar-autonomous-qa\venv` (`UV_PROJECT_ENVIRONMENT`), alongside `[tool.uv] package = false` and `[tool.pytest.ini_options] cache_dir = "test-results/.pytest_cache"` in `pyproject.toml`, ensures third-party `site-packages` and pytest caches never trip monorepo governance checks while keeping `.gitignore` clean.
  - `scripts/python-env.mjs` resolves the interpreter and tool executables deterministically from `AUTONOMOUS_QA_VENV`, `UV_PROJECT_ENVIRONMENT`, or `%LOCALAPPDATA%\millar-autonomous-qa\venv`, exposing `getVenvDir()`, `getScriptsDir()`, `getPythonBin()`, `getToolBin(name)`, and `getEnvSummary()`.
- **Docker Ephemeral Containers & Host Networking on Windows**:
  - Both `grafana/k6:latest` and `ghcr.io/shopify/toxiproxy:latest` are executed with `--rm` so no orphan containers persist after runs.
  - When targeting services on the Windows host from inside Docker, pass `--add-host=host.docker.internal:host-gateway` (`192.168.65.254`). Because Vite (`http://localhost:5173`) enforces `server.allowedHosts` and returns `403 Forbidden` for `Host: host.docker.internal:5173`, container requests targeting the Vite dev server directly must explicitly pass `Host: localhost:5173`.
- **`chrome-devtools-mcp` Stdio Behavior**:
  - Invoking `chrome-devtools-mcp` without `--help` or `--version` blocks indefinitely waiting on stdin. Automated health checks and runner invocations must supply piped JSON-RPC messages followed by stdin EOF (for example with `--headless --isolated --no-usage-statistics --no-performance-crux`) or invoke `--help`.

## 5. Exact M1 Smoke Verification Log

All checks below were executed after final M1 edits on `2026-11-26T18:31Z` on Windows (`Node v26.13.0`, `npm 11.20.0`, `uv 0.9.18`, `Python 3.11.9`, `Docker 29.4.0`):

| Tool / Gate | Verification Command | Exit Code | Observed Output / Recorded Version | Timestamp (UTC) |
| --- | --- | --- | --- | --- |
| `Playwright CLI` | `d:\projects\millar\staging\autonomous-qa\node_modules\.bin\playwright.cmd --version` | `0` | `Version 1.65.1` | `2026-11-26T18:31Z` |
| `Playwright Chrome Launch` | `node -e "import('file:///d:/projects/millar/staging/autonomous-qa/node_modules/playwright/index.mjs').then(async ({ chromium }) => { const b = await chromium.launch({ channel: 'chrome', headless: true }); console.log('chrome_version=' + b.version()); await b.close(); })"` | `0` | `chrome_version=158.0.8127.88` | `2026-11-26T18:31Z` |
| `Chrome DevTools MCP (--help)` | `d:\projects\millar\staging\autonomous-qa\node_modules\.bin\chrome-devtools-mcp.cmd --help` | `0` | Printed CLI options (`--categoryInput`, `--categoryPerformance`, `--headless`, `--isolated`, etc.) | `2026-11-26T18:31Z` |
| `Chrome DevTools MCP (MCP JSON-RPC)` | `'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"m1-smoke","version":"0.1.0"}}}' \| d:\projects\millar\staging\autonomous-qa\node_modules\.bin\chrome-devtools-mcp.cmd --headless --isolated --no-usage-statistics --no-performance-crux` | `0` | `serverInfo: {"name":"chrome_devtools","title":"Chrome DevTools MCP server","version":"1.14.0"}` | `2026-11-26T18:31Z` |
| `Promptfoo` | `d:\projects\millar\staging\autonomous-qa\node_modules\.bin\promptfoo.cmd --version` | `0` | `0.126.0` | `2026-11-26T18:31Z` |
| `Schemathesis` | `"$env:LOCALAPPDATA\millar-autonomous-qa\venv\Scripts\schemathesis.exe" --version` | `0` | `schemathesis, version 4.34.2` | `2026-11-26T18:31Z` |
| `Hypothesis + Python Stack` | `"$env:LOCALAPPDATA\millar-autonomous-qa\venv\Scripts\python.exe" -c "import hypothesis, httpx, psycopg, redis, pytest; print(hypothesis.__version__, httpx.__version__, psycopg.__version__, redis.__version__, pytest.__version__)"` | `0` | `6.170.17 0.29.0 3.3.9 8.2.0 9.2.0` | `2026-11-26T18:31Z` |
| `k6` (Docker) | `docker run --rm grafana/k6:latest version` | `0` | `k6 v2.4.0 (commit/dd9395906d, go1.27.3, linux/amd64)` | `2026-11-26T18:31Z` |
| `Toxiproxy` (Docker) | `docker run --rm ghcr.io/shopify/toxiproxy:latest --help` and `-version` | `0` | `Usage of /toxiproxy:` and `toxiproxy-server version 2.13.0` | `2026-11-26T18:31Z` |
| `python-env.mjs` | `node d:\projects\millar\staging\autonomous-qa\scripts\python-env.mjs` | `0` | JSON `{ venvDir, scriptsDir, pythonBin, exists: true, tools: { schemathesis, pytest } }` | `2026-11-26T18:31Z` |
| `check-em-dash.mjs` | `node d:\projects\millar\scripts\check-em-dash.mjs` | `0` | `PASS: Zero U+2014 em-dash across 194 Hahlex-controlled files.` | `2026-11-26T18:31Z` |
| `Millar Monorepo Verify` | `pnpm --dir d:\projects\millar run verify` | `0` | `check:em-dash` PASS, `check:governance` PASS, `typecheck` PASS, `vitest` PASS (`5` files, `28` tests) | `2026-11-26T18:31Z` |