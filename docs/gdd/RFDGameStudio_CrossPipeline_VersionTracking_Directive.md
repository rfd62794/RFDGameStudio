# RFDGameStudio + RFD_IT_Publishing -- Directive: Cross-Pipeline Version Tracking + Build Freshness

*August 2026 | Read fully before executing anything. This directive spans
TWO real repos -- RFDGameStudio and RFD_IT_Publishing -- confirmed via
direct source investigation this session, not assumed. Every finding cited
below was read from real, current source, not recalled from memory.*

---

> STOP: Confirm the real, current state of every file named in Section 1
> before touching anything. Given this session already found stored
> "resolved" claims that were stale (RFD_IT_Publishing/docs/state/current.md
> is dated May 1, three months old, despite real evolution since), do not
> trust any prior claim in this directive without re-confirming it live.

---

## Section 0 -- Context: the full, confirmed picture

Three separate, disconnected version concepts exist right now, not one
number drifting in two places:

1. Intake versioning (intake/{slug}/MANIFEST.md, scheme
   MAJOR.MINOR.PATCHRrevision, e.g. 0.1.0R1) -- real, working, tested
   (tests/test_intake.py), lives in studio_mcp/intake.py. Includes real
   SHA256 content-hash duplicate detection and an existing, working
   safeguard against the recurring vite.config.ts missing-base-path bug.
   This system is correct and stays as-is -- it does a real, different
   job (tracking raw AI Studio drops before something is even a real game
   yet), not being replaced by this directive.

2. The per-game VERSION file (e.g. games/shoal/VERSION = 2.31.0, confirmed
   real this session) -- the convention actually used during real ongoing
   development, bumped manually as a directive completion-criterion.
   Confirmed via direct grep: VERSION is never read, written, or
   referenced anywhere in studio_mcp/tools.py -- completely disconnected
   from the deploy tooling.

3. Whatever Butler's own internal build number becomes on itch.io --
   confirmed via direct source read of RFD_IT_Publishing/targets/itchio.py:
   push() calls butler push {build_dir} {slug}:{channel} with no
   --userversion flag, so itch.io's displayed version is Butler's own
   auto-incrementing counter, unrelated to either of the above.

Both real deploy mechanisms share one identical structural gap, confirmed
via direct source read of each:

- studio_deploy_arcade (studio_mcp/tools.py:660) -- own docstring states
  plainly: "Does not call studio_build first -- dist/ must already be
  fresh." Checks that dist/ EXISTS, does not check that it's CURRENT.
- RFD_IT_Publishing/targets/itchio.py's push() -- same gap, confirmed:
  zero build step, zero freshness check of any kind.

This is not theoretical. Confirmed this session, live: dist-slimeworld
(C:\Github\RFDGameStudio\ts\dist-slimeworld) shows a newest file dated
July 25 -- while SlimeWorld's real source (games/slimeworld/logic.lua,
territory.lua) was modified today, August 1, via this session's own
Stage-Make-Real work. A real butler push slimeworld run right now would
silently ship a build six days stale, missing the entire Stage system just
implemented.

RFD_IT_Publishing/config/games.yaml audit, confirmed this session: seven
real, correctly-configured games (shoal, slimeworld, brewfield,
chimera_wilds, mutant_battle_ball, scrapcrawl, slime_coin) with real
itch.io slugs and real RFDGameStudio-style build paths. Two leftover
placeholder entries never cleaned up (antsim, greengap -- generic
build/web / public/ paths, not real). horse_racing -- a real, tracked
game per game-metadata.json -- is missing entirely.

Architectural redundancy, confirmed, needs a real decision (see Section 2e):
RFD_IT_Publishing/docs/state/current.md lists "Phase 4: rfditservices.com
via SFTP -- NOT STARTED." Meanwhile studio_deploy_arcade, in the OTHER
repo, already does that exact job successfully, confirmed working this
session on real SlimeWorld deploys. Two repos independently claim (or once
claimed) ownership of the same real job.

Not in scope, deferred:
- Any change to intake's own numbering scheme or MANIFEST.md format --
  confirmed correct, not being touched.
- PyPI (targets/pypi.py) or Play Store publishing -- both listed
  "NOT STARTED" in RFD_IT_Publishing's own state doc, genuinely not built
  yet, out of scope for this directive.
- Rebuilding either deploy tool's core copy/push logic -- this directive
  adds freshness checks and version wiring, it does not rewrite how either
  tool actually deploys.

---

## Section 1 -- Scope Statement

| Repo | File | Status | Action |
|---|---|---|---|
| RFDGameStudio | studio_mcp/tools.py | Modify (narrow) | Add a real freshness check to studio_deploy_arcade, fail cleanly if dist/ is older than source |
| RFDGameStudio | studio_mcp/game_metadata.py | Modify | Record deployed_version alongside existing fields, on real successful deploy only |
| RFDGameStudio | studio_mcp/intake.py | Modify (narrow, additive) | Record the real intake->VERSION seam -- see Section 2a |
| RFD_IT_Publishing | targets/itchio.py | Modify | Add the same freshness check; wire --userversion into the real butler push command |
| RFD_IT_Publishing | config/games.yaml | Modify | Remove antsim/greengap; add a real horse_racing entry -- see Section 2d |
| RFD_IT_Publishing | docs/state/current.md | Modify | Correct the stale May 1 entry; resolve the Phase 4 question -- see Section 2e |
| New (location TBD) | New | A real cross-repo version-consistency report -- see Section 2f |

Read-only -- do not touch: Either deploy tool's actual copy/push logic
beyond the additive freshness check; intake's core versioning/hashing
logic; anything in targets/pypi.py or Play Store tooling (neither exists
yet).
