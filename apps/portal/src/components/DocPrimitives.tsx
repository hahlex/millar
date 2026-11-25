"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, IconArrowRight } from "@hahlex/millar-ui";
import { CodeCopyBox, LifecycleBadge } from "./CodeCopyBox";
import { getPrevNext } from "@/lib/navigation";

export interface DocHeaderProps {
  section: string;
  title: string;
  description: string;
  status?: string;
  badges?: Array<{ label: string; tone?: "neutral" | "brand" | "sage" | "sand" | "success" | "warning" | "error" }>;
  importPath?: string;
}

export function DocHeader({ section, title, description, status = "draft", badges = [], importPath }: DocHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 28, borderBottom: "1px solid var(--border-default)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-meta, 0.8125rem)", fontWeight: 500, color: "var(--fg-accent)" }}>{section}</span>
        <LifecycleBadge status={status} />
        {badges.map((b) => (
          <Badge key={b.label} tone={b.tone ?? "neutral"} dot={false}>
            {b.label}
          </Badge>
        ))}
        {importPath ? (
          <code
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro, 0.75rem)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm, 8px)",
              backgroundColor: "var(--bg-surface-2)",
              border: "1px solid var(--border-soft)",
              color: "var(--fg-muted)",
            }}
          >
            {importPath}
          </code>
        ) : null}
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 3.6vw, 2.75rem)",
          fontWeight: 300,
          lineHeight: "var(--leading-display, 1.14)",
          letterSpacing: "var(--tracking-display, -0.02em)",
          color: "var(--fg-default)",
        }}
      >
        {title}
      </h1>
      <p style={{ margin: 0, maxWidth: "68ch", fontSize: "var(--text-body, 0.9375rem)", lineHeight: 1.6, color: "var(--fg-muted)" }}>
        {description}
      </p>
    </div>
  );
}

export interface SpecimenFrameProps {
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  canvasTone?: "surface" | "inset" | "editorial" | "stage-dark";
  code?: string;
  codeTitle?: string;
  wrapCode?: boolean;
  children: React.ReactNode;
}

export function SpecimenFrame({
  title,
  description,
  toolbar,
  canvasTone = "surface",
  code,
  codeTitle,
  wrapCode = false,
  children,
}: SpecimenFrameProps) {
  const bg =
    canvasTone === "inset"
      ? "var(--bg-surface-2)"
      : canvasTone === "editorial"
        ? "var(--bg-editorial)"
        : canvasTone === "stage-dark"
          ? "var(--bg-stage-dark)"
          : "var(--bg-surface)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {title || toolbar ? (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            {title ? (
              <h2
                id={title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "")}
                style={{
                  margin: 0,
                  scrollMarginTop: 76,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-section-title, 1.125rem)",
                  fontWeight: 600,
                  color: "var(--fg-default)",
                }}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-body-sm, 0.875rem)", color: "var(--fg-muted)" }}>{description}</p>
            ) : null}
          </div>
          {toolbar}
        </div>
      ) : null}

      <div
        style={{
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border-default)",
          backgroundColor: bg,
          color: canvasTone === "stage-dark" ? "var(--fg-on-stage-dark)" : "var(--fg-default)",
          padding: "clamp(18px, 3vw, 28px)",
          overflowX: "auto",
        }}
      >
        {children}
      </div>

      {code ? <CodeCopyBox title={codeTitle ?? title} code={code} wrap={wrapCode} /> : null}
    </div>
  );
}

export function DocPagination() {
  const pathname = usePathname();
  const { prev, next } = getPrevNext(pathname);
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Page pagination"
      style={{
        marginTop: 56,
        paddingTop: 24,
        borderTop: "1px solid var(--border-default)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14,
      }}
    >
      {prev ? (
        <Link
          href={prev.href}
          className="millar-focus"
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md, 12px)",
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={{ fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-subtle)" }}>Previous · {prev.section}</span>
          <span style={{ fontSize: "var(--text-body-sm, 0.875rem)", fontWeight: 600, color: "var(--fg-default)" }}>{prev.label}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="millar-focus"
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md, 12px)",
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
            textAlign: "right",
          }}
        >
          <span style={{ fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-subtle)" }}>Next · {next.section}</span>
          <span
            style={{
              fontSize: "var(--text-body-sm, 0.875rem)",
              fontWeight: 600,
              color: "var(--fg-default)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{next.label}</span>
            <IconArrowRight size="sm" />
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
