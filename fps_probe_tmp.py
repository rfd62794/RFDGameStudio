import sys, time
sys.path.insert(0, '.')
from studio.runtime import load_game, call

def profile(label, chunk_count_target):
    session = load_game('shoal', seed=42)
    data = session.files.data
    rs = call(session, 'init_game', data)
    # force a burst of chunks onto the floor to simulate a feeding-frenzy pileup
    if chunk_count_target > 0:
        for _ in range(200):
            rs = call(session, 'tick_game', 0.25, {'tool': 'shark', 'x': 300, 'y': 300, 'clicked': True})
    chunk_count = 0
    times = []
    for i in range(300):
        t0 = time.perf_counter()
        rs = call(session, 'tick_game', 0.25, {})
        times.append(time.perf_counter() - t0)
        chunk_count = max(chunk_count, len(rs.get('chunks', [])))
    avg_ms = (sum(times) / len(times)) * 1000
    p95_ms = sorted(times)[int(len(times)*0.95)] * 1000
    print(f'{label}: avg_tick={avg_ms:.3f}ms p95_tick={p95_ms:.3f}ms max_chunk_count_seen={chunk_count}')

profile('default (no forced chunks)', 0)
profile('after forced shark spam (chunk pileup)', 50)
