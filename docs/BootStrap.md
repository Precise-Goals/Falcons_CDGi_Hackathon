# BOOTSTRAP_PROMPT.md

Paste everything below the line into Claude Code (opus, plan mode OFF) from the root of a fresh clone of
`https://github.com/Precise-Goals/Intra.git` with `HARNESS.md` already placed at the root.

---

You are the **orchestrator** and **architect** for the Intra project. `HARNESS.md` at the repo root is the single source of truth. Read it fully once now, then execute the steps below. Be token-efficient: no recaps, no echoing file contents back, minimal tool output.

## Step 1: Lock the stack
Read `.harness/STACK.md` if it exists. If not, create it from HARNESS.md §3 defaults, applying these user answers: the contents of STACK.md in this repo root (already locked; MCP server is Node/TS). Mark each choice `LOCKED`.

## Step 2: Generate the harness files (write each once, concise, no filler)

Create exactly these files. Keep every file as short as possible while still being unambiguous.

**Root**
- `CLAUDE.md`: ≤15 lines. "Read HARNESS.md §0-§2 first. Stack in .harness/STACK.md. Current task in .harness/STATE.md. Obey ownership paths. Output contract per HARNESS.md §5."
- `AGENTS.md`: same content for non-Claude agents.
- `.coderabbit.yaml`: assertive profile, auto_review on, path_instructions for `packages/differ`, `packages/adapter`, `packages/validator` ("flag any auto-apply path lacking a confidence gate or rollback"), and `packages/observer` ("flag PII leakage and SSRF").
- `.gitignore`, `.env.example` containing every variable in STACK.md "Env contract" with empty values (Firebase, ledger key, MST network; no real secrets).

**`.claude/agents/`**: one file per agent in HARNESS.md §5 (orchestrator, architect, observer-dev, model-dev, differ-dev, impact-dev, adapter-dev, validator-dev, sim-dev, web-dev, mcp-dev, ledger-dev, auth-dev, forecast-dev, qa-engineer, reviewer, devops, scribe). Each file uses YAML frontmatter (`name`, `description`, `tools`, `model`) followed by ≤25 lines containing: role, **owned paths (write)**, read-only paths, workflow steps, quality bar, and the 5-line output contract. `qa-engineer` and `reviewer` must be explicitly forbidden from editing `src`. Use Haiku for scribe/devops, Opus for orchestrator/architect/reviewer, Sonnet for the rest.

**`.claude/commands/`**: slash commands (≤15 lines each):
- `gsd-plan.md`: read STATE, expand the current sprint from HARNESS §11 into task blocks in `.harness/PLAN.md` using the §6.3 schema, compute waves.
- `gsd-exec.md`: dispatch the current wave in parallel (width ≤5), each in its own `git worktree`, then barrier-merge into `sprint/<n>`.
- `gsd-verify.md`: run gates G1-G9 in order, delegating G5 to `qa-engineer`, G7 to `reviewer`; return compact results.
- `ralph.md`: run `.harness/loop.sh`.
- `ship.md`: execute the §9.3 autonomous ship flow via `gh`.

**`.claude/settings.json`**: permission allow-list (git, gh, pnpm, rg, node, vitest, playwright, coderabbit), deny-list (`git push --force*`, `rm -rf /*`, `.env*` reads), PostToolUse hook that runs `pnpm -w typecheck` only on `*.ts` edits (quiet mode).

**`.harness/`**
- `STATE.md`: current sprint, wave, task pointer, parallel width, assumptions, handoff (≤10 lines).
- `PLAN.md`: Sprint 0 fully expanded as task blocks (§6.3 schema). Sprints 1-6 as one-line placeholders to be expanded just-in-time (token saving).
- `SPRINTS.md`: board mirroring HARNESS §11 with checkboxes and exit criteria.
- `LEARNINGS.md`: empty template with the 60-line cap note.
- `BLOCKERS.md`: empty template.
- `PROMPT_LOOP.md`: the Ralph per-iteration prompt. Static prefix first. It must instruct: load HARNESS §0-§2 + STATE + LEARNINGS; pick the first todo task with satisfied deps; delegate to the owning subagent; run gates; commit atomically; update PLAN/STATE; emit `<promise>SPRINT_COMPLETE</promise>` or `<promise>ALL_COMPLETE</promise>` only when verifiably true; end the session.
- `loop.sh`: from HARNESS §7.2, made executable.

**`.github/`**
- `workflows/ci.yml` per §9.2 (pnpm cache, Turbo, path filters, jobs: verify, integration, e2e, security, deploy-on-main).
- `workflows/release.yml`: tag-triggered build + release notes.
- `pull_request_template.md`: what / why / tests / risk / confidence / rollback.

**`.harness/DESIGN.md`**: copy from DESIGN.md at repo root (Washi & Crimson tokens). `web-dev` agent file must say: read DESIGN.md before any UI task.

**`docs/adr/ADR-001-pipeline-and-data-model.md`**: short ADR: pipeline, `Observation`/`Contract`/`Change`/`Impact`/`Adapter`/`ValidationResult` types, safe-handling policy §10, rationale.

## Step 3: Scaffold only what Sprint 0 needs
Monorepo skeleton (Vite+React+Tailwind+shadcn init in `apps/web` with theme tokens, Fastify stub in `apps/engine`, `mcpserver/` Node/TS package with MCP SDK stub, `/healthz` route and README, pnpm workspaces, turbo.json, tsconfig.base.json, ESLint, Prettier, Vitest config, empty package stubs with a passing placeholder test each) and `packages/shared` type definitions from HARNESS §12.1. Nothing beyond Sprint 0.

## Step 4: Verify and ship
1. Run G1-G4 (typecheck, lint, unit, coverage) quietly; fix until green (max 3 attempts per failure).
2. Dispatch `qa-engineer` to confirm gates and review the scaffold; dispatch `reviewer` for a read-only check of agent files against HARNESS ownership rules.
3. `git checkout -b sprint/0`, commit atomically by concern (conventional commits), push to `origin`, open a PR with `gh pr create` using the template, watch checks, and apply the §9.3 auto-merge rules.
4. Write the handoff to `.harness/STATE.md`.

## Rules for this run
- Do not implement product features beyond Sprint 0.
- Do not read files you just wrote. Do not print file contents in your replies.
- Parallelize independent file generation using subagents (devops: `.github/**`, scribe: root pointers + docs, architect: ADR + shared types).
- Final reply: ≤10 lines in the output-contract format, followed by the exact command to start Sprint 1: `/ralph`.
- If any decision is ambiguous, pick the safest default, record it under `STATE.md#assumptions`, and continue.

Begin.
