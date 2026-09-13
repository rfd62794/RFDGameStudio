# RFDGameStudio — Directive: Harden embedUrl Deploy Verification

*Repo: C:\Github\RFDGameStudio. Tier 1 + Tier 2 only — Tier 3 is a
documented extension point, not in scope tonight.*

---

> ⛔ **STOP:** This folds into `studio_deploy_arcade()`'s existing output —
> it is not a separate CI gate, not a blocking pre-deploy check that
> prevents deploy from running. It adds real information to the same
> report Robert already reviews before signing off. Do not make deploy
> fail outright on a Tier 2 finding; surface it clearly and let the human
> decide, same as every other verification in this pipeline tonight.

---

## §0 Context

Every real bug caught in the embedUrl tier this session was discovered by
a human clicking through — the deploy that never ran, the four demos
404ing both locally and in production, Shoal's invisible-creature padding
bug. None of these needed a person to catch structurally; they needed
someone to actually load the page and look. This directive automates the
"actually load the page and look" step, run automatically on every deploy,
without replacing human judgment on anything genuinely ambiguous.

## §1 Scope Statement

| Item | Action |
|---|---|
| `studio_mcp/verify.py` (new) | Tier 1 (HTTP) + Tier 2 (headless browser) checks |
| `studio_mcp/tools.py` | Call verification at the end of `studio_deploy_arcade()`, fold results into its return value |
| `screenshots/arcade-verify/` (new, gitignored) | Per-deploy screenshot archive |
| `.gitignore` | Add `screenshots/arcade-verify/` |
| Everything else | Do not touch |

## §2 Tier 1 — HTTP Reachability

For every `embedUrl` entry in `GAME_REGISTRY`, plus `voiddrift`'s
`embedUrl`, plus the main `/arcade/rfdgamestudio/` path itself:

```python
import re
import requests
from pathlib import Path

def check_http_reachable(base_url: str, deployed_path: Path) -> dict:
    """Fetch the deployed index.html, confirm 200, then parse and fetch
    every referenced script/stylesheet, confirming those are 200 too."""
    index_path = deployed_path / "index.html"
    if not index_path.exists():
        return {"ok": False, "reason": "index.html not found in deployed output"}

    html = index_path.read_text(encoding="utf-8")
    asset_paths = re.findall(r'(?:src|href)="([^"]+\.(?:js|css))"', html)

    results = {"index": True, "assets": {}}
    for asset in asset_paths:
        # asset paths are typically root-relative (e.g. /arcade/brewfield/assets/index-XXXX.js)
        asset_file = deployed_path.parent.parent / asset.lstrip("/")
        results["assets"][asset] = asset_file.exists()

    all_ok = results["index"] and all(results["assets"].values())
    return {"ok": all_ok, "index": results["index"], "assets": results["assets"]}
```

> ⚠️ RULE: Check the deployed file's existence on disk, not a live HTTP
> request to the production URL — this runs as part of the local
> build/deploy step, before anything is actually pushed live. Confirming
> the files exist where they need to be is the correct check at this
> stage; the SFTP push itself is a separate, already-verified step.

## §3 Tier 2 — Headless Browser Confirmation

Using Playwright, already proven working in this environment tonight for
Ledger and Shoal's diagnosis:

```python
from playwright.sync_api import sync_playwright

def check_renders(local_preview_url: str, game_id: str, screenshot_dir: Path) -> dict:
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        page.goto(local_preview_url, wait_until="networkidle", timeout=15000)
        root_content = page.evaluate("document.getElementById('root')?.innerHTML.length || 0")

        screenshot_path = screenshot_dir / f"{game_id}.png"
        page.screenshot(path=str(screenshot_path))
        browser.close()

    return {
        "ok": root_content > 0 and len(errors) == 0,
        "root_has_content": root_content > 0,
        "console_errors": errors,
        "screenshot": str(screenshot_path),
    }
```

Run this against the local static-mirror preview setup already established
earlier tonight (§4 of the deploy-fix directive), not against production —
same reasoning as Tier 1, catch it before it's live.

> ⚠️ RULE: Be honest about this tier's real limit, already proven tonight
> — a non-empty root div does NOT mean the content is correctly *sized* or
> *visible*. Shoal's padding bug had real DOM content with zero rendered
> size, and this check would have passed it. This tier catches "nothing
> rendered at all," not "rendered wrong." That gap is exactly what Tier 3
> would close, and it's why Tier 3 stays a documented extension point
> rather than being skipped as unnecessary.

## §4 Fold Into `studio_deploy_arcade()`

Add a verification pass after the existing copy/build steps, before the
function returns — same report Robert already reviews, more informative:

```python
def studio_deploy_arcade() -> dict:
    # ...existing copy + hugo build logic unchanged...

    verification = {}
    for game in GAME_REGISTRY:
        if game.embed_url:
            verification[game.game_id] = {
                "http": check_http_reachable(game.embed_url, deployed_path_for(game)),
                "render": check_renders(local_preview_url_for(game), game.game_id, SCREENSHOT_DIR),
            }

    return {
        # ...existing return fields...
        "verification": verification,
    }
```

## §5 Verification (of the verification tooling itself)

1. Run against a known-good deployed demo (Brewfield or VoidRift) — confirm
   both tiers report `ok: true`.
2. Deliberately break something — rename an asset file, or point an
   `embedUrl` at a nonexistent path — confirm Tier 1 catches it.
3. If reproducible: confirm Tier 2's documented gap is real, not
   theoretical — verify that a zero-size-but-present element genuinely
   passes this check, so the limitation note in §3 is accurate rather than
   just cautious.
4. Confirm this does not block or fail `studio_deploy_arcade()` outright —
   it should always complete and return its report, even when verification
   finds real problems.

## §6 Completion Criteria

- [ ] Tier 1 checks index.html + every referenced asset for every embedUrl game
- [ ] Tier 2 runs headless, checks console errors + non-empty root, archives a screenshot
- [ ] Both folded into `studio_deploy_arcade()`'s existing return value, not a separate gate
- [ ] Deploy still completes and reports even when verification finds problems
- [ ] Tier 2's real limitation (size-blind) is documented in code, not just this directive
- [ ] Tier 3 explicitly left as a future extension point, not built
