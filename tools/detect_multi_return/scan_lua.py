"""scan_lua.py — Detect multi-value return statements in Lua logic files.

Scans games/*/logic.lua for `return` statements that yield more than one value
(e.g. `return nil, "error message"`).  Output is a list of records:

    {"game": "slimeworld", "function": "fulfill_petition", "line": 42,
     "returns": ["nil", '"Petition or slime not found"']}

Usage:
    python tools/detect_multi_return/scan_lua.py [--json] [--game slimeworld]

If --json is omitted, prints a human-readable table.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Any

import yaml

GAMES_DIR = Path(__file__).resolve().parent.parent.parent / "games"

# Matches: return expr1, expr2 [, expr3 ...]
# We capture the raw text after `return` and split on top-level commas.
RETURN_RE = re.compile(r"^\s*return\s+(.+)", re.MULTILINE)

# Matches: function name(...)  or  local function name(...)
FUNC_RE = re.compile(r"^(?:local\s+)?function\s+(\w+)", re.MULTILINE)


def _split_top_level_commas(text: str) -> List[str]:
    """Split on commas that are not inside parentheses or brackets."""
    parts: List[str] = []
    depth = 0
    current = []
    for ch in text:
        if ch in "([{":
            depth += 1
            current.append(ch)
        elif ch in ")]}":
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    tail = "".join(current).strip()
    if tail:
        parts.append(tail)
    return parts


def scan_file(path: Path, game_id: str) -> List[Dict[str, Any]]:
    """Scan a single logic.lua file for multi-value returns."""
    source = path.read_text(encoding="utf-8")
    results: List[Dict[str, Any]] = []

    # Build a line-indexed list of function names with their start lines
    func_starts: List[Dict[str, Any]] = []
    for m in FUNC_RE.finditer(source):
        func_starts.append({
            "name": m.group(1),
            "start_line": source[:m.start()].count("\n") + 1,
            "start_pos": m.start(),
        })

    # Find all return statements
    for m in RETURN_RE.finditer(source):
        raw = m.group(1).rstrip(";").strip()
        parts = _split_top_level_commas(raw)
        if len(parts) <= 1:
            continue

        line_num = source[:m.start()].count("\n") + 1

        # Find the enclosing function
        func_name = "<unknown>"
        for f in func_starts:
            if f["start_pos"] < m.start():
                func_name = f["name"]
            else:
                break

        results.append({
            "game": game_id,
            "function": func_name,
            "line": line_num,
            "returns": parts,
        })

    return results


def _get_lua_files(game_dir: Path) -> List[Path]:
    """Get the list of Lua files to scan for a game.

    Respects lua_files in systems.yaml if declared; otherwise falls back to logic.lua.
    """
    systems_path = game_dir / "systems.yaml"
    if systems_path.exists():
        systems = yaml.safe_load(systems_path.read_text(encoding="utf-8")) or {}
        lua_files = systems.get("lua_files")
        if lua_files:
            return [game_dir / f for f in lua_files if (game_dir / f).exists()]
    logic_path = game_dir / "logic.lua"
    return [logic_path] if logic_path.exists() else []


def scan_game(game_dir: Path, game_id: str) -> List[Dict[str, Any]]:
    """Scan all Lua files for a single game."""
    results: List[Dict[str, Any]] = []
    for lua_path in _get_lua_files(game_dir):
        results.extend(scan_file(lua_path, game_id))
    return results


def scan_all(games_dir: Path = GAMES_DIR) -> List[Dict[str, Any]]:
    """Scan all games for multi-value returns."""
    all_results: List[Dict[str, Any]] = []
    for game_dir in sorted(games_dir.iterdir()):
        if game_dir.is_dir() and (game_dir / "data.yaml").exists():
            all_results.extend(scan_game(game_dir, game_dir.name))
    return all_results


def main() -> None:
    parser = argparse.ArgumentParser(description="Detect multi-value returns in Lua logic files")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--game", type=str, default=None, help="Scan only one game")
    args = parser.parse_args()

    if args.game:
        game_dir = GAMES_DIR / args.game
        if not game_dir.exists():
            print(f"Error: {game_dir} not found", file=sys.stderr)
            sys.exit(1)
        results = scan_game(game_dir, args.game)
    else:
        results = scan_all()

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        if not results:
            print("No multi-value returns found.")
            return
        print(f"{'Game':<20} {'Function':<30} {'Line':>5}  Returns")
        print("-" * 80)
        for r in results:
            rets = ", ".join(r["returns"])
            print(f"{r['game']:<20} {r['function']:<30} {r['line']:>5}  {rets}")
        print(f"\nTotal: {len(results)} multi-value return statements across "
              f"{len(set(r['game'] for r in results))} games.")


if __name__ == "__main__":
    main()
