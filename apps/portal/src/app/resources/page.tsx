"use client";

import React from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Alert, Badge, Button, Card, DataTable, IconDownload } from "@hahlex/millar-ui";
import { CodeCopyBox, LifecycleBadge } from "@/components/CodeCopyBox";

const MCP_TOOLS = [
  { name: "get_design_guidelines", kind: "Guidelines", desc: "Retrieve Shared, Marketing, or Product guidelines, invariants, and Do/Don't." },
  { name: "get_design_tokens", kind: "Tokens", desc: "Query resolved W3C DTCG 2025.10 tokens by category, theme, and output format." },
  { name: "search_components", kind: "Product UI", desc: "Compact search across accessible UI primitives with lifecycle status." },
  { name: "get_component", kind: "Product UI", desc: "Full props API, invalid-prop guardrails, ARIA/keyboard contract, and source code." },
  { name: "search_sections", kind: "Marketing", desc: "Find photo-free Marketing sections by narrative goal and composition pattern." },
  { name: "get_section", kind: "Marketing", desc: "Full section anatomy, visual assets used, responsive rules, and React code." },
  { name: "search_templates", kind: "Templates", desc: "Search Marketing Page Templates and Product Application Templates." },
  { name: "get_template", kind: "Templates", desc: "Retrieve complete multi-section template structure and starter code." },
  { name: "get_visual_assets", kind: "Visual System", desc: "Retrieve CSS/SVG/Canvas/React visual assets with gradientPolicy & props." },
  { name: "get_motion_presets", kind: "Motion", desc: "Retrieve Productive & Expressive curves, durations, and reduced-motion fallbacks." },
  { name: "validate_design", kind: "Compliance", desc: "Splits deterministic automatedChecks from advisory humanReviewCriteria." },
];

const MCP_RESOURCES = [
  { uri: "millar://guidelines/invariants", mime: "text/markdown", purpose: "Hard invariants (typography, gradient boundary, em-dash scope, lifecycle)." },
  { uri: "millar://guidelines/{register}", mime: "text/markdown", purpose: "Canonical rules for shared, marketing, or product registers." },
  { uri: "millar://brand/identity", mime: "application/json", purpose: "Canonical Vector SVG marks + Geist 600 wordmark spec." },
  { uri: "millar://tokens/dtcg", mime: "application/design-tokens+json", purpose: "Raw W3C DTCG 2025.10 token tree." },
  { uri: "millar://tokens/resolved/{theme}", mime: "application/json", purpose: "Resolved light or dark tokens with WCAG contrast checks." },
  { uri: "millar://registry/index", mime: "application/json", purpose: "Lightweight catalog index of all components, assets, sections, templates." },
  { uri: "millar://components/{id}", mime: "application/json", purpose: "Individual Product/Shared component contract." },
  { uri: "millar://sections/{id}", mime: "application/json", purpose: "Individual Marketing section spec." },
  { uri: "millar://visual-assets/{id}", mime: "application/json", purpose: "Individual code-native Visual Asset spec." },
  { uri: "millar://glossary", mime: "text/markdown", purpose: "Canonical Millar domain terminology." },
];

export default function ResourcesPage() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px clamp(16px, 4vw, 32px) 96px", display: "flex", flexDirection: "column", gap: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 800 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <LifecycleBadge status="draft" />
          <Badge tone="neutral" dot={false}>MCP Spec 2026-07-28</Badge>
        </div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 4.5vw, 3.25rem)", fontWeight: 300, lineHeight: "var(--leading-display-hero)" }}>
          Resources, Brand Downloads &amp; Millar MCP Server
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-lead)", color: "var(--fg-muted)", lineHeight: 1.55 }}>
          Download canonical vector brand marks and posters, connect Claude Code, Cursor, VS Code, or Antigravity to the Millar MCP Server, and review versioning and security cutover gates.
        </p>
      </div>

      {/* 1. Brand Asset Downloads */}
      <section aria-labelledby="downloads-heading" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h2 id="downloads-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
          Brand Asset Downloads
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { label: "Brand Mark (Color SVG)", href: "/millar/brand/hahlex-mark-color.svg", meta: "Canonical vector · 300x282" },
            { label: "Brand Mark (On Light SVG)", href: "/millar/brand/hahlex-mark-on-light.svg", meta: "High-contrast espresso" },
            { label: "Brand Mark (On Dark SVG)", href: "/millar/brand/hahlex-mark-on-dark.svg", meta: "Warm ivory + sand" },
            { label: "Brand Mark (Monochrome SVG)", href: "/millar/brand/hahlex-mark-monochrome.svg", meta: "Uses currentColor" },
            { label: "Measured Warmth Poster (PNG)", href: "/millar/brand/measured-warmth-poster.png", meta: "1600x2133 specimen plate" },
            { label: "Measured Warmth Poster (PDF)", href: "/millar/brand/measured-warmth-poster.pdf", meta: "A4 crisp vector PDF" },
          ].map((file) => (
            <Card key={file.href} surface="base" padding="compact">
              <strong style={{ fontSize: "var(--text-body-sm)" }}>{file.label}</strong>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>{file.meta}</span>
              <div>
                <a href={file.href} download style={{ textDecoration: "none" }}>
                  <Button variant="white" size="sm" icon={<IconDownload size="sm" />}>
                    Download
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Millar MCP Server Integration */}
      <section aria-labelledby="mcp-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 id="mcp-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
          Millar MCP Server (@hahlex/millar-mcp)
        </h2>
        <p style={{ margin: 0, maxWidth: "70ch", fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
          Served directly from the same compiled SSoT registry as this Portal. Supports stdio (Claude Code, Cursor, VS Code, Antigravity) and Streamable HTTP transports, exposing 11 Tools, cacheable millar:// Resources, and 3 slash Prompts.
        </p>

        <CodeCopyBox
          title="mcp-config.json (Claude Code · Cursor · VS Code · Antigravity)"
          language="json"
          code={JSON.stringify(
            {
              mcpServers: {
                millar: {
                  command: "node",
                  args: ["D:/projects/millar/packages/mcp/dist/stdio.js"],
                },
              },
            },
            null,
            2,
          )}
        />

        <DataTable
          caption="11 MCP Tools (all readOnlyHint: true, idempotentHint: true, dual text + structuredContent)"
          columns={[
            { key: "name", header: "Tool Name" },
            { key: "kind", header: "Domain" },
            { key: "desc", header: "Capability" },
          ]}
          rows={MCP_TOOLS}
          rowKey={(r) => r.name}
        />

        <DataTable
          caption="MCP Resources (millar:// RFC 3986 URIs & RFC 6570 Templates)"
          columns={[
            { key: "uri", header: "Resource URI" },
            { key: "mime", header: "MIME Type" },
            { key: "purpose", header: "Purpose" },
          ]}
          rows={MCP_RESOURCES}
          rowKey={(r) => r.uri}
        />
      </section>

      {/* 3. Versioning, Changelog & Production Security Gate */}
      <section aria-labelledby="changelog-heading" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 id="changelog-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
          Changelog, Governance &amp; Production Cutover Gate
        </h2>
        <Alert
          tone="warning"
          title="Mandatory Pre-Production Security Gate (ADR-0003)"
          message="Before wiring hahlex.com/millar into production traffic, Keystatic CMS must be isolated to its own dedicated origin (e.g., cms.hahlex.com or HttpOnly backend boundary). CSP headers are defense-in-depth only and never replace origin isolation."
        />
        <Card surface="base" padding="default">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <strong>v{registry.version}</strong>
            <LifecycleBadge status="draft" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>2026-11-25</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.65 }}>
            <li>Initialized standalone monorepo at d:\projects\millar with W3C DTCG 2025.10 SSoT compiler (80/80 WCAG AA contrast pairs, Machado CVD min Delta-E 11.13).</li>
            <li>Shipped @hahlex/millar-ui accessible Product primitives, Ant Design 6 literal theme adapter, and decoupled @hahlex/millar-domain-education extension.</li>
            <li>Shipped @hahlex/millar-marketing with 6 diverse Composition Patterns, 12 code-native zero-photo Visual Assets, Expressive/Productive Motion, 10 Sections, and 4 Page/App Templates.</li>
            <li>Planned for v0.2 (honestly tracked, not stubbed): interactive Figma Tokens Studio sync adapter, expanded data-viz chart primitives, and public production cutover post CMS origin isolation.</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
