#!/usr/bin/env python3
"""Generate deterministic placeholder SVG art for Dissonance Depths.

Reads games/dissonance/data.yaml and writes 106 SVG files to
<repo>/ts/public/assets/dissonance/{cards,relics,enemies}/{id}.svg.

Run from the repo root:
    python scripts/generate_dissonance_art.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:  # pragma: no cover
    raise SystemExit("PyYAML is required: pip install pyyaml")


REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = REPO_ROOT / "games" / "dissonance" / "data.yaml"
OUT_DIR = REPO_ROOT / "ts" / "public" / "assets" / "dissonance"

ELEMENT_COLORS = {
    "ember": "#f97316",  # warm orange-red
    "ash": "#94a3b8",    # dusty grey
    "spark": "#22d3ee",  # electric cyan
    "cinder": "#991b1b", # deep maroon-red
}
SURFACE = "#0f172a"


def _card_background(el1: str, el2: str | None) -> str:
    c1 = ELEMENT_COLORS.get(el1, "#94a3b8")
    if not el2:
        return (
            f'<radialGradient id="bg" cx="50%" cy="50%" r="70%">'
            f'<stop offset="0%" stop-color="{c1}" stop-opacity="0.35"/>'
            f'<stop offset="100%" stop-color="{SURFACE}" stop-opacity="1"/></radialGradient>'
            f'<rect width="120" height="160" fill="url(#bg)"/>'
        )
    c2 = ELEMENT_COLORS.get(el2, "#94a3b8")
    return (
        f'<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">'
        f'<stop offset="0%" stop-color="{c1}" stop-opacity="0.45"/>'
        f'<stop offset="100%" stop-color="{c2}" stop-opacity="0.45"/></linearGradient>'
        f'<rect width="120" height="160" fill="url(#bg)"/>'
    )


def _card_border(relation_type: str, color: str) -> str:
    if relation_type == "single":
        return f'<rect x="2" y="2" width="116" height="156" rx="8" fill="none" stroke="{color}" stroke-width="2"/>'
    if relation_type == "adjacent":
        return f'<rect x="2" y="2" width="116" height="156" rx="8" fill="none" stroke="{color}" stroke-width="4"/>'
    if relation_type == "same":
        glow = (
            f'<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">'
            f'<feGaussianBlur stdDeviation="3" result="blur"/>'
            f'<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        )
        return (
            f'{glow}'
            f'<rect x="4" y="4" width="112" height="152" rx="8" fill="none" stroke="{color}" stroke-width="6" filter="url(#glow)"/>'
        )
    # opposed
    return (
        f'<rect x="2" y="2" width="116" height="156" rx="8" fill="none" stroke="{color}" '
        f'stroke-width="4" stroke-dasharray="6 4"/>'
    )


def _card_shape(component: str, color: str) -> str:
    # Center group, roughly 120x160 canvas.
    if component == "sever":
        return (
            f'<g transform="translate(60,85) scale(1.2)" stroke="{color}" stroke-width="5" stroke-linecap="round" fill="none">'
            f'<path d="M-25,-20 L25,0 L-25,20"/>'
            f'<line x1="-25" y1="0" x2="25" y2="0"/>'
            f'</g>'
        )
    if component == "mend":
        return (
            f'<g transform="translate(60,85)" stroke="{color}" stroke-width="6" stroke-linecap="round">'
            f'<line x1="0" y1="-22" x2="0" y2="22"/>'
            f'<line x1="-22" y1="0" x2="22" y2="0"/>'
            f'</g>'
        )
    if component == "guard":
        return (
            f'<g transform="translate(60,85) scale(0.9)" fill="none" stroke="{color}" stroke-width="5" stroke-linejoin="round">'
            f'<path d="M0,-35 C25,-35 40,-15 40,15 C40,45 0,70 0,70 C0,70 -40,45 -40,15 C-40,-15 -25,-35 0,-35 Z"/>'
            f'</g>'
        )
    # unmake
    return (
        f'<g transform="translate(60,85)" fill="none" stroke="{color}" stroke-width="5" stroke-linecap="round">'
        f'<path d="M-18,-18 C0,-30 18,-18 12,0 C6,18 -12,24 -20,10 C-24,0 -12,-12 0,-12"/>'
        f'<circle cx="0" cy="0" r="6" fill="{color}"/>'
        f'</g>'
    )


def generate_card(card: dict[str, Any]) -> str:
    cid: str = card["id"]
    el1: str = card["el1"]
    el2: str | None = card.get("el2")
    relation_type: str = card.get("relationType", "single")
    component = cid.rsplit("_", 1)[-1]

    color = ELEMENT_COLORS.get(el1, "#94a3b8")
    bg = _card_background(el1, el2)
    border = _card_border(relation_type, color)
    shape = _card_shape(component, color)

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">\n'
        f'  {bg}\n'
        f'  {border}\n'
        f'  {shape}\n'
        f'</svg>'
    )


RELIC_COLORS = {
    "economy": "#facc15",      # gold
    "safety-net": "#34d399",   # emerald
    "info": "#38bdf8",         # sky
    "utility": "#a78bfa",      # violet
    "risk": "#fb7185",         # rose
    "synergy": "#f59e0b",      # amber
}


def _relic_shape(category: str, color: str) -> str:
    if category == "economy":
        return (
            f'<circle cx="50" cy="50" r="28" fill="none" stroke="{color}" stroke-width="5"/>'
            f'<text x="50" y="62" text-anchor="middle" fill="{color}" font-size="26" font-family="monospace">$</text>'
        )
    if category == "safety-net":
        return (
            f'<path d="M50,18 C75,18 88,35 88,55 C88,82 50,105 50,105 C50,105 12,82 12,55 C12,35 25,18 50,18 Z" '
            f'fill="none" stroke="{color}" stroke-width="5" stroke-linejoin="round"/>'
            f'<path d="M50,42 L50,70 M36,56 L64,56" stroke="{color}" stroke-width="5" stroke-linecap="round"/>'
        )
    if category == "info":
        return (
            f'<ellipse cx="50" cy="50" rx="34" ry="26" fill="none" stroke="{color}" stroke-width="5"/>'
            f'<circle cx="50" cy="50" r="10" fill="{color}"/>'
            f'<circle cx="66" cy="44" r="4" fill="{color}"/>'
        )
    if category == "utility":
        # gear
        teeth = ""
        for i in range(8):
            angle = i * 45
            teeth += (
                f'<rect x="46" y="8" width="8" height="12" fill="{color}" '
                f'transform="rotate({angle} 50 50)"/>'
            )
        return (
            f'{teeth}'
            f'<circle cx="50" cy="50" r="20" fill="none" stroke="{color}" stroke-width="5"/>'
            f'<circle cx="50" cy="50" r="8" fill="{color}"/>'
        )
    if category == "risk":
        return (
            f'<rect x="20" y="20" width="60" height="60" rx="6" fill="none" stroke="{color}" stroke-width="5"/>'
            f'<circle cx="35" cy="35" r="5" fill="{color}"/>'
            f'<circle cx="65" cy="35" r="5" fill="{color}"/>'
            f'<circle cx="35" cy="65" r="5" fill="{color}"/>'
            f'<circle cx="50" cy="50" r="5" fill="{color}"/>'
            f'<circle cx="65" cy="65" r="5" fill="{color}"/>'
        )
    # synergy
    return (
        f'<circle cx="32" cy="50" r="14" fill="none" stroke="{color}" stroke-width="5"/>'
        f'<circle cx="68" cy="50" r="14" fill="none" stroke="{color}" stroke-width="5"/>'
        f'<path d="M44,50 L56,50" stroke="{color}" stroke-width="5" stroke-linecap="round"/>'
    )


def generate_relic(relic: dict[str, Any]) -> str:
    category = relic.get("category", "utility")
    color = RELIC_COLORS.get(category, "#a78bfa")
    shape = _relic_shape(category, color)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">\n'
        f'  <rect width="100" height="100" rx="12" fill="{SURFACE}"/>\n'
        f'  <rect x="3" y="3" width="94" height="94" rx="10" fill="none" stroke="{color}" stroke-width="3"/>\n'
        f'  {shape}\n'
        f'</svg>'
    )


TIER_VISUALS = {
    "basic": {"r": 30, "fill": "#64748b", "stroke": "#94a3b8", "sw": 3},
    "advanced": {"r": 40, "fill": "#f59e0b", "stroke": "#fbbf24", "sw": 3},
    "elite": {"r": 50, "fill": "#ea580c", "stroke": "#fdba74", "sw": 4},
    "master": {"r": 60, "fill": "#7c3aed", "stroke": "#fbbf24", "sw": 5},
}


def _enemy_silhouette(r: int, fill: str, stroke: str, sw: int) -> str:
    points = []
    outer = r
    inner = r * 0.45
    n = 8
    for i in range(n * 2):
        angle = (i / (n * 2)) * 360 - 90
        rad = outer if i % 2 == 0 else inner
        x = 60 + rad * __import__("math").cos(__import__("math").radians(angle))
        y = 60 + rad * __import__("math").sin(__import__("math").radians(angle))
        points.append(f"{x:.1f},{y:.1f}")
    path = "M" + " L".join(points) + " Z"
    return (
        f'<polygon points="{" ".join(points)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
    )


def generate_enemy(enemy: dict[str, Any]) -> str:
    tier = enemy.get("tier", "basic")
    vis = TIER_VISUALS.get(tier, TIER_VISUALS["basic"])
    shape = _enemy_silhouette(vis["r"], vis["fill"], vis["stroke"], vis["sw"])
    glow = ""
    if tier == "master":
        glow = (
            '<filter id="boss-glow" x="-25%" y="-25%" width="150%" height="150%">'
            '<feGaussianBlur stdDeviation="4" result="blur"/>'
            '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        )
        shape = shape.replace('/>', ' filter="url(#boss-glow)"/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">\n'
        f'  <rect width="120" height="120" rx="14" fill="{SURFACE}"/>\n'
        f'  {glow}\n'
        f'  {shape}\n'
        f'</svg>'
    )


def load_data() -> dict[str, Any]:
    if not DATA_PATH.exists():
        raise SystemExit(f"data.yaml not found at {DATA_PATH}")
    with DATA_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def generate_all(data: dict[str, Any]) -> tuple[Path, dict[str, list[str]]]:
    ids: dict[str, list[str]] = {"cards": [], "relics": [], "enemies": []}

    cards_dir = OUT_DIR / "cards"
    relics_dir = OUT_DIR / "relics"
    enemies_dir = OUT_DIR / "enemies"
    for d in (cards_dir, relics_dir, enemies_dir):
        d.mkdir(parents=True, exist_ok=True)
        # Clear previously generated files so stale ids don't accumulate.
        for old in d.glob("*.svg"):
            old.unlink()

    for card in data.get("named_cards", []):
        cid = card["id"]
        ids["cards"].append(cid)
        (cards_dir / f"{cid}.svg").write_text(generate_card(card), encoding="utf-8")

    for relic in data.get("relics", []):
        rid = relic["id"]
        ids["relics"].append(rid)
        (relics_dir / f"{rid}.svg").write_text(generate_relic(relic), encoding="utf-8")

    enemy_sections = ("basic", "behavior_roster", "legacy_named", "bosses")
    for section in enemy_sections:
        for enemy in data.get("enemies", {}).get(section, []):
            eid = enemy["id"]
            ids["enemies"].append(eid)
            (enemies_dir / f"{eid}.svg").write_text(generate_enemy(enemy), encoding="utf-8")

    return OUT_DIR, ids


def verify(ids: dict[str, list[str]]) -> bool:
    data = load_data()
    expected: dict[str, list[str]] = {
        "cards": [c["id"] for c in data.get("named_cards", [])],
        "relics": [r["id"] for r in data.get("relics", [])],
        "enemies": [],
    }
    for section in ("basic", "behavior_roster", "legacy_named", "bosses"):
        expected["enemies"].extend(e["id"] for e in data.get("enemies", {}).get(section, []))

    total = sum(len(v) for v in ids.values())
    print(f"Generated {total} SVGs in {OUT_DIR}")
    print(f"  cards: {len(ids['cards'])}, relics: {len(ids['relics'])}, enemies: {len(ids['enemies'])}")

    ok = True
    for kind in ("cards", "relics", "enemies"):
        missing = set(expected[kind]) - set(ids[kind])
        extra = set(ids[kind]) - set(expected[kind])
        if missing:
            print(f"  MISSING {kind}: {sorted(missing)}")
            ok = False
        if extra:
            print(f"  EXTRA {kind}: {sorted(extra)}")
            ok = False
    return ok


def main() -> int:
    data = load_data()
    out_dir, ids = generate_all(data)
    if not verify(ids):
        return 1
    print("All data.yaml ids have matching SVG files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
