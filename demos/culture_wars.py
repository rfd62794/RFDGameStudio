import pygame
import sys
import random
import math
from collections import Counter, deque

# ─── CONFIG ───────────────────────────────
WIDTH, HEIGHT = 1000, 720
CELL     = 8
COLS     = WIDTH  // CELL
ROWS     = (HEIGHT - 100) // CELL
FPS      = 60
TITLE    = "Culture Wars — Territory Simulation"

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

# (base_color, frontier_color, dim_color, capitol_color)
CULTURE_COLORS = {
    EMPTY:   ((240, 240, 240), (255, 255, 255), (220, 220, 220), (200, 200, 200)),
    EMBER:   ((180, 60,  15 ), (255, 130, 50 ), (120, 35,  8  ), (255, 200, 80 )),
    GALE:    ((20,  150, 170), (80,  220, 240), (10,  90,  110), (180, 255, 255)),
    MARSH:   ((30,  140, 55 ), (70,  200, 90 ), (15,  80,  30 ), (150, 255, 150)),
    CRYSTAL: ((70,  70,  200), (130, 130, 255), (40,  40,  140), (200, 200, 255)),
    TUNDRA:  ((100, 160, 210), (180, 225, 255), (60,  100, 150), (240, 250, 255)),
    TIDE:    ((140, 30,  180), (200, 80,  255), (80,  15,  110), (255, 180, 255)),
    VOID:    ((30,  30,  30 ), (60,  60,  60 ), (20,  20,  20 ), (80,  80,  80 )),
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

# Culture personality rules
# (expansion_weight, survival_min, survival_max, birth_threshold)
CULTURE_RULES = {
    EMBER:   (1.2, 2, 3, 3),   # aggressive expander, standard survival
    GALE:    (1.5, 1, 3, 2),   # fastest expander, survives isolation
    MARSH:   (0.8, 2, 4, 3),   # slow expander, survives crowding
    CRYSTAL: (1.0, 2, 3, 3),   # standard, geometric
    TUNDRA:  (0.9, 1, 3, 3),   # slow but survives alone
    TIDE:    (1.1, 3, 5, 3),   # social, needs density, surges
    VOID:    (0.0, 2, 3, 3),   # never expands
}

SUPPLY_RANGE    = 12   # max distance from interior before penalty
COLLAPSE_MASS   = 15   # minimum cells to recover from collapse
OVERPOP_THRESH  = 0.42 # fraction of live cells before penalty kicks in
COLLAPSE_TURNS  = 40   # generations in collapse before recovery check

# ─── STATE ────────────────────────────────
grid           = []
frontier       = set()   # (r, c) cells on culture border
capitols       = {}      # culture -> (r, c)
collapse       = {}      # culture -> turns_remaining
populations    = {}
generation     = 0
paused         = False
active_culture = EMBER
tick_every     = 0.08
tick_acc       = 0.0
drawing        = False
erasing        = False
voiding        = False
show_frontier  = True
show_supply    = False

font_small = None
font_med   = None


# ─── GRID HELPERS ─────────────────────────
def make_grid(mode="blobs"):
    g = [[EMPTY] * COLS for _ in range(ROWS)]

    if mode == "blobs":
        cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE]
        for _ in range(10):
            culture = random.choice(cultures)
            cr = random.randint(8, ROWS - 8)
            cc = random.randint(8, COLS - 8)
            radius = random.randint(6, 16)
            for r in range(max(0, cr - radius), min(ROWS, cr + radius)):
                for c in range(max(0, cc - radius), min(COLS, cc + radius)):
                    dist = math.sqrt((r - cr)**2 + (c - cc)**2)
                    if dist < radius and random.random() < 0.75:
                        g[r][c] = culture

    return g


def neighbors_of(r, c):
    """Return (r,c) tuples of 8 neighbors with wrap."""
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            yield (r + dr) % ROWS, (c + dc) % COLS


def neighbor_values(g, r, c):
    return [g[nr][nc] for nr, nc in neighbors_of(r, c)]


def is_frontier(g, r, c):
    """True if cell is live culture and has at least one non-same neighbor."""
    val = g[r][c]
    if val == EMPTY or val == VOID:
        return False
    for nr, nc in neighbors_of(r, c):
        nv = g[nr][nc]
        if nv != val:
            return True
    return False


def compute_frontiers(g):
    f = set()
    for r in range(ROWS):
        for c in range(COLS):
            if is_frontier(g, r, c):
                f.add((r, c))
    return f


def compute_capitols(g):
    """Find densest cluster center per culture using sampling."""
    caps = {}
    # Sample approach — find cell with most same-culture neighbors in radius
    culture_cells = {}
    for r in range(ROWS):
        for c in range(COLS):
            v = g[r][c]
            if v not in (EMPTY, VOID):
                if v not in culture_cells:
                    culture_cells[v] = []
                culture_cells[v].append((r, c))

    for cult, cells in culture_cells.items():
        if not cells:
            continue
        # Sample up to 30 candidates, pick densest
        candidates = random.sample(cells, min(30, len(cells)))
        best = None
        best_score = -1
        for r, c in candidates:
            score = sum(
                1 for nr, nc in neighbors_of(r, c)
                if g[nr][nc] == cult
            )
            if score > best_score:
                best_score = score
                best = (r, c)
        if best:
            caps[cult] = best

    return caps


def bfs_supply_distance(g, r, c):
    """
    Distance from (r,c) to nearest interior cell of same culture.
    Interior = same culture cell with 0 foreign neighbors.
    Returns distance or SUPPLY_RANGE+1 if too far.
    """
    cult = g[r][c]
    if cult in (EMPTY, VOID):
        return 0

    visited = {(r, c)}
    queue   = deque([(r, c, 0)])

    while queue:
        cr, cc, dist = queue.popleft()
        if dist > SUPPLY_RANGE:
            return SUPPLY_RANGE + 1
        # Check if this cell is interior
        if g[cr][cc] == cult:
            nvs = neighbor_values(g, cr, cc)
            foreign = [v for v in nvs if v != cult and v != EMPTY]
            if not foreign:
                return dist
        for nr, nc in neighbors_of(cr, cc):
            if (nr, nc) not in visited and g[nr][nc] == cult:
                visited.add((nr, nc))
                queue.append((nr, nc, dist + 1))

    return SUPPLY_RANGE + 1


def count_populations(g):
    counts = {c: 0 for c in range(8)}
    for r in range(ROWS):
        for c in range(COLS):
            counts[g[r][c]] += 1
    return counts


def resolve_conflict(culture_a, culture_b):
    """RPS resolution. Returns winner or None for tie."""
    if culture_b in RPS_BEATS.get(culture_a, set()):
        return culture_a
    if culture_a in RPS_BEATS.get(culture_b, set()):
        return culture_b
    return None


def cell_at_mouse(pos):
    mx, my = pos
    return my // CELL, mx // CELL


# ─── SETUP ────────────────────────────────
def setup(mode="blobs"):
    global grid, frontier, capitols, collapse
    global populations, generation, tick_acc

    grid       = make_grid(mode)
    frontier   = compute_frontiers(grid)
    capitols   = compute_capitols(grid)
    collapse   = {}
    populations = count_populations(grid)
    generation = 0
    tick_acc   = 0.0


# ─── UPDATE ───────────────────────────────
def update(dt):
    global grid, frontier, capitols, collapse
    global populations, generation, tick_acc

    if paused:
        return

    tick_acc += dt
    if tick_acc < tick_every:
        return
    tick_acc -= tick_every

    new = [row[:] for row in grid]
    total_live = sum(
        populations.get(c, 0)
        for c in [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE, VOID]
    )

    for r in range(ROWS):
        for c in range(COLS):
            current = grid[r][c]
            nvs     = neighbor_values(grid, r, c)
            live_n  = [v for v in nvs if v != EMPTY]
            n_count = len(live_n)

            # ── VOID cells never change ──
            if current == VOID:
                continue

            # ── OCCUPIED CELL ──
            if current != EMPTY:
                cult = current
                _, surv_min, surv_max, _ = CULTURE_RULES.get(cult, (1.0, 2, 3, 3))

                # Supply line penalty
                supply_ok = True
                if show_supply or True:  # always compute
                    dist = bfs_supply_distance(grid, r, c)
                    if dist > SUPPLY_RANGE:
                        supply_ok = False

                # Overpopulation penalty
                overpop = False
                cult_pop = populations.get(cult, 0)
                if total_live > 0 and cult_pop / max(1, total_live) > OVERPOP_THRESH:
                    overpop = True

                # Collapse penalty
                in_collapse = cult in collapse and collapse[cult] > 0

                # Survival check
                survives = surv_min <= n_count <= surv_max

                # Apply penalties
                if not supply_ok:
                    survives = survives and random.random() > 0.4
                if overpop:
                    survives = survives and random.random() > 0.15
                if in_collapse:
                    survives = survives and random.random() > 0.3

                if not survives:
                    new[r][c] = EMPTY

            # ── EMPTY CELL ──
            else:
                if n_count == 0:
                    continue

                # No birth through void barrier
                if VOID in nvs:
                    void_count = nvs.count(VOID)
                    if void_count >= 2:
                        continue

                # Collect candidate cultures
                culture_counts = Counter(
                    v for v in live_n
                    if v not in (VOID,)
                )
                if not culture_counts:
                    continue

                # Find birth candidates
                born = None
                max_c = max(culture_counts.values())
                candidates = [
                    cult for cult, cnt in culture_counts.items()
                    if cnt == max_c
                ]

                if len(candidates) == 1:
                    born = candidates[0]
                else:
                    # RPS tiebreak
                    winner = None
                    for ca in candidates:
                        beats_all = all(
                            cb == ca or cb in RPS_BEATS.get(ca, set())
                            for cb in candidates
                        )
                        if beats_all:
                            winner = ca
                            break
                    born = winner if winner else random.choice(candidates)

                if born is None or born == VOID:
                    continue

                # Check birth threshold
                exp_w, _, _, birth_thresh = CULTURE_RULES.get(born, (1.0, 2, 3, 3))
                effective = culture_counts.get(born, 0)

                # Collapsed cultures can't birth
                if born in collapse and collapse[born] > 0:
                    continue

                if effective >= birth_thresh:
                    # Expansion weight — probabilistic
                    if random.random() < exp_w:
                        new[r][c] = born

    # ── POST STEP ──
    grid        = new
    generation += 1
    populations = count_populations(grid)

    # Update capitols every 20 generations
    if generation % 20 == 0:
        capitols = compute_capitols(grid)

    # Check for capitol capture → collapse
    for cult, cap in list(capitols.items()):
        cr, cc = cap
        if grid[cr][cc] != cult:
            if cult not in collapse:
                collapse[cult] = COLLAPSE_TURNS

    # Tick down collapse counters
    for cult in list(collapse.keys()):
        collapse[cult] -= 1
        if collapse[cult] <= 0:
            # Check if recovered
            if populations.get(cult, 0) >= COLLAPSE_MASS:
                del collapse[cult]
            else:
                collapse[cult] = COLLAPSE_TURNS // 2

    # Update frontier
    frontier = compute_frontiers(grid)


# ─── DRAW ─────────────────────────────────
def draw(screen):
    screen.fill((240, 240, 240))

    for r in range(ROWS):
        for c in range(COLS):
            val = grid[r][c]
            x   = c * CELL
            y   = r * CELL

            if val == EMPTY:
                # White / unconquered — subtle grid dot
                pygame.draw.rect(screen, (235, 235, 235), (x, y, CELL, CELL))
                pygame.draw.rect(screen, (220, 220, 225), (x, y, CELL, CELL), 1)
                continue

            base, frontier_col, dim, capitol_col = CULTURE_COLORS[val]

            # Capitol glow
            if val in capitols and capitols[val] == (r, c):
                color = capitol_col
            elif show_frontier and (r, c) in frontier:
                color = frontier_col
            else:
                # Interior cells are dimmer
                is_int = (r, c) not in frontier
                color  = dim if is_int else base

            # Collapse flicker
            if val in collapse and collapse[val] > 0:
                if (generation + r + c) % 4 < 2:
                    color = (
                        color[0] // 2,
                        color[1] // 2,
                        color[2] // 2,
                    )

            pygame.draw.rect(screen, color, (x + 1, y + 1, CELL - 1, CELL - 1))

    # Supply line overlay
    if show_supply:
        for r, c in frontier:
            val = grid[r][c]
            if val in (EMPTY, VOID):
                continue
            dist = bfs_supply_distance(grid, r, c)
            if dist > SUPPLY_RANGE:
                x = c * CELL
                y = r * CELL
                overlay = pygame.Surface((CELL, CELL), pygame.SRCALPHA)
                overlay.fill((255, 0, 0, 80))
                screen.blit(overlay, (x, y))

    # Capitol markers
    for cult, (cr, cc) in capitols.items():
        if grid[cr][cc] == cult:
            x = cc * CELL + CELL // 2
            y = cr * CELL + CELL // 2
            _, _, _, cap_col = CULTURE_COLORS[cult]
            pygame.draw.circle(screen, cap_col, (x, y), CELL)
            pygame.draw.circle(screen, (255, 255, 255), (x, y), CELL, 1)

    draw_hud(screen)


def draw_hud(screen):
    hud_y = ROWS * CELL
    pygame.draw.rect(screen, (15, 15, 22), (0, hud_y, WIDTH, 100))
    pygame.draw.line(screen, (40, 40, 55), (0, hud_y), (WIDTH, hud_y), 1)

    # Status line
    status = (
        f"Gen {generation}   "
        f"Speed {1.0/tick_every:.1f}/s   "
        f"{'PAUSED' if paused else 'RUNNING'}   "
        f"[F]rontier={'ON' if show_frontier else 'OFF'}   "
        f"[S]upply={'ON' if show_supply else 'OFF'}"
    )
    surf = font_small.render(status, True, (150, 150, 180))
    screen.blit(surf, (10, hud_y + 6))

    # Active culture
    _, live, _, border = CULTURE_COLORS[active_culture]
    pygame.draw.rect(screen, border, (10, hud_y + 24, 10, 10))
    label = f"Paint: {CULTURE_NAMES[active_culture]}"
    surf  = font_small.render(label, True, live)
    screen.blit(surf, (24, hud_y + 23))

    # Collapse indicators
    cx = 200
    for cult, turns in collapse.items():
        _, live, _, _ = CULTURE_COLORS[cult]
        name = CULTURE_NAMES[cult]
        surf = font_small.render(f"⚠ {name} COLLAPSE {turns}", True, (255, 80, 80))
        screen.blit(surf, (cx, hud_y + 23))
        cx += surf.get_width() + 20

    # Population bars
    cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE, VOID]
    total    = sum(populations.get(c, 0) for c in cultures)
    bar_w    = (WIDTH - 20) // 7
    bar_h    = 22
    bar_y    = hud_y + 42

    for i, cult in enumerate(cultures):
        pop   = populations.get(cult, 0)
        ratio = pop / max(1, total)
        ratio = min(1.0, ratio)

        _, live, dim, border = CULTURE_COLORS[cult]
        bx = 10 + i * (bar_w + 2)

        pygame.draw.rect(screen, (25, 25, 35), (bx, bar_y, bar_w, bar_h))
        fill_w = int(bar_w * ratio)
        if fill_w > 0:
            col = live
            if cult in collapse:
                col = (col[0]//2, col[1]//2, col[2]//2)
            pygame.draw.rect(screen, col, (bx, bar_y, fill_w, bar_h))

        # Capitol marker in bar
        if cult in capitols and grid[capitols[cult][0]][capitols[cult][1]] == cult:
            pygame.draw.rect(screen, (255, 255, 255), (bx + fill_w - 2, bar_y, 2, bar_h))

        border_col = border if cult == active_culture else (50, 50, 65)
        pygame.draw.rect(screen, border_col, (bx, bar_y, bar_w, bar_h), 1)

        name  = CULTURE_NAMES[cult][:3].upper()
        pct   = f"{int(ratio*100)}%"
        nlbl  = font_small.render(name, True, live if pop > 0 else dim)
        plbl  = font_small.render(pct,  True, (180, 180, 200))
        screen.blit(nlbl, (bx + 2,          bar_y + 4))
        screen.blit(plbl, (bx + bar_w - 26, bar_y + 4))

    # Controls
    hint = font_small.render(
        "1-6=paint  0=void  R=reset  C=clear  SPACE=pause  "
        "scroll=speed  F=frontier  S=supply  RMB=erase  MMB=void barrier",
        True, (70, 70, 95)
    )
    screen.blit(hint, (10, hud_y + 78))


# ─── INPUT ────────────────────────────────
def handle(event):
    global paused, active_culture, tick_every
    global drawing, erasing, voiding
    global show_frontier, show_supply

    if event.type == pygame.QUIT:
        pygame.quit()
        sys.exit()

    if event.type == pygame.KEYDOWN:
        if event.key == pygame.K_ESCAPE:
            pygame.quit()
            sys.exit()
        if event.key == pygame.K_r:
            setup("blobs")
        if event.key == pygame.K_c:
            setup("empty")
        if event.key == pygame.K_SPACE:
            paused = not paused
        if event.key == pygame.K_f:
            show_frontier = not show_frontier
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
        r, c = cell_at_mouse(event.pos)
        if 0 <= r < ROWS and 0 <= c < COLS:
            if event.button == 1:
                drawing = True
                grid[r][c] = active_culture
            if event.button == 3:
                erasing = True
                grid[r][c] = EMPTY
            if event.button == 2:
                voiding = True
                grid[r][c] = VOID

    if event.type == pygame.MOUSEBUTTONUP:
        if event.button == 1: drawing = False
        if event.button == 3: erasing = False
        if event.button == 2: voiding = False

    if event.type == pygame.MOUSEMOTION:
        if drawing or erasing or voiding:
            r, c = cell_at_mouse(event.pos)
            if 0 <= r < ROWS and 0 <= c < COLS:
                if drawing: grid[r][c] = active_culture
                if erasing: grid[r][c] = EMPTY
                if voiding: grid[r][c] = VOID

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

    setup("blobs")

    while True:
        dt = clock.tick(FPS) / 1000.0
        for event in pygame.event.get():
            handle(event)
        update(dt)
        draw(screen)
        pygame.display.flip()


if __name__ == "__main__":
    main()
