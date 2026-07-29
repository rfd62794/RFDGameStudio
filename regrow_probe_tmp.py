import sys
sys.path.insert(0, '.')
from studio.runtime import load_game, call

configs = [
    (450, 10.0, 30),
    (450, 10.0, 15),
    (450, 10.0, 8),
    (450, 12.0, 6),
    (450, 15.0, 5),
]
for radius, cooldown, starve in configs:
    session = load_game('shoal', seed=42)
    data = session.files.data
    data['algae']['regrow_cooldown'] = cooldown
    data['flesh_chunk']['decompose_radius'] = radius
    data['algae']['starvation_seconds'] = starve
    rs = call(session, 'init_game', data)
    start_cores = len(rs['algae'])
    min_cores = len(rs['algae'])
    starvation_events = 0
    new_core_events = 0
    prev_count = len(rs['algae'])
    for i in range(2400):
        rs = call(session, 'tick_game', 0.25, {})
        cur_count = len(rs['algae'])
        if cur_count < prev_count:
            starvation_events += (prev_count - cur_count)
        if cur_count > prev_count:
            new_core_events += (cur_count - prev_count)
        if cur_count < min_cores:
            min_cores = cur_count
        prev_count = cur_count
    print(f'radius={radius} cooldown={cooldown} starve={starve}: start={start_cores} end={prev_count} min_seen={min_cores} starvation_events={starvation_events} new_core_events={new_core_events}')
