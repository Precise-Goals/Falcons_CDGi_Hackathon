# DESIGN.md: Crimson, Cream & Black (3-Tone System)

## 1. Color Palette (Three-Color Tone System)
- **Crimson Red**: Primary accent, active states, circuit break, and alerts
  - Base: `#C8102E` | Hover: `#A60D26` | Subtle Tint: `#FDECEF`
- **Cream**: Background and soft surface card tone
  - Base: `#FAF7F2` | Card: `#FFFFFF` | Subtle: `#F4EFEB` | Border: `#E8E2D9`
- **Black**: High-contrast typography, crisp rules, and pill dock frames
  - Base: `#0A0A0A` | Muted: `#4A4A4A` | Border: `#1F1F1F`

## 2. Typography
- **UI & Body Standard**: `Poppins` (weights 300, 400, 500, 600, 700)
- **Display & Headings**: `Montserrat` (weights 500, 600, 700, 800, 900)
- **Code & Telemetry**: `JetBrains Mono` (weights 400, 500, 600, 700)
- Note: Zero foreign language / Japanese script glyphs; clean, modern Latin typographic hierarchy.

## 3. Key Components & Motifs
- **React Bits Floating Capsule Navbar**:
  - Centered floating pill dock anchored at the top viewport (`max-w-4xl`, rounded-full, backdrop-blur-xl, subtle black/10 border, shadow-capsule).
  - Sliding active pill highlights for views: Drift Feed, Blast Radius, Adapters, Switchboard.
  - Live Observer pulsing crimson indicator.
- **Antigravity-Style Footer**:
  - 4-column architecture, MCP tool directory, and Safe-Handling policy matrix.
  - Signature showstopper element: Giant, cinematic `Intra.` headline spanning the base with background gradient red text clipping (`bg-clip-text text-transparent bg-gradient-to-b from-crimson via-red-600 to-crimson/10`).
- **Surface Texture**:
  - Clean minimalist dot grid pattern (`radial-gradient(rgba(10, 10, 10, 0.04) 1px, transparent 0)`).

## 4. Severity & Drift Language
- **Equivalent**: Solid black pill badge or outline (`CONFIDENCE ≥ 90%`, auto-apply canary).
- **Lossy**: Neutral pill with human-reviewed migration proposal (`70% ≤ CONFIDENCE < 90%`).
- **Breaking**: Solid Crimson Red badge (`CONFIDENCE < 70%` quarantine or circuit breaker tripped).
- Always icon + label pairing for WCAG accessibility.

## 5. Quality Bar
- WCAG AA contrast compliance across all text and interactive badges.
- Lighthouse Accessibility ≥ 95, Performance ≥ 85.
- Light cream theme with rich black contrast rules and crimson red accents.