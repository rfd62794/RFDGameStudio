"""
RFDGameStudio — Layout Resolver (Python port)
Identical algorithm to engine/ui/resolver.lua.
Used by the PyGame renderer and Python tests.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any


@dataclass
class Bounds:
    id: str
    x: float
    y: float
    w: float
    h: float


def resolve_layout(
    node: dict[str, Any],
    parent: dict[str, float],
    results: list[Bounds] | None = None,
) -> list[Bounds]:
    """
    Resolve a layout tree node given its parent's pixel bounds.
    Mirrors resolve_layout() in resolver.lua exactly.
    """
    if results is None:
        results = []
    if parent is None:
        parent = {"x": 0, "y": 0, "w": 800, "h": 600}

    direction = node.get("direction", "column")
    is_column = direction == "column"
    children = node.get("children", [])

    x = parent["x"]
    y = parent["y"]
    w = parent["w"]
    h = parent["h"]

    if node.get("id"):
        results.append(Bounds(id=node["id"], x=x, y=y, w=w, h=h))

    if not children:
        return results

    # Separate fixed from flex
    fixed_total = 0.0
    total_flex = 0.0

    for child in children:
        if is_column:
            if "height" in child:
                fixed_total += child["height"] * h
            elif "flex" in child:
                total_flex += child["flex"]
        else:
            if "width" in child:
                fixed_total += child["width"] * w
            elif "flex" in child:
                total_flex += child["flex"]

    main_size = h if is_column else w
    remaining = max(0.0, main_size - fixed_total)
    flex_unit = (remaining / total_flex) if total_flex > 0 else 0.0

    cursor = 0.0

    for child in children:
        if is_column:
            child_cross = w
            if "height" in child:
                child_main = child["height"] * h
            elif "flex" in child:
                child_main = flex_unit * child["flex"]
            else:
                child_main = 0.0
            child_bounds = {"x": x, "y": y + cursor, "w": child_cross, "h": child_main}
        else:
            child_cross = h
            if "width" in child:
                child_main = child["width"] * w
            elif "flex" in child:
                child_main = flex_unit * child["flex"]
            else:
                child_main = 0.0
            child_bounds = {"x": x + cursor, "y": y, "w": child_main, "h": child_cross}

        resolve_layout(child, child_bounds, results)
        cursor += child_main

    return results


def resolve_viewport(
    tree: dict[str, Any], viewport_w: float, viewport_h: float
) -> list[Bounds]:
    """Resolve from a viewport size. Mirrors resolve_viewport() in resolver.lua."""
    return resolve_layout(tree, {"x": 0, "y": 0, "w": viewport_w, "h": viewport_h})
