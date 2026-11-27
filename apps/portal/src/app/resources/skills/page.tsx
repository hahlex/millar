"use client";

import React, { useState } from "react";
import { DataTable, Tabs } from "@hahlex/millar-ui";
import { CodeCopyBox } from "@/components/CodeCopyBox";
import { DocHeader } from "@/components/DocPrimitives";
import { InstallBar } from "@/components/InstallBar";

interface SkillDocItem {
  id: string;
  name: string;
  headline: string;
  uri: string;
  references: Array<{ file: string; purpose: string }>;
  promptExample: string;
}

const SKILLS: SkillDocItem[] = [
  {
    id: "millar-web-workflow",
    name: "millar-web-workflow",
    headline: "Track S/M/L conductor, brand-first research, and anti-slop divergence",
    uri: "millar://skills/millar-web-workflow",
    references: [
      { file: "track-routing-and-gates.md", purpose: "Track S/M/L matrix and .millar/ phase gates" },
      { file: "creative-divergence-protocol.md", purpose: "Brand-first gate and 4 AI-rut bans" },
    ],
    promptExample: "Run millar-web-workflow (Track L): research the brand first, run Creative Divergence, build, and pass millar-verify-web.",
  },
  {
    id: "millar-deep-research",
    name: "millar-deep-research",
    headline: "Brand research from primary sources and Visual/Motion DNA extraction",
    uri: "millar://skills/millar-deep-research",
    references: [
      { file: "visual-extraction-protocol.md", purpose: "8-point visual and 5-point motion extraction" },
      { file: "world-class-benchmarks.md", purpose: "Craft and motion reference benchmarks" },
    ],
    promptExample: "Run millar-deep-research on our brand and supplied hero assets into .millar/research-dossier.md.",
  },
  {
    id: "millar-design",
    name: "millar-design",
    headline: "5-role design studio, Craft Floor bans, and cross-page continuity",
    uri: "millar://skills/millar-design",
    references: [
      { file: "style-dna-contract.md", purpose: "12-axis .millar/style-dna.md contract" },
      { file: "aesthetic-movements.md", purpose: "Movement taxonomy and dials" },
      { file: "cross-page-sync-audit.md", purpose: "6-axis continuity audit (>= 4/5)" },
    ],
    promptExample: "Use millar-design to lock .millar/style-dna.md and sync /features, /pricing, and /about to the hero.",
  },
  {
    id: "millar-create-image",
    name: "millar-create-image",
    headline: "Natural daylight & linework, kinetic human actions, and organic Path H 2K plates",
    uri: "millar://skills/millar-create-image",
    references: [
      { file: "image-art-direction.md", purpose: "65/35 Subject-First prompts (80-135w), pigment language and Brand Motif Elevation" },
      { file: "human-editorial-photography.md", purpose: "Bright sunlit teaching scenes, concrete kinetic mid-actions and authentic skin" },
      { file: "natural-editorial-illustration.md", purpose: "Variable hand-drawn ink/graphite linework and loose watercolor/gouache washes" },
      { file: "hybrid-plate-compositing.md", purpose: "Organic Path H: photo paper stage + 2K letterpress ink-soak SVG composite" },
      { file: "procedural-gallery-craft.md", purpose: "503 Honest Medium Pivot, 4-layer craft and Zero-Addition Pass 2" },
      { file: "multi-page-asset-map.md", purpose: "Multi-page scale and dedicated single-subject catalog plates" },
      { file: "scripts/embed-provenance.mjs", purpose: "Zero-dependency PNG tEXt chunk & .prompt.json provenance CLI" },
    ],
    promptExample: "Run millar-create-image v0.5: bright natural daylight, concrete mid-action scenes, organic linework, and PNG tEXt provenance.",
  },
  {
    id: "millar-animation",
    name: "millar-animation",
    headline: "Compositor-safe springs, View Transitions, and static-first reduced motion",
    uri: "millar://skills/millar-animation",
    references: [
      { file: "motion-choreography.md", purpose: "Productive vs Expressive curves and View Transitions" },
      { file: "animation-research-patterns.md", purpose: "Static-first motion and reduced-motion fallbacks" },
    ],
    promptExample: "Run millar-animation to unify spring physics, View Transitions, and prefers-reduced-motion across routes.",
  },
  {
    id: "millar-build-web",
    name: "millar-build-web",
    headline: "Server-First architecture, deep modules, 5 UI states, and CWV/SEO",
    uri: "millar://skills/millar-build-web",
    references: [
      { file: "web-architecture-checklist.md", purpose: "RSC boundaries, deep modules and 5 UI states" },
      { file: "seo-cwv-and-copy.md", purpose: "LCP/INP/CLS, landmarks, JSON-LD and :lang(vi)" },
    ],
    promptExample: "Run millar-build-web to implement /pricing and /dashboard as Server-First slices with all 5 UI states.",
  },
  {
    id: "millar-verify-web",
    name: "millar-verify-web",
    headline: "5-layer QA, Zero-MCP audit CLI v0.4 (WCAG 2.2 + security/CWV), and fresh-context finish reviewer",
    uri: "millar://skills/millar-verify-web",
    references: [
      { file: "five-layer-qa-gate.md", purpose: "Playwright, axe-core, Layer 3B, WCAG 2.2 target size and reviewer packet" },
      { file: "two-axis-review-rubric.md", purpose: "Spec vs Standards review rubric" },
      { file: "scripts/millar-audit.mjs", purpose: "Standalone Zero-MCP audit CLI v0.4 (contrast, SC 1.4.11, SC 2.5.8, CLS, security sinks)" },
    ],
    promptExample: "Run millar-verify-web: execute scripts/millar-audit.mjs, verify 1440/768/375 & WCAG 2.2 AA, and spawn a fresh finish reviewer.",
  },
  {
    id: "millar-autonomous-qa",
    name: "millar-autonomous-qa",
    headline: "Hybrid-depth 8-stage autonomous QA loop, 4-axis security matrix, HAR-to-OpenAPI & Report v2",
    uri: "millar://skills/millar-autonomous-qa",
    references: [
      { file: "tool-selection.md", purpose: "Non-redundant 7-tool stack (Playwright, CDP MCP, Schemathesis, Hypothesis, k6, Toxiproxy, Promptfoo)" },
      { file: "qa-loop-and-modes.md", purpose: "8-stage frontier loop, --depth=smoke|standard|deep-business, 4-axis auth matrix & workflow scenarios" },
      { file: "safety-and-guardrails.md", purpose: "Non-prod target verification, origin-scoped auth headers, budget caps & cache isolation" },
      { file: "outcome-verification.md", purpose: "Causal verification across X-Request-Id, Postgres, stuck Redis RQ queues, Mailpit polling & Docker" },
      { file: "self-validation-log.md", purpose: "Empirical validation log (166/166 strict E2E + v0.4.0 0% FP live benchmark)" },
      { file: "scripts/run-qa-loop.mjs", purpose: "Continuous QA loop CLI with HAR-to-OpenAPI, persona workflows & interactive HTML Report v2" },
    ],
    promptExample: "Run millar-autonomous-qa (--depth=deep-business) against http://localhost:5173: enforce safety-guard, expand UI frontier, run 4-axis auth matrix & causal outcome checks, and emit HTML Report v2.",
  },
  {
    id: "millar-diagnose-and-harden",
    name: "millar-diagnose-and-harden",
    headline: "White-box root-cause debugging, OWASP Web/API/Agentic security hardening & minimal-diff fixes",
    uri: "millar://skills/millar-diagnose-and-harden",
    references: [
      { file: "root-cause-protocol.md", purpose: "6-phase scientific loop: red reproducer, 3-5 hypotheses, instrumentation & proof" },
      { file: "owasp-security-hardening.md", purpose: "OWASP Top 10, API Security & Agentic AI guardrails, CORS, headers & secret hygiene" },
      { file: "performance-and-waterfall-diagnosis.md", purpose: "Vercel Priority 1-3 waterfall, N+1, bundle, INP/LoAF & Postgres EXPLAIN diagnosis" },
      { file: "minimal-diff-and-seam-testing.md", purpose: "Real-seam regression tests, zero-scope-creep diffs & QA ledger remediation" },
      { file: "scripts/millar-harden-scan.mjs", purpose: "Standalone Zero-MCP security, secret, perf & live HTTP header CLI (npx millar harden)" },
      { file: "scripts/triage-repro-loop.mjs", purpose: "Multi-run flake/repro loop runner & millar-autonomous-qa findings-ledger importer" },
    ],
    promptExample: "Run millar-diagnose-and-harden on apps/api: triage findings-ledger.json, prove root cause with a red seam test, ship a minimal-diff fix, and pass npx millar harden.",
  },
];

const MICRO_HEADING_STYLE: React.CSSProperties = {
  margin: 0,
  scrollMarginTop: 76,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border-soft)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.72rem",
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--fg-muted)",
};

export default function SkillsResourcePage() {
  const [activeSkillTab, setActiveSkillTab] = useState<string>("millar-web-workflow");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader section="Resources" title="Millar Skills" importPath="millar://skills" />

      {/* skills.sh-inspired single-line INSTALLATION bar */}
      <InstallBar label="Installation" showTargetSwitch defaultTarget="mcp" />

      {/* skills.sh-inspired hairline skill directory */}
      <section aria-labelledby="skills-directory-heading" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <h2 id="skills-directory-heading" style={MICRO_HEADING_STYLE}>
          Included Skills
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SKILLS.map((skill) => {
            const isSelected = activeSkillTab === skill.id;
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => setActiveSkillTab(skill.id)}
                className="millar-focus"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "13px 6px",
                  border: 0,
                  borderBottom: "1px solid var(--border-soft)",
                  backgroundColor: isSelected ? "var(--bg-surface)" : "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 600, color: isSelected ? "var(--fg-accent)" : "var(--fg-default)" }}>
                    {skill.name}
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>{skill.headline}</span>
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--fg-subtle)", flexShrink: 0 }}>
                  {skill.references.length} files
                </code>
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Skill Inspector */}
      <section aria-labelledby="skill-inspector-heading" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 id="skill-inspector-heading" style={MICRO_HEADING_STYLE}>
          Skill Playbooks &amp; Prompts
        </h2>
        <Tabs
          ariaLabel="Millar Agent Skills"
          activeId={activeSkillTab}
          onChange={setActiveSkillTab}
          items={SKILLS.map((skill) => ({
            id: skill.id,
            label: skill.name,
            content: (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <DataTable
                  caption={`${skill.name} bundled files`}
                  columns={[
                    { key: "file", header: "File" },
                    { key: "purpose", header: "Role" },
                  ]}
                  rows={skill.references.map((r) => ({ id: r.file, ...r }))}
                  rowKey={(r) => r.id}
                />
                <CodeCopyBox title={`${skill.name} · Prompt`} code={skill.promptExample} wrap />
              </div>
            ),
          }))}
        />
      </section>
    </div>
  );
}
