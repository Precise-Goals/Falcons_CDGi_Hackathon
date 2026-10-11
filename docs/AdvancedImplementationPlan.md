# Advanced Implementation Plan — Intra Eval Accuracy & Visual Overhaul

> [!CAUTION]
> **Root Cause Identified**: The `/eval` (Lab) page metrics are **not fake** — they are *deterministic* and *formulaic*. The `evalEngine.ts` pipeline uses `schema.expectedConfidence` and `schema.expectedVerdict` directly from the procedural `apiGenerator.ts` instead of computing them through real `@intra/differ`, `@intra/model`, `@intra/impact`, and `@intra/adapter` packages. This makes every run produce the same statistical distributions, creating the **illusion of fabricated data**.

---

## Phase 1: Solutions Architect — Eliminate All Fake/Static Values

### Problem Breakdown

| Issue | File | Line | Root Cause |
|-------|------|------|------------|
| Confidence is pre-baked | `evalEngine.ts:301` | `let confidence = schema.expectedConfidence` | Uses generator's static value instead of computing from real differ |
| Verdict is pre-baked | `evalEngine.ts:302` | `const verdict = schema.expectedVerdict` | Same — never runs actual structural differ |
| Blast radius is hardcoded | `evalEngine.ts:324-328` | 3 static workflow strings | Not calling `@intra/impact` `analyzeImpact()` |
| Adapter synthesis is templated | `evalEngine.ts:360-372` | 6 mutation-specific if/else templates | Not calling `@intra/adapter` `generateAdapter()` |
| Sarvam summary is pass-through | `evalEngine.ts:500` | Template string, not AI analysis | Only the batch-level summary calls Sarvam (and that works) |
| MCP fallback returns schema data | `evalEngine.ts:258-284` | When MCP 404s, it fabricates a contract from `schema.baselinePayload` | Should show "no contract yet" honestly |
| Predictability is static | `apiGenerator.ts:57-130` | `analyzeSchemaPredictability()` uses hardcoded probability thresholds | Should run real statistical analysis on observed data |
| Recovery verification is mutation-specific | `evalEngine.ts:422-434` | Only handles 6 exact mutation types | Should use deep structural equality |

### Required Changes

1. **`evalEngine.ts` Stage 5 (DIFF)**: Replace `schema.expectedConfidence`/`schema.expectedVerdict` with real calls:
   - Import `inferContract` from `@intra/model`
   - Import `diffContracts` from `@intra/differ`
   - Infer baseline contract from `schema.baselineObservations`
   - Infer current contract from mutated observation
   - Run `diffContracts(baseline, current)` → produces real `Change[]` with computed confidence and semantic verdict
   - If differ returns 0 changes, honestly report "no drift detected"

2. **`evalEngine.ts` Stage 5 (IMPACT)**: Replace hardcoded workflows:
   - Import `analyzeImpact` from `@intra/impact`
   - Feed real `Change[]` from differ → get real `Impact` with severity and affected workflows from the dependency graph

3. **`evalEngine.ts` Stage 5 (POLICY)**: Already correct — uses confidence thresholds from §10 Matrix. No change needed.

4. **`evalEngine.ts` Stage 6 (ADAPTER)**: Replace templated adapters:
   - Import `generateAdapter` from `@intra/adapter`
   - Feed real `Change[]` → get synthesized adapter with rollback handle
   - Execute adapter's `adaptResponse` function against mutated payload
   - If policy is `circuit_break`, skip adapter and report honestly

5. **`evalEngine.ts` Stage 8 (VALIDATE)**: Replace mutation-specific validation:
   - Import `runValidation` from `@intra/validator`
   - Compare adapted payload to baseline using deep structural equality
   - Report honest pass/fail with evidence

6. **`evalEngine.ts` MCP fallback**: When engine/MCP return 404, display `"contract": null, "status": "not_yet_observed"` instead of fabricating data from schema.

7. **`apiGenerator.ts` Predictability**: Wire to real `@intra/model` `TDigest` and `HyperLogLog` for cardinality/distribution analysis when live observations exist.

---

## Phase 2: Frontend Visual Overhaul — High-Fidelity Lab Interface

### Design Requirements

| Element | Current | Target |
|---------|---------|--------|
| Background | Flat white | Subtle dot-grid pattern with Washi tint (`#FAF7F2`) overlaid with fine 24px dot matrix |
| Cards | Plain `bg-white border` | Glassmorphism frosted cards with `backdrop-blur-xl`, subtle gradients, crimson glow on hover |
| Mouse interaction | None | Cursor proximity glow — cards subtly illuminate as mouse approaches (CSS `radial-gradient` at `--mouse-x, --mouse-y`) |
| Metric numbers | Static text | Animated counter on mount (count-up from 0 to value), crimson accent pulse on update |
| Progress bar | Simple fill | Gradient fill with shimmer animation, particle trail at leading edge |
| Verdict badges | Plain colored text | Pill badges with icon + glow ring (`equivalent` = emerald, `lossy` = amber, `breaking` = crimson pulse) |
| Pipeline stage indicators | Text logs | Visual pipeline with connected dots, animated stage transitions |
| Chart/visualization | None | SVG radial confidence gauge + verdict donut chart rendered inline |
| Toast/notifications | Standard | Floating glass capsule with entrance slide + blur |

### CSS System Additions (`apps/web/src/index.css`)
- `.dot-grid-bg` — repeating 24px dot pattern
- `.glass-card` — frosted glass card with backdrop blur
- `.glow-proximity` — JS-driven mouse proximity glow
- `.counter-animate` — CSS counter-increment animation
- `.shimmer-bar` — gradient shimmer for progress bars
- `.verdict-pill-*` — verdict-specific pill styles with glow

---

## Phase 3: Verification & Quality Gates

1. Run `pnpm turbo run test typecheck` — all 35 tasks green
2. Run `flutter test` in `android/` — 18/18 green
3. Execute real 50-sample batch on `/eval` and verify:
   - Confidence values vary across real computed range (not fixed at 96/88/83/72)
   - Verdicts reflect actual structural differences
   - Equivalence pass rate reflects honest adapter recovery
   - No "fabricated" contract data when MCP returns 404
4. Sarvam AI summary reflects actual observed metrics (not templated)

---

> [!IMPORTANT]
> **Zero-fake invariant**: After Phase 1, every single number displayed on `/eval` must be derived from a real algorithmic computation (`@intra/differ`, `@intra/model`, `@intra/impact`, `@intra/adapter`, `@intra/validator`). No hardcoded confidence, no templated verdicts, no fabricated contracts.
