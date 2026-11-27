"use client";

import React, { useState } from "react";
import { ChoiceToggle, IconCheck, IconCopy } from "@hahlex/millar-ui";

export interface InstallBarProps {
  label?: string;
  showTargetSwitch?: boolean;
  defaultTarget?: "mcp" | "skills";
}

const SNIPPETS = {
  command: {
    mcp: {
      prefix: "$",
      text: "npx -y @hahlex/millar-mcp@draft",
    },
    skills: {
      prefix: "$",
      text: "npx millar install",
    },
  },
  prompt: {
    mcp: {
      prefix: ">",
      text: 'Add Millar MCP ("millar") with `npx -y @hahlex/millar-mcp@draft` (includes all 9 skills) and verify via list_skills().',
    },
    skills: {
      prefix: ">",
      text: "Run `npx millar install` and verify all 9 Millar skills are loaded.",
    },
  },
} as const;

export function InstallBar({ label = "Installation", showTargetSwitch = false, defaultTarget = "mcp" }: InstallBarProps) {
  const [format, setFormat] = useState<"command" | "prompt">("command");
  const [target, setTarget] = useState<"mcp" | "skills">(defaultTarget);
  const [copied, setCopied] = useState(false);

  const active = SNIPPETS[format][target];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-label={label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          paddingBottom: 8,
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <h2
          id={label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
          style={{
            margin: 0,
            scrollMarginTop: 76,
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
          }}
        >
          {label}
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {showTargetSwitch ? (
            <ChoiceToggle
              label="Package"
              value={target}
              onChange={setTarget}
              options={[
                { value: "mcp", label: "MCP (Includes Skills)" },
                { value: "skills", label: "Skills Only" },
              ]}
            />
          ) : null}
          <ChoiceToggle
            label="Copy format"
            value={format}
            onChange={setFormat}
            options={[
              { value: "command", label: "Command" },
              { value: "prompt", label: "Prompt" },
            ]}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "11px 14px",
          borderRadius: "var(--radius-sm, 8px)",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            minWidth: 0,
            flex: 1,
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            color: "var(--fg-default)",
          }}
        >
          <span aria-hidden="true" style={{ color: "var(--fg-subtle)", userSelect: "none", flexShrink: 0 }}>
            {active.prefix}
          </span>
          <code
            style={{
              fontFamily: "inherit",
              whiteSpace: format === "prompt" ? "pre-wrap" : "nowrap",
              overflowX: format === "prompt" ? "visible" : "auto",
              wordBreak: format === "prompt" ? "break-word" : "normal",
            }}
          >
            {active.text}
          </code>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy install snippet"}
          className="millar-focus"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 6,
            border: "1px solid transparent",
            backgroundColor: "transparent",
            color: copied ? "var(--status-success)" : "var(--fg-muted)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {copied ? <IconCheck size="sm" /> : <IconCopy size="sm" />}
        </button>
      </div>
    </section>
  );
}
