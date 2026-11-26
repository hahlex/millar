# World-Class Web Design Aesthetic Movements

Consult this taxonomy during Step 1 when establishing a **new greenfield visual world** or translating vague taste cues ("elevated", "minimal", "warm", "technical") into concrete structural dials.

**Brand-First Rule:** If the user names ANY existing brand (Hahlex or external), research its real identity first (local `DESIGN.md`, live Brand MCP, or web research) before choosing a movement. Never copy another brand's palette onto an unrelated project.

## 1. Swiss International / Architectural Grid
- **Lineage:** Josef Muller-Brockmann, Vignelli, modern engineering documentation (Vercel Geist, skills.sh, Stripe Docs).
- **Palette DNA:** Crisp high-contrast neutral ground (light archival or pure dark), razor-thin `1px` coordinate hairlines, surgical single chromatic accent.
- **Type & Grid:** Strict mathematical grid, flush-left asymmetric typography, tracked uppercase mono micro-labels above hairlines, tabular indices, generous active negative space.
- **Best for:** Developer platforms, design system portals, technical specifications, API documentation.

## 2. Editorial Minimalism & Architectural Ma (Curatorial Print-on-Web)
- **Lineage:** Kinfolk, Cereal, Japanese architectural monographs (KINTO, Muji), Are.na, Anthropic editorial essays.
- **Palette DNA:** Chalk plaster, honed stone, or unbleached paper tones paired with soft charcoal ink (avoiding harsh `#000000`) and quiet mineral dividers.
- **Type & Grid:** Dramatic display-to-body scale contrast, `65ch` reading measure, carefully matted single-subject plates, asymmetrical text-and-figure splits, restrained pull-quotes.
- **Best for:** Brand manifestos, craft commerce, case studies, cultural institutions, high-trust storytelling.

## 3. Milled Acoustic & Precision Technical Craft
- **Lineage:** Dieter Rams / Braun, Teenage Engineering, Linear, high-precision audio/optical laboratory hardware.
- **Palette DNA:** Bead-blasted anodized aluminum or deep layered obsidian-slate (`3` subtle tonal steps), crisp `1px` borders, calibrated instrument phosphor or signal-oxide focal accent.
- **Type & Grid:** Tight tracking on headings, keyboard-first affordances (`Cmd+K`, `/` search), live interactive telemetry, oscilloscopes, or real product chrome front-and-center.
- **Best for:** Pro developer tools, hardware launches, observability consoles, power-user workspaces.

## 4. Tactile Craft & Regional Materiality
- **Lineage:** Wabi-sabi ceramics, bookbinding, regional vernacular architecture, letterpress stationery.
- **Palette DNA:** Researched regional pigments (highland forest green, basalt stone, clay, raw indigo, weathered timber), subtle micro-grain, soft directional natural daylight shadows.
- **Type & Grid:** Human-scaled proportions, tactile pressed feedback (`scale(0.98)`), grounded motion mass, authentic local cultural cues.
- **Best for:** Creative studios, culinary/coffee spaces, independent bookshops, cultural initiatives, boutique learning brands.

## 5. Kinetic Typographic Poster (High-Impact Narrative)
- **Lineage:** Exhibition poster design, launch microsites, Stripe Press / Apple keynote pacing.
- **Palette DNA:** Bold high-contrast monumental surface blocks alternating across scroll, zero clutter, typography acting as primary architectural form.
- **Type & Grid:** Oversized display statements (`clamp(2.5rem, 6vw, 5rem)`), pinned numeric proof strips, one choreographed scroll or view-transition centerpiece.
- **Best for:** Flagship launches, annual reports, announcements, conference microsites.

## 6. Hahlex Ecosystem Only: Measured Warmth (Query Live Millar MCP)
- **Applies ONLY when the brief explicitly targets Hahlex.**
- Query live Millar MCP (`get_design_guidelines`, `get_design_tokens`, `get_visual_assets`) or read the repo's local `DESIGN.md` to obtain the canonical Warm Sand / Espresso / Crimson tokens, light/dark polarity cadence, and typography rules. Never hardcode Hahlex tokens into non-Hahlex projects.

## Translating Subjective Taste Requests Into Concrete Dials

| User says... | Avoid this trap | Commit to this system |
|---|---|---|
| "Make it feel premium / elevated" | Fake gold gradients + black background + cliché display serif | Generous negative space, high typographic scale contrast, crisp `1px` hairlines, restrained palette (`<= 2` accents), matted imagery |
| "Modern / clean" | Sterile white + uncalibrated gray Tailwind cards + generic shadows | Architectural spacing rhythm (8pt grid), content-first hierarchy, themed browser surfaces, purposeful micro-interactions |
| "Warm / human" | Pastel rainbow blobs, cartoon icons, or blind cream+serif cliché | Researched physical materials (linen, timber, stone, forest/earth pigments), candid documentary craft, `1.5px` drawn icons |
| "High-tech / AI" | Purple-pink neon glow + floating particles + fake chatbots | Live interactive product chrome or real Canvas instrumentation, clean schematic diagrams, `tabular-nums`, keyboard shortcuts |
| "Match my existing images / animations" | Copying only font + primary hex onto plain secondary pages | Run `millar-deep-research` extraction -> lock `.millar/style-dna.md` (12 axes) -> propagate lighting, framing, surface cadence, and motion curves across every route |
