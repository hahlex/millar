---
status: accepted
approvedAt: 2026-11-25
---

# ADR-0003: Standalone Millar Monorepo (`d:\projects\millar`), Official URL `hahlex.com/millar`, and Mandatory CMS Origin Isolation Before Production

Millar is engineered as an independent standalone git monorepo at `d:\projects\millar` (outside the Obsidian Vault `Hahlex-Data`). The Millar Portal builds with `basePath: "/millar"` as an independent Cloudflare Worker (`millar-portal`) intended to be mounted at the official URL **`hahlex.com/millar`**. Because `education-portfolio`'s Keystatic CMS currently stores an 8-hour GitHub write token in a JavaScript-readable cookie on `hahlex.com` (`education-portfolio/docs/CMS.md:26-28`), **isolating the CMS onto its own dedicated origin (e.g., `cms.hahlex.com` or an `HttpOnly` backend boundary) is a mandatory security prerequisite BEFORE public production cutover at `hahlex.com/millar`**. Strict CSP (`script-src 'self'`, zero third-party scripts) is implemented as defense-in-depth only and is **never** treated as a substitute for origin isolation.

## Considered Options

- **Standalone Monorepo + Independent Worker at `hahlex.com/millar` Gated by CMS Origin Isolation (Accepted)**: Keeps Millar 100% independent of `education-portfolio`'s codebase and Obsidian Vault storage, delivers the official `hahlex.com/millar` URL, and addresses the root same-origin token exposure properly instead of papering over it with CSP.
- **Rely on CSP alone while sharing `hahlex.com` with Keystatic**: Rejected; CSP reduces XSS surface but does not provide cryptographic or browser origin isolation for a JS-readable GitHub write cookie.
- **Embed `/millar` inside `education-portfolio` or inside Obsidian Vault**: Rejected; couples Millar's lifecycle to an education marketing repo or pollutes the knowledge vault with `node_modules` and build artifacts.

## Consequences

- Phase 0..6 build, test, and run `millar-portal` locally and on preview environments cleanly without modifying `education-portfolio` production.
- Phase 7 delivers an explicit production cutover checklist whose first blocking gate is CMS origin migration (`cms.hahlex.com` / `HttpOnly`) prior to wiring the `hahlex.com/millar` Cloudflare Service Binding.
