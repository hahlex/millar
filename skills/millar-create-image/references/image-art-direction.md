# Image Art Direction & Style-Locked English Prompt Engineering

Always author image-generation prompts in **crisp, idiomatic English**, regardless of the user's conversation language. Never hardcode another brand's colors: derive every palette and material value dynamically from `.millar/research-dossier.md`, `.millar/style-dna.md`, local `DESIGN.md`, or live Brand MCP tokens.

## 1. The Concise 5-Block Master Prompt Architecture (80% Fixed / 20% Variable)

Keep Blocks 1, 3, 4, and 5 identical across every page of a website; change only Block 2 (`[Subject & Composition]`) per route. Keep total prompt length **150-250 words** (`Impeccable` `visualize.md` anti-over-specification principle): specify what the model cannot infer without micromanaging every pixel.

```text
[1. Core Medium, Camera/Lens or Craft Technique]
+ [2. Concrete Subject, Action, Scale & Negative-Space Framing (VARIABLE 20%)]
+ [3. Lighting Paradigm, Direction & Atmospheric Depth]
+ [4. Researched Brand Color Language & Physical Materiality]
+ [5. Framing Discipline & Exclusion Hygiene (Zero Text / Zero Stock Tropes)]
```

### Generic Pattern Example (Replace `<placeholders>` From Brand Research)

```text
Editorial architectural photography and tactile still-life on 35mm medium-format 50mm lens,
natural shallow depth of field, authentic subtle film grain,
[VARIABLE 20%: specific subject, real human or physical artifact, explicit quiet negative space for UI headline],
soft directional north-window daylight entering from upper-left casting long gentle shadows across three depth planes,
color palette translated directly from researched brand materials (<primary-ground-material>, <secondary-surface-material>, <deep-anchor-material>, and <pinpoint-focal-accent-material> kept strictly within brand accent ratio),
quiet museum stillness, generous breathing room, natural unretouched textures,
no watermarks, no overlaid UI text, no synthetic neon glow, no plastic 3D gloss, no generic stock poses.
```

### Multi-Page Scale Rhythm Using the Exact Same Locked 80% Prefix

- **Flagship Hero (`16:9`):** `[LOCKED 80% PREFIX] + Wide establishing subject placed on the right 55% of frame; calm low-frequency architectural ground on the left 45% reserving uncluttered space for display typography.`
- **Features / Capability Plates (`4:3`):** `[LOCKED 80% PREFIX] + Close architectural or craft detail showing the real mechanism in action, asymmetric composition with identical lighting angle and tonal depth.`
- **Story / About (`3:2`):** `[LOCKED 80% PREFIX] + Human-scale real environment photographed candidly in the same afternoon light (consult human-editorial-photography.md whenever people appear).`
- **Contrasting Counter-Weight Band (`16:9`):** `[LOCKED 80% PREFIX shifted to the researched brand's dark/contrasting polarity] + Tactile low-key close-up with grazing rim light and calm negative space suitable for crisp high-contrast typography.`

## 2. Dynamic HEX-to-Physical-Material Translation Method

Image generators render **physical materials** far more faithfully than raw hex strings. During Pass 2, translate the **researched brand's own tokens** into tactile real-world materials:

| Brand Token Role (From Research / MCP / DESIGN.md) | How to Translate Into English Image Prompt Language |
|---|---|
| **Light Primary Ground** | Match the researched hue temperature: unbleached cotton archival paper, sunlit chalk plaster, cool gallery gypsum, or pale raw linen |
| **Alternating Secondary Surface** | Pale travertine limestone, brushed birch timber, raw oat clay, misted slate stone, or warm vellum |
| **Contrasting Dark Stage** | Roasted walnut lacquer, matte obsidian charcoal, anodized dark aluminum, smoked architectural glass, or deep indigo slate |
| **Primary Structural Ink / Action** | Oiled hardwood, burnished bronze, matte graphite iron, deep botanical pigment, or cobalt enamel |
| **High-Tension Focal Accent** | Small pinpoint physical material matching the brand's researched accent ceiling (e.g., matte carmine wax mark, vermilion thread, signal enamel pin, amber filament) |

*Brand-First Rule:* When building for Hahlex specifically, query Millar MCP (`get_design_tokens`, `get_design_guidelines`) or read the repo's `DESIGN.md` to obtain the exact verified tokens and accent budget before filling this table. Never hardcode Hahlex colors into non-Hahlex projects.

## 3. Multi-Image Series Polarity Rule (Beat 4/4 Monochrome Dark Bias)

When producing a multi-artwork series (for example, 4 editorial plates or hero + secondary visuals):
- **Respect the Researched Brand's True Polarity:** Never collapse an entire series onto dark backgrounds when the researched brand's primary identity lives on light surfaces.
- **Intentional Cadence:**
  - *Light-Primary Brand (e.g., archival paper / editorial light systems):* Use `3 Light Ground + 1 Contrasting Dark Climax` OR `2 Light + 2 Dark` alternating rhythm so the set breathes with daylight and evening depth.
  - *Dark-Primary Brand:* Vary depth across matte dark architectural grounds, illuminated apertures, and high-key detail plates so scenes never blur into black-on-black monotony.
- **Light Surfaces Still Need Chiaroscuro Depth:** Create rich atmosphere on light grounds via directional sunlit window shadow bands, subtle radial tonal falloff, tactile paper/film grain, and 3-plane ink/tonal hierarchy (crisp foreground, muted midground, whisper background).

## 4. Prompt Provenance Sidecars (`Impeccable` Continuity Discipline)

Save a lightweight `<asset-filename>.prompt.json` (or centralized `.millar/asset-manifest.json` entry) for every generated raster:

```json
{
  "file": "public/images/hero-stage.png",
  "brandSource": ".millar/style-dna.md (researched from DESIGN.md / MCP)",
  "aspectRatio": "16:9",
  "polarity": "light-ground",
  "anchorRef": "self",
  "promptEn": "<exact English prompt sent to the generator>"
}
```

Any later session, secondary route, or fix batch reads this provenance file so new assets match the exact film stock, lighting angle, and material grammar.

## 5. Routing to Specialist Craft Playbooks

- **Real People / Portraits / Classrooms / Documentary Color & B&W:** Read [human-editorial-photography.md](human-editorial-photography.md) before drafting prompts.
- **Code-Native Plates / 503 AI Image Fallback / Engraving & Parametric Art:** Read [procedural-gallery-craft.md](procedural-gallery-craft.md) before writing a single line of SVG, Canvas, or Python code.
