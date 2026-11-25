"use client";

import React, { useState } from "react";
import { ChoiceToggle, DataTable } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

const TYPE_STEPS = [
  { token: "--text-display-hero", size: "clamp(2.4rem, 5vw, 4rem)", weight: "300-400", family: "Geist Sans", role: "Marketing hero display statement" },
  { token: "--text-display-section", size: "clamp(1.75rem, 3.2vw, 2.5rem)", weight: "300-400", family: "Geist Sans", role: "Section display heading" },
  { token: "--text-page-title", size: "1.375rem (22px)", weight: "600", family: "Geist Sans", role: "Product page H1 header" },
  { token: "--text-section-title", size: "1.125rem (18px)", weight: "600", family: "Geist Sans", role: "Card / panel section heading" },
  { token: "--text-card-title", size: "1rem (16px)", weight: "600", family: "Geist Sans", role: "Compact component heading" },
  { token: "--text-body", size: "0.9375rem (15px)", weight: "400", family: "Inter", role: "Primary UI & editorial reading copy" },
  { token: "--text-body-sm", size: "0.875rem (14px)", weight: "400-500", family: "Inter", role: "Controls, table cells, navigation" },
  { token: "--text-meta", size: "0.8125rem (13px)", weight: "400-500", family: "Inter / Mono", role: "Secondary captions & metadata" },
  { token: "--text-micro", size: "0.75rem (12px)", weight: "500", family: "Inter / Mono", role: "Strict minimum UI text floor (never < 12px)" },
];

export default function TypographyFoundationPage() {
  const [weight, setWeight] = useState<number>(300);
  const [sampleLang, setSampleLang] = useState<"vi" | "en">("vi");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Foundations"
        title="Typography"
        description="Unified ecosystem typography: Geist Sans (300-400 Display >= 28px; 500-600 operational headings 16-22px), Inter (Body/UI + slim opsz 24 assistant threads), and Geist Mono (code & tabular numerals), calibrated with :root:lang(vi) Vietnamese diacritic safety."
        importPath="@hahlex/millar-tokens/tokens.css"
      />

      <SpecimenFrame
        title="Interactive Display & Vietnamese Diacritic Specimen"
        description="Toggle weight and language to verify that stacked Vietnamese diacritics (ệ, ư, ỗ, ắ, ồ) never clip or collide."
        canvasTone="editorial"
        toolbar={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ChoiceToggle
              label="Specimen font weight"
              value={String(weight)}
              onChange={(v) => setWeight(Number(v))}
              options={[
                { value: "300", label: "300 Light" },
                { value: "400", label: "400 Regular" },
                { value: "500", label: "500 Medium" },
                { value: "600", label: "600 Semibold" },
              ]}
            />
            <ChoiceToggle
              label="Specimen language"
              value={sampleLang}
              onChange={setSampleLang}
              options={[
                { value: "vi", label: "Tiếng Việt" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        }
        code={`/* :root:lang(vi) widens line-height and adds .line-mask top headroom */
:root:lang(vi) {
  --leading-display: 1.2;
  --tracking-display: -0.012em;
}
:root:lang(vi) .line-mask {
  padding-top: 0.16em;
  margin-top: -0.16em;
}`}
      >
        <div lang={sampleLang} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>
            Geist Display · weight {weight} · {sampleLang === "vi" ? "leading 1.20 / tracking -0.012em (:lang(vi))" : "leading 1.12 / tracking -0.02em"}
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
              fontWeight: weight,
              lineHeight: sampleLang === "vi" ? 1.22 : 1.12,
              letterSpacing: sampleLang === "vi" ? "-0.012em" : "-0.02em",
              color: "var(--fg-default)",
            }}
          >
            {sampleLang === "vi"
              ? "Hệ thống thiết kế thống nhất cho trải nghiệm bền vững, rõ ràng và giàu sắc thái ấm áp."
              : "One measured typographic voice spanning editorial storytelling and operational software."}
          </p>
          <p style={{ margin: 0, maxWidth: "65ch", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", lineHeight: 1.62, color: "var(--fg-muted)" }}>
            {sampleLang === "vi"
              ? "Inter đảm bảo độ đọc rõ ràng cho nội dung tiếng Việt có dấu ghép phức tạp ở kích thước 14px-15px trong bảng dữ liệu, biểu mẫu và giao diện trợ lý."
              : "Inter delivers calm reading ergonomics at 14px-15px across tables, form controls, and long-form AI assistant conversations."}
          </p>
          <div
            className="tabular-nums"
            style={{
              paddingTop: 14,
              borderTop: "1px solid var(--border-soft)",
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-meta)",
              color: "var(--fg-default)",
            }}
          >
            <span>0123456789 · tabular-nums</span>
            <span>84 / 84 AA</span>
            <span>ΔE 11.13</span>
            <span>--font-mono</span>
          </div>
        </div>
      </SpecimenFrame>

      <section aria-labelledby="scale-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="scale-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Type Scale &amp; Role Contract
        </h2>
        <DataTable
          caption="Millar typography scale tokens"
          columns={[
            { key: "token", header: "CSS Token" },
            { key: "family", header: "Family" },
            { key: "weight", header: "Weight" },
            { key: "size", header: "Size" },
            { key: "role", header: "Intended Role" },
          ]}
          rows={TYPE_STEPS.map((s) => ({ ...s, id: s.token }))}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
