# ADR-001: Autonomous Pipeline & Data Contract Model

## Context
Modern software heavily depends on third-party APIs, webhooks, SDKs, and MCP servers. Providers regularly make unannounced breaking or subtle semantic changes (e.g. unit shifts, silent field renames, default flips). Traditional OpenAPI/JSON-Schema validation fails because it only inspects syntax, not learned operational behaviour.

## Decision
1. **Core Pipeline Architecture**:
   Implement a 6-stage in-process pipeline in `apps/engine` (Fastify monolith):
   `Observer -> Model -> Differ -> Impact -> Adapter -> Validator`.
2. **Core Domain Types (`packages/shared`)**:
   - `Observation`: Raw recorded request/response pairs with headers, payload, status, latency.
   - `Contract`: Behavioural model containing schema types, field statistics, value distributions, error taxonomies, and pagination policies.
   - `Change`: Typed drift records (`rename`, `unit_shift`, `enum_semantics`, `default_changed`, `pagination_changed`, etc.) tagged with confidence and semantic verdicts (`equivalent`, `lossy`, `breaking`, `unknown`).
   - `Impact`: Workflow blast-radius graph connecting changed fields to application workflows.
   - `Adapter`: Automated middleware transformation with executable code, tests, and atomic rollback handles.
   - `ValidationResult`: Golden test replay results and semantic equivalence verification.
3. **Safe-Handling Policy**:
   - `confidence >= 0.90` AND `equivalent` -> Auto-generate adapter, validate golden tests, auto-apply via canary.
   - `0.70 <= confidence < 0.90` OR `lossy` -> Generate adapter, open migration PR, shadow run only.
   - `< 0.70` OR `breaking` without mapping -> Quarantine workflows, alert, circuit-break with fallback.
4. **Architectural Rationale**:
   - Monolith engine prevents network latency and distributed state drift between pipeline steps.
   - Standalone MCP server (`mcpserver/`) acts as a secure, authenticated, thin client of the engine REST API for external AI agent queries.

## Status
ACCEPTED and LOCKED.
