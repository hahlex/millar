"use client";

import React from "react";
import Link from "next/link";
import { DocHeader } from "@/components/DocPrimitives";
import { SIDEBAR_GROUPS } from "@/lib/navigation";

export default function MarketingIndexPage() {
  const group = SIDEBAR_GROUPS.find((g) => g.title === "Marketing");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <DocHeader
        section="Marketing"
        title="Marketing Design System"
        description="Photo-free visual craft, 6 diverse Composition Patterns, 14 code-native Visual Assets, Expressive Motion, 10 Sections, Page Templates, and Visual Do's & Don'ts."
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
