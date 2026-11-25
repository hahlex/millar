"use client";

import React, { useState } from "react";
import { Badge, Button, IconCheck, IconCopy } from "@hahlex/millar-ui";

export function LifecycleBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge tone="success">Approved</Badge>;
  if (status === "deprecated") return <Badge tone="error">Deprecated</Badge>;
  return <Badge tone="brand">Draft</Badge>;
}

export function CodeCopyBox({ code, title, language = "tsx" }: { code: string; title?: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-md, 12px)",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--bg-surface-2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "8px 12px",
          borderBottom: "1px solid var(--border-soft)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-muted)" }}>
          {title ?? language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label={`Copy ${title ?? "code"}`}
          icon={copied ? <IconCheck size="sm" /> : <IconCopy size="sm" />}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          overflowX: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-meta, 0.8125rem)",
          lineHeight: "var(--leading-mono, 1.85)",
          color: "var(--fg-default)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
