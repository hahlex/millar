# Root-Cause Diagnosis & Remediation Protocol

Stop symptom patching by executing this 6-phase scientific loop whenever fixing a hard bug, test flake, production incident, or `millar-autonomous-qa` confirmed defect.

## Phase 1: Build a Tight Red-Capable Feedback Loop

A **tight** loop is fast (seconds, not minutes), deterministic, agent-runnable, and **red-capable** (fails on this exact symptom and passes once fixed).

Preferred construction ladder (stop at the lightest level that genuinely reproduces the failure):
1. Existing failing unit/integration test or generated `millar-autonomous-qa` reproducer (`memory/regressions/*.mjs|*.py`).
2. Focused HTTP/CLI reproduction script hitting the local dev server with env-backed credentials.
3. Headless Playwright script asserting the exact DOM/console/network failure.
4. Captured trace replay or minimal throwaway harness isolating the offending module.
5. Automated `git bisect run` harness when the bug is a regression between two known commits.

Verify determinism with `scripts/triage-repro-loop.mjs`:
```bash
node <skill-dir>/scripts/triage-repro-loop.mjs --cmd "<loop-command>" --runs=3 --expect=red
```
For flaky or race bugs, increase `--runs=10` or parallelize trigger calls until reproduction rate is high enough (`>= 30-50%`) to debug reliably.

## Phase 2: Reproduce & Minimize

Once the loop goes red:
1. Verify the failure matches the exact reported symptom (not a nearby setup error).
2. Remove inputs, headers, steps, and fixtures one by one, re-running after each cut until every remaining element is load-bearing.
3. Save the minimal trigger: it shrinks the hypothesis space and becomes the blueprint for the permanent regression test.

## Phase 3: Generate 3-5 Ranked Falsifiable Hypotheses

Never anchor on the first plausible explanation. Write 3-5 ranked hypotheses, each with a falsifiable prediction:
- *Format:* "If `[mechanism X]` is the cause, then `[observing/changing Y]` will produce `[outcome Z]`."
- Discard any hypothesis that cannot state an observable prediction.

## Phase 4: Instrument One Variable at a Time

- Prefer interactive debugger/REPL inspection or targeted boundary assertions over blanket logging.
- Tag every temporary diagnostic log with a unique marker (`[DEBUG-7f2a]`) so `millar-harden-scan.mjs` and `rg` guarantee zero debug leftovers survive into the commit.
- For performance regressions, switch to baseline measurement first (timing loop, LoAF, Chrome DevTools trace, SQL `EXPLAIN ANALYZE`) instead of guessing from code.

## Phase 5: Real-Seam Regression Test & Minimal-Diff Fix

1. Locate the **real seam** where the failure occurs (e.g., validation regex, RBAC middleware, transaction boundary, UI state hook).
2. Turn the minimized reproducer into a permanent failing test at that seam and run it to confirm red.
3. Apply the smallest surgical code fix addressing the proven root cause.
4. Confirm the new regression test turns green, then run the original un-minimized reproducer via `triage-repro-loop.mjs --expect=green`.

## Phase 6: Cleanup & Lesson Capture

Before concluding:
- Remove all `[DEBUG-...]` logs and throwaway scripts (`millar-harden-scan.mjs` flags any leftover markers as blocking errors).
- Run project `typecheck`, test suite, and `build`.
- Record the proven root cause in one crisp sentence in the commit or PR description.
