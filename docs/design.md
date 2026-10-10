# DESIGN.md: Washi & Crimson (light only)

## Tokens
--crimson #C8102E | hover #A60D26 | tint #FBE9EC
--sumi #0A0A0B | --washi #FAF8F5 | --white #FFFFFF | --ash #6B6B70

## Typography
Display: Shippori Mincho / Noto Serif JP. UI: Inter + Noto Sans JP. Code: JetBrains Mono.
Vertical kanji section labels via `writing-mode: vertical-rl`.

## Motifs
Enso circle, hanko seal badges, seigaiha/asanoha patterns (≤6% opacity), thin sumi rules, ample negative space.

## Components
- shadcn base, themed via CSS vars. Radius small (2-4px), crisp sumi borders.
- React Bits for: hero text effects, animated backgrounds, cursor/scroll effects. One accent animation per viewport max.
- 3D: single hero R3F scene, lazy, static fallback, `prefers-reduced-motion` respected.

## Severity language
equivalent: sumi outline | lossy: crimson tint | breaking: solid crimson | unknown: hatched crimson. Always icon + label.

## Quality bar
WCAG AA, Lighthouse a11y ≥95, perf ≥85, no dark mode, bundle: 3D and heavy effects code-split.