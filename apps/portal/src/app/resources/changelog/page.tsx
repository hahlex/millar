"use client";

import React from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Alert, Card } from "@hahlex/millar-ui";
import { DocHeader } from "@/components/DocPrimitives";
import { LifecycleBadge } from "@/components/CodeCopyBox";

export default function ChangelogResourcePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Resources"
        title="Changelog, Governance & Security Gates"
        description="Semantic versioning, Draft/Approved/Deprecated lifecycle boundaries, and pre-production deployment security rules for hahlex.com/millar."
      />

      <Alert
        tone="warning"
        title="Mandatory Pre-Production Security Gate (ADR-0003)"
        message="Isolate education-portfolio's Keystatic CMS onto its own dedicated origin (e.g., cms.hahlex.com or HttpOnly backend proxy) BEFORE exposing hahlex.com/millar in production. Never treat CSP headers as a substitute for origin isolation."
      />

      <Card surface="base" padding="default">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)" }}>v{registry.version}</strong>
            <LifecycleBadge status="draft" />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>2026-11-25</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.7 }}>
          <li>Compiled W3C DTCG 2025.10 Single Source of Truth clearing 84/84 WCAG 2.1 AA contrast pairs and Machado CVD minDeltaE 11.13.</li>
          <li>Shipped @hahlex/millar-ui (10 accessible primitive groups, 54 1.5px icons, AntD 6 adapter) and isolated @hahlex/millar-domain-education extension.</li>
          <li>Shipped @hahlex/millar-marketing (6 Composition Patterns, 14 code-native Visual Assets, Expressive/Productive Motion, 10 Sections, 4 Templates, Visual Do&apos;s &amp; Don&apos;ts).</li>
          <li>Shipped @hahlex/millar-validator (11 deterministic checks + CLI) and @hahlex/millar-mcp (11 Tools, 66 Resources, 3 Prompts, stdio + Streamable HTTP).</li>
          <li>Restructured Millar Portal into Geist-style persistent left-sidebar documentation architecture with dedicated routes for every Foundation, Marketing module, and UI Component.</li>
        </ul>
      </Card>

      <Alert
        tone="info"
        title="Lifecycle Governance Rule (AI Agents Draft-Only)"
        message="All v0.1.0 items remain in Draft status until explicitly promoted via human sign-off (approvedBy + ISO approvedAt). CI gate pnpm run check:governance blocks AI self-approval."
      />
    </div>
  );
}
