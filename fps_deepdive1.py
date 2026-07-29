import sys, time
sys.path.insert(0, '.')
from studio.runtime import load_game, call

def time_ticks(session, n=250, dt=0.25):
    times = []
    for _ in range(n):
        t0 = time.perf_counter()
        rs = call(session, 'tick_game', dt, {})
        times.append(time.perf_counter() - t0)
    avg = sum(times)/len(times)*1000
    p95 = sorted(times)[int(len(times)*0.95)]*1000
    return avg, p95, rs

def scenario(label, mutate=None):
    session = load_game('shoal', seed=42)
    data = session.files.data
    if mutate:
        mutate(data)
    rs = call(session, 'init_game', data)
    avg, p95, rs = time_ticks(session)
    nfish = len(rs['fish'])
    nsharks = len(rs['sharks'])
    nalgae = len(rs['algae'])
    nchunks = len(rs['chunks'])
    print(label.ljust(45) + ' avg=' + format(avg, '.3f') + 'ms p95=' + format(p95, '.3f') + 'ms fish=' + str(nfish) + ' sharks=' + str(nsharks) + ' algae_cores=' + str(nalgae) + ' chunks=' + str(nchunks))

scenario('BASELINE (default pop)')
scenario('zero fish', lambda d: d['spawn'].update({'initial_fish': 0}))
scenario('zero sharks', lambda d: d['spawn'].update({'initial_sharks': 0}))
scenario('zero algae hubs', lambda d: d['spawn'].update({'initial_algae_hubs': 0}))
scenario('fish x5 (300)', lambda d: d['spawn'].update({'initial_fish': 300}))
scenario('sharks x5 (40)', lambda d: d['spawn'].update({'initial_sharks': 40}))
scenario('algae hubs x5 (30)', lambda d: d['spawn'].update({'initial_algae_hubs': 30}))
