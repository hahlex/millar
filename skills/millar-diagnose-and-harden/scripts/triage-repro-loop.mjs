#!/usr/bin/env node
/**
 * triage-repro-loop.mjs (v0.1.0): Tight Feedback Loop Runner & Millar Autonomous QA Ledger Triage Importer
 *
 * Zero external npm dependencies (Node >= 18).
 * Two modes:
 *   1. Tight Feedback Loop / Flake Stress Test:
 *      node scripts/triage-repro-loop.mjs --cmd "<command>" [--runs=5] [--expect=red|green] [--timeout-ms=15000] [--cwd=<dir>] [--json]
 *   2. Import & Prioritize millar-autonomous-qa Findings Ledger:
 *      node scripts/triage-repro-loop.mjs --from-qa-ledger <findings-ledger.json> [--out-plan=.millar/remediation-plan.md] [--json]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

function redact(text) {
  let out = String(text ?? "").replaceAll("\u2014", " -- ");
  out = out.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]");
  out = out.replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "[REDACTED_JWT]");
  out = out.replace(
    /\b(https?|postgres(?:ql)?|redis|rediss|mysql|mongodb):\/\/([^:@/\s]*):([^@/\s]+)@/gi,
    "$1://$2:[REDACTED]@",
  );
  return out;
}

function parseArgs(argv) {
  const opts = {
    cmd: "",
    runs: 3,
    expect: null,
    timeoutMs: 15000,
    cwd: process.cwd(),
    fromQaLedger: null,
    outPlan: null,
    json: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--json") opts.json = true;
    else if (arg.startsWith("--cmd=")) opts.cmd = arg.slice("--cmd=".length);
    else if (arg === "--cmd" && argv[i + 1]) opts.cmd = argv[++i];
    else if (arg.startsWith("--runs=")) opts.runs = Math.max(1, Math.min(50, Number(arg.slice("--runs=".length)) || 3));
    else if (arg === "--runs" && argv[i + 1]) opts.runs = Math.max(1, Math.min(50, Number(argv[++i]) || 3));
    else if (arg.startsWith("--expect=")) opts.expect = arg.slice("--expect=".length).toLowerCase();
    else if (arg === "--expect" && argv[i + 1]) opts.expect = argv[++i].toLowerCase();
    else if (arg.startsWith("--timeout-ms=")) opts.timeoutMs = Math.max(500, Number(arg.slice("--timeout-ms=".length)) || 15000);
    else if (arg === "--timeout-ms" && argv[i + 1]) opts.timeoutMs = Math.max(500, Number(argv[++i]) || 15000);
    else if (arg.startsWith("--cwd=")) opts.cwd = path.resolve(arg.slice("--cwd=".length));
    else if (arg === "--cwd" && argv[i + 1]) opts.cwd = path.resolve(argv[++i]);
    else if (arg.startsWith("--from-qa-ledger=")) opts.fromQaLedger = arg.slice("--from-qa-ledger=".length);
    else if (arg === "--from-qa-ledger" && argv[i + 1]) opts.fromQaLedger = argv[++i];
    else if (arg.startsWith("--out-plan=")) opts.outPlan = arg.slice("--out-plan=".length);
    else if (arg === "--out-plan" && argv[i + 1]) opts.outPlan = argv[++i];
  }
  return opts;
}

function percentile(sortedNums, p) {
  if (sortedNums.length === 0) return 0;
  const idx = Math.min(sortedNums.length - 1, Math.max(0, Math.ceil((p / 100) * sortedNums.length) - 1));
  return sortedNums[idx];
}

function runFeedbackLoop(opts) {
  const runs = [];
  for (let i = 1; i <= opts.runs; i += 1) {
    const t0 = Date.now();
    const res = spawnSync(opts.cmd, {
      shell: true,
      cwd: opts.cwd,
      encoding: "utf8",
      timeout: opts.timeoutMs,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    });
    const durationMs = Date.now() - t0;
    const timedOut = Boolean(res.error && /ETIMEDOUT/i.test(String(res.error.code || res.error.message)));
    const exitCode = typeof res.status === "number" ? res.status : timedOut ? 124 : 1;
    runs.push({
      run: i,
      exitCode,
      timedOut,
      state: exitCode === 0 ? "green" : "red",
      durationMs,
      stdoutSnippet: redact(res.stdout || "").trim().slice(-240),
      stderrSnippet: redact(res.stderr || "").trim().slice(-240),
    });
  }

  const redCount = runs.filter((r) => r.state === "red").length;
  const greenCount = runs.length - redCount;
  const reproRatePct = Math.round((redCount / runs.length) * 100);
  const durations = runs.map((r) => r.durationMs).sort((a, b) => a - b);
  const classification =
    redCount === runs.length
      ? "deterministic_red"
      : greenCount === runs.length
        ? "deterministic_green"
        : "flaky";

  let expectationMet = true;
  if (opts.expect === "red") expectationMet = redCount > 0;
  else if (opts.expect === "green") expectationMet = redCount === 0;

  const summary = {
    tool: "triage-repro-loop",
    mode: "feedback_loop",
    command: redact(opts.cmd),
    runsTotal: runs.length,
    redCount,
    greenCount,
    reproRatePct,
    classification,
    timingMs: {
      min: durations[0] ?? 0,
      median: percentile(durations, 50),
      p95: percentile(durations, 95),
      max: durations[durations.length - 1] ?? 0,
    },
    expect: opts.expect,
    expectationMet,
    runs,
  };

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(
      `${expectationMet ? "PASS" : "FAIL"}: feedback loop [${classification}] red=${redCount}/${runs.length} (${reproRatePct}%) | median=${summary.timingMs.median}ms, p95=${summary.timingMs.p95}ms`,
    );
    const sample = runs.find((r) => r.state === "red") || runs[0];
    if (sample?.stderrSnippet) console.log(`  stderr: ${sample.stderrSnippet}`);
    else if (sample?.stdoutSnippet) console.log(`  stdout: ${sample.stdoutSnippet}`);
  }
  process.exit(expectationMet ? 0 : 1);
}

function triageQaLedger(opts) {
  const absLedger = path.resolve(process.cwd(), opts.fromQaLedger);
  if (!fs.existsSync(absLedger)) {
    console.error(`Findings ledger not found: ${absLedger}`);
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(absLedger, "utf8"));
  const allFindings = Array.isArray(raw?.findings) ? raw.findings : [];

  const sortFindings = (arr) =>
    [...arr].sort((a, b) => {
      const sa = SEV_RANK[String(a.severity || "medium").toLowerCase()] ?? 2;
      const sb = SEV_RANK[String(b.severity || "medium").toLowerCase()] ?? 2;
      if (sa !== sb) return sa - sb;
      return Number(b.occurrences || 1) - Number(a.occurrences || 1);
    });

  const confirmedBugs = sortFindings(allFindings.filter((f) => f.classification === "confirmed_bug"));
  const specGaps = sortFindings(allFindings.filter((f) => f.classification === "spec_gap"));
  const runtimeDegraded = sortFindings(allFindings.filter((f) => f.classification === "runtime_degraded"));

  const queue = confirmedBugs.map((f, idx) => ({
    priority: idx + 1,
    id: String(f.id || `QA-${idx + 1}`),
    severity: String(f.severity || "medium").toLowerCase(),
    role: f.role || null,
    title: redact(f.title || ""),
    endpointOrRoute: redact(f.endpointOrRoute || ""),
    reproScript: f.reproScript ? redact(f.reproScript) : null,
    reproCommand: redact(f.reproCommand || ""),
    requiredEnv: [f.tokenEnv, f.headersEnv].filter(Boolean),
    verifiedOutcome: redact(f.verifiedOutcome || ""),
  }));

  if (opts.outPlan) {
    const lines = [
      "# Millar Remediation Plan (Imported from millar-autonomous-qa)",
      "",
      `- Source ledger: \`${absLedger.replaceAll("\\", "/")}\``,
      `- Generated at: \`${new Date().toISOString()}\``,
      `- Confirmed Bugs: **${confirmedBugs.length}** | Spec Gaps: **${specGaps.length}** | Runtime Degraded: **${runtimeDegraded.length}**`,
      "",
      "## Priority Remediation Queue (Confirmed Bugs)",
      "",
    ];
    if (queue.length === 0) {
      lines.push("- Zero confirmed bugs in ledger.");
    } else {
      for (const item of queue) {
        const reproCmd = item.reproScript
          ? item.reproScript.endsWith(".py")
            ? `python ${item.reproScript}`
            : `node ${item.reproScript}`
          : item.reproCommand;
        lines.push(`### P${item.priority} [${item.severity.toUpperCase()}] ${item.id}: ${item.title}`);
        lines.push(`- Surface: \`${item.endpointOrRoute || "n/a"}\`${item.role ? ` (role: \`${item.role}\`)` : ""}`);
        if (item.requiredEnv.length > 0) {
          lines.push(`- Required Runtime Auth Env: \`${item.requiredEnv.join(", ")}\``);
        }
        lines.push(`- Tight Red Loop: \`${reproCmd}\``);
        lines.push(`- Observed Failure: ${item.verifiedOutcome}`);
        lines.push("- Checklist: [ ] Confirm red -> [ ] Minimize -> [ ] 3-5 hypotheses -> [ ] Real-seam regression test -> [ ] Minimal fix -> [ ] Reproducer exits 0");
        lines.push("");
      }
    }
    if (specGaps.length > 0) {
      lines.push("## Specification Gaps (Confirm Contract Before Coding)", "");
      for (const sg of specGaps) {
        lines.push(`- \`${sg.id}\` [${sg.severity}]: ${redact(sg.title)} (${redact(sg.verifiedOutcome).slice(0, 160)})`);
      }
      lines.push("");
    }
    if (runtimeDegraded.length > 0) {
      lines.push("## Runtime / Infra Degraded Observations", "");
      for (const rd of runtimeDegraded) {
        lines.push(`- \`${rd.id}\` [${rd.severity}]: ${redact(rd.title)} (${redact(rd.verifiedOutcome).slice(0, 160)})`);
      }
      lines.push("");
    }
    const absPlan = path.resolve(process.cwd(), opts.outPlan);
    fs.mkdirSync(path.dirname(absPlan), { recursive: true });
    fs.writeFileSync(absPlan, lines.join("\n").replaceAll("\u2014", " -- ") + "\n", "utf8");
  }

  const output = {
    tool: "triage-repro-loop",
    mode: "qa_ledger_triage",
    ledgerPath: absLedger.replaceAll("\\", "/"),
    outPlan: opts.outPlan ? path.resolve(process.cwd(), opts.outPlan).replaceAll("\\", "/") : null,
    counts: {
      total: allFindings.length,
      confirmedBugs: confirmedBugs.length,
      specGaps: specGaps.length,
      runtimeDegraded: runtimeDegraded.length,
    },
    remediationQueue: queue,
  };

  if (opts.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(
      `TRIAGED: ${confirmedBugs.length} confirmed bug(s), ${specGaps.length} spec gap(s), ${runtimeDegraded.length} runtime degraded.${opts.outPlan ? ` Plan written to ${opts.outPlan}` : ""}`,
    );
    for (const item of queue) {
      console.log(`  #${item.priority} [${item.severity.toUpperCase()}] ${item.id}: ${item.title}`);
    }
  }
  process.exit(0);
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || (!opts.cmd && !opts.fromQaLedger)) {
  console.log(
    "Usage:\n  node scripts/triage-repro-loop.mjs --cmd \"<command>\" [--runs=3] [--expect=red|green] [--timeout-ms=15000] [--cwd=<dir>] [--json]\n  node scripts/triage-repro-loop.mjs --from-qa-ledger <findings-ledger.json> [--out-plan=.millar/remediation-plan.md] [--json]",
  );
  process.exit(opts.help ? 0 : 2);
}

if (opts.fromQaLedger) {
  triageQaLedger(opts);
} else {
  runFeedbackLoop(opts);
}
