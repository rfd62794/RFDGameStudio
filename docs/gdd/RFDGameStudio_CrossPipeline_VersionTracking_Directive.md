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

---

## Section 2 -- Implementation

### Section 2a -- Intake -> VERSION seam

When a concept is promoted out of intake/ into a real games/{slug}/
directory (via whatever real promotion mechanism currently does this --
confirm the actual function, likely in scaffold.py given the file list,
before assuming), record the real intake version it graduated from as a
one-line entry in the new games/{slug}/VERSION file's own history, or in
a small adjacent note -- the exact format is a real, small design choice
for Devin to make and report, not pre-specified here. The requirement is
just that the seam is recorded somewhere real, not that a specific file
format is used.

RULE: Locate the real promotion mechanism via source read before assuming
it's in scaffold.py -- confirm, do not guess.

### Section 2b -- Build freshness check (both deploy paths, same pattern)

```python
def _is_dist_stale(dist_dir: Path, source_dir: Path) -> bool:
    """Compare dist/'s newest file against source's newest real file.
    Returns True if dist/ predates the source it's supposed to represent."""
    if not dist_dir.exists():
        return True  # caller's existing "missing" check handles messaging
    dist_newest = max((f.stat().st_mtime for f in dist_dir.rglob("*") if f.is_file()), default=0)
    source_newest = max((f.stat().st_mtime for f in source_dir.rglob("*") if f.is_file()), default=0)
    return dist_newest < source_newest
```

RULE: This is a real, deliberate design choice, not a placeholder: FAIL
LOUDLY, DO NOT AUTO-REBUILD. studio_deploy_arcade already has a clean,
working, tested failure pattern for "dist/ does not exist" -- extending it
to also fail on "dist/ is stale" is a small, safe addition. Auto-triggering
a real rebuild inside a deploy call is a bigger, riskier change (real
wall-clock time inside what's currently a fast operation, real
build-failure handling needed) -- explicitly not what this directive asks
for. If a real case is found where auto-rebuild is clearly the better
answer, report it, do not silently implement it.

RULE: Apply the identical check to BOTH studio_deploy_arcade and
RFD_IT_Publishing/targets/itchio.py's push() -- this is one fix, needed in
two places, not two different fixes. Confirm the real source directory to
compare against for each game before implementing (for RFDGameStudio
games, likely games/{slug}/ or ts/src/games/{slug}/ -- confirm via source
read which is authoritative for freshness purposes, do not assume).

### Section 2c -- deployed_version in game-metadata.json

Extends this session's earlier RFDGameStudio_PipelineStageTracking_Directive.md
(confirm whether that directive has already landed by the time this one
runs -- if so, add deployed_version alongside the pipeline_stage field it
introduced; if not, this directive can introduce both together, but
report which situation was actually found). On real, verified successful
studio_deploy_arcade completion, read the game's actual current VERSION
file and record it as deployed_version.

### Section 2d -- games.yaml cleanup

Remove antsim and greengap entries. For horse_racing: CONFIRM VIA REAL
EVIDENCE WHETHER IT IS ACTUALLY LIVE ON ITCH.IO before adding an entry --
check rdug627.itch.io/horse_racing or equivalent, do not invent a slug. If
it's not actually published yet, report that rather than adding a
speculative config entry for something that doesn't exist.

### Section 2e -- Resolve the Phase 4 redundancy, explicitly

Recommendation, not a silent decision -- confirm with Robert before
implementing this specific piece: RFD_IT_Publishing's own "Phase 4:
rfditservices.com via SFTP" should be marked explicitly SUPERSEDED BY
studio_deploy_arcade, not built as a second, competing mechanism in a
different repo. Update docs/state/current.md to say so plainly, so a
future session doesn't see "NOT STARTED" and think it's real, open work.

RULE: This one piece of Section 2e is a judgment call flagged for
confirmation, not an instruction to implement without checking --
everything else in this directive is real, confirmed work; this specific
recommendation should be surfaced back to Robert explicitly in the
completion report before being treated as settled.

### Section 2f -- Cross-repo version-consistency report

Real, cross-repo report: for every real game, compare VERSION (source of
truth) against deployed_version (game-metadata.json) and, where possible,
itch.io's actual last-pushed version (via butler status {slug}:{channel}
-- confirm this is a real, working Butler command against the actual
installed version before relying on it, do not assume the exact output
format).

RULE: Confirm butler status (or the real, correct equivalent command for
querying a channel's current live state) actually works and produces
parseable output before building parsing logic around it -- this is new
territory this session has not verified, unlike everything else in this
directive. If it doesn't work cleanly, report that honestly and propose
comparing only VERSION vs. deployed_version for now, with itch.io's real
side flagged as a known, real gap rather than faked.

---

## Section 3 -- Test Anchors

| Test name | Target | Behaviour |
|---|---|---|
| test_is_dist_stale_true_when_source_newer | Freshness check | dist older than source -> True |
| test_is_dist_stale_false_when_dist_newer | Freshness check | dist newer than source -> False |
| test_studio_deploy_arcade_fails_on_stale_dist | tools.py | Real, mocked stale case -> clean failure, not a crash |
| test_itchio_push_fails_on_stale_dist | itchio.py | Same pattern, itch.io side |
| test_itchio_push_passes_userversion | itchio.py | Confirm the real constructed butler command includes --userversion {VERSION} |
| test_deployed_version_recorded_on_real_success | game_metadata.py | Successful deploy -> deployed_version matches real VERSION; failed deploy -> untouched |
| test_games_yaml_no_placeholder_entries | config/games.yaml | Real parse confirms antsim/greengap are gone |

---

## Section 4 -- Completion Criteria

- [ ] Real freshness check implemented identically in both deploy paths,
      confirmed via real test + a real live demonstration
- [ ] --userversion confirmed real in the actual constructed butler
      command, with the real VERSION value
- [ ] deployed_version confirmed recording correctly on real success,
      confirmed absent/unchanged on real failure
- [ ] games.yaml cleaned, horse_racing either added with real confirmed
      evidence or explicitly reported as not-yet-live
- [ ] Section 2e's redundancy recommendation surfaced explicitly for
      Robert's confirmation -- not silently implemented
- [ ] Cross-repo version report built and run for real against all real
      current games, real output pasted
- [ ] Intake->VERSION seam recording confirmed working for at least one
      real or realistic test case
- [ ] Full test suites in both repos still green
- [ ] git diff --stat in both repos confirms only the files in Section 1
      touched

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Three disconnected version concepts | Intake (0.1.0R1), VERSION file (2.31.0), Butler's own auto-counter |
| Shared root cause of staleness risk | Both deploy paths explicitly skip build-freshness checking |
| Live, confirmed-real instance of the risk | dist-slimeworld, 6 days stale relative to source, at time of writing |
| Fix philosophy | Fail loudly on staleness, do not auto-rebuild |
| Judgment call, needs Robert's confirmation | Section 2e -- marking RFD_IT_Publishing Phase 4 as superseded |
| Unverified going in, must confirm first | Whether butler status is a real, usable command |
| Builds on | This session's earlier RFDGameStudio_PipelineStageTracking_Directive.md |
