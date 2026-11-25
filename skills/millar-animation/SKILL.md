---
name: millar-animation
description: "Motion research, choreography, and engineering skill for websites and product UI. Use when researching reference animations matching user intent, syncing secondary pages to existing hero animations, implementing purposeful micro-interactions, interruptible spring physics, CSS View Transitions, scroll-driven choreography, or Millar Productive/Expressive motion presets with static-first prefers-reduced-motion safety."
version: 0.1.0-draft.1
license: MIT
---

# Millar Animation: Purposeful Motion Research & Choreography

Use motion to clarify state, spatial relationship, and continuity, or to author one memorable focal moment the surface truly earns. Never scatter generic fade-and-rise animations onto every section, and never let secondary pages abandon the motion language established on the flagship page.

## Core Principles

1. **Match the user's animation language first.** If the project already contains hero animations, Lottie/Rive files, GSAP/Motion timelines, or reference videos/links, inspect their exact curves, durations, and mass before authoring new transitions so every page moves as one physical world.
2. **Scale motion to visitor mode & Millar register.**
   - **Productive (`Operate` / `Read`):** Fast, calm, interruptible feedback (`120-260ms`). Never block routine workflows with page-load choreography.
   - **Expressive (`Persuade` / `Experience`):** Measured editorial arrival (`280-640ms`) focused on ONE authored focal sequence rather than repetitive identical reveals.
3. **Static-first default visibility.** Content MUST look complete and readable at `0%` scroll and if JS/scroll timelines fail. Never trap users in blank `opacity: 0` boxes waiting for scroll triggers.
4. **Compositor-first performance & interruptibility.** Animate compositor properties (`transform`, `opacity`, bounded `clip-path`, `filter`) cleanly; springs must interrupt mid-flight without snapping.
5. **Accessible `prefers-reduced-motion` is mandatory.** Reduce or strip spatial travel (`translate`, `scale`, `parallax`) while preserving crisp opacity/color confirmation so action feedback stays legible.

## Execution Sequence

### Step 1: Audit Existing Motion & Research User-Aligned References

- **Check existing code/assets:** Read `.millar/style-dna.md` (Section 9), inspect any existing animation code/CSS/Lottie/Motion definitions, and call Millar MCP `get_motion_presets` for Hahlex projects.
- **Research tailored motion patterns:** When the user asks for an animation feel ("mượt như Apple", "snappy như Linear", "editorial reveal", "tactile card morph", "scroll story"), read [references/animation-research-patterns.md](references/animation-research-patterns.md) and search web references (`search_web` / `WebSearch`) for verified compositor-safe patterns matching that exact physics and runtime stack (CSS native, Motion/Framer, GSAP, View Transitions API, WAAPI).

**Completion criterion:** Existing motion grammar documented OR target motion reference patterns selected and matched to the user's intent and tech stack.

### Step 2: Author the Motion Thesis (Before Writing Keyframes)

Write a concise 4-line Motion Thesis inside `.millar/style-dna.md` (or the task plan):

- **Focal moment:** The single authored sequence or interaction that earns attention on this surface (never generic scroll fade-up on every div).
- **Cross-page continuity:** Shared route bridge (`view-transition-name`, persistent layout morph, or matching page-header settle) unifying Page 1 and Pages 2..N.
- **Tactile feedback:** Immediate pointer/keyboard acknowledgment (press `scale(0.97-0.98)`, tab indicator glide, drawer spring, async busy lock).
- **Performance & reduced-motion budget:** Max concurrent animated layers, zero layout-thrashing properties (`width`, `height`, `top`, `left`), and exact `prefers-reduced-motion` fallback.

**Completion criterion:** Four-line Motion Thesis approved and aligned with the project's existing animation physics.

### Step 3: Implement Using Native-First Runtime Primitives

Read [references/motion-choreography.md](references/motion-choreography.md) and implement cleanly without adding unnecessary libraries:

1. **Tokenize timing & easing once** (`--duration-fast`, `--duration-base`, `--duration-editorial`, `--ease-out-expo`, `--ease-spring-soft`) in shared CSS/TS so every route imports the exact same curves.
2. **Respect hover stability:** Keep the pointer target container stationary on `:hover` and translate an inner child surface so edges never flicker under the cursor.
3. **Use native browser primitives first:**
   - Declarative CSS transitions/keyframes for routine feedback and states.
   - CSS View Transitions API (`view-transition-name`) for seamless cross-page / state morphing.
   - CSS Scroll-Driven Animations (`animation-timeline: view()` / `scroll()`) wrapped in `@supports (animation-timeline: view())` so unsupported browsers stay static-first cleanly.
   - Existing project animation library (`motion` / `framer-motion` / `gsap` / WAAPI) only for gesture physics, velocity inheritance, and interruptible layout springs.
4. **Ship the `prefers-reduced-motion: reduce` branch in the same edit** (never as a later TODO).

**Completion criterion:** Shared motion tokens wired across all routes, zero layout-thrashing animations, and complete `prefers-reduced-motion` branch implemented.

### Step 4: Verify Real Motion Behavior (Normal + Reduced Motion)

Verify in a real browser (Playwright / browser inspection / DevTools):
- Test rapid repeated clicking/toggling (interruptibility check: zero stuck states, zero teleporting).
- Test hover edges (zero jitter/flicker).
- Test keyboard focus traversal (`Tab`, `Enter`, `Escape`, Arrow keys on tabs/menus).
- Toggle `prefers-reduced-motion: reduce` (e.g. Playwright `page.emulateMedia({ reducedMotion: "reduce" })`) and verify zero spatial displacement while interactive state transitions remain unmistakable.
- On Hahlex projects, run Millar MCP `validate_design` to confirm zero compliance regressions.

**Completion criterion:** Normal and reduced-motion states verified in browser with smooth 60fps transitions and identical physical grammar across flagship and secondary routes.
