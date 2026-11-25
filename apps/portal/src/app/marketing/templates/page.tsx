"use client";

import React, { useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { ChoiceToggle } from "@hahlex/millar-ui";
import { EditorialFeatureTemplate, ProductLaunchTemplate } from "@hahlex/millar-marketing";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function MarketingTemplatesPage() {
  const [selected, setSelected] = useState<"product-launch-template" | "editorial-feature-template">("product-launch-template");
  const spec = registry.templates.find((t) => t.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Marketing"
        title="Marketing Page Templates"
        description="Complete multi-section Marketing pages combining contrasting Composition Patterns so consecutive sections never repeat the same visual grammar."
        importPath="@hahlex/millar-marketing"
      />

      <SpecimenFrame
        title={spec?.name ?? "Page Template"}
        description={spec?.summary}
        canvasTone="inset"
        toolbar={
          <ChoiceToggle
            label="Marketing page template"
            value={selected}
            onChange={setSelected}
            options={[
              { value: "product-launch-template", label: "ProductLaunchTemplate" },
              { value: "editorial-feature-template", label: "EditorialFeatureTemplate" },
            ]}
          />
        }
        code={spec?.exampleCode}
      >
        <div
          data-embedded-preview="true"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            overflow: "hidden",
            maxHeight: 620,
            overflowY: "auto",
          }}
        >
          {selected === "product-launch-template" ? <ProductLaunchTemplate embedded /> : <EditorialFeatureTemplate embedded />}
        </div>
      </SpecimenFrame>
    </div>
  );
}
