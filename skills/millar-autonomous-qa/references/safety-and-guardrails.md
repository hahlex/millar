# Safety, Non-Production Verification, Isolation, and Guardrails

This reference defines the mandatory pre-flight safety checks, budget caps, CWD and cache isolation rules, isolated test data conventions, and cleanup scope enforced by `millar-autonomous-qa`.

## 1. Pre-Flight Non-Production Verification (`scripts/safety-guard.mjs`)

`scripts/safety-guard.mjs` MUST run and exit `0` before any active QA traffic is sent:

1. **URL Allowlist & Blocklist**:
   - Every URL (`--target-url`, `--api-url`, `--ai-url`, `--mailpit-url`, `--langfuse-url`, `--oidc-url`, `--openapi-url`) must parse cleanly as `http:` or `https:`.
   - Loopback hosts (`localhost`, `*.localhost`, `127.0.0.1`, `127.*.*.*`, `::1`, `[::1]`) are allowed by default.
   - Any hostname matching production patterns (`hahlex.com`, `*.hahlex.com`, `*.prod.*`, `*.production.*`, `*-prod.*`, `production.local`), any public IPv4 (for example `8.8.8.8`), or any external domain is rejected immediately with **exit code `2`**.
   - Private RFC1918 LAN IPv4 addresses (`10.*`, `192.168.*`, `172.16-31.*`) are rejected unless `--allow-private-ip` is explicitly provided AND no production marker is present.
2. **Environment Variable Inspection**:
   - Process environment variables `NODE_ENV`, `APP_ENV`, `ENVIRONMENT`, `RAILS_ENV`, and `NEXT_PUBLIC_ENV` are inspected; values `prod` or `production` trigger **exit code `2`** even when URLs point to `localhost`.
   - Optional `--env-file <path>` inspection verifies that `DATABASE_URL`, `REDIS_URL`, and `KEYCLOAK_ISSUER` point to local non-production hosts without printing credentials to stdout.

## 2. Runtime, Request, AI-Call, and Cost Budgets (`memory/run-budget.json`)

Every run tracks consumption atomically in `memory/run-budget.json`:
- `startTime`: ISO-8601 run start timestamp
- `maxMinutes`: Maximum wall-clock duration (default `30`)
- `maxRequests`: Maximum HTTP probes/requests across discovery, runners, and verification (default `500`)
- `maxAiCalls`: Maximum LLM/AI endpoint calls (default `20`; `0` skips AI mode cleanly)
- `requestsUsed`: Monotonic counter preserved across calls unless `--reset-budget` is passed
- `aiCallsUsed`: Monotonic AI call counter preserved unless `--reset-budget` is passed

When `requestsUsed >= maxRequests`, `aiCallsUsed >= maxAiCalls` (unless `--ignore-ai-cap`), or `elapsedMinutes > maxMinutes` (`maxMinutes === 0`), `scripts/safety-guard.mjs` returns **exit code `3`** and `scripts/run-qa-loop.mjs` halts before sending additional target requests.

## 3. CWD and Tool Cache Isolation

To keep target repositories 100% unmodified:
- Always set `cwd` to the `millar-autonomous-qa` skill directory (for example `skills/millar-autonomous-qa` or `~/.agents/skills/millar-autonomous-qa`) or an isolated temporary directory, NEVER inside a target application repository.
- Child Python, Hypothesis, pytest, and Promptfoo executions inherit:
  - `HYPOTHESIS_STORAGE_DIRECTORY=<skill-root>/test-results/.hypothesis`
  - `PROMPTFOO_CONFIG_DIR=<skill-root>/test-results/.promptfoo`
  - `PYTEST_CACHE_DIR=<skill-root>/test-results/.pytest_cache`
- Never install Python dependencies inside `d:\projects\millar`; keep the `uv` virtualenv at `%LOCALAPPDATA%\millar-autonomous-qa\venv` (resolved via `scripts/python-env.mjs`) so `scripts/check-em-dash.mjs` never scans third-party `site-packages`.

## 4. Isolated Test Accounts and Read-Only Target Integrity

- Use only explicit non-production seeded accounts (for example `.local` test users) or ephemeral `qa-` prefixed records created in the non-production environment.
- Never mutate target application source code, git working trees, or design-system documents.
- Redact `Bearer` tokens, database passwords, and API secrets via `redactSecrets()` before writing any trace, ledger, or HTML report.

## 5. Cleanup Rules (`scripts/cleanup.mjs`)

`scripts/cleanup.mjs` is idempotent and supports `--dry-run` and `--verify-clean-repos`:
- **Removes**: `.tmp/`, `memory/artifacts/`, `test-results/`, `.promptfoo/`, staging `qa-temp-*` / `*.tmp.*` files, and `%LOCALAPPDATA%\millar-autonomous-qa\tmp\`.
- **Preserves**: `memory/schema.json`, `memory/coverage-ledger.json`, `memory/findings-ledger.json`, `memory/run-budget.json`, `memory/regressions/`, `memory/traces/`, `reports/`, `SKILL.md`, `references/`, `scripts/`, `e2e-suite/`, `package.json`, `pyproject.toml`, `.gitignore`, `%LOCALAPPDATA%\millar-autonomous-qa\venv`, and any files outside the staging directory.
- **Read-Only Repo Verification**: When `--repo-path` or `--verify-clean-repos` is supplied, runs read-only `git -C <repo> status --porcelain` without modifying target repositories.
