import pygame
import sys
import random

# ─── CONFIG ───────────────────────────────
WIDTH, HEIGHT = 800, 600
CELL  = 10
COLS  = WIDTH  // CELL
ROWS  = HEIGHT // CELL
FPS   = 60
TITLE = "Conway's Game of Life"

# ─── CULTURE THEMES ───────────────────────
# Maps to your six cultures
# Dead cell color / Live cell color
THEMES = {
    1: {
        "name":  "Ember",
        "dead":  (20,  10,  5  ),
        "live":  (220, 80,  20 ),
        "dim":   (120, 40,  10 ),
    },
    2: {
        "name":  "Gale",
        "dead":  (5,   15,  20 ),
        "live":  (80,  200, 220),
        "dim":   (30,  100, 120),
    },
    3: {
        "name":  "Marsh",
        "dead":  (5,   20,  10 ),
        "live":  (60,  180, 80 ),
        "dim":   (20,  90,  40 ),
    },
    4: {
        "name":  "Crystal",
        "dead":  (10,  10,  25 ),
        "live":  (120, 120, 255),
        "dim":   (60,  60,  160),
    },
    5: {
        "name":  "Tundra",
        "dead":  (10,  18,  25 ),
        "live":  (180, 220, 255),
        "dim":   (80,  130, 180),
    },
    6: {
        "name":  "Tide",
        "dead":  (15,  5,   20 ),
        "live":  (180, 60,  220),
        "dim":   (90,  20,  130),
    },
}

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY  = (30, 30, 30)

# ─── STATE ────────────────────────────────
grid       = []
paused     = False
theme_id   = 3          # Start on Marsh
tick_every = 0.12       # seconds per generation
tick_acc   = 0.0
generation = 0
population = 0
drawing    = False
erasing    = False

font_small = None
font_large = None


# ─── GRID HELPERS ─────────────────────────
def make_grid(alive_chance=0.0):
    """Create a ROWS x COLS grid. alive_chance 0.0=empty, 0.3=random."""
    return [
        [1 if random.random() < alive_chance else 0
         for _ in range(COLS)]
        for _ in range(ROWS)
    ]


def count_neighbors(g, row, col):
    """Count live neighbors with wrap-around edges."""
    total = 0
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            r = (row + dr) % ROWS
            c = (col + dc) % COLS
            total += g[r][c]
    return total


def step(g):
    """Return next generation grid."""
    new = [[0] * COLS for _ in range(ROWS)]
    for r in range(ROWS):
        for c in range(COLS):
            n = count_neighbors(g, r, c)
            if g[r][c] == 1:
                new[r][c] = 1 if n in (2, 3) else 0
            else:
                new[r][c] = 1 if n == 3 else 0
    return new


def count_population(g):
    return sum(g[r][c] for r in range(ROWS) for c in range(COLS))


def cell_at_mouse(pos):
    mx, my = pos
    return my // CELL, mx // CELL


# ─── SETUP ────────────────────────────────
def setup(random_fill=True):
    global grid, generation, population, tick_acc
    grid       = make_grid(0.3 if random_fill else 0.0)
    generation = 0
    population = count_population(grid)
    tick_acc   = 0.0


# ─── UPDATE ───────────────────────────────
def update(dt):
    global grid, generation, population, tick_acc

    if paused:
        return

    tick_acc += dt
    if tick_acc >= tick_every:
        tick_acc  -= tick_every
        grid       = step(grid)
        generation += 1
        population  = count_population(grid)


# ─── DRAW ─────────────────────────────────
def draw(screen):
    theme = THEMES[theme_id]
    screen.fill(theme["dead"])

    for r in range(ROWS):
        for c in range(COLS):
            if grid[r][c] == 1:
                n = count_neighbors(grid, r, c)
                # Denser neighborhoods = brighter cell
                color = theme["live"] if n >= 2 else theme["dim"]
                pygame.draw.rect(
                    screen, color,
                    (c * CELL + 1, r * CELL + 1, CELL - 1, CELL - 1)
                )

    # Grid lines (subtle)
    for r in range(0, HEIGHT, CELL):
        pygame.draw.line(screen, theme["dead"], (0, r), (WIDTH, r))
    for c in range(0, WIDTH, CELL):
        pygame.draw.line(screen, theme["dead"], (c, 0), (c, HEIGHT))

    # HUD
    draw_hud(screen, theme)


def draw_hud(screen, theme):
    pad   = 8
    lines = [
        f"Culture : {THEMES[theme_id]['name']}  [1-6]",
        f"Gen     : {generation}",
        f"Pop     : {population}",
        f"Speed   : {1.0 / tick_every:.1f} gen/s  [scroll]",
        f"{'PAUSED' if paused else 'RUNNING'}  [space]",
        f"R=random  C=clear  LMB=draw  RMB=erase",
    ]
    # Semi transparent background
    hud_w = 260
    hud_h = len(lines) * 18 + pad * 2
    surf  = pygame.Surface((hud_w, hud_h), pygame.SRCALPHA)
    surf.fill((0, 0, 0, 160))
    screen.blit(surf, (pad, pad))

    for i, line in enumerate(lines):
        color = theme["live"] if i < 4 else WHITE
        text  = font_small.render(line, True, color)
        screen.blit(text, (pad * 2, pad + i * 18))


# ─── INPUT ────────────────────────────────
def handle(event):
    global paused, theme_id, tick_every, drawing, erasing

    if event.type == pygame.QUIT:
        pygame.quit()
        sys.exit()

    if event.type == pygame.KEYDOWN:
        if event.key == pygame.K_ESCAPE:
            pygame.quit()
            sys.exit()
        if event.key == pygame.K_r:
            setup(random_fill=True)
        if event.key == pygame.K_c:
            setup(random_fill=False)
        if event.key == pygame.K_SPACE:
            paused = not paused
        for k, t in enumerate([pygame.K_1, pygame.K_2, pygame.K_3,
                                pygame.K_4, pygame.K_5, pygame.K_6], 1):
            if event.key == t:
                theme_id = k

    if event.type == pygame.MOUSEBUTTONDOWN:
        if event.button == 1:
            drawing = True
            r, c = cell_at_mouse(event.pos)
            if 0 <= r < ROWS and 0 <= c < COLS:
                grid[r][c] = 1
        if event.button == 3:
            erasing = True
            r, c = cell_at_mouse(event.pos)
            if 0 <= r < ROWS and 0 <= c < COLS:
                grid[r][c] = 0

    if event.type == pygame.MOUSEBUTTONUP:
        if event.button == 1:
            drawing = False
        if event.button == 3:
            erasing = False

    if event.type == pygame.MOUSEMOTION:
        if drawing or erasing:
            r, c = cell_at_mouse(event.pos)
            if 0 <= r < ROWS and 0 <= c < COLS:
                grid[r][c] = 1 if drawing else 0

    if event.type == pygame.MOUSEWHEEL:
        if event.y > 0:
            tick_every = max(0.02, tick_every - 0.02)
        else:
            tick_every = min(1.0, tick_every + 0.02)


# ─── MAIN ─────────────────────────────────
def main():
    global font_small, font_large

    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption(TITLE)
    clock = pygame.time.Clock()

    font_small = pygame.font.SysFont("monospace", 13)
    font_large = pygame.font.SysFont("monospace", 20, bold=True)

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
