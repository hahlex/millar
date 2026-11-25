# Two-Axis Code Review & Craft Floor Rubric

Never merge Spec findings and Standards findings into one blurry score. A build can follow every coding standard while missing what the user asked for, or fulfill every feature while introducing brittle architecture. Report both axes side-by-side.

## Axis A: Spec Fidelity (Did we build the exact right thing?)

1. **Requirement Coverage:** Every requested page, control, interaction, copy language (`en` / `vi`), and visual constraint present and findable within seconds.
2. **Brief & Asset Fidelity:** Every user-supplied image, animation, brand color, or design decision honored faithfully (never silently swapped for defaults).
3. **Interactive Completeness:** Zero dead buttons, zero stub `() => {}` handlers, zero Lorem Ipsum or fabricated metrics.
4. **Scope Discipline (Track S especially):** Zero unrequested refactors or side-effect edits outside task scope.

## Axis B: Engineering & Craft Standards (Did we build it cleanly?)

1. **Architecture & Deep Modules:** Clean feature boundaries, Server Components by default with lean `"use client"` leaves, no hydration hazards, no premature abstractions.
2. **Design System Compliance:** Semantic tokens used consistently, zero unapproved CSS gradients on Product/Foundations, single elevation per card, consistent icon stroke weight, browser chrome themed.
3. **Core Web Vitals Hygiene:** Explicit image/media dimensions, high-priority LCP hero, compositor-only animations (`transform`/`opacity`), zero layout thrashing.
4. **Fowler Code-Smell Baseline (Judgment Calls, Repo Rules Override):**
   - *Duplicated Code* -> extract shared primitive/helper only when real duplication appears across sites.
   - *Shotgun Surgery / Divergent Change* -> co-locate code that changes together.
   - *Speculative Generality* -> delete unused props, flags, and hypothetical abstractions.
   - *Mysterious Name / Primitive Obsession* -> give domain concepts clear, honest names and types.
   - *Feature Envy / Message Chains* -> keep logic beside the data it operates on.
5. **Security & Privacy Sanity:** Zero secrets or `.env` keys in client bundles, safe escaping on rendered user data (`dangerouslySetInnerHTML` avoided unless strictly sanitized), origin isolation respected for auth/CMS routes.
