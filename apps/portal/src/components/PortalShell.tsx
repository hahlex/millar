"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, Button, ChoiceToggle, Dialog, IconClose, IconMenu, IconSearch } from "@hahlex/millar-ui";
import { HahlexLockup, MillarSiteFooter } from "@hahlex/millar-marketing";
import { FLAT_NAV_ITEMS, SIDEBAR_GROUPS, normalizePath } from "@/lib/navigation";
import { DocPagination } from "./DocPrimitives";
import { RightSidebar } from "./RightSidebar";

interface SearchEntry {
  id: string;
  kind: string;
  title: string;
  summary: string;
  href: string;
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activePath = normalizePath(pathname);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [locale, setLocale] = useState<"en" | "vi">("en");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchIndex = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];
    for (const item of FLAT_NAV_ITEMS) {
      entries.push({
        id: `nav-${item.href}`,
        kind: item.section,
        title: item.label,
        summary: `Documentation page · ${item.href}`,
        href: item.href,
      });
    }
    for (const c of registry.components) {
      entries.push({
        id: `c-${c.id}`,
        kind: "Component",
        title: c.name,
        summary: c.summary,
        href: `/components/${c.id}`,
      });
    }
    for (const p of registry.compositionPatterns) {
      entries.push({
        id: `p-${p.id}`,
        kind: "Composition",
        title: p.name,
        summary: p.summary,
        href: "/marketing/compositions",
      });
    }
    for (const v of registry.visualAssets) {
      entries.push({
        id: `v-${v.id}`,
        kind: "Visual Asset",
        title: v.name,
        summary: v.summary,
        href: "/marketing/visual-assets",
      });
    }
    for (const s of registry.sections) {
      entries.push({
        id: `s-${s.id}`,
        kind: "Section",
        title: s.name,
        summary: s.summary,
        href: "/marketing/sections",
      });
    }
    for (const t of registry.templates) {
      entries.push({
        id: `t-${t.id}`,
        kind: "Template",
        title: t.name,
        summary: t.summary,
        href: t.register === "marketing" ? "/marketing/templates" : "/components/templates",
      });
    }
    for (const tok of registry.tokens.light.slice(0, 40)) {
      entries.push({
        id: `tok-${tok.path}`,
        kind: "Token",
        title: tok.cssVar,
        summary: `${tok.value} · ${tok.description}`,
        href: "/foundations/tokens",
      });
    }
    return entries;
  }, []);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex.slice(0, 10);
    return searchIndex
      .filter((e) => e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.kind.toLowerCase().includes(q))
      .slice(0, 14);
  }, [query, searchIndex]);

  const renderSidebarTree = (onSelect?: () => void) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              padding: "0 10px 4px",
              fontSize: "var(--text-micro, 0.75rem)",
              fontWeight: 600,
              color: "var(--fg-default)",
              letterSpacing: "0.01em",
            }}
          >
            {group.title}
          </div>
          {group.items.map((item) => {
            const isActive = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={onSelect}
                className="portal-sidebar-link millar-focus"
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-micro, 0.75rem)",
                      color: isActive ? "var(--tone-brand-fg)" : "var(--fg-subtle)",
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-app)", color: "var(--fg-default)" }}>
      <a
        href="#portal-main"
        className="millar-focus"
        style={{
          position: "absolute",
          left: -9999,
          top: 8,
          zIndex: 12000,
          padding: "8px 14px",
          borderRadius: "var(--radius-sm, 8px)",
          backgroundColor: "var(--accent)",
          color: "var(--fg-on-accent)",
          textDecoration: "none",
          fontWeight: 500,
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "12px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
        }}
      >
        Skip to main content
      </a>

      {/* Slim Sticky Portal Utility Header (56px) */}
      <header
        style={{
          position: "sticky",
          top: 0,
          height: 56,
          zIndex: "var(--z-nav, 60)" as unknown as number,
          backgroundColor: "var(--bg-sidebar)",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            width: "100%",
            margin: "0 auto",
            padding: "0 clamp(14px, 2.5vw, 24px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" className="millar-focus" style={{ textDecoration: "none", borderRadius: 8 }}>
              <HahlexLockup variant={theme === "dark" ? "on-dark" : "color"} size={24} sublabel="Millar" />
            </Link>
            <span className="portal-desktop-only">
              <Badge tone="brand">v{registry.version} Draft</Badge>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              variant="white"
              size="sm"
              onClick={() => setSearchOpen(true)}
              aria-label="Search Millar (Ctrl+K)"
              icon={<IconSearch size="sm" />}
            >
              <span className="portal-desktop-only" style={{ gap: 10, alignItems: "center" }}>
                <span style={{ color: "var(--fg-muted)" }}>Search documentation...</span>
                <kbd style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-muted)" }}>
                  Ctrl K
                </kbd>
              </span>
            </Button>

            <div className="portal-desktop-only" style={{ gap: 8, alignItems: "center" }}>
              <ChoiceToggle
                label="Theme"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
              <ChoiceToggle
                label="Specimen language"
                value={locale}
                onChange={setLocale}
                options={[
                  { value: "en", label: "EN" },
                  { value: "vi", label: "VI" },
                ]}
              />
            </div>

            <span className="portal-mobile-only">
              <Button
                variant="white"
                size="sm"
                iconOnly
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                icon={mobileMenuOpen ? <IconClose size="md" /> : <IconMenu size="md" />}
              />
            </span>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Navigation Drawer (<= 960px) */}
      {mobileMenuOpen ? (
        <nav
          aria-label="Mobile navigation"
          style={{
            padding: "16px 16px 24px",
            borderBottom: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "75vh",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 12, borderBottom: "1px solid var(--border-soft)" }}>
            <ChoiceToggle
              label="Mobile theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <ChoiceToggle
              label="Mobile specimen language"
              value={locale}
              onChange={setLocale}
              options={[
                { value: "en", label: "EN" },
                { value: "vi", label: "VI" },
              ]}
            />
          </div>
          {renderSidebarTree(() => setMobileMenuOpen(false))}
        </nav>
      ) : null}

      {/* Geist-Style Three-Column Documentation Body (Left Nav + Focused Canvas + Right On-This-Page TOC) */}
      <div className="portal-shell-body">
        <aside aria-label="Millar documentation navigation" className="portal-sidebar-desktop">
          <nav aria-label="Primary documentation">{renderSidebarTree()}</nav>
        </aside>

        <main id="portal-main" tabIndex={-1} className="portal-main-canvas">
          {children}
          <DocPagination />
        </main>

        <RightSidebar />
      </div>

      {/* Semantic Top-Level Footer strictly outside <main> */}
      <MillarSiteFooter version={`v${registry.version}-draft · DTCG ${registry.dtcgSpecVersion}`} />

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search Millar Design System">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search colors, typography, button, visual assets, tokens..."
            aria-label="Search Millar catalog"
            className="millar-focus"
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px",
              borderRadius: "var(--radius-control, 10px)",
              border: "1px solid var(--border-strong)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--fg-default)",
              fontSize: "var(--text-body-sm, 0.875rem)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
            {searchHits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  router.push(hit.href);
                }}
                className="millar-focus"
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm, 8px)",
                  border: "1px solid var(--border-soft)",
                  backgroundColor: "var(--bg-surface-2)",
                  color: "var(--fg-default)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ fontSize: "var(--text-body-sm, 0.875rem)", fontWeight: 600 }}>{hit.title}</strong>
                  <Badge tone="neutral" dot={false}>
                    {hit.kind}
                  </Badge>
                </div>
                <span style={{ fontSize: "var(--text-meta, 0.8125rem)", color: "var(--fg-muted)" }}>{hit.summary}</span>
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
