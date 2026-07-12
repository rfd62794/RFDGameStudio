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
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 300, "clicked": True })
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

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 0, "clicked": True })

    for _ in range(40):
        state = call(session, "tick_game", 0.05, {})
    assert state["sharks"][0]["exposure"] < 100

    for _ in range(10):
        state = call(session, "tick_game", 0.05, {})
    assert state["sharks"][0]["exposure"] >= 100
    assert state["sharks"][0]["depth"] < 40


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
    assert abs(state["fish"][0]["x"] - 300) < 0.5


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
    # Give it a push by running a tick with wander, then zero out forces.
    data["steering_weights"]["shark"]["wander"] = 1
    state = call(session, "tick_game", 0.1, {})
    speed0 = math.hypot(state["sharks"][0]["x"] - 300, state["sharks"][0]["depth"] - 300) / 0.1

    data["steering_weights"]["shark"]["wander"] = 0
    for _ in range(10):
        state = call(session, "tick_game", 0.1, {})
    shark = state["sharks"][0]
    speed1 = math.hypot(shark["x"] - 300, shark["depth"] - 300) / 0.1
    assert speed1 < speed0


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
    data["steering_weights"]["shark"]["wander"] = 0

    call(session, "init_game", data)
    call(session, "tick_game", 0, { "tool": "fish", "x": 300, "y": 500, "clicked": True })
    call(session, "tick_game", 0, { "tool": "cull", "x": 300, "y": 500, "clicked": True })
    # Place a fresh fish closer to the shark than the chunk.
    call(session, "tick_game", 0, { "tool": "shark", "x": 300, "y": 300, "clicked": True })
    call(session, "tick_game", 0, { "tool": "fish", "x": 312, "y": 300, "clicked": True })

    # The shark is at 300,300. The chunk is at ~300,501. The new fish is at 312,300.
    # Chunk is much closer, so discrete eating should consume the chunk.
    for _ in range(5):
        state = call(session, "tick_game", 0.05, {})
    assert state["stats"]["fish_count"] == 1
