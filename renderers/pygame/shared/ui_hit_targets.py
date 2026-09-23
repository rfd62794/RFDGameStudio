"""
ui_hit_targets.py — Click routing for ui.yaml action_button and link components.

Provides HitTarget dataclass and dispatch_click() for routing mouse clicks
to Lua event calls, with requires-gate support for enabled/disabled state.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, List


@dataclass
class HitTarget:
    """A clickable region registered by the UI interpreter."""
    rect: Any  # pygame.Rect
    event: str
    data: Any = None
    requires: List[str] = field(default_factory=list)


def dispatch_click(
    pos: tuple[int, int],
    hit_targets: List[HitTarget],
    context: dict,
    lua_call: Any,
) -> Any:
    """
    Route a click position to the first matching hit target.

    Args:
        pos: (x, y) pixel position of the click
        hit_targets: list of HitTarget objects to test
        context: dict of condition names → bool for requires gating
        lua_call: callable(fn_name, *args) for dispatching events

    Returns:
        Result of lua_call if a target was hit and requires satisfied,
        None otherwise (disabled button or miss).
    """
    for target in hit_targets:
        if target.rect.collidepoint(pos):
            # Check requires gate
            if target.requires:
                if not all(context.get(req, False) for req in target.requires):
                    return None  # click on disabled button — no-op
            return lua_call(target.event, target.data)
    return None
