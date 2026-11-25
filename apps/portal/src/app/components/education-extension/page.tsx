"use client";

import React from "react";
import { LearnerHighlight, SkillDomainBadge } from "@hahlex/millar-domain-education";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function EducationExtensionPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Components"
        title="Education Domain Extension"
        description="Millar Shared Foundations stay 100% product-agnostic so Hahlex can scale into new verticals. IELTS 4-skill palettes and learner passage highlights live strictly in this optional extension package."
        badges={[{ label: "Optional Extension Pack", tone: "sand" }]}
        importPath="@hahlex/millar-domain-education"
      />

      <SpecimenFrame
        title="SkillDomainBadge & LearnerHighlight"
        description="Dedicated skill semantic tones for Listening, Reading, Writing, Speaking, Grammar, and Vocabulary, plus accessible passage highlight spans."
        code={`import "@hahlex/millar-tokens/education.css";
import { SkillDomainBadge, LearnerHighlight } from "@hahlex/millar-domain-education";

<SkillDomainBadge skill="listening" label="Listening · Nghe" />
<p>Highlighted <LearnerHighlight>key evidence</LearnerHighlight> in passage.</p>`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <SkillDomainBadge skill="listening" label="Listening · Nghe" />
            <SkillDomainBadge skill="reading" label="Reading · Đọc" />
            <SkillDomainBadge skill="writing" label="Writing · Viết" />
            <SkillDomainBadge skill="speaking" label="Speaking · Nói" />
            <SkillDomainBadge skill="grammar" label="Grammar" />
            <SkillDomainBadge skill="vocabulary" label="Vocabulary" />
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-default)", lineHeight: 1.6 }}>
            Passage example: The learner highlighted <LearnerHighlight>key evidence in paragraph two</LearnerHighlight> using the isolated extension token <code>--edu-highlight-bg</code>.
          </p>
        </div>
      </SpecimenFrame>
    </div>
  );
}
