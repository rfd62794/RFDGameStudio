# RFDGameStudio — Phase 2b Directive: No-Zip Verification Path

*August 30 2026 | Read `docs/directives/RFDGameStudio_ZipVerifier_Phase2_Directive.md`
in full before this one — that directive is certified and this one extends
it, does not replace it. Stage 2 (`studio_mcp/zip_verify/`) currently
assumes every game arrives as a zip under `intake/{slug}/`. Tonight's
pipeline audit found that assumption is false for the majority of the
registry — 8 of 30 games have no intake zip at all, PlanetForge being the
one that surfaced the gap, not the exception.*

---

> ⛔ **STOP:** Confirm the real current shape before writing anything.
> `intake/` has exactly 6 slugs with zips (`7-days-to-fry`, `antsim-redux`,
> `corpworld`, `facility-escape`, `kingmaker-squads`, `slimegarden`). The
> registry (`ts/src/games/registry.ts`) imports 30 configs. Every game
> without a matching `intake/` zip source lives directly under
> `examples/{slug}/`, and as of tonight all of them are git-tracked
> (previously they were not — a separate, already-closed gap). Run
> `git log --oneline -- examples/{slug}` for a few of these
> (`antsim-redux`, `facility-escape`, `slimegarden`, `dissonance-prototype`)
> and confirm each shows exactly 1 commit right now — if any show more,
> report that, don't assume it matches this document.

---

## §0 Context

**What this phase delivers:** a second verification path in
`studio_mcp/zip_verify/`, alongside the existing zip-based one, for games
whose source lives directly in a tracked `examples/{slug}/` directory
with no `intake/` zip. This is not a new module — it's a second entry
point into the same components already built and certified in Phase 2.

**Why this is honestly a smaller lift than it sounds:** four of Stage
2's five components don't care whether their input came from an extracted
zip or a live tracked directory — `concept_grep.py` (source-directive
lookup), `caller_check.py` (changed-function call-site check),
`verdict_synthesizer.py` (the OpenRouter call), and `report.py` all
operate on a file tree, not on zip-specific mechanics. Only
`zip_reader.py` (extraction) and `revision_diff.py` (zip-revision
comparison) are zip-specific and need a real no-zip counterpart.

**What's honestly different, not just relabeled:** `revision_diff.py`'s
existing logic compares two zip revisions by filename convention
(`{slug}_v{version}R{n}.zip`). For a tracked `examples/` directory, the
equivalent is `git log -p -- examples/{slug}` between the two most recent
commits touching that path — a different mechanism, not a zip-parsing
call with the path swapped. As confirmed by tonight's STOP-rule check,
every one of these 8 games currently has exactly one commit, so this path
will correctly return the same `no_prior_revision: True` result Stage 2
already treats as valid, not an error — this is prospective infrastructure
for future edits, not something that unlocks a backlog of retroactive
diffs that don't exist.

**Explicitly NOT in scope:**
- Retroactively reconstructing history for these 8 games' pre-tonight
  changes. That history doesn't exist and can't be recovered — tonight's
  tracking commit is genuinely the first real commit for each.
- Any change to the existing zip-based path — it stays exactly as
  certified in Phase 2.
- Auto-detecting which path to use based on file-existence heuristics
  alone without a fallback report — see the rule in §2.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/zip_verify/source_resolver.py` | New | Given a slug, determines whether it has an `intake/` zip, a tracked `examples/{slug}/` directory, or neither — returns a typed result, never a silent guess |
| `studio_mcp/zip_verify/tracked_dir_diff.py` | New | `git log`-based revision comparison for a tracked `examples/{slug}/` path — the no-zip counterpart to `revision_diff.py` |
| `studio_mcp/zip_verify/zip_reader.py` | Read-only | Unchanged from Phase 2 |
| `studio_mcp/zip_verify/revision_diff.py` | Read-only | Unchanged from Phase 2 |
| `studio_mcp/zip_verify/concept_grep.py`, `caller_check.py`, `verdict_synthesizer.py`, `report.py` | Modify (additive only) | Accept either a zip-extraction path or a tracked-directory path as input — same interface, new source, no change to their internal logic |
| `studio_mcp/zip_verify/tests/test_source_resolver.py`, `test_tracked_dir_diff.py` | New | Per §3 |

> ⚠️ RULE: `source_resolver.py` must return one of four states —
> `zip_source`, `tracked_dir_source`, `both` (real and expected, NOT
> an error — confirmed tonight that `facility-escape`, `antsim-redux`,
> `slimegarden`, and `7-days-to-fry` all have both a historical intake
> zip AND a tracked examples/ dir with real post-import evolution), or
> `no_source_found`. For `both`, the tracked directory is the current
> state and takes precedence for verification — the zip is historical
> origin, useful for concept_grep's source-directive lookup, not the
> thing to verify current code against. Do not stop/error on `both` as
> if rare or invalid; it is expected for any game touched since import.

---

## §2 Implementation

### `source_resolver.py`

Responsibility: given a game slug, check `intake/{slug}/*.zip` and
`examples/{slug}/` (accounting for the real naming mismatches already
known — `slimebreeder` vs `SlimeBreeder`, hyphen vs underscore between
registry slugs and `examples/` directory names) and return which real
source exists, if any.

### `tracked_dir_diff.py`

Responsibility: for a tracked `examples/{slug}/` path, run
`git log --oneline -- examples/{slug}` to find prior commits. Zero or one
commit → `no_prior_revision: True`, same honest result Stage 2 already
returns for single-revision zips. Two or more → diff the two most recent
via `git diff` on that path, extract changed function names the same way
`revision_diff.py` does for zip revisions.

> ⚠️ RULE: Do not treat the tracking commit itself (the one that added the
> file for the first time) as a "prior revision" to diff against a
> hypothetical earlier state. There is no earlier state. One commit is
> one commit.

---

## §3 Test Anchors

| Test name | Behaviour |
|---|---|
| `test_source_resolver_finds_zip_source` | A slug with an `intake/` zip (e.g. `antsim-redux`) resolves to `zip_source` |
| `test_source_resolver_finds_tracked_dir_source` | A slug with only a tracked `examples/` dir (e.g. `facility-escape`) resolves to `tracked_dir_source` |
| `test_source_resolver_reports_no_source_found` | A slug matching neither resolves honestly, not silently |
| `test_source_resolver_handles_naming_mismatch` | `slimebreeder` (registry) correctly resolves against `examples/SlimeBreeder` (real dir casing) |
| `test_tracked_dir_diff_single_commit_is_no_prior_revision` | Real, current `examples/antsim-redux` (1 commit) returns `no_prior_revision: True`, not an error |
| `test_tracked_dir_diff_finds_real_diff_with_two_commits` | Constructed fixture with 2 real commits on a temp path produces a non-empty diff |

Target: X passing, 0 failing, 0 skipped, real count reported.

**Separately, live smoke test required at completion, same standard as
Phase 2:** run the no-zip path against one real game (`facility-escape`
is a good choice — real, tracked, single commit, matches the honest
`UNVERIFIABLE`-by-default case) and paste the real verdict and raw
OpenRouter response, not a summary.

---

## §4 Completion Criteria

- [ ] `source_resolver.py` correctly classifies all 8 no-zip games plus
      all 6 zip-based games, real output pasted for all 30 registry slugs,
      not a sample
- [ ] Naming-mismatch cases (`slimebreeder`/`SlimeBreeder`, hyphen vs
      underscore) confirmed handled, not silently broken
- [ ] `tracked_dir_diff.py` correctly reports `no_prior_revision: True`
      for all 8 currently-single-commit games — confirmed via real run,
      not assumed from this document
- [ ] Existing zip-based path's tests still pass unchanged — confirm via
      diff that `zip_reader.py`/`revision_diff.py` were not modified
- [ ] Live smoke test against `facility-escape` run for real, raw verdict
      pasted
- [ ] Full existing Stage 1 + Stage 2 test suites still pass, real count
      reported

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Games with intake zip (existing path, unchanged) | 6: 7-days-to-fry, antsim-redux, corpworld, facility-escape, kingmaker-squads, slimegarden |
| Games needing the new no-zip path | 8: real count from `source_resolver.py`'s own output, don't assume the list from memory |
| Real current commit count for all 8, tonight | 1 each — no prior revision available yet, by design, not a bug |
| Components reused unmodified in logic (interface-only change) | concept_grep, caller_check, verdict_synthesizer, report |
| Components genuinely new | source_resolver, tracked_dir_diff |
| Not this phase | Reconstructing pre-tonight history that doesn't exist |

---

*RFD Method | Phase 2b | RFDGameStudio Zip Verifier — No-Zip Extension | August 2026*
*Director → Pipeline → Agent. The gap PlanetForge surfaced, closed for the tool itself, not just worked around once.*
