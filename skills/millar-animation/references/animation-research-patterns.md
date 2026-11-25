# Animation Research & Intent-Mapping Patterns

Use this guide when researching animation inspiration on the web or translating a user's subjective motion description into exact implementable specs.

## 1. Translating User Motion Language into Exact Specs

| User says... | What they actually feel | Concrete Implementation Spec |
|---|---|---|
| "Mượt, đầm, sang (như Apple / editorial)" | Zero jitter, heavy controlled deceleration, quiet restraint | `cubic-bezier(0.16, 1, 0.3, 1)`, `420-580ms` focal arrival, subtle `12-18px` travel, clip-path/mask reveal on ONE hero plate, zero bounce |
| "Nhanh, nhạy, sắc nét (như Linear / Raycast)" | Sub-200ms snappy response, immediate tactile press, crisp active pill | `140-200ms` transitions, `:active { transform: scale(0.97) }`, shared-layout tab indicator (`stiffness: 420, damping: 34`), instant zero-delay sequential tooltips |
| "Sống động, có hồn nhưng không rối" | Micro-delight anchored to real state transitions | Staggered list arrival (`35ms` step, max `240ms` total), subtle icon path/rotate acknowledgment on action success, smooth View Transition between cards and detail pages |
| "Khớp với animation trang chủ tôi đã có" | Unbroken cross-page physical world | Inspect Page 1 CSS/JS timing tokens verbatim -> hoist into global motion tokens -> reuse identical curves & travel amplitude across Pages 2..N |

## 2. Targeted Web Research Queries for Motion Craft

When using `search_web` or `WebSearch` to research specific effects:
- **Interaction Micro-Details:** `"Emil Kowalski" "<component: drawer|toast|tabs|dialog>" animation easing spring`
- **Native CSS Scroll Choreography:** `"animation-timeline: view()" CSS scroll-driven animation progressive enhancement MDN`
- **Cross-Page Morphing:** `"View Transitions API" Next.js OR MPA shared element transition best practices`
- **Interruptible Springs:** `"Motion.dev" OR "framer-motion" layoutId shared element spring physics interruptible`

## 3. Motion Anti-Patterns to Reject Immediately

1. **Blank Scroll Traps:** Hiding sections at `opacity: 0` inside long scroll-jacked wrappers (`1000vh+`) where content disappears on reduced motion or fast scroll.
2. **Universal Fade-Up Spam:** Putting identical `fadeInUp` on every heading, card, and footer block until the entire page feels like a PowerPoint deck.
3. **Layout Thrashing:** Animating `width`, `height`, `margin`, `padding`, `top`, `left`, or `border-radius` continuously on scroll instead of `transform` / `clip-path` / `opacity`.
4. **Unstoppable Loops:** Infinite bouncing buttons, pulsing CTA halos, or auto-rotating carousels that steal reading focus and fail offscreen pause checks.
5. **Secondary-Page Dropoff:** Lavishing custom choreography on Homepage while leaving `/features`, `/pricing`, `/about`, and `/app` with unstyled jarring instant cuts.
