import React, { useState } from "react";
import { IconClose, IconMenu } from "../icons.js";
import { Button } from "./Button.js";

/* --- PageHeader (Enforces <=1 primary CTA + clean operational heading hierarchy) --- */

export interface PageHeaderProps {
  title: string;
  meta?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  embedded?: boolean;
}

export function PageHeader({ title, meta, primaryAction, secondaryActions, embedded = false }: PageHeaderProps) {
  const Wrapper = embedded ? "div" : "header";
  const Heading = embedded ? "h3" : "h1";
  return (
    <Wrapper
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Heading
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-page-title, 1.375rem)",
            fontWeight: 600,
            lineHeight: "var(--leading-heading, 1.24)",
            letterSpacing: "var(--tracking-tight, -0.015em)",
            color: "var(--fg-default)",
          }}
        >
          {title}
        </Heading>
        {meta}
      </div>
      {primaryAction || secondaryActions ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {secondaryActions}
          {primaryAction}
        </div>
      ) : null}
    </Wrapper>
  );
}

/* --- AppShell (Product-agnostic workspace shell with skip-link & accessible mobile drawer) --- */

export interface AppShellNavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export interface AppShellProps {
  brand: React.ReactNode;
  navItems: AppShellNavItem[];
  onNavigate?: (id: string) => void;
  toolbarExtra?: React.ReactNode;
  embedded?: boolean;
  children: React.ReactNode;
}

export function AppShell({ brand, navItems, onNavigate, toolbarExtra, embedded = false, children }: AppShellProps) {
  const [navExpanded, setNavExpanded] = useState(true);
  const SidebarTag = embedded ? "div" : "aside";
  const MainTag = embedded ? "div" : "main";

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-app)", color: "var(--fg-default)" }}>
      {!embedded ? (
        <a
          href="#millar-main-content"
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
            fontSize: "var(--text-body-sm, 0.875rem)",
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
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", minHeight: 520, border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg, 16px)", overflow: "hidden" }}>
        <SidebarTag
          aria-label={embedded ? undefined : "Primary navigation"}
          style={{
            backgroundColor: "var(--bg-sidebar)",
            borderRight: "1px solid var(--border-default)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            {brand}
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={navExpanded ? "Collapse navigation" : "Expand navigation"}
              aria-expanded={navExpanded}
              onClick={() => setNavExpanded((prev) => !prev)}
              icon={navExpanded ? <IconClose size="md" /> : <IconMenu size="md" />}
            />
          </div>
          {navExpanded ? (
            <nav aria-label={embedded ? "Workspace preview sections" : "Workspace sections"} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  onClick={(e) => {
                    if (onNavigate) {
                      e.preventDefault();
                      onNavigate(item.id);
                    }
                  }}
                  className="millar-focus"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm, 8px)",
                    border: "1px solid",
                    borderColor: item.active ? "var(--tone-brand-border)" : "transparent",
                    backgroundColor: item.active ? "var(--tone-brand-soft)" : "transparent",
                    color: item.active ? "var(--tone-brand-fg)" : "var(--fg-muted)",
                    fontSize: "var(--text-body-sm, 0.875rem)",
                    fontWeight: item.active ? 600 : 500,
                    textDecoration: "none",
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          ) : null}
          {toolbarExtra ? <div style={{ marginTop: "auto" }}>{toolbarExtra}</div> : null}
        </SidebarTag>

        <MainTag id={embedded ? undefined : "millar-main-content"} tabIndex={embedded ? undefined : -1} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {children}
        </MainTag>
      </div>
    </div>
  );
}
