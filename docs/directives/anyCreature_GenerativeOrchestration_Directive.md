# anyCreature — Generative Session Orchestration: LOW-Stage Slice

*September 2026 | Read `docs/directives/anyCreature_CreatureArtIntegration_Directive.md`
in full before this one — that phase built the reference/export plumbing
for already-generated assets. This phase is different in kind: it wires
RFDGameStudio's existing, certified `OpenRouterClient`
(`studio_mcp/zip_verify/openrouter_client.py`) into actually DRIVING
anyCreature's generative design workflow — writing a creature spec from
an order, then genuinely blind-judging the result. Narrow first slice
only: the LOW stage (design + Gate 1), one pre-specified test order, no
MID/HIGH/SHIP, no publish.*

---

> ⛔ **STOP:** Confirm the real current test suite passes (both
> RFDGameStudio suites, and the `anyCreature` fork's own
> `python harness/calibrate.py` must still print `calibrate OK`) before
> writing anything. Confirm a vision-capable model is actually available
> and live on OpenRouter right now — `deepseek/deepseek-v4-flash-0731`
> is text-only and cannot judge an image; check the live OpenRouter
> catalog for a real vision-capable model before hardcoding one. Read
> `C:\Github\anyCreature\cards\00_START.md`, `01_LOW.md`, and
> `SYNTAX.md` in full — this directive assumes you already know their
> real content, do not re-derive the workflow from this document alone.

---

## §0 Context

**What this phase is really building, precisely:** two separate OpenRouter
roles, genuinely isolated from each other, matching the card's own
requirement that gates are read by *"a fresh subagent given NOTHING but
the images"* — not a metaphor, a real architectural constraint:

1. **The designer call** — given the order, the silhouette brief, and
   `SYNTAX.md`'s engine syntax, generates a real `spec.json`. This call
   may see everything: the order, prior repair attempts, the brief.
2. **The reader call** — given ONLY a silhouette image and the bare
   question script from `01_LOW.md` §4, verbatim, with no conversation
   history, no knowledge of the order, no knowledge this is even a gate
   check. A fresh `OpenRouterClient` instance per read, not a reused
   session — reusing a session risks context bleeding between "designer"
   and "reader" roles even unintentionally.

**Why input-driven, not live-interactive:** card `01_LOW.md`'s real
interview (Temperament, Role) assumes a human answering live. This phase
runs unattended, so the order and both answers are provided as fixed
input parameters (see §2), not asked interactively. This is a real,
deliberate adaptation of the card's process, not a shortcut — name it
explicitly in the completion report, don't silently treat "input-driven"
as equivalent to "the same workflow."

**The test order, and why it's the tool's own example, not a new
creative decision:** *"make me a menacing mountain giant"* — this is
MANUAL.md's own illustrative example, not a real game's content
requirement. Using it here is the same move as using the wolf for the
prior phase's smoke test: it proves the mechanism without anyone having
to make a real creative call yet. Temperament: "scary." Role: "boss"
(loads `harness/presets/boss.json` — the only tier the tool's own README
says has a real measured cost baseline, ~4.4M tokens, useful to compare
this new generative cost against).

**What this phase delivers:**
1. `studio_mcp/creature_session/spec_writer.py` — the designer call:
   builds the prompt from order + brief + `SYNTAX.md`, calls OpenRouter,
   writes the returned spec to `spec.json`.
2. `studio_mcp/creature_session/blind_reader.py` — the reader call: takes
   a silhouette image path and the exact Gate 1 question script from
   `01_LOW.md`, makes a fresh, isolated OpenRouter call, returns the
   verbatim answer. No memory of any prior call.
3. `studio_mcp/creature_session/gate_runner.py` — orchestrates: compile
   (`engine/cli.js`) → measure (`harness/silmetrics.mjs` +
   `harness/maskmetrics.py`) → Gate 1 blind read → pass/repair/restart
   per the card's own real rules (2 repair rounds max, then iron law 3
   concept restart — implement this counter for real, don't approximate
   it).

**Explicitly NOT in scope:**
- Gate 2 (PUNCHIER), MID, HIGH, or SHIP stages. LOW + Gate 1 only.
- Any live interactive interview. Order/Temperament/Role are fixed
  inputs this phase.
- Publishing anything to Gobkit.
- Any real game's actual creature roster. This is a mechanism test with
  the tool's own example order, same category as the wolf smoke test.
- Deciding whether the generative cost (real number, this phase's actual
  finding) is acceptable for real production use. Report it; don't
  judge it.

---

## §1 Scope Statement

| Location | Repo | Status | Action |
|---|---|---|---|
| `studio_mcp/creature_session/spec_writer.py` | RFDGameStudio | New | Designer OpenRouter call |
| `studio_mcp/creature_session/blind_reader.py` | RFDGameStudio | New | Isolated reader OpenRouter call |
| `studio_mcp/creature_session/gate_runner.py` | RFDGameStudio | New | Orchestration: compile → measure → gate → repair/restart |
| `studio_mcp/creature_session/tests/*.py` | RFDGameStudio | New | Per §3, OpenRouter calls mocked in tests |

**Read-only:** `C:\Github\anyCreature\engine/`, `harness/`, `cards/` —
this phase calls these as external tools via subprocess, it does not
modify anyCreature itself. `studio_mcp/zip_verify/openrouter_client.py`
— import and reuse, do not fork or duplicate.

> ⚠️ RULE: `blind_reader.py` must construct a brand-new `OpenRouterClient`
> call with no shared state from `spec_writer.py` — verify this
> concretely, not just by code organization. A test asserting the reader
> call's request payload contains nothing from the designer call's
> prompt is required, not optional.

---

## §2 Implementation

### Fixed input parameters for this phase's one real test run

```python
ORDER = "make me a menacing mountain giant"
TEMPERAMENT = "scary"
ROLE = "boss"  # loads harness/presets/boss.json
```

### `spec_writer.py`

Builds a prompt containing: the order, temperament, role, the silhouette
brief format from `01_LOW.md` §2, and `SYNTAX.md`'s real engine syntax
reference. Calls OpenRouter, extracts the returned JSON, writes
`spec.json`. On a repair round, includes the prior round's reader
verdict and the specific engine floor or gate failure — matching the
card's own instruction that *"the verdict IS the work order."*

### `blind_reader.py`

```python
def read_gate_1(thumb24_path: str, thumb48_paths: list[str]) -> dict:
    """Fresh OpenRouterClient, no shared context. Question script is
    verbatim from cards/01_LOW.md §4 -- do not paraphrase it."""
```

> ⚠️ RULE: The question text sent to the model must be copied verbatim
> from `01_LOW.md`, not summarized or reworded. A paraphrased question
> is a different experiment than the one the card actually specifies.

### `gate_runner.py`

Real repair-round counter, real iron-law-3 enforcement:

```python
MAX_REPAIR_ROUNDS = 2

# Track failure by (view, symptom) - not just a global counter.
# "Same symptom failed twice" per the card means per-symptom, not
# per-round. Confirm this distinction is real in your implementation,
# not assumed.
```

> ⚠️ RULE: If Gate 1 genuinely cannot be passed within the 2-repair-round
> budget, report the concept-restart trigger honestly rather than
> quietly extending the round budget to force a pass. A forced pass
> defeats the entire point of this phase, which is finding out whether
> the mechanism works, not whether it can be made to look like it works.

---

## §3 Test Anchors

| Test name | Fixture | Behaviour |
|---|---|---|
| `test_blind_reader_payload_contains_no_designer_context` | Mocked spec_writer output + blind_reader call | Reader's actual request payload contains none of the designer prompt's text |
| `test_blind_reader_question_matches_card_verbatim` | Real `01_LOW.md` text | Confirms the question sent matches the card's real wording exactly |
| `test_gate_runner_tracks_repair_rounds_per_symptom` | Synthetic repeated-failure sequence | Correctly triggers concept restart on the 3rd same-symptom failure, not a global round count |
| `test_gate_runner_never_forces_a_pass` | Synthetic always-fails sequence | After the budget is exhausted, reports restart honestly, never fabricates a pass |
| `test_spec_writer_includes_prior_verdict_on_repair` | Mocked first-round failure | Second call's prompt contains the real prior verdict text |

Target: X passing, 0 failing, 0 skipped, real count. All OpenRouter calls
mocked in the test suite — no real API spend during `pytest`.

**Live demonstration required at completion:** run the real pipeline
once, for real, against the fixed test order above. Paste: the real
generated `spec.json`, the real compile output (including any `BLOCK:`/
`warn:`/`info:` lines), the real Gate 1 reader verdict verbatim, the
real pass/repair/restart outcome, and the real total token spend and
wall-clock time for the whole LOW-stage run — this is the actual new
data point, since only boss-tier cost was previously measured and this
is a different measurement (generative design cost, not compile/render
cost).

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed for both RFDGameStudio suites and
      anyCreature's own `calibrate OK`
- [ ] Real, currently-live vision-capable OpenRouter model confirmed and
      named in the report — not assumed from this document
- [ ] All three new modules implemented per §2
- [ ] Genuine isolation between designer and reader calls proven by a
      real, passing test, not just asserted
- [ ] All §3 test anchors present and passing
- [ ] Live demonstration run for real against the fixed test order,
      full real output pasted — spec, compile output, verdict, outcome,
      real cost and time
- [ ] Honest report of whichever outcome actually occurred — pass,
      repair, or concept restart — no outcome forced or fabricated
- [ ] `anyCreature`'s own files confirmed untouched — this phase treats
      it as an external tool called via subprocess only
- [ ] Final full RFDGameStudio test floor reported, real count

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Stages in scope | LOW + Gate 1 only |
| Stages explicitly deferred | Gate 2, MID, HIGH, SHIP, publish |
| Test order | The tool's own example ("menacing mountain giant"), not real game content |
| Interview mode | Input-driven, not live-interactive — a named adaptation, not a shortcut |
| Designer/reader isolation | Must be proven by a real test, not organizational convention alone |
| Real new data point this phase produces | Generative design cost (tokens + time) — previously unmeasured |
| Not this phase's job | Judging whether that cost is acceptable for production |

---

*RFD Method | anyCreature Generative Orchestration | RFDGameStudio | September 2026*
*The creative half earns less trust than the mechanical half did — this phase proves the mechanism on one fixed, low-stakes order before anyone designs anything real.*
