# Image Art Direction & Style-Locked Prompt Engineering

## 1. The 5-Block Master Prompt Architecture (80% Fixed / 20% Variable)

Keep Blocks 1, 3, 4, and 5 identical across every page of a website; change only Block 2 (`[Subject & Composition]`) per section:

```text
[1. Core Medium & Craft]
+ [2. Subject, Scale & Framing (VARIABLE 20%)]
+ [3. Lighting Paradigm & Atmosphere]
+ [4. Color Language & Materiality]
+ [5. Technical Framing & Exclusion Hygiene]
```

### Example Master Style Prefix (Hahlex *Measured Warmth* Editorial Series)

```text
Editorial architectural studio photography and tactile minimal still-life,
shot on medium-format 50mm lens, crisp natural focal plane,
soft diffused north-window side lighting casting long gentle warm shadows,
grounded palette of warm unbleached cream linen, pale limestone sand, deep roasted espresso wood,
and a single tiny pinpoint accent of deep matte crimson lacquer,
subtle archival matte finish, quiet museum stillness, generous uncluttered negative space,
zero text overlays, zero watermarks, zero neon glow, zero stock corporate poses, zero plastic 3D gloss.
```

### Example Multi-Page Variable Slots Using the Exact Same Prefix

- **Homepage Hero (`16:9`):** `[PREFIX] + Architectural desk composition placed in the right half of frame showing an open warm-linen binder, brass ruler, and matte obsidian glass tablet; left 45% calm uncluttered warm limestone wall for headline typography.`
- **Features Page Plate (`4:3`):** `[PREFIX] + Overhead flat-lay macro study of three nested limestone blocks aligned along hairline brass drafting rules, symbolizing modular system architecture, balanced asymmetric framing.`
- **About / Story Page (`3:2`):** `[PREFIX] + Sunlit minimalist architectural studio corner with timber louver shadows falling across warm plaster walls and a drafting table, calm human-scale atmosphere.`
- **Pricing / Commitment Band (`16:9` subtle texture):** `[PREFIX] + Abstract close-up macro study of dark roasted espresso matte architectural surface with faint warm amber edge light grazing the lower horizon, minimal low-contrast background suitable for light crisp typography.`

## 2. The HEX-to-Visual-Language Bridge

Translate design tokens into physical materials image models reliably render:

| Token Role | Example Hex | Descriptive Visual Language |
|---|---|---|
| Warm Cream Canvas | `#FAF8F5` / `#FAF3EA` | warm unbleached cotton archival paper, sunlit alabaster plaster |
| Warm Sand Surface | `#F2E6CD` / `#EBE3D7` | pale travertine limestone, natural raw linen, matte oat clay |
| Deep Espresso Stage | `#1A130D` / `#120C08` | dark roasted walnut, matte obsidian charcoal with warm umber undertone |
| CTA Brown / Deep Sand | `#4A3022` / `#6B4D35` | oiled walnut wood, burnished bronze hardware, raw umber pigment |
| Hahlex Crimson Accent | `#B3121B` / `#F0857F` | restrained deep carmine wax seal, tiny vermilion registration mark (`< 1.5%` frame) |
| Cool Precision Dark | `#0D1117` / `#161B22` | anodized matte slate aluminum, smoked architectural glass |

## 3. Code-Native Visual Craft (`canvas-design` Discipline)

When producing SVG, HTML5 Canvas, or Python Pillow/Cairo visual plates instead of raster photography:
- **90% Visual Form / 10% Structural Text:** Let geometry, negative space, proportion grids, and tonal contrast carry meaning; keep labels whisper-small and mono-spaced.
- **DPR Calibration:** On HTML5 `<canvas>`, multiply internal backing buffer by `window.devicePixelRatio` and keep static-first crisp geometry (zero mandatory animation loops to look complete).
- **Zero Text Collisions:** Reserve dedicated layout cells for diagram labels; never allow text to cross orbital strokes or divider lines.
- **Anti-Cliche Hygiene:** Zero floating blurry rainbow blobs, zero fake glowing brain networks, zero generic cartoon people waving at laptops.
