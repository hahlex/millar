"use client";

import React, { useMemo, useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, ChoiceToggle, FilterBar, IconCheck, IconCopy } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function TokensFoundationPage() {
  const [setKey, setSetKey] = useState<"light" | "dark" | "base" | "registers">("light");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const tokens = useMemo(() => {
    const raw =
      setKey === "dark"
        ? registry.tokens.dark
        : setKey === "base"
          ? registry.tokens.base
          : setKey === "registers"
            ? [...registry.tokens.registers.product, ...registry.tokens.registers.marketing]
            : registry.tokens.light;
    const q = query.trim().toLowerCase();
    return raw.filter(
      (t) =>
        !q ||
        t.cssVar.toLowerCase().includes(q) ||
        t.path.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.value.toLowerCase().includes(q),
    );
  }, [setKey, query]);

  const copyToken = async (cssVar: string) => {
    try {
      await navigator.clipboard.writeText(`var(${cssVar})`);
      setCopied(cssVar);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Foundations"
        title="Design Tokens (W3C DTCG 2025.10)"
        description="Single Source of Truth token compiler outputting CSS custom properties, Tailwind CSS v4 @theme inline, literal Ant Design 6 mirrors, and machine-readable JSON for the Millar MCP Server."
        badges={[{ label: "DTCG 2025.10", tone: "neutral" }, { label: `${tokens.length} shown`, tone: "brand" }]}
        importPath="@hahlex/millar-tokens"
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <FilterBar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Filter by CSS var, path, value, or role..." />
        </div>
        <ChoiceToggle
          label="Token set"
          value={setKey}
          onChange={setSetKey}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "base", label: "Base" },
            { value: "registers", label: "Registers" },
          ]}
        />
      </div>

      <div
        style={{
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-surface)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-body-sm)" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-surface-2)", borderBottom: "1px solid var(--border-default)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>CSS Variable</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Resolved Value</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((tok) => (
                <tr key={tok.path} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      onClick={() => copyToken(tok.cssVar)}
                      className="millar-focus"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 6px",
                        borderRadius: 6,
                        border: "none",
                        background: "transparent",
                        color: "var(--fg-default)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-micro)",
                        cursor: "pointer",
                      }}
                    >
                      <span>{tok.cssVar}</span>
                      <span style={{ color: "var(--fg-accent)" }}>
                        {copied === tok.cssVar ? <IconCheck size="sm" /> : <IconCopy size="sm" />}
                      </span>
                    </button>
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {tok.category === "color" ? (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 4,
                            backgroundColor: tok.value,
                            border: "1px solid var(--border-strong)",
                            display: "inline-block",
                          }}
                        />
                      ) : null}
                      <span>{tok.value}</span>
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge tone="neutral" dot={false}>
                      {tok.category}
                    </Badge>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--fg-muted)", fontSize: "var(--text-meta)" }}>{tok.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SpecimenFrame
        title="Tailwind v4 & Ant Design 6 Integration"
        description="Tailwind v4 uses @theme inline so scoped [data-theme='dark'] subtrees resolve dynamically; AntD 6 uses generated literal mirrors."
        code={`/* Tailwind CSS v4 (globals.css) */
@import "tailwindcss";
@import "@hahlex/millar-tokens/tailwind";

/* Ant Design 6 Theme Adapter (App.tsx) */
import { ConfigProvider } from "antd";
import { createMillarAntdTheme } from "@hahlex/millar-ui";

<ConfigProvider theme={createMillarAntdTheme("light")}>...</ConfigProvider>`}
      >
        <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
          All 8 downstream output artifacts compile in one pass via <code>pnpm run compile</code> from <code>tokens/millar.resolver.json</code>.
        </p>
      </SpecimenFrame>
    </div>
  );
}
