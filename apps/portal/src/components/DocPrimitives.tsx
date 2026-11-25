"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowRight } from "@hahlex/millar-ui";
import { CodeCopyBox } from "./CodeCopyBox";
import { getPrevNext } from "@/lib/navigation";

export interface DocHeaderProps {
  section: string;
  title: string;
  description?: string;
  status?: string;
  badges?: Array<{ label: string; tone?: "neutral" | "brand" | "sage" | "sand" | "success" | "warning" | "error" }>;
  importPath?: string;
}

export function DocHeader({ section, title, importPath }: DocHeaderProps) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20, borderBottom: "1px solid var(--border-soft)" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--fg-subtle)",
          letterSpacing: "0.01em",
        }}
      >
        millar / {section.toLowerCase()} / <span style={{ color: "var(--fg-muted)" }}>{slug}</span>
      </div>

      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.85rem, 3.2vw, 2.35rem)",
          fontWeight: 500,
          lineHeight: "var(--leading-display, 1.15)",
          letterSpacing: "-0.025em",
          color: "var(--fg-default)",
        }}
      >
        {title}
      </h1>

      {importPath ? (
        <div>
          <code
            style={{
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              padding: "3px 10px",
              borderRadius: "var(--radius-sm, 8px)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--fg-muted)",
            }}
          >
            {importPath}
          </code>
        </div>
      ) : null}
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
          {title ? (
            <h2
              id={title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")}
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
              {title}
            </h2>
          ) : null}
          {toolbar}
        </div>
      ) : null}

      <div
        style={{
          borderRadius: "var(--radius-md, 12px)",
          border: "1px solid var(--border-default)",
          backgroundColor: bg,
          color: canvasTone === "stage-dark" ? "var(--fg-on-stage-dark)" : "var(--fg-default)",
          padding: "clamp(16px, 2.5vw, 24px)",
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
        marginTop: 48,
        paddingTop: 20,
        borderTop: "1px solid var(--border-soft)",
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
            padding: "12px 14px",
            borderRadius: "var(--radius-sm, 8px)",
            border: "1px solid var(--border-soft)",
            backgroundColor: "transparent",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-subtle)" }}>
            Previous
          </span>
          <span style={{ fontSize: "var(--text-body-sm, 0.875rem)", fontWeight: 500, color: "var(--fg-default)" }}>{prev.label}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="millar-focus"
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm, 8px)",
            border: "1px solid var(--border-soft)",
            backgroundColor: "transparent",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 3,
            textAlign: "right",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-subtle)" }}>
            Next
          </span>
          <span
            style={{
              fontSize: "var(--text-body-sm, 0.875rem)",
              fontWeight: 500,
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
