import pygame
import sys
import random
import math
from collections import defaultdict, deque

# ─── CONFIG ───────────────────────────────
WIDTH, HEIGHT  = 1100, 740
HUD_H          = 100
GRID_H         = HEIGHT - HUD_H
NODE_COUNT     = 180
CONNECT_RADIUS = 110     # max distance to form a channel
MAX_EDGES      = 6       # max channels per node
FPS            = 60
TITLE          = "Culture Wars — Node Network"

PRESSURE_THRESHOLD = 60   # pressure needed to claim a node
PRESSURE_PER_TICK  = 4    # base pressure per tick from one neighbor
SUPPLY_DECAY       = 2    # strength lost per tick when unsupplied
COLLAPSE_TURNS     = 50

# ─── CULTURES ─────────────────────────────
EMPTY   = 0
EMBER   = 1
GALE    = 2
MARSH   = 3
CRYSTAL = 4
TUNDRA  = 5
TIDE    = 6
VOID    = 7

CULTURE_NAMES = {
    EMPTY:   "Empty",
    EMBER:   "Ember",
    GALE:    "Gale",
    MARSH:   "Marsh",
    CRYSTAL: "Crystal",
    TUNDRA:  "Tundra",
    TIDE:    "Tide",
    VOID:    "Void",
}

# (interior, frontier, dim, capitol, channel)
CULTURE_COLORS = {
    EMPTY:   ((230, 230, 235), (255, 255, 255), (200, 200, 210), (180, 180, 190), (200, 200, 210)),
    EMBER:   ((200, 70,  20 ), (255, 140, 60 ), (130, 40,  10 ), (255, 210, 80 ), (220, 100, 40 )),
    GALE:    ((20,  160, 180), (80,  225, 245), (10,  90,  110), (160, 255, 255), (50,  200, 220)),
    MARSH:   ((35,  150, 60 ), (80,  210, 100), (15,  85,  35 ), (140, 255, 140), (55,  185, 80 )),
    CRYSTAL: ((80,  80,  210), (140, 140, 255), (45,  45,  150), (210, 210, 255), (110, 110, 240)),
    TUNDRA:  ((110, 170, 220), (185, 230, 255), (65,  110, 165), (235, 250, 255), (150, 200, 240)),
    TIDE:    ((155, 35,  195), (210, 90,  255), (90,  18,  120), (255, 180, 255), (185, 65,  230)),
    VOID:    ((35,  35,  40 ), (65,  65,  75 ), (20,  20,  25 ), (90,  90,  100), (50,  50,  60 )),
}

# RPS web — Philosophy B
RPS_BEATS = {
    EMBER:   {GALE, MARSH},
    GALE:    {TUNDRA, TIDE},
    MARSH:   {CRYSTAL, GALE},
    CRYSTAL: {TIDE, EMBER},
    TUNDRA:  {EMBER, CRYSTAL},
    TIDE:    {MARSH, TUNDRA},
    VOID:    set(),
}

# Pressure multiplier, supply sensitivity
CULTURE_TRAITS = {
    EMBER:   {"pressure": 1.3, "supply_sensitivity": 1.0, "min_supply": 1},
    GALE:    {"pressure": 1.6, "supply_sensitivity": 0.6, "min_supply": 0},
    MARSH:   {"pressure": 0.8, "supply_sensitivity": 0.5, "min_supply": 1},
    CRYSTAL: {"pressure": 1.0, "supply_sensitivity": 1.0, "min_supply": 2},
    TUNDRA:  {"pressure": 0.9, "supply_sensitivity": 0.3, "min_supply": 0},
    TIDE:    {"pressure": 1.2, "supply_sensitivity": 1.5, "min_supply": 2},
    VOID:    {"pressure": 0.0, "supply_sensitivity": 0.0, "min_supply": 0},
}


# ─── NODE ─────────────────────────────────
class Node:
    def __init__(self, nid, x, y):
        self.id        = nid
        self.x         = x
        self.y         = y
        self.culture   = EMPTY
        self.strength  = 0.0      # 0.0 - 1.0 ownership confidence
        self.pressure  = defaultdict(float)  # culture -> accumulated pressure
        self.supplied  = True
        self.is_capitol= False
        self.collapse_timer = 0
        self.age       = 0        # ticks owned by current culture
        self.neighbors = []       # list of node ids

    @property
    def radius(self):
        if self.culture == EMPTY:
            return 6
        if self.is_capitol:
            return 12
        base = 7 + int(self.strength * 6)
        return base

    def is_frontier(self, nodes):
        if self.culture in (EMPTY, VOID):
            return False
        for nid in self.neighbors:
            if nodes[nid].culture != self.culture:
                return True
        return False


# ─── STATE ────────────────────────────────
nodes          = []
edges          = []       # list of (id_a, id_b)
edge_set       = set()    # frozenset pairs for fast lookup
capitols       = {}       # culture -> node id
populations    = {}
generation     = 0
paused         = False
active_culture = EMBER
tick_every     = 0.12
tick_acc       = 0.0
drawing        = False
erasing        = False
show_flow      = True
show_supply    = False
hover_node     = None

font_small = None
font_med   = None


# ─── GRAPH GENERATION ─────────────────────
def generate_nodes(count):
    """Poisson-disk-ish scatter — no two nodes too close."""
    MIN_DIST = 45
    pts = []
    attempts = 0
    while len(pts) < count and attempts < count * 20:
        attempts += 1
        x = random.randint(30, WIDTH - 30)
        y = random.randint(30, GRID_H - 30)
        if all(math.hypot(x - px, y - py) >= MIN_DIST for px, py in pts):
            pts.append((x, y))
    return [Node(i, x, y) for i, (x, y) in enumerate(pts)]


def generate_edges(ns):
    """Connect nearby nodes, limit connections per node."""
    es = []
    eset = set()
    n = len(ns)

    # Sort pairs by distance
    pairs = []
    for i in range(n):
        for j in range(i + 1, n):
            d = math.hypot(ns[i].x - ns[j].x, ns[i].y - ns[j].y)
            if d <= CONNECT_RADIUS:
                pairs.append((d, i, j))
    pairs.sort()

    for d, i, j in pairs:
        if len(ns[i].neighbors) < MAX_EDGES and len(ns[j].neighbors) < MAX_EDGES:
            es.append((i, j))
            eset.add(frozenset((i, j)))
            ns[i].neighbors.append(j)
            ns[j].neighbors.append(i)

    return es, eset


def seed_cultures(ns):
    """Place starting culture blobs."""
    cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE]
    random.shuffle(cultures)
    # Pick seed nodes spread across the map
    seeds = random.sample(range(len(ns)), min(len(cultures) * 2, len(ns)))

    for i, cult in enumerate(cultures):
        if i * 2 >= len(seeds):
            break
        center = seeds[i * 2]
        # Claim center + a few neighbors
        claim_node(ns, center, cult, strength=1.0)
        spread = random.randint(2, 5)
        frontier = list(ns[center].neighbors)
        for _ in range(spread):
            if not frontier:
                break
            nxt = random.choice(frontier)
            if ns[nxt].culture == EMPTY:
                claim_node(ns, nxt, cult, strength=0.8)
                frontier.extend(ns[nxt].neighbors)
            frontier = [f for f in frontier if ns[f].culture == EMPTY]


def claim_node(ns, nid, culture, strength=1.0):
    n = ns[nid]
    n.culture  = culture
    n.strength = strength
    n.pressure = defaultdict(float)
    n.age      = 0


# ─── SUPPLY BFS ───────────────────────────
def compute_supply(ns, capitol_id):
    """BFS from capitol outward through same-culture nodes."""
    if capitol_id is None:
        return set()
    cult = ns[capitol_id].culture
    visited = {capitol_id}
    queue   = deque([capitol_id])
    while queue:
        cur = queue.popleft()
        for nid in ns[cur].neighbors:
            if nid not in visited and ns[nid].culture == cult:
                visited.add(nid)
                queue.append(nid)
    return visited


def compute_all_supply(ns, caps):
    supplied = set()
    for cult, cap_id in caps.items():
        if cap_id is not None and ns[cap_id].culture == cult:
            supplied |= compute_supply(ns, cap_id)
    return supplied


def find_capitols(ns):
    """Capitol = most-connected node per culture."""
    best = {}
    for n in ns:
        if n.culture in (EMPTY, VOID):
            continue
        score = len([nb for nb in n.neighbors if ns[nb].culture == n.culture])
        score += n.strength * 3
        if n.culture not in best or score > best[n.culture][0]:
            best[n.culture] = (score, n.id)
    return {cult: nid for cult, (_, nid) in best.items()}


def count_populations(ns):
    counts = defaultdict(int)
    for n in ns:
        counts[n.culture] += 1
    return counts


# ─── SETUP ────────────────────────────────
def setup():
    global nodes, edges, edge_set, capitols, populations
    global generation, tick_acc

    nodes    = generate_nodes(NODE_COUNT)
    edges, edge_set = generate_edges(nodes)
    seed_cultures(nodes)
    capitols  = find_capitols(nodes)
    supplied  = compute_all_supply(nodes, capitols)
    for n in nodes:
        n.supplied   = n.id in supplied
        n.is_capitol = (n.culture in capitols and capitols[n.culture] == n.id)
    populations = count_populations(nodes)
    generation  = 0
    tick_acc    = 0.0


# ─── UPDATE ───────────────────────────────
def update(dt):
    global generation, tick_acc, capitols, populations

    if paused:
        return

    tick_acc += dt
    if tick_acc < tick_every:
        return
    tick_acc -= tick_every

    # ── PRESSURE PHASE ──
    for n in nodes:
        if n.culture == VOID:
            continue

        if n.culture != EMPTY:
            cult   = n.culture
            traits = CULTURE_TRAITS.get(cult, {})
            pmult  = traits.get("pressure", 1.0)

            # Exert pressure on empty/enemy neighbors
            for nid in n.neighbors:
                nb = nodes[nid]
                if nb.culture == VOID:
                    continue
                if nb.culture == EMPTY:
                    nb.pressure[cult] += PRESSURE_PER_TICK * pmult * n.strength
                elif nb.culture != cult:
                    # Contest — RPS modulates pressure
                    enemy = nb.culture
                    if enemy in RPS_BEATS.get(cult, set()):
                        nb.pressure[cult] += PRESSURE_PER_TICK * pmult * 1.4
                    elif cult in RPS_BEATS.get(enemy, set()):
                        nb.pressure[cult] += PRESSURE_PER_TICK * pmult * 0.6
                    else:
                        nb.pressure[cult] += PRESSURE_PER_TICK * pmult

    # ── CLAIM PHASE ──
    for n in nodes:
        if n.culture == VOID:
            continue

        if n.culture == EMPTY:
            # Check if any culture has hit threshold
            if not n.pressure:
                continue
            top = max(n.pressure, key=n.pressure.get)
            if n.pressure[top] >= PRESSURE_THRESHOLD:
                # Tiebreak — find all at max
                peak = n.pressure[top]
                contenders = [c for c, v in n.pressure.items() if v >= peak * 0.85]
                if len(contenders) == 1:
                    winner = contenders[0]
                else:
                    # RPS tiebreak
                    winner = None
                    for ca in contenders:
                        if all(
                            cb == ca or cb in RPS_BEATS.get(ca, set())
                            for cb in contenders
                        ):
                            winner = ca
                            break
                    if winner is None:
                        winner = random.choice(contenders)
                claim_node(nodes, n.id, winner, strength=0.5)

        else:
            # Owned node — contest from enemies
            cult = n.culture
            enemy_pressure = {c: v for c, v in n.pressure.items() if c != cult}
            if enemy_pressure:
                strongest_enemy = max(enemy_pressure, key=enemy_pressure.get)
                ep = enemy_pressure[strongest_enemy]
                if ep > PRESSURE_THRESHOLD * 1.5:
                    # Contested — reduce strength
                    n.strength = max(0.1, n.strength - 0.08)
                    if n.strength <= 0.15 and random.random() < 0.15:
                        # Flip
                        claim_node(nodes, n.id, strongest_enemy, strength=0.4)

            # Decay pressure over time
            n.pressure = defaultdict(float, {
                c: v * 0.85 for c, v in n.pressure.items()
            })

            # Grow strength if supplied
            if n.supplied:
                n.strength = min(1.0, n.strength + 0.02)
                n.age += 1
            else:
                # Supply decay — culture specific
                traits = CULTURE_TRAITS.get(cult, {})
                sens   = traits.get("supply_sensitivity", 1.0)
                n.strength = max(0.0, n.strength - SUPPLY_DECAY * 0.01 * sens)
                if n.strength <= 0.0:
                    n.culture  = EMPTY
                    n.strength = 0.0
                    n.pressure = defaultdict(float)
                    n.age      = 0

    # ── SUPPLY UPDATE ──
    capitols = find_capitols(nodes)
    supplied = compute_all_supply(nodes, capitols)
    for n in nodes:
        n.supplied   = n.id in supplied
        n.is_capitol = (n.culture in capitols and capitols[n.culture] == n.id)

    populations = count_populations(nodes)
    generation += 1


# ─── DRAW ─────────────────────────────────
def draw(screen):
    screen.fill((245, 245, 248))

    # ── DRAW CHANNELS ──
    for a, b in edges:
        na, nb = nodes[a], nodes[b]
        ca, cb = na.culture, nb.culture

        if ca == VOID or cb == VOID:
            # Void barrier — dark static line
            pygame.draw.line(screen, (40, 40, 50), (na.x, na.y), (nb.x, nb.y), 2)
            continue

        if ca == EMPTY and cb == EMPTY:
            # Both unconquered — faint gray line
            pygame.draw.line(screen, (210, 210, 215), (na.x, na.y), (nb.x, nb.y), 1)
            continue

        if ca == cb:
            # Same culture — supply channel
            _, _, _, _, ch_col = CULTURE_COLORS[ca]
            supplied_edge = na.supplied and nb.supplied
            width = 3 if supplied_edge else 1
            alpha_col = ch_col if supplied_edge else tuple(v // 2 for v in ch_col)
            pygame.draw.line(screen, alpha_col, (na.x, na.y), (nb.x, nb.y), width)

            # Flow animation dots
            if show_flow and supplied_edge and generation % 3 == 0:
                t = (generation * 0.15 + a * 0.3) % 1.0
                mx = int(na.x + (nb.x - na.x) * t)
                my = int(na.y + (nb.y - na.y) * t)
                pygame.draw.circle(screen, (255, 255, 255), (mx, my), 2)

        else:
            # Border edge — contested
            mx = (na.x + nb.x) // 2
            my = (na.y + nb.y) // 2
            col_a = CULTURE_COLORS[ca][1] if ca != EMPTY else (200, 200, 205)
            col_b = CULTURE_COLORS[cb][1] if cb != EMPTY else (200, 200, 205)
            pygame.draw.line(screen, col_a, (na.x, na.y), (mx, my), 1)
            pygame.draw.line(screen, col_b, (mx, my), (nb.x, nb.y), 1)

    # ── DRAW NODES ──
    for n in nodes:
        x, y = n.x, n.y
        r    = n.radius

        if n.culture == EMPTY:
            # Unconquered — white with subtle ring
            pygame.draw.circle(screen, (255, 255, 255), (x, y), r)
            pygame.draw.circle(screen, (195, 195, 205), (x, y), r, 1)

            # Show incoming pressure as tint
            if n.pressure:
                top = max(n.pressure, key=n.pressure.get)
                ratio = min(1.0, n.pressure[top] / PRESSURE_THRESHOLD)
                if ratio > 0.2:
                    tint = CULTURE_COLORS[top][2]
                    surf = pygame.Surface((r*2, r*2), pygame.SRCALPHA)
                    pygame.draw.circle(surf, (*tint, int(ratio * 120)), (r, r), r)
                    screen.blit(surf, (x - r, y - r))
            continue

        if n.culture == VOID:
            pygame.draw.circle(screen, CULTURE_COLORS[VOID][0], (x, y), r)
            pygame.draw.circle(screen, CULTURE_COLORS[VOID][1], (x, y), r, 1)
            continue

        interior, frontier_col, dim, capitol_col, _ = CULTURE_COLORS[n.culture]

        # Pick color
        is_front = n.is_frontier(nodes)
        if n.is_capitol:
            base_col = capitol_col
        elif is_front:
            base_col = frontier_col
        else:
            # Blend between dim and interior based on strength
            t = n.strength
            base_col = tuple(int(dim[i] + (interior[i] - dim[i]) * t) for i in range(3))

        # Unsupplied — desaturate
        if not n.supplied and n.culture not in (EMPTY, VOID):
            grey = int(sum(base_col) / 3)
            base_col = tuple(int(base_col[i] * 0.4 + grey * 0.6) for i in range(3))

        # Draw fill
        pygame.draw.circle(screen, base_col, (x, y), r)

        # Ring — frontier nodes get bright ring
        if is_front:
            pygame.draw.circle(screen, frontier_col, (x, y), r, 2)
        else:
            pygame.draw.circle(screen, tuple(v // 2 for v in base_col), (x, y), r, 1)

        # Capitol marker — double ring + star
        if n.is_capitol:
            pygame.draw.circle(screen, (255, 255, 255), (x, y), r + 3, 2)
            pygame.draw.circle(screen, capitol_col, (x, y), r + 5, 1)

        # Strength pip
        pip_r = max(2, int(r * 0.3))
        pygame.draw.circle(screen, (255, 255, 255), (x, y), pip_r)

        # Supply indicator
        if show_supply and not n.supplied and n.culture not in (EMPTY, VOID):
            pygame.draw.line(screen, (255, 60, 60), (x - 5, y - 5), (x + 5, y + 5), 2)
            pygame.draw.line(screen, (255, 60, 60), (x + 5, y - 5), (x - 5, y + 5), 2)

    # Hover highlight
    if hover_node is not None:
        n = nodes[hover_node]
        pygame.draw.circle(screen, (255, 255, 200), (n.x, n.y), n.radius + 4, 2)

    draw_hud(screen)


def draw_hud(screen):
    hud_y = GRID_H
    pygame.draw.rect(screen, (12, 12, 18), (0, hud_y, WIDTH, HUD_H))
    pygame.draw.line(screen, (40, 40, 58), (0, hud_y), (WIDTH, hud_y), 1)

    # Status
    status = (
        f"Gen {generation}   "
        f"Speed {1.0/tick_every:.1f}/s   "
        f"{'PAUSED' if paused else 'RUNNING'}   "
        f"[F]low={'ON' if show_flow else 'OFF'}   "
        f"[S]upply={'ON' if show_supply else 'OFF'}"
    )
    surf = font_small.render(status, True, (140, 140, 170))
    screen.blit(surf, (10, hud_y + 6))

    # Active culture swatch
    _, live, _, _, _ = CULTURE_COLORS[active_culture]
    pygame.draw.circle(screen, live, (14, hud_y + 28), 7)
    label = f"Paint: {CULTURE_NAMES[active_culture]}"
    surf  = font_small.render(label, True, live)
    screen.blit(surf, (26, hud_y + 22))

    # Hover info
    if hover_node is not None:
        n = nodes[hover_node]
        name = CULTURE_NAMES[n.culture]
        info = (
            f"Node {n.id}  Culture: {name}  "
            f"Str: {n.strength:.2f}  "
            f"Supplied: {'yes' if n.supplied else 'NO'}  "
            f"Capitol: {'YES' if n.is_capitol else 'no'}  "
            f"Neighbors: {len(n.neighbors)}"
        )
        surf = font_small.render(info, True, (200, 200, 160))
        screen.blit(surf, (200, hud_y + 22))

    # Population bars
    cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE, VOID]
    total    = sum(populations.get(c, 0) for c in cultures if c != EMPTY)
    bar_w    = (WIDTH - 20) // 7
    bar_h    = 24
    bar_y    = hud_y + 46

    for i, cult in enumerate(cultures):
        pop   = populations.get(cult, 0)
        ratio = pop / max(1, total)
        ratio = min(1.0, ratio)

        _, live, dim, _, _ = CULTURE_COLORS[cult]
        bx = 10 + i * (bar_w + 2)

        pygame.draw.rect(screen, (22, 22, 32), (bx, bar_y, bar_w, bar_h))
        fill_w = int(bar_w * ratio)
        if fill_w > 0:
            pygame.draw.rect(screen, live, (bx, bar_y, fill_w, bar_h))

        # Capitol dot in bar
        if cult in capitols:
            pygame.draw.rect(screen, (255, 255, 255), (bx + max(0, fill_w - 3), bar_y + 2, 3, bar_h - 4))

        border_col = live if cult == active_culture else (45, 45, 62)
        pygame.draw.rect(screen, border_col, (bx, bar_y, bar_w, bar_h), 1)

        name  = CULTURE_NAMES[cult][:3].upper()
        count = str(populations.get(cult, 0))
        nlbl  = font_small.render(name,  True, live if pop > 0 else dim)
        clbl  = font_small.render(count, True, (170, 170, 195))
        screen.blit(nlbl, (bx + 3,          bar_y + 5))
        screen.blit(clbl, (bx + bar_w - clbl.get_width() - 3, bar_y + 5))

    # Controls hint
    hint = font_small.render(
        "1-6=paint  0=void  LMB=claim  RMB=clear  R=reset  C=wipe  "
        "SPACE=pause  scroll=speed  F=flow  S=supply",
        True, (60, 60, 85)
    )
    screen.blit(hint, (10, hud_y + HUD_H - 18))


# ─── NODE PICKING ─────────────────────────
def node_at_mouse(pos, radius=18):
    mx, my = pos
    best   = None
    best_d = radius
    for n in nodes:
        d = math.hypot(n.x - mx, n.y - my)
        if d < best_d:
            best_d = d
            best   = n.id
    return best


# ─── INPUT ────────────────────────────────
def handle(event):
    global paused, active_culture, tick_every
    global drawing, erasing, show_flow, show_supply, hover_node

    if event.type == pygame.QUIT:
        pygame.quit()
        sys.exit()

    if event.type == pygame.KEYDOWN:
        if event.key == pygame.K_ESCAPE:
            pygame.quit()
            sys.exit()
        if event.key == pygame.K_r:
            setup()
        if event.key == pygame.K_c:
            for n in nodes:
                n.culture  = EMPTY
                n.strength = 0.0
                n.pressure = defaultdict(float)
                n.age      = 0
        if event.key == pygame.K_SPACE:
            paused = not paused
        if event.key == pygame.K_f:
            show_flow = not show_flow
        if event.key == pygame.K_s:
            show_supply = not show_supply
        if event.key == pygame.K_0:
            active_culture = VOID
        if event.key == pygame.K_TAB:
            order = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE, VOID]
            idx = order.index(active_culture)
            active_culture = order[(idx + 1) % len(order)]

        key_map = {
            pygame.K_1: EMBER,   pygame.K_2: GALE,
            pygame.K_3: MARSH,   pygame.K_4: CRYSTAL,
            pygame.K_5: TUNDRA,  pygame.K_6: TIDE,
        }
        if event.key in key_map:
            active_culture = key_map[event.key]

    if event.type == pygame.MOUSEBUTTONDOWN:
        nid = node_at_mouse(event.pos)
        if nid is not None:
            if event.button == 1:
                drawing = True
                claim_node(nodes, nid, active_culture, strength=1.0)
            if event.button == 3:
                erasing = True
                nodes[nid].culture  = EMPTY
                nodes[nid].strength = 0.0
                nodes[nid].pressure = defaultdict(float)

    if event.type == pygame.MOUSEBUTTONUP:
        if event.button == 1: drawing = False
        if event.button == 3: erasing = False

    if event.type == pygame.MOUSEMOTION:
        hover_node = node_at_mouse(event.pos, radius=22)
        if drawing or erasing:
            nid = node_at_mouse(event.pos)
            if nid is not None:
                if drawing:
                    claim_node(nodes, nid, active_culture, strength=1.0)
                else:
                    nodes[nid].culture  = EMPTY
                    nodes[nid].strength = 0.0
                    nodes[nid].pressure = defaultdict(float)

    if event.type == pygame.MOUSEWHEEL:
        if event.y > 0:
            tick_every = max(0.02, tick_every - 0.02)
        else:
            tick_every = min(2.0, tick_every + 0.02)


# ─── MAIN ─────────────────────────────────
def main():
    global font_small, font_med

    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption(TITLE)
    clock  = pygame.time.Clock()

    font_small = pygame.font.SysFont("monospace", 11)
    font_med   = pygame.font.SysFont("monospace", 14, bold=True)

    setup()

    while True:
        dt = clock.tick(FPS) / 1000.0
        for event in pygame.event.get():
            handle(event)
        update(dt)
        draw(screen)
        pygame.display.flip()


if __name__ == "__main__":
    main()
