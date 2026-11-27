# Multi-Channel Outcome Verification Guide

Autonomous QA never stops at HTTP status codes. `scripts/verify-outcomes.mjs` verifies real business and system outcomes across six observability channels using correlation IDs (`X-Request-Id`) and strict timeouts.

## 1. Correlation Architecture (`X-Request-Id`)

1. Generate a deterministic or run-scoped correlation token (for example `qa-corr-<runId>`).
2. Attach `X-Request-Id: <id>` to active API mutations or probes.
3. Pass `--request-id <id>` (and optional `--expect-mailpit-marker <marker>`) to `scripts/verify-outcomes.mjs` to correlate API responses with Mailpit emails, database rows, Redis/RQ queues, container logs, and Langfuse traces.

## 2. Channel Specifications

### 2.1 API & Payload Integrity Channel
- Probes `--probe-endpoint` (or `/healthz` and `/readyz` on `--api-url`) plus optional `--api-check-url`.
- Verifies HTTP status `< 500` and checks that responses advertising `Content-Type: application/json` parse cleanly via `JSON.parse()`.
- An HTTP `200` with malformed JSON or an HTTP `>= 500` is recorded immediately as a `confirmed_bug` with a saved trace in `memory/traces/`.

### 2.2 Mailpit Email Channel (`--mailpit-url`)
- Queries `GET ${mailpitUrl}/api/v1/messages` with a bounded timeout.
- Safely handles empty inboxes (`{ total: 0, messages: [] }`) without null-dereference errors.
- Searches `ID`, `MessageID`, `Subject`, `Snippet`, and `To[].Address` for `--expect-mailpit-marker` or `--request-id`.
- If `--expect-mailpit-marker` is expected (for example after an action that claims to send email) and zero messages match, records a `confirmed_bug` finding (silent downstream drop).

### 2.3 Postgres Channel (`--pg-dsn` / `config.pgDsnEnv`)
- Because `package.json` omits `pg`, `verify-outcomes.mjs` delegates database queries to `getPythonBin()` from `scripts/python-env.mjs` using `psycopg 3.3.9`.
- Passes DSNs via the `QA_PG_DSN` child environment variable (`connect_timeout=3`), never via CLI arguments or log files.
- Executes `SELECT 1 AS ok` or an explicit read-only `--pg-query` check against `education_db` (`:5432`) or `ai_db` (`:5433`).
- If unconfigured or unreachable, marks the channel `degraded` or `skipped` without crashing the verifier.

### 2.4 Redis & RQ Queue Channel (`--redis-url` / `config.redisUrlEnv`)
- Delegates Redis verification to `getPythonBin()` using `redis 8.2.0` (`socket_timeout=3`) via `QA_REDIS_URL`.
- Executes `PING` and inspects `rq:queue:*` key lengths (`LLEN`) to verify queue health and detect stuck background jobs.

### 2.5 Langfuse Channel (`--langfuse-url`)
- Probes `GET ${langfuseUrl}/api/public/health` (expecting `{"status":"OK"}`).
- Unreachable Langfuse instances mark only the Langfuse channel `degraded`, allowing remaining checks to finish cleanly.

### 2.6 Docker Container Logs Channel (`--docker-containers`)
- Invokes `docker logs --since 5m --tail 100 <container>` via `execFile` with a bounded timeout.
- Scans for `X-Request-Id` correlation hits and flags `UnhandledPromiseRejection`, Python `Traceback`, or `FATAL:` errors as `confirmed_bug` findings.

## 3. Graceful Degradation & Output Contract

- Every run of `scripts/verify-outcomes.mjs` writes a sanitized, secret-redacted diagnostic trace to `memory/traces/verify-outcomes-<timestamp>.json`.
- Emits Contract 2 JSON (`tool: "verify-outcomes"`, `mode: "outcome_verification"`) with unique sequential finding IDs (`QA-VER-001`, ...) and accurate `budgetConsumed.requests`.
- Returns `status: "failed"` when a `confirmed_bug` is found, `"degraded"` when an optional channel is unreachable, and `"passed"` when all checked channels succeed.
