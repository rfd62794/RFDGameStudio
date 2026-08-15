import type { SiteStatusEntry, SiteStatusHub } from './site-pages.types';

/**
 * The hub page metadata. Sibling to games-engines-systems.md and
 * legacy-projects.md in the site's content/projects/ directory.
 * Same type: system, same category: Games/Engines/Systems.
 */
export const SITE_STATUS_HUB: SiteStatusHub = {
  id: 'studio-status',
  title: 'Studio Status',
  tagline:
    'Real, current status of every active RFDGameStudio project thread — live, in progress, designed, and complete',
  problem:
    "A multi-thread game studio with games in five different categories and infrastructure in three tech stacks needs a single, honest view of what's actually happening right now — not a flattened list, not a backlog, just the real state of each active thread.",
  approach: [
    'One hub page with a card per active project thread',
    'Each card links to a dedicated breakdown page with the full real history',
    'Status badges (Live / In Progress / Designed / Complete) make state visible at a glance',
    'Content pre-verified from the August 2026 studio session, not re-derived or guessed',
  ],
  highlights: [
    '5 real project threads, each with verified current state',
    'Shoal and Planet of Greed both live on itch.io + arcade',
    'Mutant Battle Ball mid major creative overhaul',
    'Facility Escape Chapter 2 design locked, implementation not started',
    'Studio infrastructure complete — ADR-013, GameShell compliance, shared engine established',
  ],
  stack: ['TypeScript', 'Lua', 'Python', 'Rust'],
  intro:
    "Two years of game development produces a lot of real work at very different stages. This page is the honest current-state view of RFDGameStudio's active threads — not the full back-catalog (that's [Legacy Projects](/projects/legacy-projects/)), not the playable arcade (that's [The Arcade](/games/)), just what's actually happening right now across the studio.\n\nEach card below links to a dedicated breakdown page with the full real history and current state of that project thread.",
  deferredNote:
    '**Succession** — a persuasion-sim redesign, handed to Gemini/AI Studio directly. Not part of RFDGameStudio\'s active thread. Tracked in the [studio status board data](https://github.com/rfd62794/RFDGameStudio/blob/main/docs/state/StatusBoard.md) but not a full card here.',
};

/**
 * The 5 project threads. Each has a cardSummary (for the hub card) and
 * a bodyContent (the full §1 content for the dedicated breakdown page).
 *
 * Content is pre-verified from the August 2026 studio session per the
 * directive — use directly, don't re-derive or guess at project state.
 */
export const SITE_STATUS_ENTRIES: SiteStatusEntry[] = [
  // --- Card 1: Shoal ---
  {
    id: 'studio-status-shoal',
    name: 'Shoal',
    statusBadge: 'Live',
    tagline:
      'Wa-Tor-inspired reef sandbox — six-stage performance investigation to production TS-native migration',
    problem:
      "A Lua-backed ecosystem simulation hit real performance walls under fengari. The question was whether to optimize the Lua runtime, switch to an alternative, or migrate to TypeScript-native — and whether the migration could be done without losing the game's logic.",
    approach: [
      'Six-stage performance investigation: spatial hash → get_nearby optimization → wasmoon evaluation → TS-native benchmark',
      'Real production TS-native migration, not a prototype — Lua source preserved, not deleted',
      'artGen module fully consumed (canvas paths, hunger-aware specs, path caching)',
      'Devlog posted publicly',
    ],
    highlights: [
      '151.7x measured speedup after TS-native migration',
      'Wasmoon evaluated and rejected (loses to fengari in every measured case)',
      'artGen fully consumed — canvas teardrop fin, radial burst, irregular fragment paths',
      'Live on itch.io + rfditservices.com arcade with traceable Reddit-driven traffic',
      'Lua source preserved read-only, not deleted',
    ],
    stack: ['TypeScript', 'Lua', 'Vite', 'React'],
    cardSummary:
      'Live on itch.io + rfditservices.com arcade. TS-native migration complete (151.7x speedup). artGen fully consumed. Devlog posted. No current open items.',
    bodyContent: `## Current State: Live

Shoal is live on itch.io (Published) and the rfditservices.com arcade. No current open items.

## The Six-Stage Performance Investigation

Shoal started as a Lua-backed game under RFDGameStudio's four-file contract. When it hit real performance walls under fengari (the TypeScript Lua runtime), the investigation went through six real stages:

1. **Spatial hash optimization** — the first real performance work, reducing O(n²) neighbor lookups
2. **get_nearby optimization** — narrowing the spatial query further
3. **Wasmoon evaluation** — tested as an alternative Lua runtime; rejected because it loses to fengari in every measured case
4. **TS-native benchmark** — measured at 130-183x faster than fengari for Shoal's actual workload
5. **Production TS-native migration** — not a prototype, a real migration with 151.7x measured speedup
6. **Lua source preserved** — the original \`logic.lua\` files remain in the repo, read-only, not deleted

This investigation directly drove ADR-013 (TS-native as the studio default), reinforced with hard measured data rather than preference.

## artGen Consumption

Shoal is one of two real consumers of the shared \`artGen\` module (the other is SlimeWorld). Direct file verification confirms:

- \`ts/src/games/shoal/App.tsx\` imports and actively uses \`canvasTeardropFinPath\`, \`canvasRadialBurstPath\`, and \`canvasIrregularFragmentPath\` from \`artGen/shapes.ts\`
- \`ts/src/games/shoal/art/shoal.config.ts\` contains hunger-aware spec builders: \`buildTeardropFinSpecWithHunger\`, \`buildAlgaeSpec\`, \`buildFleshChunkSpec\`
- A path-caching/render-profiling layer sits on top (\`ts/src/games/shoal/art/pathCache.ts\`)

This is ADR-014's realized proof case — shared engine modules consumed by a real production game, not a speculative extraction.

## Deployment

Live on itch.io with a posted devlog. Real traceable Reddit-driven traffic confirmed. Also playable in the rfditservices.com arcade.`,
  },

  // --- Card 2: Planet of Greed ---
  {
    id: 'studio-status-planet-of-greed',
    name: 'Planet of Greed',
    statusBadge: 'Live',
    tagline:
      'Dark-corporate boardroom strategy game — the fusion of CorpWorld, KingMaker Squads, and Genesis Ore narrative',
    problem:
      'Two separate game prototypes (CorpWorld and KingMaker Squads) explored adjacent corporate-strategy territory without converging. The challenge was blending them into a single, canonically-locked game with real narrative weight.',
    approach: [
      'Full blend design: CorpWorld scaffold + KingMaker wheel topology + Genesis Ore/Signal/House Arrest narrative',
      'Phase 1 Engine Directive → conversion from examples/ to the live catalog',
      'CorpWorld and KingMaker Squads retired (source preserved, not deleted)',
      'Merge & Polish v2: guided walkthrough, flavor text, dark-corporate visual identity',
      'Shell Compliance + Opening Sequence (real GameShell miss caught and fixed)',
    ],
    highlights: [
      'Five-chapter canon locked',
      'CorpWorld and KingMaker Squads both retired, source preserved read-only',
      'Live on itch.io + rfditservices.com arcade',
      'Devlog posted',
      'Real GameShell miss caught during Shell Compliance pass and fixed',
      'Attack Capability fix and Boardroom softlock fix (double-charge bug) shipped',
    ],
    stack: ['TypeScript', 'React', 'Vite', 'Tailwind'],
    cardSummary:
      'Live on itch.io + rfditservices.com arcade. Five-chapter canon locked. CorpWorld and KingMaker Squads retired (source preserved). Devlog posted. Two items explicitly deferred: culture stat asymmetry, Signal\'s authored Boardroom Event content.',
    bodyContent: `## Current State: Live

Planet of Greed is live on itch.io (Published) and the rfditservices.com arcade. Five-chapter canon locked. Devlog posted.

## The Blend

Planet of Greed is the fusion of three separate threads:

- **CorpWorld** — provided the scaffold (corporate entity management, resource economy)
- **KingMaker Squads** — provided the wheel topology (faction-based territorial control)
- **Genesis Ore / Signal / House Arrest** — provided the narrative canon (five chapters of dark-corporate story)

Both CorpWorld and KingMaker Squads were retired when Planet of Greed went live. Their source is preserved read-only in the repo — never silently deleted — and explicitly removed from \`games/registry.ts\`. This established the retirement pattern that subsequent retirements follow.

## The Conversion Pipeline

Planet of Greed went through the real conversion pipeline (ADR-012): starting as a prototype in \`examples/\`, it was scaffolded, converted (including warranted shared-code extraction per ADR-005/ADR-014), and verified before entering the live registered catalog.

## Polish and Fixes

After the initial conversion, several real polish and fix passes occurred:

- **Merge & Polish v2** — guided walkthrough, flavor text, dark-corporate visual identity
- **Shell Compliance** — a real GameShell miss was caught during this pass and fixed
- **Opening Sequence** — the real opening sequence was wired correctly
- **Attack Capability fix** — a real bug in attack capabilities was fixed
- **Softlock fix** — a double-charge bug causing a Boardroom softlock was fixed

## Explicitly Deferred

Two items are real, explicitly deferred — not forgotten, not stalled, deliberately left for later:

1. **Culture stat asymmetry (3x)** — real balance/exploit risk that needs playtesting to resolve, not a quick fix
2. **Signal's authored Boardroom Event content** — the narrative content for Signal's Boardroom Events is designed but not yet authored`,
  },

  // --- Card 3: Mutant Battle Ball ---
  {
    id: 'studio-status-mutant-battle-ball',
    name: 'Mutant Battle Ball',
    statusBadge: 'In Progress',
    tagline:
      'Mutant sports combat game mid major creative overhaul — Neo Battlopolis, six-Brand Trinity, Body Part Synergy',
    problem:
      'A mutant sports combat game with real engine work done but a major creative overhaul in progress. The challenge is that the creative direction (Neo Battlopolis, six-Brand Trinity) and the technical work (Paper Doll, Character Viewer, ChimeraLab patterns) are both substantial and both ongoing.',
    approach: [
      'Match engine investigation: 2 real bugs found and fixed',
      'TS-native migration + real steering movement',
      'Balanced-speed zero-score scare investigated and closed as a false alarm',
      'Minimal Real Game Loop built (Shop/Workshop were confirmed inert stubs, now real)',
      'Paper Doll module: 8 ChimeraLab patterns ported, Character Viewer built, Recognizable Primitives fix',
      'Full 10-technique comparison → stroke-skeleton + SDF joint blending identified as the winner',
    ],
    highlights: [
      'Match engine bugs fixed: stale-carrier self-tackle, stunned-team ball-loss',
      '3 of 4 tabs wired with real currency/persistence',
      '8 ChimeraLab patterns ported into Paper Doll module',
      'Character Viewer built and fixed through 3 real bug passes',
      'Recognizable Primitives fix: sigmoid limbs, real ellipse primitive, real anatomical proportions',
      '10-technique comparison completed — stroke-skeleton + SDF joint blending is the production winner',
      'Chimera Hybrid Studio investigated: hand-authored deterministic SVG paths per Brand×slot',
    ],
    stack: ['TypeScript', 'React', 'Vite', 'Tailwind'],
    cardSummary:
      'Not deployed. Match engine bugs fixed, TS-native migration done, Minimal Real Game Loop built. Paper Doll module with 8 ChimeraLab patterns ported, Character Viewer built, 10-technique comparison completed. Real designed-not-built game systems: Brand/Trinity naming, OEM Quality tiers, Frame/Forge economy, Gravekeeper, Tournament structure. Roster-meaning question deliberately left open.',
    bodyContent: `## Current State: In Progress

Mutant Battle Ball is not deployed. It is genuinely mid-build — real engine work done, major creative overhaul in progress, not close to done.

## Match Engine Investigation

Two real bugs were found and fixed in the match engine:

1. **Stale-carrier self-tackle** — a carrier that was no longer the carrier could tackle themselves
2. **Stunned-team ball-loss** — a stunned team could lose the ball when they shouldn't

A balanced-speed zero-score scare was investigated and closed as a **false alarm** — the test fixture wasn't actually balanced, so the zero-score result was a fixture artifact, not a real engine bug.

## Minimal Real Game Loop

The Shop and Workshop tabs were confirmed to be **inert stubs** — they looked like real UI but did nothing. They've been rebuilt as real, functional tabs. 3 of 4 tabs are now wired with real currency/persistence.

## Paper Doll Module and Visual Thread

A long, real visual thread:

- **Paper Doll module built** — 8 ChimeraLab patterns ported
- **Character Viewer built** — fixed through 3 real bug passes
- **Recognizable Primitives fix** — sigmoid limbs (not teardrop fins), real ellipse primitive (not 6-vertex polygon), real anatomical proportions
- **Full 10-technique comparison** — 10 different visual techniques evaluated. **Stroke-skeleton + SDF joint blending** identified as the real winner. A production directive was sent; completion not yet independently confirmed.

## Chimera Hybrid Studio Investigation

An external AI Studio app (Chimera Hybrid Studio) was investigated. Real, valuable find: it uses **hand-authored, deterministic, zero-runtime-cost SVG paths per Brand×slot**. Not yet ported to production. Real known gap: no shared connection-point contract across Brands (each Brand's parts connect differently).

## Designed-Not-Built Game Systems

Real, designed but not yet built:

- **Brand/Trinity naming** — Trueflame, Icevault, Quicksilver, Prismworks, Mirefaith, Tidalcapital
- **OEM Quality tiers** — quality grading system for parts
- **Cyber/Organic lean** — aesthetic and functional alignment system
- **Frame/chassis + Forge economy** — the economic loop around part crafting
- **Gravekeeper** — a real game system, designed not built
- **Tournament/season structure** — real fork undecided (multiple valid structures)
- **Reputation-as-standing** — reputation system tied to competitive standing

## The Roster-Meaning Question

The actual roster-meaning question — what does it mean for a mutant to be "on a roster" — is **explicitly, deliberately left open** per Robert's own words. Not resolved, not meant to be forced. This is a design decision, not a gap.`,
  },

  // --- Card 4: Facility Escape ---
  {
    id: 'studio-status-facility-escape',
    name: 'Facility Escape (Chapter 2)',
    statusBadge: 'Designed',
    tagline:
      'Stealth-infiltration chapter with locked July infrastructure and new Loud/Rush design from tonight\'s session',
    problem:
      'A stealth-infiltration chapter with real, locked infrastructure from July but no new design work since. The challenge was extending the existing design with new mechanics that respect the locked pillars rather than replacing them.',
    approach: [
      'Reuse locked July infrastructure: turnEngine, guardAI, physicsEngine, roomGenerator, levelSolver',
      'New Loud meter design modeled on FF7\'s Shinra Tower Invasion',
      'Rush system: fortify the same room, goal never changes',
      'Trinity Siege RPS skeleton reused for Rush-enemy resolution only (preserves "One Body, Not a Fleet")',
      'Real thread proposed to the wider canon via Signal',
    ],
    highlights: [
      'Five locked design pillars including "Telecast, Not Ambush"',
      'Real Dijkstra-based levelSolver with difficulty scoring and degenerate-room rejection',
      'Loud meter: floor-wide alarm state modeled on FF7 Shinra Tower',
      'Rush system preserves "One Body, Not a Fleet" pillar',
      'Trinity Siege RPS skeleton reused narrowly, not broadly',
    ],
    stack: ['TypeScript', 'React', 'Vite', 'Tailwind'],
    cardSummary:
      'Real, locked infrastructure from July: turnEngine, guardAI, physicsEngine, roomGenerator, levelSolver (real Dijkstra). New design: Loud meter (FF7 Shinra Tower model), Rush system (fortify room, goal never changes), Trinity Siege RPS skeleton reused for Rush-enemy resolution. Real open items: exit-reachability during Rush, intensity curve, discrete-juncture placement.',
    bodyContent: `## Current State: Designed

Facility Escape Chapter 2 is designed but not implemented. Real, locked infrastructure from July. New design from tonight's session. Real open items remain.

## Locked Infrastructure (July)

Real, working, locked infrastructure from July:

- **turnEngine** — the turn-based game loop
- **guardAI** — AI behavior for facility guards
- **physicsEngine** — spatial simulation
- **roomGenerator** — procedural room generation
- **levelSolver** — a genuinely sophisticated level solver with real Dijkstra search, difficulty scoring, and degenerate-room rejection

## Five Locked Design Pillars

Five design pillars are locked, including:

- **"Telecast, Not Ambush"** — the core stealth philosophy
- **"One Body, Not a Fleet"** — the player is a single agent, not a squad

## New Design (Tonight's Session)

Three new design elements:

### Loud Meter

A floor-wide alarm state modeled on FF7's Shinra Tower Invasion. The Loud meter tracks how much noise the player has made across the entire floor, not just in the current room. This creates a real tension between speed (more noise) and stealth (less progress).

### Rush System

A fortify-the-same-room mechanic. When a Rush is triggered, the player fortifies their current room and defends it. The goal never changes — the player still needs to reach the exit, but the Rush creates a real, localized combat encounter that must be resolved before continuing.

### Trinity Siege RPS Skeleton Reuse

Trinity Siege's RPS (rock-paper-scissors) skeleton is reused for Rush-enemy resolution **only** — not as a broad game system. This preserves the "One Body, Not a Fleet" pillar: the RPS determines how the player's single-agent loadout interacts with the Rush enemies, not a fleet-vs-fleet combat simulation.

## Real, Explicitly Open

Three items are real, explicitly open — none decided:

1. **Exit-reachability during Rush** — can the player reach the exit while a Rush is active, or must the Rush be resolved first?
2. **Real intensity curve** — how does the Loud meter and Rush frequency scale across the chapter?
3. **Discrete-juncture placement** — at what specific junctures do Rush events occur?

## Canon Proposal

A real thread was proposed to the wider canon via Signal. This is a design proposal, not a locked decision — the canon may or may not incorporate it.`,
  },

  // --- Card 5: Studio Infrastructure ---
  {
    id: 'studio-status-infrastructure',
    name: 'Studio Infrastructure',
    statusBadge: 'Complete',
    tagline:
      'The shared engine, compliance audits, and cross-game duplication resolution that underpins everything else',
    problem:
      'A multi-game studio with games in two runtimes (Lua and TypeScript) needs shared infrastructure that doesn\'t duplicate across games. The challenge is establishing shared engine modules as the default, not the exception, and keeping every game in compliance with the studio\'s shell and UI standards.',
    approach: [
      'ADR-013: TS-native default locked, Lua retired as mandatory',
      'Studio-wide GameShell/TitleScreen compliance audit',
      'TS-Native Cross-Game Duplication Audit',
      'ChimeraLab investigation with 8 portable patterns ported',
    ],
    highlights: [
      'ADR-013: TS-native is the default, Lua retired as mandatory',
      'GameShell compliance: 6 games fixed, 833/833 confirmed clean',
      'CorpWorld/Planet of Greed 7-of-12-byte-identical fork resolved',
      'ts/src/engine/shared/ established as first-class shared logic layer',
      '8 ChimeraLab patterns ported into Mutant Battle Ball',
    ],
    stack: ['TypeScript', 'Lua', 'Python'],
    cardSummary:
      'ADR-013 (TS-native default locked, Lua retired as mandatory). GameShell/TitleScreen compliance audit complete (6 games fixed, 833/833 confirmed clean). TS-Native Cross-Game Duplication Audit complete (CorpWorld/Planet of Greed 7-of-12-byte-identical fork resolved, ts/src/engine/shared/ established). ChimeraLab investigation complete, 8 portable patterns ported.',
    bodyContent: `## Current State: Complete

Studio infrastructure is complete. The shared engine, compliance audits, and cross-game duplication resolution are all done.

## ADR-013: TS-Native Default Locked

ADR-013 formalized what the Shoal performance investigation proved: TypeScript-native is the studio default. Lua is retired as a **mandatory** runtime — it remains supported for games with genuine cross-language portability requirements (VoidDrift, TurboShells), but it is no longer the default contract for new games.

This was driven by hard measured data (Shoal's 151.7x speedup), not preference.

## GameShell/TitleScreen Compliance Audit

A studio-wide compliance audit verified that every registered game uses the shared GameShell and TitleScreen components correctly:

- **6 games fixed** — real compliance misses caught and corrected
- **833/833 tests confirmed clean** — the full test suite passes with zero shell-related failures

This audit caught a real GameShell miss in Planet of Greed during the Shell Compliance pass — the kind of bug that's invisible without a systematic audit.

## TS-Native Cross-Game Duplication Audit

A cross-game duplication audit found that CorpWorld and Planet of Greed had **7 of 12 bytes identical** — a real fork, not just similar code. This was resolved by:

- Establishing \`ts/src/engine/shared/\` as the first-class shared logic layer
- Moving genuinely shared code into the shared layer
- Both games now consume from the shared layer rather than maintaining parallel copies

This directly drove ADR-014: shared engine modules are the **default posture**, not a demand-gated exception.

## ChimeraLab Investigation

The ChimeraLab investigation identified **8 real portable patterns** from the ChimeraLab visual system. These were ported into Mutant Battle Ball's Paper Doll module:

- 8 patterns ported
- Each pattern is a real, reusable visual technique
- The porting process validated that the patterns are genuinely portable, not just superficially similar

This is a concrete example of the shared-engine default in action: patterns recognized as general were extracted and reused, not duplicated.`,
  },
];
