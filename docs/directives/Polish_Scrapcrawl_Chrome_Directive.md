# ScrapCrawl polish: tutorial, visual pass, sound hooks

## 1. Why this exists

ScrapCrawl is Shipped/Mature with shared menu chrome, but Tutorial=N,
Visual=N, Sound=N on the StatusBoard. Polish only.

## 2. Scope

`ts/src/games/scrapcrawl/` only. Shared components:
`ts/src/ui/components/` (`OnboardingGate`, `EndStateScreen`, `StatBar`,
`Panel`, `MoreGamesByMe`).

## 3. The work

1. **First-run tutorial**: 3-5 lines on the game's loop (explore/scavenge/
   survive â€” read the actual game first; describe what it teaches), gated to
   first launch via `OnboardingGate` or the game's own persistence.
2. **Visual pass**: readable HUD (health/resources/progress as the game
   tracks them), contrast, spacing consistent with arcade siblings.
3. **Sound**: `engine/shared/sfx/` if present, else minimal local Web Audio
   per `gladiator_arena` â€” natural events (scavenge hit, hazard, death).
4. `EndStateScreen` if terminal states exist without one.

## 4. What NOT to do

- No logic/balance changes.
- No art redesign.
- No audio files; procedural only, muted until first gesture.
- No dependency on Polish_Shared_Sfx.

## Shared-component duty (ADR-014)

Shared modules are the studio's default posture. If this pass produces
something with a real, known second use — a HUD widget, a tutorial-step
pattern, a menu variant, an audio event type — extract it into
`ts/src/ui/components/` or `ts/src/engine/shared/` instead of leaving a
per-game copy, and name the extraction plus its second consumer in the
report. Do not extract speculatively; a real second use must already exist
or be clearly likely (a second live game wanting it now counts).

## 5. Verification

- `cd ts && npm test` green; `npm run build` clean.
- Report names what was added: tutorial / visual / sound / end screen.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-09-28 21:56 · devin-overseer (delegated) · Queued → Approved
<!-- queue:end -->
