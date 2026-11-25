"use client";

import React, { useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, Button, DataTable, Switch } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function MotionPage() {
  const [reduced, setReduced] = useState(false);
  const [pulse, setPulse] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Marketing"
        title="Motion Library"
        description="Two calibrated motion registers: Productive (fast 140-320ms feedback for Product UI) and Expressive (measured 280-640ms pacing for Marketing), both paired with mandatory static-first prefers-reduced-motion fallbacks."
        importPath="@hahlex/millar-marketing"
      />

      <SpecimenFrame
        title="Interactive Timing & Easing Lab"
        description="Trigger movement to compare Productive vs. Expressive curves, or toggle prefers-reduced-motion simulation."
        toolbar={
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Switch checked={reduced} onChange={setReduced} label="Simulate reduced motion" />
            <Button variant="primary" size="sm" onClick={() => setPulse((p) => !p)}>
              Trigger Preview
            </Button>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
          {registry.motionPresets.map((preset) => (
            <div
              key={preset.id}
              style={{
                padding: 14,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface-2)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: "var(--text-body-sm)" }}>{preset.name}</strong>
                <Badge tone={preset.motionRegister === "expressive" ? "brand" : "sage"} dot={false}>
                  {reduced ? "0ms (Reduced)" : `${preset.durationMs}ms`}
                </Badge>
              </div>
              <div
                style={{
                  height: 36,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-soft)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: preset.motionRegister === "expressive" ? "var(--accent-editorial)" : "var(--accent)",
                    transform: pulse ? "translateX(132px)" : "translateX(0px)",
                    transition: reduced ? "none" : `transform ${preset.durationMs}ms ${preset.easingCss}`,
                  }}
                />
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>
                {preset.easingCss}
              </code>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>{preset.reducedMotionFallback}</span>
            </div>
          ))}
        </div>
      </SpecimenFrame>

      <DataTable
        caption="Motion preset specifications exposed via get_motion_presets"
        columns={[
          { key: "id", header: "Preset ID" },
          { key: "motionRegister", header: "Register" },
          { key: "durationMs", header: "Duration (ms)", align: "right", numeric: true },
          { key: "reducedMotionFallback", header: "Reduced-Motion Fallback" },
        ]}
        rows={registry.motionPresets as unknown as Record<string, unknown>[]}
        rowKey={(r) => String(r.id)}
      />
    </div>
  );
}
