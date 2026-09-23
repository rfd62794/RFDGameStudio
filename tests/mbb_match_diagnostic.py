"""Mutant Battle Ball — real end-to-end match diagnostic.

Runs a full match through the actual engine (the same path the UI takes:
init_match -> tick_match loop -> match_ended) and documents the concrete
failure mode. Not a unit test — this is live verification.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from studio.runtime import load_game


def build_player_mutants(data):
    starters = list(data.get('starter_mutants', []))
    parts_data = list(data.get('parts', []))
    parts_map = {dict(p)['id']: dict(p) for p in parts_data}
    out = []
    for raw_m in starters[:2]:
        rm = dict(raw_m)
        rp = dict(rm.get('parts', {}))
        out.append({
            'id': rm['id'], 'name': rm['name'], 'color': rm.get('color', '#fff'),
            'parts': {slot: parts_map.get(pid) for slot, pid in rp.items()},
        })
    return out


def build_opp_mutants(data, idx=0):
    opponents = list(data.get('opponents', []))
    opp = dict(opponents[idx])
    return [dict(m) for m in opp.get('mutants', [])][:2]


def run_match(seed=42, opp_idx=0, dt=0.1, max_ticks=4000, label=""):
    session = load_game('mutant_battle_ball', seed=seed)
    data = session.files.data
    pm = build_player_mutants(data)
    om = build_opp_mutants(data, idx=opp_idx)
    session.executor.call('init_match', pm, om, data)

    print(f"\n=== MATCH {label} (seed={seed}, opp_idx={opp_idx}) ===")
    print(f"Player mutants: {[m['name'] for m in pm]}")
    print(f"Opponent mutants: {[m.get('name') for m in om]}")

    counts = {
        'scored': 0, 'tackle_success': 0, 'tackle_fail': 0,
        'block': 0, 'limb_loss': 0, 'agent_down': 0,
        'possession_changes': 0, 'match_ended': 0,
    }
    possession_history = []
    final = None
    paused_ticks = 0
    for i in range(max_ticks):
        raw = session.executor.call('tick_match', dt)
        if not raw:
            print(f"[tick {i}] tick_match returned None")
            break
        rs = dict(raw)
        state = rs.get('state')
        events = list(rs.get('events', []))
        for ev in events:
            ev = dict(ev)
            t = ev.get('type')
            if t in counts:
                counts[t] += 1
            if t == 'scored':
                counts['possession_changes'] += 1  # score always switches possession
                print(f"[tick {i}] SCORE: player={ev.get('score_player')} "
                      f"opp={ev.get('score_opponent')} team={ev.get('team')}")
            elif t == 'tackle_success':
                counts['possession_changes'] += 1
                print(f"[tick {i}] TACKLE_SUCCESS: tackler={ev.get('tackler_id')} "
                      f"carrier={ev.get('carrier_id')} new_poss={ev.get('possession')}")
            elif t == 'agent_down':
                print(f"[tick {i}] AGENT_DOWN: {ev.get('agent_id')} team={ev.get('team')} "
                      f"fatal={ev.get('fatal')}")
            elif t == 'match_ended':
                print(f"[tick {i}] MATCH_ENDED: player={ev.get('score_player')} "
                      f"opp={ev.get('score_opponent')}")
        possession_history.append(rs.get('possession'))
        final = rs
        if state == 'paused_sub':
            paused_ticks += 1
            # Simulate the UI choosing "Continue Without Sub"
            session.executor.call('resume_match')
        if state == 'ended':
            break
    else:
        print(f"[!] REACHED max_ticks={max_ticks} without match_ended")

    print(f"\n--- Event counts ({label}) ---")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    print(f"  paused_sub events handled: {paused_ticks}")
    if final:
        print(f"\n--- Final state ({label}) ---")
        print(f"  state: {final.get('state')}")
        print(f"  score: player={final.get('score_player')} opp={final.get('score_opponent')}")
        print(f"  time_remaining: {final.get('time_remaining')}")
        print(f"  possession (final): {final.get('possession')}")
        uniq_poss = set(possession_history)
        print(f"  distinct possessions seen during match: {uniq_poss}")
        for ag in final.get('agents', []):
            ag = dict(ag)
            print(f"    agent {ag.get('name')}: role={ag.get('role')} "
                  f"status={ag.get('status')} has_ball={ag.get('has_ball')} "
                  f"hp={ag.get('health')}/{ag.get('max_health')}")
    return counts, final


if __name__ == '__main__':
    # Run three real matches: easy, medium, hard opponent
    for opp_idx, label in [(0, "easy/Scrappers"), (1, "medium/Ironborn"), (2, "hard/ChromeElite")]:
        run_match(seed=42, opp_idx=opp_idx, label=label)
    # And a different seed to check degeneracy
    run_match(seed=7, opp_idx=0, label="easy/seed7")
