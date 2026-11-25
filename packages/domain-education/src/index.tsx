import React from "react";
import { BookOpen, GraduationCap, Headphones, Mic, PenTool, Sparkles } from "lucide-react";

/**
 * Optional Domain Extension (@hahlex/millar-domain-education).
 * Keeps education-specific IELTS 4-skill tones, learner highlighter, and curriculum
 * icon aliases cleanly decoupled from Millar Shared Foundations (ADR-0002).
 */

export type LanguageSkill = "listening" | "reading" | "writing" | "speaking" | "grammar" | "vocabulary";

const SKILL_META: Record<LanguageSkill, { label: string; cssPrefix: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; absoluteStrokeWidth?: boolean }> }> = {
  listening: { label: "Listening", cssPrefix: "skill-listening", icon: Headphones },
  reading: { label: "Reading", cssPrefix: "skill-reading", icon: BookOpen },
  writing: { label: "Writing", cssPrefix: "skill-writing", icon: PenTool },
  speaking: { label: "Speaking", cssPrefix: "skill-speaking", icon: Mic },
  grammar: { label: "Grammar", cssPrefix: "subskill-grammar", icon: GraduationCap },
  vocabulary: { label: "Vocabulary", cssPrefix: "subskill-vocab", icon: Sparkles },
};

export interface SkillDomainBadgeProps {
  skill: LanguageSkill;
  label?: string;
}

export function SkillDomainBadge({ skill, label }: SkillDomainBadgeProps) {
  const cfg = SKILL_META[skill];
  const IconComp = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: "var(--radius-pill, 9999px)",
        border: `1px solid var(--${cfg.cssPrefix}-border)`,
        backgroundColor: `var(--${cfg.cssPrefix}-soft)`,
        color: `var(--${cfg.cssPrefix}-fg)`,
        fontSize: "var(--text-meta, 0.8125rem)",
        fontWeight: 500,
      }}
    >
      <IconComp size={14} strokeWidth={1.5} absoluteStrokeWidth />
      <span>{label ?? cfg.label}</span>
    </span>
  );
}

export function LearnerHighlight({ children }: { children: React.ReactNode }) {
  return (
    <mark
      style={{
        backgroundColor: "var(--mark-learner, #fde68a)",
        color: "var(--fg-on-mark-learner, #2b1f16)",
        padding: "1px 4px",
        borderRadius: "var(--radius-xs, 4px)",
      }}
    >
      {children}
    </mark>
  );
}
