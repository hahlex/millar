# Production Cutover, Security Gates & Ecosystem Adoption Guide

This guide covers four operational steps after Millar `v0.1.0` completes verification:

1. **Mandatory Pre-Production Security Gate** before launching `hahlex.com/millar`.
2. **Adoption Playbook for `hahlex-edu`** (Product/App migration and audit defect remediation).
3. **Migration Playbook for `education-portfolio`** (Marketing Website upgrade and dead-asset cleanup).
4. **MCP Client Setup Matrix** across Claude Code, Cursor, VS Code, Antigravity, and Codex.

> **Production isolation note**: Neither `d:\projects\hahlex-edu` nor `d:\projects\education-portfolio` was modified during Phases 0-7. Execute the migrations below in dedicated, reviewed PRs per target repository.

---

## 1. Mandatory Pre-Production Cutover for `hahlex.com/millar` (BLOCKING SECURITY GATE)

Per [ADR-0003](../adr/0003-portal-deployment-and-cms-origin-isolation.md), `hahlex.com` is currently served by the `education-portfolio` Worker (`hahlex-site`), whose Keystatic CMS stores an 8-hour GitHub write token in a JavaScript-readable cookie on `hahlex.com` (`education-portfolio/docs/CMS.md`). Mounting a second application on the same origin before isolating that cookie creates a cross-app token exposure blast radius.

### Blocking Cutover Sequence (Execute Strictly in Order)

- [ ] **Step 1 (Mandatory Blocker): Isolate Keystatic CMS onto its own origin**
  - Move Keystatic CMS admin routes (`/keystatic/*` and `/api/keystatic/*`) to a dedicated origin (recommended: `cms.hahlex.com` via a dedicated Cloudflare Worker or Pages deployment), OR proxy GitHub OAuth through an `HttpOnly; Secure; SameSite=Strict` backend session so zero GitHub write tokens are readable by `document.cookie` on `hahlex.com`.
  - Verify via browser DevTools on `hahlex.com` that no GitHub/CMS auth cookie is scoped to `.hahlex.com` or readable from JavaScript on `hahlex.com`.
  - **Policy reminder**: Never treat `Content-Security-Policy` headers as a substitute for origin isolation. CSP is defense-in-depth only.
- [ ] **Step 2: Human Governance Promotion (`Draft -> Approved`)**
  - Review Millar `v0.1.0` tokens, components, visual assets, sections, and templates in the staging Portal.
  - Record human sign-off (`approvedBy`, ISO `approvedAt`) for entries promoted from `draft` to `approved`, then re-run `pnpm run compile && pnpm run check:governance`.
- [ ] **Step 3: Manual Assistive Technology Verification**
  - Automated Playwright + `axe-core` verified `0` Critical/Serious violations across Light and Dark modes on all 5 routes, plus keyboard skip-link, `Ctrl+K` dialog, Escape, and mobile drawer flows.
  - Complete manual screen-reader spot checks (NVDA on Windows/Firefox or Chrome, VoiceOver on macOS/Safari) across Portal navigation, `ChoiceToggle`, `Tabs`, `Dialog`, and `HelpTooltip` before formal WCAG 2.1 AA / Section 508 conformance sign-off.
- [ ] **Step 4: Deploy Independent `millar-portal` Cloudflare Worker**
  - Build static export: `pnpm --filter @hahlex/millar-portal run build` (outputs `apps/portal/out/` with `basePath: "/millar"` and `trailingSlash: true`).
  - Deploy `apps/portal` using `apps/portal/wrangler.jsonc` (`name: "millar-portal"`).
  - Attach a Worker middleware layer to inject per-request CSP nonces (`script-src 'self' 'nonce-<random>'`) on HTML responses while retaining `apps/portal/public/_headers` defense-in-depth headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).
- [ ] **Step 5: Wire Cloudflare Service Binding on `hahlex.com/millar*`**
  - Bind `MILLAR_PORTAL` service in the apex `hahlex-site` Worker and forward requests matching `/millar` or `/millar/*` to `env.MILLAR_PORTAL.fetch(request)`.
  - Smoke-test live URLs: `/millar/`, `/millar/foundations/`, `/millar/marketing/`, `/millar/product/`, `/millar/resources/`, `/millar/brand/hahlex-mark-color.svg`.

---

## 2. Adoption Guide for `hahlex-edu` (Product/App)

Migrate `hahlex-edu` from 4 hand-copied token files (`base.css`, `themeTokens.ts`, `DesignSystemView.tsx`, `hahlex-edu-design-system.html`) onto Millar's compiled SSoT while remediating the audited P0/P1/P2 defects.

### Package Installation

Publish `@hahlex/millar-*` to Hahlex's private npm registry (or link via workspace/tarball) and install:

```bash
pnpm add @hahlex/millar-tokens @hahlex/millar-ui @hahlex/millar-domain-education
```

### CSS & Tailwind v4 Wiring

Replace hand-maintained token declarations in `src/styles/base.css` with Millar's generated Tailwind v4 theme and optional Education extension pack:

```css
@import "tailwindcss";
@import "@hahlex/millar-tokens/tailwind";
@import "@hahlex/millar-tokens/education.css";
```

### Ant Design 6 Theme Parity (Zero Manual Drift)

Replace manual `themeTokens.ts` mirrors with Millar's generated Ant Design 6 adapter:

```tsx
import { ConfigProvider } from "antd";
import { createMillarAntdTheme } from "@hahlex/millar-ui";

export function AppThemeProvider({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return <ConfigProvider theme={createMillarAntdTheme(dark ? "dark" : "light")}>{children}</ConfigProvider>;
}
```

### Required Audit Remediation Checklist (`01-audit-hahlex-edu.md`)

- [ ] **P0 (Dark-mode invisible active toggle, `1.00:1`)**: Replace `bg-accent-soft text-fg-accent` in `dropdown-menu.tsx` and toggle controls with `bg-[var(--accent-soft)] text-[var(--fg-on-accent-soft)]` (`7.69:1` AAA) or adopt Millar's `<ChoiceToggle />`.
- [ ] **P1 (Form error announcements)**: Migrate `Input`/`TextArea` to Millar's primitives so errors bind via `aria-invalid` + `aria-describedby` + `role="alert"`.
- [ ] **P1 (Keyboard focus restoration)**: Remove global `outline: none` overrides in `antd-hahlex.css` and apply `.millar-focus` (`2px solid var(--focus-ring)`). Fix low-contrast focus states on `.app-crash-fallback-card` and `.sidebar-resize-handle`.
- [ ] **P1 (Touch-accessible tooltips)**: Replace hover-only `HelpTooltip` (`< 24px` target) with Millar's `<HelpTooltip />` (click + hover + Escape, `24x24px` target).
- [ ] **P1 (Global reduced motion)**: Wrap root motion tree with `<MotionConfig reducedMotion="user">`.
- [ ] **P2 (Brand & Typography consolidation)**: Replace raster logo usages with canonical `HahlexMark` SVG (`assets/brand/`), unify fonts to `Geist` + `Inter` + `Geist Mono`, and replace hardcoded IELTS skill badges with `<SkillDomainBadge />` and `<LearnerHighlight />` from `@hahlex/millar-domain-education`.
- [ ] **CI Enforcement**: Run `pnpm run check:design -- --register=product <changed-files>` in PR checks.

---

## 3. Migration Guide for `education-portfolio` (Marketing Website)

Upgrade `education-portfolio` from fragmented legacy CSS, unused photography/video, and WCAG contrast failures onto Millar's photo-free Marketing Register.

### Package Installation & CSS Wiring

```bash
pnpm add @hahlex/millar-tokens @hahlex/millar-ui @hahlex/millar-marketing
```

Import `@hahlex/millar-tokens/tokens.css` (or `@hahlex/millar-tokens/tailwind`) and set `data-register="marketing"` on marketing layouts.

### Required Audit Remediation Checklist (`02-audit-education-portfolio.md`)

- [ ] **Typography Consolidation (Q1)**: Remove `Archivo`, `Poppins`, `Bebas Neue`, and `Cormorant Garamond` faux-bold hacks; load self-hosted `Geist` (`300-600`), `Inter` (`400-600`, `vietnamese` subset), and `Geist Mono` (`400-600`).
- [ ] **Contrast Fixes (WCAG AA)**: Replace failing `.btn--bronze` (`#A26A25` `4.31:1` / `#C08A4A` `2.86:1`) with `--accent-editorial` (`#7A4E16` `7.17:1` / hover `#925E1E` `5.58:1`) and `--accent-on-stage-dark` (`#6B4D35` `7.67:1`). Replace failing `.band` (`1.90:1`) and dimmed `0.16` opacity prose with `--fg-muted` / `--fg-muted-on-stage-dark`.
- [ ] **Mobile Navigation (`<= 900px`)**: Replace hidden desktop links with a keyboard-accessible mobile drawer (matching `PortalShell.tsx`'s `aria-expanded` toggle + stacked nav).
- [ ] **Top-Level Footer Landmark**: Move `<footer>` out of `<main>` so `MillarSiteFooter` renders as a top-level sibling after `</main>`.
- [ ] **Eliminate Blank Sticky Scroll Traps & Fake Chatboxes**: Replace 1,880vh scroll-scrubbed voids and 5 repeated fake chatboxes with Millar's 6 diverse Composition Patterns (`HeroSpatialStage`, `EditorialEssaySplit`, `ProductStageShowcase`, `BentoNarrativeMosaic`, `WorkflowLoopSection`, `MetricMirrorSection`).
- [ ] **Reduced Motion & Focus Rings**: Restore visible `.millar-focus` rings on all form inputs and adopt Millar's static-first reduced-motion fallbacks.
- [ ] **Asset & CSS Purge**: Delete the 19 unused stock images, 21.3 MB unused `.mp4`, and ~50% dead legacy CSS once sections migrate.

---

## 4. MCP Client Setup & Verification Matrix

`@hahlex/millar-mcp` implements MCP `2026-07-28` with flat object JSON Schemas, `readOnlyHint: true`, dual text + `structuredContent` + `resource_link` tool outputs, 11 Tools, cacheable `millar://` Resources, and 3 Prompts.

### Build & Verify Locally First

```bash
cd d:\projects\millar
pnpm run compile
pnpm --filter @hahlex/millar-mcp run build
pnpm run test:mcp-stdio
```

Expected output:

```text
PASS: Real stdio binary verified | tools=11 | staticResources=66 | prompts=3
```

### Client Configuration Matrix

| Client | Transport | Config Location | Snippet |
|---|---|---|---|
| **Claude Code** | `stdio` | `.mcp.json` or `claude mcp add` | `claude mcp add millar -- node d:/projects/millar/packages/mcp/dist/stdio.js` |
| **Cursor** | `stdio` | `.cursor/mcp.json` | `{ "mcpServers": { "millar": { "command": "node", "args": ["d:/projects/millar/packages/mcp/dist/stdio.js"] } } }` |
| **VS Code (Copilot)** | `stdio` | `.vscode/mcp.json` | `{ "servers": { "millar": { "type": "stdio", "command": "node", "args": ["d:/projects/millar/packages/mcp/dist/stdio.js"] } } }` |
| **Antigravity** | `stdio` | MCP server config | `{ "mcpServers": { "millar": { "command": "node", "args": ["d:/projects/millar/packages/mcp/dist/stdio.js"] } } }` |
| **OpenAI Codex CLI** | `stdio` | `~/.codex/config.toml` | `[mcp_servers.millar]` + `command = "node"` + `args = ["d:/projects/millar/packages/mcp/dist/stdio.js"]` |
| **Shared Team Server** | Streamable HTTP | `PORT=3105 node packages/mcp/dist/http.js` | Connect clients to `http://127.0.0.1:3105/mcp` (health check at `/health`) |

### Verification Smoke Sequence in Any MCP Client

1. Read `millar://guidelines/invariants` -> confirm `approved-visual-assets-only` and `Draft -> Approved` rule appear.
2. Read `millar://tokens/resolved/dark/marketing` -> confirm `registerMeta` and `--fg-on-accent-soft` (`#362218`) appear.
3. Call `get_visual_assets(kind: "atmosphere")` -> confirm `warm-horizon-wash` returns `gradientPolicy: "approved-visual-asset"`.
4. Call `validate_design(register: "product", code: "<Button variant='destructive' style={{ background: 'linear-gradient(red, blue)' }} />")` -> confirm `automatedChecks.passed === false` AND `humanReviewCriteria.automated === false`.
