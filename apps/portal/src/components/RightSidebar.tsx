"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconCheck, IconCopy } from "@hahlex/millar-ui";
import { normalizePath } from "@/lib/navigation";

interface TocItem {
  id: string;
  text: string;
}

function getMcpUriForPath(path: string): { uri: string; pkg?: string } {
  if (path.startsWith("/components/")) {
    const id = path.slice("/components/".length);
    if (id === "templates") return { uri: "millar://templates/directory-workspace-template", pkg: "@hahlex/millar-marketing" };
    if (id === "education-extension") return { uri: "millar://tokens/dtcg", pkg: "@hahlex/millar-domain-education" };
    return { uri: `millar://components/${id}`, pkg: "@hahlex/millar-ui" };
  }
  if (path === "/foundations/brand") return { uri: "millar://brand/identity", pkg: "@hahlex/millar-marketing" };
  if (path === "/foundations/colors" || path === "/foundations/tokens") return { uri: "millar://tokens/resolved/light", pkg: "@hahlex/millar-tokens" };
  if (path === "/foundations/typography" || path === "/foundations/spacing") return { uri: "millar://guidelines/shared", pkg: "@hahlex/millar-tokens" };
  if (path === "/foundations/icons") return { uri: "millar://registry/index", pkg: "@hahlex/millar-ui" };
  if (path === "/marketing/compositions") return { uri: "millar://composition-patterns/editorial-split", pkg: "@hahlex/millar-marketing" };
  if (path === "/marketing/visual-assets") return { uri: "millar://visual-assets/warm-horizon-wash", pkg: "@hahlex/millar-marketing" };
  if (path === "/marketing/motion") return { uri: "millar://motion-presets/expressive-enter", pkg: "@hahlex/millar-marketing" };
  if (path === "/marketing/sections") return { uri: "millar://sections/hero-spatial-stage", pkg: "@hahlex/millar-marketing" };
  if (path === "/marketing/templates") return { uri: "millar://templates/product-launch-template", pkg: "@hahlex/millar-marketing" };
  if (path.startsWith("/marketing")) return { uri: "millar://guidelines/marketing", pkg: "@hahlex/millar-marketing" };
  if (path === "/resources/changelog") return { uri: "millar://changelog" };
  if (path === "/resources/skills") return { uri: "millar://skills", pkg: "@hahlex/millar-mcp" };
  if (path === "/resources/mcp") return { uri: "millar://guidelines/invariants", pkg: "@hahlex/millar-mcp" };
  return { uri: "millar://guidelines/invariants", pkg: "@hahlex/millar-tokens" };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function RightSidebar() {
  const pathname = usePathname();
  const normPath = normalizePath(pathname);
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [copiedUri, setCopiedUri] = useState(false);

  const meta = getMcpUriForPath(normPath);

  useEffect(() => {
    const main = document.getElementById("portal-main");
    if (!main) return;

    const nodes = Array.from(main.querySelectorAll<HTMLHeadingElement>("h2"));
    const usedIds = new Set<string>();
    const items: TocItem[] = [];

    for (const h2 of nodes) {
      // Skip headings inside embedded full-page template previews
      if (h2.closest("[data-embedded-preview='true']")) continue;
      const text = h2.textContent?.trim() ?? "";
      if (!text) continue;
      let id = h2.id || slugify(text);
      if (!id) continue;
      if (usedIds.has(id)) {
        let suffix = 2;
        while (usedIds.has(`${id}-${suffix}`)) suffix += 1;
        id = `${id}-${suffix}`;
      }
      usedIds.add(id);
      if (!h2.id) h2.id = id;
      items.push({ id, text });
    }

    setHeadings(items);
    setActiveId(items[0]?.id ?? "");

    if (items.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-72px 0px -65% 0px", threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [normPath]);

  const copyUri = async () => {
    try {
      await navigator.clipboard.writeText(meta.uri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 1500);
    } catch {
      setCopiedUri(false);
    }
  };

  return (
    <aside aria-label="On this page" className="portal-sidebar-right">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* On This Page TOC */}
        <nav aria-label="Table of contents" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              textTransform: "uppercase",
              color: "var(--fg-subtle)",
              letterSpacing: "0.08em",
            }}
          >
            On this page
          </div>

          {headings.length > 0 ? (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                borderLeft: "1px solid var(--border-default)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {headings.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => setActiveId(item.id)}
                      className="millar-focus"
                      style={{
                        display: "block",
                        padding: "5px 0 5px 12px",
                        marginLeft: -1,
                        borderLeft: `2px solid ${isActive ? "var(--fg-accent)" : "transparent"}`,
                        fontSize: "var(--text-meta, 0.8125rem)",
                        lineHeight: 1.4,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "var(--fg-default)" : "var(--fg-muted)",
                        textDecoration: "none",
                      }}
                    >
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>Top of page</span>
          )}
        </nav>

        {/* Quick Reference & MCP Resource Card */}
        <div
          style={{
            paddingTop: 16,
            borderTop: "1px solid var(--border-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              textTransform: "uppercase",
              color: "var(--fg-subtle)",
              letterSpacing: "0.08em",
            }}
          >
            MCP Resource
          </div>
          <button
            type="button"
            onClick={copyUri}
            className="millar-focus"
            title="Copy MCP Resource URI"
            style={{
              textAlign: "left",
              padding: "8px 10px",
              borderRadius: "var(--radius-sm, 8px)",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--fg-default)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro, 0.75rem)",
                color: "var(--fg-accent)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meta.uri}
            </code>
            <span style={{ color: copiedUri ? "var(--status-success)" : "var(--fg-muted)", flexShrink: 0, display: "inline-flex" }}>
              {copiedUri ? <IconCheck size="sm" /> : <IconCopy size="sm" />}
            </span>
          </button>

          {meta.pkg ? (
            <div style={{ fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-muted)" }}>
              Package:{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--fg-default)" }}>{meta.pkg}</code>
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 4 }}>
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--bg-editorial-card)", border: "1px solid var(--border-strong)" }}
              title="Warm Sand"
            />
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--accent)" }}
              title="CTA Brown"
            />
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--accent-crimson)" }}
              title="Hahlex Crimson"
            />
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--bg-stage-dark)", border: "1px solid var(--border-strong)" }}
              title="Deep Espresso"
            />
            <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-subtle)", marginLeft: 2 }}>Measured Warmth</span>
          </div>

          <a
            href="#portal-main"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="millar-focus"
            style={{
              marginTop: 4,
              fontSize: "var(--text-micro, 0.75rem)",
              color: "var(--fg-muted)",
              textDecoration: "none",
              width: "fit-content",
              borderRadius: 4,
            }}
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </aside>
  );
}
