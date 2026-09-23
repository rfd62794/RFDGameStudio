# Roadmap: RFDGameStudio

> This file holds the swarm-facing `yaml roadmap` block. The studio's
> prose roadmap of record is [`/ROADMAP.md`](../ROADMAP.md) at the repo
> root (Now / Next / Later, per ADR-017); it stays the source the
> milestones below are distilled from. See `docs/DIRECTION.md` for
> purpose and guardrails.

## Why these milestones

All three come from the repo's own stated unfinished work, not invention.
M1 is a live defect: the Shared UI Wave 1 directive documents that
`gladiator_arena`, `house_of_kings_collab` and `voiddrift_redux` are
published on the arcade with no way back, and its run went Blocked
without landing the fix — still true by grep today. M2 is the deferred
Studio-Wide item in `/ROADMAP.md`: the global `npm run build` fails on
pre-existing TypeScript errors in three games, which masks real breakage
behind per-game build workarounds. M3 clears the five `status_unconfirmed`
rows on the Status Board — each is an explicit "direct status check
needed" item, and ADR-016 requires a verification method on such claims.

```yaml roadmap
status: approved
approved: 2026-09-22 robert-claude
reviewed: '2026-09-22'
replan_after_days: 14
stop_if: Robert parks the studio or decides the prose /ROADMAP.md stays the only roadmap.
milestones:
- id: M1
  title: Every published game has a way back to the arcade
  status: active
  exit:
  - file: ts/src/components/GameShell.tsx
  - grep:
      path: ts/src/games/gladiator_arena/App.tsx
      pattern: GameShell
  - grep:
      path: ts/src/games/house_of_kings_collab/App.tsx
      pattern: GameShell
  - grep:
      path: ts/src/games/voiddrift_redux/App.tsx
      pattern: GameShell
  - test: cd ts && npx vitest run
  steps:
  - id: M1.1
    title: Adopt GameShell in gladiator_arena
    kind: refactor
    size: M
    value: 4
    status: pending
    directive: ''
    detail: Adopt GameShell (headerExtra/statusArea/footer props) and swap bespoke primitives for ui/components equivalents, per the Blocked Shared UI Wave 1 directive. Presentation only - keep the amber/stone palette, do not touch the combat-driving log panel, no logic changes.
    accept:
    - grep:
        path: ts/src/games/gladiator_arena/App.tsx
        pattern: GameShell
    - test: cd ts && npx vitest run
  - id: M1.2
    title: Adopt GameShell in house_of_kings_collab
    kind: refactor
    size: M
    value: 4
    status: pending
    directive: ''
    detail: Adopt GameShell so this published game has an arcade exit, per Shared UI Wave 1. Move bespoke header/nav chrome into the shell's props; swap only one-for-one shared primitives; keep the game's own palette.
    accept:
    - grep:
        path: ts/src/games/house_of_kings_collab/App.tsx
        pattern: GameShell
    - test: cd ts && npx vitest run
  - id: M1.3
    title: Adopt GameShell in voiddrift_redux
    kind: refactor
    size: M
    value: 4
    status: pending
    directive: ''
    detail: Adopt GameShell so this published game has an arcade exit, per Shared UI Wave 1. Presentation refactor only - the orbital canvas and auto-dispatch FSM are untouched.
    accept:
    - grep:
        path: ts/src/games/voiddrift_redux/App.tsx
        pattern: GameShell
    - test: cd ts && npx vitest run
- id: M2
  title: The global arcade build compiles clean
  status: pending
  exit:
  - test: cd ts && npm run build
  - test: cd ts && npx vitest run
  steps:
  - id: M2.1
    title: Fix pre-existing TS errors in horse_racing
    kind: fix
    size: M
    value: 4
    status: pending
    directive: ''
    detail: /ROADMAP.md (Studio-Wide) names horse_racing as one of three games whose pre-existing TypeScript errors fail the global `npm run build`. Fix the type errors in the game; the milestone exit's build output is the aggregate proof that all three are clean.
    accept:
    - test: cd ts && npx vitest run
  - id: M2.2
    title: Fix pre-existing TS errors in mutant_battle_ball
    kind: fix
    size: M
    value: 4
    status: pending
    directive: ''
    detail: Same /ROADMAP.md item. Fix the game's type errors without changing game logic or balance - the parts-summing question in /ROADMAP.md (Now) is a separate, later design item.
    accept:
    - test: cd ts && npx vitest run
  - id: M2.3
    title: Fix pre-existing TS errors in slither_rogue
    kind: fix
    size: M
    value: 4
    status: pending
    directive: ''
    detail: Same /ROADMAP.md item. Fix the game's type errors; slither_rogue has no standalone build script, so the global build going green is what restores its build coverage.
    accept:
    - test: cd ts && npx vitest run
- id: M3
  title: No project on the Status Board sits at status_unconfirmed
  status: pending
  exit:
  - test: cd ts && npx vitest run
  steps:
  - id: M3.1
    title: Resolve VoidDrift's status with a direct check
    kind: docs
    size: S
    value: 2
    status: pending
    directive: ''
    detail: StatusBoard asks whether the previously-flagged OpeningCompleteEvent blocking bug is still open. Check the live project (sibling repo), then update its row in ts/src/status/board.data.ts - status, currentState, lastUpdated, verificationMethod per ADR-016 - and regenerate docs/state/StatusBoard.md via ts/tools/generate-status-board.ts. 'blocked' is a valid resolution if the project genuinely cannot be checked.
    accept:
    - grep:
        path: ts/src/status/board.data.ts
        pattern: 'id: ''voiddrift''.*status: ''(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'''
  - id: M3.2
    title: Resolve SlimeGarden's status with a direct check
    kind: docs
    size: S
    value: 2
    status: pending
    directive: ''
    detail: StatusBoard records substantial mid-July design work (SlimeDex, Life Stages, partial Color Tree) but no recent confirmation; docs/status.md lists SlimeGarden among retired-with-source-preserved. Reconcile the two against the real source and update board.data.ts + regenerate StatusBoard.md.
    accept:
    - grep:
        path: ts/src/status/board.data.ts
        pattern: 'id: ''slimegarden''.*status: ''(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'''
  - id: M3.3
    title: Resolve Trinity Siege's status with a direct check
    kind: docs
    size: S
    value: 2
    status: pending
    directive: ''
    detail: The Bevy-vs-egui architecture question is confirmed deprioritized and the Rust chassis is Far Future Dream; the row still needs a direct status check. Update board.data.ts + regenerate StatusBoard.md.
    accept:
    - grep:
        path: ts/src/status/board.data.ts
        pattern: 'id: ''trinity_siege''.*status: ''(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'''
  - id: M3.4
    title: Resolve 7 Days to Fry's status with a direct check
    kind: docs
    size: S
    value: 2
    status: pending
    directive: ''
    detail: Imported alongside KingMaker Squads (now retired) with no status since. Check the real files, then update board.data.ts + regenerate StatusBoard.md.
    accept:
    - grep:
        path: ts/src/status/board.data.ts
        pattern: 'id: ''7_days_to_fry''.*status: ''(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'''
  - id: M3.5
    title: Resolve TurboShells' status with a direct check
    kind: docs
    size: S
    value: 2
    status: pending
    directive: ''
    detail: Named (with VoidDrift) as a genuine cross-language-origin Lua exception, but unconfirmed recently. Check the real files, then update board.data.ts + regenerate StatusBoard.md.
    accept:
    - grep:
        path: ts/src/status/board.data.ts
        pattern: 'id: ''turboshells''.*status: ''(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'''
- id: M4
  title: 'The studio side of the arcade meta layer: collectibles, hooks, creature content'
  status: pending
  exit:
  - file: docs/children.json
  - grep:
      path: ts/src/games/arcade-manifest.json
      pattern: collectibles
  - test: cd ts && npx vitest run
  steps:
  - id: M4.1
    title: Every demo is an addressable child project
    kind: refactor
    size: M
    value: 5
    status: pending
    directive: docs/directives/Demo_Children_Module_Directive.md
    detail: 'Robert, 2026-09-22: per-demo wherever possible, each demo a child of the studio. The module lists demos from the arcade manifest and the tracking metadata, gives each demo its own paths and its own one-demo check command, and writes docs/children.json. The swarm then addresses work as RFDGameStudio/<demo> instead of one repo-wide blob.'
    accept:
    - file: docs/children.json
  - id: M4.2
    title: Collectible fields in the arcade manifest, studio side
    kind: refactor
    size: S
    value: 5
    needs:
    - M4.1
    status: pending
    directive: ''
    detail: Mirrors RFD_IT_Services_Site roadmap M4.1. The manifest the studio generates is what the site reads, so the collectibles field has to exist on this side first. Pulls are stored as part id plus variant id references, never a combined key, or extending a set later means migrating every player's history.
    accept:
    - grep:
        path: ts/src/games/arcade-manifest.json
        pattern: collectibles
  - id: M4.3
    title: The hook a demo exposes, once Robert answers report-versus-grant
    kind: design
    size: S
    value: 5
    needs:
    - M4.2
    status: pending
    directive: ''
    detail: Blocked on the site roadmap's M5.1 decision. If the hub grants progress from attendance and play events, no demo changes at all and this step is documentation only. If demos report events, each one needs a tiny SDK call and this step splits per demo. Do not build either until the decision is recorded.
    accept:
    - grep:
        path: docs/ROADMAP.md
        pattern: hub-grant|game-report
  - id: M4.4
    title: 'Creature content pipeline: variants, not new art'
    kind: docs
    size: M
    value: 4
    needs:
    - M4.2
    status: pending
    directive: ''
    detail: 'The research is blunt: creature content is 50-70% of a game budget and it is the real constraint here, not code. Write the pipeline that makes a set affordable for one person - palette swaps and accessory variants over a small base, small sets, seasonal batches - and record which existing demos can supply a base creature.'
    accept:
    - file: docs/CREATURE_PIPELINE.md
- id: M5
  title: Creature generation is one documented system every demo can call
  status: pending
  exit:
  - file: docs/CREATURE_SYSTEM.md
  - test: cd ts && npx vitest run
  - grep:
      path: docs/CREATURE_SYSTEM.md
      pattern: paperDoll
  steps:
  - id: M5.1
    title: Map the three creature modules and name the contract between them
    kind: docs
    size: M
    value: 5
    status: pending
    directive: ''
    detail: 'Measured 2026-09-22: creature generation lives in three places with no stated relationship. ts/src/engine/artGen (shape primitives, seeded PRNG, SVG shapes including glow filters and true ellipses); ts/src/engine/paperDoll (20 files, about 5k lines - body plans, a SkeletonManifest bone schema, 12 proportion multipliers with 8 presets, FK rotation accumulation, hierarchical colour resolution, painter Z-ordering, the chimera SVG renderer, part drawers, brand assets and an animation engine); and ts/src/engine/creatureArt (loader plus fixtures). Its own header names only two consumers, Mutant Battle Ball and Chimera Wilds, while the arcade meta layer needs every demo able to draw a creature. Write docs/CREATURE_SYSTEM.md - what each module owns, the call path from seed to rendered figure, and the one public entry point a demo uses.'
    accept:
    - file: docs/CREATURE_SYSTEM.md
  - id: M5.2
    title: 'Golden-snapshot determinism harness: same seed, same creature, forever'
    kind: tests
    size: M
    value: 5
    needs:
    - M5.1
    status: pending
    directive: ''
    detail: Shared systems are only safe to change when a change that alters output fails a test. Render a small set of fixed seeds through the public entry point and commit the SVG output as golden files; any diff is either intended and re-blessed in the same commit, or a regression. This is what lets one person refactor the renderer without hand checking 27 demos.
    accept:
    - test: cd ts && npx vitest run
  - id: M5.3
    title: 'Variant generation over new art: palettes, accessories, proportion presets'
    kind: feature
    size: M
    value: 4
    needs:
    - M5.2
    status: pending
    directive: ''
    detail: 'The economics from the meta-layer research: creature content is 50 to 70 percent of a game budget and it is the real constraint for one person. The system already has the levers (hierarchical colour resolution, 8 proportion presets, sockets and an attachment graph); this step turns them into a documented recipe for producing a set from one base creature, and records which existing demos supply a base.'
    accept:
    - file: docs/CREATURE_PIPELINE.md
- id: M6
  title: 'Graphics types have a stated boundary: SVG by default, raster where it earns it'
  status: pending
  exit:
  - file: docs/GRAPHICS.md
  - test: cd ts && npx vitest run
  steps:
  - id: M6.1
    title: 'Write the boundary: what is vector, what is raster, and why'
    kind: docs
    size: S
    value: 5
    status: pending
    directive: ''
    detail: 'Today both exist with no rule. SVG: artGen shapes, the chimera renderer, brand assets, RoleSymbol. Raster and canvas: the creatureArt wolf.png fixture, PlanetMap, PlaygroundScene, the dissonance art config, and scripts/generate_dissonance_art.py. State the rule - vector for anything composed, recoloured or scaled per player (creatures, icons, UI); raster for painted backdrops and texture; canvas only where a per-frame redraw is the point - plus the file-size and load budget each side gets.'
    accept:
    - file: docs/GRAPHICS.md
  - id: M6.2
    title: One export path from vector to sprite sheet, deterministic
    kind: feature
    size: M
    value: 4
    needs:
    - M6.1
    status: pending
    directive: ''
    detail: 'A creature composed as SVG sometimes has to ship as frames: pixel-styled demos, animation, and anything performance bound. One documented, seeded export path means a demo never hand-draws what the generator can produce, and the same seed yields the same sheet.'
    accept:
    - test: cd ts && npx vitest run
  - id: M6.3
    title: Pixel-art style as a renderer option, not a second art set
    kind: refactor
    size: M
    value: 3
    needs:
    - M6.2
    status: pending
    directive: ''
    detail: Pixel demos should consume the same creature definition through a style layer (palette quantisation, grid snapping, outline rules), so a creature exists once and renders in either style. The alternative, parallel art sets, doubles the content budget that is already the constraint.
    accept:
    - grep:
        path: docs/GRAPHICS.md
        pattern: pixel
- id: M7
  title: Every shared engine system has an owner doc, a contract test and a consumer list
  status: pending
  exit:
  - file: docs/ENGINE_SYSTEMS.md
  - test: cd ts && npx vitest run
  steps:
  - id: M7.1
    title: Inventory ts/src/engine/shared and record who consumes each system
    kind: docs
    size: M
    value: 4
    status: pending
    directive: ''
    detail: 'The shared layer already holds anatomy, combat, sportsSim, personGenerator, aiBehavior, portalAdapter, firestoreBackend, componentTypes, partSlots and seededRandom - each feeding several demos, none with a stated contract. One table: system, entry point, demos that import it, test file, and whether its output is seeded.'
    accept:
    - file: docs/ENGINE_SYSTEMS.md
  - id: M7.2
    title: Finish the seededRandom consolidation and make the pattern the rule
    kind: refactor
    size: S
    value: 3
    needs:
    - M7.1
    status: pending
    directive: ''
    detail: 'artGen/seededRandom.ts is already a thin re-export of shared/seededRandom.ts, which is the right shape: one canonical implementation, a re-export for existing callers. Apply that pattern anywhere else the inventory finds two copies, and say in the doc that a second implementation of a shared system is a defect.'
    accept:
    - test: cd ts && npx vitest run
  - id: M7.3
    title: Contract tests for the systems the meta layer will lean on
    kind: tests
    size: M
    value: 4
    needs:
    - M7.1
    status: pending
    directive: ''
    detail: Collections and site-wide points will read from combat outcomes, anatomy parts and the person generator. Each of those gets a contract test at its public entry point, so a change that breaks a demo fails here first rather than in a player's browser.
    accept:
    - test: cd ts && npx vitest run
```
