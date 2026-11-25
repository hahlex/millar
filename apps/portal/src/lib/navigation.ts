export interface NavItem {
  href: string;
  label: string;
  section: string;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const SIDEBAR_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Introduction", section: "Overview" },
    ],
  },
  {
    title: "Foundations",
    items: [
      { href: "/foundations/brand", label: "Brand & Logo", section: "Foundations" },
      { href: "/foundations/colors", label: "Colors & Themes", section: "Foundations" },
      { href: "/foundations/typography", label: "Typography", section: "Foundations" },
      { href: "/foundations/spacing", label: "Spacing, Grid & Surface", section: "Foundations" },
      { href: "/foundations/icons", label: "Icons", section: "Foundations", badge: "54" },
      { href: "/foundations/tokens", label: "Design Tokens", section: "Foundations" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/marketing/art-direction", label: "Art Direction", section: "Marketing" },
      { href: "/marketing/compositions", label: "Composition Patterns", section: "Marketing", badge: "6" },
      { href: "/marketing/visual-assets", label: "Visual Assets", section: "Marketing", badge: "14" },
      { href: "/marketing/motion", label: "Motion", section: "Marketing" },
      { href: "/marketing/sections", label: "Sections", section: "Marketing", badge: "10" },
      { href: "/marketing/templates", label: "Page Templates", section: "Marketing" },
      { href: "/marketing/do-dont", label: "Do's & Don'ts", section: "Marketing" },
    ],
  },
  {
    title: "Components",
    items: [
      { href: "/components/button", label: "Button", section: "Components" },
      { href: "/components/input", label: "Input & Forms", section: "Components" },
      { href: "/components/choice-toggle", label: "ChoiceToggle", section: "Components" },
      { href: "/components/card", label: "Card", section: "Components" },
      { href: "/components/badge", label: "Badge", section: "Components" },
      { href: "/components/stat", label: "Stat", section: "Components" },
      { href: "/components/tabs", label: "Tabs & Segmented", section: "Components" },
      { href: "/components/data-table", label: "DataTable & FilterBar", section: "Components" },
      { href: "/components/dialog", label: "Dialog & Feedback", section: "Components" },
      { href: "/components/app-shell", label: "AppShell & PageHeader", section: "Components" },
      { href: "/components/templates", label: "App Templates", section: "Components" },
      { href: "/components/education-extension", label: "Education Extension", section: "Components" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/resources/downloads", label: "Brand Downloads", section: "Resources" },
      { href: "/resources/skills", label: "Agent Skills Suite", section: "Resources", badge: "4" },
      { href: "/resources/mcp", label: "MCP Server & Agents", section: "Resources", badge: "13" },
      { href: "/resources/changelog", label: "Changelog & Governance", section: "Resources" },
    ],
  },
];

export const FLAT_NAV_ITEMS: NavItem[] = SIDEBAR_GROUPS.flatMap((g) => g.items);

export function normalizePath(pathname: string): string {
  let p = pathname || "/";
  if (p.startsWith("/millar")) {
    p = p.slice("/millar".length) || "/";
  }
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  return p || "/";
}

export function getPrevNext(pathname: string): { prev: NavItem | null; next: NavItem | null } {
  const norm = normalizePath(pathname);
  const idx = FLAT_NAV_ITEMS.findIndex((item) => item.href === norm);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? FLAT_NAV_ITEMS[idx - 1]! : null,
    next: idx < FLAT_NAV_ITEMS.length - 1 ? FLAT_NAV_ITEMS[idx + 1]! : null,
  };
}
