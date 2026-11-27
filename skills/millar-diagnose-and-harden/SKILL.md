---
name: millar-diagnose-and-harden
description: "White-box root-cause diagnosis, OWASP Web/API/Agentic security hardening, performance/waterfall profiling, and minimal-diff remediation skill (v0.1.0). Ships two Zero-MCP Node CLIs (scripts/millar-harden-scan.mjs and scripts/triage-repro-loop.mjs). Use when debugging hard bugs or flaky tests, remediating millar-autonomous-qa findings/reproducers, auditing OWASP security (secrets, CORS, CSP, cookies, SQLi, SSRF, BOLA/IDOR), diagnosing slow endpoints/LCP/INP/N+1 queries, or hardening a pull request before ship."
version: 0.1.0-draft.1
license: MIT
---

# Millar Diagnose & Harden: Root-Cause Repair, OWASP Security & Performance Hardening

Close the gap between finding a failure and shipping a verified, minimal-diff fix. Never guess at symptoms, never patch without a **red-capable** feedback loop, and never ship unverified AI-generated code carrying OWASP vulnerabilities, async waterfalls, or leftover debug code.

## Non-Negotiable Ground Rules

1. **Red Loop Before Hypotheses:** Construct and run one fast, deterministic command that goes **red** on the exact reported failure before reading code to theorize. If starting from `millar-autonomous-qa`, import `memory/findings-ledger.json` directly via `scripts/triage-repro-loop.mjs`.
2. **Evidence Over Opinion:** Run `scripts/millar-harden-scan.mjs` (static SAST/perf + live `--url` security header/CORS check) and measure timings (`p95`, `EXPLAIN ANALYZE`, LoAF/traces) before proposing fixes.
3. **Surgical Minimal Diffs:** Fix the diagnosed root cause at the real module seam. Leave unrelated working code untouched and prefer three clear local lines over speculative abstractions.
4. **Redact Everything:** Keep tokens, DSNs, and passwords in environment variables only. Never paste raw secrets into traces, reproducers, or reports, and keep all authored output free of `U+2014` em-dashes.

## Branch Routing (Load Only What This Task Needs)

- **Hard bug, test flake, or `millar-autonomous-qa` defect remediation:** Read [references/root-cause-protocol.md](references/root-cause-protocol.md).
- **Security review, OWASP API/Web audit, CORS/CSP/cookie/BOLA hardening:** Read [references/owasp-security-hardening.md](references/owasp-security-hardening.md).
- **Slow page, INP/LCP/bundle spike, async waterfall, or N+1 DB regression:** Read [references/performance-and-waterfall-diagnosis.md](references/performance-and-waterfall-diagnosis.md).
- **Regression test placement, module seam design, or PR blast-radius check:** Read [references/minimal-diff-and-seam-testing.md](references/minimal-diff-and-seam-testing.md).

## Execution Sequence

### Step 1: Establish a Tight Red Signal or Baseline Scan

Execute the matching deterministic CLI from this skill directory (zero npm dependencies, works with zero MCP):

- **From a `millar-autonomous-qa` run:**
  ```bash
  node <skill-dir>/scripts/triage-repro-loop.mjs --from-qa-ledger <path/to/findings-ledger.json> --out-plan .millar/remediation-plan.md
  ```
- **From a bug, regression, or flake:**
  ```bash
  node <skill-dir>/scripts/triage-repro-loop.mjs --cmd "<reproducer-or-test-command>" --runs=3 --expect=red
  ```
- **From a security, performance, or pre-ship PR hardening pass:**
  ```bash
  node <skill-dir>/scripts/millar-harden-scan.mjs <target-dir> [--diff-base=HEAD~1] [--url=http://127.0.0.1:3200] [--json]
  ```

**Completion criterion:** One concrete red-capable reproducer command has been executed and observed failing, OR `millar-harden-scan.mjs` has produced a prioritized baseline inventory of security/performance findings.

### Step 2: Minimize & Generate 3-5 Ranked Falsifiable Hypotheses

1. **Minimize the reproducer:** Remove inputs, steps, or headers one at a time until every remaining element is load-bearing for the failure.
2. **Rank 3-5 falsifiable hypotheses** before editing code. Every hypothesis states a testable prediction: *"If X is the cause, then observing/changing Y will produce Z."*
3. **Instrument cleanly (one variable at a time):**
   - For functional bugs, prefer debugger/targeted boundary logs prefixed with `[DEBUG-<tag>]` so cleanup is a single `rg` check.
   - For performance regressions, measure baseline first (timing harness, Chrome DevTools trace, LoAF, SQL `EXPLAIN ANALYZE`, bundle stats) before optimizing.

**Completion criterion:** Root-cause mechanism proven by direct observation (not intuition), ruling out competing hypotheses.

### Step 3: Lock the Real-Seam Regression Test & Apply a Minimal-Diff Fix

1. **Write the failing regression test first** at the **real seam** where the bug occurs (API contract, auth middleware, state reducer, DB query, or Playwright UI interaction). If no testable seam exists, surface that architectural gap explicitly before patching.
2. **Watch the new test go red** on the unpatched code.
3. **Apply the smallest clean fix** addressing the root cause directly (harden input validation, tenant/campus ownership checks, CORS/CSP/cookie flags, `Promise.all` parallelization, or missing timeouts).
4. **Watch the new test go green**, then re-run the original un-minimized reproducer via `triage-repro-loop.mjs --expect=green`.

**Completion criterion:** Regression test failed before the patch and passes after; original reproducer passes deterministically (`0/N` red).

### Step 4: Clean Up & Run the Ship Hardening Gate

Before declaring done:
1. Run `node <skill-dir>/scripts/millar-harden-scan.mjs <target-dir> --diff-base=HEAD` (or target directory) -> assert **0 blocking errors** (zero hardcoded secrets, zero `[DEBUG-...]` leftovers, zero SQL/command/HTML injection sinks, zero CORS wildcard+credentials bugs).
2. Run project `typecheck`, unit/integration tests, and production `build`.
3. Hand UI changes to `millar-verify-web` (`scripts/millar-audit.mjs`) or live full-stack verification to `millar-autonomous-qa` when applicable.
4. Record the proven root cause concisely in the commit/PR summary so future engineers inherit the lesson.

**Completion criterion:** Original reproducer green, regression test passing, `millar-harden-scan.mjs` clean (`0` errors), zero `[DEBUG-...]` leftovers, and build/tests green.
