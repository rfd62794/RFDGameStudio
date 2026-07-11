"""tests/test_shoal.py — Regression tests for the Shoal 2.0 Lua engine."""

from __future__ import annotations

from studio.runtime import load_game, call


def test_shoal_init_and_tick() -> None:
    """Load the game, initialize, and run a few ticks without crashing."""
    session = load_game("shoal", seed=42)
    data = session.files.data

    render_state = call(session, "init_game", data)
    assert "world" in render_state
    assert render_state["stats"]["fish_count"] > 0
    assert render_state["stats"]["shark_count"] > 0
    assert render_state["stats"]["algae_count"] > 0

    for _ in range(10):
        render_state = call(session, "tick_game", 0.05, {})

    assert "fish" in render_state
    assert "sharks" in render_state
    assert "algae" in render_state
    assert "chunks" in render_state


def test_shoal_spawning_and_culling() -> None:
    """Click-spawn and cull tools modify the simulation."""
    session = load_game("shoal", seed=42)
    data = session.files.data

    call(session, "init_game", data)
    render_state = call(session, "tick_game", 0.05, { "tool": "fish", "x": 100, "y": 100, "clicked": True })
    fish_count = render_state["stats"]["fish_count"]
    assert fish_count > 0

    render_state = call(session, "tick_game", 0.05, { "tool": "cull", "x": 100, "y": 100, "clicked": True })
    assert render_state["stats"]["fish_count"] <= fish_count


def test_shoal_state_summary() -> None:
    """The MCP state summary returns the expected fields."""
    session = load_game("shoal", seed=42)
    data = session.files.data

    call(session, "init_game", data)
    summary = call(session, "get_state_summary")
    assert summary["initialized"] is True
    assert summary["fish_count"] >= 0
    assert summary["shark_count"] >= 0
    assert summary["algae_count"] >= 0
    assert summary["chunk_count"] >= 0
