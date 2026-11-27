"use client";

import React, { useState } from "react";
import { DataTable } from "@hahlex/millar-ui";
import { CodeCopyBox } from "@/components/CodeCopyBox";
import { DocHeader } from "@/components/DocPrimitives";
import { InstallBar } from "@/components/InstallBar";

const MCP_PROMPTS_CATALOG = [
  { name: "millar-web-workflow", args: "request, track?, lang?", prompt: "Run millar-web-workflow (track='L'): research any named brand first, run Creative Divergence, build, and pass millar-verify-web." },
  { name: "millar-design", args: "brief, existingAssets?, lang?", prompt: "Run millar-design: research the brand first, lock .millar/style-dna.md, and sync secondary pages (>= 4/5 continuity)." },
  { name: "millar-deep-research", args: "topic, existingAssets?, lang?", prompt: "Run millar-deep-research: research the brand and extract Visual/Motion DNA into .millar/research-dossier.md." },
  { name: "millar-create-image", args: "subject, styleContext?, lang?", prompt: "Run millar-create-image: concise English prompts, .prompt.json provenance, and 4-layer procedural craft + Pass 2 on 503." },
  { name: "millar-animation", args: "target, motionFeel?, lang?", prompt: "Run millar-animation: lock 4-line Motion Thesis, compositor springs, View Transitions, and prefers-reduced-motion." },
  { name: "millar-build-web", args: "scope, minimalChange?, lang?", prompt: "Run millar-build-web: Server-First slices, deep modules, 5 UI states, browser surface theming, and CWV/SEO." },
  { name: "millar-verify-web", args: "target, lang?", prompt: "Run millar-verify-web: scripts/millar-audit.mjs, Playwright E2E, axe-core WCAG AA, and fresh-context finish reviewer." },
  { name: "millar-autonomous-qa", args: "targetUrl, modes?, lang?", prompt: "Run millar-autonomous-qa on http://localhost:5173: non-prod safety-guard, multi-role/tenant exploration, API/DB/Mailpit/Langfuse outcome verification, and HTML report." },
  { name: "millar-build-marketing", args: "feature, lang?", prompt: "Run millar-build-marketing: query live Millar MCP tokens, >= 3 Composition Patterns, and validate_design." },
  { name: "millar-build-product", args: "screen, lang?", prompt: "Run millar-build-product: zero-gradient WCAG AA @hahlex/millar-ui screen verified via validate_design." },
  { name: "millar-audit-code", args: "register, lang?", prompt: "Run millar-audit-code: validate_design + scripts/millar-audit.mjs separating automated checks from human review." },
] as const;

const MCP_TOOLS = [
  { name: "get_design_guidelines", kind: "Guidelines", desc: "Shared, Marketing, or Product rules & invariants" },
  { name: "get_design_tokens", kind: "Tokens", desc: "Resolved W3C DTCG 2025.10 tokens by theme & register" },
  { name: "search_components", kind: "Product UI", desc: "Search accessible UI primitives" },
  { name: "get_component", kind: "Product UI", desc: "Props API, guardrails, ARIA contract & source" },
  { name: "search_sections", kind: "Marketing", desc: "Find photo-free Marketing sections" },
  { name: "get_section", kind: "Marketing", desc: "Section anatomy, assets & React code" },
  { name: "search_templates", kind: "Templates", desc: "Search Marketing & Product templates" },
  { name: "get_template", kind: "Templates", desc: "Full template structure & starter code" },
  { name: "get_visual_assets", kind: "Visual System", desc: "CSS/SVG/Canvas assets & gradientPolicy" },
  { name: "get_motion_presets", kind: "Motion", desc: "Productive & Expressive curves + reduced-motion" },
  { name: "validate_design", kind: "Compliance", desc: "Automated checks + human review criteria" },
  { name: "list_skills", kind: "Skills", desc: "All 8 bundled Millar skills & workflow recipes" },
  { name: "get_skill", kind: "Skills", desc: "Full SKILL.md & 24 reference playbooks" },
];

const MCP_RESOURCES = [
  { uri: "millar://guidelines/invariants", mime: "text/markdown", purpose: "Hard system invariants" },
  { uri: "millar://guidelines/{register}", mime: "text/markdown", purpose: "Shared, marketing, or product rules" },
  { uri: "millar://brand/identity", mime: "application/json", purpose: "Vector SVG marks & wordmark spec" },
  { uri: "millar://tokens/dtcg", mime: "application/design-tokens+json", purpose: "Raw W3C DTCG 2025.10 tree" },
  { uri: "millar://tokens/resolved/{theme}/{register}", mime: "application/json", purpose: "Resolved tokens + WCAG contrast" },
  { uri: "millar://registry/index", mime: "application/json", purpose: "Catalog index" },
  { uri: "millar://components/{id}", mime: "application/json", purpose: "Component contract" },
  { uri: "millar://visual-assets/{id}", mime: "application/json", purpose: "Code-native visual asset spec" },
  { uri: "millar://sections/{id}", mime: "application/json", purpose: "Marketing section spec" },
  { uri: "millar://templates/{id}", mime: "application/json", purpose: "Page or App template spec" },
  { uri: "millar://skills", mime: "application/json", purpose: "8 bundled Millar skills index" },
  { uri: "millar://skills/{name}", mime: "text/markdown", purpose: "Full SKILL.md playbook" },
  { uri: "millar://skills/{name}/references/{ref}", mime: "text/markdown", purpose: "24 bundled reference playbooks" },
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

export default function McpResourcePage() {
  const [selectedPromptName, setSelectedPromptName] = useState<(typeof MCP_PROMPTS_CATALOG)[number]["name"]>("millar-web-workflow");
  const selectedPrompt = MCP_PROMPTS_CATALOG.find((p) => p.name === selectedPromptName) ?? MCP_PROMPTS_CATALOG[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader section="Resources" title="Millar MCP Server" importPath="@hahlex/millar-mcp" />

      {/* skills.sh-inspired single-line INSTALLATION bar (MCP includes all 8 skills) */}
      <InstallBar label="Installation" defaultTarget="mcp" />

      <section aria-labelledby="mcp-config-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="mcp-config-heading" style={MICRO_HEADING_STYLE}>
          Client Configuration
        </h2>
        <CodeCopyBox
          title="mcp-config.json"
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
        />
      </section>

      <section aria-labelledby="mcp-prompts-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="mcp-prompts-heading" style={MICRO_HEADING_STYLE}>
          11 MCP Prompts
        </h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MCP_PROMPTS_CATALOG.map((item) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={item.name === selectedPrompt.name}
              onClick={() => setSelectedPromptName(item.name)}
              className="millar-focus"
              style={{
                padding: "5px 10px",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${item.name === selectedPrompt.name ? "var(--tone-brand-border)" : "var(--border-default)"}`,
                backgroundColor: item.name === selectedPrompt.name ? "var(--tone-brand-soft)" : "transparent",
                color: item.name === selectedPrompt.name ? "var(--tone-brand-fg)" : "var(--fg-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: item.name === selectedPrompt.name ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <CodeCopyBox title={`${selectedPrompt.name} (${selectedPrompt.args})`} code={selectedPrompt.prompt} wrap />
      </section>

      <section aria-labelledby="mcp-tools-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="mcp-tools-heading" style={MICRO_HEADING_STYLE}>
          13 MCP Tools
        </h2>
        <DataTable
          caption="13 MCP Tools"
          columns={[
            { key: "name", header: "Tool" },
            { key: "kind", header: "Scope" },
            { key: "desc", header: "Role" },
          ]}
          rows={MCP_TOOLS.map((t) => ({ ...t, id: t.name }))}
          rowKey={(r) => r.id}
        />
      </section>

      <section aria-labelledby="mcp-resources-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="mcp-resources-heading" style={MICRO_HEADING_STYLE}>
          MCP Resources
        </h2>
        <DataTable
          caption="MCP Resources"
          columns={[
            { key: "uri", header: "URI" },
            { key: "mime", header: "MIME" },
            { key: "purpose", header: "Purpose" },
          ]}
          rows={MCP_RESOURCES.map((r) => ({ ...r, id: r.uri }))}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
