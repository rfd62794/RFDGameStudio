# RFDGameStudio — Directive: Fix Live-Site Deploy Silent Failure, Simplify Verification

*July 2026 | Read fully before touching anything.*

---

> ⛔ **STOP:** This is a different function and a different bug than the
> last directive. `studio_promote_to_examples()` (already built, working
> correctly, confirmed) targets `local-arcade-preview/`. This directive
> is about `studio_deploy_arcade()`, which targets the live site repo's
> `static/arcade/{name}/` and then SFTPs to production. Do not conflate
> the two — they are separate deploy paths with separate bugs.

---

## §0 Context

`studio_deploy_arcade()` reported full success twice in a row — clean
`build` and `deploy` dicts, no `error` key — while `static/arcade/
corpworld/` never actually existed in the site repo either time.
`examples/corpworld/dist/index.html` was confirmed present both times.
`_EXAMPLE_DEMOS`, `_DEMO_SOURCE_PATHS`, and `_DEMO_STATIC_NAME` are all
correctly configured for corpworld. The failure is specifically that
`shutil.copytree(demo_dist, demo_target)` inside the per-demo loop is
not raising an exception on failure, so the function's own success
report is meaningless — it reports "done" regardless of whether the
copy actually happened. Confirmed live: `https://rfditservices.com/
arcade/corpworld/` still returns 404 as of this directive.

**Separately, per direct instruction:** HTTP-level (Tier 1) verification
is sufficient going forward. The Tier 2 Playwright render check has been
failing with the same unrelated error — "Playwright Sync API inside the
asyncio loop" — on every single game, every single run, all night,
including games already confirmed working by direct HTTP check. It adds
noise without adding signal and should be de-scoped, not fixed.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/tools.py` | Modify | `studio_deploy_arcade()` — verify each copytree actually succeeded before reporting success (§2.1) |
| `studio_mcp/verify.py` | Modify | Remove or fully de-scope the Tier 2 Playwright render check from `verify_arcade_deploy()` — HTTP-level checks only (§2.2) |
| `studio_mcp/intake.py`, `studio_mcp/server.py` | Read-only | Confirmed correct in the prior directive's work — not touched here |
| The site repo's `deploy_smart.py` | Read-only | Confirmed correct (manifest diffing logic is sound) — the bug is entirely upstream of this file, in what gets handed to it |

---

## §2 Implementation

### §2.1 — `studio_deploy_arcade()`: verify copytree actually worked

Same pattern `studio_promote_to_examples()` already uses correctly —
apply it here too, since this function was built before that pattern
existed.

```python
for demo_slug in _EXAMPLE_DEMOS:
    demo_dist = _DEMO_SOURCE_PATHS[demo_slug] / "dist"
    static_name = _DEMO_STATIC_NAME[demo_slug]
    demo_target = _SITE_REPO_PATH / "static" / "arcade" / static_name
    if demo_target.exists():
        shutil.rmtree(demo_target)
    shutil.copytree(demo_dist, demo_target)

    # NEW: verify the copy actually landed before moving on
    if not demo_target.exists() or not (demo_target / "index.html").exists():
        return {
            "error": f"copytree reported no exception but {demo_target} "
                     f"is missing or has no index.html after copying from "
                     f"{demo_dist}. Deploy aborted before SFTP step.",
            "tool": "studio_deploy_arcade",
            "failed_demo": demo_slug,
        }
    copied_files += sum(1 for _ in demo_target.rglob("*") if _.is_file())
```

> ⚠️ RULE: this check must abort the ENTIRE deploy (return early with an
> error) rather than continuing to the next demo or proceeding to the
> Hugo build/SFTP step. A partial static/arcade/ directory should never
> reach the SFTP step — better to fail loudly here than deploy a broken
> subset to production.

> ⚠️ RULE: do not attempt to diagnose or fix WHY `shutil.copytree` fails
> silently for this specific case as part of this directive — that's a
> deeper investigation (possibly Windows file-locking, possibly a race
> condition with a process still holding a handle from a prior build
> step) that's out of scope here. The job in this phase is to make the
> failure loud and stop the deploy, not to eliminate the underlying
> cause. If it keeps failing after this fix, that's real, useful
> information — better to see it than to have it silently reported as
> success.

### §2.2 — Simplify `verify_arcade_deploy()` to HTTP-only

Remove `check_renders()` (the Playwright/Tier 2 step) from the
verification flow entirely, or gate it behind an explicit opt-in
parameter that defaults to off. `verify_arcade_deploy()`'s overall `ok`
status should be determined entirely by `check_http_reachable()` and
`get_embed_games()` — Tier 1 only.

> ⚠️ RULE: do not attempt to fix the underlying Playwright Sync-API-in-
> asyncio-loop bug as part of this directive. It's being de-scoped, not
> repaired — don't spend directive time on a check that's being removed.

---

## §3 Verification

Per standing convention — no completion claim without the actual pasted
state, not a narrative summary.

- [ ] Paste the modified `studio_deploy_arcade()` copytree-verification
      block as actually shipped
- [ ] Run `studio_deploy_arcade()` for real and paste the actual
      returned dict — if corpworld's copy still silently fails, the
      new error should surface clearly with `failed_demo: "corpworld"`,
      not a false-success report
- [ ] If the copy succeeds this time: paste a direct HTTP check (curl,
      `Invoke-WebRequest`, or equivalent) confirming
      `https://rfditservices.com/arcade/corpworld/` returns 200, not
      just the tool's own self-reported status
- [ ] Paste the modified `verify_arcade_deploy()` showing Tier 2 removed
      or gated off, and confirm `ok` status no longer depends on it
- [ ] Confirm via diff: `intake.py`, `server.py`, and `deploy_smart.py`
      unmodified

---

## §4 Completion Criteria

- [ ] `studio_deploy_arcade()` verifies each copytree before reporting
      success; a real failure now returns a clear `error` +
      `failed_demo`, not a silent false-positive
- [ ] Live corpworld deploy either genuinely succeeds (confirmed via
      direct HTTP check, not just the tool's own report) or fails
      loudly with a diagnosable error — either outcome is acceptable,
      "reports success while doing nothing" is the only unacceptable one
- [ ] `verify_arcade_deploy()` no longer blocked or noised by the
      Playwright render check
- [ ] `intake.py`, `server.py`, `deploy_smart.py` unmodified

---

## §5 Quick Reference

| Item | Before | After |
|---|---|---|
| `studio_deploy_arcade()` copytree failure | Silent — reports success regardless | Verified — aborts with a clear error if the copy didn't land |
| Deploy proceeding on partial copy | Possible — SFTP step ran even with corpworld missing | Blocked — partial `static/arcade/` never reaches SFTP |
| Tier 2 Playwright render check | Fails on every game, every run, unrelated asyncio bug | Removed/de-scoped from `ok` determination |
| Verification standard | HTTP + broken render check | HTTP-level only, per direct instruction |

---

*RFD Method Directive | RFD IT Services Ltd. | July 2026*
*Fail loud, not silent. HTTP-level verification is enough.*
