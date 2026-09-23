# RFDGameStudio — System Design Document v0.3

*August 15, 2026 | RFD IT Services Ltd. | Living document. ADRs are permanent.
This version supersedes v0.1 and v0.2 (June 2026) — see §9 for exactly what changed and why.*

> **Currency notice:** Every section below is accurate as of the date in its
> own subheading. When an ADR supersedes something in this document, update
> the relevant section's text directly, not just the ADR ledger — v0.1's
> actual failure was an ADR trail that stayed correct while the narrative
> sections silently went stale. Don't repeat that. If you're reading this
> more than a month after the newest date in §9, treat every claim here as
> unverified until re-confirmed against current ADRs and `docs/state/current.md`.

---

## 1. Studio Identity *(stable — unchanged from v0.1)*

RFDGameStudio is not a game engine. It is a game definition format and a
runtime contract that lets game logic run across multiple languages, with
Claude as a first-class participant at every layer.

The studio exists because years of game projects kept reinventing the same
primitives with zero reuse. The fix was never a shared binary — ADR-005
settled that early and it still holds. The fix is a named-pattern discipline
and, where real duplication is *confirmed* rather than assumed, narrow,
demand-gated extraction.

---

## 2. The Format Contract *(updated — see ADR-006)*

**v0.1 said:** exactly three files, no exceptions. **That's no longer true
and hasn't been since June 2026.**

Every game defined under the Lua-backed contract now uses **four files**:

```
games/[game_id]/
  data.yaml       — entities, constants, tables, schemas
  ui.yaml         — layout intent (renderer-agnostic)
  logic.lua       — pure logic, no I/O, no rendering
  systems.yaml    — ECS manifest: systems, components, entities,
                     and which logic.lua functions implement each system
```

Three-file games (anything predating ADR-006) are legacy — not broken, not
being retrofitted on any particular timeline, just not the current target
shape for new work.

**Important scoping note, not in v0.1 at all:** this four-file contract only
governs the Lua-backed catalog. See §3 — most current studio work doesn't
use it.

---

## 3. Runtime Reality *(rewritten — v0.1's core thesis has inverted)*

**v0.1's original thesis:** one format, Lua as the default logic language,
three host runtimes (Python/lupa, TypeScript/fengari, Rust/mlua). **This is
no longer the studio's default. It's now the exception case.**

### 3.1 TypeScript-native is the default (ADR-010, ADR-013)

A game whose real origin is a standalone TypeScript/React prototype — Google
AI Studio, Bolt, Replit, or hand-authored — **defaults to staying
TypeScript-native.** No Lua translation hop. Logic lives as pure, tested
TypeScript functions, same purity discipline the Lua contract always
required, verified via `vitest` instead of `logic.lua`.

This was decided twice, independently, for different reasons:
- **ADR-010** (July 25, 2026): translation-loss and wiring-loss bugs, real
  and repeated, with zero offsetting benefit — ADR-005 already meant no
  shared Lua binary was ever on the table for these games anyway.
- **ADR-013**, later measured with real numbers (Aug 15, 2026): TS-native
  benchmarked at 130-183x faster than fengari for Shoal's actual workload.
  Wasmoon was evaluated as an alternative and also rejected (loses to
  fengari in every measured case). This didn't just support ADR-010's
  decision, it inverted the original default with hard data.

### 3.2 When Lua still applies

Exactly two populations, unchanged in principle from v0.1, narrower in
practice than originally imagined:

1. Every game already on the four-file Lua contract (Brewfield, SlimeWorld,
   Shoal's *pre-migration* logic, horse_racing, mutant_battle_ball,
   slither_rogue, scrapcrawl, Dissonance). Nothing here migrates these
   backward — but note Shoal itself has since moved to a production
   TS-native migration (confirmed 151.7x speedup) — check `docs/state/`
   per-game before assuming a game named here is still Lua-backed.
2. A new game whose real origin genuinely requires cross-language
   portability — concretely, VoidDrift and TurboShells. **Real origin must
   be checked, not assumed**, before defaulting either way.

### 3.3 Runtime status, by language

| Runtime | Status | Notes |
|---|---|---|
| Python (lupa) | Built, Phase 1 complete | rpgCore-derived, proven |
| TypeScript (fengari, for Lua-backed games) | Built, Phase 2 complete | Now the *minority* path — see 3.1 |
| TypeScript-native (no Lua) | **The actual default**, not in v0.1's roadmap at all | Most current studio momentum lives here |
| Rust (mlua bridge reading `logic.lua`) | **Never built as originally envisioned.** VoidDrift is a fully separate, natively-coded Rust/Bevy project with its own independent ADR lineage (ADR-021 and others) — zero relationship to the four-file contract | **Confirmed Far Future Dream, not active roadmap** (Robert, Aug 15, 2026) |

### 3.4 Open, deprioritized: Bevy vs. egui/eframe for a studio-wide Rust graphical layer

Two contradictory statements exist in history (July 16, 2026, same night,
~10 minutes apart) about whether a future Rust graphical layer should be
Bevy (full ECS engine) or egui/eframe (immediate-mode UI) — never resolved,
and given §3.3, this is now explicitly low priority. Don't resolve this
speculatively; revisit only if the Rust chassis idea ever becomes active
again.

---

## 4. Claude's Role & Tool Integration *(confirmed live — this part of v0.1's roadmap actually happened)*

Claude operates at three levels — Director, Co-designer, Pipeline
participant — exactly as v0.1 described. What's new: this is no longer
aspirational.

**`RFDStudioMCP` is real and live.** Five tools — `load_game`, `call`,
`get_schema`, `get_systems`, `run_headless` — port 8025, NSSM-registered,
certified at 28/0/0. Claude calls Lua directly from any session, no agent
intermediary required for surgical tasks.

---

## 5. Shared Infrastructure *(entirely new — none of this exists in v0.1)*

### 5.1 Shared UI component library (ADR-008)

`ts/src/ui/components/` — `TitleScreen`, `EndStateScreen`,
`ProgressIndicator`, `Button`, `Card`, `Badge`, `StatBar`, `TabBar`. Existed
unused for a period; a compliance pass activated it across six+ games. Rule
going forward: check this library before writing bespoke chrome, from the
first commit of any new game.

### 5.2 Shared game logic (`ts/src/engine/shared/`)

Consistent with ADR-005 — extraction only after confirmed duplication, not
speculative sharing. Real example: a TS-native cross-game duplication audit
found CorpWorld and Planet of Greed shared 7 of 12 files byte-identical, led
by a 254-line combat resolver — extracted during Planet of Greed's
conversion. This is the pattern: audit first, extract only what's proven.

### 5.3 Shared art generation (`ts/src/engine/artGen/`) — status: built, not yet consumed

`seededRandom.ts` (mulberry32 + hash, extracted verbatim from SlimeWorld's
`SlimeVisual.tsx`), `types.ts` (the generic `ArtGenConfig<TEntity>` seam),
and shape primitives generalized from Dissonance's real, working generator
(`scripts/generate_dissonance_art.py`, which remains its own separate
Python solution — the two are not merged, deliberately, per the extraction
directive).

**What this module does NOT yet do, despite being built:** neither Shoal nor
SlimeWorld actually consumes it yet. Both `ts/src/games/shoal/App.tsx` and
`SlimeVisual.tsx` are still on their original, separate approaches — the
extraction generalized real logic but deferred rewiring any consumer.
**The creative mapping question for Shoal — what should visually
distinguish a fish from a shark from algae at a glance, the equivalent of
Dissonance's element/component axes — is still open** as of this document's
writing. Don't assume this is finished; it's supply built ahead of a
specific confirmed second consumer, closer to the edge of ADR-005's
discipline than most other extractions in this studio, worth watching rather
than citing as done.

### 5.4 Standalone packaging & publishing pipeline

`vite.standalone.factory.ts` + `generate-standalone-entry.ts` package
individual games as independent itch.io-deployable bundles (seven games
packaged this way: Brewfield, Shoal, SlimeWorld, Chimera Wilds, Mutant
Battle Ball, ScrapCrawl, Slime Coin). `RFD_IT_Publishing` (Butler-based, at
`C:\Github\RFD_IT_Publishing`) is a real, working publisher — new games need
only a `games.yaml` entry. Confirmed working end-to-end: Shoal's itch.io
publish with traceable Reddit-driven traffic.

---

## 6. The Retirement & Conversion Pipeline *(entirely new — not in v0.1 at all)*

Two related but distinct real processes exist now, neither documented
before this version:

**Retirement.** When a game is superseded, the pattern (first established
with SlimeBreeder, most recently applied to CorpWorld and KingMaker Squads
on Aug 15, 2026, both superseded by Planet of Greed): source preserved
completely, read-only, in its original location — **never silently
deleted** — and explicitly, visibly removed from `games/registry.ts`. A
retirement directive states this removal as a real, reportable action, not
an incidental side effect.

**Conversion (`examples/` → `ts/src/games/`, ADR-012).** A staged pipeline
(Stage 3: scaffold, Stage 4: convert — including any warranted shared-code
extraction per §5.2, Stage 5: verify) for promoting a prototype into the
live, registered catalog. This is the actual mechanism by which an
AI-Studio-origin demo becomes a "real" studio game — see §7 for what
happens to the ones that don't go through this.

---

## 7. The AI-Studio-Origin Track *(the biggest gap in v0.1 — a whole category of real work with nowhere to live)*

A real, substantial population of games and demos exists that starts —
and often *stays* — entirely outside `games/registry.ts` and this
document's format contract. Built via Google AI Studio zip workflows,
verified with the same rigor as everything else, but never necessarily
converted per §6.

**This is not a temporary staging state to be resolved. It's a legitimate
third category, alongside "in the registry" and "retired."** The
site-rebuild work already independently arrived at a real taxonomy for
this, worth adopting here directly rather than reinventing it:

| Tier | Meaning |
|---|---|
| Shipped & Playable | Live, playable, not necessarily in `games/registry.ts` |
| Built (AI Studio), Not Yet Deployed | Complete or near-complete, no public deployment yet |
| Trials & Experiments | Real work, exploratory, not committed to shipping |
| Concepts | Design work only, no implementation |
| Stub Only | Barely started |

**Known current members of this track, not exhaustive:** Trinity
Siege/Combat, BREWFIELD (pre-conversion), LEDGER, Slime Conquest,
SlimeBreeder (retired, see §6), SlimeGarden, and — confirmed via direct
search of this document's own source material, zero prior references
anywhere — **Succession**, a persuasion-sim redesign built entirely through
this track, currently mid-development, not registered, not converted, and
not required to be.

Games in this track are not "behind" — Mutant Battle Ball is the clearest
proof: real, substantial, ongoing work (match-engine bug fixes, TS-native
migration, a full new creative direction — Neo Battlopolis, a six-Brand
Trinity system, Body Part Synergy) with no urgency to force it into the
Lua contract or the main registry before it's ready on its own terms.

---

## 8. What This Document Is Not *(stable — unchanged from v0.1)*

- Not a game engine. Does not manage rendering, physics, or input.
- Not a framework. Does not impose application structure on renderers.
- Not a package, not a platform.

The studio is a format contract, a runtime library, and — as of this
version — an honest account of which games actually use it and which
don't. The games are the product. The studio is the factory. Some
factory output never touches the assembly line, and that's fine.

---

## 9. Changelog from v0.1 — what changed and why

| Change | ADR / Evidence | Date |
|---|---|---|
| Three-file to four-file contract | ADR-006 | June 2026 |
| Lua default to TypeScript-native default | ADR-010 | July 25, 2026 |
| TS-native default reinforced with measured performance data | ADR-013 investigation | Aug 15, 2026 |
| Rust runtime (mlua/VoidDrift chassis) never materialized as planned | VoidDrift's independent ADR lineage; confirmed "Far Future Dream" | Ongoing, confirmed Aug 15, 2026 |
| Claude MCP Integration (Phase 3) shipped | RFDStudioMCP, 28/0/0 | June 2026 |
| CorpWorld, KingMaker Squads retired; Planet of Greed live | Conversion directive | Aug 15, 2026 |
| Shared UI library, shared logic extraction, shared art generation module, standalone publishing pipeline — none previously documented | ADR-008, ADR-012, artGen directive | July-Aug 2026 |
| AI-Studio-origin track named as a formal, permanent category | This version | Aug 15, 2026 |

> **Note on v0.2 (June 2026):** The prior `RFDGameStudio_SDD_v0_2.md` was an
> amendment to v0.1 adding §8 "The Seven Primitives", §9, and §10 (UI
> Component Vocabulary). That content is preserved in place; ADR-007
> (§8–9) and ADR-008 (§10) still cite it. This v0.3 is a full standalone
> rewrite with renumbered sections, not a continuation of that amendment's
> numbering.

---

## 10. ADR Ledger

ADR-001 through ADR-005: unchanged, see v0.1.
ADR-006: Systems.yaml, four-file contract (June 2026).
ADR-008: Shared UI component library.
ADR-010: TypeScript-native default for TS-origin demos (July 25, 2026).
ADR-012: Conversion pipeline (`examples/` to `ts/src/games/`).
ADR-013: TS-native as studio default, reinforced with measured data (Aug 15, 2026).
ADR-021: VoidDrift single-drone architecture (VoidDrift's own lineage, not this studio's numbering).

*RFDGameStudio SDD v0.3 | August 15, 2026 | RFD IT Services Ltd.*
*The architecture moved. This document just finally caught up to where it already was.*
