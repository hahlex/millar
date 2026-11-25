"use client";

import React from "react";
import Link from "next/link";
import { DocHeader } from "@/components/DocPrimitives";
import { SIDEBAR_GROUPS } from "@/lib/navigation";

export default function ResourcesIndexPage() {
  const group = SIDEBAR_GROUPS.find((g) => g.title === "Resources");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <DocHeader
        section="Resources"
        title="Resources, Brand Downloads & MCP"
        description="Official Brand & PWA downloads, Millar MCP Server setup for AI coding agents, and release governance documentation."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {group?.items.map((item) => (
          <Link key={item.href} href={item.href} className="portal-directory-card millar-focus" style={{ padding: 18, gap: 6 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title)", fontWeight: 600 }}>{item.label}</strong>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>{item.href}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
