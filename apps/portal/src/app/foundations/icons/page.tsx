"use client";

import React, { useMemo, useState } from "react";
import { ChoiceToggle, FilterBar, IconBox, IconLayers, IconPalette, IconShield, MILLAR_CORE_ICONS, type MillarIconSize } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function IconsFoundationPage() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<MillarIconSize>("lg");
  const [copied, setCopied] = useState<string | null>(null);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(MILLAR_CORE_ICONS).filter(([name]) => !q || name.toLowerCase().includes(q));
  }, [query]);

  const copyImport = async (name: string) => {
    try {
      await navigator.clipboard.writeText(`import { ${name} } from "@hahlex/millar-ui";`);
      setCopied(name);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Foundations"
        title="Icons"
        description="54 semantic Lucide icons normalized to a constant 1.5px stroke (absoluteStrokeWidth), ensuring uniform visual weight across buttons, tables, navigation rails, and dialogs."
        badges={[{ label: `${Object.keys(MILLAR_CORE_ICONS).length} Icons`, tone: "neutral" }, { label: "1.5px Constant Stroke", tone: "brand" }]}
        importPath="@hahlex/millar-ui"
      />

      <SpecimenFrame
        title="IconBox Surface Tones"
        description="Pair icons inside 36px IconBox tiles when anchoring headers, stats, or empty states."
        code={`import { IconBox, IconShield } from "@hahlex/millar-ui";

<IconBox tone="brand"><IconShield size="md" /></IconBox>`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {(["neutral", "brand", "sand", "sage", "success", "warning", "error"] as const).map((tone) => (
            <div key={tone} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconBox tone={tone}>
                {tone === "brand" ? <IconPalette size="md" /> : tone === "sage" ? <IconLayers size="md" /> : <IconShield size="md" />}
              </IconBox>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>{tone}</code>
            </div>
          ))}
        </div>
      </SpecimenFrame>

      <section aria-labelledby="all-icons-heading" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2
          id="all-icons-heading"
          style={{ margin: 0, scrollMarginTop: 76, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}
        >
          All Semantic Icons ({entries.length})
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <FilterBar
              searchValue={query}
              onSearchChange={setQuery}
              searchPlaceholder="Search semantic icons (e.g. Shield, Search, Close, Layers)..."
            />
          </div>
          <ChoiceToggle
            label="Icon preview size"
            value={size}
            onChange={setSize}
            options={[
              { value: "sm", label: "sm (14px)" },
              { value: "md", label: "md (16px)" },
              { value: "lg", label: "lg (20px)" },
            ]}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(144px, 1fr))", gap: 10 }}>
          {entries.map(([name, IconComp]) => (
            <button
              key={name}
              type="button"
              onClick={() => copyImport(name)}
              className="millar-focus"
              style={{
                padding: "16px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--fg-default)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <IconComp size={size} />
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-micro)",
                  color: copied === name ? "var(--status-success)" : "var(--fg-muted)",
                }}
              >
                {copied === name ? "Copied!" : name}
              </code>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
