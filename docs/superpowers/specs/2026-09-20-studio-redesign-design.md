# Studio redesign — pipeline, catalogue, and the engine question

- **Date:** 2026-09-20
- **Scope:** the studio and its build/publish pipeline. Not the public arcade site's
  design, not a rewrite of any game.
- **Builds on:** `docs/superpowers/specs/2026-09-20-shared-code-and-genre-inventory.md`
  (the inventory). Its counts are treated as verified and are not re-derived here.
  This doc answers the question the inventory raised but didn't chase: *why* do the
  three catalogues disagree, and what replaces hand-maintained tracking.
- **Method:** read the inventory, `AGENTS.md`, `AGENT_CONTRACT.md`, `ROADMAP.md`,
  `GENRE_TRACKER.md`, `README.md`, all 14 ADRs referenced from them, `docs/state/
  StatusBoard.md`, the layout of `engine/`, `ts/src/engine/`, `ts/src/games/`,
  `games/`, `studio_mcp/`, `bible/`, `intake/`, `examples/`; and, in the sibling
  repo, `RFD_IT_Services_Site/data/arcade.json` and
  `RFD_IT_Services_Site/scripts/site/{game_board.py,sync_arcade.py}`. Every claim
  below traces to a file read during this pass, not to the inventory's prose.

---

## 1. The pipeline as it actually is

The inventory found three disagreeing catalogues. Reading the actual pipeline code
(not just the docs) shows the disagreement is not caused by an absence of
derivation — one side of the pipeline already derives correctly. The cause is a
single unguarded gate, plus a second pipeline that throws its own reasoning away.

**The real flow, traced through code:**

```
intake/{slug}/*.zip           studio_mcp/intake.py          -- Stage 1, automated, works
        v
examples/{slug}/               studio_promote_to_examples()  -- Stage 2, automated, works
        v
ts/src/games/{id}/             manual conversion             -- Stage 4, deliberately manual (ADR-012)
        v
ts/src/games/registry.ts       GAME_REGISTRY array            <-- GATE 1, no forcing function
        v
ts/src/games/arcade-manifest.json   export-arcade-manifest.ts
        v
RFD_IT_Services_Site/scripts/site/sync_arcade.py               <-- GATE 2, real derivation
        v
RFD_IT_Services_Site/data/arcade.json                          -- what the public site renders
```

**`sync_arcade.py` already does what the inventory's Step 1 proposes, for the
publish side.** It reads `arcade-manifest.json` (itself generated from
`registry.ts`), cross-references `data/arcade_health.json` (build health),
`data/devlog_posts.json`, per-game writeup files, and cover images, and computes
`section`, `badge`, `stack`, `predecessors`/`successor` lineage, and whether a
game is listed at all. A game is excluded — silently, from the public JSON's point
of view — by one line: `play_target()` returns `None` when there's no healthy
build (`data/arcade_health.json` has no passing entry for that game's folder). The
function *does* record why: it appends a string to a `warnings` list. `sync()`
prints that list to stdout and then discards it. Nothing durable ever holds the
reason a game didn't make it into `arcade.json`. That is the actual mechanism of
loss on the publish side — not "nobody derives," but "the derivation's reasoning
has a lifetime of one terminal scroll."

**Gate 1 (`registry.ts`) has no check at all.** Nothing verifies that every
directory in `ts/src/games/` with a `config.ts` is present in the
`GAME_REGISTRY` array. Proof this isn't hypothetical:

- `ts/src/games/brewfield/config.ts` exists, is complete (`status: 'stable'`,
  a real `App.tsx` component, `color`, `description`), and per `AGENTS.md`'s
  build-command table has its own standalone build script
  (`npm run build:brewfield`). It is imported **nowhere** in `registry.ts` and
  has **zero** occurrences in `arcade-manifest.json` (checked directly). It is
  invisible to `sync_arcade.py`, to the site, and to the inventory's own
  `ts/src/games/` directory count logic unless someone diffs the registry array
  against the filesystem by hand — which is exactly what this pass did.
- That makes **nine** unpublished source games, not eight. `early_learning_buddy`
  (never registered, confirmed deliberate — `GENRE_TRACKER.md` row 21: "Personal
  project, not public") and seven `status: 'tool'`/`'external'` registry entries
  with no healthy build in `arcade_health.json` (`dissonance_prototype`,
  `factory_idle`, `filipino_bpo_simulator`, `planetforge`, plus the three
  deliberately-tool-excluded `character_viewer`/`technique_showcase`/
  `role_symbol_viewer`) account for the inventory's eight. `brewfield` is a
  ninth, and it's the most complete of all nine — the gate failed on the one
  game that was actually finished.

**A live, unresolved contradiction that predates and explains the Brewfield
gap:** `docs/state/StatusBoard.md` §4 ("Retired") states *"BrewField | Retired |
Dissonance Depths | Source preserved read-only... | 2026-08-15"*. One day later,
`GENRE_TRACKER.md` (dated Aug 16, row 3) lists Brewfield as **STABLE**,
itch-ready but not yet published, with no mention of retirement. `ts/src/games/
brewfield/config.ts` still carries `status: 'stable'` today. No
`docs/state/brewfield/current.md` exists to break the tie — and `AGENTS.md`
states explicitly that when the Status Board and a project's own state file
disagree, *the project file wins*, but there is no project file here, only two
studio-wide rollups that disagree with each other. **This is a named gap, not a
guess**: I could not determine from the repo which claim is current. It should
go to Robert as a direct question, not be inferred.

**`GENRE_TRACKER.md` is a second, independent hand-maintained catalogue**
duplicating facts `arcade-manifest.json` already has mechanically (Renderer,
Status) alongside real judgment the manifest doesn't have (genre gap analysis,
itch-publish checklist). Nothing keeps the two in sync, which is why it went
stale in about five weeks (Aug 16 → Sep 20, now over a month).

**Root cause, stated plainly:** the studio already built one correct derivation
pipeline (registry → manifest → `sync_arcade.py` → `arcade.json`), but (a) its
single entry gate is unchecked, so a finished game can fall out of the whole
pipeline without an error anywhere, and (b) its own exclusion reasoning is
printed, not persisted. The three-way catalogue disagreement the inventory
found is the visible symptom of both.

---

## 2. One derived catalogue — concrete proposal

`RFD_IT_Services_Site/scripts/site/game_board.py` is the right model, and its
split is exactly the one to copy: **derive everything derivable; a human
maintains only judgement**, in a small YAML file read alongside the derived
data (`game_board.py` does this with `data/game-notes.yaml`).

Build this *inside RFDGameStudio*, not on the site side, because the site's
pipeline only ever sees what already crossed Gate 1. A catalogue that starts
from `RFD_IT_Services_Site/data/arcade.json` would just be a fourth thing that
agrees with the third and still miss Brewfield.

**Proposed location:** `studio_mcp/pipeline_audit/game_inventory.py`, alongside
the existing `floor_claim_diff.py`/`commit_claim_audit.py`/`flaky_isolator.py` —
this package already exists specifically to produce real, gathered evidence
instead of asserted status (`AGENT_CONTRACT.md`), which is exactly this job.

| Field | Derivable from | Method |
|---|---|---|
| Source present | `ts/src/games/*/config.ts` glob | filesystem |
| Registered | `ts/src/games/registry.ts` `GAME_REGISTRY` array | static parse or import |
| **Registered-but-orphaned** (the Brewfield case) | source-present ∖ registered | set difference — this check does not exist anywhere today |
| Exported to manifest | `ts/src/games/arcade-manifest.json` | filesystem/JSON |
| Published | cross-repo read of `RFD_IT_Services_Site/data/arcade.json` slugs | JSON, read-only |
| **Why not published** | `sync_arcade.py`'s `build()` return value, currently discarded | capture instead of discard — see §4 Step 1b |
| Renderer / stack | static import scan of each game's `App.tsx`/`config.ts` for `ts/src/engine/shared/*`, `artGen`, `paperDoll` imports; `Lua/Python` if backed by `games/{id}/logic.lua` | grep/AST over source, not a hand field |
| Engine modules imported | same scan, listing which `ts/src/engine/shared/` or `engine/systems/` modules appear in imports | same |
| Last touched | file mtime or `git log -1 --format=%ad -- <dir>` | git |
| Genre, mechanic tags, orphan reason/intent | **not derivable** | new `docs/state/game-notes.yaml`, keyed by `gameId`, hand-written, same shape as the site's `game-notes.yaml` |

**This also fills `stack` at the source of the problem, not downstream of it.**
`ts/src/engine/types.ts` line 143 defines `stack?: string[]` as a plain optional
hand-entry field on `GameConfig` — it is empty for all 27 published games not
because derivation failed, but because **nothing has ever computed it**; it was
built as a manual field and no author has filled it in. The fix is not "remind
authors to fill in stack" (that's the same hand-maintenance failure mode that
produced the stale `GENRE_TRACKER.md`) — it's compute it from the same import
scan above and treat the hand field on `GameConfig` as an override for the rare
case (Rust/Bevy for VoidDrift, Firebase for House of Kings Collab) the scan
can't see.

**This replaces `GENRE_TRACKER.md`'s Game Registry table and Itch Publishing
table** (both fully derivable) but **keeps** its Genre Coverage Map and Gap
Analysis sections, now fed by `game-notes.yaml`'s genre field instead of a
hand-maintained markdown table that nobody re-derives from source.

**This closes the inventory's Step 2 (the orphan question) as a side effect**,
permanently rather than once: the tool's output *is* the current list of
unexplained directories, on every run, instead of a document (this one, or the
inventory itself) that will go stale exactly as `GENRE_TRACKER.md` did.

---

## 3. The engine question

Three honest options, as the inventory framed them: port Lua systems to TS and
retire Lua; keep Lua as design reference with TS as implementation; or
knowingly maintain both.

**Recommendation: port the four `engine/systems/` modules to
`ts/src/engine/shared/` and retire Lua as a second *production* target** —
not delete it, per the studio's own established retirement pattern (preserve
source read-only; `StatusBoard.md` §4 already does this for CorpWorld,
KingMaker Squads, and SlimeBreeder).

**One-sentence justification:** TS-native is already the studio's declared and
de facto default (ADR-010, ADR-013, `AGENTS.md`: *"TS-native is the default for
TS-origin games"*) and even Shoal — one of Lua's own two named consumers —
already moved its live production path off Lua (`ROADMAP.md`: *"the TS-native
migration (151.7x speedup) has closed this gap in production"*, listed under
Completed Threads), so `engine/systems/` is a four-file, already-pure,
already-tested body of logic serving a shrinking-to-zero production audience
in its native language, while the same four systems are what four *current* TS
games are separately reimplementing.

**Evidence against the other two options, from the actual files:**

- *Keep Lua as design reference, TS as implementation* undersells what's
  actually in `engine/systems/`. `genetics.lua`'s `breed_stat()` implements a
  specific, tested inheritance model — parent average, mutation via sum of
  three uniform randoms (~normal, ±15), a +2.0 generational boost, clamped to
  [10,100] — and `market.lua`/`odds.lua` implement a real overround-based
  odds calculation and payout settlement. This is working, exercised code
  (pytest markers `shoal`, `brewfield`, etc. run against it), not a sketch.
  Treating it as "reference prose" to be redesigned from scratch in TS would
  discard real, correct math and pay to re-derive it.
- *Knowingly maintain both* is what's already happening by drift, and the
  inventory's own conclusion stands: "drifting is not fine." Half of the 12
  Lua `games/` directories (`choke_point`, `horse_racing`, `mutant_battle_ball`,
  `slime_coin`, `wire_rust`) don't even have their own pytest marker in
  `pyproject.toml` — only 7 of 12 do — meaning several Lua four-file versions
  aren't under active test discipline any more, on top of the two the inventory
  already showed have shrunk to two real consumers.

**What "retire" concretely means:** stop treating `engine/` as a second
maintained implementation target the way the Rust runtime already isn't
(`StatusBoard.md` §5: *"Rust runtime (mlua bridge) — Confirmed Far Future
Dream — Not active roadmap"*). Freeze `engine/systems/` and the 12 `games/`
directories read-only once the port lands; `games/` stays for history and for
any game whose real origin requires cross-language portability (the two named
exceptions in `AGENTS.md`: VoidDrift, TurboShells — neither uses
`engine/systems/`, so this doesn't block the port).

---

## 4. Extraction order — genetics first, and not the other three yet

The inventory bundles genetics, market, odds, and inventory together as "the
four systems the Lua engine already names." Checking actual current TS
consumer counts for each (not just genetics, which the inventory already did)
changes the sequencing:

| System | Real Lua functions | Confirmed current TS consumers | Extract now? |
|---|---|---|---|
| genetics | `generate_horse`, `breed_horses`, `breed_stat`, `generate_color_profile` | 4: slimeworld (12 files), horse_racing (3), slimegarden (1), slimebreeder (1) | **Yes** |
| market | `calculate_payouts`, `calculate_horse_price`, `sell_horse`, `settle_bets` | 1: horse_racing only (`BettingTab.tsx`) | No — one consumer |
| odds | `calculate_odds` (overround-weighted), `calculate_place_odds`, `calculate_show_odds` | 1: horse_racing only | No — one consumer |
| inventory | `add_item`, `remove_item`, `has_item`, `count_item`, `use_item` | **0 found** — grepped `ts/src/games` for `addItem`/`removeItem`/`useItem`/`hasItem` function definitions, no matches | No — zero consumers found; **named gap**, not a confirmed non-need |

This isn't a contradiction of the inventory so much as a sharpening of it: the
inventory correctly names all four as re-implemented once each in Lua, but only
genetics currently clears the studio's own extraction rule — **"extract on the
second consumer, not the first."** Building TS ports of market/odds/inventory
now, with only one or zero live consumers, would violate the same discipline
ADR-014 explicitly guards ("not pure speculation... a real second use already
known or clearly likely"). Leave them in Lua, correctly parked, and let the new
catalogue (§2) surface the moment a second consumer for any of them appears —
that is a real, checkable trigger instead of a guess about the backlog.

**The interface genetics actually needs is not a verbatim port.**
`genetics.lua`'s functions are horse-shaped: `sire`/`dam`, `color_silk`,
`generation`, stat fields named `speed`/`stamina`/`acceleration`/`temperament`.
SlimeWorld's genetics is color/shape/accent-shaped (its own description:
*"Color/shape/accent genetics, territory claims"*). Porting the literal
function signatures would serve exactly one consumer again. What's reusable is
the algorithm shape, already proven by the Lua code:

- `breedNumericTrait(a: number, b: number, opts: {min, max, mutationSpread,
  generationalBoost}): number` — generalizes `breed_stat`'s parent-average +
  sum-of-three-uniforms mutation + generational boost + clamp.
- `inheritCategorical<T>(a: T, b: T, pool: WeightedPool<T>, weights: {a: number,
  b: number, mutation: number}): T` — generalizes `generate_color_profile`'s
  weighted-pool pick plus `breed_horses`'s 45/45/10 parent/parent/mutation
  split.
- `nextGeneration(a: number, b: number): number` — trivial, but currently
  reimplemented per-game rather than shared.

Extract these three primitives into `ts/src/engine/shared/genetics/` first.
**horse_racing and slimeworld adopt first** (they're the two highest-file-count
reimplementations — 3 and 12 files respectively — so they get the largest
immediate reduction), then slimegarden and slimebreeder, whose 1-file
reimplementations are cheap to migrate once the primitives exist and are proven
by the first two adopters' tests.

---

## 5. `studio_mcp/`, `intake/`, `bible/` — what earns its complexity, what doesn't

**`studio_mcp/intake.py`, `pipeline_audit/`, `zip_verify/`, `creature_session/`
earn their place.** Each maps directly onto a real, named stage of ADR-012's
six-stage pipeline or onto a real, dated failure mode in `AGENT_CONTRACT.md`:

- `intake.py` implements Stage 1 exactly as specified — content-hashing that
  ignores zip metadata (so two genuinely identical AI Studio exports don't
  create false new versions), a real version-cascade scheme, and a
  `_check_vite_base` guard that catches a real, recurring bug class (missing
  `base:` in `vite.config.ts`, which 404s every asset once served from
  `/arcade/{id}/`) — the systemic-extract intake's own `MANIFEST.md` shows this
  warning firing on a real drop.
- `pipeline_audit/` (`floor_claim_diff.py`, `commit_claim_audit.py`,
  `flaky_isolator.py`) is what `AGENT_CONTRACT.md` requires every agent to run
  before claiming completion — real evidence gathering, not a nice-to-have.
- `zip_verify/` and `creature_session/` implement independent verification of
  AI-Studio-origin completion claims (the `anthropic-skills:
  google-ai-studio-verification` pattern) against a static zip snapshot, with
  its own gated repair-round rules (`gate_runner.py`: 2 repair rounds max, a
  named "iron law" against a third tweak on the same symptom). This is real
  process discipline for a source of code the studio otherwise has no live
  repo access into.

**`bible/` should be retired.** It is disconnected from every tool in the
repo — a repo-wide grep for `bible` outside `bible/` itself, across every
`.py`/`.ts`/`.md` file, returns nothing. Nothing reads it, nothing writes it
programmatically, nothing links to it from the pipeline docs above. Its
per-game content is not real design documentation: `bible/games/shoal/*.md`
and `bible/games/slimeworld/*.md` — two of the studio's most mature, shipped
games — are 13-27 lines each, the same length and structure as
`bible/templates/puzzle-game/*.md`, a genre with **zero built instances**. The
puzzle template's own mechanics doc reads, in full: *"Solve puzzles using
logic and strategy... Advance through increasingly difficult puzzles... Win:
Complete all puzzles. Loss: Stagnation."* That is boilerplate, not a design a
person could build from — the real per-game design record already lives in
`docs/adr/` (14 real ADRs, actively cited and superseding each other with
dated corrections) and `docs/gdd/` (dozens of real, specific design and
directive documents, e.g. `SlimeWorld_Design_Rev3.md`,
`PlanetOfGreed_Design_v0.2.md`). `bible/` duplicates that structure at a
fraction of the depth, for genres including several the studio has already
decided to skip (`bible/templates/platformer/`, and the shooter-adjacent
`battle-royale`/`zombie-survival` templates sit alongside the deliberately
-skipped genres named in `GENRE_TRACKER.md`). Delete it; nothing in the
pipeline depends on it, and the real design record is already stronger and
already maintained elsewhere.

---

## 6. Sequencing

Ordered so early steps pay off even if later ones stall, per the brief's own
constraint (one person, weekends, no sustained daily attention required).

1. **Add the missing check at Gate 1.** A single script (or a `vitest`/CI-local
   check) that fails when a `ts/src/games/*/config.ts` exists but its game isn't
   in `GAME_REGISTRY`. Cheapest possible fix, and it alone would have caught
   Brewfield the day it happened. Pays off immediately, blocks nothing else.
2. **Persist `sync_arcade.py`'s `warnings` list** to a file (e.g.
   `data/arcade_sync_report.json`) instead of discarding it after printing.
   Two-line change; makes "why isn't X published" answerable without rerunning
   the script from a terminal.
3. **Build `studio_mcp/pipeline_audit/game_inventory.py`** per §2. Retires
   `GENRE_TRACKER.md`'s two derivable tables; keeps its judgment sections fed
   by a new `game-notes.yaml`. Closes the orphan question as an ongoing
   property, not a one-time fix.
4. **Resolve the nine orphans and the Brewfield contradiction**, using the new
   inventory's output as the worklist — publish, register, or record intent per
   game; ask Robert directly which of `StatusBoard.md` vs `GENRE_TRACKER.md` is
   current for Brewfield, since no per-project file exists to resolve it
   automatically.
5. **Extract genetics** as the three generic primitives in §4, adopted first by
   horse_racing and slimeworld. Independent of steps 1-4; can run in parallel.
6. **Decide the engine question on paper** (§3: port genetics-class systems,
   freeze `engine/` and `games/` read-only once done) — mostly a documentation
   and ADR-writing step once step 5 is underway, not new engineering.
7. **Retire `bible/`.** No dependency on anything above; do whenever convenient.
8. **Puzzle gap, once**, on the shared layer. `bible/templates/puzzle-game/`
   already exists but is boilerplate-thin (§5) — cheap starting point, not a
   blocker; the real test is whether the genetics extraction in step 5 made
   this build faster, which is the only question that matters about shared
   code.

---

## 7. What this does not propose

A rewrite, an engine-unification sprint, retrofitting the existing catalogue
onto a common base, or replacing `bible/`'s retirement with new documentation
machinery — `docs/adr/` and `docs/gdd/` already do that job for real. Market,
odds, and inventory extraction are explicitly deferred, not rejected — they
wait on a second real consumer the new catalogue will surface on its own. This
is a tracking and sequencing fix and one language decision, not a redesign of
what the studio builds.
