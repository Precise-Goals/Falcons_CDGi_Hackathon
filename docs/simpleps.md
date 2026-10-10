# SimplePS.md: Intra explained simply

For anyone new to the project. No jargon without a plain explanation. Read top to bottom once, then use the glossary (§10) when you get stuck.

> **Mentor question this version answers:** *"Can it predict, not just react?"* See **§7**.

---

## 1. The problem in one story

You run a food-delivery app. It depends on other companies' services:
- a **payments** service (charges cards)
- a **users** service (names, emails)
- a **search** service (finds restaurants)

These are called **APIs**: a way for your app to ask another company's software a question and get an answer.

One night a company changes its answer *without telling anyone*:

| Before | After | What breaks |
|---|---|---|
| `{"name": "Ada"}` | `{"display_name": "Ada"}` | Your app looks for `name`, finds nothing, shows blank users |
| `amount: 12.50` (dollars) | `amount: 1250` (cents) | You charge customers 100× too much |
| `"Ada Lovelace"` | `"Lovelace, Ada"` | Emails say "Hello Lovelace, Ada" |
| Search returns 100 results | Search returns 20 | Customers see fewer restaurants, nobody notices |

Your app doesn't crash. It keeps running and quietly does the wrong thing. That is the problem: **software can't survive changes in systems it doesn't control.**

---

## 2. What we must build (the challenge)

A system that does these things in order:

```
 1. WATCH      what other services really do
 2. LEARN      what "normal" looks like
 3. NOTICE     when something changes
 4. FIND       which parts of my app are affected
 5. FIX        automatically, or propose a safe fix
 6. CHECK      that the fix really works
```

Two rules make this hard:
1. **Don't trust documentation alone.** Companies change things without updating docs. We learn from what actually happens.
2. **Catch "valid but different" data.** The data still looks fine to a computer (valid JSON), but its meaning changed (dollars → cents).

And at the end we need a **demo**: a fake app with fake services, we secretly change the fake services, and the audience watches us catch it, explain it, fix it, and prove it works.

---

## 3. What the research paper says (SAGAI-MID)

You pasted the abstract of a paper about **SAGAI-MID**. Here it is in plain words.

**The paper's problem:** Different systems speak different "data languages" (different field names, versions, formats). The old way is a person writing a translator (an **adapter**) for every pair of systems. That's slow, and it can't handle new pairs that appear later.

**The paper's idea:** Put a **middleman (middleware)** in between that uses an **AI language model (LLM)** to notice the mismatch and translate at the moment it happens.

**How their middleman works (five layers, simplified):**
1. **Detect** mismatches using two things together: a plain structural comparison ("this field is missing") plus the AI reading the meaning ("this field probably means the same thing as that one").
2. **Resolve** in one of two ways:
   - **DIRECT:** ask the AI to translate every single message, every time.
   - **CODEGEN:** ask the AI to write a small piece of translator code *once*, then reuse it.
3. **Safeguards** (three levels), because AI can be wrong:
   - *Validate* the result.
   - *Ensemble voting*: ask several times or several models and go with the majority.
   - *Rule-based fallback*: if the AI can't be trusted, use plain fixed rules.

**Their results (10 test scenarios, 6 different AI models):**

| Finding | What it means |
|---|---|
| Best setup got 0.90 "pass@1" | The first answer was right 9 times out of 10 |
| CODEGEN beat DIRECT (0.83 vs 0.77) | Writing reusable translator code was more accurate than translating every message |
| Cost varied over 30× between models | Some models cost 30 times more than others |
| More cost did not mean more accuracy; the most accurate model was also the cheapest | Don't assume the expensive AI is better; measure |

**Honest caution:** 10 scenarios is a small test. Treat these numbers as "promising", not "proven for everything". Also, this is only the abstract; we haven't read the full paper's details.

---

## 4. What the paper means for us

| Lesson from the paper | What we do with it |
|---|---|
| AI makes mistakes (about 1 in 10 even in the best case) | We never let AI have the final say. Our **validator** (replay + checks) decides. Low confidence → ask a human |
| Safeguards matter: validate, vote, fall back | Same idea in our **safe-handling policy**: validate every fix, roll back on failure, quarantine when unsure |
| Reusable generated code beats translating every message | Our fixes are **adapters created once and reused**, not an AI call per request. Cheaper, faster, easier to test |
| Hybrid detection (structure + meaning) | Our **Detect** step uses plain statistics first and meaning-checks second |
| Cost differs hugely, price ≠ quality | We use AI **sparingly** and only as a *helper that suggests*. We measure cost vs accuracy before choosing a model |
| Bass et al.: interoperability ideas used at design time can become runtime features | Our whole product is that idea: reacting to change **while the app runs** |

---

## 5. How our project is different from the paper (and why it's valuable)

The paper (from its abstract) mostly solves: **"I know two schemas, translate between them."**

Our challenge is bigger: **"A service I don't control silently changed, and I never got told."**

| Question | Paper (per abstract) | Intra (our plan) |
|---|---|---|
| Do we know what changed? | Given the mismatch | We **discover** it by watching real traffic |
| Do we learn real behaviour (defaults, paging, rate limits, errors)? | Focus is on data shape/meaning | Yes, behaviour too, not only shape |
| Do we find *which parts of the app* are affected? | Not mentioned | Yes, **impact analysis** (workflow → call → field) |
| Do we prove the fix works? | Validation safeguard | **Replay** real workflows + rollback |
| When unsure | Fallback rules | `unknown` verdict, quarantine, human proposal |
| Dependence on AI | Central | **Optional helper**; deterministic checks decide |

In short: the paper is a good reference for *fixing a mismatch*. We build the *whole loop around it*: watch → notice → locate → fix → prove.

---

## 6. Our solution, step by step

Use the `name` → `display_name` example.

1. **Watch.** Your app's calls to the Users service pass through Intra. Intra records them (with private data removed).
2. **Learn.** After enough calls Intra knows: "`name` is always text like 'Ada Lovelace', never empty."
3. **Notice.** One day `name` vanishes and `display_name` appears, with values that look exactly like the old `name`. Intra thinks: "same thing, new label", with a **confidence score** (say 0.93).
4. **Find the damage.** Intra checks your app's code and activity: "Checkout, profile page, and email sender all read `name`."
5. **Fix.** Confidence is high and meaning looks preserved, so Intra creates a tiny translator: "when you see `display_name`, treat it as `name`."
6. **Check.** Intra replays recorded real workflows through the translator. Names show correctly again → keep the fix. If anything fails → undo it automatically.

**Now the careful case:** names change from "Ada Lovelace" to "Lovelace, Ada".
- Intra sees the format changed and the meaning may only partly survive.
- It does **not** quietly "fix" it. It pauses the risky workflows, shows evidence, and proposes a change for a human to approve.

This "I'm not sure, so I'll stop" behaviour is a core feature.

### The decision table (the safety brain)

| Confidence | What Intra does |
|---|---|
| 90% or more, meaning preserved | Fix automatically, then verify |
| 70-90% | Prepare a fix and open a request for a human; test in shadow only |
| Below 70% or "unknown" | Do **not** fix; pause affected workflows; show evidence |
| Truly breaking, no mapping | Cut off that dependency, use a saved fallback if available, propose a migration |

---

## 7. Can Intra predict changes? (the mentor's question)

**What the mentor is asking:** it's good to *notice* a change after it happens, but can Intra **see it coming** and be ready, including predicting what the simulated services will do?

**Honest answer:** partly, and that's still very valuable.
- Intra **cannot** know that a company will secretly flip a switch at 3 a.m. with zero warning. No system can.
- But most changes leave **footprints before they are complete**, and we can **practice for likely changes** in advance.

So we move from *"react after it breaks"* to *"warn early, rehearse, and pre-build the fix."* Three levels:

### Level 1: Early warning (leading signals)

Real services rarely change for everyone at once. They roll out slowly, send hints, and get shaky first. Intra watches for these **leading signals**:

| Signal | Plain meaning | Example |
|---|---|---|
| **Gradual rollout** (strongest) | The new response shape shows up in a few replies, then more | `display_name` appears in 3% → 12% → 40% of replies |
| Deprecation / Sunset hints | Standard HTTP headers where a service says "this will be retired on a date" (only when the service sends them) | `Sunset: <date>` on `/v1/users` |
| New or changed headers | A new API-version or rate-limit header appears | New `X-Api-Version` value |
| Early stress signs | Errors or slowness creep up on one endpoint | Rising 4xx on one parameter |
| Provider hints | Changelog, status page, or published spec changed (treated as a hint, never as truth) | OpenAPI file updated |
| Change history | How often and how this provider usually changes | "This provider renames fields about twice a year" |

Intra combines them into a **forecast** (a probability with a time estimate, plus the evidence):

```
FORECAST  Users service, GET /users
  Likely change:  `name` replaced by `display_name`   (rename)
  Probability:    82%        Expected full cutover: in ~2 hours
  Evidence:       new shape in 38% of replies, rising ~9% per 10 min; matches old `name` values
  Affected:       checkout, profile page, email sender
  Status:         adapter pre-staged (shadow mode)
```

**How the simple version works:** track the *share of replies using the new shape* over time, fit a straight trend, and project when it reaches 100%. Extra signals nudge the probability up or down. We check that "82%" really comes true about 82% of the time (calibration).

### Level 2: Practice drills ("what if?" simulation)

Before anything changes, Intra can run **fire drills** on your app using the same switchboard we use for the demo. For every field your app reads, it imagines:

- the field is removed or renamed
- the value becomes `null`
- numbers get multiplied by 100 (dollars → cents)
- text format flips ("Ada Lovelace" → "Lovelace, Ada")
- results are capped at 20 per page
- the service starts answering `429 Too Many Requests`

Then it runs your workflows against each imagined change and produces a **resilience scorecard**:

| Dependency | Drill | Workflows that break | Fix ready? |
|---|---|---|---|
| Users `name` | renamed | checkout, email | Yes (adapter) |
| Payments `amount` | ×100 | checkout | Yes (scale) |
| Search page size | capped | search-browse | No → needs work |

This **predicts the impact of future changes** and shows the most fragile spots *today*, even if the provider never changes anything.

### Level 3: Pre-staged fixes

For changes the forecast says are likely, Intra **prepares the adapter in advance** and tests it quietly in **shadow mode** (running beside real traffic without affecting it). When the change lands, switching it on takes seconds instead of hours.

**Safety does not change:** "prepared" is not "applied". A pre-staged fix still has to pass the confidence rules and validation, and uncertain cases still go to a human.

### What Intra will *not* predict (and says so)

- Instant changes with no warning and no gradual rollout (these are detected quickly, not predicted).
- Completely new kinds of meaning changes. They get an `unknown` forecast and a human review, not a confident guess.

### How the demo shows prediction

Our fake services are controlled by us, so we know the **true schedule** and can score Intra's predictions exactly.

1. The switchboard gets a **rollout mode**: the new shape ramps from 0% to 100% over a few minutes. Some services also send a `Sunset` hint.
2. At about 10-15% the dashboard shows a **Forecast card** (probability, ETA, affected workflows) and starts **pre-staging** the adapter.
3. At 100% cutover the app stays **green with zero failed workflows**.
4. Side-by-side: *"Without prediction: N failed requests during cutover."* vs *"With prediction: 0."*
5. A **fire-drill run** shows the scorecard before any change is injected.

### How we know prediction works

| Question | Target |
|---|---|
| How early do we warn before full cutover? | Lead time of at least a few minutes in the demo (and measured, not assumed) |
| Of the forecasts we raise, how many come true? | At least 80% |
| Of the ramped changes, how many did we forecast? | At least 90% |
| Is the stated probability honest? | Within 10 points of reality |
| Is the time estimate close? | Within about 30% of the real cutover time |
| Failed requests during a predicted cutover | 0 (compared with the measured baseline without prediction) |
| Unsafe auto-fixes | Still **zero** |

These are targets to test against, not results.

### Where it fits in the build

| Piece | What | When |
|---|---|---|
| Simulator rollout mode + `Sunset` hint | Ramp new shape over time | Sprint 1 (small) |
| `packages/forecast` | Signal collectors, trend model, probability + ETA | Sprint 3 |
| Fire drills | Reuse switchboard to test imagined changes → scorecard | Sprint 4 |
| Pre-staging | Build and shadow-test adapters for likely changes | Sprint 5 |
| Dashboard **Forecast** tab | Forecast cards and resilience scorecard | Sprints 3-5 |

**Priority:** Level 1 is needed for the demo, Level 2 is a strong add-on, Level 3 comes last. If time is short, Level 3 is cut first.

> Harness.md and PS.md now contain these tasks (new agent `forecast-dev`, demo case M11, forecast metrics).

---

## 8. What gets built (so you know where things live)

| Part | Plain explanation | Where |
|---|---|---|
| Observer | Records what services really send and receive | `packages/observer` |
| Model | Remembers what "normal" looks like | `packages/model` |
| Differ | Notices and classifies changes | `packages/differ` |
| Impact | Finds which workflows depend on what | `packages/impact` |
| Adapter | Creates small safe translators | `packages/adapter` |
| Validator | Replays workflows to prove fixes work | `packages/validator` |
| Simulated services | Fake services we can secretly change for the demo | `packages/sim-services` |
| Demo app (Shipwell) | The fake app that depends on them | `apps/demo-app` |
| Website | Home, Agent, Docs, Dashboard | `apps/web` |
| MCP server | Lets customers' AI tools ask Intra questions | `mcpserver/` |
| Forecaster | Warns early and rehearses likely changes | `packages/forecast` |
| Ledger | A tamper-evident diary of what Intra saw and did | `packages/ledger` |

**Build order:** first one tiny end-to-end slice (the rename case works from start to finish), then make each part stronger. That way we always have something working.

**Extras for a real product:** Firebase login, multiple customers per account, wallet link (BridgeKey on MST), docs site. These matter for a startup but are not what solves the core challenge, so they come after the core and get cut first if time is short.

---

## 9. How we'll know it works

| Question | Target |
|---|---|
| Do we catch the changes we inject? | At least 95% |
| Do we avoid false alarms on harmless changes? | At least 90% precision |
| Does Intra ever apply an unsafe fix? | **Never** (zero) |
| Do fixes work when replayed? | All auto-applied fixes pass |
| Does a bad fix get undone? | Always |
| When Intra says "90% sure", is it right about 90% of the time? | Within 10 points |
| Do early warnings come true, and early enough? | At least 80% precision; lead time measured (see §7) |

**Demo script (short):**
0. A fire drill shows which workflows would break under imagined changes.
1. App works normally.
2. We secretly change three services (rename, dollars→cents, paging style). The app breaks.
3. Intra detects all three, lists the affected workflows, creates fixes, proves them, and the app works again.
4. We change two tricky things (name format, enum meaning). Intra **refuses** to auto-fix and asks for a human.
5. A gradual rollout starts: Intra **forecasts** it, pre-stages the fix, and the app stays green at cutover.
6. We try a deliberately bad fix. Intra catches it and rolls back.

---

## 10. Glossary

| Word | Meaning |
|---|---|
| API | A way for one program to ask another a question over the internet |
| Schema | The shape of data (which fields exist, what type each is) |
| JSON | The common text format APIs use to send data |
| Drift | When a service changes behaviour over time |
| Semantic change | The words/format look valid but the *meaning* changed |
| Adapter | A small translator between old and new behaviour |
| Middleware | Software that sits in the middle between two systems |
| LLM | An AI language model, like the one you're talking to |
| Confidence | A number from 0 to 1 for how sure Intra is |
| Validation | Testing that a fix really works |
| Replay | Re-running recorded real requests to test a fix |
| Rollback | Automatically undoing a change that caused problems |
| Quarantine | Pausing the risky part of the app until a human looks |
| MCP | A standard way for AI tools to call outside tools and data |
| Ledger | An append-only log where each entry is linked to the previous one so tampering shows |
| Leading signal | An early hint that a change is coming (e.g. new shape in 5% of replies) |
| Forecast | Intra's predicted change with a probability and a time estimate |
| Lead time | How long before the full change Intra warned us |
| Gradual (canary) rollout | A provider switches users to the new behaviour a little at a time |
| Fire drill | Testing your app against imagined changes before they happen |
| Pre-staged adapter | A fix prepared and shadow-tested in advance, not yet applied |
| Shadow mode | Running something beside real traffic without affecting it |
| pass@1 | In the paper: the share of times the AI's *first* answer was correct |

---

## 11. Quick self-check

If you can answer these, you understand the project:

1. Why is "dollars → cents" more dangerous than "a field disappears"?
2. Why does Intra learn from real traffic instead of reading docs?
3. In the paper, why does CODEGEN beat DIRECT, and how do we use that idea?
4. What does Intra do when it is only 60% sure?
5. Why is the AI only a *helper* in our design and not the judge?
6. What's the difference between the paper's problem and ours?

7. Can Intra predict a change that has no warning at all? What does it do instead?
8. What is a "fire drill" and what does it predict?

**Answers in one line each:** (1) the data still looks valid, so nothing alerts, but money is wrong; (2) docs lag behind reality; (3) reusable code is cheaper, faster and testable, and we create adapters once and reuse them; (4) nothing is auto-fixed; risky workflows pause and a human gets evidence and a proposal; (5) AI can be wrong about 1 time in 10, so deterministic validation has the final say; (6) the paper fixes a known mismatch, ours discovers unknown silent changes and proves the fix; (7) no, it detects it quickly and falls back to the reactive path with validation and rollback; (8) testing your app against imagined changes (rename, ×100, null, capped pages, 429s) to show which workflows would break and whether a fix is ready.

---

## 12. Where to read more

- `PS.md`: the full technical problem statement, research and approach.
- `Harness.md`: how the autonomous build is organized (sprints, agents).
- Paper: SAGAI-MID, arXiv 2603.28731 (we have only read the abstract so far).