# Millar

Millar is Hahlex's unified, product-agnostic design language, component system, visual asset library, portal, and AI-agent interface. This glossary defines the canonical terms shared by designers, engineers, and AI agents across the Hahlex ecosystem.

> **Lifecycle Note**: Terms below are `Draft` until approved by Hahlex leadership.

## Architecture & Layers

**Shared Foundations**:
The product-agnostic design standards shared across every Hahlex surface, covering principles, brand identity, typography, color scales, spacing, grid, radius, elevation, iconography, accessibility, and canonical design tokens.
_Avoid_: Core theme, base styles, global CSS

**Register**:
An intentional behavioral and aesthetic configuration built on Shared Foundations for a specific class of surface, specifically the **Marketing Register** (editorial pacing, expressive typography scale, storytelling sections, expressive motion) or the **Product Register** (operational density, 1-glance scannability, data controls, productive motion).
_Avoid_: Theme (a theme is light/dark contrast mode), skin, mode

**Theme**:
The luminance polarity applied to a surface, specifically **Light** (White-First or Editorial Cream canvas) or **Dark** (Warm Obsidian or Deep Espresso canvas). Orthogonal to Register.
_Avoid_: Mode (alone), palette, register

**Domain Extension**:
An optional semantic token, icon, and pattern pack layered on top of Shared Foundations for a specific Hahlex business vertical (such as the Education Extension for 4-skill language semantics or learner highlights) without polluting Millar's product-agnostic core.
_Avoid_: Vertical theme, product hack, plugin

**Single Source of Truth (SSoT)**:
The sole authoritative definition of Millar's tokens, guidelines, component contracts, sections, templates, visual assets, and motion presets from which the Millar Portal, consumable packages, and Millar MCP Server are compiled automatically.
_Avoid_: Master doc, style guide copy, reference file

## Visual & Surface System

**Surface Role**:
A named elevation and container tier (`base`, `inset`, `raised`, `overlay`, `modal`) that pairs a semantic background fill, hairline border, corner radius, shadow level, and z-index into one consistent visual unit.
_Avoid_: Elevation level (alone), card style, material

**Invariant**:
A non-negotiable, machine-verifiable rule enforced across Millar outputs (such as minimum WCAG AA contrast, zero un-tokenized colors, zero CSS gradients on product UI, or zero em-dash `U+2014` in copy).
_Avoid_: Guideline, best practice, recommendation

**Visual Asset**:
A reusable, code-native graphic primitive (SVG diagram, architectural grid, geometric pattern, tactile texture, stylized product-chrome frame, or brand mark) engineered to carry visual craft and narrative clarity without relying on stock photography or animation.
_Avoid_: Illustration (only one subset), image placeholder, decoration

**Product Visualization**:
A stylized, crisp, static-first representation of real Hahlex interface chrome built from Millar tokens and components to explain product capabilities on marketing surfaces without blurry screenshots or blank scroll traps.
_Avoid_: Mockup, screenshot, fake chatbox

**Motion Register**:
The split between **Productive Motion** (fast, task-focused feedback for Product/App controls) and **Expressive Motion** (deliberate editorial pacing for Marketing transitions), both bound to a static-first `prefers-reduced-motion` end state.
_Avoid_: Animation speed, transition preset

## Catalog & Composition

**Primitive**:
An atomic, accessible, product-agnostic UI building block (such as Button, Input, Dialog, DataTable, or Badge) with a single defined ARIA/keyboard contract.
_Avoid_: Widget, control (alone), element

**Pattern**:
A repeatable UX solution combining multiple Primitives and rules to solve a recurring user problem (such as FilterBar, Record Detail Drawer vs. Page, Form Validation, or Empty/Error/Loading recovery).
_Avoid_: Component, template, flow

**Section**:
A self-contained, responsive Marketing page band combining typography, layout grid, copy structure, and Visual Assets to deliver one clear narrative beat.
_Avoid_: Block, slice, module

**Template**:
A complete, opinionated multi-section Marketing page layout or multi-region Product application shell demonstrating approved composition, hierarchy, and responsive behavior.
_Avoid_: Starter, boilerplate, demo page

## Governance

**Lifecycle State**:
The formal maturity and authority status of every Millar token, component, section, template, or guideline: **Draft** (proposed or work-in-progress, including any AI-authored proposal), **Approved** (human-reviewed official Hahlex standard), or **Deprecated** (scheduled for removal with an explicit migration path).
_Avoid_: Beta, WIP, legacy, experimental

**Compliance Check**:
An automated, deterministic verification pass (run via CI or the Millar MCP `validate_design` tool) that inspects UI code or markup against Millar's verifiable Invariants and component contracts.
_Avoid_: Design review, lint (alone), aesthetic score
