"use client";

import React, { useState } from "react";
import { Alert, DataTable } from "@hahlex/millar-ui";
import { CodeCopyBox } from "@/components/CodeCopyBox";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

const MCP_INSTALL_PROMPT = `Add the Millar MCP server ("millar") to my MCP config using command "npx" and args ["-y", "@hahlex/millar-mcp@draft"] (all 7 Millar Skills are bundled inside MCP). Verify by calling list_skills() and get_design_guidelines(register="shared").`;

const MCP_PROMPTS_CATALOG = [
  {
    name: "millar-web-workflow",
    args: "request, track?, lang?",
    prompt:
      "Invoke MCP prompt millar-web-workflow (track='L'): research any named brand first, classify Track S/M/L, run Creative Divergence, orchestrate all 7 skills, and pass millar-verify-web.",
  },
  {
    name: "millar-design",
    args: "brief, existingAssets?, lang?",
    prompt:
      "Invoke MCP prompt millar-design: research any named brand first, lock a 12-axis .millar/style-dna.md contract, and sync every secondary page to hero visuals (>= 4/5 continuity).",
  },
  {
    name: "millar-deep-research",
    args: "topic, existingAssets?, lang?",
    prompt:
      "Invoke MCP prompt millar-deep-research: research the named brand from primary sources, extract Visual/Motion DNA from supplied assets, and save .millar/research-dossier.md in English.",
  },
  {
    name: "millar-create-image",
    args: "subject, styleContext?, lang?",
    prompt:
      "Invoke MCP prompt millar-create-image: write concise 150-250 word English prompts (human editorial photo or 4-layer procedural craft on 503), save .prompt.json provenance, and run Zero-Addition Pass 2 polish.",
  },
  {
    name: "millar-animation",
    args: "target, motionFeel?, lang?",
    prompt:
      "Invoke MCP prompt millar-animation: lock a 4-line Motion Thesis and ship GPU compositor springs, View Transitions, and static-first prefers-reduced-motion in the same edit.",
  },
  {
    name: "millar-build-web",
    args: "scope, minimalChange?, lang?",
    prompt:
      "Invoke MCP prompt millar-build-web: implement Server-First components, deep modules, 5 real UI states, browser surface theming, and Core Web Vitals / SEO hygiene.",
  },
  {
    name: "millar-verify-web",
    args: "target, lang?",
    prompt:
      "Invoke MCP prompt millar-verify-web: run scripts/millar-audit.mjs (+ validate_design), verify Playwright E2E, 1440/768/375 Light & Dark visuals, axe-core WCAG AA, and delegate Layer 3B + Layer 5 to a fresh-context finish reviewer.",
  },
  {
    name: "millar-build-marketing",
    args: "feature, lang?",
    prompt:
      "Invoke MCP prompt millar-build-marketing: query live Millar MCP tokens, combine >= 3 Composition Patterns with code-native Visual Assets, and validate via validate_design.",
  },
  {
    name: "millar-build-product",
    args: "screen, lang?",
    prompt:
      "Invoke MCP prompt millar-build-product: build a crisp zero-gradient WCAG 2.1/2.2 AA Hahlex Product screen using @hahlex/millar-ui primitives and verify with validate_design.",
  },
  {
    name: "millar-audit-code",
    args: "register, lang?",
    prompt:
      "Invoke MCP prompt millar-audit-code: run validate_design + scripts/millar-audit.mjs, reporting deterministic automatedChecks separately from advisory humanReviewCriteria.",
  },
] as const;

const MCP_TOOLS = [
  { name: "get_design_guidelines", kind: "Guidelines", desc: "Retrieve Shared, Marketing, or Product guidelines, invariants, and Do/Don't." },
  { name: "get_design_tokens", kind: "Tokens", desc: "Query resolved W3C DTCG 2025.10 tokens by category, theme, and register." },
  { name: "search_components", kind: "Product UI", desc: "Compact search across accessible UI primitives with lifecycle status." },
  { name: "get_component", kind: "Product UI", desc: "Full props API, invalid-prop guardrails, ARIA/keyboard contract, and source code." },
  { name: "search_sections", kind: "Marketing", desc: "Find photo-free Marketing sections by narrative goal and composition pattern." },
  { name: "get_section", kind: "Marketing", desc: "Full section anatomy, visual assets used, responsive rules, and React code." },
  { name: "search_templates", kind: "Templates", desc: "Search Marketing Page Templates and Product Application Templates." },
  { name: "get_template", kind: "Templates", desc: "Retrieve complete multi-section template structure and starter code." },
  { name: "get_visual_assets", kind: "Visual System", desc: "Retrieve CSS/SVG/Canvas/React visual assets with gradientPolicy & props." },
  { name: "get_motion_presets", kind: "Motion", desc: "Retrieve Productive & Expressive curves, durations, and reduced-motion fallbacks." },
  { name: "validate_design", kind: "Compliance", desc: "Splits deterministic automatedChecks from advisory humanReviewCriteria." },
  { name: "list_skills", kind: "Agent Skills", desc: "Lists all 7 composable Millar v0.2.0 web & design skills and Track S/M/L recipes." },
  { name: "get_skill", kind: "Agent Skills", desc: "Retrieves full SKILL.md instructions and progressive-disclosure playbooks for any of the 7 Millar Skills." },
];

const MCP_RESOURCES = [
  { uri: "millar://guidelines/invariants", mime: "text/markdown", purpose: "Hard invariants (typography, gradient boundary, em-dash scope, lifecycle)." },
  { uri: "millar://guidelines/{register}", mime: "text/markdown", purpose: "Canonical rules for shared, marketing, or product registers." },
  { uri: "millar://brand/identity", mime: "application/json", purpose: "Canonical Vector SVG marks + Geist 600 wordmark spec." },
  { uri: "millar://tokens/dtcg", mime: "application/design-tokens+json", purpose: "Raw W3C DTCG 2025.10 token tree." },
  { uri: "millar://tokens/resolved/{theme}", mime: "application/json", purpose: "Resolved light or dark tokens with WCAG contrast checks." },
  { uri: "millar://tokens/resolved/{theme}/{register}", mime: "application/json", purpose: "Resolved tokens scoped by theme and register (shared|product|marketing)." },
  { uri: "millar://registry/index", mime: "application/json", purpose: "Lightweight catalog index of all components, patterns, assets, sections, templates." },
  { uri: "millar://components/{id}", mime: "application/json", purpose: "Individual Product/Shared component contract." },
  { uri: "millar://composition-patterns/{id}", mime: "application/json", purpose: "Individual Marketing Composition Pattern spatial grammar." },
  { uri: "millar://visual-assets/{id}", mime: "application/json", purpose: "Individual code-native Visual Asset spec & gradientPolicy." },
  { uri: "millar://sections/{id}", mime: "application/json", purpose: "Individual Marketing section spec & reduced-motion fallback." },
  { uri: "millar://templates/{id}", mime: "application/json", purpose: "Individual Page or Application Template spec." },
  { uri: "millar://motion-presets/{id}", mime: "application/json", purpose: "Individual Productive or Expressive motion curve." },
  { uri: "millar://skills", mime: "application/json", purpose: "Index of all 7 composable Millar Agent Skills v0.2.0 and Track S/M/L recipes." },
  { uri: "millar://skills/{name}", mime: "text/markdown", purpose: "Full SKILL.md playbook for any of the 7 Millar skills." },
  { uri: "millar://skills/{name}/references/{ref}", mime: "text/markdown", purpose: "17 progressive-disclosure playbooks (including human photography & procedural craft)." },
  { uri: "millar://glossary", mime: "text/markdown", purpose: "Canonical Millar domain terminology." },
  { uri: "millar://changelog", mime: "text/markdown", purpose: "Millar versioning and release changelog." },
];

export default function McpResourcePage() {
  const [selectedPromptName, setSelectedPromptName] = useState<(typeof MCP_PROMPTS_CATALOG)[number]["name"]>("millar-web-workflow");

  const selectedPrompt = MCP_PROMPTS_CATALOG.find((p) => p.name === selectedPromptName) ?? MCP_PROMPTS_CATALOG[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Resources"
        title="Millar MCP Server & AI Agents"
        description="Served from the same compiled SSoT registry as this Portal, with all 7 Millar Agent Skills (v0.2.0) and 17 playbooks bundled inside MCP. Supports stdio and Streamable HTTP transports."
        badges={[
          { label: "MCP 2026-07-28", tone: "neutral" },
          { label: "13 Tools · 7 Bundled Skills · 10 Prompts", tone: "brand" },
        ]}
        importPath="@hahlex/millar-mcp"
      />

      <SpecimenFrame
        title="Quick Connect Prompt (Includes All 7 Skills)"
        description="Copy and send to Antigravity, Claude Code, Codex, or Cursor to install @hahlex/millar-mcp and verify immediately."
        code={MCP_INSTALL_PROMPT}
        codeTitle="Prompt · Install Millar MCP (Includes 7 Skills)"
        wrapCode
      >
        <Alert
          tone="info"
          title="One install covers MCP + all 7 Millar Skills"
          message="Millar MCP ships all 7 skills and 17 playbooks offline via list_skills(), get_skill(), and millar://skills/*. No separate skills install required."
        />
      </SpecimenFrame>

      {/* 10 Concise English MCP Prompts Inspector */}
      <SpecimenFrame
        title="10 Concise English MCP Prompts"
        description="All agent and image-generation prompts execute in English for peak model fidelity. Pass optional lang='vi' when you want user-facing replies and rendered UI/artwork copy in Vietnamese."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MCP_PROMPTS_CATALOG.map((item) => (
              <button
                key={item.name}
                type="button"
                aria-pressed={item.name === selectedPrompt.name}
                onClick={() => setSelectedPromptName(item.name)}
                className="millar-focus"
                style={{
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${item.name === selectedPrompt.name ? "var(--tone-brand-border)" : "var(--border-default)"}`,
                  backgroundColor: item.name === selectedPrompt.name ? "var(--tone-brand-soft)" : "var(--bg-surface)",
                  color: item.name === selectedPrompt.name ? "var(--tone-brand-fg)" : "var(--fg-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-micro)",
                  fontWeight: item.name === selectedPrompt.name ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {item.name}
              </button>
            ))}
          </div>

          <CodeCopyBox title={`${selectedPrompt.name} (${selectedPrompt.args})`} code={selectedPrompt.prompt} wrap />
        </div>
      </SpecimenFrame>

      <SpecimenFrame
        title="Manual Client Configuration (stdio & Streamable HTTP)"
        description="Or paste this JSON directly into your IDE MCP settings."
        code={JSON.stringify(
          {
            mcpServers: {
              millar: {
                command: "npx",
                args: ["-y", "@hahlex/millar-mcp@draft"],
              },
            },
          },
          null,
          2,
        )}
        codeTitle="mcp-config.json (Claude Code · Cursor · VS Code · Antigravity · Codex)"
      >
        <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.6 }}>
          For local monorepo usage without npm, set <code>command: &quot;node&quot;</code> and <code>args: [&quot;d:/projects/millar/packages/mcp/dist/stdio.js&quot;]</code>. For shared team deployments over HTTP, run <code>PORT=3105 node packages/mcp/dist/http.js</code> and point clients to <code>http://127.0.0.1:3105/mcp</code>.
        </p>
      </SpecimenFrame>

      <DataTable
        caption="13 Read-Only MCP Tools (11 Design System SSoT tools + 2 Millar Agent Skills tools)"
        columns={[
          { key: "name", header: "Tool Name" },
          { key: "kind", header: "Scope" },
          { key: "desc", header: "Capability" },
        ]}
        rows={MCP_TOOLS.map((t) => ({ ...t, id: t.name }))}
        rowKey={(r) => r.id}
      />

      <DataTable
        caption="Canonical MCP Resources (millar:// URI scheme)"
        columns={[
          { key: "uri", header: "Resource URI" },
          { key: "mime", header: "MIME Type" },
          { key: "purpose", header: "Purpose" },
        ]}
        rows={MCP_RESOURCES.map((r) => ({ ...r, id: r.uri }))}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
