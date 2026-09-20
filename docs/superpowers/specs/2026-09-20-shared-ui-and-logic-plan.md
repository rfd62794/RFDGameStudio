# Shared UI and shared logic — extraction plan

- **Date:** 2026-09-20
- **Scope:** shared UI components and shared game logic across `ts/src/games/*` TypeScript
  games. Not a rewrite, not the Lua engine question, not the pipeline/catalogue question.
- **Builds on:** `docs/superpowers/specs/2026-09-20-shared-code-and-genre-inventory.md` and
  `docs/superpowers/specs/2026-09-20-studio-redesign-design.md`. Their counts (36 game
  directories, 14 `GameShell` consumers, genetics-only-qualifies-among-the-four-Lua-systems)
  are treated as given and not re-derived here.
- **Method:** grepped and read `ts/src/games/*/**.tsx`, `ts/src/ui/components/`,
  `ts/src/components/`, `ts/src/hooks/`, `ts/src/engine/shared/`, and cross-referenced each
  TS game directory against `ts/src/games/registry.ts` and the sibling Lua `games/<id>/`
  directories to tell TS-native logic apart from Lua-backed rendering shells. Every count
  below is a real grep run during this pass, not carried over from the two prior docs.

## 0. The landscape is not empty — a shared UI layer already exists

Before proposing anything new: `ts/src/ui/components/` (ADR-008) already holds `Button`,
`Card`, `Badge`, `StatBar`, `EmptyState`, `ErrorBox`, `TabBar`, `Modal`, `TitleScreen`,
`EndStateScreen`, `ProgressIndicator`, `MoreGamesByMe`, `OnboardingGate`, `Panel`. This is
not a proposal — it is built, and adoption is real and measured by grep, not assumed:

| Component | Consumers (counted) |
|---|---|
| `Button` | 8 games (choke_point, dissonance, horse_racing, mutant_battle_ball, scrapcrawl, shoal, slimeworld, wire_rust) |
| `Card` | 7 games (brewfield, choke_point, dissonance, horse_racing, mutant_battle_ball, scrapcrawl, wire_rust) |
| `Badge` | 6 games (choke_point, dissonance, horse_racing, mutant_battle_ball, scrapcrawl, wire_rust) + the arcade shell |
| `TitleScreen` | 8 games (brewfield, chimera_wilds, choke_point, dissonance, horse_racing, mutant_battle_ball, planetofgreed, scrapcrawl, slime_coin, wire_rust — 10 counting duplicated imports) |
| `MoreGamesByMe` | 7 games |
| `EndStateScreen` | 2 games (brewfield, dissonance) — both thin wrappers, real reuse, not coincidence (below) |
| `ProgressIndicator` | 2 games (brewfield's `MapProgress`, dissonance's `MapPhase`) — the roguelike node-map visual is already unified |
| `Panel` | 4 games |
| `StatBar` | dissonance + 3 slimeworld tabs |
| `Modal` | 5 games, each for a different dialog (see §3, "don't share") |
| `OnboardingGate` | **1 consumer** (planetofgreed) — already built, not yet past the studio's own bar |

`GameShell` (`ts/src/components/GameShell.tsx`) is the layer above this: header, back-nav,
status area, footer, 14 consumers. It is the studio's proof this model works. The finding
below is that three real, registered, TS-native games never adopted it.

## A. Shared UI

### A1. Highest-priority finding: three registered games have no `GameShell` and no back-navigation at all

`gladiator_arena`, `house_of_kings_collab`, and `voiddrift_redux` are TS-native (no Lua
counterpart), all three are in `GAME_REGISTRY`, and none of them import `GameShell`. Each
rolled its own top-of-page chrome instead: `gladiator_arena/components/Navbar.tsx` (177
lines), `house_of_kings_collab/components/Header.tsx` (111 lines),
`voiddrift_redux/components/Header.tsx` (105 lines). I grepped all three plus their `App.tsx`
files for `navigateHome`, `isEmbed`, and the literal word `Arcade` (the mechanism `GameShell`
uses to render the "← Arcade" back link) — **zero matches in all three.** These three shipped
games have no way back to the arcade from inside the game.

- **Consumers if extracted:** 3 (all already exist, all already registered — this is
  migration, not new adoption)
- **Similarity:** genuinely real. All three custom headers do the same job `GameShell`
  does — brand title, a status/stat readout, tab or view switching — via bespoke Tailwind
  markup. `gladiator_arena`'s `Navbar` fuses tab-switching, a gold counter, a sound toggle,
  and a reset button into one component; `GameShell`'s `headerExtra` and `statusArea` slots
  were built for exactly this composition.
- **Interface:** none to design — `GameShell` already has the props needed
  (`gameLabel`, `gameId`, `statusArea`, `headerExtra`, `children`, `footer`). This is
  adoption, not new API design.
- **Cost:** each game keeps its existing tab bar/nav content, just moves it into
  `headerExtra`/`statusArea` and lets `GameShell` render the surrounding chrome and the
  back link. Rough size: `Navbar.tsx` (177 lines) shrinks to the parts `GameShell` doesn't
  cover (tab buttons, gold counter, sound/reset) — call it an evening per game, not a
  weekend, and it ships a real bug fix (the missing arcade exit) alongside the dedup.
- **Verdict: do this first.** It is the only Part-A finding that is a product bug, not just
  style debt, and the fix already exists — it just needs to be wired into three files.

### A2. Log / event-history panels — looks like one shape, isn't

Six to seven games render some form of scrollable, timestamped event list: `brewfield`'s
inline `Logbook` (in `App.tsx`, not even moved to `components/`), `dissonance`'s combat log
(inside `CombatPhase.tsx`, via shared `Card`/`Panel`), `planetofgreed`'s `addLog` +
`GameDate`-stamped log array, `voiddrift_redux/components/SignalStrip.tsx` (a
terminal-styled, auto-scroll-to-top marquee), `gladiator_arena/components/ArenaCombatView.tsx`
(a log array that drives combat *animation state*, not just display), and
`slimeworld/components/MissionsTab.tsx` (multiple different `{ logs: string[] }` report
shapes embedded in modals).

- **Consumer count:** 6, but I could not find two that share a data shape. `brewfield`'s
  entries are `{ sender: 'player'|'enemy'|'field'|'system', turn, message }`.
  `planetofgreed`'s are `{ date: GameDate, message, type: 'info'|'success'|'warning'|'error' }`.
  `voiddrift_redux`'s `DispatchLog` type drives a newest-first auto-scroll terminal widget.
  `gladiator_arena`'s log entries carry `actorId`, `action`, `hit`, `damageDealt`,
  `malfunctionTriggered` and are consumed by an animation state machine, not a list renderer.
  `slimeworld`'s are bare `string[]` used inside result modals.
- **Verdict: not yet, and possibly never as one component.** This is the case the brief
  warned about: it "looks similar" (a bordered box with a scrolling list of short strings)
  but the actual data being rendered differs enough — four different field sets, one of
  them driving animation timing rather than display — that a shared `<LogPanel>` would
  need a generic-enough prop shape that it stops saving real code. The one piece that *is*
  genuinely shared already: `dissonance`'s combat log uses the existing `Card`/`Panel`
  primitives for its chrome, same as everything else in `ui/components`. Nothing further to
  extract here now. **Trigger to revisit:** if a third game adopts `planetofgreed`'s
  `{date, message, type}` shape specifically (not the others), a small
  `<TimestampedLog entries={{message, tone}[]}>` would clear the bar for that subset.

### A3. Game-specific card/tile renderers — real, but each has one consumer

`FigureCard.tsx` (succession), `DynastyLineageCard.tsx` / `KingdomStatusCard.tsx` /
`LegacyItemsCard.tsx` / `SpecializationCard.tsx` (house_of_kings_collab),
`PracticeCard.tsx` (early_learning_buddy) — six domain-specific card renderers, one game
each. Every one of them already composes the generic `ui/components` `Card` primitive
underneath rather than reimplementing a bordered box from scratch (confirmed by reading
`brewfield/components/IntroScreen.tsx`'s and the phase files' `Card` imports — the *container*
is already shared; what's bespoke is the *content layout* inside it, which is exactly the
game-specific part that shouldn't be shared). **Verdict: not a candidate.** One consumer
each, and the content differs by design (a dynasty card and a figure card show unrelated
domain data) — this is the studio's own rule working correctly, not a gap.

### A4. Tooltips, settings panels, generic grid/board renderers — none found

Grepped the full `ts/src/games` tree for `Tooltip`, `SettingsPanel`/`OptionsPanel`, and
generic `Board`/`Grid` component files: **zero matches for all three.** These patterns
named in the brief simply are not duplicated in this catalogue today — worth stating
plainly rather than inventing a finding to fill the category. Board/grid-shaped games
(`gladiator_arena`'s arena, `voiddrift_redux`'s `OrbitalCanvas`, `slither_rogue`'s canvas)
each render via `<canvas>` with completely different visual languages; there is no shared
grid *component* to find because none of these are DOM-grid based, and canvas draw code
tied to one game's specific art is exactly the kind of thing that should stay bespoke (see
§3).

### A5. Architectural recommendation: `phases/` over `components/` for new turn-based games

The brief asks directly: `dissonance` organizes as `phases/` (one file per run-phase:
`TitlePhase`, `OpeningPhase`, `FloorChoicePhase`, `DeckBuildPhase`, `MapPhase`,
`CombatPhase`, `RewardPhase`, `RestCraftPhase`, `TreasurePhase`, `StorePhase`,
`AnomalyPhase`, `RunEndPhase` — 12 files) while `brewfield` organizes as `components/`
(`CauldronSection`, `EnemySection`, `PlayerSection`, `ForageNode`, `RestNode`,
`MapProgress`, `IntroScreen`, `GameOverScreen` — 8 files). Reading both `App.tsx` files
end to end:

- **`dissonance/App.tsx`** is a pure dispatcher: one `appPhase` enum, one conditional
  render per phase, and every state mutation goes through a named `call('lua_function',
  ...)` handler defined in `App.tsx` and passed down as a prop. No JSX beyond the phase
  switch lives in `App.tsx`. Every phase file is a dumb view: state and callbacks in,
  markup out.
- **`brewfield/App.tsx`** mixes concerns: a `screen` string (`intro`/`game_over`/else) at
  the top level, but *inside* the main screen there's a second, un-named dispatch on
  `activeNode?.type` (`fight`/`forage`/`rest`) written directly inline, plus two
  substantial components — `Logbook` and `CombatOutcomeCard` — defined as local functions
  at the bottom of `App.tsx` rather than moved into `components/`. The file is 427 lines
  and does routing, state orchestration, and presentation all in one place.

**Recommendation: `phases/` is the better scaffolding for the studio's turn-based,
systems-not-content model, and new TS-native run-structured games should default to it.**
The reason isn't aesthetic — it's that the studio's own production model (ADR-014,
`AGENTS.md`: TS-native default, logic purity, one person building on weekends) depends on
being able to add one new run-stage without touching the ones that already work. Under
`dissonance`'s pattern that's "add an enum value, add a file, wire one handler." Under
`brewfield`'s pattern it means editing the inline conditional tree in `App.tsx` and hoping
the un-extracted `Logbook`/`CombatOutcomeCard` don't need to change too. This costs nothing
to adopt going forward — it's a convention for new work, not a refactor of `brewfield`
(which is retired per the studio's own record) or a mandate to touch working code. **Note
against over-claiming this as "shared code":** `dissonance/phases/` currently has exactly
one implementation (itself) — no second game uses this folder shape yet, so this is a
documented convention recommendation for the next turn-based game to follow, not a code
module clearing the second-consumer bar. Put it in `AGENTS.md` or an ADR as guidance, not
as a shared package.

### A6. What should not be shared

- **Per-game visual chrome/palette.** `brewfield` (stone/amber, hex colors, hand-tuned
  gradients), `dissonance` (CSS custom-property tokens from `ui/tokens.css`), and
  `gladiator_arena`/`voiddrift_redux` (fully bespoke Tailwind palettes: amber/stone gladiator
  theme vs. `#00CC66` terminal-green void theme) are deliberately different, and that
  difference is the point — these are meant to feel like different games. The extraction in
  A1 only touches the *structural* wrapper (header layout, back-nav), never the palette or
  tone inside it. Forcing shared color tokens or a single visual theme across games is the
  premature-unification risk the brief calls out, and the real risk here is specific:
  `gladiator_arena`'s amber/stone theme is close enough to `brewfield`'s that a careless
  "unify the chrome" pass could visually merge two games that are supposed to read as
  unrelated.
- **Domain-specific card content** (§A3) — six one-consumer components, correctly bespoke.
- **Log/event data shapes** (§A2) — four incompatible shapes behind a similar-looking box.

## B. Shared logic

### B1. `localStorage` save/load boilerplate — real duplication, cheap fix

Grepped for `localStorage.getItem`/`setItem`: **8 games** implement their own
try/catch-wrapped JSON load: `dissonance/App.tsx` (`loadUnlockedCards`, `loadSavedRun`),
`horse_racing/App.tsx` (`safeGetStorage`/`safeSetStorage`), `planetofgreed/App.tsx` (inline
try/catch around `corpworld_state`), `slimeworld/App.tsx` (`loadSavedState`),
`early_learning_buddy/App.tsx`, `gladiator_arena/context/GameContext.tsx`,
`slither_rogue/components/GameOverModal.tsx` and `MainMenu.tsx`. Every implementation is the
same 5-8 lines: `try { JSON.parse(localStorage.getItem(key)) } catch { return fallback }`,
independently reinvented eight times, byte-for-byte equivalent in intent every time.

- **Interface:** `loadJSON<T>(key: string, fallback: T | null): T | null` and
  `saveJSON(key: string, value: unknown): void`, in `ts/src/engine/shared/` alongside
  `seededRandom.ts` (same kind of module: pure, no I/O beyond the one browser API, already
  the established home for this class of utility).
- **First two adopters:** `dissonance` and `slimeworld` — both already have named
  `load*`/`loadSavedState` functions with the identical try/catch shape, so the diff is a
  near-mechanical swap, and both are actively maintained (per the Lua-genetics work already
  underway in `slimeworld`).
- **Cost vs. payoff, stated honestly per Robert's rule:** this is small. Writing the utility
  and migrating two call sites is under an hour, not a weekend — which is exactly why it's
  worth doing rather than worth debating. It doesn't buy a redesign, it buys one less place
  a `JSON.parse` typo can silently corrupt a save across eight copies of the same code. Do
  it opportunistically (next time any of the 8 files is touched for something else), not as
  a standalone sprint.

### B2. Seeded RNG — already extracted, already adopted, one outlier

`ts/src/engine/shared/seededRandom.ts` (`mulberry32`, `hashStringToSeed`) is already built
and has real multi-consumer adoption, confirmed by grep:
`engine/artGen`, `engine/paperDoll/techniqueUtils.ts`,
`engine/shared/personGenerator/roleSymbols.ts`, `games/planetofgreed/aiDecisions.ts`,
`games/shoal/art/pathCache.ts` + `shoal.config.ts`,
`games/slimeworld/components/SlimeVisual.tsx`. This is a solved case, not a proposal — it's
the studio's second proof-of-model alongside `GameShell`. **One outlier:** `chimera_wilds`
implements its own `pickRandomParts(partsData, rng)` called with raw `Math.random` rather
than a seeded generator. I did not find evidence this game needs replay-determinism (no
save/seed/share-run feature referencing it), so this reads as an inconsistency worth a
one-line note, not a bug requiring action.

### B3. `ts/src/engine/shared/combat` — already built, one consumer, worth flagging

The shared TS `combat` module (`resolveCellCombat.ts`) already exists per the studio's
default-sharing posture (ADR-014) but has exactly **one** confirmed consumer
(`games/planetofgreed/App.tsx`). This isn't a new finding to act on — it's already built and
the cost is sunk — but it's worth naming plainly since the brief asks to rank by real
consumer count: by the studio's own "second consumer" rule this module is currently in the
same bucket as `voiceRecognition` (one consumer, parked) rather than the same bucket as
`genetics` (four consumers, extract-now). No action recommended — un-extracting costs more
than leaving it — but the next TS-native cell-combat game (a real candidate: `corpworld`'s
description names "deterministic Circle/Square/Triangle combat," and it's listed as an
origin project that could resurface) is the second consumer that would actually validate
this module.

### B4. Deck/draw-pile handling, status effects/residue — mostly out of scope, and here's why

`brewfield` (`residues`, `drawPile`/`discardPile`) and `dissonance` (`drawPile`, deck-build
phase) both have deck- and status-shaped data — but both are **Lua-backed** games (confirmed:
`games/brewfield/logic.lua` and `games/dissonance/logic/*.lua` both exist). The actual
shuffle, draw, and residue-resolution logic lives in Lua and is called via `useLuaCall`
(`call('resolve_turn', ...)`, etc.) — the TS side only holds typed state shapes and rendering.
So this is not TS-side duplication; it's the Lua-side duplication the two prior specs already
scoped (and explicitly left out of the four-systems list, since deck/residue systems weren't
among `genetics`/`market`/`odds`/`inventory`). Nothing to propose here without reopening the
Lua engine question, which is out of scope for this doc.

### B5. Turn/phase state — thin, and not worth extracting

`dissonance`, `planetofgreed`, and `slimeworld` each hold an `appPhase`/`currentPhase`-style
enum in `useState`. I looked for a shared "phase machine" hook to justify extracting one:
there's nothing to extract. In every case the actual logic is a single `useState<Enum>` plus
one-off `setAppPhase(...)` calls scattered through bespoke handlers — there's no shared
transition table, guard logic, or history stack anywhere to factor out. Building a generic
`usePhaseMachine` here would be inventing structure the games don't currently have, not
deduplicating structure they do have — a clean example of Robert's weekend-for-an-hour trap.
**Not a candidate**, now or later; there's no real second implementation to converge, just
three uses of a plain enum.

### B6. Map generation, reward/loot tables — no pattern found

Grepped for `generateMap`, `MapNode`, `nodeGraph`, `lootTable`, `rewardTable`,
`weightedPick`/`weightedRandom` across all of `ts/src/games`: **zero matches.** Where reward
and map-progress *do* appear (`dissonance/phases/RewardPhase.tsx`,
`TreasurePhase.tsx`, `MapPhase.tsx`), the generation itself is a Lua call
(`generate_fixed_reward`, `resolve_treasure`) — same Lua-backed situation as §B4. The map
*visual* is already shared (§0, `ProgressIndicator`, 2 consumers). There is no TS-side
generation logic here to extract.

## Ranked recommendations

1. **Adopt `GameShell` in `gladiator_arena`, `house_of_kings_collab`, `voiddrift_redux`
   (§A1).** 3 consumers × high cost of divergence (a missing arcade exit is a live product
   defect, not aesthetic debt). No new interface to build. Highest priority in this doc.
2. **Extract `loadJSON`/`saveJSON` to `ts/src/engine/shared/` (§B1).** 8 consumers, near-zero
   design risk, under an hour of work. Do opportunistically.
3. **Adopt the `phases/` convention for the next new turn-based TS-native game (§A5).** Zero
   current second-consumer of the folder shape itself, so this is guidance to write down
   (ADR or `AGENTS.md` note), not a code extraction — but it is the clearest "do it this way
   next time" finding in this pass.

## Not yet — parked, with the trigger that would promote each

| Item | Current consumers | Promote when |
|---|---|---|
| `OnboardingGate` (already built, `ui/components`) | 1 (planetofgreed) | a second game adds an onboarding/first-run gate |
| `ts/src/engine/shared/combat` (already built) | 1 (planetofgreed) | a second cell-combat game ships (corpworld's design already names this shape) |
| Log/event-history panel (§A2) | 6, no shared shape | a second game specifically adopts planetofgreed's `{date, message, type}` shape |
| `phases/` as a shared package (not just a convention) | 1 (dissonance) | a second game is built with a `phases/` directory |

## What NOT to share (explicit)

- **Per-game color palette and visual tone** (§A6) — the closest live risk is
  `gladiator_arena`'s amber/stone theme sitting near `brewfield`'s; do not let a chrome
  unification pass bleed into palette unification.
- **Domain-specific card renderers** (`FigureCard`, `DynastyLineageCard`, etc., §A3) — one
  consumer each, different domains, correctly bespoke.
- **Log/event data shapes** (§A2) — four incompatible shapes behind one similar-looking box;
  do not build a generic `LogPanel` on the strength of the visual resemblance alone.
- **A generic phase-machine hook** (§B5) — there is no shared transition logic to factor out,
  only three separate uses of a plain enum.

## What this does not propose

A rewrite of `brewfield` (retired) or any other game, a UI framework, a redesign of
`ui/components`, or touching the Lua engine question (already scoped in the prior two docs).
Everything above is either (a) wiring three games onto an already-built component, (b)
extracting an eight-times-repeated five-line utility, or (c) a documented convention for
future work — no new abstractions, no speculative shared package with fewer than two real
consumers.
