---
status: accepted
approvedAt: 2026-11-25
---

# ADR-0002: Unified Typography, Unified Warm Sand/Bronze/Espresso Palette, Register-Scoped Gradients, and Product-Agnostic Core

We unify all Hahlex surfaces (Shared, Product, Marketing) onto **Geist Sans** (`300-400` Display, `500-600` operational headings), **Inter** (Body/UI + optional slim `opsz 24` chat prose), and **Geist Mono** (code/technical) with `:root:lang(vi)` diacritic safety, and consolidate `hahlex-edu` and `education-portfolio` colors into one OKLCH-verified Warm Sand / Bronze / Espresso palette with orthogonal **Theme** (`light | dark`) and **Register** (`product | marketing`) modifiers. **CSS gradients are strictly forbidden in Product UI and Foundation components**; in **Marketing**, gradients are permitted **exclusively inside purposeful, explicitly approved Visual Assets** and never as arbitrary UI decoration. Education-specific semantics (6 IELTS skill tones, `--mark-learner`, education icons) move out of Shared Foundations into `@hahlex/millar-domain-education`.

## Considered Options

- **Unified Typography & Palette + Register-Scoped Gradient Boundary + Domain Extensions (Accepted)**: Eliminates font fragmentation (`Archivo`/`Poppins`/`Be Vietnam Pro`/`Cormorant`/`Bebas Neue` -> 3 Vietnamese-capable families), resolves verified marketing WCAG contrast failures (`#FFF8F0` on `#A26A25` `4.31:1` and `#C08A4A` `2.86:1`), protects Product UI from gradient clutter while allowing high-craft approved Marketing editorial visuals, and keeps Millar independent of the education vertical.
- **Zero Gradients Everywhere**: Simplifies linting, but unnecessarily blocks purposeful, approved editorial lighting and horizon washes in Marketing Visual Assets.
- **Separate Palettes / Separate Fonts per Repo**: Preserves visual clash between marketing sites and embedded product UI previews.

## Consequences

- Every text/surface and button pair across both registers clears WCAG 2.1 AA (`>= 4.5:1` text, `>= 3:1` UI) by construction.
- The canonical Hahlex Brand Mark is a single centered vector SVG (`viewBox="0 0 300 282"` geometry normalized to crisp coordinates, 4 official variants), paired with the canonical Title Case **`Hahlex`** wordmark in **`Geist 600`** (`-0.02em`).
- `validate_design` enforces register-aware gradient rules: hard error in Product/Foundations, hard error for raw decorative gradients in Marketing unless bound to an approved Visual Asset token/component.
- Zero Em-Dash (`U+2014`) applies to Hahlex-controlled UI, copy, and docs; tooling and validators MUST NEVER mutate or flag user-authored data, direct quotes, or third-party resources.
