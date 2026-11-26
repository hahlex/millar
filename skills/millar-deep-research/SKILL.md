---
name: millar-deep-research
description: "Brand-first research, visual & motion DNA extraction, user-intent decoding, and world-class craft benchmarking skill (v0.3.0). Use BEFORE designing, coding, or prompting images whenever the user names a brand, supplies existing images/animations, shares reference URLs, or describes a target feel. Never hardcode another brand's palette or tropes: research the actual brand, local DESIGN.md/MCP tokens, and audience culture first, and emit crisp English Visual & Motion DNA specifications."
version: 0.3.0-draft.1
license: MIT
---

# Millar Deep Research v0.3: Brand-First Research & Visual DNA Extraction

Turn brand mentions, user-supplied assets, live references, and open briefs into an evidence-backed **Visual Research Dossier** (`.millar/research-dossier.md`). Downstream skills (`millar-design`, `millar-create-image`, `millar-animation`) consume this dossier with zero guesswork, zero hardcoded brand assumptions, and zero cross-page style drift.

## Non-Negotiable Principles

1. **Research Every Named Brand First (Zero Hardcoding):** Never hardcode any brand's hex palette, surface polarity, or visual tropes inside generic prompts or defaults. Whenever the user mentions ANY brand (Hahlex, an external company, an institution, or a client), research its real identity before picking a single color, typeface, lighting direction, or motif.
2. **Author All Extracted Prompts & Specs in English:** Write every Visual DNA description, photographic art-direction rule, and motion brief in crisp, idiomatic English so image models and coding agents execute at peak precision. Keep only visible rendered UI/artwork copy in the user's target locale (e.g., Vietnamese).
3. **Visual Authority Is Evidence, Not a Filename:** Missing `DESIGN.md` does not make an existing site greenfield. Inspect rendered pages, CSS variables, brand kits, and user-supplied files directly.

## Execution Sequence

### Step 1: Decode User Intent & Run Mandatory Brand Discovery Gate

Classify the request across three explicit lists:
1. **Named Brand & Pinned Truth:** Any named brand, supplied images/animations, target locale (`vi`, `en`, etc.), required pages, or explicit constraints.
2. **Audience & Physical Scene:** Who uses this surface, where, on which devices, under what ambient lighting, and what earns trust in their real world.
3. **Open Aesthetic Axes:** Dimensions the user left free (composition rhythm, visual medium, motion signature, secondary-page treatment).

Then execute the matching **Brand Discovery Branch** (never skip when a brand is named):
- **Branch 1A (Local Workspace Truth Exists):** Read `DESIGN.md`, `PRODUCT.md`, `BRAND.md`, token JSON/CSS files, existing pages, and supplied images/animations.
- **Branch 1B (Brand Design-System MCP Connected):** For an ecosystem with an active MCP server (for example, Millar MCP when working on Hahlex), query live canonical rules dynamically (`get_design_guidelines`, `get_design_tokens`, `get_visual_assets`, `get_motion_presets`) instead of relying on memorized or hardcoded hex values.
- **Branch 1C (External / Real-World Brand Named Without Local Docs):** Use your host's web research or browser tools (`search_web`, official brand press kits, live website, product photography) to extract the brand's actual palette, light/dark surface balance, typography, cultural roots, and visual voice. Cite exact observed sources and never invent unverified commercial claims.
- **Branch 1D (Greenfield / Unnamed Brand):** Do NOT reuse another brand's palette. Mark the visual world as open for `millar-web-workflow`'s Creative Divergence & Anti-Slop Calibration.

**Completion criterion:** Brand discovery completed from real sources (local files, live MCP, or web research), pinned constraints separated from open axes, and audience physical scene recorded.

### Step 2: Extract Visual & Motion DNA from Supplied Assets

Whenever the user supplies photos, illustrations, screenshots, videos, Lottie/Rive/CSS animations, or an existing hero page, read [references/visual-extraction-protocol.md](references/visual-extraction-protocol.md) and inspect EVERY supplied artifact directly via vision/file tools:
- **Images & Flagship Pages:** Extract exact lighting direction/softness, surface materiality, color temperature & light/dark polarity ratio, lens/medium grammar, grain density, aspect ratios, framing margins, and negative space rhythm.
- **Animations & Code:** Extract easing curves (`cubic-bezier` or spring `{ stiffness, damping, mass }`), duration register, travel distance, trigger discipline, stagger cap, and interruptibility.
- **Secondary-Page Gap Diagnosis:** Explicitly document what would break if secondary routes only copied the font family and accent hex without inheriting materiality, lighting, and layout craft.

**Completion criterion:** Concrete observed Visual & Motion DNA table grounded in real files with zero invented values.

### Step 3: Benchmark World-Class Craft & Cultural Context

Read [references/world-class-benchmarks.md](references/world-class-benchmarks.md) and research 2-3 high-craft references aligned with the brand's actual domain and geography:
- Study structural discipline (layout variety, typographic tension, framing margins, motion restraint, photographic authenticity) without copying copyrighted artwork verbatim.
- For human photography or regional products (such as Vietnamese education, healthcare, architecture, or consumer brands), research authentic local environments, daylight character, everyday clothing, and architectural cues so visuals never collapse into generic Western stock tropes.
- **Offline fallback:** If running without web access, rely on local workspace truth, connected MCP resources, and [references/world-class-benchmarks.md](references/world-class-benchmarks.md), disclosing offline mode honestly.

**Completion criterion:** 2-4 concrete structural, cultural, and motion craft takeaways grounded in real references.

### Step 4: Emit `.millar/research-dossier.md` (English Technical Spec)

Save `.millar/research-dossier.md` in crisp English with five actionable blocks:
1. **Brand Research Summary:** Verified palette tokens, exact light/dark surface polarity ratio (e.g., `70% light canvas / 20% secondary tint / 10% dark stage`), accent budget ceiling, typography, and non-negotiable brand invariants.
2. **Extracted Visual & Motion DNA:** Exact hex-to-physical-material translations (in English) and motion physics constants.
3. **Cultural & Environmental Authenticity Notes:** Real-world visual cues for the target audience and region.
4. **Secondary-Page Propagation Rules:** Concrete guarantees preventing `/features`, `/pricing`, `/about`, or `/app` from collapsing into plain boilerplate cards.
5. **Downstream Handoff Blueprint:** Asset scale/ratio plan for `millar-create-image` and choreography cues for `millar-animation`.

**Completion criterion:** `.millar/research-dossier.md` written cleanly in English, grounded in verified brand/asset research, and ready for `millar-design`.
