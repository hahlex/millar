# Human Editorial & Documentary Photography Playbook (v0.5)

Consult this playbook whenever generating or art-directing **real human photography** (classrooms, teaching, workshops, portraits, hands at craft, community scenes, color or black-and-white editorial series).

**Core Rule:** Author **100% of photographic prompts in crisp, `80-135` word English (`65%` Concrete Mid-Action & Natural Light / `35%` Real Film & Authenticity Tail)**. NEVER inject raw `#HEX` strings into photographic prompts (describe real light and materials so skin tones and daylight stay 100% organic!).

---

## 1. Context-Appropriate Illumination Law (BAN Dark Gloomy Classrooms!)

Match lighting honestly to the **real-world emotional context** of the scene: NEVER force pitch-black shadows onto daytime human life just because a website has a dark hero section!

- **Education, Teaching, Schools, Youth, Health, Community, Everyday Craft -> BRIGHT, AIRY NATURAL DAYLIGHT BY DEFAULT:**
  - Photograph classrooms and teaching moments in **luminous morning or warm afternoon window daylight**, bounced natural fill light, soft open shadows, and real breathable atmosphere!
  - **How to show focus/contrast ("unseen -> seen") WITHOUT making a gloomy dungeon:** Use **natural shallow depth of field (`50mm f/2.0`)**, warm natural sunlight falling across the foreground desk, and authentic eye-level interaction between teacher and student while classmates behind them remain softly blurred in bright open room daylight!
  - **CRITICAL BAN:** Never plunge a classroom into pitch-black darkness (`#1A130D` cave walls + theatrical stage spotlight) unless the brief explicitly specifies a night scene. Dark gloomy classrooms feel oppressive, staged, and unnatural for education.
- **When Low-Key / Moody Light IS Appropriate:** Only when the real subject genuinely inhabits night, evening lamps, theater stages, dark studios, or nocturnal hardware/audio craft.

---

## 2. Kinetic Micro-Action Law (Concrete Mid-Motion Actions, NEVER Frozen Poses!)

Generic verbs produce stiff, mannequin-like AI images. **BAN** passive museum phrases (`"pointing softly at the page"`, `"leaning gently"`, `"hands resting calmly"`, `"absorbed in quiet stillness"`, `"extending fingers to touch fingertips in mid-air"`).

ALWAYS direct a **Concrete 3-Part Kinetic Micro-Action**:
1. **Exact Mid-Motion Physical Verb:** *crouching at eye-level sketching a small triangle in the notebook margin*, *measuring an angle together with a clear plastic ruler*, *writing a step on a sunlit chalkboard while turning back to answer a raised hand*, *actively circling a handwritten lesson note with a brass pen while a companion hand steadies the open notebook corner*.
2. **Lived-In Authentic Props (Proof of Real Life):** Open worn textbook with underlined lines, pencil eraser and wood shavings, ruler, colored sticky page tabs, canvas backpack slung over a wooden chair, chalk dust on fingers, cup of tea on teacher's desk.
3. **Genuine Mutual Human Reaction (NOT Staring at Camera):** Both people are visibly locked in real dialogue or shared discovery: the teacher's eyes crinkling in a genuine warm half-smile mid-explanation, the student leaning forward with chin on one hand and an authentic spark of understanding. (Ban fake toothy stock grins staring into the lens, NEVER ban natural warm smiles between people!)

---

## 3. Natural Color & Unforced Composition (Drop Staged Grids & Raw `#HEX`!)

- **Avoid Rigid "Left-Third / Center-Right" Stage Blocking** when shooting candid human life: compose naturally like a photojournalist capturing a real moment (`over-the-shoulder`, `35mm environmental candid`, `eye-level across the desk`) with organic breathing room where UI typography can sit naturally.
- **Never Paste Raw `#HEX` Codes Into Photo Prompts:** Hex strings push diffusion toward artificial heavy color grading. Translate the researched brand palette into real physical light and surfaces (*sunlit warm cream wall, oiled teak desks, oat-linen shirt, warm golden-morning sun, touch of brass pen*).
- **Compact Skin & Hands Hygiene:** Keep it to one short phrase (*"natural 35mm film grain, unretouched real skin, five natural fingers per hand, authentic candid focus"*): never dump 50 words of pore/wrinkle/wall boilerplate that steals attention from the live human moment!

---

## 4. Concise `80-130` Word Natural Photo Patterns

### A. Bright Sunlit Teaching & Mentorship Scene (`16:9`)
```text
Candid documentary editorial photograph on 35mm lens, f/2.0, bright warm morning daylight streaming through tall louvered windows of a lively Vietnamese classroom.
In crisp foreground focus, a teacher in a light oat-linen shirt crouches at eye level beside a wooden desk, actively sketching a small geometry diagram with a pencil in the margin of a student's open notebook while the teenage student leans in, chin propped loosely on her hand, smiling with genuine realization.
An open textbook, plastic ruler, eraser, and pencil case rest naturally on the sunlit desk.
In the softly blurred, brightly lit background, classmates work quietly at wooden desks beside a pale green chalkboard.
Warm natural daylight with open breathable shadows, subtle 35mm film grain, authentic unretouched skin, zero dark gloom, zero posed camera smiles, zero text or UI overlays.
```

### B. Concrete Collaborative Hands & Warm AI Companion (`16:9` or `3:2`)
```text
Warm natural-light editorial photograph (50mm f/2.4) looking slightly across a sunlit oiled walnut desk beside a bright curtained window.
Mid-action, a Vietnamese educator's real hand in a rolled oat-linen sleeve holds a slim brass fountain pen actively sketching a small curved diagram inside an open cream cotton notebook, while from the opposite side of the page a warm matte-ivory porcelain and satin brushed-bronze articulated companion hand naturally steadies the paper corner beside a small cream index slip.
Soft bright morning sunlight fills the desk with gentle warm open shadows and natural wood grain, genuine skin texture, five natural fingers per hand, authentic 35mm film feel, zero awkward hovering hands, zero cold chrome or neon, zero garbled text.
```

### C. Airy Environmental Portrait (`4:3` or `3:4`)
```text
Natural-light documentary portrait on 85mm f/2.2 in bright open window daylight:
<authentic subject grounded in researched audience/culture, captured mid-thought or quiet warm half-smile pausing between real tasks, natural everyday attire in brand-harmonized warm neutrals>,
luminous soft catchlights, real unretouched skin texture, airy open background with gentle shallow bokeh, fine 400-ISO film grain, zero dark studio backdrop, zero plastic HDR, zero text.
```

---

## 5. Pass 4 Natural-Human Vision Audit (Instant Reject Triggers)

Inspect every generated human photo at full `2048px` resolution before accepting:
- [ ] **Context-Right Brightness:** Is a teaching/daytime scene genuinely bright, airy, and inviting with open readable shadows? (Instant REJECT if dark, gloomy, or cave-like!)
- [ ] **Concrete Mid-Action:** Are hands and people visibly doing ONE specific real action (sketching, measuring, holding a page steady, explaining) with real lived-in props? (Instant REJECT if stiff, frozen, vaguely pointing, or hovering awkwardly!)
- [ ] **Genuine Warmth & Real Skin:** Authentic unretouched faces and real emotional connection (zero wax skin, zero stern proctor stiffness, zero fake staring-at-lens stock grins).
- [ ] **Anatomical & Prop Integrity:** Exact 5 natural fingers per hand, real pens/rulers/notebooks, zero melted objects or garbled fake handwriting.
- [ ] **Dual Provenance Embedded:** PNG `tEXt` chunk + `.prompt.json` written via `scripts/embed-provenance.mjs --sidecar`.
