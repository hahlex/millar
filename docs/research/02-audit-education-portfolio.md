# Audit 02: Marketing Website Codebase (`education-portfolio`)

> **Status**: Evidence Baseline (Read-Only Audit, 2026-11-25)  
> **Primary Sources Inspected**: `d:\projects\education-portfolio` (full CSS across 4 files / 5,609 lines, all TSX sections/scenes/product demos, `worker/`, `scripts/cms.mjs`, `wrangler.jsonc`, `next.config.ts`, `Design.md`, `README.md`, `docs/CMS.md`, all 17 `content/*.json` files, brand assets, and all 14 live Playwright screenshots in `cms/shots/*.jpg`).  
> **User Direction**: `education-portfolio` informs Marketing Website implementation; its color atmosphere and typography feel are appreciated, while its content and layout suffer heavily from missing imagery and structure.

---

## 1. Tech Stack, Routing & Deployment Architecture (`hahlex.com/millar` Impact)

### 1.1 Stack (`package.json:1-31`, `next.config.ts:6-9`, `wrangler.jsonc:1-21`)
- **Framework**: Next.js `^15.5.28` App Router + React `^19.3.1` + TypeScript `5.9`, configured strictly as **static export** (`output: "export"`, `trailingSlash: true`, `experimental: { globalNotFound: true }`).
- **Styling**: Zero Tailwind / zero CSS-in-JS. Four hand-written global vanilla CSS files imported in `RootDocument.tsx:5-8` (`globals.css` 2,224L, `product.css` 1,517L, `live.css` 736L, `prompt.css` 1,128L = **5,609 lines / 112.4 KB uncompressed**).
- **Motion & 3D**: `motion` `^14.2.0`, `lenis` `^1.3.26`, `three` `^0.186.1` (~150+ KB gz for one section).
- **Icons**: `@ant-design/icons` `^6.3.4` (imported only for 11 decorative icons in `AppFrame.tsx` and `AssignmentStudio.tsx`).
- **CMS**: `@keystatic/core` + `@keystar/ui` bundled out-of-band via `esbuild` into `out/keystatic/` and `out/_cms/` (`scripts/cms.mjs:55-94`).
- **Hosting**: Cloudflare Workers Builds deploys Worker `hahlex-site` owning custom domains `hahlex.com` and `www.hahlex.com` (`wrangler.jsonc:15-18`) with Static Assets (`assets.directory: "./out"`, `run_worker_first: ["/", "/keystatic", "/keystatic/*", "/api/keystatic/*"]`).
- **Routing**: `/` (EN) and `/vi/` (VI); `worker/index.ts:33-46` inspects `User-Agent`, `hahlex_lang` cookie, and `request.cf.country === "VN"` ONLY on `pathname === "/"` (never touches `/millar`).

### 1.2 Critical Architectural & Security Findings for `hahlex.com/millar`
1. **Worker Ownership**: `hahlex-site` owns `hahlex.com`. Any request to `hahlex.com/millar` hits `./out` and returns `404.html` unless either:
   - **Option A (Recommended: Decoupled Cloudflare Worker + Service Binding)**: Millar lives in its own standalone repository/monorepo, builds as an independent Cloudflare Worker/Assets app with `basePath: "/millar"`, and `hahlex-site` adds `"/millar"` and `"/millar/*"` to `run_worker_first` (`wrangler.jsonc:13`) and forwards them via a **Cloudflare Service Binding** in `worker/index.ts`. Zero CSS/Lenis/Next.js coupling to `education-portfolio`!
   - **Option B (Static Artifact Drop-in)**: Build Millar statically and copy into `out/millar/` during `hahlex-site` build (couples deploy cycles of both repos).
   - **Option C (Subdomain `millar.hahlex.com`)**: Eliminates same-origin cookie risk entirely (see Finding #2), though URL is `millar.hahlex.com` rather than `hahlex.com/millar`.
2. **CRITICAL SAME-ORIGIN SECURITY CONSTRAINT (`docs/CMS.md:26-28`)**:
   - Keystatic stores a **short-lived (8h) GitHub OAuth write token for `hahlex/education-portfolio` in a JavaScript-readable cookie on `hahlex.com`**.
   - Therefore, any app served at `hahlex.com/millar` shares the exact same cookie origin! Millar Portal MUST enforce **zero third-party scripts**, strict **Content-Security-Policy (`script-src 'self'`)**, and **zero untrusted HTML/JSX execution** in interactive playgrounds (render sandboxed predefined React controls, never arbitrary `eval` / `dangerouslySetInnerHTML`). Long-term recommendation: migrate Keystatic to `cms.hahlex.com` or an `HttpOnly` server session.

---

## 2. Brand Identity, Logo & Wordmark

| Asset | Format / Status | Audit Finding |
| :--- | :--- | :--- |
| `public/brand/hahlex-mark.png` | `230x233` PNG (22.1 KB), Active | Arch + 3 vertical rounded pillars (tan arc, charcoal left pillar, tall tan center pillar, dark bronze right pillar). **Raster PNG only; no SVG source in repo.** Visibly soft/blurry at large display sizes (`cms/shots/cta.jpg`). |
| `src/app/icon.png` | PNG favicon, Active | Same raster arch mark. |
| `public/img/wordmark.png` | PNG (18.3 KB), **Unused** | Lowercase rounded geometric sans `"hahlex"` (mismatched legacy identity). |
| `public/og.jpg` | `1200x630` JPG, Metadata | Centered arch mark + Cormorant serif `"Hahlex"` + prompt bar (`#5D4127` send button). |
| `Logo.tsx:6-35`, `globals.css:189-210` | Active Lockup | `<img>` mark (`drop-shadow`) + `Cormorant Garamond` `700` `"Hahlex"` with synthetic faux-bold hack `-webkit-text-stroke: 0.025em currentColor`. Leftover `--logo-ink` CSS var at 5 sites is dead (unused by PNG). |

- **Naming Convention (`globals.css:133-136`, `site.ts:138-184`)**: Always Title Case `"Hahlex"` (even inside uppercase headlines via `.brand-word { text-transform: none }`). Ecosystem hierarchy: **Hahlex** (`hahlex.com`) -> **Hahlex Education** (`edu.hahlex.com`) + **Hahlex Studio** (`portfolio.hahlex.com`).

---

## 3. Typography Audit & Comparison vs. Millar Direction

### 3.1 Currently Loaded Fonts (`src/app/fonts.ts:1-43`)
1. `Archivo` (`wdth 125%`, `800 ExtraBold`, `UPPERCASE`, `0.92` EN / `1.06` VI leading, `latin + vietnamese`) for Display H1/H2.
2. `Poppins` (`400-700` normal+italic = 8 faces, `latin + latin-ext`, **NO Vietnamese subset**) for English body/UI.
3. `Be_Vietnam_Pro` (`400-700` normal only, **NO italic face**, `latin + vietnamese`) for `[lang="vi"]` body and `.pui` product mockups.
4. `Cormorant_Garamond` (`600-700`) solely for the `"Hahlex"` wordmark.
5. `Bebas_Neue` (`400`) almost completely dead (used only on 15px `.loop__num` step numbers!).
6. **Zero monospace font** loaded anywhere.

### 3.2 Concrete Bugs & Cross-Repo Gap
- **Broken Vietnamese glyphs on EN page**: `WorkflowSection.tsx:160` renders `"Bùi Ngọc Diệp"` and `"Giao tiếp A2"` in `Poppins` (no Vietnamese glyphs, no `lang="vi"`), falling back to mismatched system fonts on accented characters.
- **Synthetic italic in Vietnamese**: `Be_Vietnam_Pro` loads no italic styles, causing faux browser oblique slanting on `.live__try`.
- **Good Vietnamese safeguard worth preserving**: `:root:lang(vi) .line-mask` adds `padding-top: 0.16em; margin-top: -0.16em` (`globals.css:2218-2224`) so stacked capitals (`Ộ, Ầ, Ẫ`) never clip inside `overflow: hidden` reveal wrappers.
- **Typography Tension vs. Millar Direction**:
  - `education-portfolio` uses loud, wide, `800 ExtraBold` uppercase `Archivo` + `Poppins`/`Be Vietnam Pro` + `Cormorant Garamond` wordmark (5 font families, 16+ files).
  - Millar target (`hahlex-edu` standard + user prompt) specifies **`Geist Sans`** (`300-400` Display, `500-600` small headings) + **`Inter`** (Body/UI) + **`Geist Mono`** (Code/Technical) (3 families, full native Vietnamese coverage, zero EN/VI font-switch seam).

---

## 4. Colors & Theme System

### 4.1 What Works Well (Marketing Warm Editorial Palette, `globals.css:2-29`)
- **Warm Cream / Sand Light Surfaces**: `--hx-cream-50` (`#FFFCF8`), `--hx-cream-100` (`#FCF8F3`), `--hx-sand-200` (`#F6EBDE`), `--hx-sand-300` (`#EBDFD0`), `--hx-sand-400` (`#E2CDB2`).
- **Deep Espresso Dark Surfaces**: `--hx-espresso-900` (`#120C08`), `--hx-espresso-800` (`#1A130D`), `--hx-espresso-700` (`#2A2018`), `--hx-espresso-600` (`#3E3128`).
- **Slide Bronze Brand Ramp**: `--hx-bronze-700` (`#7A4E16`), `--hx-bronze-600` (`#8F5B1E`), `--hx-bronze-500` (`#A26A25`), `--hx-bronze-400` (`#C08A4A`), `--hx-bronze-300` (`#D8B088`).
- **Editorial Ink**: `--hx-ink-900` (`#141210`), `--hx-ink-700` (`#3A332C`), `--hx-ink-500` (`#6E635A`), `--hx-paper` (`#FFF8F0`), `--hx-paper-muted` (`#C9B8A4`).
- **Strength**: Warm paper-cream + rich espresso + metallic bronze creates a memorable, tactile editorial identity distinct from generic blue/purple AI SaaS sites.

### 4.2 Color Conflicts, Drift & Misuse
1. **Conflicting Second Palette (`.pui` in `product.css:20-37`)**: Product mockups inject 17 separate `--p-*` tokens (`--p-accent: #6B4D35`, `--p-bg: #F6F4EE`) that visually clash against marketing bronze (`#A26A25` / `#7A4E16`) and cream (`#FFFCF8`).
2. **Stark `#FFFFFF` Surface Intrusions**: `prompt.css:115` (`AskCentre`) and `prompt.css:887` (`CtaSection`) override warm cream/espresso with stark `#FFFFFF`, breaking visual continuity and creating harsh section seams.
3. **Semantic Red Misuse**: `Design.md §1.3:47` reserves `--hx-red-500` (`#D32020`) strictly for pain/problems. In live code, red is misused on positive copy: `"promising"` (`ValueSection.tsx:88`) and `"FOUNDING TEAM"` + member roles/universities (`TeamSection.tsx:23`, `globals.css:1908-1914`).
4. **Hardcoded Hex Sprawl**: 28-33 unique raw hex literals per stylesheet bypass even the local `--hx-*` and `--p-*` variables, plus raw hexes in TSX (`HomePage.tsx`, `OrbitSection.tsx`, `WorkflowSection.tsx`) and GLSL (`HandsDotField.tsx`).
5. **No User Theme Switching**: Light and dark sections alternate in fixed order; zero `data-theme` or `prefers-color-scheme` support.

---

## 5. Section Inventory & Root-Cause Aesthetic Diagnosis ("Why It Looks Weak Without Images")

### 5.1 Complete 13-Section Audit (`HomePage.tsx:23-49` + `cms/shots/*.jpg`)

| # | Section | Surface & Height | Media | Concrete Visual / Layout Defects Verified |
| :--- | :--- | :--- | :--- | :--- |
| 0 | `Navbar` | Transparent -> Dark glass | `hahlex-mark.png` | **Zero mobile navigation**: `.nav__links { display: none }` at `<=900px` (`globals.css:354-358`) with no hamburger or drawer. |
| 1 | `AskCentre` (`#top`) | `#FFFFFF`, `100svh` | `hahlex-mark.png` | Generic "ChatGPT box over 5 spinning rings" above the fold; hard crash into `#1A130D` below. |
| 2 | `HeroSection` (`#story`) | `#1A130D`, sticky `340vh` | `hand-human.webp`, `hand-robot.webp` (WebGL) | Strongest visual craft on site, but buried as Section #2 and consumes 3.4 viewports for a 6-word tagline. |
| 3 | `OrbitSection` (`#one-system`) | `#FFFCF8`, sticky `260vh` | `hahlex-mark.png` | `ScrollWords` traps body text at `opacity: 0.16`; crude `scale: 0.56` + negative margins on mobile (`<=560px`); `.band` gradient fails contrast. |
| 4 | `ValueSection` | `#FFFCF8`, flow | `learners-group.webp` (**only lifestyle photo on entire site!**), `paper-tear.webp` | Only genuine editorial composition, marred by red `"promising"`. |
| 5 | `AssignmentStudio` (`#assignments`) | `#1A130D`, sticky `300vh` | None | **Empty-box defect**: enters at `step=0` showing a 400px blank cream rectangle + empty prompt bar (`cms/shots/assignments.jpg`). Lede hidden on mobile `<=900px`. |
| 6 | `Personalise` (`#personalise`) | `#FCF8F3`, sticky `420vh` | None | **4.2 viewports of scroll** opening to another 400px blank rectangle (`cms/shots/personalise.jpg`). Repeats #5 layout. |
| 7 | `LearnerProfile` (`#profile`) | `#1A130D`, sticky `260vh` | `hahlex-mark.png` | 3rd consecutive text-left / prompt-right scrub; enters as a lonely pill floating in brown void (`cms/shots/profile.jpg`); fake `<span>` `"Edit"` button. |
| 8 | `LiveDemo` (`#demo`) | `#1A130D`, flow | `hahlex-mark.png` | **Exact duplicate widget**: renders the same `ChatDemo` card over rings as Section #1 (`AskCentre`). |
| 9 | `FilmSection` (`#film`) | `#FCF8F3`, flow | `hahlex-film-poster.webp` | Clean YouTube click-to-load facade, though poster is another UI collage card. |
| 10 | `WorkflowSection` (`#workflow`) | `#1A130D`, sticky `300vh` | None | **Text-over-stroke collision**: Steps 4 and 9 overlap the SVG track line (`cms/shots/workflow.jpg`); all 9 step labels `display: none` at `<=900px`. |
| 11 | `TeamSection` (`#team`) | `#FCF8F3`, flow | 6 x 96px grayscale `team-*.webp` | Plain 3-col grid with tiny 96px circles and alert-red titles/schools (`cms/shots/team.jpg`). |
| 12 | `FaqSection` (`#faq`) | `#FCF8F3`, flow | None | Clean `<details>` semantics, **but** Q7 on EN page is in Vietnamese (`content/faq.json:31-32`) and duplicates Q1 on `/vi/`. |
| 13 | `CtaSection` (`#start`) | `#FFFFFF`, `100vh` | `hand-human.webp`, `hand-robot.webp`, `hahlex-mark.png` | **Visual collision**: robot hand overlaps `"S"` of `"NOW LET'S"` (`cms/shots/cta.jpg`); `"start....."` has 5 dots; blurry bronze button glow; `<footer>` trapped inside `<main><section>`. |

### 5.2 Five Root Causes of the "Basic / Weak When Images Are Missing" Problem
1. **Photography Starvation + 19 Orphaned Assets**: Only **1 editorial photo** renders across 13 sections, while 13 images in `public/img/` (real student/classroom photos, Vietnam map, mascot) and 6 product screenshots in `public/product/` sit unused on disk alongside an unused **21.3 MB** `public/video/hahlex-film.mp4`.
2. **Fake AI Chatbox Crutch**: 5 of 13 sections lean on white rounded prompt bars/chat cards (`AskCentre` and `LiveDemo` literally duplicate `ChatDemo` over generic spinning rings).
3. **1,880vh of Sticky Scroll-Scrubbed Empty Canvas**: Sections #5, #6, and #7 reserve `380-400px` blank frames waiting for scroll-scrubbed typing, so scanners see empty rectangles and `16%` opacity `ScrollWords` paragraphs.
4. **No Architectural Visual Grammar for Text-Only / Diagram Sections**: Without photography, sections collapse into repetitive 2-column text-left / box-right splits or plain unstyled 3-column text grids, lacking structural gridlines, typographic hierarchy contrast, procedural SVG schematic diagrams, or stylized product-chrome compositions.
5. **Cascade Override Rot**: `prompt.css` patches 3 earlier stylesheets (`5,609` total CSS lines, ~50% dead selectors for removed sections like `PainSection`, `SeenSection`, `AgentsSection`, `ProofSection`, leaving `Design.md` ~60% diverged from live code).

---

## 6. Accessibility, Motion & Performance Audit (WCAG 2.0/2.1/2.2 AA)

### 6.1 Verified Contrast Failures (WCAG 1.4.3 / 1.4.11)
| Severity | Ratio | Pair | Location |
| :--- | :---: | :--- | :--- |
| **Critical** | **1.90:1 - 2.86:1** | `#FFF8F0` on `#C08A4A -> #D8B088` | `.band` (`globals.css:789-805`) |
| **Critical** | **2.86:1** | `#FFF8F0` on `#C08A4A` | `.btn--bronze:hover` (`globals.css:251-253`) |
| **Serious** | **4.31:1** | `#FFF8F0` on `#A26A25` | `.btn--bronze` default (`globals.css:246-250`, normal text < 4.5:1) |
| **Serious** | **4.05:1 / 4.29:1** | `#A26A25` on `#1A130D` / `#FCF8F3` | `.label--bronze` `12.5px` (`globals.css:147-149`) |
| **Serious** | **< 2.0:1** | `opacity: 0.16` | `ScrollWords.tsx:7` dimmed body paragraphs |
| **Serious** | **2.69:1** | `#A39D92` on `#FFFFFF` | `.pb__ph` fake prompt placeholder (`prompt.css:38-40`) |
| **Moderate** | **1.28:1 - 3.67:1** | `#FFFFFF` on `#E8E3D9`/`#C9C4BA`; `#8A857C` on `#FFF` | `.pb__send`, `.gpt__send:disabled`, `.pz2-stages li` |

### 6.2 Structural, Keyboard & Motion Defects
- **Zero Focus Ring on Chat Input**: `.gpt__composer input` (`prompt.css:352-360`) sets `outline: none` with no `:focus-within` ring (WCAG 2.4.7 FAIL).
- **No Skip Link & Broken `<footer>` Landmark**: Missing skip-to-main link (WCAG 2.4.1); `<footer>` nested inside `<main><section>` loses `contentinfo` landmark role (WCAG 1.3.1).
- **Hidden Focusable Navbar**: `Navbar` translates to `y: "-110%"` without `inert` or `visibility: hidden` (off-screen focus trap on reverse Tab).
- **Auto-Cycling Without Pause Control**: Both `ChatDemo` instances auto-cycle every 2.6s with no pause button (WCAG 2.2.2 Level A FAIL) and lack `aria-live="polite"`.
- **Fake Interactive Buttons & Broken `prefers-reduced-motion`**: Non-clickable `<span>` elements styled as `.pui-btn` (`AskCentre`, `AssignmentStudio`, `LearnerProfile`); zero `<MotionConfig reducedMotion="user">`; `HandsDotField.tsx:355-375` and `OrbitSection.tsx:73-75` run continuous off-screen `rAF` loops ignoring both `IntersectionObserver` and `prefers-reduced-motion`.
- **CWV Risks**: 21.3 MB unused `.mp4` deployed; `three` (~150 KB gz) + `@ant-design/icons` + 5 font families + 112 KB CSS; `<img>` tags in `ValueSection`, `TeamSection`, `CtaSection` omit `width`/`height`; `SmoothScroll.tsx:17-45` monkey-patches `Node.prototype.removeChild`/`insertBefore` globally.
