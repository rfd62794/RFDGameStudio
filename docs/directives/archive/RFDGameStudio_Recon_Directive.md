# RFDGameStudio — Recon Directive: Architecture Reconciliation + Example Integration Assessment

*July 2026 | Read fully before executing anything.*

---

> ⛔ **STOP: This is a read-only reconnaissance pass. No code changes, no new files
> in `games/`, `ts/src/games/`, or `engine/`, no test runs that mutate state, no
> commits.** The deliverable is a single written report. If at any point this
> directive seems to be asking you to start porting or building, stop — that's a
> scope violation of this directive, not an invitation to keep going.

---

## §0 Context

Prior planning for this port was done from summarized memory and a project-knowledge
copy of the SDD, not the live repo. A first-pass check of the live repo at
`C:\Github\RFDGameStudio` already found real discrepancies between that memory and
what's actually there — a load-bearing architectural contradiction between two
accepted ADRs, a state file whose own sections disagree with each other, and a gap
analysis document that appears fully resolved but isn't marked as such. Scoping a
port directive on top of unreconciled findings like these is how a phase goes
sideways. This directive exists to close those gaps with evidence before any
implementation directive gets written.

**What this delivers:** One written report, `docs/state/recon_report.md`, covering
every investigation task below, each answered with direct file evidence (exact
paths, exact quoted lines, exact command output) — not paraphrase, not "I checked
and it looks fine."

---

## §1 Scope Statement

| Target | Status | Action |
|---|---|---|
| `C:\Github\RFDGameStudio\**` | Read-only | Inspect only. Run `pytest`/`vitest` for status checks only if they don't require env setup beyond what's already configured — do not fix a failing test, report it. |
| `examples/scrapcrawl/` | Read-only | Inspect and compare against the real four-file contract and ADR-007/008 |
| `examples/trinity-siege/` | Read-only | Same |
| `docs/state/recon_report.md` | New | The single deliverable |

---

## §2 Investigation Tasks

### Task 1 — Resolve the ADR-005 / ADR-007 contradiction, or confirm it's unresolved

Read `docs/adr/ADR-005.md` and `docs/adr/ADR-007.md` in full. ADR-005 (Accepted,
permanent, "no shared binary, no `require()`, any change requires a new ADR that
explicitly supersedes this one") and ADR-007 (Accepted, `Supersedes: None`, builds
`engine/primitives/` and `engine/systems/` as shared Lua that games declare via
`systems.yaml`'s `engine_systems: [...]` and the executor prepends at load time)
describe contradictory rules and neither claims to supersede the other.

- Check `git log` on both ADR files — which was written first, and is there any
  commit message, PR description, or later ADR (008+) that references resolving
  this?
- Check whether `engine/systems/genetics.lua`, `odds.lua`, `market.lua` are
  literally identical across every game that declares them in `systems.yaml`, or
  whether games have already diverged from the shared engine files (which would
  suggest ADR-005's spirit survived in practice even if ADR-007's mechanism
  contradicts its letter).
- Report the contradiction plainly if it's genuinely unresolved. Do not propose a
  reconciliation on your own authority — that's a decision for a new ADR, not
  something to resolve quietly inside a recon report.

### Task 2 — Reconcile `docs/state/current.md` against itself

The Phase Roadmap table at the bottom lists "Phase 4 — Second Game — Pending," but
the completion-criteria sections above it show Phase 2v (Mutant Battle Ball) and
Phase 2w (SlimeCoin) both certified — real second and third games, already shipped.

- Confirm this discrepancy by quoting both sections directly.
- Check `git log docs/state/current.md` for when the roadmap table was last
  touched versus when the 2v/2w criteria sections were added — is the table just
  stale, or does "Phase 4" mean something more specific that hasn't happened yet
  (e.g., a *third-party* or non-AI-Studio-originated game)?

### Task 3 — Confirm `RFDGameStudio_GapAnalysis.md` is fully resolved

Cross-reference each of the six gaps (GAP-001 through GAP-006) against the Phase 2d
completion criteria in `current.md`. Report each gap as Resolved (with the specific
criterion line that resolved it) or Still Open (with evidence it wasn't actually
fixed) — don't assume the whole document is stale just because most of it is.

### Task 4 — Confirm actual `studio_mcp` deployment and tool count

`current.md`'s Phase 3 section lists 5 tools (`load_game, call, get_schema,
get_systems, run_headless`) and shows the NSSM service registration and Claude
Desktop config steps still marked Pending. Separately-held memory says 11 tools are
registered and running.

- Read `studio_mcp/tools.py` directly and count the actual registered tool
  functions.
- Run `nssm status RFDStudioMCP` (or check Windows Services) if accessible, and
  `curl http://localhost:8025/health` — report the raw output of both, not an
  interpretation.
- Report which source is correct, or if both are wrong.

### Task 5 — Assess `examples/scrapcrawl/` against the real contract

ScrapCrawl was built entirely outside this repo (Google AI Studio, plain TS, no
`data.yaml`/`logic.lua`/`ui.yaml` at all) but has an independently verified
36-then-51-then-67-test certified floor of its own, covering: room/interaction
primitives, a Scrap→Craft→Equipment economy with durability, win-only proficiency
XP, a roster/breeding system with generation tracking, and an LLM-content-sculpting
layer with schema validation and deterministic fallback.

- Map ScrapCrawl's systems against the ADR-007 primitive table: which of its
  functions are Entity/Action/Resolution/Consequence/Movement/Physics/Lifecycle,
  and which — if any — genuinely duplicate something already in `engine/systems/`
  (its breeding math is a `GeneticsSystem`/`BreedingSystem` instance; its
  growth-factor curve is a `StatSystem` instance)?
- Map ScrapCrawl's UI surface against the ADR-008 shared vocabulary — which of its
  screens could render through existing types (`stat_bar`, `action_button`,
  `card_grid`, `tab_bar`) versus which would need new game-specific types added to
  `ui.yaml` (a `roster_grid` or `breed_panel` type, analogous to horse_racing's
  `horse_card`)?
- Note: ScrapCrawl's LLM-sculpting layer (`llmContent.ts`) has no equivalent
  anywhere in the current studio. Flag this as new territory, not something to map
  onto an existing pattern.

### Task 6 — Assess `examples/trinity-siege/` the same way

Trinity Combat/Siege was named in prior memory as "unconfirmed for engine
integration" and per this session is confirmed to have never been ported — it sits
in `examples/` on the same Google-AI-Studio-export footing as ScrapCrawl, not
`games/`. Do not assume anything about its contents from its name.

- What actually exists in `examples/trinity-siege/src/`? Report the real file list
  and a one-paragraph summary of what the game is, based on reading its actual
  code — not the name.
- Same ADR-007/ADR-008 mapping exercise as Task 5.
- `engine/primitives/lifecycle.lua`'s own docstring and ADR-007's system registry
  both reference a game called "BattleBots" with a `combat.lua` system
  (`resolve_hit`, `calculate_damage`, `apply_damage`) that does not appear to exist
  in `games/`. Check whether Trinity-Siege is that referenced "BattleBots," a
  different unbuilt game, or unrelated — don't guess, check for any commit,
  comment, or doc that connects the two names.

### Task 7 — Full current directory map

Produce a real `tree`-style listing (or equivalent) of `engine/`, `games/`,
`renderers/`, `studio/`, `studio_mcp/`, `ts/src/`, and `examples/` — the actual
current state, not the directory structure block embedded in `current.md` (which
may itself be stale given Task 2's finding).

---

## §3 Required Evidence Per Finding

Every task above must be answered with at least one of: a direct file quote with
path and line number, raw command output, or a `git log`/`git blame` excerpt. A
finding stated without one of these is not acceptable — this recon exists because
summarized answers already produced two rounds of stale claims in this project.
"I reviewed X and it looks consistent" is not evidence. Quote the inconsistency or
quote the consistency, either way, verbatim.

---

## §4 Completion Criteria

- [ ] `docs/state/recon_report.md` created, one section per task above, each with
      cited evidence per §3
- [ ] The ADR-005/007 contradiction is either resolved with a specific cited reason
      or explicitly reported as unresolved — no third option
- [ ] Every one of the six GapAnalysis items has an explicit Resolved/Open verdict
      with a citation
- [ ] `studio_mcp` tool count and deployment status confirmed against raw output,
      not against either prior claim
- [ ] Both `examples/scrapcrawl/` and `examples/trinity-siege/` have a completed
      ADR-007 + ADR-008 mapping table
- [ ] Zero files outside `docs/state/recon_report.md` created or modified — confirm
      via `git status` in the final report, raw output pasted
- [ ] Report ends with a short, explicit "Open Decisions" list — anything found
      that needs Robert's or Claude's call rather than Devin's, named plainly, not
      buried in prose

---

## §5 Quick Reference

| Item | Note |
|---|---|
| Deliverable | One file: `docs/state/recon_report.md` |
| Code changes permitted | None |
| Test runs permitted | Status checks only, no fixes |
| Evidence standard | File path + line, or raw command output — no paraphrase |
| Known contradiction to resolve or flag | ADR-005 vs ADR-007 |
| Known stale docs to verify, not trust | `current.md` roadmap table, `RFDGameStudio_GapAnalysis.md` |
| Known unverified claim | `studio_mcp` tool count (5 per repo, 11 per prior memory) |

---

*RFDGameStudio Recon Directive*
*RFD IT Services Ltd. | July 2026*
*Find out what's actually true before deciding what to build on top of it.*
