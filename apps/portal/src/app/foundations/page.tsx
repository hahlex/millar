"use client";

import React, { useMemo, useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, Button, Card, ChoiceToggle, FilterBar, IconCheck, IconCopy, MILLAR_CORE_ICONS } from "@hahlex/millar-ui";
import { HahlexLockup, HahlexMark, type BrandMarkVariant } from "@hahlex/millar-marketing";
import { CodeCopyBox, LifecycleBadge } from "@/components/CodeCopyBox";

export default function FoundationsPage() {
  const [tokenTheme, setTokenTheme] = useState<"light" | "dark">("light");
  const [tokenQuery, setTokenQuery] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [typeWeight, setTypeWeight] = useState<number>(300);
  const [typeLocaleSample, setTypeLocaleSample] = useState<"en" | "vi">("vi");
  const [iconQuery, setIconQuery] = useState("");
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  const activeTokens = useMemo(() => {
    const list = tokenTheme === "dark" ? registry.tokens.dark : registry.tokens.light;
    const q = tokenQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.cssVar.toLowerCase().includes(q) ||
        t.path.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.value.toLowerCase().includes(q),
    );
  }, [tokenTheme, tokenQuery]);

  const iconEntries = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    return Object.entries(MILLAR_CORE_ICONS).filter(([name]) => !q || name.toLowerCase().includes(q));
  }, [iconQuery]);

  const copyText = async (val: string, key: string, setter: (v: string | null) => void) => {
    try {
      await navigator.clipboard.writeText(val);
      setter(key);
      setTimeout(() => setter(null), 1500);
    } catch {
      setter(null);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px clamp(16px, 4vw, 32px) 96px", display: "flex", flexDirection: "column", gap: 56 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 780 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <LifecycleBadge status="draft" />
          <Badge tone="neutral" dot={false}>
            W3C DTCG {registry.dtcgSpecVersion}
          </Badge>
          <Badge tone="success">{registry.contrastSummary.passed}/{registry.contrastSummary.totalChecked} WCAG AA Pass</Badge>
        </div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 4.5vw, 3.25rem)", fontWeight: 300, lineHeight: "var(--leading-display-hero)" }}>
          Shared Foundations
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-lead)", color: "var(--fg-muted)", lineHeight: 1.55 }}>
          Product-agnostic brand identity, unified typography, OKLCH-calibrated Warm Sand and Espresso color tokens, surface roles, 1.5px semantic iconography, and WCAG 2.1/2.2 AA accessibility standards shared across every Hahlex surface.
        </p>
      </div>

      {/* 1. Brand Identity, Canonical Vector Mark & Geist 600 Wordmark */}
      <section aria-labelledby="brand-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 id="brand-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
              Brand Identity &amp; Canonical Vector Mark
            </h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
              Normalized symmetric Arch + 3 Pillars vector SVG paired with canonical Title Case Hahlex in Geist 600 (-0.02em tracking).
            </p>
          </div>
          <a href="/millar/brand/hahlex-mark-color.svg" download style={{ textDecoration: "none" }}>
            <Button variant="white" size="sm">
              Download Color SVG
            </Button>
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {(
            [
              { variant: "color" as BrandMarkVariant, label: "Color Mark", bg: "#FFFCF8", fg: "#2B1F16", border: "#EBE3D7" },
              { variant: "on-light" as BrandMarkVariant, label: "On Light (High Contrast)", bg: "#FFFFFF", fg: "#2B1F16", border: "#EBE3D7" },
              { variant: "on-dark" as BrandMarkVariant, label: "On Dark (Espresso Stage)", bg: "#1A130D", fg: "#FFF8F0", border: "#3E3128" },
              { variant: "monochrome" as BrandMarkVariant, label: "Monochrome (currentColor)", bg: "#F6EBDE", fg: "#4A3022", border: "#E4CBAF" },
            ] as const
          ).map((item) => (
            <div
              key={item.variant}
              style={{
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${item.border}`,
                backgroundColor: item.bg,
                color: item.fg,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
              }}
            >
              <HahlexMark variant={item.variant} size={56} />
              <HahlexLockup variant={item.variant} size={22} color={item.fg} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", opacity: 0.85 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Interactive Bilingual Typography Specimen (EN + Vietnamese Diacritic Safety) */}
      <section aria-labelledby="type-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 id="type-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
              Interactive Typography &amp; Vietnamese Diacritic Specimen
            </h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
              Geist Sans (300-400 Display, 500-600 operational headings) + Inter (Body/UI) + Geist Mono (Code). Toggle VI/EN to inspect :root:lang(vi) headroom.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <ChoiceToggle
              label="Specimen weight"
              value={String(typeWeight)}
              onChange={(w) => setTypeWeight(Number(w))}
              options={[
                { value: "300", label: "300 Light" },
                { value: "400", label: "400 Regular" },
                { value: "500", label: "500 Medium" },
                { value: "600", label: "600 Semibold" },
              ]}
            />
            <ChoiceToggle
              label="Specimen script"
              value={typeLocaleSample}
              onChange={setTypeLocaleSample}
              options={[
                { value: "vi", label: "Tiếng Việt" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        </div>

        <Card surface="base" padding="default">
          <div lang={typeLocaleSample} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ borderBottom: "1px solid var(--border-soft)", paddingBottom: 18 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>
                Geist Display · weight {typeWeight} · {typeLocaleSample === "vi" ? "leading 1.20 / tracking -0.012em (:lang(vi))" : "leading 1.08 / tracking -0.02em (en)"}
              </span>
              <p
                style={{
                  margin: "8px 0 0",
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: typeWeight,
                  lineHeight: typeLocaleSample === "vi" ? 1.2 : 1.08,
                  letterSpacing: typeLocaleSample === "vi" ? "-0.012em" : "-0.02em",
                  color: "var(--fg-default)",
                }}
              >
                {typeLocaleSample === "vi"
                  ? "Ắn Ẩn Ển Ổn Ẵn Ự: Ngôn ngữ thiết kế ấm áp, chuẩn xác cho hệ sinh thái Hahlex."
                  : "Warm architectural precision across every Hahlex product and editorial page."}
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>
                  --font-sans · Inter 15px / 1.55
                </code>
                <p style={{ margin: "6px 0 0", fontSize: "var(--text-body)", lineHeight: 1.55, color: "var(--fg-muted)" }}>
                  {typeLocaleSample === "vi"
                    ? "Mọi điều khiển giao diện, bảng dữ liệu và văn bản nghiệp vụ sử dụng Inter với độ rõ cao và căn chỉnh chữ số dạng bảng."
                    : "Operational controls, forms, and long-form descriptions rely on Inter with +0.01em optical UI tracking and tabular figures."}
                </p>
              </div>
              <div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>
                  --font-mono · Geist Mono 13px / 1.85
                </code>
                <pre
                  style={{
                    margin: "6px 0 0",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface-2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-meta)",
                    lineHeight: 1.85,
                  }}
                >
                  {"--accent: #4a3022; /* 12.09:1 AAA */\n--text-kpi: 1.5rem; /* tabular-nums */"}
                </pre>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Searchable Color Palettes & DTCG 2025.10 Token Explorer */}
      <section aria-labelledby="tokens-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 id="tokens-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
              Color Palettes &amp; Token Explorer
            </h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
              Compiled directly from W3C DTCG 2025.10 JSON. Click any token to copy its CSS variable. Machado CVD min Delta-E: {registry.colorBlindSummary.minDeltaE}.
            </p>
          </div>
          <ChoiceToggle
            label="Token theme inspect"
            value={tokenTheme}
            onChange={setTokenTheme}
            options={[
              { value: "light", label: "Light Theme" },
              { value: "dark", label: "Dark Theme" },
            ]}
          />
        </div>

        <FilterBar
          searchValue={tokenQuery}
          onSearchChange={setTokenQuery}
          searchPlaceholder="Filter tokens by CSS var, hex, or role (e.g. accent, status, editorial)..."
          activePills={tokenQuery ? [{ key: "q", label: `Filter: ${tokenQuery}`, onRemove: () => setTokenQuery("") }] : []}
          onClearAll={() => setTokenQuery("")}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {activeTokens
            .filter((t) => t.category === "color")
            .map((tok) => {
              const isCopied = copiedToken === tok.cssVar;
              const bestCheck = tok.contrastChecks?.[0];
              return (
                <button
                  key={tok.path}
                  type="button"
                  onClick={() => copyText(`var(${tok.cssVar})`, tok.cssVar, setCopiedToken)}
                  className="millar-focus"
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-default)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--fg-default)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: tok.value,
                        border: "1px solid var(--border-strong)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 600 }}>
                          {tok.cssVar}
                        </code>
                        <span style={{ color: "var(--fg-accent)", display: "inline-flex" }}>
                          {isCopied ? <IconCheck size="sm" /> : <IconCopy size="sm" />}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-subtle)" }}>
                        {tok.value}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>
                      {tok.description.slice(0, 62)}
                    </span>
                    {bestCheck ? (
                      <Badge tone={bestCheck.pass ? "success" : "error"} dot={false}>
                        {bestCheck.ratio}:1
                      </Badge>
                    ) : null}
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      {/* 4. Searchable 1.5px Semantic Iconography */}
      <section aria-labelledby="icons-heading" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <h2 id="icons-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
            Semantic Iconography (1.5px Constant Stroke)
          </h2>
          <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
            Single Lucide semantic registry with absoluteStrokeWidth. Click any icon to copy its React import.
          </p>
        </div>

        <FilterBar
          searchValue={iconQuery}
          onSearchChange={setIconQuery}
          searchPlaceholder="Search semantic icons (e.g. Shield, Palette, Search)..."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 10 }}>
          {iconEntries.map(([name, IconComp]) => (
            <button
              key={name}
              type="button"
              onClick={() => copyText(`import { ${name} } from "@hahlex/millar-ui";`, name, setCopiedIcon)}
              className="millar-focus"
              style={{
                padding: "14px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--fg-default)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconComp size="lg" />
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: copiedIcon === name ? "var(--status-success)" : "var(--fg-muted)" }}>
                {copiedIcon === name ? "Copied!" : name}
              </code>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Shared Invariants & Guidelines */}
      <section aria-labelledby="invariants-heading" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 id="invariants-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
          System Invariants &amp; Tailwind v4 Integration
        </h2>
        <CodeCopyBox
          title="globals.css"
          language="css"
          code={`@import "tailwindcss";\n@import "@hahlex/millar-tokens/tailwind"; /* Uses @theme inline for [data-theme="dark"] */`}
        />
      </section>
    </div>
  );
}
