# HARNESS.md: Intra Autonomous Build Harness

> Repo: https://github.com/Precise-Goals/Intra.git
> Product: **Intra**, infrastructure that lets software survive undocumented changes in external services (APIs, SDKs, MCP servers, webhooks).
> Read this file first. Every agent. Every session. Keep it open, keep it short in context (load only the sections you need; see §2).

---

## 0. Mission (never changes)

Build a system that implements this pipeline end to end:

```
External service → Observed behaviour → Contract/behavioural model → Change detection
→ Impact analysis → Adapter or migration → Validation → Updated system
```

**Non-negotiables**
1. Do NOT rely on documented schemas alone. Learn real behaviour from traffic (defaults, errors, pagination, rate limits, semantic drift in valid JSON).
2. Every detected change gets a **confidence score** and a **semantic verdict**: `equivalent | lossy | breaking | unknown`.
3. Auto-repair ONLY when confidence ≥ threshold AND validation passes. Otherwise produce a **proposed migration (PR)** and stop. Safe failure beats clever failure.
4. Ship a **demo**: an app dependent on several simulated services, undocumented changes injected live, automatic detect → impact → adapt → validate, workflows green again.
5. Ship an **MCP server** so customers can query Intra (contracts, drift, impact, proposals) from their own agents, alongside the core engine and dashboard.

**Definition of Done (project):** the Demo Script in §13 runs from a clean clone with one command and all assertions pass in CI.

---

## 1. Operating Principles ("Get Shit Done" mode)

| Principle | Rule |
|---|---|
| Spec before code | No code without a task in `.harness/PLAN.md` with acceptance criteria. |
| Fresh context per unit of work | One task = one subagent = one fresh context. Never carry history; carry **files**. |
| Files are memory | State lives in `.harness/` (STATE, PLAN, LEARNINGS), not in chat. |
| Atomic commits | One task = one commit = one conventional-commit message. |
| Verify, don't trust | An agent's claim of "done" means nothing until QA agent + gates pass. |
| Parallel by default | If two tasks don't touch the same files, run them concurrently (§6). |
| Smallest sufficient model | Haiku for mechanical, Sonnet for implementation, Opus only for architecture/review/stuck-breaking. |
| Stop when stuck | Max 3 attempts → write BLOCKER, escalate (§9). Never thrash. |

---

## 2. Token Optimization Rules (apply always)

1. **Progressive disclosure.** Load only: this file's §0–§2 + the agent's own file + the current task block. Everything else on demand via `grep`/ranged `view`.
2. **Never re-read what you wrote.** Trust tool success output; re-read only on failure.
3. **Search, don't dump.** `rg -n "symbol"` then read ±40 lines. No whole-file reads over 200 lines without cause.
4. **Output contract.** Subagents return ≤ 15 lines: `STATUS | files changed | tests run+result | blockers | next`. No prose recap, no code echo.
5. **Diffs over rewrites.** Use targeted edits. Never regenerate a file to change 3 lines.
6. **Cache-friendly prompts.** Static content first (harness, agent role), volatile content last (task, error logs). Keep static prefix byte-identical across loop iterations.
7. **Compact logs.** Test/lint output piped through `tail -n 40` or reporter `dot`/`json-summary`. Only expand failing tests.
8. **Task sizing.** A task fits in ≤ 8 files and ≤ ~150 changed lines. If larger, split it.
9. **Context budget.** Orchestrator target ≤ 25k tokens live. Subagent target ≤ 60k. At 70% → write handoff to `.harness/STATE.md` and end the session.
10. **LEARNINGS.md is capped** at 60 lines; prune on every sprint end (merge duplicates, delete stale).

---

## 3. Tech Stack (LOCKED, mirrored in `.harness/STACK.md`)

| Layer | Decision |
|---|---|
| Language | TypeScript (strict), Node 20+ everywhere (engine, web, MCP server) |
| Repo | pnpm workspaces + Turborepo, Conventional Commits enforced (commitlint + husky) |
| Core app | **Monolith**: one deployable `apps/engine` (Fastify) hosting observer, model, differ, impact, adapter, validator as in-process modules + REST/SSE API |
| Frontend | **React 18 + Vite + Tailwind + shadcn/ui** (`apps/web`, SPA) |
| Animated UI | **React Bits** (primary), Magic UI / Aceternity (accents), Motion (framer-motion), GSAP (hero/scroll) |
| 3D UI | three.js via `@react-three/fiber` + `@react-three/drei` (lazy-loaded, reduced-motion safe) |
| State/data | TanStack Query + Zustand; SSE for live drift feed |
| Storage | Postgres on Railway (Drizzle ORM); SQLite for local dev/tests |
| Tests | Vitest (unit/int), Playwright (e2e), Testing Library (UI) |
| Auth | **Firebase Authentication, strictly required** for every non-public route. Web: Firebase client SDK (config from `VITE_FIREBASE_*`). Engine/MCP: `firebase-admin` verifies ID tokens (config from env, never committed) |
| Wallet | **BridgeKey wallet on MST Blockchain only**, via the MST SDK, behind a `WalletProvider` interface. Wallet is *linked to the Firebase user* by signing a server nonce; link is recorded, not used for login |
| Ledger | `packages/ledger`: append-only **hash chain + signed entries**, local to the engine DB. **No public-chain writes in v1.** Checksum hashes are `console.log`ged (structured, hashes only) |
| Product mode | **Real startup product**: multi-tenant (org → project), per-tenant API keys, audit log, retention policy, rate limits, error tracking |
| Simulated services | Fastify mocks + mutation switchboard (`packages/sim-services`) |
| MCP server | Separate folder `mcpserver/`, deployed to **Render**, Node/TS (`@modelcontextprotocol/sdk`), thin client of the engine REST API; shares zod types via `packages/shared` |
| Hosting | `apps/web` → **Vercel**; `apps/engine` + Postgres → **Railway**; `mcpserver/` → **Render** |
| CI/CD | GitHub Actions + CodeRabbit; deploys on `main` via platform Git integrations (Vercel/Railway/Render) gated on green CI |

### 3.1 Design System: Crimson Red, Cream & Black (3-Tone System)

| Token | Value | Use |
|---|---|---|
| `--crimson` | `#C8102E` (hover `#A60D26`, tint `#FDECEF`) | primary actions, alerts, status indicators, gradient accents |
| `--cream` | `#FAF7F2` (card `#FFFFFF`, subtle `#F4EFEB`, border `#E8E2D9`) | page background, card surfaces, soft containers |
| `--black` | `#0A0A0A` (muted `#4A4A4A`, border `#1F1F1F`) | text, headings, capsule dock frames, code blocks |

- **Type:** Montserrat for display/headings, Poppins for standard UI/body, JetBrains Mono for code/telemetry. Zero foreign/Japanese script text.
- **Motifs & Layout:**
  - React Bits style floating capsule navbar (pill dock anchored at top).
  - Antigravity-style cinematic footer with giant `Intra.` headline and red gradient text clipping.
  - Minimalist dot grid surface texture.
- **Severity mapping:** equivalent = solid black badge, lossy = subtle outline with migration proposal, breaking = solid crimson alert / circuit breaker. Color is never the sole signal (icon + label always paired).
- **Rules:** light cream theme with deep black contrast rules, WCAG AA contrast compliance, Lighthouse a11y ≥ 95, all tokens in `tailwind.config.js`.
- `web-dev` MUST read `.harness/DESIGN.md` before any UI task.

### 3.2 MCP server (LOCKED: Node/TS on Render)
`mcpserver/` is a separate pnpm workspace package and separate deployable. Uses `@modelcontextprotocol/sdk` with Streamable HTTP transport (stdio for local dev), API-key auth, per-tenant scoping, audit log. It calls the engine only through its REST API (types from `packages/shared`), never importing engine internals. Render settings: root dir `mcpserver`, build `pnpm install && pnpm --filter mcpserver build`, start `node dist/index.js`, health route `/healthz`.

---

## 4. Architecture & Repo Layout

```
Intra/
├─ HARNESS.md                      # this file
├─ CLAUDE.md                       # thin pointer: "read HARNESS.md"
├─ AGENTS.md                       # same, for non-Claude agents
├─ .coderabbit.yaml
├─ .claude/
│  ├─ agents/                      # subagent definitions (§5)
│  ├─ commands/                    # /gsd-plan /gsd-exec /gsd-verify /ralph /ship
│  └─ settings.json                # permissions, hooks
├─ .harness/
│  ├─ STACK.md                     # locked stack decisions
│  ├─ DESIGN.md                    # Washi & Crimson design tokens/rules (web-dev reads first)
│  ├─ STATE.md                     # current sprint/wave/task pointer + handoff
│  ├─ PLAN.md                      # task graph with acceptance criteria
│  ├─ SPRINTS.md                   # sprint board (§11)
│  ├─ LEARNINGS.md                 # ≤60 lines, loop-discovered gotchas
│  ├─ BLOCKERS.md                  # escalations awaiting human/Opus
│  ├─ PROMPT_LOOP.md               # Ralph per-iteration prompt
│  └─ loop.sh                      # Ralph driver
├─ apps/
│  ├─ engine/                      # MONOLITH: observe→model→detect→impact→adapt→validate (Railway)
│  ├─ web/                         # Vite + React website/dashboard (Vercel)
│  └─ demo-app/                    # "Shipwell": app that depends on sim services
├─ mcpserver/                      # customer MCP server, separate deployable (Render)
├─ packages/
│  ├─ sdk/                         # Intra client SDK / proxy wrapper
│  ├─ observer/                    # HTTP/webhook/MCP traffic capture
│  ├─ model/                       # contract + behavioural model
│  ├─ differ/                      # change detection + semantic classification
│  ├─ impact/                      # dependency graph + workflow impact
│  ├─ adapter/                     # adapter generation + migration proposals
│  ├─ validator/                   # replay, regression, golden tests
│  ├─ sim-services/                # simulated external services + mutations
│  └─ shared/                      # types, zod schemas, utils
├─ tests/e2e/                      # demo-script assertions
└─ .github/workflows/              # ci.yml, coderabbit.yml, release.yml
```

### Module responsibilities (one-liners)

- **observer**: records request/response pairs (status, headers, body, latency, rate-limit headers, pagination shape, error bodies) into `observations`.
- **model**: builds per-endpoint **contract** (schema, field stats, enums, nullability, defaults, error taxonomy, pagination style, rate-limit policy) plus **behavioural fingerprint** (distribution of values, units, formats, cardinalities).
- **differ**: compares the baseline model with the new window. Emits typed `Change` records (see §12). Detects structural AND semantic drift (renames, unit shifts, enum meaning change, default flips, pagination swap, error-shape change, silent truncation, new rate limit).
- **impact**: static + runtime dependency map `workflow → endpoint → field`. Answers "what breaks if `name` disappears?"
- **adapter**: generates a mapping layer (rename, transform, default injection, pagination normalizer, retry/backoff policy) as versioned adapter code + tests. Or a migration PR.
- **validator**: replays recorded workflows against the adapted service; runs golden tests; computes pass/fail + semantic-equivalence check.

---

## 5. Subagent Roster

Definitions live in `.claude/agents/<name>.md`. Each has: role, model, tools, **owned paths** (write access), output contract (§2.4).

| Agent | Model | Owns (write) | Purpose |
|---|---|---|---|
| `orchestrator` | Opus | `.harness/*` | Plans waves, dispatches, merges results, updates STATE. Never writes product code. |
| `architect` | Opus | `docs/adr/*`, `packages/shared` types | ADRs, interfaces, schemas. Runs Sprint 0 and any redesign. |
| `observer-dev` | Sonnet | `packages/observer`, `packages/sdk` | Traffic capture, proxy/SDK wrapper. |
| `model-dev` | Sonnet | `packages/model` | Contract + behavioural inference. |
| `differ-dev` | Sonnet | `packages/differ` | Change detection, semantic classifier, confidence scoring. |
| `impact-dev` | Sonnet | `packages/impact` | Dependency graph, workflow impact. |
| `adapter-dev` | Sonnet | `packages/adapter` | Adapter generation, migration proposals, safe-fail logic. |
| `validator-dev` | Sonnet | `packages/validator`, `tests/e2e` | Replay, regression, golden tests. |
| `sim-dev` | Haiku→Sonnet | `packages/sim-services`, `apps/demo-app` | Simulated services + mutation switchboard + demo app. |
| `web-dev` | Sonnet | `apps/web` | Website/dashboard UI. |
| `mcp-dev` | Sonnet | `mcpserver/` | Customer MCP server tools/resources. |
| `ledger-dev` | Sonnet | `packages/ledger` | Hash chain, entry signing, canonical hashing, checksum console logging, `WalletProvider` + MST adapter, verify/inclusion API. |
| `auth-dev` | Sonnet | `apps/engine/src/auth/**`, `apps/web/src/auth/**` | Firebase login (web + token verification), tenancy (org/project), API keys, wallet link flow (nonce challenge). |
| `qa-engineer` | Sonnet | `**/*.test.ts`, `tests/**` (tests only) | Independent verifier: writes missing unit tests, runs gates, **cannot edit src**; files failures back. |
| `reviewer` | Opus | none (read-only) | Pre-PR review against ADRs + security + token/perf hygiene; works alongside CodeRabbit. |
| `devops` | Haiku/Sonnet | `.github/**`, CI configs | Actions, CodeRabbit config, release pipeline. |
| `scribe` | Haiku | `README.md`, `docs/**` | Docs, changelog, LEARNINGS pruning. |

**Ownership rule:** an agent edits only its owned paths. Cross-boundary change → request via `.harness/BLOCKERS.md` or interface PR to `architect`. This is what makes parallel work conflict-free.

**Standard subagent output contract:**
```
STATUS: done|partial|blocked
FILES: <paths>
TESTS: <cmd> → <pass/fail counts>
BLOCKERS: <none|short>
NEXT: <one line>
```

---

## 6. Orchestration: GSD Cycle + Parallel Waves

### 6.1 Cycle (per sprint)

```
DISCUSS  (architect + orchestrator; ≤1 page; resolve ambiguities)
  → PLAN   (orchestrator writes task graph into PLAN.md with deps + owned paths + acceptance criteria)
  → EXECUTE (waves of parallel subagents, each in an isolated git worktree)
  → VERIFY  (qa-engineer + reviewer + CodeRabbit gates, §8)
  → SHIP    (devops: PR → CI → merge, §9)
  → RETRO   (scribe: prune LEARNINGS, update STATE)
```

### 6.2 Wave planning

Orchestrator topologically sorts tasks by dependency, then groups into **waves**. All tasks in a wave are independent and run **concurrently**.

```
Wave N: [taskA(observer-dev)] [taskB(model-dev)] [taskC(sim-dev)] [taskD(web-dev)]   ← parallel
        └── barrier: all green + merged to integration branch ──┘
Wave N+1: ...
```

- Max **parallel width: 5** (token + merge-risk ceiling). Tune in `STATE.md`.
- Each task runs in `git worktree add ../wt/<task-id> -b task/<id>`; merges into `sprint/<n>` integration branch at the barrier.
- Interfaces first: wave 0 of each sprint is always `architect` publishing types in `packages/shared` so downstream agents code against stable contracts.

### 6.3 Task schema (in PLAN.md)

```md
### T-023 · differ: detect field-rename candidates
- agent: differ-dev
- deps: T-011, T-019
- paths: packages/differ/**
- accept:
  - [ ] Given baseline `name` + new `display_name` with ≥0.9 value overlap → Change{kind:"rename", confidence≥0.85}
  - [ ] Unit tests ≥ 8 cases incl. false-positive (unrelated fields)
  - [ ] `pnpm --filter differ test` green, coverage ≥ 85% on new files
- status: todo|doing|qa|done|blocked
```

---

## 7. Ralph Loop (autonomous grind)

Purpose: turn a task list into shipped code with **no human in the loop**, using fresh context each iteration and files as memory.

### 7.1 Loop contract

Each iteration:
1. Fresh session. Load: `HARNESS.md §0–§2`, `.harness/PROMPT_LOOP.md`, `STATE.md`, `LEARNINGS.md`.
2. Pick the **first** task with `status: todo` whose deps are `done`. Exactly one.
3. Dispatch to the owning subagent (or execute directly if trivial).
4. Run gates (§8). On fail → fix up to 3 attempts inside the iteration.
5. Commit (`feat(differ): rename detection [T-023]`), update PLAN status, append ≤2 lines to LEARNINGS if something non-obvious was found.
6. Exit session. Driver starts the next iteration.

### 7.2 Driver `.harness/loop.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
MAX_ITERS=${MAX_ITERS:-60}
STUCK_LIMIT=3
i=0; stuck=0; last_hash=""

while [ $i -lt $MAX_ITERS ]; do
  i=$((i+1))
  echo "=== Ralph iteration $i ==="
  claude -p "$(cat .harness/PROMPT_LOOP.md)" \
        --dangerously-skip-permissions=false \
        --allowedTools "Read,Edit,Write,Bash,Task,Grep,Glob" \
        --max-turns 40 | tail -n 25 | tee -a .harness/loop.log

  grep -q "<promise>SPRINT_COMPLETE</promise>" .harness/loop.log && { echo "Sprint complete"; break; }
  grep -q "<promise>ALL_COMPLETE</promise>"    .harness/loop.log && { echo "Project complete"; break; }

  # stuck detection: no repo change across iterations
  h=$(git rev-parse HEAD)$(git status --porcelain | md5sum)
  if [ "$h" = "$last_hash" ]; then stuck=$((stuck+1)); else stuck=0; fi
  last_hash=$h
  [ $stuck -ge $STUCK_LIMIT ] && { echo "STUCK → escalate"; echo "- $(date -Is) loop stuck at iter $i" >> .harness/BLOCKERS.md; exit 2; }
done
```

> Run tool-permission config in `.claude/settings.json` (allow list) rather than skipping permissions. Run inside a container/dev-sandbox if enabling full autonomy.

### 7.3 Completion promises
- `<promise>SPRINT_COMPLETE</promise>`: all tasks in the current sprint `done` AND sprint exit criteria (§11) verified.
- `<promise>ALL_COMPLETE</promise>`: Sprint 6 done and §13 Demo Script passes.
- Never emit a promise unless true. Reviewer re-checks promises.

### 7.4 Anti-thrash rules
- Same error twice → change approach, not retry.
- 3 failures on one task → mark `blocked`, write BLOCKER, move to next independent task (don't halt whole loop).
- No scope creep: ideas go to `PLAN.md#backlog`, not into the current task.

---

## 8. Quality Gates (QA Engineer + CodeRabbit)

Order is fixed; each must pass before the next. Fail fast, return the compact failure only.

```
G1 typecheck      pnpm -w typecheck                    (tsc --noEmit)
G2 lint           pnpm -w lint
G3 unit tests     pnpm -w test --reporter=dot          (Vitest)
G4 coverage       ≥ 85% lines on changed packages; ≥ 90% for differ, adapter, validator (safety-critical)
G5 qa-engineer    independent review pass (below)
G6 coderabbit     `coderabbit review --plain` (CLI, local) → no unresolved critical/major
G7 reviewer       architecture/ADR/security spot-check
G8 integration    pnpm -w test:int  (sim-services + engine)
G9 e2e (sprint+)  Playwright + demo script assertions
```

### qa-engineer protocol
1. Read the task's acceptance criteria and the diff only (`git diff --stat`, then per-file).
2. Write tests the dev **didn't**: boundary values, malformed JSON, empty arrays, null vs missing, unicode, huge payloads, concurrent calls, time-dependent behaviour.
3. Include **mutation sanity**: for differ/adapter, add at least one test that fails if logic is inverted.
4. Verify false-positive resistance (benign change must NOT trigger a breaking verdict).
5. Run G1–G4. Report in the output contract. **Never modify src**; return `STATUS: partial` with failing test names to the owning dev.
6. Flaky test = defect. Fix or quarantine with a tracked issue; never retry-until-green.

### CodeRabbit
- `.coderabbit.yaml`: `reviews.profile: assertive`, `auto_review.enabled: true`, path instructions for safety-critical packages (differ/adapter/validator: "flag any auto-apply path without confidence gate").
- Local: run CLI pre-PR (G6). Remote: GitHub app reviews every PR; devops agent reads the review and dispatches fixes to owners. Loop until no actionable critical/major comments.

---

## 9. Autonomous CI/CD → GitHub

Target: `https://github.com/Precise-Goals/Intra.git`

### 9.1 Branching
- `main`: protected, always green, deployable.
- `sprint/<n>`: integration branch per sprint.
- `task/T-<id>-<slug>`: per-task worktree branches.
- Conventional Commits. Squash-merge task → sprint; **merge-commit** sprint → main (preserves history).

### 9.2 Pipeline (`.github/workflows/ci.yml`)
```
on: pull_request, push(main)
jobs:
  verify:   install(cache pnpm) → typecheck → lint → unit+coverage → build
  integration: services up (sim-services) → engine integration tests
  e2e:      Playwright + demo script  (sprint→main PRs only)
  security: npm audit --omit=dev, gitleaks, license check
  coderabbit: required status
  deploy:   (main only) dashboard → host of choice, engine image build
```
Use path filters + Turborepo remote/local cache to skip untouched packages (token- and minute-optimized).

### 9.3 Autonomous ship flow (devops agent)
1. Gates G1–G8 green locally.
2. `git push -u origin <branch>` → open PR via `gh pr create` using template (what/why/tests/risk/confidence).
3. Wait for CI + CodeRabbit (`gh pr checks --watch`).
4. Actionable comments → dispatch to owner → push fixes → re-check (max 3 rounds, then BLOCKER).
5. **Auto-merge** (`gh pr merge --squash --auto`) only if: all required checks green, ≥1 CodeRabbit approval/no critical, reviewer agent signed off, diff touches no `.github/**`, `HARNESS.md`, or secrets config (those require human approval).
6. Update `STATE.md`, delete branch + worktree.

### 9.4 Safety rails
- Never `push --force`, never rewrite `main`, never disable checks, never commit secrets (pre-commit `gitleaks`).
- Credentials via `gh auth`/Actions secrets only. No tokens in repo or prompts.
- Destructive ops (DB drops, history edits, deleting branches not own) → human approval.

---

## 10. Safe-Handling Policy (core product logic; must be implemented and tested)

| Confidence | Semantic verdict | Action |
|---|---|---|
| ≥ 0.90 | equivalent | Auto-generate adapter → validate → **auto-apply** (canary, then full) |
| 0.70–0.90 | equivalent/lossy | Generate adapter + **open migration PR**, apply to shadow only |
| < 0.70 or `unknown` | any | **No auto-apply.** Quarantine affected workflows, alert, produce evidence bundle |
| any | breaking (no mapping) | Circuit-break the dependency, serve cached/fallback if configured, propose migration |

Every decision records: evidence (sample diffs), confidence breakdown, affected workflows, rollback handle. Validation failure after adapter → auto-rollback.

### 10.1 Replay safety classes (hard rules)
| Class | Meaning | Replay allowed |
|---|---|---|
| `safe` | read-only, idempotent (GET/HEAD) | Against live provider and against adapted proxy |
| `sandbox-only` | state-changing but provider offers a sandbox/test mode | Sandbox only |
| `shadow-only` | state-changing, no sandbox (payments, emails, deletes) | **Never replayed live**; validate adapter offline on recorded traces and compare in shadow mode |
Unclassified calls default to `shadow-only`. Active probes (§11 Sprint 2) use `safe` calls only.

---

## 11. Sprint Board (agents, waves, exit criteria)

> Parallel width ≤ 5. "W#" = wave. Each sprint ends with: QA full pass → CodeRabbit → PR → CI → merge → retro.

### Sprint 0: Foundations (≈ 1 loop day)
| W | Agent | Task |
|---|---|---|
| W0 | architect | ADR-001 pipeline & data model; publish `packages/shared` types (`Observation`, `Contract`, `Change`, `Impact`, `Adapter`, `ValidationResult`); lock STACK.md |
| W1 ∥ | devops | Monorepo scaffold, pnpm/Turbo, tsconfig, ESLint, Vitest, husky+gitleaks, `.coderabbit.yaml`, ci.yml skeleton |
| W1 ∥ | scribe | CLAUDE.md/AGENTS.md pointers, README skeleton, docs structure |
| W1 ∥ | sim-dev | Sim service skeleton + mutation switchboard API contract |
| W2 | qa-engineer | Validate scaffold: gates run green on empty packages |
**Exit:** `pnpm -w typecheck lint test build` green; first PR merged via autonomous pipeline.

### Sprint 1: Walking Skeleton (Observe, Simulate, thin end-to-end slice)
| W | Agent | Task |
|---|---|---|
| W0 | architect | Interface review of observer/sim contracts |
| W1 ∥ | observer-dev | HTTP capture proxy + SDK wrapper; webhook receiver; redaction of PII; storage to `observations` |
| W1 ∥ | sim-dev | 4 simulated services: **Users**, **Payments**, **Search** (paginated), **Notifications webhook**; plus **MCP-tool service** |
| W1 ∥ | sim-dev (2nd instance) | Mutation catalogue v1 (see §13) toggled via switchboard |
| W1 ∥ | auth-dev | Firebase login end to end: web sign-in (env-config), engine token-verification middleware, tenant model (org/project), strict route guard, `.env.example`; tests with Firebase emulator |
| W1 ∥ | web-dev | Site shell in Washi & Crimson: Home, Agent (placeholder), Docs (shell), Dashboard layout behind auth guard, Services list page |
| W2 | qa-engineer | Unit + integration tests for capture fidelity (headers, status, body, latency) |
| W3 ∥ | differ-dev | **Thin slice**: minimal structural diff + rename-candidate detector (M1 only), no tuning |
| W3 ∥ | impact-dev | **Thin slice**: AST scan of demo-app for `user.name` reads → workflow list |
| W3 ∥ | adapter-dev | **Thin slice**: `rename` DSL op + apply in proxy |
| W3 ∥ | validator-dev | **Thin slice**: replay one recorded read-only workflow; assert green after adapter |
| W4 | qa-engineer | `pnpm demo:slice` e2e: inject M1 → detect → impact → adapt → validate → green, plus a "benign change must not alert" case |
**Exit:** (a) traffic from demo-app to all sim services is captured with ≥ 99% fidelity; (b) **the whole pipeline works end to end for M1 (rename)** via `pnpm demo:slice`. Later sprints deepen each stage; they never delay the working slice.

### Sprint 2: Model (learn real behaviour)
| W | Agent | Task |
|---|---|---|
| W1 ∥ | model-dev | Schema inference (types, optionality, enums, formats) |
| W1 ∥ | model-dev (2nd) | Behavioural fingerprint (value distributions, units, defaults, cardinality) |
| W1 ∥ | model-dev (3rd) | Error taxonomy, pagination detector (cursor/offset/page/link-header), rate-limit policy learner |
| W1 ∥ | model-dev (4th) | **Byte-level fingerprints**: canonical + raw SHA-256, byte-length/encoding/compression profile, per-field numeric width (int32/int64/>2^53), string encoding |
| W1 ∥ | observer-dev | **Active probes**: scheduled, allow-listed, rate-limited, **read-only (GET/HEAD) only** probes so quiet dependencies are still watched; per-tenant opt-in |
| W1 ∥ | web-dev | Contract viewer page (per endpoint model, field stats) |
| W2 | qa-engineer | Property-based tests on inference; stability under noisy data |
**Exit:** model for each sim service built from observation only (docs ignored); contract viewer renders it.

### Sprint 3: Detect (change detection)
| W | Agent | Task |
|---|---|---|
| W1 ∥ | differ-dev | Structural diff (add/remove/type change/nullability) |
| W1 ∥ | differ-dev (2nd) | **Semantic drift**: rename candidates (value-overlap + name-similarity), unit/scale shift, enum meaning change, default flip, timezone/format change |
| W1 ∥ | differ-dev (3rd) | Behavioural diff: pagination change, error shape change, rate-limit change, silent truncation, latency regime shift |
| W1 ∥ | differ-dev (4th) | **Mixed-version detection**: detect two coexisting response populations (old/new shape), classify as `rollout_in_progress`, track new-shape ratio over time, finalize verdict when stable; never alert-storm during rollout |
| W1 ∥ | web-dev | Drift feed UI with severity + confidence |
| W2 | differ-dev | Confidence scoring + false-positive suppression (statistical windows) |
| W3 | qa-engineer | **Calibration report**: bin changes by predicted confidence, compare to ground-truth correctness; fail CI if any bin is off by more than 0.10 |
| W3 | qa-engineer | Benign-change corpus (must NOT alert) + malicious-change corpus (must alert); precision/recall report |
**Exit:** recall ≥ 0.95, precision ≥ 0.90 on the mutation catalogue; calibration report within ±0.10 per confidence bin; mixed-rollout cases do not alert-storm; all reported in CI artifact.

### Sprint 4: Impact & Adapt
| W | Agent | Task |
|---|---|---|
| W1 ∥ | impact-dev | Static dependency scan (AST: field usage per workflow) + runtime trace correlation |
| W1 ∥ | impact-dev (2nd) | Workflow graph + blast-radius query ("what depends on `name`?") |
| W1 ∥ | impact-dev (3rd) | **Consumer expectations**: declarative per-field assertions (e.g. `user.name: non-empty string`, `payment.amount: integer cents`) stored with the app; feed impact severity and validation; catch meaning changes statistics miss |
| W1 ∥ | adapter-dev | Adapter generators: rename, transform (unit/format), default injection, pagination normalizer, retry/backoff |
| W1 ∥ | adapter-dev (2nd) | Safe-handling policy engine (§10), migration PR generator, rollback handles |
| W1 ∥ | web-dev | Impact view + adapter/proposal review UI |
| W2 | qa-engineer | Tests: adapter correctness, policy thresholds, rollback |
**Exit:** for each catalogue mutation, an adapter or a proposal is produced per §10.

### Sprint 5: Validate & Demo
| W | Agent | Task |
|---|---|---|
| W1 ∥ | validator-dev | Replay engine: recorded workflows vs adapted service; golden assertions |
| W1 ∥ | validator-dev (2nd) | Semantic-equivalence checker (e.g. `name` vs `display_name` meaning preserved?) |
| W1 ∥ | validator-dev (3rd) | **Replay safety classes** (§10.1): enforce `safe` / `sandbox-only` / `shadow-only`; hard-block live replay of state-changing calls |
| W1 ∥ | sim-dev | Demo app **Shipwell** workflows (checkout, user-profile, search-browse, notification-ack, MCP-tool-call) |
| W1 ∥ | mcp-dev | Customer MCP server (§12.2) |
| W1 ∥ | ledger-dev | `packages/ledger`: canonical hashing, hash chain, Ed25519-signed entries, verify + inclusion check, structured checksum `console.log` (hashes only), `WalletProvider` interface + MST adapter (BridgeKey connect) once SDK docs are supplied |
| W1 ∥ | auth-dev | Wallet link flow: server nonce → wallet signs → engine verifies → stores `uid ↔ address`; unlink; audit entries |
| W2 | web-dev | Agent page (changes, impact, proposals, chat) and Verify page (hash/id → chain check) |
| W1 ∥ | web-dev | Live demo console: mutation toggles, timeline, before/after |
| W2 | validator-dev | `pnpm demo` one-command orchestration |
| W3 | qa-engineer | E2E: full demo script assertions (§13) |
**Exit:** Demo Script passes in CI.

### Sprint 6: Harden & Ship
| W | Agent | Task |
|---|---|---|
| W1 ∥ | qa-engineer | Chaos tests (flapping service, partial outage, combined mutations), perf budget |
| W1 ∥ | reviewer | Security/threat model review (PII, SSRF in proxy, adapter code-injection) |
| W1 ∥ | scribe | Docs content, MDN-style: Concepts, Guides, Reference (REST, MCP tools, SDK, change kinds, adapter DSL, ledger), compatibility table |
| W1 ∥ | web-dev | Docs site shell: MDX, Pagefind search, code-copy, sidebar; startup polish (empty states, error pages, a11y ≥95) |
| W1 ∥ | devops | Startup ops: error tracking, structured logs, per-tenant rate limits, DB backups, staging env, secrets via platform vault |
| W1 ∥ | devops | Release workflow, container images, deploy dashboard, tag v1.0.0 |
| W2 | orchestrator | Final retro; `<promise>ALL_COMPLETE</promise>` after reviewer sign-off |
**Exit:** v1.0.0 tagged, main green, demo reproducible from clean clone.

---

## 12. Key Interfaces

### 12.1 `Change` record (in `packages/shared`)
```ts
type Change = {
  id: string;
  service: string; endpoint: string;
  kind: 'field_added'|'field_removed'|'type_changed'|'rename'|'unit_shift'|
        'enum_semantics'|'default_changed'|'pagination_changed'|'error_shape_changed'|
        'rate_limit_changed'|'truncation'|'latency_regime'|'semantic_other';
  documented: boolean;                // was it in the published schema/changelog?
  before: unknown; after: unknown;
  evidence: { samples: Observation['id'][]; stats: Record<string, number> };
  semanticVerdict: 'equivalent'|'lossy'|'breaking'|'unknown';
  confidence: number;                 // 0..1, with breakdown
  detectedAt: string;
};
```

### 12.2 Customer MCP server (`mcpserver/`)
Tools (read-mostly, write only via safe proposals):
- `intra_list_dependencies`: services/endpoints being observed
- `intra_get_contract(service, endpoint)`: learned contract + fingerprint
- `intra_recent_changes(service?, since?, min_confidence?)`
- `intra_impact(change_id | field_path)`: affected workflows
- `intra_propose_adapter(change_id)`: returns adapter diff + validation plan (does not apply)
- `intra_apply_adapter(proposal_id)`: gated by policy (§10) + explicit `confirm:true`
- `intra_health()`: dependency health & rate-limit headroom
- `intra_verify_proof(entry_id | hash)`: ledger chain/signature check
Resources: `intra://contracts/{service}`, `intra://changes/latest`. Auth: API key; per-tenant scoping; audit log on every call.

---

## 13. Demo Spec & Acceptance Script

### Simulated services (undocumented-change catalogue v1)
| # | Service | Mutation (undocumented) | Expected detection | Expected outcome |
|---|---|---|---|---|
| M1 | Users | `GET /users` field `name` → `display_name` | rename, conf ≥0.9 | auto-adapt, workflows green |
| M2 | Users | `name` now "Last, First" instead of "First Last" | semantic_other (format) | **lossy** → proposal, not auto-apply |
| M3 | Payments | `amount` from dollars (float) → cents (int) | unit_shift | auto-adapt with transform ×0.01 |
| M4 | Payments | default `currency` flips USD → EUR when omitted | default_changed | inject explicit default / alert |
| M5 | Search | pagination offset → opaque cursor | pagination_changed | pagination normalizer, validated |
| M6 | Search | silently caps page size 100 → 20 | truncation | detect + adapt loop |
| M7 | Notifications | webhook payload nests `event.type` → `type` (valid JSON, same meaning) | structural+semantic | adapter |
| M8 | Payments | 429 begins at 5 rps with new `Retry-After` shape | rate_limit_changed | backoff policy update |
| M9 | MCP-tool svc | tool arg `query` → `q`, plus new required `limit` | schema+behaviour | adapter or proposal |
| M10 | Users | `status` enum value `active` now includes suspended users (meaning changed) | enum_semantics | **unknown/breaking** → quarantine, human review |

### Demo script (must be automated in `tests/e2e/demo.spec.ts`)
1. Start sim services + engine + demo-app + dashboard (`pnpm demo`).
2. Run baseline workflows → all green; model learned from traffic.
3. Toggle M1, M3, M5 via switchboard → workflows break (assert red).
4. Intra detects all three within N observations; impact lists exact workflows; adapters generated + validated; workflows green (assert).
5. Toggle M2, M10 → Intra **refuses auto-repair**, quarantines, emits proposal + evidence (assert no auto-apply).
6. Dashboard shows timeline, confidence, before/after; MCP tool `intra_recent_changes` returns the same set (assert parity).
7. Rollback test: inject a bad adapter → validator fails → auto-rollback (assert).

---

## 14. Escalation & Stuck Protocol

1. Agent fails 3× → writes to `.harness/BLOCKERS.md`: task, tried, error (≤10 lines), hypothesis.
2. Orchestrator re-plans: split task / switch approach / escalate to **Opus `architect`** for one-shot unblock.
3. Still blocked → mark task `blocked`, continue independent tasks, surface in sprint retro for the human.
4. Ambiguous product decision → record assumption in `STATE.md#assumptions`, proceed with safest default, flag in PR description.

---

## 15. Session Start / End Checklist (agents obey)

**Start:** read §0–§2 → read `STATE.md` → read own agent file → read assigned task block → go.
**End:** tests green → commit → update PLAN status → ≤2-line LEARNINGS (if any) → write handoff in STATE.md (≤10 lines) → emit output contract.

---

## 16. Open Items
- [x] Frontend: React + Vite + Tailwind + shadcn + React Bits + R3F (locked)
- [x] Core architecture: monolith engine; separate `mcpserver/` (locked)
- [x] Hosting: Vercel (web), Railway (engine + Postgres), Render (MCP) (locked)
- [x] MCP server language: Node/TS (locked)
- [x] MCP transport: Streamable HTTP on Render; auth: API key (default, revisit later)
- [ ] Demo app theme (default: "Shipwell" logistics/commerce)
- [ ] **MST JS SDK package name + BridgeKey connect docs** (owner to supply; ledger-dev codes against `WalletProvider` until then)


---

## 17. Auth, Wallet, Ledger & Startup Requirements (LOCKED v1.1)

**Auth (Firebase, strict)**
- Every route except landing/docs/status requires a valid Firebase ID token; engine rejects otherwise (401). Tenant resolved from token claims/DB, never from request body.
- Config only from env. Client: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`. Server: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. `.env*` gitignored; only `.env.example` committed; secrets live in Vercel/Railway/Render env.
- MCP server: per-tenant API keys (hashed at rest), optionally exchanged for Firebase-verified identity. Tests use the Firebase Auth emulator.

**Wallet (BridgeKey on MST only)**
- `WalletProvider` interface: `connect()`, `getAddress()`, `signMessage(msg)`, `network`. One implementation: **MstBridgeKeyProvider** using the MST SDK. Network via `MST_NETWORK=testnet|mainnet` (default testnet).
- Link flow: authenticated user requests nonce → wallet signs → engine verifies address recovery → stores `uid ↔ address` (one wallet per user in v1). Wallet is **not** used for login.
- No transactions are sent in v1. No private keys handled by our code.

**Ledger (v1, no public chain)**
- Entry = `{seq, prevHash, kind, tenant, actor{uid, walletAddress?}, payloadHash, canonicalHash, rawHash, byteLength, ts}` → `entryHash = SHA-256(canonical(entry))`, signed with the server ledger key (`LEDGER_SIGNING_KEY`, Ed25519, from secrets).
- Entry kinds: observation, change, impact, adapter_proposed, adapter_applied, validation, rollback, agent_action, wallet_linked.
- **Console logging:** each entry's hashes are logged as one structured line (`level=info event=ledger.entry seq=… entryHash=… payloadHash=…`). Never log payloads, tokens, private keys, or Firebase credentials.
- Honest scope: integrity of Intra's record, not correctness of the provider's data. Public anchoring is a post-v1 option.

**Startup-grade baseline (v1)**
Multi-tenancy (org → project) with row-level scoping tests; per-tenant rate limits and API keys; data retention + PII redaction; error tracking and structured logs; staging environment; DB backups; Terms/Privacy placeholders; pricing tiers designed but not billed.


---

## 18. Priorities & Cut Line (decided Oct 2026)

**Core (never cut):** observe, learn, detect (structural/behavioural/semantic), impact, adapter DSL, safe-handling policy, validation with rollback, demo M1-M10, calibration report.
**Added now:** walking skeleton first (Sprint 1), read-only active probes, mixed-version rollout detection, replay safety classes, consumer expectations, confidence calibration.
**Startup layer (keep, but after core):** Firebase auth, tenancy, API keys, docs site, Verify page.
**Cut first if time runs short:** wallet link (BridgeKey/MST), ledger polish, Agent chat, Status page.
**Backlog (not v1):** learning from human approve/reject decisions to tune scoring; community contract registry; public chain anchoring.
**Known limit to state in docs:** Intra can only adapt calls routed through its proxy/SDK; traffic it never sees is invisible except via probes.