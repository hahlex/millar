# Motion Choreography, Physics & Engineering Reference

## 1. Timing & Register Matrix

| Register | Duration Band | Easing / Physics | Typical Use |
|---|---|---|---|
| **Immediate Feedback (Productive)** | `100-150ms` | `cubic-bezier(0.2, 0, 0, 1)` | Button press (`scale(0.97)`), checkbox/switch flip, icon hover tint |
| **Routine State Change (Productive)** | `160-260ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Tab indicator slide, popover/tooltip settle, filter pill add/remove |
| **Overlay & Layout Shift** | `260-400ms` | Spring `{ stiffness: 360, damping: 32, mass: 0.9 }` or `ease-out-expo` | Modal/drawer open, accordion expand, shared-element state morph |
| **Focal Editorial Arrival (Expressive)** | `360-640ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Single hero statement reveal, stage plate settle, orchestrated workflow step |
| **Exit / Dismiss** | `70-80%` of entrance | `cubic-bezier(0.4, 0, 1, 1)` | Dialogs, toasts, drawers leave faster than they arrive so UI feels snappy |

## 2. Spring Physics vs. Cubic-Bezier Selection Rule

- **Use Springs** for anything the user touches, drags, toggles, or can rapidly interrupt mid-flight (drawers, segmented controls, command menus, floating pills). Springs inherit velocity and reverse seamlessly.
- **Use Cubic-Bezier (`cubic-bezier(0.16, 1, 0.3, 1)`)** for deterministic opacity fades, subtle color transitions, and time-aligned editorial reveals where zero overshoot is essential.
- **Avoid reflexive bounce/elastic curves** unless the visual world is explicitly playful/cartoonish. Calm architectural craft uses critically damped or lightly damped settle curves.

## 3. Essential Engineering Patterns

### Hover Target Stability (Anti-Flicker Rule)
Never move the hover hit-box out from under the cursor:
```css
.card-trigger {
  /* Outer hit target stays stationary */
  display: block;
}
.card-trigger .card-surface {
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease;
}
.card-trigger:hover .card-surface {
  transform: translateY(-2px);
}
```

### Realistic Scale Origin (Never `scale(0)`)
Popovers, menus, and dialogs emerge from their trigger coordinate (`transform-origin`) starting at `scale(0.95)` + `opacity: 0` -> `scale(1)` + `opacity: 1` over `160-220ms`, never from `scale(0)` out of nowhere.

### Progressive CSS Scroll-Driven Reveal (Static-First Safe)
Content renders visible by default; modern browsers enhance smoothly on the compositor thread:
```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .millar-scroll-plate {
      animation: millar-plate-settle linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 28%;
    }
  }
}
@keyframes millar-plate-settle {
  from {
    opacity: 0.72;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Cross-Page Continuity via View Transitions Level 2
Assign unique visible `view-transition-name` identifiers to persistent brand marks, active section headers, or hero-to-detail media frames (never duplicate a visible `view-transition-name`, which silently aborts transitions) and opt in to MPA continuity with `@view-transition { navigation: auto; }` plus `view-transition-class` for shared group timing.

### Native Top-Layer Entry/Exit (`@starting-style` + `allow-discrete`) & Auto-Height (`interpolate-size`)
Animate native `[popover]`, `<dialog>`, and expanding disclosures cleanly without JavaScript measurement hacks:
```css
@media (prefers-reduced-motion: no-preference) {
  [popover] {
    opacity: 0;
    transform: scale(0.96);
    transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1),
      transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
      display 180ms allow-discrete,
      overlay 180ms allow-discrete;
  }
  [popover]:popover-open {
    opacity: 1;
    transform: scale(1);
    @starting-style {
      opacity: 0;
      transform: scale(0.96);
    }
  }
  @supports (interpolate-size: allow-keywords) {
    :root { interpolate-size: allow-keywords; }
  }
}
```

### Mandatory `prefers-reduced-motion` Alternative
Strip spatial displacement and loops while keeping crisp color/opacity feedback:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
  }
  .millar-animated {
    animation: none !important;
    transition-property: opacity, color, background-color, border-color !important;
    transition-duration: 120ms !important;
    transform: none !important;
  }
}
```
