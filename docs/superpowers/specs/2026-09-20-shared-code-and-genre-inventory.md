# Shared code and genre inventory — where the catalogue actually is

- **Date:** 2026-09-20
- **Brief (Robert):** look over all the demos; plan toward shared code; inventory the mechanics and
  genres explored, and the ones mentioned but not built.
- **Method:** read `data/arcade.json` (27 published games), `GENRE_TRACKER.md` (23 tracked),
  `ts/src/games/` (36 source directories), `engine/` (Lua), `ts/src/engine/` (TypeScript).
  Everything below is counted, not remembered.

## 1. The first problem is that there are three catalogues and they disagree

| Source | Count | What it knows |
|---|---|---|
| `data/arcade.json` (the live site) | **27** | slug, genre, tags, badge, section, lineage, devlog |
| `GENRE_TRACKER.md` | **23** | genre, renderer, status, itch-publishing state |
| `ts/src/games/` | **36 directories** | the actual TypeScript source |

Nothing reconciles them. `GENRE_TRACKER.md` was last updated **August 16** and is a month stale.
Eight source games are not on the site at all — `factory_idle`, `planetforge`,
`filipino_bpo_simulator`, `technique_showcase`, `role_symbol_viewer`, `character_viewer`,
`dissonance_prototype`, `early_learning_buddy` — and there is no record of whether that is
deliberate or forgotten.

**This is the tracking problem, and it is upstream of the shared-code problem.** A studio cannot
decide what to extract into shared code when it cannot say what it has built.

**Also empty:** the `stack` field is present in the arcade schema for all 27 games, rendered by the
game-page template, and **populated for none of them**. The single field that would answer "what is
this built with" is blank across the entire catalogue, and the renderer column in
`GENRE_TRACKER.md` is the only place that information exists — for 23 of 36 games.

## 2. Two engines, in two languages, serving unequal halves

**`engine/` — Lua.**
Primitives: `action`, `consequence`, `entity`, `lifecycle`, `movement`, `physics`, `resolution`.
Systems: `combat`, `genetics`, `inventory`, `market`, `odds`.
Consumers: Shoal and Brewfield. **Two games.**

**`ts/src/engine/` — TypeScript.**
Shared: `aiBehavior`, `anatomy`, `combat`, `components`, `firestoreBackend`, `personGenerator`,
`portalAdapter`, `sportsSim`, `voiceRecognition`, plus `seededRandom`, `partSlots`,
`componentTypes`, `wheelRelation`.
Also `artGen`, `creatureArt`, `paperDoll` with body plans.
Consumers: most of the catalogue. **Roughly twenty games.**

**`GameShell.tsx` is the successful extraction and the proof the model works** — 14 games import
it: brewfield, chimera_wilds, choke_point, dissonance, horse_racing, mutant_battle_ball,
planetofgreed, scrapcrawl, shoal, slime_coin, slimeworld, slither_rogue, succession, wire_rust.

### 2a. The sharpest finding

Compare the two lists:

| System | Lua `engine/systems/` | TS `engine/shared/` |
|---|---|---|
| combat | ✅ | ✅ |
| genetics | ✅ | ❌ |
| market | ✅ | ❌ |
| odds | ✅ | ❌ |
| inventory | ✅ | ❌ |

**Four systems were designed once in Lua and are re-implemented per-game in TypeScript.** The
breeding evidence is unambiguous: `slimeworld` has 12 files touching genetics or breeding,
`horse_racing` 3, `slimegarden` 1, `slimebreeder` 1 — four games solving the same problem four
times, with a `genetics.lua` sitting in the engine that none of them can call.

That is the shared-code plan in one sentence: **the studio already knows which systems are shared —
it wrote them down in Lua — and the language split prevents the games that need them from using
them.**

Worth noting for the metagame: `wheelRelation.ts` already exists in TS shared, so the wheel has a
primitive before it has a spec.

## 3. Mechanics explored — broad and deliberately shallow

**46 distinct mechanic tags across 27 games.** Only three repeat:

| Mechanic | Games |
|---|---|
| `territory-control` | slimeworld, planetofgreed, slimegarden, corpworld |
| `origin-project` | slimegarden, slimebreeder, corpworld, kingmaker-squads |
| `turn-based` | choke-point, dissonance, facility-escape |

The other 43 appear exactly once: `genetics`, `court-intrigue`, `rival-ai`, `ecosystem-sim`,
`steering-based`, `io-style`, `evolution-cards`, `breeding`, `betting`, `autonomous-drones`,
`no-win-condition`, `deck-building`, `chemistry`, `tactical`, `sports-combat`, `squad-based`,
`culture-politics`, `coin-pusher`, `real-time`, `d20`, `single-encounter`, `crafting`,
`dungeon-crawl`, `kingdom-management`, `firebase-backed`, `fsm-drones`, `tap-to-dispatch`,
`roster-management`, `tactical-combat`, `deckbuilding`, `extraction`, `ecs-sandbox`,
`base-building`, `emergent-ai`, `pheromone-signaling`, `cooking`, `survival`, `guard-sightlines`,
`dutch-auction`, `debt-mechanics`, `siege`, `three-faction`, `tactical-squad`.

**This is a prototyping catalogue, not a product line**, and the tag distribution says so honestly.
That is a legitimate strategy — but it means almost nothing has been iterated twice, so there is
little proven ground to extract shared code *from*, except in the places where a mechanic does
repeat: territory control, breeding, and turn-based tactics.

**Taxonomy drift to fix while cataloguing:** `deck-building` vs `deckbuilding`; `tactical` vs
`tactical-combat` vs `tactical-squad`. Four tags that are two ideas.

## 4. Genres — covered, gapped, and deliberately skipped

From `GENRE_TRACKER.md`'s own gap analysis, still accurate where checked:

**Covered:** Ecosystem Sim (Shoal, VoidRift, AntSim Redux), Roguelike (Brewfield, Snake Roguelike,
Chimera Wilds, ScrapCrawl), Management Sim (Derby Sim, Gladiator Arena), Breeding/Creature
Collector (Derby Sim, SlimeBreeder, SlimeGarden), 4X and Territory Control (CorpWorld, Planet of
Greed, Trinity Siege), Idle/Incremental (VoidRift, VoidDrift Redux, House of Kings), Deck Builder
(Wire & Rust), Tower Defense (Choke Point), Social Deduction and Narrative (Succession),
Trading/Economy (Ledger, SlimeCoin, Derby Sim), Colony Sim (AntSim Redux), Educational (Early
Learning Buddy).

**Mentioned and not built:**

| Genre | Stated priority | Status |
|---|---|---|
| Merchant / deep trading sim | **HIGH** | Ledger is shallow; named as Ledger's next phase, not a new build |
| Puzzle (logic or spatial) | MEDIUM | **Zero instances.** Explicitly called agent-friendly to build |
| Dungeon crawler, deep | MEDIUM | ScrapCrawl is minimal; a deeper pass is a backlog item |
| Standalone idle/incremental | LOW | VoidRift already embodies it; low novelty |
| Farming sim | LOW | Content-heavy, fights systems-not-content |
| City builder | LOW | Same constraint |

**Deliberately skipped, and the reasoning is sound:** first- and third-person shooters, platformers,
and any real-time skill genre. The studio's production model is turn-based, agent-friendly,
systems-not-content, built by one person on weekends. Real-time skill genres need frame-accurate
input and hand-tuned feel, which is exactly what that model cannot supply.

**The one genuine hole is Puzzle.** Zero instances, medium priority, and the tracker itself notes it
suits the production model. It is also the genre that most needs no art, which makes it the cheapest
gap in the catalogue to fill.

## 5. The plan

Ordered so each step makes the next one possible, and so the early steps pay off even if the later
ones stall.

### Step 1 — One catalogue, derived (prerequisite for everything else)

Three disagreeing lists is the root problem. Build one generated inventory that reads
`ts/src/games/`, `data/arcade.json` and the build outputs, and reports per game: source present,
published or not, renderer, engine modules imported, genre, mechanics, last touched.

Generated, never hand-maintained — `GENRE_TRACKER.md` went stale in a month, and any replacement
that needs updating by hand will too. The hand-written half shrinks to what a script cannot know:
genre judgement and intent. This mirrors what `game_board.py` does for the arcade site, and it
should be the same shape.

**This also fills the empty `stack` field** — the renderer and the imported engine modules are both
derivable from source, so the site's "Built with" row can stop being blank.

### Step 2 — Answer the eight-orphan question

For each of the eight source games not on the site: publish, archive, or record why not. Eight
unexplained directories is the difference between a catalogue and a folder.

### Step 3 — Extract the four systems the Lua engine already names

`genetics`, `market`, `odds`, `inventory` — into `ts/src/engine/shared/`, in dependency order,
starting with **genetics**, because four games implement it separately and `slimeworld` alone
spreads it across 12 files.

The extraction rule that keeps this honest, and it is already the studio's own: **extract on the
second consumer, not the first.** `GameShell` earned its place across 14 games; the
GuidedWalkthrough note in the tracker says it is deliberately waiting for a second consumer before
extraction. Keep that discipline — genetics qualifies four times over, `voiceRecognition` (one
consumer) does not.

### Step 4 — Decide the Lua engine's future, explicitly

Two engines in two languages, one serving 2 games and one serving 20, is a fork nobody has decided
to maintain. Three honest options: port the Lua systems to TS and retire the Lua engine; keep Lua
as the design reference and treat TS as the implementation; or keep both and accept the duplication
knowingly. Any of those is fine. Drifting is not, and drifting is the current state.

### Step 5 — Fill the Puzzle gap, once, as a test of the shared layer

A puzzle game needs no art, suits the production model, and is the one real genre hole. Build it
*on* the shared layer rather than beside it — it is the cheapest possible test of whether the
extraction in step 3 actually made the next game faster, which is the only question that matters
about shared code.

## 6. What this does not propose

A rewrite, an engine unification sprint, or a retrofit of 27 games onto a common base. The
catalogue is a prototyping record and mostly should stay one. The work above is about being able to
*see* the catalogue, removing the four duplications the studio has already identified itself, and
deciding the language question on purpose rather than by accumulation.
