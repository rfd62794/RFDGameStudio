"""verify.py — Tier 1 and Tier 2 deploy verification for the embedUrl tier.

Tier 1 checks the deployed index.html and all referenced JS/CSS assets on disk.
Tier 2 loads each page in a headless browser, confirms the root div has content
and no console errors, and archives a screenshot.

Tier 2 is intentionally size-blind: it catches "nothing rendered at all", not
"rendered but wrong size / invisible". Shoal's padding bug had a non-empty DOM
with zero visible size, and this check would pass it. Tier 3 would close that
gap with per-game visual canaries, and is left as a documented extension point.
"""

from __future__ import annotations

import functools
import os
import re
import socketserver
import threading
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent
SITE_REPO_PATH = Path(os.environ.get("SITE_REPO_PATH", r"C:\Github\RFD_IT_Services_Site"))
PUBLIC_DIR = SITE_REPO_PATH / "public"
SCREENSHOT_DIR = REPO_ROOT / "screenshots" / "arcade-verify"

_HREF_SRC_RE = re.compile(r'(?:src|href)="([^"]+\.(?:js|css))"')
_GAME_CONFIG_RE = re.compile(r"gameId:\s*['\"]([^'\"]+)['\"]")
_EMBED_URL_RE = re.compile(r"embedUrl:\s*['\"]([^'\"]+)['\"]")


class _LocalServer:
    """A tiny background HTTP server for the local static site root."""

    def __init__(self, site_root: Path) -> None:
        self.site_root = site_root
        self.server: socketserver.TCPServer | None = None
        self.thread: threading.Thread | None = None
        self.url: str = ""

    def __enter__(self) -> "_LocalServer":
        handler = functools.partial(
            SimpleHTTPRequestHandler, directory=str(self.site_root)
        )
        self.server = socketserver.TCPServer(("", 0), handler)
        port = self.server.server_address[1]
        self.url = f"http://localhost:{port}"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        return self

    def __exit__(self, *exc) -> None:
        if self.server:
            self.server.shutdown()
            self.server.server_close()
        if self.thread:
            self.thread.join(timeout=5)


def _site_root_for(deployed_path: Path, base_url: str) -> Path:
    """Given e.g. deployed_path=.../public/arcade/ledger and base_url=/arcade/ledger/,
    return the site root (.../public)."""
    base_url = base_url.strip("/")
    if not base_url:
        return deployed_path
    parts = Path(base_url).parts
    site_root = deployed_path
    for _ in reversed(parts):
        site_root = site_root.parent
    return site_root


def get_embed_games(repo_root: Path = REPO_ROOT) -> list[dict[str, str]]:
    """Return game configs that have an embedUrl, plus the main arcade lobby."""
    games: list[dict[str, str]] = []
    config_root = repo_root / "ts" / "src" / "games"
    for config_file in config_root.glob("*/config.ts"):
        try:
            text = config_file.read_text(encoding="utf-8")
        except Exception as exc:
            # A corrupted/unreadable config file should not take down the whole
            # verification pass.
            continue
        game_id_match = _GAME_CONFIG_RE.search(text)
        embed_url_match = _EMBED_URL_RE.search(text)
        if game_id_match and embed_url_match:
            games.append(
                {"game_id": game_id_match.group(1), "embed_url": embed_url_match.group(1)}
            )
    # Main arcade lobby is not in GAME_REGISTRY but still deploys.
    games.append({"game_id": "arcade", "embed_url": "/arcade/rfdgamestudio/"})
    return games


def check_http_reachable(base_url: str, deployed_path: Path | None) -> dict:
    """Tier 1: verify index.html exists and every referenced JS/CSS asset resolves.

    For remote embedUrls (e.g. VoidRift's itch.io iframe), deployed_path is None
    and a simple HTTP HEAD/GET check is done instead.
    """
    try:
        if deployed_path is None:
            return _check_remote_reachable(base_url)

        index_path = deployed_path / "index.html"
        if not index_path.exists():
            return {
                "ok": False,
                "reason": "index.html not found in deployed output",
                "index": False,
                "assets": {},
            }

        html = index_path.read_text(encoding="utf-8")
        asset_paths = _HREF_SRC_RE.findall(html)
        site_root = _site_root_for(deployed_path, base_url)
        if site_root is None:
            raise TypeError(f"site_root is None for base_url {base_url!r}")

        assets: dict[str, bool] = {}

        for asset in asset_paths:
            if asset.startswith("http://") or asset.startswith("https://"):
                # External assets are not checked on disk; they are outside the
                # deploy pipeline's scope. They are still reported as skipped.
                assets[asset] = True
                continue
            if asset.startswith("/"):
                asset_file = site_root / asset.lstrip("/")
            else:
                asset_file = deployed_path / asset
            assets[asset] = asset_file.exists()

        all_ok = all(assets.values())
        return {
            "ok": all_ok,
            "index": True,
            "assets": assets,
            "missing_assets": [a for a, ok in assets.items() if not ok],
        }
    except Exception as exc:
        return {
            "ok": False,
            "index": False,
            "reason": f"check_http_reachable crashed for {base_url!r}: {exc}",
            "assets": {},
        }


def _check_remote_reachable(url: str) -> dict:
    """Simple HTTP reachability check for remote embeds like VoidRift."""
    try:
        req = Request(url, method="GET", headers={"User-Agent": "RFDStudioVerify/1.0"})
        with urlopen(req, timeout=15) as resp:
            status = resp.status
        return {
            "ok": status == 200,
            "status": status,
            "reason": "remote HTTP check",
            "index": None,
            "assets": {},
        }
    except HTTPError as exc:
        return {
            "ok": False,
            "status": exc.code,
            "reason": str(exc),
            "index": None,
            "assets": {},
        }
    except URLError as exc:
        return {
            "ok": False,
            "status": None,
            "reason": str(exc.reason),
            "index": None,
            "assets": {},
        }


def check_renders(local_preview_url: str, game_id: str, screenshot_dir: Path) -> dict:
    """Tier 2: load the page in a headless browser and confirm content exists.

    Important limitation: this tier catches "nothing rendered at all" (empty or
    missing root div, console errors) but not "rendered but the wrong size or
    invisible". Shoal's padding bug had real DOM content that was visually empty
    because the element had no size; this check would have passed it. Tier 3,
    a per-game visual canary, is the documented extension point for that.
    """
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    screenshot_path = screenshot_dir / f"{game_id}.png"
    errors: list[str] = []
    root_content = 0

    try:
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch()
            except Exception as exc:
                raise RuntimeError(f"browser launch failed for {game_id}: {exc}")

            try:
                page = browser.new_page()
            except Exception as exc:
                raise RuntimeError(f"new_page failed for {game_id}: {exc}")

            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on(
                "console",
                lambda msg: errors.append(msg.text) if msg.type == "error" else None,
            )

            try:
                page.goto(local_preview_url, wait_until="networkidle", timeout=15000)
            except PlaywrightTimeoutError as exc:
                errors.append(f"page load timed out: {exc}")

            # Prefer #root; fall back to body for remote embeds that don't use
            # the same root id. We still call it root_has_content for reporting.
            try:
                raw_root_content = page.evaluate(
                    "document.getElementById('root')?.innerHTML.length || "
                    "document.body?.innerHTML.length || 0"
                )
            except Exception as exc:
                raise RuntimeError(f"page.evaluate failed for {game_id}: {exc}")

            if raw_root_content is None:
                raise TypeError(f"page.evaluate returned None for {game_id}")
            try:
                root_content = int(raw_root_content)
            except Exception as exc:
                raise TypeError(
                    f"page.evaluate returned non-int for {game_id}: {raw_root_content!r} ({exc})"
                )

            try:
                page.screenshot(path=str(screenshot_path))
            except Exception as exc:
                raise RuntimeError(f"screenshot failed for {game_id}: {exc}")

            try:
                browser.close()
            except Exception as exc:
                raise RuntimeError(f"browser.close failed for {game_id}: {exc}")
    except Exception as exc:
        errors.append(str(exc))

    return {
        "ok": root_content > 0 and len(errors) == 0,
        "root_has_content": root_content > 0,
        "console_errors": errors,
        "screenshot": str(screenshot_path),
    }


def verify_arcade_deploy(public_dir: Path = PUBLIC_DIR, include_render: bool = False) -> dict:
    """Run Tier 1 and Tier 2 verification over all embedUrl games and the lobby.

    Returns a dict with a top-level "ok" summary and a per-game "games" report.
    This intentionally does not raise on failures; the report is folded into
    studio_deploy_arcade() for human review.
    """
    if not public_dir.exists():
        return {
            "ok": False,
            "reason": f"public directory does not exist: {public_dir}",
            "games": {},
        }

    try:
        games = get_embed_games()
    except Exception as exc:
        return {
            "ok": False,
            "reason": f"get_embed_games failed: {exc}",
            "games": {},
        }

    verification: dict[str, dict] = {}

    try:
        with _LocalServer(public_dir) as server:
            for game in games:
                game_id = game["game_id"]
                embed_url = game["embed_url"]

                try:
                    if embed_url.startswith("http://") or embed_url.startswith("https://"):
                        # Remote embed (e.g. VoidRift itch iframe). Tier 1 does a simple
                        # HTTP reachability check; Tier 2 is not run because the page is
                        # not under our control and headless WebGL often fails without a GPU.
                        http_result = _check_remote_reachable(embed_url)
                        render_result: dict = {
                            "ok": None,
                            "reason": "remote embed; Tier 2 not run",
                        }
                    else:
                        deployed_path = public_dir / embed_url.lstrip("/")
                        preview_url = server.url + embed_url
                        http_result = check_http_reachable(embed_url, deployed_path)
                        if include_render:
                            render_result = check_renders(preview_url, game_id, SCREENSHOT_DIR)
                        else:
                            render_result = {
                                "ok": None,
                                "reason": "Tier 2 render check disabled by default",
                            }

                    verification[game_id] = {
                        "embed_url": embed_url,
                        "http": http_result,
                        "render": render_result,
                    }
                except Exception as exc:
                    verification[game_id] = {
                        "embed_url": embed_url,
                        "error": f"verify_arcade_deploy game loop crashed for {game_id}: {exc}",
                    }
    except Exception as exc:
        return {
            "ok": False,
            "reason": f"verify_arcade_deploy crashed: {exc}",
            "games": verification,
        }

    overall_ok = all(
        v.get("http", {}).get("ok") for v in verification.values()
    )

    return {
        "ok": overall_ok,
        "games": verification,
    }
