"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, Button, ChoiceToggle, Dialog, IconClose, IconMenu, IconSearch } from "@hahlex/millar-ui";
import { HahlexLockup, MillarSiteFooter } from "@hahlex/millar-marketing";

const NAV_ITEMS = [
  { href: "/foundations", label: "Foundations" },
  { href: "/marketing", label: "Marketing" },
  { href: "/product", label: "Product" },
  { href: "/resources", label: "Resources" },
] as const;

interface SearchEntry {
  id: string;
  kind: string;
  title: string;
  summary: string;
  href: string;
  status: string;
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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
    for (const g of registry.guidelines) {
      entries.push({ id: `g-${g.id}`, kind: "Guideline", title: g.title, summary: g.summary, href: g.register === "marketing" ? "/marketing" : g.register === "product" ? "/product" : "/foundations", status: g.status });
    }
    for (const c of registry.components) {
      entries.push({ id: `c-${c.id}`, kind: "Component", title: c.name, summary: c.summary, href: "/product", status: c.status });
    }
    for (const p of registry.compositionPatterns) {
      entries.push({ id: `p-${p.id}`, kind: "Composition", title: p.name, summary: p.summary, href: "/marketing", status: p.status });
    }
    for (const v of registry.visualAssets) {
      entries.push({ id: `v-${v.id}`, kind: "Visual Asset", title: v.name, summary: v.summary, href: "/marketing", status: v.status });
    }
    for (const s of registry.sections) {
      entries.push({ id: `s-${s.id}`, kind: "Section", title: s.name, summary: s.summary, href: "/marketing", status: s.status });
    }
    for (const t of registry.templates) {
      entries.push({ id: `t-${t.id}`, kind: "Template", title: t.name, summary: t.summary, href: t.register === "marketing" ? "/marketing" : "/product", status: t.status });
    }
    for (const tok of registry.tokens.light.slice(0, 40)) {
      entries.push({ id: `tok-${tok.path}`, kind: "Token", title: tok.cssVar, summary: `${tok.value} · ${tok.description}`, href: "/foundations", status: "draft" });
    }
    return entries;
  }, []);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex.slice(0, 8);
    return searchIndex
      .filter((e) => e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.kind.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, searchIndex]);

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

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: "var(--z-nav, 60)" as unknown as number,
          backgroundColor: "var(--bg-sidebar)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "12px clamp(16px, 3vw, 32px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/" className="millar-focus" style={{ textDecoration: "none", borderRadius: 8 }}>
              <HahlexLockup variant={theme === "dark" ? "on-dark" : "color"} size={26} sublabel="Millar" />
            </Link>
            <span className="portal-nav-desktop">
              <Badge tone="brand">v{registry.version} Draft</Badge>
            </span>
          </div>

          <nav aria-label="Primary navigation" className="portal-nav-desktop" style={{ alignItems: "center", gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="millar-focus"
                  style={{
                    padding: "7px 12px",
                    borderRadius: "var(--radius-sm, 8px)",
                    border: "1px solid",
                    borderColor: active ? "var(--tone-brand-border)" : "transparent",
                    backgroundColor: active ? "var(--tone-brand-soft)" : "transparent",
                    color: active ? "var(--tone-brand-fg)" : "var(--fg-muted)",
                    fontSize: "var(--text-body-sm, 0.875rem)",
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              variant="white"
              size="sm"
              onClick={() => setSearchOpen(true)}
              aria-label="Search Millar (Ctrl+K)"
              icon={<IconSearch size="sm" />}
            >
              <span className="portal-nav-desktop" style={{ gap: 6, alignItems: "center" }}>
                <span>Search</span>
                <kbd style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-muted)" }}>Ctrl K</kbd>
              </span>
            </Button>

            <div className="portal-nav-desktop" style={{ gap: 8, alignItems: "center" }}>
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

            <span className="portal-nav-mobile-trigger">
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

        {/* Accessible Mobile Navigation Panel (fixes missing mobile nav found in Audit 02) */}
        {mobileMenuOpen ? (
          <nav
            aria-label="Mobile navigation"
            style={{
              padding: "12px 16px 18px",
              borderTop: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className="millar-focus"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm, 8px)",
                    backgroundColor: active ? "var(--tone-brand-soft)" : "var(--bg-surface-2)",
                    color: active ? "var(--tone-brand-fg)" : "var(--fg-default)",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 6 }}>
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
          </nav>
        ) : null}
      </header>

      <main id="portal-main" tabIndex={-1} style={{ flex: 1 }}>
        {children}
      </main>

      <MillarSiteFooter version={`v${registry.version}-draft · DTCG ${registry.dtcgSpecVersion}`} />

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search Millar Single Source of Truth">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens, components, visual assets, composition patterns..."
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" }}>
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
