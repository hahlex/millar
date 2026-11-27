# Minimal-Diff Remediation & Real-Seam Regression Testing

Prevent bug-fix PRs from turning into refactor avalanches while guaranteeing fixed defects stay dead forever.

## 1. Minimal-Change Discipline

When remediating a diagnosed defect or security/performance finding:
- **Touch strictly the files required** to fix the root cause and lock its regression test.
- **Prefer three clear local lines** over introducing a speculative helper or abstraction across unrelated modules.
- **Never reformat unrelated lines, rename untouched symbols, or "clean up" adjacent code** in the same diff; keep `git diff --stat` tight so reviewers can verify correctness in seconds.
- **Run diff-scoped hardening** before committing:
  ```bash
  node <skill-dir>/scripts/millar-harden-scan.mjs . --diff-base=HEAD
  ```

## 2. Choosing the Real Seam for Your Regression Test

A regression test earns its keep ONLY when it crosses the **real seam** where callers experience the bug (deep-module discipline):
- **Too shallow (false confidence):** Mocking the exact validation function or middleware that contained the bug so the test passes even if the route never invokes it.
- **Too brittle:** Asserting internal private helpers, CSS class strings, or exact mock call counts that break on harmless refactors.
- **Right seam:**
  - *Validation / regex bug* (e.g., `422 PATTERN_MISMATCH` on custom role filter): exercise the HTTP route or request schema parser end-to-end with a real `custom_role_123` input.
  - *Auth / BOLA / tenant leak*: exercise the route handler or repository query with Token B requesting Tenant A's entity ID and assert `403`/`404`.
  - *Race / idempotency bug*: fire concurrent `Promise.all` requests sharing an `Idempotency-Key` and assert at most one persisted row.
  - *UI state / occlusion / focus bug*: drive the rendered component or Playwright page via accessible roles/labels and assert visible DOM + focus state.

## 3. When No Clean Seam Exists

If the codebase couples external I/O, global state, and business logic so tightly that a deterministic regression test cannot reach the bug without brittle hacks:
1. **Report the missing seam explicitly** as a structural finding rather than writing a deceptive test.
2. Introduce **one minimal dependency-injection seam** (accept the dependency as an optional parameter with the production default) only when needed to make the bug testable through its real interface.
