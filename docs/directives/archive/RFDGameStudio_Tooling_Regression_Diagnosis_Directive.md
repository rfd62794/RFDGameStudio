# RFDGameStudio — Directive: Diagnose Deploy Verification Crash + Date-Tracking Regression

*Repo: C:\Github\RFDGameStudio. Two separate, real bugs found during
tonight's final deploy — not tuning, not balance, real tooling
regressions. Version bump to 2.25.0 required, see §5.*

---

> ⛔ **STOP:** Do not touch anything in `games/shoal/` — none of this
> relates to gameplay/balance work. Both issues are in `studio_mcp/`
> support tooling.

---

## §0 Bug 1 — `studio_deploy_arcade` Crashes With an Unhelpful Generic Error

Confirmed by direct trace and two live reproductions tonight:
`rfd-studio:studio_deploy_arcade` fails with `'NoneType' object is not
subscriptable` on every call, with no indication of where. Static reading
of `verify_arcade_deploy()`, `check_renders()`, `check_http_reachable()`,
and `get_embed_games()` in `studio_mcp/verify.py` did not reveal a
certain root cause — every path traced appeared correctly guarded. The
actual deploy was completed tonight by bypassing the tool entirely and
running the copy/hugo/SFTP steps directly via PowerShell — real, but not
a fix, and not repeatable without hands-on intervention every time.

**A second, independent, more urgent bug exists regardless of the exact
NoneType cause:** `verify.py`'s own docstring states verification "does
not raise on failures... folded into `studio_deploy_arcade()` for human
review" — meaning it's designed to be non-blocking. But
`studio_deploy_arcade()` in `tools.py` calls `verify_arcade_deploy()`
without wrapping it in its own try/except — so if verification itself has
*any* bug, however small, it takes the entire deploy down with it,
directly contradicting its own documented intent. This happened twice
tonight, blocking a real, time-sensitive deploy both times.

### §0.1 Fix Part A — Defensive Wrapping (do this regardless of root cause)

In `studio_deploy_arcade()`, wrap the verification call so a bug in
verification can never again block the actual deploy:

```python
try:
    verification = verify_arcade_deploy()
except Exception as exc:
    verification = {
        "ok": False,
        "error": f"verification itself failed: {exc}",
        "games": {},
    }
```

> ⚠️ RULE: This is not "fixing" the underlying bug — it's ensuring the
> underlying bug can never again block a real deploy while it's being
> found. Both fixes are needed; this one is the more urgent, since it
> prevents tonight's actual incident from recurring even before the root
> cause is found.

### §0.2 Fix Part B — Find and Fix the Actual Root Cause

Add fine-grained, location-tagged error handling through
`verify_arcade_deploy()`, `check_renders()`, `check_http_reachable()`, and
`get_embed_games()` — wrap each logically distinct section in its own
try/except that reports exactly which section and which variable was
`None`, rather than one broad catch that produces a generic message.
Reproduce the failure with this instrumentation in place, get a real
traceback pointing at the actual line, fix that specific line, then
remove the extra instrumentation once confirmed fixed (don't leave
debug-only scaffolding in permanently).

## §1 Bug 2 — Date-Tracking Silently Broken for the Main Repo

Confirmed directly: `ts/src/games/game-metadata.json` shows
`tracked: false` and empty `created`/`last_updated` for every game except
`slimebreeder` (which lives in an external repo and is tracked
correctly). `VERSION` values are correct (`shoal` shows `2.24.0`
accurately), so only the git-log-derived date portion of
`studio_mcp/game_metadata.py` is affected — something about querying git
history for paths inside the main `RFDGameStudio` repo itself is failing
silently for every single game, not just one.

**Real consequence, not cosmetic:** the lobby's status-tier-then-recency
sort depends on these dates. With every stable-tier game showing an
identical empty `last_updated`, ties fall back to registry array order —
meaning Shoal, despite being the most actively developed game in the
entire studio tonight, does not actually sort first. The sort logic
itself is correct; the data feeding it is broken.

### §1.1 Diagnosis Steps

1. Manually run the exact `git log -1 --format=%cI -- games/shoal` command
   (and the `ts/src/games/shoal` equivalent) directly in the repo root —
   confirm whether it produces real output on its own, outside the
   Python wrapper. If it does, the bug is in how `game_metadata.py`
   invokes/parses the subprocess. If it doesn't, something about the
   repo state itself (uncommitted changes, detached state, wrong cwd)
   is the actual cause.
2. Check whether `write_game_metadata()`'s subprocess calls specify the
   correct working directory — a `cwd` pointing at the wrong location
   would silently produce empty output for every git command without
   raising, matching exactly what's observed.
3. Confirm `slimebreeder`'s working entry isn't coincidental — it queries
   a *different* repo path than everything else, which is a real,
   isolatable variable worth testing directly against.

### §1.2 Fix

Once the root cause is identified, fix it and regenerate the metadata via
a real `studio_build()` call — confirm every game (not just slimebreeder)
shows real, non-empty `created`/`last_updated` values afterward.

## §2 Version

Bump `games/shoal/VERSION` — wait, this is out of scope for a
`studio_mcp/` tooling fix; do not bump `games/shoal/VERSION` for this
directive. Instead, confirm whichever versioning convention applies to
`studio_mcp/` tooling itself, if one exists; if none does, note that
explicitly rather than silently skipping version tracking for this fix.

## §3 Verification

1. Re-run `studio_deploy_arcade` for real — confirm it completes without
   the generic NoneType error, whether via the defensive wrap alone or
   the actual root-cause fix.
2. Confirm the real root cause of the NoneType error is identified and
   reported, not just papered over by the defensive wrap.
3. Confirm `game-metadata.json` shows real dates for every game after a
   fresh `studio_build()`, not just `slimebreeder`.
4. Confirm Shoal now genuinely sorts first among stable-tier games in the
   live lobby — a real visual/data check, not just "the sort function is
   correct."

## §4 Completion Criteria

- [ ] `studio_deploy_arcade` no longer crashes on a verification bug — defensive wrap in place
- [ ] Actual root cause of the NoneType error found and fixed, not just masked
- [ ] Date tracking works for every game in the main repo, not just the externally-hosted one
- [ ] Shoal confirmed sorting first in the live lobby, matching its actual recency
- [ ] No changes made to any gameplay/balance file
