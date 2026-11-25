"use client";

import React, { useState } from "react";
import { Alert, Badge, Card, ChoiceToggle, DataTable, Tabs } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

interface SkillDocItem {
  id: string;
  name: string;
  headline: string;
  summary: string;
  roles: string[];
  uri: string;
  references: Array<{ file: string; purpose: string }>;
  mcpCalls: string[];
  promptExample: string;
}

const SKILLS: SkillDocItem[] = [
  {
    id: "millar-web-workflow",
    name: "millar-web-workflow",
    headline: "Master Web Engineering Conductor & Creative Divergence Router",
    summary:
      "Single entry-point orchestrator routing Track S (surgical fix), Track M (syncing secondary pages to hero imagery/animations), and Track L (full greenfield build/redesign). Enforces the Anti-Slop Creative Divergence Protocol and coordinates Matt Pocock skills, Agency Agents specialists, and Millar MCP.",
    roles: ["Engineering Conductor", "Creative Director", "UX Architect", "QA Lead"],
    uri: "millar://skills/millar-web-workflow",
    references: [
      { file: "track-routing-and-gates.md", purpose: "Track S/M/L decision matrix, .millar/ phase-gate artifacts, and backend specialist escalation." },
      { file: "creative-divergence-protocol.md", purpose: "Rut-Naming, 3-Family Cultural Derivation, and One Authored Signature Moment per surface." },
    ],
    mcpCalls: ["list_skills", "get_skill", "get_design_guidelines", "validate_design"],
    promptExample:
      "Run millar-web-workflow (Track L) to design and build our multi-page launch website + workspace app, running Creative Divergence first and gating completion on millar-verify-web.",
  },
  {
    id: "millar-deep-research",
    name: "millar-deep-research",
    headline: "Visual DNA Extraction & World-Class Craft Research",
    summary:
      "Decodes user intent, dissects supplied hero images, animations, or live references into concrete Visual & Motion DNA, and benchmarks world-class web design and animation systems before code or prompts are written.",
    roles: ["UX Architect", "Visual Storyteller", "Brand Guardian"],
    uri: "millar://skills/millar-deep-research",
    references: [
      { file: "visual-extraction-protocol.md", purpose: "8-point visual artifact & 5-point animation extraction checklist." },
      { file: "world-class-benchmarks.md", purpose: "Curated benchmarks (Vercel Geist, Linear, Stripe, Anthropic, Emil Kowalski, Rauno Freiberg)." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_visual_assets", "get_motion_presets"],
    promptExample:
      "Run millar-deep-research on assets/hero-stage.png and src/components/HeroMotion.tsx to extract exact lighting, palette language, framing, and spring physics into .millar/research-dossier.md.",
  },
  {
    id: "millar-design",
    name: "millar-design",
    headline: "Flagship Design Director & Cross-Page Continuity",
    summary:
      "Solves multi-page style drift so secondary pages (Features, Pricing, About, Docs, App) inherit the exact materiality, lighting temperature, framing geometry, composition variety, and motion physics of hero visuals instead of collapsing into generic industrial cards.",
    roles: ["Brand Guardian", "UI Designer", "UX Architect", "Visual Storyteller", "Motion Choreographer"],
    uri: "millar://skills/millar-design",
    references: [
      { file: "style-dna-contract.md", purpose: "12-axis .millar/style-dna.md contract including Secondary-Page Richness rules." },
      { file: "aesthetic-movements.md", purpose: "World-class movement taxonomy & translating vague user taste into dials." },
      { file: "cross-page-sync-audit.md", purpose: "6-axis screenshot continuity rubric (requires >= 4/5 across every secondary route)." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_component", "get_visual_assets", "validate_design"],
    promptExample:
      "Use millar-design to build /features, /pricing, and /about fully synced to our existing homepage hero image and animation physics. Lock .millar/style-dna.md first and audit every route for cross-page continuity.",
  },
  {
    id: "millar-create-image",
    name: "millar-create-image",
    headline: "Style-Locked Visual Asset & AI Image Art Direction",
    summary:
      "Turns image generation into a repeatable studio pipeline using an 80% fixed Style DNA prompt prefix + 20% subject variable, HEX-to-material translation, and dual support for native AI image generators (Antigravity, Codex, Claude, Imagen/Flux) and code-native SVG/Canvas editorial plates.",
    roles: ["Visual Storyteller", "Brand Guardian", "UI Designer"],
    uri: "millar://skills/millar-create-image",
    references: [
      { file: "image-art-direction.md", purpose: "5-block Master Style Prefix formula, HEX-to-Visual-Language bridge, canvas-design plate rules." },
      { file: "multi-page-asset-map.md", purpose: "Multi-page scale variation blueprint (Home, Features, Pricing, About, Docs, Empty States)." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_visual_assets"],
    promptExample:
      "Run millar-create-image using .millar/style-dna.md to generate matching 4:3 feature plates and a 3:2 editorial studio scene for /features and /about with identical lighting and matte sand temperature.",
  },
  {
    id: "millar-animation",
    name: "millar-animation",
    headline: "Motion Research, Physics & Cross-Page Choreography",
    summary:
      "Researches user-aligned animation references, locks a 4-line Motion Thesis, and implements compositor-safe, interruptible springs, CSS View Transitions, scroll-driven reveals, and mandatory prefers-reduced-motion alternatives matching existing hero animations.",
    roles: ["Motion Choreographer", "Whimsy Injector", "UI Designer"],
    uri: "millar://skills/millar-animation",
    references: [
      { file: "motion-choreography.md", purpose: "Productive vs Expressive timing matrix, spring vs cubic-bezier rules, hover stability, View Transitions." },
      { file: "animation-research-patterns.md", purpose: "Translating subjective motion intent into exact curves and rejecting blank scroll traps." },
    ],
    mcpCalls: ["get_motion_presets", "get_design_guidelines", "validate_design"],
    promptExample:
      "Run millar-animation to unify spring timing and View Transitions across all routes matching our hero reveal physics, with static-first prefers-reduced-motion fallbacks.",
  },
  {
    id: "millar-build-web",
    name: "millar-build-web",
    headline: "Production Frontend Architecture & Vertical-Slice Execution",
    summary:
      "Synthesizes Matt Pocock deep modules & TDD vertical slices, Agency Agents frontend-developer & minimal-change restraint, Server-First React/Next.js boundaries, 5 mandatory UI states, Core Web Vitals (LCP/INP/CLS), and semantic SEO.",
    roles: ["Frontend Developer", "Software Architect", "Minimal Change Engineer"],
    uri: "millar://skills/millar-build-web",
    references: [
      { file: "web-architecture-checklist.md", purpose: "Feature modules, RSC Server-First leaves, Slot Pattern, forms/tables/dialogs, responsive floor." },
      { file: "seo-cwv-and-copy.md", purpose: "LCP < 2.5s, INP < 200ms, CLS < 0.1, semantic landmarks, JSON-LD, Zero Em-Dash & :lang(vi) safety." },
    ],
    mcpCalls: ["get_design_tokens", "search_components", "get_component", "search_sections", "validate_design"],
    promptExample:
      "Run millar-build-web to implement /pricing and /dashboard as Server-First vertical slices with lean client leaves, full loading/empty/error states, and zero hardcoded hex values.",
  },
  {
    id: "millar-verify-web",
    name: "millar-verify-web",
    headline: "5-Layer Real-Browser QA, A11y & Two-Axis Review Gate",
    summary:
      "Eliminates premature 'build passed' handoffs by enforcing 5 verification layers: static/MCP compliance, Playwright interactive E2E, 1440/768/375 Light & Dark visual continuity screenshots, dynamic axe-core WCAG 2.1 AA + reduced-motion testing, and two-axis Spec-vs-Standards review.",
    roles: ["QA Engineer", "Section 508 Accessibility Specialist", "Code Reviewer"],
    uri: "millar://skills/millar-verify-web",
    references: [
      { file: "five-layer-qa-gate.md", purpose: "Executable Playwright zero-error, overflow, dynamic axe-core, keyboard, and reduced-motion scripts." },
      { file: "two-axis-review-rubric.md", purpose: "Unmerged Spec Fidelity vs Engineering Standards review + Fowler code-smell baseline." },
    ],
    mcpCalls: ["validate_design", "get_design_guidelines"],
    promptExample:
      "Run millar-verify-web across all built routes at 1440px/768px/375px (Light & Dark), verify every interactive control, check cross-page continuity >= 4/5, and output a two-axis Spec vs Standards report.",
  },
];

const RECIPES = [
  {
    id: "track-m",
    label: "Track M: Sync Hero Assets",
    title: "Track M: Existing Hero Images / Animations -> Sync All Secondary Pages",
    problem: "Homepage looks bespoke thanks to user-supplied images or animations, but /features, /pricing, and /about drop into plain industrial cards that only copy fonts.",
    chain: [
      "millar-web-workflow",
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
    ],
    outcome: "Extracts lighting, materiality, framing, and motion physics from Page 1 into .millar/style-dna.md, builds clean Server-First secondary routes, and passes the 5-layer QA gate (>= 4/5 continuity).",
  },
  {
    id: "track-l",
    label: "Track L: Greenfield Creative",
    title: "Track L: Full Website / Creative Redesign (Anti-Slop Pipeline)",
    problem: "Building a multi-page website or app from scratch without falling into generic AI purple-glow SaaS templates.",
    chain: [
      "millar-web-workflow",
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
    ],
    outcome: "Names and bans the category rut, derives authentic visual craft, ships one authored signature moment per surface, builds vertical slices with CWV/SEO hygiene, and verifies all 5 QA layers.",
  },
  {
    id: "photo-free",
    label: "Photo-Free Hahlex Launch",
    title: "Photo-Free Marketing Launch (Zero Photos / Videos)",
    problem: "Need an editorial, finished Marketing website with zero photography supplied.",
    chain: ["millar-web-workflow", "millar-design", "millar-animation", "millar-build-web", "millar-verify-web"],
    outcome: "Combines Millar's 6 Composition Patterns, 14 code-native SVG/CSS/Canvas visual assets, App-rooted Warm Sand + Espresso + < 1.5% Crimson palette, clean RSC builds, and 5-layer Playwright QA.",
  },
  {
    id: "track-s",
    label: "Track S: Surgical Fix / App UI",
    title: "Track S: Surgical Bug Fix, Component Update, or Product Screen",
    problem: "Small focused UI change or dense zero-gradient Product screen that needs zero scope creep and strict WCAG/interactive verification.",
    chain: ["millar-web-workflow", "millar-build-web", "millar-verify-web"],
    outcome: "Enforces minimal-change diff restraint, solid zero-gradient Millar primitives, real interactive states, and fast Layer 1-2 + Two-Axis QA sign-off.",
  },
] as const;

export default function SkillsResourcePage() {
  const [recipeId, setRecipeId] = useState<(typeof RECIPES)[number]["id"]>("track-m");
  const [activeSkillTab, setActiveSkillTab] = useState<string>("millar-web-workflow");

  const activeRecipe = RECIPES.find((r) => r.id === recipeId) ?? RECIPES[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Resources"
        title="Millar Agent Skills Suite"
        description="Seven composable end-to-end web engineering & design studio skills synthesizing Anthropic canvas-design, Impeccable, Matt Pocock engineering skills, and Agency Agents roles. Bundled directly inside Millar MCP and installable in Antigravity, Claude Code, Codex, and Cursor."
        badges={[
          { label: "7 Composable Skills", tone: "brand" },
          { label: "15 Bundled Playbooks", tone: "sage" },
          { label: "Track S · M · L Workflow", tone: "neutral" },
        ]}
        importPath="millar://skills"
      />

      {/* Interactive Scenario & Track Planner */}
      <SpecimenFrame
        title="Interactive Track & Skill Combination Planner"
        description="Select your project track or scenario to see the exact gated pipeline from Creative Divergence through 5-layer real-browser QA."
        toolbar={
          <ChoiceToggle
            label="Project scenario"
            value={recipeId}
            onChange={setRecipeId}
            options={RECIPES.map((r) => ({ value: r.id, label: r.label }))}
          />
        }
        code={`# 1. Install all 7 Millar skills into any compatible agent (Antigravity / Claude / Codex / Cursor)
npx skills add https://github.com/hahlex/millar

# 2. Or invoke directly via Millar MCP tools / prompts (zero local skill install required)
list_skills()
${activeRecipe.chain.map((s) => `get_skill({ name: "${s}", includeAllReferences: true })`).join("\n")}`}
        codeTitle={`Recommended Pipeline · ${activeRecipe.label}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title)" }}>{activeRecipe.title}</strong>
            <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.55 }}>{activeRecipe.problem}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {activeRecipe.chain.map((step, idx) => (
              <React.Fragment key={step}>
                <Badge tone={step === "millar-web-workflow" || step === "millar-design" ? "brand" : step === "millar-verify-web" ? "success" : "sand"}>
                  {idx + 1}. {step}
                </Badge>
                {idx < activeRecipe.chain.length - 1 ? (
                  <span aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>
                    -&gt;
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <Alert tone="success" title="Guaranteed outcome" message={activeRecipe.outcome} />
        </div>
      </SpecimenFrame>

      {/* Interactive Skill Inspector */}
      <section aria-labelledby="skill-inspector-heading" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 id="skill-inspector-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Inspect All 7 Skills &amp; Bundled Playbooks
        </h2>
        <Tabs
          ariaLabel="Millar Agent Skills"
          activeId={activeSkillTab}
          onChange={setActiveSkillTab}
          items={SKILLS.map((skill) => ({
            id: skill.id,
            label: skill.name,
            content: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card surface="inset" padding="default">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title)" }}>{skill.headline}</strong>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>{skill.uri}</code>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.6 }}>{skill.summary}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {skill.roles.map((role) => (
                      <Badge key={role} tone="sage" dot={false}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <DataTable
                  caption={`${skill.name} progressive-disclosure references`}
                  columns={[
                    { key: "file", header: "Reference File" },
                    { key: "purpose", header: "Loaded When" },
                  ]}
                  rows={skill.references.map((r) => ({ id: r.file, ...r }))}
                  rowKey={(r) => r.id}
                />

                <div style={{ padding: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <strong style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>Example Prompt Invocation</strong>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-default)", lineHeight: 1.55 }}>
                    {skill.promptExample}
                  </code>
                </div>
              </div>
            ),
          }))}
        />
      </section>

      {/* Cross-Agent Compatibility Table */}
      <section aria-labelledby="agent-compat-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="agent-compat-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Cross-Agent Compatibility (Agy · Claude · Codex · Cursor)
        </h2>
        <DataTable
          caption="How each coding agent consumes Millar Skills and MCP"
          columns={[
            { key: "agent", header: "Agent / Client" },
            { key: "skills", header: "Skill Discovery" },
            { key: "images", header: "Image & QA Path" },
            { key: "mcp", header: "MCP Access" },
          ]}
          rows={[
            {
              id: "agy",
              agent: "Antigravity (Agy)",
              skills: "Native SKILL.md in ~/.gemini/config/skills/ or MCP get_skill",
              images: "image-generator + Playwright E2E + code-native Millar Visual Assets",
              mcp: "13 Tools · 10 Prompts · millar://skills/*",
            },
            {
              id: "claude",
              agent: "Claude Code",
              skills: "npx skills add / .claude/skills/ or MCP Prompts",
              images: "MCP image tools + SVG/Canvas/Python plates + Playwright 5-layer QA",
              mcp: "stdio / Streamable HTTP (full Resources + Prompts)",
            },
            {
              id: "codex",
              agent: "OpenAI Codex",
              skills: ".codex/skills/ or MCP list_skills / get_skill tools",
              images: "Native image generation + style-locked plates + Playwright E2E",
              mcp: "Flat JSON Schema Tools (13 read-only tools)",
            },
            {
              id: "cursor",
              agent: "Cursor / VS Code",
              skills: ".cursor/skills/ or MCP Resources + Tools",
              images: "Code-native Visual Assets + Master Prompt Packet + Playwright QA",
              mcp: "stdio / HTTP MCP server",
            },
          ]}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
