import pygame
import sys
import random
import math

# ─── CONFIG ───────────────────────────────
WIDTH, HEIGHT  = 960, 440
FPS            = 60
TITLE          = "Dice Roller — Face Geometry"

FAST_DURATION  = 0.55   # blur phase
DECEL_DURATION = 0.30   # stutter-settle phase
LAND_DURATION  = 0.28
SETTLE_GLOW    = 1.4

STUTTER_FRAMES = 4      # distinct faces shown during decel
STUTTER_HOLD   = DECEL_DURATION / STUTTER_FRAMES  # ~75ms each

# ─── COLORS ───────────────────────────────
BG     = (16, 16, 22)
SHADOW = (8,  8,  12)
WHITE  = (255, 255, 255)
GOLD   = (255, 200, 55)

DIE_COLORS = {
    4:   {"body": (170, 55,  18 ), "edge": (255, 125, 55 ), "pip": (255, 215, 170), "glow": (255, 140, 60)},
    6:   {"body": (40,  120, 195), "edge": (90,  170, 255), "pip": (215, 238, 255), "glow": (100, 180, 255)},
    8:   {"body": (35,  150, 72 ), "edge": (72,  215, 110), "pip": (195, 255, 215), "glow": (80,  220, 120)},
    10:  {"body": (120, 45,  175), "edge": (185, 95,  255), "pip": (238, 195, 255), "glow": (190, 100, 255)},
    12:  {"body": (155, 135, 18 ), "edge": (228, 208, 55 ), "pip": (255, 248, 195), "glow": (235, 215, 60)},
    20:  {"body": (55,  55,  175), "edge": (115, 115, 255), "pip": (215, 215, 255), "glow": (120, 120, 255)},
    100: {"body": (155, 28,  75 ), "edge": (228, 75,  138), "pip": (255, 195, 218), "glow": (235, 80,  145)},
}

# ─── PIP LAYOUTS ──────────────────────────
# Each value maps to pip positions as (x, y) in [-1, 1] space
# Rendered as circles scaled to die size

PIP_LAYOUTS = {
    1: [(0.0,  0.0)],
    2: [(-0.38, -0.38), (0.38,  0.38)],
    3: [(-0.38, -0.38), (0.0,   0.0),  (0.38,  0.38)],
    4: [(-0.38, -0.38), (0.38, -0.38), (-0.38,  0.38), (0.38,  0.38)],
    5: [(-0.38, -0.38), (0.38, -0.38), (0.0,   0.0),
        (-0.38,  0.38), (0.38,  0.38)],
    6: [(-0.38, -0.38), (0.38, -0.38),
        (-0.38,  0.0),  (0.38,  0.0),
        (-0.38,  0.38), (0.38,  0.38)],
}


# ─── POLYGON SHAPES ───────────────────────
# Unit polygons — centred at origin, radius 1.0
# Rotated/scaled at draw time

def pts_triangle(r=1.0):
    return [(r * math.cos(math.radians(-90 + i*120)),
             r * math.sin(math.radians(-90 + i*120))) for i in range(3)]

def pts_square(r=1.0):
    s = r * 0.88
    return [(-s,-s),(s,-s),(s,s),(-s,s)]

def pts_octagon(r=1.0):
    return [(r*math.cos(math.radians(i*45+22.5)),
             r*math.sin(math.radians(i*45+22.5))) for i in range(8)]

def pts_d10(r=1.0):
    pts = []
    for i in range(10):
        a   = math.radians(i*36 - 90)
        rad = r if i % 2 == 0 else r * 0.62
        pts.append((rad*math.cos(a), rad*math.sin(a)))
    return pts

def pts_pentagon(r=1.0):
    return [(r*math.cos(math.radians(i*72-90)),
             r*math.sin(math.radians(i*72-90))) for i in range(5)]

def pts_hexagon(r=1.0):
    return [(r*math.cos(math.radians(i*60+30)),
             r*math.sin(math.radians(i*60+30))) for i in range(6)]

def pts_circle(r=1.0, n=14):
    return [(r*math.cos(math.radians(i*(360/n))),
             r*math.sin(math.radians(i*(360/n)))) for i in range(n)]

SHAPE_FN = {
    4:   pts_triangle,
    6:   pts_square,
    8:   pts_octagon,
    10:  pts_d10,
    12:  pts_pentagon,
    20:  pts_hexagon,
    100: pts_circle,
}


# ─── EASING ───────────────────────────────
def ease_out_bounce(t):
    if t < 1/2.75:
        return 7.5625*t*t
    elif t < 2/2.75:
        t -= 1.5/2.75
        return 7.5625*t*t + 0.75
    elif t < 2.5/2.75:
        t -= 2.25/2.75
        return 7.5625*t*t + 0.9375
    else:
        t -= 2.625/2.75
        return 7.5625*t*t + 0.984375


# ─── FACE DRAWING ─────────────────────────

def draw_pips(screen, cx, cy, r, value, color, alpha=255):
    """Draw pip layout for D4/D6 faces."""
    layout = PIP_LAYOUTS.get(min(value, 6), PIP_LAYOUTS[6])
    pip_r  = max(2, int(r * 0.13))
    surf   = pygame.Surface((r*4, r*4), pygame.SRCALPHA)
    off    = r * 2
    for px, py in layout:
        sx = int(off + px * r * 0.72)
        sy = int(off + py * r * 0.72)
        pygame.draw.circle(surf, (*color, alpha), (sx, sy), pip_r)
    screen.blit(surf, (cx - r*2, cy - r*2))


def draw_number_face(screen, cx, cy, r, value, colors, fonts,
                     spin=0.0, squash=1.0, stretch=1.0,
                     alpha=255, is_crit=False, is_fumble=False,
                     stutter_flash=False, sides=20):
    """
    Draw a die face — polygon shape + number centered.
    For D4/D6: pips. For others: number.
    spin, squash, stretch applied to shape.
    """
    raw_pts  = SHAPE_FN.get(sides, pts_hexagon)(1.0)
    angle    = math.radians(spin)
    cos_a, sin_a = math.cos(angle), math.sin(angle)

    r_x = r * stretch
    r_y = r * squash

    pts = []
    for px, py in raw_pts:
        sx = px * r_x
        sy = py * r_y
        rx = sx * cos_a - sy * sin_a
        ry = sx * sin_a + sy * cos_a
        pts.append((int(cx + rx), int(cy + ry)))

    # Body surface (handles alpha)
    body_surf = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)

    body_col  = (*colors["body"], alpha)
    edge_col  = (*colors["edge"], alpha)

    if len(pts) >= 3:
        pygame.draw.polygon(body_surf, body_col, pts)
        pygame.draw.polygon(body_surf, edge_col, pts, 2)

        # Subtle inner highlight — top-left wedge
        half = raw_pts[:max(3, len(raw_pts)//2)]
        hi_pts = []
        for px, py in half:
            sx = px * r_x * 0.52
            sy = py * r_y * 0.52
            rx = sx * cos_a - sy * sin_a - r_x * 0.12
            ry = sx * sin_a + sy * cos_a - r_y * 0.12
            hi_pts.append((int(cx + rx), int(cy + ry)))
        if len(hi_pts) >= 3:
            pygame.draw.polygon(body_surf, (255, 255, 255, min(alpha, 28)), hi_pts)

    screen.blit(body_surf, (0, 0))

    # Number / pips
    if sides in (4, 6) and value <= 6:
        pip_alpha = alpha
        draw_pips(screen, cx, cy, r, value, colors["pip"], pip_alpha)
    else:
        # Number label
        if is_crit:
            num_col  = GOLD
            font_key = "num_lg"
        elif is_fumble:
            num_col  = (255, 75, 75)
            font_key = "num_lg"
        elif stutter_flash:
            num_col  = colors["pip"]
            font_key = "num_md"
        else:
            num_col  = colors["pip"]
            font_key = "num_md" if sides < 100 else "num_sm"

        label = str(value) if sides != 100 else f"{value:02d}"
        surf  = fonts[font_key].render(label, True, num_col)
        rect  = surf.get_rect(center=(cx, cy))
        if alpha < 255:
            surf.set_alpha(alpha)
        screen.blit(surf, rect)

        # Underline on D10/D100 for 6/9 disambiguation
        if sides in (10, 100) and value in (6, 9, 16, 19, 60, 66, 90, 96, 99):
            uw = surf.get_width()
            uy = rect.bottom + 2
            pygame.draw.line(screen, num_col,
                             (rect.left + uw//4, uy),
                             (rect.right - uw//4, uy), 1)


# ─── DIE CLASS ────────────────────────────
class Die:
    def __init__(self, sides, cx, cy, radius=40):
        self.sides   = sides
        self.cx      = cx
        self.cy      = cy
        self.radius  = radius
        self.result  = 1
        self.display = 1        # current shown face value

        # Stutter sequence — built on roll
        self.stutter_seq    = []   # list of values to flash through
        self.stutter_idx    = 0
        self.stutter_timer  = 0.0

        # Animation
        self.state      = "idle"
        self.timer      = 0.0
        self.phase_timer= 0.0
        self.glow       = 0.0
        self.squash     = 1.0
        self.stretch    = 1.0
        self.spin       = 0.0
        self.spin_speed = 0.0
        self.shake_x    = 0.0
        self.shake_y    = 0.0
        self.y_offset   = 0.0
        self.hovered    = False

    @property
    def label(self):
        return f"D{self.sides}"

    def _make_stutter(self):
        """Build a sequence of readable decoy values + result at end."""
        seq = []
        used = {self.result}
        for _ in range(STUTTER_FRAMES - 1):
            v = random.randint(1, self.sides)
            # Avoid repeats and result until last
            attempts = 0
            while v in used and attempts < 10:
                v = random.randint(1, self.sides)
                attempts += 1
            used.add(v)
            seq.append(v)
        seq.append(self.result)  # always end on result
        return seq

    def roll(self):
        self.result      = random.randint(1, self.sides)
        self.stutter_seq = self._make_stutter()
        self.stutter_idx = 0
        self.stutter_timer = 0.0
        self.display     = random.randint(1, self.sides)
        self.state       = "fast"
        self.timer       = 0.0
        self.spin        = random.uniform(0, 360)
        self.spin_speed  = random.choice([-1,1]) * random.uniform(420, 740)
        self.glow        = 0.0
        self.squash      = 1.0
        self.stretch     = 1.0

    def update(self, dt):
        self.hovered = False

        if self.state == "idle":
            self.squash   = 1.0
            self.stretch  = 1.0
            self.y_offset = 0.0
            self.shake_x  = 0.0
            self.shake_y  = 0.0
            self.spin     = 0.0

        elif self.state == "fast":
            self.timer += dt
            t = self.timer / FAST_DURATION

            # Rapid face cycling — blur effect via fast random changes
            if random.random() < 0.5:
                self.display = random.randint(1, self.sides)

            # Fast spin
            self.spin += self.spin_speed * dt
            self.spin_speed *= max(0.0, 1.0 - dt * 1.2)

            # Shake intensity decreases as we approach decel
            intensity = max(0, (1.0 - t)) * 7
            self.shake_x = random.uniform(-intensity, intensity)
            self.shake_y = random.uniform(-intensity, intensity)

            # Wobble squash
            self.squash  = 1.0 + math.sin(self.timer * 22) * 0.07 * (1 - t)
            self.stretch = 1.0 / max(0.82, self.squash)

            if self.timer >= FAST_DURATION:
                self.state        = "decel"
                self.timer        = 0.0
                self.stutter_idx  = 0
                self.stutter_timer= 0.0
                self.shake_x      = 0.0
                self.shake_y      = 0.0
                self.squash       = 1.0
                self.stretch      = 1.0
                self.display      = self.stutter_seq[0]

        elif self.state == "decel":
            self.timer       += dt
            self.stutter_timer += dt

            # Advance stutter frame
            if self.stutter_timer >= STUTTER_HOLD:
                self.stutter_timer -= STUTTER_HOLD
                self.stutter_idx = min(self.stutter_idx + 1,
                                       len(self.stutter_seq) - 1)
                self.display = self.stutter_seq[self.stutter_idx]

            # Slow residual spin
            self.spin += self.spin_speed * dt
            self.spin_speed *= max(0.0, 1.0 - dt * 4.0)

            # Gentle wobble
            t = self.timer / DECEL_DURATION
            self.squash  = 1.0 + math.sin(self.timer * 10) * 0.03 * (1 - t)
            self.stretch = 1.0 / max(0.95, self.squash)

            if self.timer >= DECEL_DURATION:
                self.state       = "landing"
                self.timer       = 0.0
                self.display     = self.result
                self.spin        = 0.0
                self.spin_speed  = 0.0

        elif self.state == "landing":
            self.timer += dt
            t = self.timer / LAND_DURATION

            if t < 0.28:
                st = t / 0.28
                self.squash  = 1.0 - st * 0.32
                self.stretch = 1.0 + st * 0.22
            else:
                bt = (t - 0.28) / 0.72
                self.squash  = 0.68 + ease_out_bounce(bt) * 0.32
                self.stretch = 1.0 + (1.0 - ease_out_bounce(bt)) * 0.22

            self.y_offset = (1.0 - min(1.0, t * 2.2)) * 10
            self.glow     = min(1.0, t * 2.5)

            if self.timer >= LAND_DURATION:
                self.state    = "settled"
                self.timer    = 0.0
                self.squash   = 1.0
                self.stretch  = 1.0
                self.y_offset = 0.0
                self.glow     = 1.0

        elif self.state == "settled":
            self.timer += dt
            self.glow   = max(0.0, 1.0 - (self.timer / SETTLE_GLOW))
            if self.timer > SETTLE_GLOW * 1.6:
                self.state = "idle"

    def draw(self, screen, fonts):
        colors    = DIE_COLORS[self.sides]
        r         = self.radius
        cx        = self.cx + int(self.shake_x)
        cy        = self.cy + int(self.shake_y) + int(self.y_offset)
        is_crit   = (self.display == self.sides and self.state in ("settled","landing"))
        is_fumble = (self.display == 1          and self.state in ("settled","landing"))

        # ── GLOW RING ──
        if self.glow > 0.01:
            gr    = int(r + 8 + self.glow * 10)
            ga    = int(self.glow * 100)
            gc    = colors["glow"]
            gsurf = pygame.Surface((gr*2+4, gr*2+4), pygame.SRCALPHA)
            pygame.draw.circle(gsurf, (*gc, ga), (gr+2, gr+2), gr)
            screen.blit(gsurf, (cx-gr-2, cy-gr-2))

        # ── SHADOW ──
        r_x = r * self.stretch
        r_y = r * self.squash
        shsurf = pygame.Surface((int(r_x*2+10), 14), pygame.SRCALPHA)
        pygame.draw.ellipse(shsurf, (*SHADOW, 70), (0, 0, int(r_x*2+10), 14))
        screen.blit(shsurf, (cx - int(r_x) - 5, cy + int(r_y) - 5))

        # ── HOVER ──
        if self.hovered and self.state == "idle":
            hsurf = pygame.Surface((int(r*2.8), int(r*2.8)), pygame.SRCALPHA)
            pygame.draw.circle(hsurf, (255,255,200,35),
                               (int(r*1.4), int(r*1.4)), int(r*1.4))
            screen.blit(hsurf, (cx - int(r*1.4), cy - int(r*1.4)))

        # ── FACE ──
        # During fast phase: strong alpha variation gives blur illusion
        if self.state == "fast":
            alpha = random.randint(160, 255)
        else:
            alpha = 255

        stutter_flash = (self.state == "decel")

        draw_number_face(
            screen, cx, cy, r,
            value    = self.display,
            colors   = colors,
            fonts    = fonts,
            spin     = self.spin,
            squash   = self.squash,
            stretch  = self.stretch,
            alpha    = alpha,
            is_crit  = is_crit,
            is_fumble= is_fumble,
            stutter_flash = stutter_flash,
            sides    = self.sides,
        )

        # ── CRIT / FUMBLE LABEL ──
        if self.state == "settled" and self.glow > 0.25:
            if is_crit:
                lbl = fonts["label"].render("CRIT!", True, GOLD)
                screen.blit(lbl, lbl.get_rect(center=(cx, cy + r + 16)))
            elif is_fumble:
                lbl = fonts["label"].render("FUMBLE", True, (255, 75, 75))
                screen.blit(lbl, lbl.get_rect(center=(cx, cy + r + 16)))

        # ── DIE LABEL ──
        lc   = colors["edge"] if self.hovered else (88, 88, 108)
        lsurf = fonts["label"].render(self.label, True, lc)
        screen.blit(lsurf, lsurf.get_rect(center=(cx, cy + r + 30)))

    def contains(self, mx, my):
        return math.hypot(mx - self.cx, my - self.cy) < self.radius + 10


# ─── LAYOUT ───────────────────────────────
DICE_SIDES = [4, 6, 8, 10, 12, 20, 100]

def make_dice():
    count  = len(DICE_SIDES)
    margin = WIDTH // (count + 1)
    cy     = HEIGHT // 2 - 15
    return [Die(sides, margin * (i+1), cy) for i, sides in enumerate(DICE_SIDES)]


# ─── BACKGROUND ───────────────────────────
def draw_bg(screen):
    screen.fill(BG)
    for x in range(0, WIDTH, 44):
        for y in range(0, HEIGHT, 44):
            pygame.draw.circle(screen, (26, 26, 38), (x, y), 1)


# ─── HUD ──────────────────────────────────
def draw_hud(screen, fonts, dice):
    title = fonts["title"].render("Dice Roller", True, (72, 72, 100))
    screen.blit(title, (14, 10))

    hint = fonts["hint"].render(
        "CLICK to roll  |  SPACE / R = roll all  |  1-7 = individual die",
        True, (48, 48, 68)
    )
    screen.blit(hint, hint.get_rect(midbottom=(WIDTH//2, HEIGHT - 8)))

    # Show settled results row
    results = []
    for d in dice:
        if d.state in ("settled", "idle") and d.display > 1:
            results.append(f"D{d.sides}={d.display}")
        elif d.state in ("settled",):
            results.append(f"D{d.sides}={d.display}")
    if results:
        rline = "  ".join(results)
        rsurf = fonts["hint"].render(rline, True, (80, 80, 110))
        screen.blit(rsurf, rsurf.get_rect(midtop=(WIDTH//2, 12)))


# ─── MAIN ─────────────────────────────────
def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption(TITLE)
    clock  = pygame.time.Clock()

    fonts = {
        "title":  pygame.font.SysFont("monospace", 17, bold=True),
        "label":  pygame.font.SysFont("monospace", 11),
        "hint":   pygame.font.SysFont("monospace", 11),
        "num_sm": pygame.font.SysFont("monospace", 13, bold=True),
        "num_md": pygame.font.SysFont("monospace", 20, bold=True),
        "num_lg": pygame.font.SysFont("monospace", 28, bold=True),
    }

    dice = make_dice()

    while True:
        dt = min(clock.tick(FPS) / 1000.0, 0.05)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit(); sys.exit()

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    pygame.quit(); sys.exit()
                if event.key in (pygame.K_SPACE, pygame.K_r):
                    for d in dice: d.roll()
                key_map = {
                    pygame.K_1: 0, pygame.K_2: 1, pygame.K_3: 2,
                    pygame.K_4: 3, pygame.K_5: 4, pygame.K_6: 5,
                    pygame.K_7: 6,
                }
                if event.key in key_map:
                    idx = key_map[event.key]
                    if idx < len(dice):
                        dice[idx].roll()

            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                for d in dice:
                    if d.contains(*event.pos):
                        d.roll()

        mx, my = pygame.mouse.get_pos()
        for d in dice:
            if d.contains(mx, my):
                d.hovered = True

        for d in dice:
            d.update(dt)

        draw_bg(screen)
        draw_hud(screen, fonts, dice)
        for d in dice:
            d.draw(screen, fonts)

        pygame.display.flip()


if __name__ == "__main__":
    main()
