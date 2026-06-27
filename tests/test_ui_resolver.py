"""Tests for the Python layout resolver (engine/ui/resolver.py)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "engine" / "ui"))
from resolver import resolve_viewport, Bounds

SIMPLE_TREE = {
    "direction": "column",
    "children": [
        {"id": "header", "height": 0.10},
        {"id": "content", "flex": 1},
        {"id": "footer", "height": 0.05},
    ]
}

def test_resolver_produces_three_nodes() -> None:
    result = resolve_viewport(SIMPLE_TREE, 800, 600)
    ids = [b.id for b in result]
    assert "header" in ids
    assert "content" in ids
    assert "footer" in ids
    assert len(result) == 3

def test_resolver_fixed_height_correct() -> None:
    result = resolve_viewport(SIMPLE_TREE, 800, 600)
    header = next(b for b in result if b.id == "header")
    assert abs(header.h - 60.0) < 0.01   # 10% of 600

def test_resolver_flex_fills_remaining() -> None:
    result = resolve_viewport(SIMPLE_TREE, 800, 600)
    content = next(b for b in result if b.id == "content")
    # remaining = 600 - 60 - 30 = 510
    assert abs(content.h - 510.0) < 0.01

def test_resolver_row_direction() -> None:
    tree = {
        "direction": "row",
        "children": [
            {"id": "sidebar", "width": 0.25},
            {"id": "main", "flex": 1},
        ]
    }
    result = resolve_viewport(tree, 800, 600)
    sidebar = next(b for b in result if b.id == "sidebar")
    main = next(b for b in result if b.id == "main")
    assert abs(sidebar.w - 200.0) < 0.01   # 25% of 800
    assert abs(main.w - 600.0) < 0.01      # remaining 75%
    assert abs(sidebar.x - 0.0) < 0.01
    assert abs(main.x - 200.0) < 0.01
