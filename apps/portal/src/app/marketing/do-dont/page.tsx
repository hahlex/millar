"use client";

import React from "react";
import { DefaultMarketingDoDontShowcase } from "@hahlex/millar-marketing";
import { DocHeader } from "@/components/DocPrimitives";

export default function MarketingDoDontPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Marketing"
        title="Visual Do's & Don'ts"
        description="Side-by-side live comparisons contrasting Millar's Measured Warmth craft against audited anti-patterns (decorative neon gradients, failing bronze contrast, blank scroll boxes, and repeated fake chatboxes)."
        importPath="@hahlex/millar-marketing"
      />

      <DefaultMarketingDoDontShowcase />
    </div>
  );
}
