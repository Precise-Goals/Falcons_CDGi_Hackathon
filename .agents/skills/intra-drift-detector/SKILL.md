---
name: intra-drift-detector
description: >-
  Use this skill when analyzing API traffic, detecting structural changes, evaluating confidence scores, and classifying semantic drift in external services.
---

# Intra Drift Detector Skill

This skill guides change detection and semantic classification against live observations.

## Steps

1. **Ingest Observations**:
   Collect baseline vs windowed observations using `@intra/observer`.
2. **Infer Endpoint Models**:
   Call `inferContract(observations)` from `@intra/model` to construct schema, field stats, error taxonomy, and pagination styles.
3. **Run Differ Engine**:
   Execute `detectChanges(baseline, current, sampleIds)` from `@intra/differ`.
4. **Inspect Classification & Confidence**:
   - `rename`: Value overlap + string similarity (confidence ≥ 0.90 -> `equivalent`)
   - `unit_shift`: Scale / unit conversion (e.g. float dollars -> int cents -> `equivalent`)
   - `pagination_changed`: Offset to cursor or link header -> `equivalent`
   - `semantic_other`: Format or ordering changes -> `lossy`
   - `enum_semantics`: Semantic meaning change within valid enum -> `breaking`
