---
status: accepted
approvedAt: 2026-11-25
---

# ADR-0005: Diverse Marketing Composition Patterns & Static-First Zero-Photo Visual System

Millar Marketing Design MUST NOT collapse into a single layout aesthetic (such as repeating architectural grids or equal 3-column card grids). Instead, `@hahlex/millar-marketing` ships **six distinct Composition Patterns** (Architectural Visible-Rule Grid, Editorial Magazine Split, Spatial Product Stage, Narrative Sequence Flow, Monumental Typographic Poster & Metric Mirror, and Asymmetric Bento Mosaic) paired with code-native CSS/SVG/Canvas/React Visual Assets and an Expressive Motion library. Every asset, section, and template is designed **static-first** so it achieves high editorial quality even with zero photos, zero videos, and zero animation, and carries live preview, copyable source code, usage guidelines, responsive behavior, and MCP metadata.

## Considered Options

- **6 Diverse Composition Patterns + Code-Native Visual Assets + Purposeful Approved Marketing Gradients (Accepted)**: Gives designers and AI agents rich, non-repetitive visual range across landing pages, feature essays, and company stories while preserving unmistakable Hahlex warmth and typography.
- **Single Architectural-Grid Aesthetic**: Looks sharp on one page, but causes every Hahlex marketing site to look identical and overly technical.
- **Photography-Dependent Layouts**: Fails whenever teams or AI agents build pages without bespoke photography (exact failure mode audited in `education-portfolio`).

## Consequences

- Every Marketing Section and Page Template specifies its `compositionPattern`, `photoFree: true` guarantee, `reducedMotionFallback`, responsive rules across mobile/tablet/desktop, and paired Visual Assets in SSoT metadata.
- Approved Marketing Visual Assets that intentionally use gradients carry explicit `gradientPolicy: "approved-visual-asset"` metadata so `validate_design` distinguishes them cleanly from arbitrary decorative gradients.
