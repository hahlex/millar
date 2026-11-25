"use client";

import React from "react";
import { DataTable } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

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
  { name: "list_skills", kind: "Agent Skills", desc: "Lists the 4 composable Millar Skills (millar-design, millar-deep-research, millar-create-image, millar-animation) and recipes." },
  { name: "get_skill", kind: "Agent Skills", desc: "Retrieves full SKILL.md instructions and progressive-disclosure reference playbooks for any Millar Skill." },
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
  { uri: "millar://skills", mime: "application/json", purpose: "Index of all 4 composable Millar Agent Skills and combination recipes." },
  { uri: "millar://skills/{name}", mime: "text/markdown", purpose: "Full SKILL.md playbook for millar-design, millar-deep-research, millar-create-image, or millar-animation." },
  { uri: "millar://skills/{name}/references/{ref}", mime: "text/markdown", purpose: "Progressive-disclosure reference docs bundled inside each skill." },
  { uri: "millar://glossary", mime: "text/markdown", purpose: "Canonical Millar domain terminology." },
  { uri: "millar://changelog", mime: "text/markdown", purpose: "Millar versioning and release changelog." },
];

export default function McpResourcePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Resources"
        title="Millar MCP Server & AI Agents"
        description="Served from the exact same compiled SSoT registry as this Portal, with all 4 Millar Agent Skills bundled offline. Supports stdio (Claude Code, Cursor, VS Code, Antigravity, Codex) and Streamable HTTP transports."
        badges={[{ label: "MCP 2026-07-28", tone: "neutral" }, { label: "13 Tools · 4 Bundled Skills · 7 Prompts", tone: "brand" }]}
        importPath="@hahlex/millar-mcp"
      />

      <SpecimenFrame
        title="Client Configuration (stdio & Streamable HTTP)"
        description="Connect any MCP-compatible IDE or coding agent in seconds."
        code={JSON.stringify(
          {
            mcpServers: {
              millar: {
                command: "node",
                args: ["d:/projects/millar/packages/mcp/dist/stdio.js"],
              },
            },
          },
          null,
          2,
        )}
        codeTitle="mcp-config.json (Claude Code · Cursor · VS Code · Antigravity)"
      >
        <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.6 }}>
          For shared team deployments over HTTP, run <code>PORT=3105 node packages/mcp/dist/http.js</code> and point clients to <code>http://127.0.0.1:3105/mcp</code>. Verify locally via <code>pnpm run test:mcp-stdio</code>.
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
