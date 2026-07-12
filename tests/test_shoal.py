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


def test_fish_flee_increases_distance_from_shark() -> None:
    """A fish near a shark should net-increase distance over several ticks."""
    import math

    session = load_game("shoal", seed=42)
    data = session.files.data
    # Isolate one fish and one shark; disable the shark's pursuit so the
    # test measures the fish's flee response directly.
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["shark"]["perception"]["fish"] = 0

    call(session, "init_game", data)

    # Spawn fish at 300,300 and shark at 370,300 (distance 70).
    state = call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    state = call(session, "tick_game", 0, { "tool": "shark", "x": 370, "y": 300, "clicked": True })

    assert state["stats"]["fish_count"] == 1
    assert state["stats"]["shark_count"] == 1

    fish = state["fish"][0]
    shark = state["sharks"][0]
    initial_dist = math.hypot(fish["x"] - shark["x"], fish["depth"] - shark["depth"])

    for _ in range(10):
        state = call(session, "tick_game", 0.05, {})

    fish = state["fish"][0]
    shark = state["sharks"][0]
    final_dist = math.hypot(fish["x"] - shark["x"], fish["depth"] - shark["depth"])

    assert final_dist > initial_dist


def test_fish_school_align_headings() -> None:
    """Fish spawned close together should trend toward similar headings."""
    import math

    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0

    call(session, "init_game", data)

    # Spawn a tight cluster of fish.
    positions = [
        (300, 300),
        (310, 305),
        (305, 320),
        (295, 310),
        (315, 315),
    ]
    for x, y in positions:
        call(session, "tick_game", 0, { "tool": "fish", "x": x, "y": y, "clicked": True })

    state = call(session, "tick_game", 0, {})
    assert state["stats"]["fish_count"] == len(positions)

    def circular_variance(fish_list: list[dict]) -> float:
        if not fish_list:
            return 1.0
        n = len(fish_list)
        mean_cos = sum(math.cos(f["angle"]) for f in fish_list) / n
        mean_sin = sum(math.sin(f["angle"]) for f in fish_list) / n
        # Result 1 = perfectly random, 0 = perfectly aligned.
        return 1 - math.sqrt(mean_cos * mean_cos + mean_sin * mean_sin)

    initial_var = circular_variance(state["fish"])

    for _ in range(30):
        state = call(session, "tick_game", 0.05, {})

    final_var = circular_variance(state["fish"])

    assert final_var < initial_var
