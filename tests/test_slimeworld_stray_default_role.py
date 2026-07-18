from studio.runtime import load_game


def _state():
    return {
        "cycle": 1,
        "credits": 100,
        "contracts": [],
        "petitions": [],
        "slimes": [],
        "has_auto_feeder": False,
        "planet_region": {"nodes": [{"id": "node-1"}]},
        "logs": [],
        "roster_cap": 10,
    }


def _advance_with_flip():
    session = load_game("slimeworld", seed=42)
    session.executor._lua.execute("""
function update_planet_supply_and_pressure(nodes)
  return nodes, { "TERRITORY FLIP: Node [Test] has collapsed under external pressure. Control transferred from Unclaimed to Purple." }
end
""")
    return session.executor.call("advance_cycle", _state())


def test_stray_defaults_to_worker_role():
    result = _advance_with_flip()
    stray = next(slime for slime in result["slimes"] if slime["id"].startswith("stray_flip_"))
    assert stray["locked_role"] == "worker"


def test_stray_log_message_matches_new_behavior():
    result = _advance_with_flip()
    stray_log = next(log["text"] for log in result["logs"] if log["text"].startswith("STRAY DETECTION:"))
    assert "WORKER" in stray_log
    assert "DISPATCH" not in stray_log
    assert "COMBAT" not in stray_log
