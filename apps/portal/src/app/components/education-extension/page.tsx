"use client";

import React, { useState } from "react";
import { ChoiceToggle, Switch } from "@hahlex/millar-ui";
import { LearnerHighlight, SkillDomainBadge, type LanguageSkill } from "@hahlex/millar-domain-education";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

const SKILL_SAMPLES: Record<
  LanguageSkill,
  { label: string; token: string; passagePrefix: string; evidence: string; passageSuffix: string }
> = {
  listening: {
    label: "Listening · Nghe",
    token: "--skill-listening-soft / --skill-listening-fg",
    passagePrefix: "Audio transcript 02:14 notes that ",
    evidence: "the coastal library reopened on Tuesdays after restoration",
    passageSuffix: ", matching Question 14.",
  },
  reading: {
    label: "Reading · Đọc",
    token: "--skill-reading-soft / --skill-reading-fg",
    passagePrefix: "In paragraph two, the learner highlighted ",
    evidence: "key evidence linking urban shade canopies to cooler street temperatures",
    passageSuffix: " using --mark-learner.",
  },
  writing: {
    label: "Writing · Viết",
    token: "--skill-writing-soft / --skill-writing-fg",
    passagePrefix: "Task 2 feedback marks ",
    evidence: "a clear thesis transition balancing economic growth and sustainability",
    passageSuffix: " for Band 7.5 coherence.",
  },
  speaking: {
    label: "Speaking · Nói",
    token: "--skill-speaking-soft / --skill-speaking-fg",
    passagePrefix: "Part 2 cue card note emphasizes ",
    evidence: "natural self-correction without losing lexical fluency",
    passageSuffix: " across the 2-minute prompt.",
  },
  grammar: {
    label: "Grammar",
    token: "--subskill-grammar-soft / --subskill-grammar-fg",
    passagePrefix: "Clause check verifies ",
    evidence: "accurate inverted conditional structure in academic prose",
    passageSuffix: " with zero tense drift.",
  },
  vocabulary: {
    label: "Vocabulary",
    token: "--subskill-vocab-soft / --subskill-vocab-fg",
    passagePrefix: "Collocation spotlight captures ",
    evidence: "mitigate systemic bottlenecks across regional cohorts",
    passageSuffix: " in learner flashcards.",
  },
};

export default function EducationExtensionPage() {
  const [activeSkill, setActiveSkill] = useState<LanguageSkill>("reading");
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const sample = SKILL_SAMPLES[activeSkill];

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
        title="Interactive SkillDomainBadge & LearnerHighlight"
        description="Click any skill domain or toggle passage highlighting to inspect isolated extension tokens."
        toolbar={
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Switch checked={highlightEnabled} onChange={setHighlightEnabled} label="Highlight evidence span" />
          </div>
        }
        code={`import "@hahlex/millar-tokens/education.css";
import { SkillDomainBadge, LearnerHighlight } from "@hahlex/millar-domain-education";

<SkillDomainBadge skill="${activeSkill}" label="${sample.label}" />
<p>${sample.passagePrefix}<LearnerHighlight>${sample.evidence}</LearnerHighlight>${sample.passageSuffix}</p>`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <ChoiceToggle
            label="Active education skill"
            value={activeSkill}
            onChange={setActiveSkill}
            options={(Object.keys(SKILL_SAMPLES) as LanguageSkill[]).map((skill) => ({
              value: skill,
              label: SKILL_SAMPLES[skill].label,
            }))}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {(Object.keys(SKILL_SAMPLES) as LanguageSkill[]).map((skill) => (
              <button
                key={skill}
                type="button"
                aria-pressed={activeSkill === skill}
                onClick={() => setActiveSkill(skill)}
                className="millar-focus"
                style={{
                  padding: 2,
                  borderRadius: "var(--radius-pill)",
                  border: activeSkill === skill ? "1px solid var(--fg-accent)" : "1px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <SkillDomainBadge skill={skill} label={SKILL_SAMPLES[skill].label} />
              </button>
            ))}
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-2)",
              border: "1px solid var(--border-default)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <SkillDomainBadge skill={activeSkill} label={sample.label} />
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>
                {sample.token}
              </code>
            </div>
            <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-default)", lineHeight: 1.65 }}>
              {sample.passagePrefix}
              {highlightEnabled ? <LearnerHighlight>{sample.evidence}</LearnerHighlight> : <span>{sample.evidence}</span>}
              {sample.passageSuffix}
            </p>
          </div>
        </div>
      </SpecimenFrame>
    </div>
  );
}
