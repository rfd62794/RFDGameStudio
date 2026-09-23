# RFDGameStudio -- Directive: Pipeline Stage Tracking

*August 2026 | Read fully before executing anything. This is a small,
additive extension to an already-working system, not a build-system
redesign -- confirmed this session that both prior known bugs in the
underlying metadata tooling (the git-ownership tracked:false issue, and
studio_deploy_arcade's stale-service crash) are already resolved. This
directive builds on solid ground.*

---

> STOP: Confirm the real, current content of
> ts/src/games/game-metadata.json before touching anything -- read every
> real entry, confirm tracked: true still holds for all real games. If it
> does not, stop and report; this directive assumes a healthy foundation.

---

## Section 0 -- Context

The real, repeated friction, confirmed by Robert directly, not
hypothesized: every game goes through the same mandatory three-hop
sequence -- generated in Google AI Studio -> extracted from a zip -> ported
onto the website (rfditservices.com/arcade) -> polished/edited -> ported
again to itch.io -> polished/edited again. This is not a future concern,
it is something that already happened, repeatedly, across this studio's
real history (Shoal, SlimeWorld, and others all went through exactly
this).

The actual gap, precisely: nothing tracks WHERE a given game currently
sits in that sequence. game-metadata.json already tracks created and
last_updated per game, real and working, automatically derived from git
log -- but neither field says whether a game has actually reached the
website yet, or itch.io, or is still sitting as a raw AI Studio
extraction. That is the consistency gap, not a missing build tool.

Already real, already named, from a session two days prior (July 31) --
use this terminology, do not invent new names: Stage 1 = AI Studio build,
touched up, ported onto the website's Collection. Stage 2 = an
already-Collection-resident project, further polish, published to itch.io.

Not in scope, deferred:
- Any change to the actual porting/polishing work itself -- that stays a
  real, manual, creative step. This directive tracks THAT it happened,
  not automates HOW it happens.
- Any change to studio_deploy_arcade's or the itch.io butler push
  pipeline's own internal logic -- both confirmed working; this directive
  only adds a side effect (updating the tracking field) to each, not a
  rewrite of either.
- A full unified build system across Hugo/Arcade/Itch -- explicitly
  considered and explicitly not what this is; this is a state field, not
  a pipeline redesign.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| ts/src/games/game-metadata.json | Modify (schema, additive) | Add a pipeline_stage field to every real game entry |
| Whatever tool actually performs studio_deploy_arcade | Modify (narrow) | On real success, set pipeline_stage: "website_collection" for the deployed game |
| Whatever tool actually performs the itch.io butler push | Modify (narrow) | On real success, set pipeline_stage: "itch_published" for the published game |
| A small new query/report tool (e.g. scripts/pipeline_status.py, confirm the project's real convention) | New | Lists every real game and its current pipeline_stage, grouped, so a gap is visible at a glance |

Read-only -- do not touch: The actual deploy/build/publish logic itself in
either tool -- only add the metadata-write side effect, do not touch how
either tool does its real job.

---

## Section 2 -- Implementation

### game-metadata.json -- additive field

```json
{
  "shoal": {
    "tracked": true,
    "created": "2026-07-10T23:02:49-04:00",
    "last_updated": "2026-07-28T22:40:50-04:00",
    "pipeline_stage": "itch_published"
  }
}
```

Real enum, three values only: "ai_studio", "website_collection",
"itch_published". Default for any game not yet explicitly set: "ai_studio"
(the earliest real stage -- a game that has never been touched by either
deploy tool is still sitting where it started).

RULE: Confirm the real, current value for every one of the 12 existing
games by checking actual evidence (is it live on the Arcade right now? Is
it live on itch.io right now?) before setting an initial value -- do not
default every existing game to "ai_studio" blindly, that would be
factually wrong for games already known to be live (Shoal, VoidRift, and
others are confirmed live on itch.io this session alone). Report the real
initial value assigned to each game and how it was confirmed.

### Wiring into the real deploy/publish tools

RULE: Locate the actual, real source of studio_deploy_arcade and whatever
performs the itch.io butler push step before writing anything -- confirm
exact file/function via source read, do not assume based on tool names
alone. Add the metadata write as the very last step, only on confirmed
real success (matching the same HTTP-verification-after-deploy discipline
already used elsewhere in this studio's history) -- a failed deploy must
never advance the tracked stage.

RULE: A game reaching itch_published does not mean it stays there forever
untouched -- a real future re-polish pass on an already-published game is
a legitimate, real event, not a regression. Do not build logic that treats
stage transitions as one-way-only in a way that would fight a real future
workflow; the field just reflects current real status, it does not need
to enforce a strict forward-only state machine.

### scripts/pipeline_status.py

```python
"""Report every real game's current pipeline stage, grouped, so a gap
is visible at a glance rather than requiring manual cross-referencing."""
import json
from pathlib import Path
from collections import defaultdict

METADATA_PATH = Path("ts/src/games/game-metadata.json")

def main():
    data = json.loads(METADATA_PATH.read_text())
    by_stage = defaultdict(list)
    for game, info in data.items():
        stage = info.get("pipeline_stage", "ai_studio")
        by_stage[stage].append(game)

    for stage in ["ai_studio", "website_collection", "itch_published"]:
        games = by_stage.get(stage, [])
        print(f"\n{stage} ({len(games)}):")
        for g in sorted(games):
            print(f"  - {g}")

if __name__ == "__main__":
    main()
```

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_pipeline_stage_defaults_to_ai_studio | A game entry with no pipeline_stage key reads as "ai_studio", not an error |
| test_arcade_deploy_sets_website_collection_on_real_success | Mock a successful deploy, confirm the metadata write happens; mock a FAILED deploy, confirm it does NOT |
| test_itch_publish_sets_itch_published_on_real_success | Same pattern, for the itch.io side |
| test_pipeline_status_report_groups_correctly | Given a known real metadata fixture, confirm the report's grouping and counts are correct |
| test_existing_metadata_fields_unaffected | created/last_updated/tracked still read correctly after this change -- purely additive, nothing else in the schema breaks |

---

## Section 4 -- Completion Criteria

- [ ] Real, current initial pipeline_stage assigned to every one of the 12
      existing games, each confirmed via real evidence (not defaulted
      blindly), reported explicitly
- [ ] Both deploy/publish tools confirmed to write the metadata update
      only on real, verified success -- demonstrated live if possible, not
      just code-reviewed
- [ ] scripts/pipeline_status.py (or equivalent) run for real, output
      pasted, confirms it correctly reflects the real current state of all
      12 games
- [ ] All test anchors passing
- [ ] git diff --stat confirms only the files in Section 1 touched -- no
      drift into the actual deploy/build logic itself
- [ ] Full existing test suite (per the separate test-scoping directive,
      if that has landed by the time this runs -- otherwise the real full
      suite) still green, confirming this purely-additive change broke
      nothing

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| The real, repeated friction | Every game: AI Studio -> extract -> website port/polish -> itch port/polish, no tracking of current position |
| Confirmed healthy foundation | game-metadata.json shows tracked: true for all 12 real games; studio_deploy_arcade confirmed working this session |
| Terminology, already real, do not invent new | "Stage 1" (website/Collection), "Stage 2" (itch.io) -- named in a July 31 session |
| The fix | One additive pipeline_stage field, set as a side effect of real successful deploy/publish actions -- not auto-derived like created/last_updated |
| Explicitly NOT in scope | Any change to the actual porting/polishing work, any rewrite of the deploy/publish tools' own logic, a unified Hugo/Arcade/Itch build system |
