import pygame
import sys
import random
from collections import Counter

# ─── CONFIG ───────────────────────────────
WIDTH, HEIGHT = 900, 660
CELL     = 10
COLS     = WIDTH  // CELL
ROWS     = (HEIGHT - 80) // CELL   # reserve 80px for HUD at bottom
FPS      = 60
TITLE    = "Multi-Culture Conway — Territory Simulation"

# ─── CULTURES ─────────────────────────────
# 0 = dead, 1-6 = culture, 7 = void

DEAD  = 0
EMBER   = 1
GALE    = 2
MARSH   = 3
CRYSTAL = 4
TUNDRA  = 5
TIDE    = 6
VOID    = 7

CULTURE_NAMES = {
    DEAD:    "Dead",
    EMBER:   "Ember",
    GALE:    "Gale",
    MARSH:   "Marsh",
    CRYSTAL: "Crystal",
    TUNDRA:  "Tundra",
    TIDE:    "Tide",
    VOID:    "Void",
}

# Colors: (dead_bg, live, dim, border)
CULTURE_COLORS = {
    DEAD:    ((10,  10,  10 ), (10,  10,  10 ), (10,  10,  10 ), (10,  10,  10 )),
    EMBER:   ((25,  8,   4  ), (220, 80,  20 ), (140, 45,  10 ), (255, 140, 60 )),
    GALE:    ((4,   18,  25 ), (60,  200, 220), (25,  110, 130), (120, 230, 245)),
    MARSH:   ((4,   20,  8  ), (50,  180, 70 ), (20,  100, 35 ), (100, 220, 120)),
    CRYSTAL: ((8,   8,   25 ), (110, 110, 255), (55,  55,  165), (160, 160, 255)),
    TUNDRA:  ((8,   15,  22 ), (170, 215, 255), (85,  130, 180), (210, 240, 255)),
    TIDE:    ((15,  4,   22 ), (175, 55,  220), (90,  20,  130), (210, 100, 255)),
    VOID:    ((15,  15,  15 ), (80,  80,  80 ), (45,  45,  45 ), (120, 120, 120)),
}

# RPS web — who beats whom
# culture: set of cultures it beats
RPS_BEATS = {
    EMBER:   {GALE, MARSH},
    GALE:    {TUNDRA, TIDE},
    MARSH:   {CRYSTAL, GALE},
    CRYSTAL: {TIDE, EMBER},
    TUNDRA:  {EMBER, CRYSTAL},
    TIDE:    {MARSH, TUNDRA},
    VOID:    set(),   # draws all
}

# Culture survival rules — (min_neighbors, max_neighbors)
# Standard Conway is (2, 3)
SURVIVAL_RULES = {
    EMBER:   (2, 3),   # standard — aggressive but not resilient
    GALE:    (1, 3),   # survives isolation — wind finds gaps
    MARSH:   (2, 4),   # survives crowding — roots hold ground
    CRYSTAL: (2, 3),   # standard — structured, predictable
    TUNDRA:  (1, 3),   # survives isolation — endures the cold alone
    TIDE:    (3, 4),   # needs company — social, dies alone
    VOID:    (2, 3),   # standard — balanced, no modifier
}

# Birth threshold — how many neighbors needed to birth
# Standard Conway is 3
BIRTH_RULES = {
    EMBER:   3,
    GALE:    2,   # spreads easily — wind carries seeds
    MARSH:   3,
    CRYSTAL: 3,
    TUNDRA:  3,
    TIDE:    3,
    VOID:    3,
}

# ─── STATE ────────────────────────────────
grid         = []
paused       = False
active_culture = EMBER
tick_every   = 0.10
tick_acc     = 0.0
generation   = 0
drawing      = False
erasing      = False
populations  = {}

font_small   = None
font_med     = None


# ─── GRID HELPERS ─────────────────────────
def make_grid(mode="random"):
    """
    mode: "random" — scatter all cultures
          "empty"  — all dead
          "blobs"  — large culture blobs
    """
    g = [[DEAD] * COLS for _ in range(ROWS)]

    if mode == "random":
        cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE, VOID]
        for r in range(ROWS):
            for c in range(COLS):
                if random.random() < 0.35:
                    g[r][c] = random.choice(cultures)

    elif mode == "blobs":
        cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE]
        blob_count = 12
        for _ in range(blob_count):
            culture = random.choice(cultures)
            cr = random.randint(5, ROWS - 5)
            cc = random.randint(5, COLS - 5)
            radius = random.randint(8, 20)
            for r in range(max(0, cr - radius), min(ROWS, cr + radius)):
                for c in range(max(0, cc - radius), min(COLS, cc + radius)):
                    dist = ((r - cr)**2 + (c - cc)**2) ** 0.5
                    if dist < radius and random.random() < 0.7:
                        g[r][c] = culture

    return g


def get_neighbors(g, row, col):
    """Return list of culture values of live neighbors (wrap-around)."""
    neighbors = []
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            r = (row + dr) % ROWS
            c = (col + dc) % COLS
            if g[r][c] != DEAD:
                neighbors.append(g[r][c])
    return neighbors


def resolve_birth_culture(neighbors):
    """
    Determine which culture is born from a set of neighbors.
    Majority wins. RPS breaks ties.
    Void neighbors count as 0.5 (destabilizing, not dominant).
    """
    # Filter void from majority calculation
    real = [n for n in neighbors if n != VOID]
    if not real:
        return VOID if VOID in neighbors else DEAD

    counts = Counter(real)
    max_count = max(counts.values())
    candidates = [c for c, n in counts.items() if n == max_count]

    if len(candidates) == 1:
        return candidates[0]

    # RPS tiebreak — find candidate that beats others
    for c in candidates:
        beaten = [o for o in candidates if o != c and o in RPS_BEATS.get(c, set())]
        if len(beaten) == len(candidates) - 1:
            return c

    # Still tied — random from candidates
    return random.choice(candidates)


def step(g):
    """Compute next generation with culture rules."""
    new = [[DEAD] * COLS for _ in range(ROWS)]

    for r in range(ROWS):
        for c in range(COLS):
            neighbors = get_neighbors(g, r, c)
            n_count   = len(neighbors)
            current   = g[r][c]

            if current != DEAD:
                # Survival check
                culture = current if current != VOID else VOID
                lo, hi  = SURVIVAL_RULES.get(culture, (2, 3))
                if lo <= n_count <= hi:
                    new[r][c] = current
                # else dies — stays DEAD

            else:
                # Birth check — need exactly birth_threshold live neighbors
                # We check each culture's birth threshold
                if n_count >= 2:
                    born_culture = resolve_birth_culture(neighbors)
                    if born_culture != DEAD:
                        threshold = BIRTH_RULES.get(born_culture, 3)
                        real_count = len([n for n in neighbors if n != VOID])
                        void_count = neighbors.count(VOID)
                        # Void counts as 0.5
                        effective = real_count + (void_count * 0.5)
                        if effective >= threshold:
                            new[r][c] = born_culture

    return new


def count_populations(g):
    counts = {c: 0 for c in range(8)}
    for r in range(ROWS):
        for c in range(COLS):
            counts[g[r][c]] += 1
    return counts


def cell_at_mouse(pos):
    mx, my = pos
    return my // CELL, mx // CELL


# ─── SETUP ────────────────────────────────
def setup(mode="blobs"):
    global grid, generation, populations, tick_acc
    grid        = make_grid(mode)
    generation  = 0
    populations = count_populations(grid)
    tick_acc    = 0.0


# ─── UPDATE ───────────────────────────────
def update(dt):
    global grid, generation, populations, tick_acc

    if paused:
        return

    tick_acc += dt
    if tick_acc >= tick_every:
        tick_acc   -= tick_every
        grid        = step(grid)
        generation += 1
        populations = count_populations(grid)


# ─── DRAW ─────────────────────────────────
def draw(screen):
    screen.fill((10, 10, 10))

    for r in range(ROWS):
        for c in range(COLS):
            val = grid[r][c]
            if val == DEAD:
                continue
            _, live, dim, _ = CULTURE_COLORS[val]
            neighbors = get_neighbors(grid, r, c)
            color = live if len(neighbors) >= 2 else dim
            pygame.draw.rect(
                screen, color,
                (c * CELL + 1, r * CELL + 1, CELL - 1, CELL - 1)
            )

    draw_hud(screen)


def draw_hud(screen):
    hud_y    = ROWS * CELL
    hud_rect = pygame.Rect(0, hud_y, WIDTH, 80)
    pygame.draw.rect(screen, (15, 15, 20), hud_rect)
    pygame.draw.line(screen, (40, 40, 50), (0, hud_y), (WIDTH, hud_y), 1)

    # Generation + speed + pause
    status = f"Gen {generation}   Speed {1.0/tick_every:.1f}/s   {'PAUSED' if paused else 'RUNNING'}"
    surf   = font_small.render(status, True, (160, 160, 180))
    screen.blit(surf, (10, hud_y + 6))

    # Active culture indicator
    _, live, _, border = CULTURE_COLORS[active_culture]
    label = f"Painting: {CULTURE_NAMES[active_culture]}"
    pygame.draw.rect(screen, border, (10, hud_y + 26, 12, 12))
    surf  = font_small.render(label, True, live)
    screen.blit(surf, (26, hud_y + 25))

    # Culture population bars
    total_cells = ROWS * COLS
    bar_x     = 10
    bar_y     = hud_y + 46
    bar_w     = (WIDTH - 20) // 7
    bar_h     = 20

    cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE, VOID]
    for i, cult in enumerate(cultures):
        pop   = populations.get(cult, 0)
        ratio = pop / max(1, total_cells - populations.get(DEAD, 0) + 1)
        ratio = min(1.0, ratio)

        _, live, dim, border = CULTURE_COLORS[cult]
        bx = bar_x + i * (bar_w + 2)

        # Background
        pygame.draw.rect(screen, (25, 25, 30), (bx, bar_y, bar_w, bar_h))
        # Fill
        fill_w = int(bar_w * ratio)
        if fill_w > 0:
            pygame.draw.rect(screen, live, (bx, bar_y, fill_w, bar_h))
        # Border — highlight active
        border_color = border if cult == active_culture else (50, 50, 60)
        pygame.draw.rect(screen, border_color, (bx, bar_y, bar_w, bar_h), 1)

        # Name label
        name  = CULTURE_NAMES[cult][:3].upper()
        label = font_small.render(name, True, live if pop > 0 else dim)
        screen.blit(label, (bx + 2, bar_y + 4))

    # Controls hint
    hint = font_small.render(
        "1-6=culture  0=void  SPACE=pause  R=blobs  C=clear  scroll=speed",
        True, (80, 80, 100)
    )
    screen.blit(hint, (WIDTH - hint.get_width() - 10, hud_y + 6))


# ─── INPUT ────────────────────────────────
def handle(event):
    global paused, active_culture, tick_every, drawing, erasing

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
        if event.key == pygame.K_0:
            active_culture = VOID
        if event.key == pygame.K_TAB:
            cultures = [EMBER, GALE, MARSH, CRYSTAL, TUNDRA, TIDE, VOID]
            idx = cultures.index(active_culture)
            active_culture = cultures[(idx + 1) % len(cultures)]

        key_culture_map = {
            pygame.K_1: EMBER,
            pygame.K_2: GALE,
            pygame.K_3: MARSH,
            pygame.K_4: CRYSTAL,
            pygame.K_5: TUNDRA,
            pygame.K_6: TIDE,
        }
        if event.key in key_culture_map:
            active_culture = key_culture_map[event.key]

    if event.type == pygame.MOUSEBUTTONDOWN:
        if event.button == 1:
            drawing = True
            r, c = cell_at_mouse(event.pos)
            if 0 <= r < ROWS and 0 <= c < COLS:
                grid[r][c] = active_culture
        if event.button == 3:
            erasing = True
            r, c = cell_at_mouse(event.pos)
            if 0 <= r < ROWS and 0 <= c < COLS:
                grid[r][c] = DEAD

    if event.type == pygame.MOUSEBUTTONUP:
        if event.button == 1:
            drawing = False
        if event.button == 3:
            erasing = False

    if event.type == pygame.MOUSEMOTION:
        if drawing or erasing:
            r, c = cell_at_mouse(event.pos)
            if 0 <= r < ROWS and 0 <= c < COLS:
                grid[r][c] = active_culture if drawing else DEAD

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

    font_small = pygame.font.SysFont("monospace", 12)
    font_med   = pygame.font.SysFont("monospace", 15, bold=True)

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
