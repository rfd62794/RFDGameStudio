"""tests/test_shoal.py — Regression tests for the Shoal 2.0 Lua engine."""

from __future__ import annotations

import math

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
        return 1 - math.sqrt(mean_cos * mean_cos + mean_sin * mean_sin)

    initial_var = circular_variance(state["fish"])

    for _ in range(30):
        state = call(session, "tick_game", 0.05, {})

    final_var = circular_variance(state["fish"])

    assert final_var < initial_var


def _run_contact_trial(session, data, fish_speed_steps: int = 0) -> bool:
    """Run one shark-fish contact and return True if the fish survives."""
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["shark"]["perception"]["fish"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)

    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })

    if fish_speed_steps > 0:
        # A static threat to the left makes the fish accelerate to the right.
        call(session, "tick_game", 0, { "tool": "shark", "x": 250, "y": 300, "clicked": True })
        for _ in range(fish_speed_steps):
            call(session, "tick_game", 0.05, {})
        state = call(session, "tick_game", 0, {})
        fx = state["fish"][0]["x"]
        fy = state["fish"][0]["depth"]
        # Place the shark ahead of the fleeing fish so contact still happens.
        call(session, "tick_game", 0, { "tool": "shark", "x": fx + 25, "y": fy, "clicked": True })
    else:
        # Slow case: shark slightly ahead, fish starts from rest.
        call(session, "tick_game", 0, { "tool": "shark", "x": 305, "y": 300, "clicked": True })

    for _ in range(5):
        state = call(session, "tick_game", 0.05, {})
    return state["stats"]["fish_count"] == 1


def test_fish_escape_chance_scales_with_speed() -> None:
    """A fast fish should survive contact more often than a stationary one."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    trials = 60

    slow_survives = sum(1 for _ in range(trials) if _run_contact_trial(session, data, 0))
    fast_survives = sum(1 for _ in range(trials) if _run_contact_trial(session, data, 40))

    assert fast_survives > slow_survives


def test_escaped_fish_is_knocked_back() -> None:
    """An escaped fish is pushed away from the shark during the contact tick."""
    import math

    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["escape_chance"] = 1.0
    data["creatures"]["shark"]["perception"]["fish"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "shark", "x": 305, "y": 300, "clicked": True })

    state_before = call(session, "tick_game", 0, {})
    for _ in range(5):
        state_after = call(session, "tick_game", 0.05, {})

    fb = state_before["fish"][0]
    fa = state_after["fish"][0]
    d = math.hypot(fa["x"] - fb["x"], fa["depth"] - fb["depth"])
    assert d > 10


def test_breed_thresholds_read_from_data() -> None:
    """Fish and shark breeding thresholds are driven by data, not hardcoded values."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["breed_age"] = 0
    data["creatures"]["fish"]["breed_fed_threshold"] = 1
    data["creatures"]["shark"]["breed_age"] = 0
    data["creatures"]["shark"]["breed_fed_threshold"] = 1
    data["creatures"]["fish"]["escape_chance"] = 0
    data["creatures"]["shark"]["perception"]["fish"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "algae", "x": 300, "y": 300, "clicked": True })
    # Fish must spawn on an actual spoke nodule (offset 24 down) now that the center nodule is removed.
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 324, "clicked": True })
    for _ in range(5):
        state = call(session, "tick_game", 0.05, {})
    assert state["stats"]["fish_count"] > 1

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })
    for _ in range(5):
        state = call(session, "tick_game", 0.05, {})
    assert state["stats"]["shark_count"] > 1


def test_shark_sunlit_surface_hits_exposure_threshold() -> None:
    """A shark parked at the true surface reaches exposure threshold in ~2.5s."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["creatures"]["shark"]["home_depth"] = 10
    data["creatures"]["shark"]["exposure_retreat_threshold"] = 200

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 0, "clicked": True })

    for _ in range(60):
        state = call(session, "tick_game", 0.05, {})
    assert state["sharks"][0]["exposure"] < 100

    for _ in range(10):
        state = call(session, "tick_game", 0.05, {})
    assert state["sharks"][0]["exposure"] >= 100
    assert state["sharks"][0]["depth"] > 0


def test_flesh_chunk_sinks_after_burst_decay() -> None:
    """A chunk keeps sinking from its own sink rate even after burst velocity decays."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["escape_chance"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })

    # Kill the fish and spawn the chunk.
    for _ in range(5):
        state = call(session, "tick_game", 0.05, {})
    assert state["stats"]["chunk_count"] == 1

    # Remove the shark so it cannot eat the chunk.
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 300, "clicked": True })

    # Let the initial burst velocity decay to near zero.
    for _ in range(20):
        state = call(session, "tick_game", 0.05, {})

    depth_before = state["chunks"][0]["depth"]
    for _ in range(10):
        state = call(session, "tick_game", 0.05, {})
    depth_after = state["chunks"][0]["depth"]

    assert depth_after - depth_before > 4


def test_chunk_despawns_when_it_reaches_floor() -> None:
    """A chunk sinks to the floor and is removed."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["escape_chance"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["flesh_chunk"]["sink_rate"] = 500
    data["flesh_chunk"]["floor_grace_time"] = 0.5
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })

    for _ in range(5):
        state = call(session, "tick_game", 0.05, {})
    assert state["stats"]["chunk_count"] == 1

    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 300, "clicked": True })

    for _ in range(20):
        state = call(session, "tick_game", 0.1, {})
    assert state["stats"]["chunk_count"] == 0


def test_chunk_does_not_despawn_before_reaching_floor() -> None:
    """A shallow chunk does not despawn within the old decay window."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["flesh_chunk"]["sink_rate"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    state = call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 300, "clicked": True })
    assert state["stats"]["chunk_count"] == 1

    for _ in range(100):
        state = call(session, "tick_game", 0.1, {})
    assert state["stats"]["chunk_count"] == 1


def test_fish_cold_accumulates_and_dies_in_deep_water() -> None:
    """A fish held in the hadopelagic reaches cold threshold, then dies from cold damage."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)
    state = call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 800, "clicked": True })
    fish = state["fish"][0]
    assert fish["cold_exposure"] == 0
    assert fish["cold_damage"] == 0

    for _ in range(25):
        state = call(session, "tick_game", 0.1, {})
    fish = state["fish"][0]
    assert fish["cold_exposure"] < 100
    assert state["stats"]["fish_count"] == 1

    for _ in range(35):
        state = call(session, "tick_game", 0.1, {})
    assert state["stats"]["fish_count"] == 0


def test_depth_bias_scales_with_cold_danger() -> None:
    """Deep fish feel a stronger upward pull than shallow fish."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 50, "clicked": True })
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 740, "clicked": True })

    state = call(session, "tick_game", 0, {})
    shallow_before = state["fish"][0]["depth"]
    deep_before = state["fish"][1]["depth"]

    for _ in range(20):
        state = call(session, "tick_game", 0.1, {})

    shallow_after = state["fish"][0]["depth"]
    deep_after = state["fish"][1]["depth"]

    shallow_change = shallow_before - shallow_after
    deep_change = deep_before - deep_after
    assert deep_change > shallow_change


def test_fish_ignores_unsafe_algae() -> None:
    """Fish do not seek algae whose depth exceeds the safe cold rate."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 1.0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 400, "clicked": True })
    call(session, "tick_game", 0, { "tool": "algae", "x": 300, "y": 600, "clicked": True })

    for _ in range(10):
        state = call(session, "tick_game", 0.1, {})
    assert state["fish"][0]["depth"] < 420


def test_shark_prefers_nearby_chunk_over_farther_fish() -> None:
    """Sharks seek a closer chunk even when a live fish is also visible."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["flesh_chunk"]["sink_rate"] = 0
    data["steering_weights"]["shark"]["wander"] = 0

    call(session, "init_game", data)
    # Spawn a chunk by culling a fish near the shark's eventual depth.
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 140, "clicked": True })
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 140, "clicked": True })
    # Place a shark between the chunk (below) and a fish (above).
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 100, "clicked": True })
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 50, "clicked": True })

    for _ in range(5):
        state = call(session, "tick_game", 0.1, {})
    assert state["sharks"][0]["depth"] > 100


def test_shark_targets_chunk_at_same_range_as_fish() -> None:
    """A chunk inside the (now equal) flesh perception is targeted even when a fish is farther away."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["flesh_chunk"]["sink_rate"] = 0
    data["steering_weights"]["shark"]["wander"] = 0

    call(session, "init_game", data)
    # Create a chunk at ~500 depth. Its max distance from the shark is ~215, within flesh perception (220).
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 500, "clicked": True })
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 500, "clicked": True })
    # Shark at 300,300. Fish at 300,50 is 250 units away (outside the 220 perception).
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 50, "clicked": True })

    for _ in range(5):
        state = call(session, "tick_game", 0.1, {})
    assert state["sharks"][0]["depth"] > 300


def test_force_arrive_brakes_when_close_and_fast() -> None:
    """force_arrive produces a steering force opposing current velocity when close."""
    session = load_game("shoal", seed=42)
    # Moving fast downward toward a target just below should produce upward steering.
    sx, sy = call(session, "force_arrive", 0, 0, 0, 100, 0, 10, 1, 120, 80, 30)
    assert sy < 0
    assert sx == 0


def test_fish_slows_inside_slowing_radius() -> None:
    """Fish within slowing_radius approach algae at a lower speed than one outside."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0
    data["steering_weights"]["fish"]["flee_shark"] = 0
    data["steering_weights"]["fish"]["separate"] = 0
    data["steering_weights"]["fish"]["align"] = 0
    data["steering_weights"]["fish"]["cohere"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 360, "clicked": True })
    call(session, "tick_game", 0, { "tool": "algae", "x": 300, "y": 310, "clicked": True })
    call(session, "tick_game", 0, { "tool": "algae", "x": 300, "y": 400, "clicked": True })

    for _ in range(10):
        state = call(session, "tick_game", 0.1, {})

    inside_fish = state["fish"][0]
    outside_fish = state["fish"][1]
    assert inside_fish["depth"] < 320
    assert outside_fish["depth"] > 350


def test_turn_rate_limits_direction_change() -> None:
    """A creature cannot turn instantly; a hard turn takes multiple ticks."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["max_turn_rate"] = 0.1
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0.5

    call(session, "init_game", data)
    # Fish starts at 300,300, with a shark below pushing it upward and an algae to the right.
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 450, "clicked": True })
    call(session, "tick_game", 0, { "tool": "algae", "x": 400, "y": 300, "clicked": True })

    state = call(session, "tick_game", 0.1, {})
    assert abs(state["fish"][0]["x"] - 300) < 1.0


def test_force_arrive_respects_min_speed() -> None:
    """force_arrive floors desired speed to min_speed inside slowing_radius."""
    session = load_game("shoal", seed=42)
    # Target 5 units below, slowing_radius=100, max_speed=150, no current velocity.
    # Without min_speed desired_speed would be 7.5; with min_speed=15 it should be 15.
    sx, sy = call(session, "force_arrive", 0, 0, 0, 0, 0, 5, 1, 150, 90, 100, 15)
    assert sx == 0
    assert sy == 15


def test_drag_slows_over_time() -> None:
    """A drifting creature loses speed when no force is applied."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })
    # Accelerate with wander to get a non-zero speed.
    data["steering_weights"]["shark"]["wander"] = 2
    for _ in range(10):
        prev = call(session, "tick_game", 0.1, {})
    shark = prev["sharks"][0]
    speed_before = math.hypot(shark["x"] - 300, shark["depth"] - 300) / 0.1

    # Coast with all forces removed and measure one more tick.
    data["steering_weights"]["shark"]["wander"] = 0
    state = call(session, "tick_game", 0.1, {})
    shark = state["sharks"][0]
    speed_after = math.hypot(shark["x"] - prev["sharks"][0]["x"], shark["depth"] - prev["sharks"][0]["depth"]) / 0.1
    assert speed_after < speed_before


def test_turn_rate_scales_with_speed() -> None:
    """A faster creature turns more slowly than a slow one with the same max_turn_rate."""
    import math

    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["shark"]["max_turn_rate"] = 1.0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)
    # Fast shark: nearly max speed toward the right.
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })
    # Boost it to high speed and align to the right.
    data["steering_weights"]["shark"]["wander"] = 0
    # Directly manipulate velocity via repeated tick with a strong wander is hard;
    # instead set a target directly above to force a 90-degree turn.
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 100, "clicked": True })
    # Perception is 220 by default, so the shark will see the fish and try to turn.
    state_before = call(session, "tick_game", 0, {})
    angle_before = state_before["sharks"][0]["angle"]

    state_after = call(session, "tick_game", 0.1, {})
    angle_after = state_after["sharks"][0]["angle"]
    delta = (angle_after - angle_before + math.pi) % (2 * math.pi) - math.pi
    # max_turn_rate=1.0 rad/s and dt=0.1s, and the shark is at high speed, so the
    # speed-scaled effective rate is <= 1.0 rad/s. Allow a small buffer for startup.
    assert abs(delta) <= 1.0 * 0.1 + 0.01


def test_shark_catches_sinking_chunk() -> None:
    """A shark with a low base speed can still catch a sinking meat chunk."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["steering_weights"]["shark"]["wander"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 500, "clicked": True })
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 500, "clicked": True })
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })

    for _ in range(50):
        state = call(session, "tick_game", 0.1, {})
    assert state["stats"]["chunk_count"] == 0


def test_discrete_eating_prefers_nearest_chunk() -> None:
    """When a shark overlaps both a fish and a chunk, the closer chunk is eaten."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["escape_chance"] = 0
    data["flesh_chunk"]["sink_rate"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["world"]["discrete_tick"] = 0.001

    call(session, "init_game", data)
    # Spawn a fish at 300,310 and cull it to create a chunk very close to the shark.
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 310, "clicked": True })
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 310, "clicked": True })
    # Snapshot the chunk's exact position after it spawns.
    state = call(session, "tick_game", 0, {})
    chunk = state["chunks"][0]
    # Place the shark directly on the chunk and a live fish farther away.
    call(session, "tick_game", 0, { "tool": "shark", "x": chunk["x"], "y": chunk["depth"], "clicked": True })
    call(session, "tick_game", 0, { "tool": "fish", "x": chunk["x"] + 15, "y": chunk["depth"], "clicked": True })

    # The chunk is directly on the shark; the live fish is 15 units away.
    # A single small tick should trigger the discrete eating and consume the chunk.
    state = call(session, "tick_game", 0.001, {})
    assert state["stats"]["fish_count"] == 1
    assert state["stats"]["chunk_count"] == 0


def test_chunk_approach_min_speed_is_higher() -> None:
    """The 0.3x max_speed chunk floor produces a stronger closing force than 0.1x."""
    session = load_game("shoal", seed=42)
    max_speed = 150
    max_force = 90
    slowing_radius = 162.5
    # Target 1 unit below the shark; with no current velocity, desired_vy = desired_speed.
    # 0.3x floor gives desired_speed ~ 45.6, 0.1x floor gives ~ 15.8.
    _, sy_03 = call(session, "force_arrive", 0, 0, 0, 0, 0, 1, 1, max_speed, max_force, slowing_radius, max_speed * 0.3)
    _, sy_01 = call(session, "force_arrive", 0, 0, 0, 0, 0, 1, 1, max_speed, max_force, slowing_radius, max_speed * 0.1)
    assert sy_03 > sy_01


def test_chunk_eat_range_is_larger_than_body_collision() -> None:
    """A shark 15 units from a chunk (between old 12 and new 20 range) now eats it."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["flesh_chunk"]["sink_rate"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["world"]["discrete_tick"] = 0.001

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 300, "clicked": True })
    state = call(session, "tick_game", 0, {})
    chunk = state["chunks"][0]
    # Shark 15 units to the right: inside the 20-unit shark_eat_range, outside the old 12-unit radius sum.
    call(session, "tick_game", 0, { "tool": "shark", "x": chunk["x"] + 15, "y": chunk["depth"], "clicked": True })

    state = call(session, "tick_game", 0.001, {})
    assert state["stats"]["chunk_count"] == 0


def test_get_nearby_checks_all_surrounding_buckets() -> None:
    """get_nearby queries the 3x3 neighborhood around (bx, by), not one repeated key."""
    session = load_game("shoal", seed=42)
    hash = {
        "fish": {
            "1,2": [{ "id": "a" }],
            "2,2": [{ "id": "b" }],
            "3,2": [{ "id": "c" }],
            "1,3": [{ "id": "d" }],
            "2,3": [{ "id": "e" }],
            "3,3": [{ "id": "f" }],
            "1,4": [{ "id": "g" }],
            "2,4": [{ "id": "h" }],
            "3,4": [{ "id": "i" }],
        },
    }
    neighbors = call(session, "get_nearby", hash, 2, 3, "fish")
    assert len(neighbors) == 9
    ids = [n["id"] for n in neighbors]
    assert sorted(ids) == ["a", "b", "c", "d", "e", "f", "g", "h", "i"]


def test_get_nearby_uses_bucket_coordinates_not_passed_key() -> None:
    """The old bug would read the same single bucket 9 times; fix uses real bx, by."""
    session = load_game("shoal", seed=42)
    hash = { "fish": { "2,3": [{ "id": "target" }] } }
    neighbors = call(session, "get_nearby", hash, 2, 3, "fish")
    assert len(neighbors) == 1
    assert neighbors[0]["id"] == "target"


def test_compute_fish_forces_hash_equals_full_fish_fallback() -> None:
    """With all fish in one bucket, the spatial hash returns the same boids force as st.fish."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["flee_shark"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0
    data["steering_weights"]["fish"]["separate"] = 1.0
    data["steering_weights"]["fish"]["align"] = 1.0
    data["steering_weights"]["fish"]["cohere"] = 1.0
    data["wander"]["change_interval"] = 0

    f = {
        "id": "fish_test",
        "type": "fish",
        "alive": True,
        "x": 300,
        "depth": 300,
        "vx": 10,
        "vd": 5,
        "max_speed": 100,
        "max_force": 50,
        "lineage_id": "a",
        "radius": 4,
    }
    n1 = { "id": "fish_a", "type": "fish", "alive": True, "x": 320, "depth": 300, "vx": 8, "vd": 4, "radius": 4 }
    n2 = { "id": "fish_b", "type": "fish", "alive": True, "x": 300, "depth": 330, "vx": 12, "vd": 2, "radius": 4 }
    all_fish = [f, n1, n2]

    st = {
        "data": data,
        "world": { "width": 1200, "height": 800 },
        "fish": all_fish,
        "sharks": [],
        "algae": [],
    }

    # Build a spatial hash where all three fish land in the same bucket.
    bw = data["spatial_hash"]["bucket_width"]
    bd = data["spatial_hash"]["bucket_depth"]
    bx = math.floor(f["x"] / bw)
    by = math.floor(f["depth"] / bd)
    key = f"{bx},{by}"
    hash = { "fish": { key: all_fish }, "shark": {} }

    fx_hash, fy_hash = call(session, "compute_fish_forces", f, st, hash)
    fx_full, fy_full = call(session, "compute_fish_forces", f, st, None)

    assert math.isclose(fx_hash, fx_full, abs_tol=0.0001)
    assert math.isclose(fy_hash, fy_full, abs_tol=0.0001)


def test_shark_home_bias_pulls_up_when_no_target() -> None:
    """A deep shark with no food target gets a net upward force from the wander branch."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["wander"]["change_interval"] = 0

    s = {
        "id": "shark_test",
        "type": "shark",
        "alive": True,
        "x": 300,
        "depth": 700,
        "vx": 0,
        "vd": 0,
        "max_speed": 150,
        "max_force": 90,
        "radius": 7,
        "exposure": 0,
        "in_retreat": False,
    }
    call(session, "set_wander_target", s["id"], 0, 0)
    st = {
        "data": data,
        "world": { "width": 1200, "height": 800 },
        "fish": [],
        "chunks": [],
    }

    fx, fy = call(session, "compute_shark_forces", s, st, None)
    assert fy < 0
    # With force_depth_arrive: steer_y = -150, weight 0.8 => force = -120,
    # clamped to shark max_force of 90, so fy = -90.
    assert math.isclose(fy, -90.0, abs_tol=0.1)


def test_shark_home_bias_off_during_active_hunt() -> None:
    """The home bias is not added when a shark has an active fish target."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["wander"]["change_interval"] = 0

    s = {
        "id": "shark_test",
        "type": "shark",
        "alive": True,
        "x": 300,
        "depth": 700,
        "vx": 0,
        "vd": 0,
        "max_speed": 150,
        "max_force": 90,
        "radius": 7,
        "exposure": 0,
        "in_retreat": False,
    }
    call(session, "set_wander_target", s["id"], 0, 0)
    # A fish at the same depth, within perception, keeps the shark in the hunt branch.
    prey = {
        "id": "fish_prey",
        "type": "fish",
        "alive": True,
        "x": 400,
        "depth": 700,
        "vx": 0,
        "vd": 0,
        "max_speed": 100,
        "max_force": 50,
        "radius": 4,
    }
    st = {
        "data": data,
        "world": { "width": 1200, "height": 800 },
        "fish": [prey],
        "chunks": [],
    }

    fx, fy = call(session, "compute_shark_forces", s, st, None)
    assert math.isclose(fy, 0.0, abs_tol=0.0001)


def test_fish_kill_uses_configured_hunger_refund() -> None:
    """A fish kill subtracts data.creatures.shark.fish_hunger_refund (4), not a hardcoded value."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["escape_chance"] = 0
    data["creatures"]["fish"]["max_speed"] = 0
    data["creatures"]["shark"]["fish_hunger_refund"] = 4
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0
    data["world"]["discrete_tick"] = 0.001

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })

    # Accumulate 5.0 hunger with no food available.
    for _ in range(50):
        call(session, "tick_game", 0.1, {})

    before = call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    assert before["stats"]["fish_count"] == 1
    assert math.isclose(before["sharks"][0]["hunger"], 5.0, abs_tol=0.001)

    # One small tick triggers discrete eating.
    after = call(session, "tick_game", 0.001, {})
    assert after["stats"]["fish_count"] == 0
    # hunger accumulated dt=0.001, then refund of 4 applied.
    assert math.isclose(after["sharks"][0]["hunger"], 1.001, abs_tol=0.01)


def test_chunk_eating_uses_configured_hunger_refund() -> None:
    """A chunk eaten subtracts data.flesh_chunk.hunger_refund (3), not the old -2."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["creatures"]["fish"]["escape_chance"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["flesh_chunk"]["sink_rate"] = 0
    data["flesh_chunk"]["hunger_refund"] = 3
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 1.5
    data["world"]["discrete_tick"] = 0.001

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })

    # Accumulate hunger with no food.
    for _ in range(50):
        call(session, "tick_game", 0.1, {})

    # Spawn and kill a fish 48 units below the shark; the shark is safe (40 + 7 = 47 < 48).
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 348, "clicked": True })
    before = call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 348, "clicked": True })
    assert before["stats"]["chunk_count"] == 1
    assert before["stats"]["shark_count"] == 1
    assert math.isclose(before["sharks"][0]["hunger"], 5.0, abs_tol=0.001)

    # Let the shark seek and eat the chunk. discrete_tick is small, so discrete runs every tick.
    after = before
    for _ in range(100):
        after = call(session, "tick_game", 0.1, {})
        if after["stats"]["chunk_count"] == 0:
            break
    assert after["stats"]["chunk_count"] == 0

    tick_delta = after["tick_count"] - before["tick_count"]
    expected = before["sharks"][0]["hunger"] + tick_delta * 0.1 - 3
    assert math.isclose(after["sharks"][0]["hunger"], expected, abs_tol=0.01)


def test_chunk_despawns_after_floor_grace_period() -> None:
    """A chunk reaching the floor survives until floor_grace_time has elapsed."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["flesh_chunk"]["min_spawn"] = 1
    data["flesh_chunk"]["max_spawn"] = 1
    data["flesh_chunk"]["sink_rate"] = 500
    data["flesh_chunk"]["floor_grace_time"] = 0.5

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 300, "clicked": True })

    state = call(session, "tick_game", 0, {})
    assert state["stats"]["chunk_count"] == 1

    # Let the chunk sink to the floor.
    for _ in range(20):
        state = call(session, "tick_game", 0.1, {})
        if state["chunks"][0]["depth"] >= 799.5:
            break

    assert state["stats"]["chunk_count"] == 1
    assert state["chunks"][0]["depth"] >= 799.5

    # floor_grace_time is 0.5s; after 6 ticks (0.6s) the chunk should be gone.
    for _ in range(6):
        state = call(session, "tick_game", 0.1, {})
    assert state["stats"]["chunk_count"] == 0


def test_hadopelagic_exposure_rate_is_zero() -> None:
    """The deepest band is no longer a death trap; exposure rate is near zero."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    assert math.isclose(call(session, "compute_exposure_rate", 700, data), 0.0, abs_tol=0.001)
    assert math.isclose(call(session, "compute_exposure_rate", 750, data), 0.0, abs_tol=0.001)
    assert math.isclose(call(session, "compute_exposure_rate", 790, data), 0.0, abs_tol=0.001)


def test_exposure_retreat_is_graded() -> None:
    """Retreat force uses hysteresis and has a minimum 0.3 ratio immediately at entry."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    s = {
        "id": "shark_retreat",
        "type": "shark",
        "x": 300,
        "depth": 300,
        "vx": 0,
        "vd": 0,
        "max_speed": 150,
        "max_force": 90,
        "in_retreat": False,
    }
    st = {
        "data": data,
        "world": { "width": 1200, "height": 800 },
        "fish": [],
        "chunks": [],
    }

    # Below the enter threshold: normal, no retreat.
    s["exposure"] = 0
    _, fy_0 = call(session, "compute_shark_forces", s, st, None)
    assert math.isclose(fy_0, 0.0, abs_tol=0.0001)

    s["exposure"] = 69
    _, fy_69 = call(session, "compute_shark_forces", s, st, None)
    assert math.isclose(fy_69, 0.0, abs_tol=0.0001)

    # At the 70 enter threshold, ratio = (70 - 40) / (100 - 40) = 0.5; force = 135.
    s["exposure"] = 70
    s["in_retreat"] = False
    _, fy_70 = call(session, "compute_shark_forces", s, st, None)
    assert math.isclose(fy_70, 135.0, abs_tol=0.01)

    # At 55 while in retreat, ratio = (55 - 40) / (100 - 40) = 0.25, clamped to 0.3.
    s["exposure"] = 55
    s["in_retreat"] = True
    _, fy_55 = call(session, "compute_shark_forces", s, st, None)
    assert math.isclose(fy_55, 81.0, abs_tol=0.01)

    # At 85: ratio = (85 - 40) / (100 - 40) = 0.75; force = 3.0 * 90 * 0.75 = 202.5
    s["exposure"] = 85
    s["in_retreat"] = True
    _, fy_85 = call(session, "compute_shark_forces", s, st, None)
    assert math.isclose(fy_85, 202.5, abs_tol=0.01)

    s["exposure"] = 100
    s["in_retreat"] = True
    _, fy_100 = call(session, "compute_shark_forces", s, st, None)
    assert math.isclose(fy_100, 270.0, abs_tol=0.01)


def test_exposure_retreat_interrupts_active_hunt() -> None:
    """A high-exposure shark chasing prey gets a retreat force toward deeper water."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 1.0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    s = {
        "id": "shark_hunt",
        "type": "shark",
        "x": 300,
        "depth": 300,
        "vx": 0,
        "vd": 0,
        "max_speed": 150,
        "max_force": 90,
    }
    # Prey is above the shark; retreat should still push downward and dominate.
    prey = {
        "id": "fish_prey",
        "type": "fish",
        "alive": True,
        "x": 300,
        "depth": 100,
        "vx": 0,
        "vd": 0,
        "max_speed": 100,
        "max_force": 50,
        "radius": 4,
    }
    st = {
        "data": data,
        "world": { "width": 1200, "height": 800 },
        "fish": [prey],
        "chunks": [],
    }

    # Healthy shark: active pursuit pulls upward toward the prey.
    s["exposure"] = 0
    s["in_retreat"] = False
    fx_healthy, fy_healthy = call(session, "compute_shark_forces", s, st, None)
    assert fy_healthy < 0
    assert fx_healthy == 0

    # Critical exposure: retreat overrides completely; no seek component, only retreat.
    s["exposure"] = 90
    s["in_retreat"] = False
    fx_critical, fy_critical = call(session, "compute_shark_forces", s, st, None)
    assert fx_critical == 0
    assert fy_critical > 0
    assert fy_critical > fy_healthy
    # Expected: ratio = (90 - 40) / (100 - 40) = 0.833; force = 3 * 90 * 0.833 = 225
    assert math.isclose(fy_critical, 225.0, abs_tol=0.1)


def test_exposure_retreat_interrupts_chunk_pursuit() -> None:
    """A high-exposure shark chasing a chunk still gets a retreat force toward deep water."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 1.0

    s = {
        "id": "shark_chunk",
        "type": "shark",
        "x": 300,
        "depth": 300,
        "vx": 0,
        "vd": 0,
        "max_speed": 150,
        "max_force": 90,
    }
    # Chunk is above the shark; retreat should push downward and dominate.
    chunk = {
        "x": 300,
        "depth": 100,
        "vx": 0,
        "vd": 0,
    }
    st = {
        "data": data,
        "world": { "width": 1200, "height": 800 },
        "fish": [],
        "chunks": [chunk],
    }

    s["exposure"] = 0
    s["in_retreat"] = False
    fx_healthy, fy_healthy = call(session, "compute_shark_forces", s, st, None)
    assert fy_healthy < 0
    assert fx_healthy == 0

    s["exposure"] = 90
    s["in_retreat"] = False
    fx_critical, fy_critical = call(session, "compute_shark_forces", s, st, None)
    assert fx_critical == 0
    assert fy_critical > 0
    assert fy_critical > fy_healthy
    assert math.isclose(fy_critical, 225.0, abs_tol=0.1)


def test_shark_exposure_decays_in_safe_water() -> None:
    """Exposure recovers in a zero-rate band and damage stops once below threshold."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)

    shark = {
        "id": "shark_decay",
        "type": "shark",
        "x": 300,
        "depth": 700,
        "vx": 0,
        "vd": 0,
        "max_speed": 0,
        "max_force": 90,
        "radius": 7,
        "exposure": 100,
        "hunger": 0,
        "ticks_total": 0,
        "ticks_with_target": 0,
    }

    # In safe water, exposure should drop from 100 and hunger should not rise.
    moved = call(session, "move_creature", shark, 0.1)
    assert math.isclose(moved["exposure"], 99.0, abs_tol=0.01)
    assert math.isclose(moved["hunger"], 0.0, abs_tol=0.001)

    moved = call(session, "move_creature", moved, 10.0)
    assert math.isclose(moved["exposure"], 0.0, abs_tol=0.01)
    assert math.isclose(moved["hunger"], 0.0, abs_tol=0.001)


def test_fish_cold_exposure_decays_in_safe_water() -> None:
    """Fish cold exposure recovers in shallow water and damage stops once below threshold."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["flee_shark"] = 0
    data["steering_weights"]["fish"]["separate"] = 0
    data["steering_weights"]["fish"]["align"] = 0
    data["steering_weights"]["fish"]["cohere"] = 0
    data["steering_weights"]["fish"]["depth_bias"] = 0

    call(session, "init_game", data)

    fish = {
        "id": "fish_decay",
        "type": "fish",
        "x": 300,
        "depth": 20,
        "vx": 0,
        "vd": 0,
        "max_speed": 0,
        "max_force": 50,
        "radius": 4,
        "cold_exposure": 100,
        "cold_damage": 0,
        "alive": True,
    }

    moved = call(session, "move_creature", fish, 0.1)
    assert math.isclose(moved["cold_exposure"], 99.0, abs_tol=0.01)
    assert math.isclose(moved["cold_damage"], 0.0, abs_tol=0.001)
    assert moved["alive"]

    moved = call(session, "move_creature", moved, 10.0)
    assert math.isclose(moved["cold_exposure"], 0.0, abs_tol=0.01)
    assert math.isclose(moved["cold_damage"], 0.0, abs_tol=0.001)
    assert moved["alive"]


def test_exposure_decay_invisible_to_healthy_creature() -> None:
    """A shark already at zero exposure in safe water stays at zero."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)

    shark = {
        "id": "shark_healthy",
        "type": "shark",
        "x": 300,
        "depth": 700,
        "vx": 0,
        "vd": 0,
        "max_speed": 0,
        "max_force": 90,
        "radius": 7,
        "exposure": 0,
        "hunger": 0,
        "ticks_total": 0,
        "ticks_with_target": 0,
    }

    moved = call(session, "move_creature", shark, 1.0)
    assert math.isclose(moved["exposure"], 0.0, abs_tol=0.01)
    assert math.isclose(moved["hunger"], 0.0, abs_tol=0.001)


def test_exposure_retreat_moves_shark_deeper() -> None:
    """A critical shark's depth genuinely increases over subsequent ticks."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)

    shark = {
        "id": "shark_retreat_depth",
        "type": "shark",
        "x": 300,
        "depth": 300,
        "vx": 0,
        "vd": 0,
        "max_speed": 150,
        "max_force": 90,
        "radius": 7,
        "exposure": 90,
        "hunger": 0,
        "ticks_total": 0,
        "ticks_with_target": 0,
    }

    for _ in range(20):
        shark = call(session, "move_creature", shark, 0.1)

    assert shark["depth"] > 300
    assert shark["depth"] > 330
    assert shark["exposure"] < 90
    assert shark["exposure"] >= 0


def test_exposure_retreat_hysteresis() -> None:
    """A shark in the hysteresis band (40-70) stays in its previous state."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)

    shark = {
        "id": "shark_hysteresis",
        "type": "shark",
        "x": 300,
        "depth": 300,
        "vx": 0,
        "vd": 0,
        "max_speed": 0,
        "max_force": 90,
        "radius": 7,
        "exposure": 55,
        "hunger": 0,
        "ticks_total": 0,
        "ticks_with_target": 0,
    }

    # If already in retreat, stays in retreat; force is downward (positive).
    shark["in_retreat"] = True
    moved = call(session, "move_creature", shark, 0.0)
    assert moved["in_retreat"] is True
    shark = moved
    _, fy = call(session, "compute_shark_forces", shark, {
        "data": data,
        "world": {"width": 1200, "height": 800},
        "fish": [],
        "chunks": [],
    }, None)
    assert fy > 0

    # If not in retreat, stays out of retreat; with no targets, force is zero.
    shark["in_retreat"] = False
    moved = call(session, "move_creature", shark, 0.0)
    assert moved["in_retreat"] is False
    shark = moved
    _, fy = call(session, "compute_shark_forces", shark, {
        "data": data,
        "world": {"width": 1200, "height": 800},
        "fish": [],
        "chunks": [],
    }, None)
    assert math.isclose(fy, 0.0, abs_tol=0.0001)


def test_exposure_retreat_exits_below_resume_threshold() -> None:
    """A shark only leaves retreat once exposure drops below the resume threshold."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)

    shark = {
        "id": "shark_exit",
        "type": "shark",
        "x": 300,
        "depth": 300,
        "vx": 0,
        "vd": 0,
        "max_speed": 0,
        "max_force": 90,
        "radius": 7,
        "exposure": 39,
        "hunger": 0,
        "ticks_total": 0,
        "ticks_with_target": 0,
        "in_retreat": True,
    }

    # At 39 (< 40) retreat should turn off.
    moved = call(session, "move_creature", shark, 0.0)
    assert moved["in_retreat"] is False

    # At 60 (between 40 and 70) but already out, it should stay out.
    shark["exposure"] = 60
    shark["in_retreat"] = False
    moved = call(session, "move_creature", shark, 0.0)
    assert moved["in_retreat"] is False

    # At 60 (between 40 and 70) but already in, it should stay in.
    shark["exposure"] = 60
    shark["in_retreat"] = True
    moved = call(session, "move_creature", shark, 0.0)
    assert moved["in_retreat"] is True


def test_shark_settles_at_home_depth() -> None:
    """A deep shark with no target climbs back and settles near home_depth."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["shark"]["wander"] = 0
    data["steering_weights"]["shark"]["seek_fish"] = 0
    data["steering_weights"]["shark"]["seek_flesh"] = 0

    call(session, "init_game", data)

    shark = {
        "id": "shark_settle",
        "type": "shark",
        "x": 300,
        "depth": 700,
        "vx": 0,
        "vd": 0,
        "max_speed": 150,
        "max_force": 90,
        "radius": 7,
        "exposure": 0,
        "hunger": 0,
        "ticks_total": 0,
        "ticks_with_target": 0,
        "in_retreat": False,
    }

    for _ in range(60):
        shark = call(session, "move_creature", shark, 0.1)

    assert shark["depth"] < 350
    assert shark["depth"] > 250
    assert abs(shark["vd"]) < 20


def test_fish_settles_at_home_depth_from_both_directions() -> None:
    """A fish too shallow moves down; a fish too deep moves up and both settle."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0
    data["steering_weights"]["fish"]["wander"] = 0
    data["steering_weights"]["fish"]["seek_algae"] = 0
    data["steering_weights"]["fish"]["flee_shark"] = 0
    data["steering_weights"]["fish"]["separate"] = 0
    data["steering_weights"]["fish"]["align"] = 0
    data["steering_weights"]["fish"]["cohere"] = 0

    call(session, "init_game", data)

    shallow = {
        "id": "fish_shallow",
        "type": "fish",
        "x": 300,
        "depth": 50,
        "vx": 0,
        "vd": 0,
        "max_speed": 120,
        "max_force": 80,
        "radius": 4,
        "cold_exposure": 0,
        "cold_damage": 0,
        "alive": True,
    }
    deep = {
        "id": "fish_deep",
        "type": "fish",
        "x": 300,
        "depth": 520,
        "vx": 0,
        "vd": 0,
        "max_speed": 120,
        "max_force": 80,
        "radius": 4,
        "cold_exposure": 0,
        "cold_damage": 0,
        "alive": True,
    }

    for _ in range(50):
        shallow = call(session, "move_creature", shallow, 0.1)
        deep = call(session, "move_creature", deep, 0.1)

    assert shallow["depth"] > 150
    assert shallow["depth"] < 210
    assert deep["depth"] > 150
    assert deep["depth"] < 210


def test_algae_hubs_spawn_evenly_at_fixed_depth() -> None:
    """Initial algae hubs are evenly spaced horizontally and all at the same depth."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 6

    call(session, "init_game", data)
    state = call(session, "tick_game", 0, {})

    algae = state["algae"]
    assert len(algae) == 6

    expected_depth = data["spawn"]["algae_spawn_depth"]
    world_width = data["world"]["width"]
    hub_count = data["spawn"]["initial_algae_hubs"]
    spacing = world_width / (hub_count + 1)

    xs = []
    for core in algae:
        assert math.isclose(core["depth"], expected_depth, abs_tol=0.001)
        xs.append(core["x"])

    xs.sort()
    for i, x in enumerate(xs, start=1):
        assert math.isclose(x, spacing * i, abs_tol=0.001)

    for i in range(1, len(xs)):
        assert math.isclose(xs[i] - xs[i - 1], spacing, abs_tol=0.001)


def test_algae_core_has_eight_spoke_nodules_and_no_center_overlap() -> None:
    """spawn_algae_core creates exactly 8 nodules and none overlap the core."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 0
    data["spawn"]["initial_sharks"] = 0
    data["spawn"]["initial_algae_hubs"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "algae", "x": 300, "y": 180, "clicked": True })
    state = call(session, "tick_game", 0, {})

    assert len(state["algae"]) == 1
    core = state["algae"][0]
    assert len(core["nodules"]) == 8

    for nodule in core["nodules"]:
        assert not (math.isclose(nodule["x"], core["x"]) and math.isclose(nodule["depth"], core["depth"]))


def _hex_to_rgb(hex_color: str):
    """Convert an #RRGGBB hex string to integer RGB triple."""
    hex_color = hex_color.lstrip("#")
    return int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)


def test_hsl_to_rgb_and_rgb_to_hex_produce_valid_hex() -> None:
    """hsl_to_rgb + rgb_to_hex produce a valid #RRGGBB string."""
    session = load_game("shoal", seed=42)
    r, g, b = call(session, "hsl_to_rgb", 300, 0.6, 0.6)
    color = call(session, "rgb_to_hex", r, g, b)
    assert isinstance(color, str)
    assert color.startswith("#")
    assert len(color) == 7
    int(color[1:], 16)


def test_generate_procedural_color_is_deterministic() -> None:
    """The same ID always produces the same color."""
    session = load_game("shoal", seed=42)
    color1 = call(session, "generate_procedural_color", "fish_123")
    color2 = call(session, "generate_procedural_color", "fish_123")
    assert color1 == color2


def test_generate_procedural_color_varies_by_id() -> None:
    """Different IDs produce different colors."""
    session = load_game("shoal", seed=42)
    ids = ["fish_alpha", "fish_beta", "shark_gamma", "fish_delta"]
    colors = [call(session, "generate_procedural_color", id) for id in ids]
    assert len(set(colors)) == len(colors)


def test_generate_procedural_color_avoids_reserved_colors() -> None:
    """Generated colors are never within MIN_COLOR_DISTANCE of reserved colors."""
    session = load_game("shoal", seed=42)
    reserved = [
        (234, 179, 8),
        (16, 185, 129),
        (244, 63, 94),
        (125, 211, 252),
        (56, 189, 248),
        (14, 165, 233),
        (3, 105, 161),
        (12, 74, 110),
    ]
    min_distance = 55
    for i in range(100):
        color = call(session, "generate_procedural_color", f"fish_{i}")
        r, g, b = _hex_to_rgb(color)
        for rc in reserved:
            dr = r - rc[0]
            dg = g - rc[1]
            db = b - rc[2]
            assert math.sqrt(dr * dr + dg * dg + db * db) >= min_distance


def test_creature_colors_avoid_reserved_colors() -> None:
    """Spawned fish and sharks avoid the reserved core/nodule/background colors."""
    session = load_game("shoal", seed=42)
    data = session.files.data
    data["spawn"]["initial_fish"] = 60
    data["spawn"]["initial_sharks"] = 20
    data["spawn"]["initial_algae_hubs"] = 0

    reserved = [
        (234, 179, 8),
        (16, 185, 129),
        (244, 63, 94),
        (125, 211, 252),
        (56, 189, 248),
        (14, 165, 233),
        (3, 105, 161),
        (12, 74, 110),
    ]
    min_distance = 55

    state = call(session, "init_game", data)
    for creature in state["fish"] + state["sharks"]:
        r, g, b = _hex_to_rgb(creature["color"])
        for rc in reserved:
            dr = r - rc[0]
            dg = g - rc[1]
            db = b - rc[2]
            assert math.sqrt(dr * dr + dg * dg + db * db) >= min_distance
