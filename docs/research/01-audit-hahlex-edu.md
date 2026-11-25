# Audit 01: Product/App Codebase (`hahlex-edu` + `hahlex-edu-design-system.html`)

> **Status**: Evidence Baseline (Read-Only Audit, 2026-11-25)  
> **Primary Sources Inspected**: `d:\projects\hahlex-edu` (`DESIGN.md`, `CLAUDE.md`, `AGENTS.md`), `d:\projects\hahlex-edu\education-platform` (`apps/web`, `packages/math-figure`, `deploy/production/keycloak-themes/hahlex`, `DESIGN.md`, `GLOSSARY.md`, `AGENTS.md`), and `d:\projects\Hahlex-Data\design-system\hahlex-edu-design-system.html`.  
> **User Direction**: `hahlex-edu` is the reference standard for Product/App Design, audited critically without assuming every current implementation choice is correct.

---

## 1. Live Governance Script Baseline

Executed read-only against `d:\projects\hahlex-edu\education-platform\apps\web`:

| Check Script | Result | Verified Scope |
| :--- | :--- | :--- |
| `node scripts/check-theme-tokens.mjs` | **PASS** | 58 mirrored colors in `themeTokens.ts` match `base.css` 1:1; z-index ladder verified |
| `node scripts/check-palette.mjs` | **PASS** | 1,398 files scanned; zero colors outside Hahlex tokens (within explicit allowlist) |
| `node scripts/check-raw-controls.mjs` | **PASS** | `button=0/0`, `input=1/1` raw HTML controls inside `src/features/**` |
| `node scripts/check-no-em-dash.mjs` | **PASS** | 1,415 web source files scanned; zero `U+2014` em-dash characters |
| `node scripts/check-page-headers.mjs` | **PASS** | 632 feature files scanned; 12 documented exceptions |

---

## 2. Classification: What Works vs. What Drifts vs. What Must Change

### 2.1 Canonical Existing Standards (Production-Grade, Adopt Into Millar)

1. **CSS Cascade Layer Architecture**: `@layer legacy, v2reset, base, components, antd, utilities;` (`apps/web/src/styles/tailwind.css:32`) paired with Ant Design `<StyleProvider layer>` (`AntdThemeProvider.tsx:250`) and scoped `.ui-v2` reset (`src/styles/ui-v2-reset.css`). Enables Tailwind utilities to override Ant Design 6 cleanly without breaking legacy CSS.
2. **Literal Theme Mirror + Automated Contrast/Color-Blind Gates**: `src/styles/base.css` mirrored as literal hex/rgba in `src/shared/ui/themeTokens.ts` (avoiding `@ant-design/colors` `generate()` collapse on `var()` strings), guarded by `scripts/check-theme-tokens.mjs` and automated WCAG + Machado protan/deutan ΔE tests in `src/shared/ui/antdTheme.test.ts` (515 lines).
3. **White-First Warm Sand + Warm Obsidian Dark Palette**: Verified high-contrast text floors (`16.03:1` light / `16.74:1` dark primary ink; `5.33:1` light / `5.49:1` dark subtle ink even on hover rows; `12.09:1` light / `7.67:1` dark primary CTA). Hard invariants: **Zero CSS Gradients** and **Zero Em-Dash (`U+2014`)**.
4. **Bilingual Vietnamese/English Typography & Diacritic Safety**:
   - `Geist` (display `300-400` >= 28px; SaaS headings `500-600` 16-22px) + `Inter` (`opsz 14..32`, `+0.01em` UI / slim `opsz 24` `wght 380/370` AI chat prose) + `Geist Mono` (`1.85` block leading).
   - Non-blocking CSP-safe font loading via `<link media="print" data-deferred-fonts>` flipped in `src/shared/ui/fontLoading.ts:14-19`.
   - Dynamic `document.documentElement.lang = locale` (`src/i18n.tsx:159`) triggers `:root:lang(vi)` leading/tracking safety (`src/styles/base.css:628-639`) so stacked Vietnamese diacritics (`Ắ, Ấ, Ể, Ổ, Ẵ, Ự`) and `ư/ơ` horns never collide.
5. **Single Semantic Icon Registry**: `src/shared/ui/icons.tsx` (~210 semantic aliases over `lucide-react` `1.56.0`, constant `1.5px` `absoluteStrokeWidth`), lint-enforced (`eslint.config.js:10-19`) with 1,099 audited action sites (`docs/icon-coverage.md`).
6. **60 Primitives Behind Clean UI Boundary (`src/shared/ui/primitives/`)**:
   - Promise-aware `Button` double-click guard + `aria-busy` focus retention (`button.tsx:139-299`) + coarse-pointer hit expansion (`button.tsx:52`).
   - Dirty-form backdrop protection on `Dialog` (`dialog.tsx:42-66`) + automatic phone `92dvh` bottom-sheets for both `Dialog` and `Drawer` (`antd-hahlex.css:302-329`, `drawer.tsx:44-58`).
   - Zero-scrollbar `DataTable` with `fit` mode + `mobileCard` below 640px (`data-table.tsx:94-121`), mobile split `DatePicker` (`date-picker.tsx:153-226`), `OverflowTabs`, `FilterBar`, `MoreOptions`, `ConfirmDialog`, and accessible `AppShell` skip-link + `inert` modal mobile drawer (`AppShell.tsx:650-669,966`).
7. **Canonical Z-Index Ladder**: 17 named tiers (`--z-base: 1` through `--z-toast: 12000`), mirrored in `src/shared/ui/zIndex.ts` and CI-verified.

---

### 2.2 Spec-vs-Code Drift & Internal Duplications

| # | Area | Spec / Gallery Claim | Actual Live Implementation | Source Evidence |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Dark Skill Tones in HTML Spec** | `hahlex-edu-design-system.html:329-358` | `src/styles/base.css:512-540` & `DESIGN.md:147-152` | All 6 dark skill/sub-skill token families differ (e.g., `--tone-sky-fg` `#b4cee4` vs `#a9c6de`, `--tone-rose` `#e0855e` vs `#e08a63`, `--tone-indigo-border` `#35384d` vs `#3a3d58`). |
| 2 | **Missing Tokens & Font Weights in HTML Spec** | `hahlex-edu-design-system.html:9,48-65` | `src/styles/base.css:63-73`, `index.html:22` | HTML uses `--leading-card-heading` instead of `--leading-card`, omits `--leading-section` and `--tracking-chat`, and loads `Inter:wght@400..700` (missing weight `300` needed for `380/370` chat prose). |
| 3 | **Stale In-App Gallery (`DesignSystemView`)** | `src/features/internal/DesignSystemView.tsx:202-211` | `src/styles/base.css:320-332` | Prints obsolete pre-ElevenLabs sizes (`body: 14px`, `body-sm: 13px`, `meta: 12px`, `micro: 11px` vs live `15/14/13/12px`) and omits all 4 Display tokens, `--text-lead`, and `--space-12`. |
| 4 | **Danger Button Spec vs Code** | `hahlex-edu-design-system.html:716-720` (solid crimson fill) | `primitives/button.tsx:37` (outlined transparent) | HTML spec `.btn-danger` uses `#fff` on `--status-error` (**2.51:1 FAIL** in dark mode on `#f0857f`). Real `Button` is outlined (`6.97:1` PASS). |
| 5 | **Button Variants & Weights** | `DESIGN.md:271-276` (`500` weight, `secondary` bordered) | `primitives/button.tsx:33-40` | `white`, `ghost`, `row` use `font-normal` (`400`); `secondary` has no border; `row` variant is undocumented. |
| 6 | **Motion Fast Duration & Export** | `base.css:86` (`150ms`), `ui.md:523` (`MOTION_TRANSITION`) | `tailwind.config.ts:194`, `motion.ts:9` (`140ms`, no `MOTION_TRANSITION`) | `150ms` in CSS vs `140ms` in JS/Tailwind; `MOTION_TRANSITION` cited in docs does not exist. |
| 7 | **Icon Sizes & IconBox Radius** | `DESIGN.md:210,249-250` (`8px` radius, `20px` sidebar, `32px` EmptyState) | `icons.tsx:293,313`, `AppShell.tsx:1038`, `empty-state.tsx:47` | `IconBox` uses `rounded-control` (`10px`) and `14/16/20px` icons; sidebar uses `16px`; `EmptyState` uses `20px`. |
| 8 | **Wordmark Casing & Sidebar Lockup** | `DESIGN.md:17,32,73` (`Hahlex`, `600`, in sidebar) | `AppShell.tsx:671`, `AuthCardShell.tsx:45`, `keycloak/.../hahlex.css:42,46` | `BrandMark.tsx` is unused dead code; `AuthCardShell` renders lowercase `hahlex`; Keycloak CSS forces `font-weight: 400; text-transform: lowercase`. |
| 9 | **Input/Select Focus Spec vs Code** | `DESIGN.md:282`, `styling.md:220` (`hhx-focus` 2px outline) | `antd-hahlex.css:36-64`, `input.tsx:52`, `textarea.tsx:69` | `Input`/`TextArea` omit `hhx-focus` and `antd-hahlex.css:60-64` explicitly sets `outline: none !important; box-shadow: none !important;`, leaving only a `1px` border shift. |
| 10 | **Dual Menu Stack** | `ui.md:103` (`ActionMenu` preferred) | `dropdown-menu.tsx` (Radix) vs `action-menu.tsx` (AntD) | 16 feature files + `AppShell` use Radix `DropdownMenu`; 51 feature files use AntD `ActionMenu`. |
| 11 | **Elevation Level Drift** | `DESIGN.md:230` (Level 3 `--shadow-popover` on overlays) | `dropdown-menu.tsx:12`, `antd-hahlex.css:623,704` | `DropdownMenuContent`, `.hhx-select-dropdown`, and `.hhx-filter-panel` apply Level 2 `shadow-card` instead of Level 3 `shadow-popover`. |
| 12 | **Radius, Scale & Legacy Alias Leakage** | `DESIGN.md:67-83,205` | `src/**`, `base.css:350-404`, `shell.css` | 54 uses of `rounded-full` vs 87 `rounded-pill`; 27 uses of default Tailwind `text-2xl`/`text-xs` (missing `--text-kpi`); sub-12px literals (`0.65rem`-`0.72rem`) in `shell.css`; 40+ deprecated `--color-*` aliases still in `base.css`. |
| 13 | **Default Theme Fallback Split** | `DESIGN.md:119` (White-first default) | `main.tsx:28`, `useDocumentTheme.ts:5` | CSS/HTML default `"light"`, while JS fallback defaults `"dark"` when `matchMedia` or `data-theme` is absent. |
| 14 | **Brand Logo Vector Fragmentation** | Single brand mark | `index.html:201-219`, `hahlex-edu-design-system.html:1204-1212`, `public/org/hahlex.png` | Three slightly different encodings of the arch+3-pillars mark (`index.html` SVG uses un-tokenized hexes `#eadabf`/`#3b3938`; HTML spec SVG redraws proportions; `public/logo.png` opaque white still used in `terms`/`privacy`; `manifest.webmanifest` lacks `192x192`/`512x512` icons). |
| 15 | **Doc & CI Gate Drift** | `apps/web/AGENTS.md:97`, `DESIGN.md:103-104`, `GLOSSARY.md:58` | `package.json:18-20`, `capabilities.ts:39-74`, `public/terms/index.html:25` | `bundle:check-excalidraw-lazy` does not exist (`bundle:check-katex-lazy` does); `DESIGN.md` understates CTA contrast (`10.8:1` vs actual `12.09:1`); `public/terms/index.html:25` carries legacy tagline `"Vận hành doanh nghiệp cùng AI"`. |

---

### 2.3 Education-Domain Coupling (Must Decouple From Millar Shared Foundations)

1. **Color Tokens & Primitives**: `base.css:152-153,228-277`, `tailwind.config.ts:54-56,86-111`, `primitives/badge.tsx`, and `primitives/stat.tsx` hard-wire `--mark-learner` and the 6 IELTS skill/sub-skill tones (`--tone-sky` Steel/Listening through `--tone-rose` Terracotta/Vocab) directly into core tokens with comments prohibiting non-skill use.
   - **Millar Fix**: Shared Foundations owns neutral Warm Sand, Brand Bronze/Espresso, Status (Moss/Ochre/Crimson), and product-agnostic Categorical Data-Viz slots. Education-specific skill tones move into a **Domain Extension Pack (`@hahlex/millar-domain-education`)**.
2. **Icon Registry**: `src/shared/ui/icons.tsx` mixes ~130 universal SaaS icons with ~80 education-specific aliases (`IconClass`, `IconCourse`, `IconQuestionBank`, `IconListening..IconSubskill`, `IconTuition`, `IconRubric`, etc.).
3. **AppShell & Legacy Naming**: `AppShell.tsx:78-175,720-726` imports `LearnerSwitcher`, hardcodes `"Trung tâm"` and `learning`/`education` nav groups, and retains legacy retail identifiers (`ShopSummary`, `ShopSwitcherMenu`, `myShops`, `shopee.png` in `logos.ts:60`).
4. **Domain Visual Packages**: `packages/math-figure` (SGK math SVG compiler, which bypasses Warm Sand and hardcodes Tailwind Slate hexes `#0f172a`/`#e2e8f0` at `index.ts:130-138`), `Radar.tsx` (rubric rings), `visualPalette.ts` (IELTS Task 1 maps), `YleCanvasTask.tsx` (Cambridge YLE crayons), and `BrandKitCard.tsx` (tenant slide decks).

---

### 2.4 Verified Accessibility & UX Gaps (WCAG 2.1/2.2 AA)

| Severity | Finding | Mathematical / Code Evidence | WCAG SC |
| :--- | :--- | :--- | :--- |
| **P0 Critical** | **Invisible Active Toggle in Dark Mode (`DropdownMenuChoiceRow`)** | `dropdown-menu.tsx:140` (`AppShell.tsx:884-909` Language/Theme menu): `data-[state=checked]:bg-accent-soft data-[state=checked]:text-fg-accent` renders `#d6b48a` on `#d6b48a` (**1.00:1** in dark mode, invisible!) and `#6b4d35` on `#d6b48a` (**3.93:1** FAIL in light mode). Fix: `text-fg-on-accent-soft` (**7.69:1 AAA**). | 1.4.3 (AA) |
| **P1 High** | **Standalone Input / TextArea Errors Not Announced** | `primitives/input.tsx:56`, `textarea.tsx:74`, `form-field.tsx:55` omit `role="alert"` / `aria-live="polite"` on inline error `<p>`. | 4.1.3 (2.1 AA) |
| **P1 High** | **Focus Ring Contrast & Removal Defects** | (a) `.app-crash-fallback-card button:focus-visible` (`styles.css:56`): `#d6b48a` on `#fff` = **1.95:1 FAIL**.<br>(b) `.sidebar-resize-handle` (`shell.css:222,231`): `outline: none`, dark bar `#6b4d35` on `#181715` = **2.34:1** (100%) / ~**1.8:1** (72%) FAIL.<br>(c) `antd-hahlex.css:36-64` strips `outline` & `box-shadow` from `Input`/`TextArea`/`Select`, leaving only a `1px` border shift. | 2.4.7 (AA), 1.4.11 (2.1 AA) |
| **P2 Medium-High** | **`HelpTooltip` Touch & Target Size Failures** | `help-tooltip.tsx:35-38`: `trigger={["hover", "focus"]}` omits `"click"` (broken on touch); bare `16x16px` icon button (< `24x24px` WCAG 2.5.8 minimum; stretches to `16x44px` below 640px). | 2.5.8 (2.2 AA), 1.4.13 (2.1 AA) |
| **P2 Medium** | **No Global `<MotionConfig reducedMotion="user">`** | Only 2 feature files wrap `framer-motion`; `App.tsx`/`main.tsx` do not wrap globally, leaving `Radar.tsx` and future motion unguarded. `hahlex-edu-design-system.html` lacks `@media (prefers-reduced-motion)`. | 2.3.3 (AAA / Best Practice) |
| **P2 Medium** | **Collapsed Sidebar Keyboard Tooltip & FilterBar ARIA** | `AppShell.tsx:1031-1039` uses native `title` only (invisible to keyboard focus). `FilterBar` (`filter-bar.tsx:165`) sets `aria-haspopup="dialog"` on an AntD `Popover` (`role="tooltip"`, no focus management). `Select` lacks standalone `invalid`/`aria-describedby`. | 1.4.13, 4.1.2 |
| **P2 Medium** | **Dark Mode Parity Outside Main SPA & Toast Styling** | `login.css:31-35` pins sign-in card to always-light while portaled popups render dark; Keycloak `hahlex.css` and `legal.css` are light-only. `ToastProvider` (`toast.tsx:55`) omits `ui-v2` root class so toast action buttons receive legacy `base.css` styles. | Consistency / Usability |
| **P3 Low-Medium** | **Dynamic `aria-label` i18n & Resting Input Border Contrast** | `tabs.tsx:135` / `overflow-tabs.tsx:154` concatenate Vietnamese keyboard instructions into dynamic `aria-label` (risk of untranslated SR speech in EN). Resting light `--border-default` (`#ebe3d7` on `#fff`) is **1.27:1** (< 3:1 WCAG 1.4.11 UI boundary guideline; deliberate minimalist trade-off to evaluate with a high-contrast mode). | 3.1.2, 1.4.11 |

---

## 3. Verified Mathematical Contrast Table (`hahlex-edu`)

| Token Pair | Light | Dark | WCAG 2.1 AA |
| :--- | :---: | :---: | :--- |
| `--fg-default` on `--bg-app` / `--bg-surface` | 16.03:1 | 16.74:1 | PASS (AAA) |
| `--fg-muted` on `--bg-app` / `--bg-surface` | 7.84:1 | 11.74:1 | PASS (AAA) |
| `--fg-subtle` on `--bg-elevated-hover` | 5.33:1 | 5.49:1 | PASS (AA) |
| Primary CTA (`#ffffff` on `--accent`) | 12.09:1 | 7.67:1 | PASS (AAA) |
| Primary CTA Hover (`#ffffff` on `--accent-hover`) | 15.01:1 | 6.24:1 | PASS (AA/AAA) |
| Success Solid (`--status-success-on-solid` on `-solid`) | 5.04:1 | 6.09:1 | PASS (AA) |
| Outlined Danger Button (`--status-error` on `--bg-surface`) | 6.96:1 | 6.97:1 | PASS (AA) |
| `DropdownMenuChoiceRow` checked (`--fg-accent` on `--accent-soft`) | **3.93:1** | **1.00:1** | **FAIL (BOTH)** |
| `AppErrorBoundary` focus (`--accent-soft` on `#ffffff`) | **1.95:1** | 8.96:1 | **FAIL (Light)** |
| `.sidebar-resize-handle` focus (`--accent` on `--bg-sidebar`) | 11.40:1 | **2.34:1** | **FAIL (Dark)** |
| HTML Spec `.btn-danger` (`#ffffff` on `--status-error`) | 6.96:1 | **2.51:1** | **FAIL (Dark, HTML only)** |

---

## 4. Inspection Coverage Note

- **Inspected**: Workspace/app docs (`DESIGN.md`, `AGENTS.md`, `CLAUDE.md`, `GLOSSARY.md`, `styling.md`, `ui.md`, `CSS_MIGRATION.md`, `icon-coverage.md`), full `hahlex-edu-design-system.html` (2,671 lines), all core stylesheets (`base.css`, `tailwind.css`, `ui-v2-reset.css`, `hahlex-theme.css`, `antd-hahlex.css`, `shell.css`, `chat.css`, `splash.css`, `login.css`, `responsive.css`, `keycloak/.../hahlex.css`), `themeTokens.ts`, `AntdThemeProvider.tsx`, `antdTheme.test.ts`, `icons.tsx`, `AppShell.tsx`, 33+ primitives in `src/shared/ui/primitives/`, `packages/math-figure`, and live execution of 5 CI governance scripts.
- **Not Inspected**: Live browser DOM/NVDA/JAWS/VoiceOver runtime testing, backend `apps/api` files, and non-UI business logic across all 600+ feature modules.
