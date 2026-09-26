"""test_slimeworld_regent_awards.py — Discovery -> Regent earn-loop tests.

Covers the SlimeBreeder DISCOVERY_REGENT_REWARDS port
(docs/analysis/slimebreeder-absorption.md step-2 item 1): typed regent
awards on a bred slime's FIRST color/shape/accent-target match and on each
region unlock. Lua computes the award list (compute_regent_awards) and
attaches it to the bred child as child.regent_awards; reward amounts come
from data.yaml's regent_rewards block.
"""

from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _data(key):
    return _load().files.data[key]


def _color_specs():
    data = _load().files.data
    specs = {}
    for key, culture in data["cultures"].items():
        specs[culture["color"]] = {
            "base_stats": culture["base_stats"],
            "growth": culture["growth"],
        }
    gray = data["neutral_traits"]["gray"]
    specs["Gray"] = {
        "base_stats": gray["base_stats"],
        "growth": gray["growth"],
    }
    return specs


def _slime(slime_id, color, hue, saturation, vertex_count=3, irregularity=10,
           diffusion_ratio=20, amplitude=40):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "hue": hue,
        "saturation": saturation, "generation": 0, "vertex_count": vertex_count,
        "irregularity": irregularity, "diffusion_ratio": diffusion_ratio,
        "amplitude": amplitude,
    }


def _state(slimes, **overrides):
    state = {"slimes": slimes, "roster_cap": 10, "credits": 100, "cycle": 1}
    state.update(overrides)
    return state


def _child(**overrides):
    child = {
        "id": "child_1",
        "matched_target_id": None,
        "matched_shape_target_id": None,
        "matched_accent_target_ids": [],
        "region_unlocks": [],
    }
    child.update(overrides)
    return child


def _awards_for(awards, inventory=None, key=None, reason=None):
    return [
        a for a in (awards or [])
        if (inventory is None or a["inventory"] == inventory)
        and (key is None or a["key"] == key)
        and (reason is None or a["reason"] == reason)
    ]


# --- regent_tier_reward -----------------------------------------------------

def test_tier_reward_follows_data_curve():
    """The ported curve: T1 earns 0, T2=5, T3=15, T4=40, T5 extends to 100."""
    session = _load()
    curve = _data("regent_rewards")["tier_curve"]
    assert [session.executor.call("regent_tier_reward", curve, t) for t in range(1, 6)] == [0, 5, 15, 40, 100]


def test_tier_reward_unknown_tier_earns_zero():
    """Tiers past the curve and nil tier earn nothing — archive T1 semantics."""
    session = _load()
    curve = _data("regent_rewards")["tier_curve"]
    assert session.executor.call("regent_tier_reward", curve, 6) == 0
    assert session.executor.call("regent_tier_reward", curve, None) == 0
    assert session.executor.call("regent_tier_reward", None, 3) == 0


# --- match_accent_targets ---------------------------------------------------

def test_match_accent_targets_diffusion_band():
    """Diffusion 20 lands in Polka's band; amplitude 40 lands in no band."""
    session = _load()
    accent_targets = _data("accent_targets")
    result = session.executor.call(
        "match_accent_targets", {"diffusion_ratio": 20, "amplitude": 40}, accent_targets
    )
    assert result == ["accent_polka"]


def test_match_accent_targets_both_axes():
    """A slime can match one diffusion band and one amplitude band at once."""
    session = _load()
    accent_targets = _data("accent_targets")
    result = session.executor.call(
        "match_accent_targets", {"diffusion_ratio": 50, "amplitude": 30}, accent_targets
    )
    assert result == ["accent_stripe", "accent_glow"]


def test_match_accent_targets_metallic_stacks():
    """Metallic is dual-axis and stacks on top of the band matches it overlaps."""
    session = _load()
    accent_targets = _data("accent_targets")
    result = session.executor.call(
        "match_accent_targets", {"diffusion_ratio": 45, "amplitude": 70}, accent_targets
    )
    assert result == ["accent_stripe", "accent_obsidian", "accent_metallic"]


def test_match_accent_targets_gap_returns_empty():
    """Diffusion 35 and amplitude 50 sit in dead zones between bands."""
    session = _load()
    accent_targets = _data("accent_targets")
    result = session.executor.call(
        "match_accent_targets", {"diffusion_ratio": 35, "amplitude": 50}, accent_targets
    )
    assert not result


# --- compute_regent_awards: discovery matches --------------------------------

def test_first_color_target_match_awards_target_regents():
    """First guild-tier match pays curve[2]=5 Target Regents keyed by target id."""
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]), _child(matched_target_id="guild_ember_marsh"),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    hits = _awards_for(awards, inventory="target", key="guild_ember_marsh", reason="discovery")
    assert len(hits) == 1
    assert hits[0]["amount"] == 5
    assert hits[0]["name"] == "Thornward"


def test_color_target_tiers_scale_along_curve():
    """Rival pays 15, arc pays 40, skip pays 100 — the archive curve extended."""
    session = _load()
    for target_id, amount in [
        ("rival_ember_tundra", 15),
        ("arc_ember_marsh_gale", 40),
        ("skip_ember_gale_crystal", 100),
    ]:
        awards = session.executor.call(
            "compute_regent_awards",
            _state([]), _child(matched_target_id=target_id),
            _data("color_targets"), _data("shape_targets"),
            _data("accent_targets"), _data("region_locks"),
            _data("regent_rewards"),
        )
        hits = _awards_for(awards, inventory="target", key=target_id)
        assert len(hits) == 1, f"{target_id}: expected one award, got {awards}"
        assert hits[0]["amount"] == amount


def test_repeat_color_match_awards_nothing():
    """A target already in color_target_codex earns no second award."""
    session = _load()
    state = _state([], color_target_codex={"guild_ember_marsh": True})
    awards = session.executor.call(
        "compute_regent_awards",
        state, _child(matched_target_id="guild_ember_marsh"),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    assert _awards_for(awards, key="guild_ember_marsh") == []


def test_first_shape_target_match_scales_by_numeric_tier():
    """Shape targets use their literal tier: T2=5, T4=40, T5=100."""
    session = _load()
    for target_id, amount in [
        ("shape_pentagon", 5),
        ("shape_heptadecagon", 40),
        ("shape_prismatic", 100),
    ]:
        awards = session.executor.call(
            "compute_regent_awards",
            _state([]), _child(matched_shape_target_id=target_id),
            _data("color_targets"), _data("shape_targets"),
            _data("accent_targets"), _data("region_locks"),
            _data("regent_rewards"),
        )
        hits = _awards_for(awards, inventory="target", key=target_id)
        assert len(hits) == 1, f"{target_id}: expected one award, got {awards}"
        assert hits[0]["amount"] == amount


def test_tier1_shape_match_earns_nothing():
    """Tier-1 discoveries earn zero — matching the archive's missing T1 row."""
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]), _child(matched_shape_target_id="shape_triangle"),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    assert _awards_for(awards, key="shape_triangle") == []


def test_first_accent_match_awards_membrane_regents():
    """Accent discoveries pay Membrane (pattern) Regents keyed by pattern name."""
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]), _child(matched_accent_target_ids=["accent_ringed"]),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    hits = _awards_for(awards, inventory="pattern", key="Ringed", reason="discovery")
    assert len(hits) == 1
    assert hits[0]["amount"] == 40


def test_metallic_accent_awards_target_regents():
    """Metallic has no SlimePattern — its regents land in the target pool."""
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]), _child(matched_accent_target_ids=["accent_metallic"]),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    hits = _awards_for(awards, inventory="target", key="accent_metallic", reason="discovery")
    assert len(hits) == 1
    assert hits[0]["amount"] == 100


def test_repeat_accent_match_awards_nothing():
    session = _load()
    state = _state([], accent_target_codex={"accent_polka": True})
    awards = session.executor.call(
        "compute_regent_awards",
        state, _child(matched_accent_target_ids=["accent_polka"]),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    assert _awards_for(awards, inventory="pattern") == []


# --- compute_regent_awards: region unlocks -----------------------------------

def test_region_unlock_awards_culture_chromoplasm():
    """Unlock pays Chromoplasm Regents of the gating culture's faction color."""
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]), _child(region_unlocks=["node_frontier_a"]),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    # node_frontier_a gates on guild_ember_marsh (rank 2 -> 5); its first
    # center hue (30) snaps to the Red faction anchor.
    hits = _awards_for(awards, inventory="color", reason="region_unlock")
    assert len(hits) == 1
    assert hits[0]["key"] == "Red"
    assert hits[0]["amount"] == 5
    assert hits[0]["node_id"] == "node_frontier_a"


def test_convergence_unlock_pays_gray_at_top_tier():
    """Convergence has no color target — Void/Gray chromoplasm at the metallic tier."""
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]), _child(region_unlocks=["node_convergence"]),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    hits = _awards_for(awards, inventory="color", reason="region_unlock")
    assert len(hits) == 1
    assert hits[0]["key"] == "Gray"
    assert hits[0]["amount"] == 100


def test_unlock_unknown_node_awards_nothing():
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]), _child(region_unlocks=["node_does_not_exist"]),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        _data("regent_rewards"),
    )
    assert _awards_for(awards, reason="region_unlock") == []


def test_nil_rewards_disables_the_loop():
    """No regent_rewards table -> no awards at all (feature off)."""
    session = _load()
    awards = session.executor.call(
        "compute_regent_awards",
        _state([]),
        _child(matched_target_id="guild_ember_marsh", region_unlocks=["node_frontier_a"]),
        _data("color_targets"), _data("shape_targets"),
        _data("accent_targets"), _data("region_locks"),
        None,
    )
    assert not awards


# --- initiate_breeding integration -------------------------------------------

def _breed(state, parent_a_id, parent_b_id, active_target_regent=None, with_rewards=True):
    session = _load()
    args = [
        "initiate_breeding", state, parent_a_id, parent_b_id, 0,
        _data("color_targets"), active_target_regent, _data("shape_targets"),
        None, _color_specs(), _data("region_locks"), _data("accent_targets"),
    ]
    if with_rewards:
        args.append(_data("regent_rewards"))
    return session.executor.call(*args)


def test_initiate_breeding_emits_typed_awards():
    """Guided first breed: color-target + accent + region-unlock awards all fire."""
    # Red x Red starters nudged toward guild_ember_marsh reproduce the real
    # first-breed path: child matches the color target, lands in Polka's
    # accent band, breeds a tier-1 Triangle, and unlocks node_frontier_a.
    state = _state([_slime("a", "Red", 0, 100), _slime("b", "Red", 0, 100)])
    child, error = _breed(state, "a", "b", "guild_ember_marsh")
    assert error is None
    assert child["matched_target_id"] == "guild_ember_marsh"
    assert child["matched_accent_target_ids"] == ["accent_polka"]
    assert "node_frontier_a" in child["region_unlocks"]

    awards = child["regent_awards"]
    target_hits = _awards_for(awards, inventory="target", key="guild_ember_marsh")
    pattern_hits = _awards_for(awards, inventory="pattern", key="Polka")
    unlock_hits = _awards_for(awards, inventory="color", reason="region_unlock")
    assert len(target_hits) == 1 and target_hits[0]["amount"] == 5
    assert len(pattern_hits) == 1 and pattern_hits[0]["amount"] == 5
    assert len(unlock_hits) == 1 and unlock_hits[0]["amount"] == 5
    # Tier-1 Triangle match is recorded but earns nothing.
    assert _awards_for(awards, key="shape_triangle") == []


def test_initiate_breeding_repeat_match_awards_nothing():
    """Same breed with all codices pre-marked and the region unlocked -> empty."""
    state = _state(
        [_slime("a", "Red", 0, 100), _slime("b", "Red", 0, 100)],
        color_target_codex={"guild_ember_marsh": True},
        shape_target_codex={"shape_triangle": True},
        accent_target_codex={"accent_polka": True},
        region_unlocks={"node_frontier_a": True},
    )
    child, error = _breed(state, "a", "b", "guild_ember_marsh")
    assert error is None
    assert not child["regent_awards"]


def test_initiate_breeding_partial_codex_only_suppresses_seen():
    """Color codexed but accent fresh -> accent award still fires."""
    state = _state(
        [_slime("a", "Red", 0, 100), _slime("b", "Red", 0, 100)],
        color_target_codex={"guild_ember_marsh": True},
        region_unlocks={"node_frontier_a": True},
    )
    child, error = _breed(state, "a", "b", "guild_ember_marsh")
    assert error is None
    awards = child["regent_awards"]
    assert _awards_for(awards, key="guild_ember_marsh") == []
    assert len(_awards_for(awards, inventory="pattern", key="Polka")) == 1


def test_initiate_breeding_no_rewards_table_no_awards():
    """Legacy callers that don't pass regent_rewards get an empty award list."""
    state = _state([_slime("a", "Red", 0, 100), _slime("b", "Red", 0, 100)])
    child, error = _breed(state, "a", "b", "guild_ember_marsh", with_rewards=False)
    assert error is None
    assert not child["regent_awards"]
