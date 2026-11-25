"use client";

import React, { useState } from "react";
import { Alert, Badge, Card, ChoiceToggle, DataTable, Tabs } from "@hahlex/millar-ui";
import { CodeCopyBox } from "@/components/CodeCopyBox";
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

const INSTALL_PROMPTS = {
  mcp: {
    label: "Install MCP (Includes 7 Skills)",
    code: `Add the Millar MCP server ("millar") to my MCP config using command "npx" and args ["-y", "@hahlex/millar-mcp@draft"] (all 7 Millar Skills are bundled inside MCP). Verify by calling list_skills() and get_design_guidelines(register="shared").`,
    note: "Recommended: installing Millar MCP already bundles all 7 skills, 17 playbooks, 13 tools, and 10 prompts in one step.",
  },
  skills: {
    label: "Install 7 Skills Only",
    code: `Run \`npx skills add https://github.com/hahlex/millar\` to install the 7 Millar Skills, then verify all 7 skills (with references/ and scripts/millar-audit.mjs) are loaded.`,
    note: "Standalone mode: installs only the 7 skills locally, including scripts/millar-audit.mjs for Zero-MCP mechanical verification.",
  },
} as const;

const SKILLS: SkillDocItem[] = [
  {
    id: "millar-web-workflow",
    name: "millar-web-workflow",
    headline: "Master Web Engineering Conductor & Brand-First Router (v0.2)",
    summary:
      "Single entry-point orchestrator routing Track S (surgical fix), Track M (syncing secondary pages to hero assets), and Track L (greenfield site/redesign). Enforces Brand-First Research (zero hardcoded palettes), Impeccable anti-slop calibration, canvas-design craft, and fresh-context verification.",
    roles: ["Engineering Conductor", "Creative Director", "UX Architect", "Independent Critic"],
    uri: "millar://skills/millar-web-workflow",
    references: [
      { file: "track-routing-and-gates.md", purpose: "Track S/M/L decision matrix, .millar/ phase-gate artifacts, and backend specialist escalation." },
      { file: "creative-divergence-protocol.md", purpose: "Brand-First gate, 4 AI-rut bans (including cream-serif rut), overused font guard, and Dual-Soul direction." },
    ],
    mcpCalls: ["list_skills", "get_skill", "get_design_guidelines", "validate_design"],
    promptExample:
      "Run millar-web-workflow (Track L) to design and build this multi-page website. Research any named brand first (never hardcode palettes), run Creative Divergence, and pass millar-verify-web before handoff.",
  },
  {
    id: "millar-deep-research",
    name: "millar-deep-research",
    headline: "Brand-First Research & Visual/Motion DNA Extraction (v0.2)",
    summary:
      "Researches any named brand from primary sources (local DESIGN.md, live MCP tokens, or official web references) and extracts concrete Visual & Motion DNA from supplied hero images or animations into an English .millar/research-dossier.md.",
    roles: ["UX Architect", "Visual Storyteller", "Brand Guardian"],
    uri: "millar://skills/millar-deep-research",
    references: [
      { file: "visual-extraction-protocol.md", purpose: "8-point brand & visual artifact inspection plus 5-point motion extraction in English." },
      { file: "world-class-benchmarks.md", purpose: "Curated structural and motion craft benchmarks across top web engineering studios." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_visual_assets", "get_motion_presets"],
    promptExample:
      "Run millar-deep-research on our target brand and supplied hero assets (assets/hero.png, HeroMotion.tsx) to extract verified palette, polarity, lighting, and motion physics into .millar/research-dossier.md.",
  },
  {
    id: "millar-design",
    name: "millar-design",
    headline: "5-Role Design Studio & Cross-Page Continuity (v0.2)",
    summary:
      "Operates as a 5-role studio with explicit veto authority so secondary pages (/features, /pricing, /about, /app) inherit full materiality, polarity balance, lighting, framing, Craft Floor rigor, and browser surface theming instead of flat industrial cards.",
    roles: ["Visual Storyteller", "Brand Guardian", "UI Designer", "UX Architect", "Motion Choreographer"],
    uri: "millar://skills/millar-design",
    references: [
      { file: "style-dna-contract.md", purpose: "12-axis .millar/style-dna.md contract and Secondary-Page Richness rules." },
      { file: "aesthetic-movements.md", purpose: "Movement taxonomy and translating taste prompts into concrete visual dials." },
      { file: "cross-page-sync-audit.md", purpose: "6-axis screenshot continuity rubric (requires >= 4/5 across every secondary route)." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_component", "get_visual_assets", "validate_design"],
    promptExample:
      "Use millar-design to build /features, /pricing, and /about fully synced to our researched brand and existing hero visuals. Lock .millar/style-dna.md first and audit every route >= 4/5 on cross-page continuity.",
  },
  {
    id: "millar-create-image",
    name: "millar-create-image",
    headline: "Gallery-Grade Art Direction, Human Photo & 4-Layer Procedural Craft (v0.2)",
    summary:
      "English-only 80/20 style-locked art direction (concise 150-250 word prompts + .prompt.json provenance), authentic human editorial photography (anti-wax-skin, cross-shot film roll continuity), AND 4-layer museum-grade procedural craft with canvas-design Zero-Addition Pass 2 polish on 503/offline.",
    roles: ["Visual Storyteller", "Brand Guardian", "Master Illustrator"],
    uri: "millar://skills/millar-create-image",
    references: [
      { file: "image-art-direction.md", purpose: "Concise 80/20 English Master Prompt, dynamic HEX-to-material translation, series polarity & provenance sidecars." },
      { file: "human-editorial-photography.md", purpose: "Authentic real-human documentary photography (anti-wax-skin, natural hands, cultural accuracy, color + B&W film continuity)." },
      { file: "procedural-gallery-craft.md", purpose: "503/offline 4-layer procedural craft (material grain, chiaroscuro depth, guilloche/halftone, Zero-Addition Pass 2 polish, anti-clip-art bans)." },
      { file: "multi-page-asset-map.md", purpose: "Multi-page scale variation blueprint across Home, Features, Pricing, About, Docs, and Empty States." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_visual_assets"],
    promptExample:
      "Run millar-create-image from .millar/style-dna.md using concise English prompts to create our hero and secondary editorial visuals (save .prompt.json provenance; apply 4-layer procedural craft + Zero-Addition Pass 2 if image gen is unavailable).",
  },
  {
    id: "millar-animation",
    name: "millar-animation",
    headline: "Motion Research, Physics & Cross-Page Choreography (v0.2)",
    summary:
      "Locks a 4-line Motion Thesis and ships compositor-safe, interruptible springs, CSS View Transitions, scroll-driven reveals, and static-first prefers-reduced-motion fallbacks matching existing hero physics.",
    roles: ["Motion Choreographer", "Whimsy Injector", "UI Designer"],
    uri: "millar://skills/millar-animation",
    references: [
      { file: "motion-choreography.md", purpose: "Productive vs Expressive timing matrix, spring vs cubic-bezier rules, hover stability, View Transitions." },
      { file: "animation-research-patterns.md", purpose: "Translating motion intent into exact curves and eliminating blank opacity: 0 scroll traps." },
    ],
    mcpCalls: ["get_motion_presets", "get_design_guidelines", "validate_design"],
    promptExample:
      "Run millar-animation to unify spring timing, tactile hover stability, and CSS View Transitions across all routes with static-first visibility and prefers-reduced-motion in the same edit.",
  },
  {
    id: "millar-build-web",
    name: "millar-build-web",
    headline: "Production Frontend Architecture & Vertical-Slice Execution (v0.2)",
    summary:
      "Synthesizes deep modules, TDD vertical slices, minimal-change restraint, Server-First React/Next.js boundaries, 5 mandatory interactive UI states, browser surface theming, Core Web Vitals (LCP/INP/CLS), and semantic SEO.",
    roles: ["Frontend Developer", "Software Architect", "Minimal Change Engineer"],
    uri: "millar://skills/millar-build-web",
    references: [
      { file: "web-architecture-checklist.md", purpose: "Feature modules, RSC Server-First leaves, Slot Pattern, forms/tables/dialogs, responsive floor." },
      { file: "seo-cwv-and-copy.md", purpose: "LCP < 2.5s, INP < 200ms, CLS < 0.1, semantic landmarks, JSON-LD, Zero Em-Dash & :lang(vi) safety." },
    ],
    mcpCalls: ["get_design_tokens", "search_components", "get_component", "search_sections", "validate_design"],
    promptExample:
      "Run millar-build-web to implement /pricing and /dashboard as Server-First vertical slices with lean client leaves, all 5 UI states, browser surface theming, and verified design tokens.",
  },
  {
    id: "millar-verify-web",
    name: "millar-verify-web",
    headline: "5-Layer QA, Zero-MCP Audit CLI & Fresh-Context Finish Review (v0.2)",
    summary:
      "Ships standalone Zero-MCP scripts/millar-audit.mjs (WCAG contrast, AI-slop bans, sparse clip-art SVG detector, em-dash, optional live overflow), Playwright E2E, Layer 3B visual critique, axe-core WCAG 2.1 AA, and Fresh-Context Independent Finish Review (ship | fix | rebuild | recapture).",
    roles: ["QA Engineer", "Harsh Art Critic", "Section 508 Specialist", "Independent Code Reviewer"],
    uri: "millar://skills/millar-verify-web",
    references: [
      { file: "five-layer-qa-gate.md", purpose: "millar-audit.mjs usage, Playwright zero-error/overflow/axe-core checks, Layer 3B rejection rules, and reviewer packet." },
      { file: "two-axis-review-rubric.md", purpose: "Unmerged Spec Fidelity vs Engineering Standards review + Fowler code-smell baseline." },
      { file: "scripts/millar-audit.mjs", purpose: "Zero-dependency Node CLI mechanical auditor (works standalone even without Millar MCP)." },
    ],
    mcpCalls: ["validate_design", "get_design_guidelines"],
    promptExample:
      "Run millar-verify-web across all built routes: execute scripts/millar-audit.mjs, verify 1440/768/375 Light & Dark screenshots and axe-core WCAG AA, and delegate Layer 3B + Layer 5 to a fresh-context finish reviewer.",
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
    outcome: "Researches the brand & Page 1 assets into .millar/style-dna.md, builds style-locked English imagery and Server-First secondary routes, and clears millar-audit.mjs + Fresh-Context Finish Review (>= 4/5 continuity).",
  },
  {
    id: "track-l",
    label: "Track L: Greenfield Creative",
    title: "Track L: Full Website / Creative Redesign (Anti-Slop Pipeline)",
    problem: "Building a multi-page website or app from scratch without falling into AI purple-glow SaaS or generic cream-serif defaults.",
    chain: [
      "millar-web-workflow",
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
    ],
    outcome: "Researches any named brand (or bans all 4 AI ruts for greenfield), ships >= 9.0/10 photography or 4-layer procedural plates with Zero-Addition Pass 2 polish, and passes independent 5-layer QA.",
  },
  {
    id: "photo-free",
    label: "Photo-Free Hahlex Launch",
    title: "Photo-Free Hahlex Marketing Launch (Measured Warmth)",
    problem: "Need an editorial, finished Hahlex Marketing website with zero photography supplied.",
    chain: ["millar-web-workflow", "millar-design", "millar-create-image", "millar-animation", "millar-build-web", "millar-verify-web"],
    outcome: "Queries live Millar MCP tokens, 6 Composition Patterns, 14 code-native SVG/CSS/Canvas visual assets + 4-layer procedural craft plates, clean RSC builds, and 5-layer Playwright QA.",
  },
  {
    id: "track-s",
    label: "Track S: Surgical Fix / App UI",
    title: "Track S: Surgical Bug Fix, Component Update, or Product Screen",
    problem: "Small focused UI change or dense zero-gradient Product screen needing zero scope creep and deterministic mechanical verification.",
    chain: ["millar-web-workflow", "millar-build-web", "millar-verify-web"],
    outcome: "Enforces minimal-change diff restraint, solid zero-gradient primitives, real interactive states, scripts/millar-audit.mjs, and focused 2-axis sign-off.",
  },
] as const;

export default function SkillsResourcePage() {
  const [installMode, setInstallMode] = useState<keyof typeof INSTALL_PROMPTS>("mcp");
  const [recipeId, setRecipeId] = useState<(typeof RECIPES)[number]["id"]>("track-m");
  const [activeSkillTab, setActiveSkillTab] = useState<string>("millar-web-workflow");

  const activeInstall = INSTALL_PROMPTS[installMode];
  const activeRecipe = RECIPES.find((r) => r.id === recipeId) ?? RECIPES[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Resources"
        title="Millar Agent Skills Suite"
        description="Seven composable v0.2.0 web engineering & design skills distilling Anthropic canvas-design, Impeccable craft floor, Matt Pocock engineering discipline, and Agency Agents roles. Brand-research-first, English-prompted, bundled inside Millar MCP, and runnable standalone with scripts/millar-audit.mjs."
        badges={[
          { label: "7 Composable Skills", tone: "brand" },
          { label: "17 Playbooks + Audit CLI", tone: "sage" },
          { label: "v0.2.0 · Track S · M · L", tone: "neutral" },
        ]}
        importPath="millar://skills"
      />

      {/* Short Ready-to-Send English Install Prompts */}
      <SpecimenFrame
        title="Quick Install Prompts (Copy & Send to Any AI Agent)"
        description="Installing Millar MCP already includes all 7 skills bundled. Choose standalone skills only if you do not want the MCP server."
        toolbar={
          <ChoiceToggle
            label="Install mode"
            value={installMode}
            onChange={setInstallMode}
            options={[
              { value: "mcp", label: "Install MCP (Includes 7 Skills)" },
              { value: "skills", label: "Install 7 Skills Only" },
            ]}
          />
        }
        code={activeInstall.code}
        codeTitle={`Prompt · ${activeInstall.label}`}
        wrapCode
      >
        <Alert tone="info" title={activeInstall.label} message={activeInstall.note} />
      </SpecimenFrame>

      {/* Interactive Scenario & Track Planner */}
      <SpecimenFrame
        title="Interactive Track & Skill Combination Planner"
        description="Select your project track to view the gated workflow from Brand-First Research through Zero-MCP Audit & Fresh-Context Finish Review."
        toolbar={
          <ChoiceToggle
            label="Project scenario"
            value={recipeId}
            onChange={setRecipeId}
            options={RECIPES.map((r) => ({ value: r.id, label: r.label }))}
          />
        }
        code={`# Standalone skills only (includes references/ and scripts/millar-audit.mjs)
npx skills add https://github.com/hahlex/millar

# Or invoke directly via Millar MCP (all 7 skills are bundled inside MCP)
list_skills()
${activeRecipe.chain.map((s) => `get_skill({ name: "${s}", includeAllReferences: true })`).join("\n")}`}
        codeTitle={`CLI & MCP Pipeline · ${activeRecipe.label}`}
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
          Inspect All 7 Skills, 17 Playbooks &amp; Standalone Audit CLI
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
                  caption={`${skill.name} bundled playbooks & scripts`}
                  columns={[
                    { key: "file", header: "Bundled File" },
                    { key: "purpose", header: "Purpose" },
                  ]}
                  rows={skill.references.map((r) => ({ id: r.file, ...r }))}
                  rowKey={(r) => r.id}
                />

                <CodeCopyBox title={`${skill.name} · Example Prompt`} code={skill.promptExample} wrap />
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
            { key: "images", header: "Visual & QA Path" },
            { key: "mcp", header: "MCP Access" },
          ]}
          rows={[
            {
              id: "agy",
              agent: "Antigravity (Agy)",
              skills: "Native SKILL.md in ~/.gemini/config/skills/ or MCP get_skill",
              images: "image-generator + 4-layer procedural craft + scripts/millar-audit.mjs + Fresh Reviewer",
              mcp: "13 Tools · 10 Prompts · millar://skills/*",
            },
            {
              id: "claude",
              agent: "Claude Code",
              skills: "npx skills add / .claude/skills/ or MCP Prompts",
              images: "Image MCP + HTML5 Canvas/Python plates + scripts/millar-audit.mjs + Fresh Subagent",
              mcp: "stdio / Streamable HTTP (full Resources + Prompts)",
            },
            {
              id: "codex",
              agent: "OpenAI Codex",
              skills: ".codex/skills/ or MCP list_skills / get_skill tools",
              images: "Native image gen + procedural plates + scripts/millar-audit.mjs + Playwright E2E",
              mcp: "Flat JSON Schema Tools (13 read-only tools)",
            },
            {
              id: "cursor",
              agent: "Cursor / VS Code",
              skills: ".cursor/skills/ or MCP Resources + Tools",
              images: "English Prompt Packet + procedural plates + scripts/millar-audit.mjs",
              mcp: "stdio / HTTP MCP server",
            },
          ]}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
