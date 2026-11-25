"use client";

import React from "react";
import Link from "next/link";
import { DocHeader } from "@/components/DocPrimitives";
import { SIDEBAR_GROUPS } from "@/lib/navigation";

export default function ProductComponentsIndexPage() {
  const group = SIDEBAR_GROUPS.find((g) => g.title === "Components");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <DocHeader
        section="Components"
        title="Product & App Components"
        description="Accessible React UI primitives hardened to WCAG 2.1/2.2 AA, zero-gradient operational templates, Ant Design 6 theme parity, and the isolated Education extension pack."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
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
