"use client";

import React from "react";
import Link from "next/link";
import { DocHeader } from "@/components/DocPrimitives";
import { SIDEBAR_GROUPS } from "@/lib/navigation";

export default function FoundationsIndexPage() {
  const group = SIDEBAR_GROUPS.find((g) => g.title === "Foundations");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <DocHeader
        section="Foundations"
        title="Shared Foundations"
        description="Product-agnostic primitives shared across every Hahlex surface: Brand & Logo, Colors & Themes, Typography, Spacing & Surface Roles, Semantic Iconography, and W3C DTCG 2025.10 Design Tokens."
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
