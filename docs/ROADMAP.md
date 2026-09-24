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
pre-existing TypeScript errors, which masks real breakage behind per-game
build workarounds. Re-measured 2026-09-24 on main: the three games that
item names (horse_racing, mutant_battle_ball, slither_rogue) now compile;
the only remaining `tsc` errors are three in `house_of_kings_collab`. M3 clears the five `status_unconfirmed`
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
  status: done
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
    status: done
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
    status: done
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
    status: done
    directive: ''
    detail: Adopt GameShell so this published game has an arcade exit, per Shared UI Wave 1. Presentation refactor only - the orbital canvas and auto-dispatch FSM are untouched.
    accept:
    - grep:
        path: ts/src/games/voiddrift_redux/App.tsx
        pattern: GameShell
    - test: cd ts && npx vitest run
- id: M2
  title: The global arcade build compiles clean
  status: done
  exit:
  - test: cd ts && npm run build
  - test: cd ts && npx vitest run
  steps:
  - id: M2.1
    title: Fix the three pre-existing TS errors in house_of_kings_collab
    kind: fix
    size: S
    value: 4
    status: done
    directive: M2_1_House_Of_Kings_TS_Errors_Directive.md
    detail: Measured 2026-09-24 on main, `cd ts && npm run build` fails at the `tsc` step (exit 2) with exactly three errors, all in house_of_kings_collab/server/routes - houseRoutes.ts(21) TS6133 unused `evaluateHouseFestival`, taskRoutes.ts(471) TS6133 unused `dailyActionsConsumed`, taskRoutes.ts(499) TS2783 `success` specified twice. Fix them without changing server behavior. The earlier M2.1-M2.3 steps (horse_racing, mutant_battle_ball, slither_rogue) were retired the same day because those games already compile; if `tsc` names a new game later, add a step for it rather than reviving those.
    accept:
    - test: cd ts && npm run build
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
  status: active
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
    status: done
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
    detail: 'Today both exist with no rule (plan: docs/superpowers/specs/2026-09-24-graphics-and-styles-plan.md). SVG: artGen shapes, the Paper Doll chimera renderer and brand assets, RoleSymbol, SlimeVisual, SVGRacer, PlanetMap (SVG + DOM, not canvas), and the 106 Dissonance SVGs from scripts/generate_dissonance_art.py. Canvas 2D: shoal, slime_coin, slither_rogue, voiddrift_redux, and the mutant_battle_ball court. Raster: only the creatureArt wolf.png fixture. State the source/style model (one definition, drawn as vector or pixel), the rule - vector for anything composed, recoloured or scaled per player (creatures, icons, UI); raster for painted backdrops and texture; canvas only where a per-frame redraw is the point - and the file-size and load budget each side gets against the portal targets.'
    accept:
    - file: docs/GRAPHICS.md
  - id: M6.2
    title: One export path from vector to sprite sheet, deterministic
    kind: feature
    size: M
    value: 4
    needs:
    - M6.1
    - M5.2
    status: pending
    directive: ''
    detail: 'A creature composed as SVG sometimes has to ship as frames: pixel-styled demos, animation, and anything performance bound. One documented, seeded export path means a demo never hand-draws what the generator can produce, and the same seed yields the same sheet. Frames come from a pose or animation (Paper Doll calculatePose) in any style; the output is sheet.png plus Aseprite-compatible JSON (frames, durations, tags) so the same loader (M6.6) plays exported and hand-drawn sheets alike.'
    accept:
    - test: cd ts && npx vitest run
  - id: M6.3
    title: Pixel-art style as a renderer option, not a second art set
    kind: refactor
    size: M
    value: 3
    needs:
    - M6.5
    - M8.1
    status: pending
    directive: ''
    detail: 'Pixel demos should consume the same creature definition through a style layer (palette quantisation, grid snapping, outline rules), so a creature exists once and renders in either style. The alternative, parallel art sets, doubles the content budget that is already the constraint. This is foundation spec step 5 (2026-09-22-studio-foundation-design.md section 8): ui.yaml style (vector | pixel) and style_toggle, the choice remembered per game, the pixel overlay look (a licensed pixel font, hard 1px outlines, no blur, image-rendering pixelated, stepped easing) and creatures through the M6.5 rasteriser. First adopters: Dissonance in both styles plus one creature game (Robert picks Chimera Wilds or Mutant Battle Ball).'
    accept:
    - grep:
        path: docs/GRAPHICS.md
        pattern: pixel
  - id: M6.4
    title: Tone roles resolve to colours per style and theme; no baked hex in generated art
    kind: feature
    size: M
    value: 4
    needs:
    - M6.1
    status: pending
    directive: ''
    detail: 'The glossary already names tone roles (ember, spark, ash, cinder, danger, heal, neutral, gold in ts/src/foundation/glossary/schema.ts) but nothing resolves them. Start ts/src/foundation/style/ with a resolver from role to colour for vector (full palette) and pixel (the 16-colour palette), and move the hard-coded ELEMENT_COLORS in both Dissonance generators onto roles - re-blessing the byte-identical baseline in the same commit. This is what lets themes and styles recolour everything in one place, and it closes the Dissonance theme-reactivity item in /ROADMAP.md.'
    accept:
    - test: cd ts && npx vitest run
    - file: ts/src/foundation/style/index.ts
  - id: M6.5
    title: 'Deterministic rasteriser: vector to pixel at a target size, quantised and outlined'
    kind: feature
    size: M
    value: 4
    needs:
    - M5.2
    - M6.4
    status: pending
    directive: ''
    detail: 'artGen/shapes.ts already has svgToCanvas. Extend it into the pixel path the foundation spec describes: rasterise at 32 or 48 px (Robert picks), quantise to the style palette, run a 1px outline pass, upscale by whole multiples. Seeded in, byte-identical out: golden PNG hashes for the M5.2 fixed seeds sit next to their SVG goldens, so a change that moves a pixel fails a test.'
    accept:
    - test: cd ts && npx vitest run
  - id: M6.6
    title: A small sprite-sheet loader and player (Aseprite JSON), for exported and hand-drawn sheets
    kind: feature
    size: S
    value: 3
    needs:
    - M6.2
    status: pending
    directive: ''
    detail: 'The tooling catalog records the gap: no mature JS package imports Aseprite directly, and the right answer is a small custom loader for Aseprite''s JSON export, not a library search. One loader, a <Sprite> component for React games and a drawSprite for canvas games, frame timing from the JSON tags - so an exported sheet (M6.2) and a sheet drawn by hand later play the same way.'
    accept:
    - test: cd ts && npx vitest run
  - id: M6.7
    title: 'First adopters: Shoal sprites, SlimeVisual on shared geometry, creatureArt gets a consumer'
    kind: refactor
    size: M
    value: 3
    needs:
    - M6.6
    status: pending
    directive: ''
    detail: 'Three deferred items from /ROADMAP.md Next land on the new path: Shoal drawFish / drawSharksBatched consume generated sprites instead of raw Canvas primitives; SlimeVisual uses the shared seeded RNG and polygon utilities instead of local copies; and the creatureArt seam (built, consumed only by its test) gets its first real game, with fallbackPathFor falling back to a generated sprite and optional pixel quantisation. Shoal''s frame budget (draw time 0.4 ms today) must not regress.'
    accept:
    - test: cd ts && npx vitest run
  - id: M6.8
    title: 'Shading as a style parameter: port the ChimeraLab shade factor and edge light'
    kind: feature
    size: M
    value: 2
    needs:
    - M6.5
    status: pending
    directive: ''
    detail: 'Gated on Robert''s verdict on technique 10 of the Paper Doll technique comparison (flat vs shaded): ChimeraLab''s calculateShadeFactor / edge light was never ported, and flat colour damages every technique equally. If yes, shading becomes a parameter of the vector and pixel styles (not a third art set), applied to artGen and Paper Doll fills, with the goldens re-blessed. It is also the base the Brand / Quality styling system builds on.'
    accept:
    - test: cd ts && npx vitest run
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
- id: M8
  title: 'The Studio foundation overlay: chips, tooltips, juice and events every game gets from its glossary'
  status: pending
  exit:
  - file: ts/src/foundation/overlay/index.ts
  - test: cd ts && npx vitest run
  steps:
  - id: M8.1
    title: 'Overlay: anchors, chips, tooltips, DetailCard and the event-log panel'
    kind: feature
    size: L
    value: 5
    status: pending
    directive: ''
    detail: 'Foundation spec step 2 (docs/superpowers/specs/2026-09-22-studio-foundation-design.md section 5). The spec said it adds a milestone for glossary, overlay and juice; only step 1 (the glossary, mounted in GameShell) was built and neither roadmap carried the rest. One React layer GameShell places over the game area: anchors (data-anchor, ui.yaml region ids, a getter for canvas games), chips per visible status/effect/resource entry with +N overflow, one Studio-wide tooltip, a shared DetailCard. First adopter: Dissonance, whose Brewfield residues are invisible today. The pixel style (M6.3) styles this layer, so it comes first.'
    accept:
    - test: cd ts && npx vitest run
    - file: ts/src/foundation/overlay/index.ts
  - id: M8.2
    title: 'Juice from comparing states: diff, scheduler, primitives and presets'
    kind: feature
    size: M
    value: 4
    needs:
    - M8.1
    status: pending
    directive: ''
    detail: 'Foundation spec step 3 (section 6): a pure diff(prev, next, glossary) -> JuiceRequest[]; primitives pop, flash, shake, pulse, burst, count, fade; presets hurt, heal, crit; a scheduler that coalesces within 150 ms, queues per anchor, caps simultaneous effects and honours prefers-reduced-motion. Stepped easing is left as a hook for the pixel style.'
    accept:
    - test: cd ts && npx vitest run
  - id: M8.3
    title: Events from the logic reach the overlay; Dissonance combat emits its four
    kind: feature
    size: M
    value: 3
    needs:
    - M8.2
    status: pending
    directive: ''
    detail: 'Foundation spec step 4 (section 7): the call(...) bridge splits {state, events}; a bare state keeps working. Event juice wins over comparison juice on the same anchor in the same update. Dissonance combat.lua emits dodge, retaliate, detonate and cauterize - the Brewfield mechanics a state comparison cannot see.'
    accept:
    - test: cd ts && npx vitest run
```
