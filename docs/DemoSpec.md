# Intra Demo Scenario & Validation Specification

## 1. Demo Overview
The demo validates Intra's capability to autonomously detect, evaluate, and adapt to undocumented changes in external APIs, webhooks, and MCP tools without human intervention. The target audience includes potential users, developers, and QA engineers looking to integrate Intra into their CI/CD and production environments.

The demo uses a simulated e-commerce/logistics app named **Shipwell**. Shipwell relies on several distinct simulated services to perform operations such as searching inventory, processing user profiles, completing payments, acknowledging notifications, and invoking an MCP tool. This demo proves that when underlying services silently break or shift behaviour, Intra can repair workflows automatically (if safe) or quarantine them (if lossy/breaking), turning red states back to green.

## 2. Simulated Services Catalogue

| Service | Endpoints | Schemas & Normal Behaviour |
|---------|-----------|----------------------------|
| **Users API** | `GET /users`, `GET /users/:id`, `POST /users` | Returns `[{ id: string, name: "First Last", status: "active" \| "inactive" }]`. Normal behaviour: predictable format. |
| **Payments API** | `POST /payments/charge` | Expects `amount` (float in USD), `currency` (string, defaults to "USD"). Rate limits: 10 req/sec. |
| **Search API** | `GET /search?q={query}&offset={n}&limit={n}` | Paginated endpoint. Returns `items[]`. Page size 100. Format: standard JSON. |
| **Notifications**| Webhook Receiver | Expects payload: `{ event: { type: string, id: string }, timestamp: number }`. |
| **MCP-tool** | `POST /tools/execute` | Simulates an MCP tool call. Args: `{ query: string, strict: boolean }`. |

## 3. Mutation Catalogue (M1-M10)

| ID | Name | Affected Service | Before → After Example | Expected Detection | Semantic Verdict | Outcome | Capability Validated |
|---|---|---|---|---|---|---|---|
| M1 | Field Rename | Users API | `name` → `display_name` | Change: `rename`, conf ≥0.90 | `equivalent` | Auto-adapt | High-confidence structural rename resolution. |
| M2 | Format Shift | Users API | "First Last" → "Last, First" | Change: `semantic_other` (format) | `lossy` | Quarantine / Proposal | Recognizes semantic string changes that could break UI or parsing. |
| M3 | Unit Shift | Payments API | `amount`: 10.50 (float, USD) → 1050 (int, cents) | Change: `unit_shift` | `equivalent` | Auto-adapt (`x * 0.01`) | Statistical model noticing value magnification/type change. |
| M4 | Default Flip | Payments API | Implicit `currency`="USD" → "EUR" | Change: `default_changed` | `breaking` | Quarantine / Proposal | Detects silent backend default changes. |
| M5 | Pagination Swap | Search API | `offset=20` → `cursor="base64..."` | Change: `pagination_changed` | `equivalent` | Auto-adapt (normalizer) | Understanding structural pagination patterns. |
| M6 | Truncation | Search API | Limit capped 100 → 20 silently | Change: `truncation` | `lossy` | Quarantine / Proposal | Detects payload size drop despite 200 OK. |
| M7 | Nested Flattening | Notifications | `event.type` → `type` | Change: `structural+semantic` | `equivalent` | Auto-adapt | Webhook schema flexibility. |
| M8 | Rate Limit Shift | Payments API | 10 rps → 429 at 5 rps with `Retry-After` | Change: `rate_limit_changed` | `equivalent` | Backoff policy update | Header-based behavioural learning. |
| M9 | Tool Signature | MCP-tool | `query` → `q`, plus required `limit` | Change: `schema+behaviour` | `unknown` | Quarantine / Proposal | SDK/MCP strictness. |
| M10 | Enum Meaning Change | Users API | `status="active"` includes suspended users | Change: `enum_semantics` | `breaking` | Quarantine | Detecting behaviour drift when schema stays valid. |

## 4. Demo Script (Step-by-Step)

1. **Step 1: Startup**
   - Run `pnpm demo`. This launches the 5 simulated services, the Intra engine, the Shipwell demo app, and the Intra dashboard UI.
2. **Step 2: Baseline**
   - The script runs baseline Shipwell workflows (checkout, search, profile view).
   - Traffic is observed; expected state is perfectly green. Intra learns the baseline contracts.
3. **Step 3: Auto-repair (M1, M3, M5)**
   - Toggle M1, M3, M5 via switchboard. Shipwell workflows initially break.
   - Intra detects the changes, calculates impact, and generates an adapter. Validation succeeds. Workflows return to green.
4. **Step 4: Human-escalation (M2, M10)**
   - Toggle M2, M10.
   - Intra detects them, identifies the changes as lossy/breaking, and quarantines them. Proposals are generated for human review. No auto-apply.
5. **Step 5: Dashboard Verification**
   - Open dashboard. The timeline shows all detections with confidence scores and exact before/after diffs.
6. **Step 6: MCP Parity Check**
   - Run a CLI script querying the MCP server with `intra_recent_changes`. Result must exactly match the dashboard detections.
7. **Step 7: Rollback Test**
   - A purposely malformed adapter is injected. Validator fails; Intra rolls back to the previous stable state.

## 5. Acceptance Assertions

For each demo script step, Playwright will assert the following within the given timeout budgets:

- **Baseline:** HTTP 200s across the board. Shipwell UI shows successful data renders. (Timeout: 10s)
- **Auto-repair (M1, M3, M5):**
  - Verify temporary HTTP 500s or structural errors in Shipwell.
  - Verify Intra dashboard event stream shows new adapters applied.
  - Assert Shipwell HTTP 200s resume and UI renders properly. (Timeout: 30s)
- **Escalation (M2, M10):**
  - Assert proposals appear in the dashboard.
  - Assert Shipwell gracefully handles the quarantined state (e.g., fallback UI or clear error message, not silent failure). (Timeout: 15s)
- **MCP Parity:**
  - Expect JSON response from MCP tool call matching the exact list of changes shown in the UI. (Timeout: 5s)
- **Rollback:**
  - Assert system logs the failure and safely falls back. (Timeout: 10s)

## 6. Shipwell App Design

Shipwell is a simulated logistics/commerce application depending entirely on the simulated services.

- **Workflows:**
  - **Checkout:** Hits Payments API (M3, M4, M8).
  - **User Lookup:** Hits Users API (M1, M2, M10) for profiles.
  - **Search-Browse:** Hits Search API (M5, M6) to display catalog.
  - **Notification Acknowledgment:** Listens to webhook (M7).
  - **MCP Call:** AI assistant inside Shipwell calling the MCP-tool (M9).
- **Green vs. Red:**
  - **Green:** Expected valid data rendered, transactions complete, search results > 0.
  - **Red:** JS exceptions parsing data, wrong currency values displayed, infinite loading loops, missing UI components.

## 7. Dashboard Demo Walkthrough

The Dashboard, following the "Washi & Crimson" design system, includes:
- **Services List:** A high-level health status of Users, Payments, Search, Notifications, and MCP tools.
- **Contract Viewer:** Visualizing the baseline models and statistics per endpoint.
- **Drift Feed (SSE):** A live ticker of detected changes showing severity (sumi/crimson indicators) and confidence percentages.
- **Impact View:** Dependency graph mapping Shipwell workflows (e.g., Checkout) to specific API fields.
- **Review UI:** A side-by-side adapter logic diff and proposal viewer for escalations.
- **Demo Console:** A debug drawer to actively toggle M1-M10 mutations live.

## 8. E2E Test Architecture

- **Test Setup (`tests/e2e/demo.spec.ts`):** Spawns all processes (Fastify engine, sim-services switchboard, Vite dashboard). Waits for health checks.
- **Baseline Capture:** Runs standard browser journeys to build the initial Intra models.
- **Test Groups:**
  - `describe('Auto-adapt')`
  - `describe('Quarantine & Propose')`
  - `describe('MCP Integration')`
- **Cleanup:** Teardown script kills processes. CI integration exports Playwright traces and Intra event logs as artifacts.

## 9. Performance & Quality Targets

- **Detection Speed:** Drift detected within N observations (5-10) after mutation toggle.
- **Latency Budget:** Observer pipeline overhead < 5ms.
- **Accuracy:** Precision ≥ 0.90, Recall ≥ 0.95 across all M1-M10 tests.
- **Frontend Quality:** Lighthouse score ≥ 95 (A11y, Performance) with reduced-motion support.
