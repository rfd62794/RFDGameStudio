# RFDGameStudio — System Design Document v0.4

*August 15, 2026 | RFD IT Services Ltd. | Living document. ADRs are permanent.
This version supersedes v0.3 (same day) — see §9 for what changed and why.
v0.3 itself had a real gap this version corrects: it was written from
conversation-history research without direct repo access, and missed two
live ADRs (ADR-009, ADR-011) that already partially resolved the tension
it flagged as open. Fixed here, named honestly rather than quietly patched.*

> **Currency notice:** unchanged from v0.3 — every section is accurate as of
> its own subheading's date. Update narrative text directly when an ADR
> supersedes it, not just the ADR ledger.

---

## 1. Studio Identity *(stable — unchanged since v0.1)*

RFDGameStudio is not a game engine. It is a game definition format and a
runtime contract that lets game logic run across multiple languages, with
Claude as a first-class participant at every layer.

---

## 2. The Format Contract *(stable since v0.2/ADR-006, refined by ADR-011)*

Four files for the Lua-backed contract (`data.yaml`, `ui.yaml`, `logic.lua`,
`systems.yaml`), per ADR-006. **ADR-011 (July 2026) refined this further**:
`logic.lua` (and `data.yaml`, symmetrically) may split into multiple files
once a real ~8KB or 2+-distinct-responsibility threshold is crossed —
Shoal's real split (utils/spatial_hash/algae_lifecycle/chunk_lifecycle/
discrete_events/render_state/forces/fish_steering/shark_steering/entities/
state/logic) is the reference case. The three-*artifact-type* model (data,
UI, logic) is unchanged; what counts as "the logic layer" may be one file
or several. `systems.yaml`'s `lua_files` list stays authoritative and
complete regardless of file count — that's what preserves Claude's
"reason about the game without running it" guarantee, not a low file count.

---

## 3. Runtime Reality

### 3.1 TypeScript-native is the default (ADR-010, ADR-013) — unchanged from v0.3

### 3.2 Shared engine modules are the default in both runtimes (ADR-014 — new, corrects v0.3)

**v0.3 characterized shared-code extraction as demand-gated and narrow —
close to right in practice, wrong in framing.** ADR-009 (July 17, 2026)
already superseded ADR-005's "no shared binary" stance for generic
utilities. **ADR-014 (August 15, 2026) extends that to genuine game-system
patterns** — genetics, breeding, odds/market, combat resolution,
movement/physics — matching ADR-007's original `engine/systems/` vision in
full, and gives `ts/src/engine/shared/` the same first-class status for the
TS-native track, organized under the same primitive taxonomy (Entity,
Action, Resolution, Consequence, Movement, Physics, Lifecycle — old v0.2
§8).

**The actual rule now:** every new demo checks the shared engine layer
first (Lua: `engine/primitives/` + `engine/systems/`; TS: `ts/src/engine/
shared/`) before writing new logic, and contributes back when a genuinely
general capability is recognized with a real, current second use already
known or clearly likely — not as a rare, audit-justified exception, but as
standing practice. The discipline against pure speculative sharing (ADR-005's
original, still-legitimate concern) survives; only the default posture
changed, from reluctant-exception to expected-practice once the real
trigger is present.

`engine/systems/genetics.lua`'s `breed_horses`/`generate_horse` — real,
substantial, already-working code that sat in a gray zone under ADR-009's
narrower utility-only authorization — are retroactively and fully
authorized under ADR-014. No migration needed.

### 3.3 When Lua still applies *(unchanged from v0.3)*

### 3.4 Runtime status, by language *(unchanged from v0.3)*

### 3.5 Bevy vs. egui *(unchanged from v0.3 — still open, still deprioritized)*

---

## 4. Claude's Role & Tool Integration *(unchanged from v0.3 — confirmed live)*

---

## 5. Shared Infrastructure *(reframed under ADR-014 — same components, different posture)*

### 5.1 Shared UI component library (ADR-008) — unchanged

### 5.2 Shared game logic — now first-class, not narrow

`ts/src/engine/shared/` and Lua's `engine/systems/` are peers under
ADR-014, not a cautious exception and a settled convention respectively.
Real example unchanged from v0.3 (CorpWorld/Planet of Greed's combat
resolver), but the framing changes: this is what's *supposed* to happen
when a second real consumer appears, not a special case that needed
justifying after the fact.

### 5.3 Shared art generation (`ts/src/engine/artGen/`) — status: built AND consumed — corrected

**This section was wrong in the version written earlier today and is
corrected here, not quietly.** It previously claimed Shoal and SlimeWorld
didn't consume `artGen` yet, based on conversation-history research that
predated direct file verification. Direct read of the live files showed
that was false:

- `ts/src/games/shoal/App.tsx` already imports and actively uses
  `canvasTeardropFinPath`, `canvasRadialBurstPath`, and
  `canvasIrregularFragmentPath` from `artGen/shapes.ts`, with its own
  `art/shoal.config.ts` (hunger-aware spec builders:
  `buildTeardropFinSpecWithHunger`, `buildAlgaeSpec`,
  `buildFleshChunkSpec`) and a path-caching/render-profiling layer on top.
- `ts/src/games/slimeworld/components/SlimeVisual.tsx` already imports
  `mulberry32`, `hashStringToSeed`, and `renderPolygonPoints` from
  `artGen`, with its own comment confirming the extraction was verified
  byte-identical by real tests.

Both consumers are real, tested, and complete. `artGen` is not a
built-but-unused module — it's ADR-014's proof case, already realized
before the ADR was written. No further action needed here.

### 5.4 Standalone packaging & publishing pipeline *(unchanged from v0.3)*

---

## 6. The Retirement & Conversion Pipeline *(unchanged from v0.3)*

---

## 7. The AI-Studio-Origin Track *(unchanged from v0.3)*

---

## 8. What This Document Is Not *(stable)*

---

## 9. Changelog from v0.3

| Change | ADR / Evidence | Date |
|---|---|---|
| ADR-005 already superseded by ADR-009 (generic utilities) — v0.3 missed this entirely | ADR-009 | July 17, 2026 |
| Logic-layer file-count refined by real SRP threshold, not just four-file count | ADR-011 | July 2026 |
| Shared engine modules made the explicit default in both runtimes, not a demand-gated exception | ADR-014 | Aug 15, 2026 |
| `genetics.lua`/`market.lua`/`odds.lua` retroactively fully authorized (previously gray-zone under ADR-009 alone) | ADR-014 | Aug 15, 2026 |
| §5.3 corrected same-day: `artGen` is consumed by both Shoal and SlimeWorld, verified by direct file read — not an open gap | Direct verification | Aug 15, 2026 |

**Note on v0.3's gap:** v0.3 was written from conversation-history research
without direct repo access and characterized the ADR-005/ADR-007 tension as
unresolved. It wasn't — ADR-009 had already partially resolved it a month
earlier. Named here directly rather than silently corrected, consistent
with this document's own standing rule about currency.

**Note on this version's own same-day correction:** §5.3 was also wrong
when v0.4 was first written, for the identical reason — research-based
claims standing in for direct verification. Fixed within the hour, named
here rather than smoothed over, because a document about the cost of
stale claims should not itself model quietly fixing one.

---

## 10. ADR Ledger

ADR-001–004: unchanged, see v0.1.
ADR-005: Superseded by ADR-009 (generic utilities), further narrowed by ADR-014 (game-system patterns).
ADR-006: Four-file contract.
ADR-007: Primitive Registry — reaffirmed as correct by ADR-014, not superseded.
ADR-008: Shared UI component library.
ADR-009: Shared Lua utility primitives (supersedes ADR-005 for utilities).
ADR-010: TS-native default for TS-origin demos.
ADR-011: Logic-layer modularization by SRP, refines ADR-001's file-count clause.
ADR-012: Conversion pipeline.
ADR-013: TS-native as studio default, reinforced with measured data.
ADR-014: Shared engine modules as the default in both runtimes (Aug 15, 2026).

*RFDGameStudio SDD v0.4 | August 15, 2026 | RFD IT Services Ltd.*
*Every demo checks the shared engine on the way in, and leaves something behind on the way out.*
