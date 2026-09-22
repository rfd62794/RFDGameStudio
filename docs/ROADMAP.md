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
status: draft            # draft | approved
approved: ""             # "2026-09-22 Robert" once approved
reviewed: "2026-09-22"   # last human or model review - the swarm re-plans when stale
replan_after_days: 14    # reviewed older than this -> stale (default 14)
stop_if: "Robert parks the studio or decides the prose /ROADMAP.md stays the only roadmap."
revive_if: ""            # parked repos only: what would revive it
milestones:
  - id: M1
    title: Every published game has a way back to the arcade
    status: active       # pending | active | done | blocked
    exit:                # all must hold for the milestone to be done
      - file: "ts/src/components/GameShell.tsx"
      - grep: {path: "ts/src/games/gladiator_arena/App.tsx", pattern: "GameShell"}
      - grep: {path: "ts/src/games/house_of_kings_collab/App.tsx", pattern: "GameShell"}
      - grep: {path: "ts/src/games/voiddrift_redux/App.tsx", pattern: "GameShell"}
      - test: "cd ts && npx vitest run"
    steps:
      - id: M1.1
        title: Adopt GameShell in gladiator_arena
        kind: refactor   # tests | docs | refactor | fix | feature | design
        size: M          # S < 30 min | M one agent run | L = split it
        value: 4         # 1-5, how much it moves the milestone
        needs: []        # step ids in this roadmap that must be done first
        status: pending  # pending | queued | done
        directive: ""    # filled by the swarm when it creates one
        detail: Adopt GameShell (headerExtra/statusArea/footer props) and swap bespoke primitives for ui/components equivalents, per the Blocked Shared UI Wave 1 directive. Presentation only - keep the amber/stone palette, do not touch the combat-driving log panel, no logic changes.
        accept:
          - grep: {path: "ts/src/games/gladiator_arena/App.tsx", pattern: "GameShell"}
          - test: "cd ts && npx vitest run"
      - id: M1.2
        title: Adopt GameShell in house_of_kings_collab
        kind: refactor
        size: M
        value: 4
        needs: []
        status: pending
        directive: ""
        detail: Adopt GameShell so this published game has an arcade exit, per Shared UI Wave 1. Move bespoke header/nav chrome into the shell's props; swap only one-for-one shared primitives; keep the game's own palette.
        accept:
          - grep: {path: "ts/src/games/house_of_kings_collab/App.tsx", pattern: "GameShell"}
          - test: "cd ts && npx vitest run"
      - id: M1.3
        title: Adopt GameShell in voiddrift_redux
        kind: refactor
        size: M
        value: 4
        needs: []
        status: pending
        directive: ""
        detail: Adopt GameShell so this published game has an arcade exit, per Shared UI Wave 1. Presentation refactor only - the orbital canvas and auto-dispatch FSM are untouched.
        accept:
          - grep: {path: "ts/src/games/voiddrift_redux/App.tsx", pattern: "GameShell"}
          - test: "cd ts && npx vitest run"
  - id: M2
    title: The global arcade build compiles clean
    status: pending
    exit:
      - test: "cd ts && npm run build"
      - test: "cd ts && npx vitest run"
    steps:
      - id: M2.1
        title: Fix pre-existing TS errors in horse_racing
        kind: fix
        size: M
        value: 4
        needs: []
        status: pending
        directive: ""
        detail: /ROADMAP.md (Studio-Wide) names horse_racing as one of three games whose pre-existing TypeScript errors fail the global `npm run build`. Fix the type errors in the game; the milestone exit's build output is the aggregate proof that all three are clean.
        accept:
          - test: "cd ts && npx vitest run"
      - id: M2.2
        title: Fix pre-existing TS errors in mutant_battle_ball
        kind: fix
        size: M
        value: 4
        needs: []
        status: pending
        directive: ""
        detail: Same /ROADMAP.md item. Fix the game's type errors without changing game logic or balance - the parts-summing question in /ROADMAP.md (Now) is a separate, later design item.
        accept:
          - test: "cd ts && npx vitest run"
      - id: M2.3
        title: Fix pre-existing TS errors in slither_rogue
        kind: fix
        size: M
        value: 4
        needs: []
        status: pending
        directive: ""
        detail: Same /ROADMAP.md item. Fix the game's type errors; slither_rogue has no standalone build script, so the global build going green is what restores its build coverage.
        accept:
          - test: "cd ts && npx vitest run"
  - id: M3
    title: No project on the Status Board sits at status_unconfirmed
    status: pending
    exit:
      - test: "cd ts && npx vitest run"
    steps:
      - id: M3.1
        title: Resolve VoidDrift's status with a direct check
        kind: docs
        size: S
        value: 2
        needs: []
        status: pending
        directive: ""
        detail: StatusBoard asks whether the previously-flagged OpeningCompleteEvent blocking bug is still open. Check the live project (sibling repo), then update its row in ts/src/status/board.data.ts - status, currentState, lastUpdated, verificationMethod per ADR-016 - and regenerate docs/state/StatusBoard.md via ts/tools/generate-status-board.ts. 'blocked' is a valid resolution if the project genuinely cannot be checked.
        accept:
          - grep: {path: "ts/src/status/board.data.ts", pattern: "id: 'voiddrift'.*status: '(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'"}
      - id: M3.2
        title: Resolve SlimeGarden's status with a direct check
        kind: docs
        size: S
        value: 2
        needs: []
        status: pending
        directive: ""
        detail: StatusBoard records substantial mid-July design work (SlimeDex, Life Stages, partial Color Tree) but no recent confirmation; docs/status.md lists SlimeGarden among retired-with-source-preserved. Reconcile the two against the real source and update board.data.ts + regenerate StatusBoard.md.
        accept:
          - grep: {path: "ts/src/status/board.data.ts", pattern: "id: 'slimegarden'.*status: '(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'"}
      - id: M3.3
        title: Resolve Trinity Siege's status with a direct check
        kind: docs
        size: S
        value: 2
        needs: []
        status: pending
        directive: ""
        detail: The Bevy-vs-egui architecture question is confirmed deprioritized and the Rust chassis is Far Future Dream; the row still needs a direct status check. Update board.data.ts + regenerate StatusBoard.md.
        accept:
          - grep: {path: "ts/src/status/board.data.ts", pattern: "id: 'trinity_siege'.*status: '(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'"}
      - id: M3.4
        title: Resolve 7 Days to Fry's status with a direct check
        kind: docs
        size: S
        value: 2
        needs: []
        status: pending
        directive: ""
        detail: Imported alongside KingMaker Squads (now retired) with no status since. Check the real files, then update board.data.ts + regenerate StatusBoard.md.
        accept:
          - grep: {path: "ts/src/status/board.data.ts", pattern: "id: '7_days_to_fry'.*status: '(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'"}
      - id: M3.5
        title: Resolve TurboShells' status with a direct check
        kind: docs
        size: S
        value: 2
        needs: []
        status: pending
        directive: ""
        detail: Named (with VoidDrift) as a genuine cross-language-origin Lua exception, but unconfirmed recently. Check the real files, then update board.data.ts + regenerate StatusBoard.md.
        accept:
          - grep: {path: "ts/src/status/board.data.ts", pattern: "id: 'turboshells'.*status: '(active|shipped_mature|shipped_deliberately_paused|blocked|retired)'"}
  - id: M4
    title: "The studio side of the arcade meta layer: collectibles, hooks, creature content"
    status: pending
    exit:
      - file: "docs/children.json"
      - grep: {path: "ts/src/games/arcade-manifest.json", pattern: "collectibles"}
      - test: "cd ts && npx vitest run"
    steps:
      - id: M4.1
        title: "Every demo is an addressable child project"
        kind: refactor
        size: M
        value: 5
        needs: []
        status: pending
        directive: "docs/directives/Demo_Children_Module_Directive.md"
        detail: >-
          Robert, 2026-09-22: per-demo wherever possible, each demo a child of the studio. The
          module lists demos from the arcade manifest and the tracking metadata, gives each
          demo its own paths and its own one-demo check command, and writes docs/children.json.
          The swarm then addresses work as RFDGameStudio/<demo> instead of one repo-wide blob.
        accept:
          - file: "docs/children.json"
      - id: M4.2
        title: "Collectible fields in the arcade manifest, studio side"
        kind: refactor
        size: S
        value: 5
        needs: ["M4.1"]
        status: pending
        directive: ""
        detail: >-
          Mirrors RFD_IT_Services_Site roadmap M4.1. The manifest the studio generates is what
          the site reads, so the collectibles field has to exist on this side first. Pulls are
          stored as part id plus variant id references, never a combined key, or extending a
          set later means migrating every player's history.
        accept:
          - grep: {path: "ts/src/games/arcade-manifest.json", pattern: "collectibles"}
      - id: M4.3
        title: "The hook a demo exposes, once Robert answers report-versus-grant"
        kind: design
        size: S
        value: 5
        needs: ["M4.2"]
        status: pending
        directive: ""
        detail: >-
          Blocked on the site roadmap's M5.1 decision. If the hub grants progress from
          attendance and play events, no demo changes at all and this step is documentation
          only. If demos report events, each one needs a tiny SDK call and this step splits
          per demo. Do not build either until the decision is recorded.
        accept:
          - grep: {path: "docs/ROADMAP.md", pattern: "hub-grant|game-report"}
      - id: M4.4
        title: "Creature content pipeline: variants, not new art"
        kind: docs
        size: M
        value: 4
        needs: ["M4.2"]
        status: pending
        directive: ""
        detail: >-
          The research is blunt: creature content is 50-70% of a game budget and it is the real
          constraint here, not code. Write the pipeline that makes a set affordable for one
          person - palette swaps and accessory variants over a small base, small sets, seasonal
          batches - and record which existing demos can supply a base creature.
        accept:
          - file: "docs/CREATURE_PIPELINE.md"
```
