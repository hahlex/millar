"use client";

import React, { useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { ChoiceToggle } from "@hahlex/millar-ui";
import { AnalyticsDashboardTemplate, DirectoryWorkspaceTemplate } from "@hahlex/millar-marketing";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function AppTemplatesPage() {
  const [selected, setSelected] = useState<"directory-workspace-template" | "analytics-dashboard-template">("directory-workspace-template");
  const spec = registry.templates.find((t) => t.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Components"
        title="Application Templates"
        description="Canonical 1-glance Product/App workspaces enforcing zero CSS gradients, <=1 primary CTA in PageHeader, immediate FilterBar, and zero-scrollbar DataTable ergonomics."
        importPath="@hahlex/millar-marketing"
      />

      <SpecimenFrame
        title={spec?.name ?? "Application Template"}
        description={spec?.summary}
        toolbar={
          <ChoiceToggle
            label="Application template"
            value={selected}
            onChange={setSelected}
            options={[
              { value: "directory-workspace-template", label: "Directory Workspace" },
              { value: "analytics-dashboard-template", label: "Analytics Dashboard" },
            ]}
          />
        }
        code={spec?.exampleCode}
      >
        <div data-embedded-preview="true">
          {selected === "directory-workspace-template" ? <DirectoryWorkspaceTemplate embedded /> : <AnalyticsDashboardTemplate embedded />}
        </div>
      </SpecimenFrame>
    </div>
  );
}
