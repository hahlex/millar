"use client";

import React from "react";
import { Card, IconDownload } from "@hahlex/millar-ui";
import { DocHeader } from "@/components/DocPrimitives";

const DOWNLOADS = [
  { label: "Brand Mark (Color SVG)", href: "/millar/brand/hahlex-mark-color.svg", meta: "Canonical vector · 300x282" },
  { label: "Brand Mark (On Light SVG)", href: "/millar/brand/hahlex-mark-on-light.svg", meta: "High-contrast espresso" },
  { label: "Brand Mark (On Dark SVG)", href: "/millar/brand/hahlex-mark-on-dark.svg", meta: "Warm ivory + sand" },
  { label: "Brand Mark (Monochrome SVG)", href: "/millar/brand/hahlex-mark-monochrome.svg", meta: "Uses currentColor" },
  { label: "PWA Maskable Icon (192px)", href: "/millar/brand/hahlex-icon-192.png", meta: "PNG · 192x192 safe zone" },
  { label: "PWA Maskable Icon (512px)", href: "/millar/brand/hahlex-icon-512.png", meta: "PNG · 512x512 safe zone" },
  { label: "Measured Warmth Poster (PNG)", href: "/millar/brand/measured-warmth-poster.png", meta: "1600x2133 specimen plate" },
  { label: "Measured Warmth Poster (PDF)", href: "/millar/brand/measured-warmth-poster.pdf", meta: "A4 crisp vector PDF" },
];

export default function DownloadsResourcePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Resources"
        title="Brand Downloads"
        description="Official canonical vector brand marks, safe-zone PWA maskable app icons, and the Measured Warmth specimen poster ready for engineering and brand teams."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {DOWNLOADS.map((file) => (
          <Card key={file.href} surface="base" padding="compact" style={{ height: "100%", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <strong style={{ fontSize: "var(--text-body-sm)" }}>{file.label}</strong>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>{file.meta}</span>
            </div>
            <div style={{ paddingTop: 6 }}>
              <a
                href={file.href}
                download
                className="millar-focus"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--fg-default)",
                  fontSize: "var(--text-meta)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <IconDownload size="sm" />
                <span>Download</span>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
