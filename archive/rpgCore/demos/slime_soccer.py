import pygame
import sys
import math

# ─── CONFIG ───────────────────────────────
GAME_WIDTH = 800
GAME_HEIGHT = 400
GROUND_HEIGHT = 80
SLIME_RADIUS = 40
BALL_RADIUS = 10
GOAL_WIDTH = 80
GOAL_HEIGHT = 120
GRAVITY = 0.6
SLIME_SPEED = 5
SLIME_JUMP_POWER = -12
BALL_DAMPING = 0.99
BALL_BOUNCE_DAMPING = 0.8
MAX_BALL_SPEED = 13
AI_REACTION_DISTANCE = 300
AI_PREDICTION_TIME = 30
FPS = 60

# ─── THEMES ───────────────────────────────
THEME_PRESETS = {
    "argentina": {"color": "#75AADB", "accent": "#FFFFFF", "name": "Argentina"},
    "belgium":   {"color": "#FDDA24", "accent": "#EF3340", "name": "Belgium"},
    "brazil":    {"color": "#009739", "accent": "#FEDD00", "name": "Brazil"},
    "france":    {"color": "#002395", "accent": "#ED2939", "name": "France"},
    "germany":   {"color": "#000000", "accent": "#FFCC00", "name": "Germany"},
    "italy":     {"color": "#009246", "accent": "#CE2B37", "name": "Italy"},
    "spain":     {"color": "#AA151B", "accent": "#F1BF00", "name": "Spain"},
    "usa":       {"color": "#002868", "accent": "#BF0A30", "name": "USA"},
    "uk":        {"color": "#012169", "accent": "#C8102E", "name": "UK"},
    "japan":     {"color": "#BC002D", "accent": "#FFFFFF", "name": "Japan"},
    "google":    {"color": "#4285F4", "accent": "#EA4335", "name": "Google"},
    "apple":     {"color": "#555555", "accent": "#FFFFFF", "name": "Apple"},
    "microsoft": {"color": "#00BCF2", "accent": "#FFB900", "name": "Microsoft"},
    "amazon":    {"color": "#FF9900", "accent": "#146EB4", "name": "Amazon"},
    "meta":      {"color": "#0668E1", "accent": "#FFFFFF", "name": "Meta"},
    "tesla":     {"color": "#CC0000", "accent": "#FFFFFF", "name": "Tesla"},
    "red":       {"color": "#DC143C", "accent": "#8B0000", "name": "Red Team"},
    "blue":      {"color": "#0000FF", "accent": "#000080", "name": "Blue Team"},
    "green":     {"color": "#00FF00", "accent": "#008000", "name": "Green Team"},
    "yellow":    {"color": "#FFD700", "accent": "#FFA500", "name": "Yellow Team"},
    "purple":    {"color": "#9370DB", "accent": "#4B0082", "name": "Purple Team"},
    "cyan":      {"color": "#00CED1", "accent": "#008B8B", "name": "Cyan Team"},
    "orange":    {"color": "#FFA500", "accent": "#FF4500", "name": "Orange Team"},
    "pink":      {"color": "#FF69B4", "accent": "#C71585", "name": "Pink Team"},
    "default":   {"color": "#00CED1", "accent": "#008B8B", "name": "Team"}
}

def hex_to_rgb(hex_str: str) -> tuple:
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def hsl_to_rgb(h: float, s: float, l: float) -> tuple:
    # Quick utility for the hash fallback
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c / 2
    
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
        
    return int((r + m) * 255), int((g + m) * 255), int((b + m) * 255)

def parse_theme(input_str: str) -> dict:
    normalized = input_str.lower().strip()
    if not normalized:
        return THEME_PRESETS["default"]
    
    if normalized in THEME_PRESETS:
        return THEME_PRESETS[normalized]
    
    # partial match
    for key, preset in THEME_PRESETS.items():
        if key in normalized or normalized in key:
            return preset
            
    # hash fallback
    val = 0
    for char in normalized:
        val = (ord(char) + ((val << 5) - val)) & 0xFFFFFFFF
        
    hue = abs(val) % 360
    # Equivalent to hsl(hue, 70%, 50%) for color and hsl(hue, 70%, 30%) for accent
    c_rgb = hsl_to_rgb(hue, 0.7, 0.5)
    a_rgb = hsl_to_rgb(hue, 0.7, 0.3)
    
    return {
        "color": c_rgb,
        "accent": a_rgb,
        "name": input_str.capitalize()
    }

# ─── STATE ────────────────────────────────
class Entity:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.vx = 0.0
        self.vy = 0.0

state = {
    "leftSlime": Entity(200, GAME_HEIGHT - GROUND_HEIGHT),
    "rightSlime": Entity(600, GAME_HEIGHT - GROUND_HEIGHT),
    "ball": Entity(GAME_WIDTH / 2, 150),
    
    "score_left": 0,
    "score_right": 0,
    
    "time_left": 0,
    "game_started": False,
    "game_mode": None,
    "player_mode": None,  # 'single' or 'multi'
    "winner": None,
    
    "theme_left": THEME_PRESETS["cyan"],
    "theme_right": THEME_PRESETS["red"]
}

keys = {}

font_large = None
font_med = None
font_small = None

# Timer event for seconds countdown
SECOND_TICK = pygame.USEREVENT + 1

# ─── LOGIC ────────────────────────────────

def init_positions():
    state["leftSlime"] = Entity(200, GAME_HEIGHT - GROUND_HEIGHT)
    state["rightSlime"] = Entity(600, GAME_HEIGHT - GROUND_HEIGHT)
    state["ball"] = Entity(GAME_WIDTH / 2, 150)

def reset_game():
    init_positions()
    state["score_left"] = 0
    state["score_right"] = 0
    state["winner"] = None

def start_game(time_mode):
    times = {'1min': 60, '2min': 120, '4min': 240, '8min': 480, 'worldcup': 300}
    reset_game()
    state["game_mode"] = time_mode
    state["time_left"] = times[time_mode]
    state["game_started"] = True
    pygame.time.set_timer(SECOND_TICK, 1000)

def determine_winner():
    l_score = state["score_left"]
    r_score = state["score_right"]
    if l_score > r_score:
        state["winner"] = state["theme_left"]["name"]
    elif r_score > l_score:
        state["winner"] = state["theme_right"]["name"]
    else:
        state["winner"] = "Draw"

def predict_ball(ball, ticks=100):
    tx, ty = ball.x, ball.y
    tvx, tvy = ball.vx, ball.vy
    predictions = []
    
    for t in range(ticks):
        tvy += GRAVITY
        tvx *= BALL_DAMPING
        tx += tvx
        ty += tvy
        
        if tx < BALL_RADIUS:
            tx = BALL_RADIUS
            tvx *= -BALL_BOUNCE_DAMPING
        if tx > GAME_WIDTH - BALL_RADIUS:
            tx = GAME_WIDTH - BALL_RADIUS
            tvx *= -BALL_BOUNCE_DAMPING
            
        predictions.append({"x": tx, "y": ty, "vx": tvx, "vy": tvy, "time": t})
        
        if ty > GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS:
            ty = GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS
            tvy *= -BALL_BOUNCE_DAMPING
            break
            
    return predictions

def update_ai():
    if state["player_mode"] != 'single':
        return
        
    ai = state["leftSlime"]
    opponent = state["rightSlime"]
    ball = state["ball"]
    
    FIELD_WIDTH = GAME_WIDTH
    OPPONENT_GOAL_X = FIELD_WIDTH - GOAL_WIDTH / 2
    AI_GOAL_X = GOAL_WIDTH / 2
    
    predictions = predict_ball(ball, ticks=100)
    
    ballDistToOpponentGoal = abs(ball.x - OPPONENT_GOAL_X)
    ballDistToAIGoal = abs(ball.x - AI_GOAL_X)
    aiDistToBall = abs(ai.x - ball.x)
    oppDistToBall = abs(opponent.x - ball.x)
    
    ballTowardAI = ball.vx < -1
    ballTowardOpponent = ball.vx > 1
    
    targetX = ai.x
    shouldJump = False
    moveSpeed = SLIME_SPEED
    
    # ── OFFENSIVE ──
    if ballDistToOpponentGoal < ballDistToAIGoal * 1.5 or (ball.x > FIELD_WIDTH * 0.4 and not ballTowardAI):
        idealAttackX = ball.x - 30
        if aiDistToBall <= oppDistToBall + 50:
            targetX = idealAttackX
            moveSpeed = SLIME_SPEED
            if aiDistToBall < 80:
                ballHeight = GAME_HEIGHT - GROUND_HEIGHT - ball.y
                if 20 < ballHeight < 80 and ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1:
                    timeToReach = abs(ai.x - ball.x) / max(SLIME_SPEED, 0.001)
                    heightWhenReached = ballHeight + ball.vy * timeToReach + 0.5 * GRAVITY * timeToReach * timeToReach
                    if 30 < heightWhenReached < 70:
                        shouldJump = True
        else:
            targetX = ball.x - 100
            
    # ── DEFENSIVE ──
    elif ball.x < FIELD_WIDTH * 0.6 or ballTowardAI:
        defensiveTarget = ball.x
        for pred in predictions:
            if pred["x"] < FIELD_WIDTH * 0.3:
                defensiveTarget = pred["x"]
                break
        targetX = defensiveTarget
        
        if ball.x < GOAL_WIDTH * 2 and ballTowardAI:
            targetX = max(ball.x - 20, SLIME_RADIUS)
            moveSpeed = SLIME_SPEED
            
        if aiDistToBall < 100 and ball.y < ai.y and ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1:
            timeToImpact = aiDistToBall / max(1, abs(ball.vx))
            expectedBallHeight = ball.y + ball.vy * timeToImpact + 0.5 * GRAVITY * timeToImpact * timeToImpact
            if GAME_HEIGHT - GROUND_HEIGHT - 80 < expectedBallHeight < GAME_HEIGHT - GROUND_HEIGHT - 20:
                shouldJump = True
                
    # ── MIDFIELD ──
    else:
        bestIntercept = None
        bestTime = float('inf')
        for pred in predictions:
            timeToReach = abs(ai.x - pred["x"]) / max(SLIME_SPEED, 0.001)
            if timeToReach < pred["time"] and pred["time"] < bestTime:
                bestIntercept = pred
                bestTime = pred["time"]
                
        if bestIntercept:
            targetX = bestIntercept["x"]
            if bestTime < 20 and bestIntercept["y"] < GAME_HEIGHT - GROUND_HEIGHT - 40 and ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1:
                shouldJump = True

    # Apply AI intent
    diff = targetX - ai.x
    if abs(diff) > 2:
        ai.vx = moveSpeed if diff > 0 else -moveSpeed
    else:
        ai.vx = 0
        
    if shouldJump and ai.vy == 0 and ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1:
        ai.vy = SLIME_JUMP_POWER

def update_physics():
    ai = state["leftSlime"]
    opponent = state["rightSlime"]
    ball = state["ball"]
    
    if state["player_mode"] == 'multi':
        # Left Player (WASD)
        if keys.get(pygame.K_a): ai.vx = -SLIME_SPEED
        elif keys.get(pygame.K_d): ai.vx = SLIME_SPEED
        else: ai.vx = 0
        
        if keys.get(pygame.K_w) and ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1:
            ai.vy = SLIME_JUMP_POWER
            
        # Right Player (Arrows)
        if keys.get(pygame.K_LEFT): opponent.vx = -SLIME_SPEED
        elif keys.get(pygame.K_RIGHT): opponent.vx = SLIME_SPEED
        else: opponent.vx = 0
        
        if keys.get(pygame.K_UP) and opponent.y >= GAME_HEIGHT - GROUND_HEIGHT - 1:
            opponent.vy = SLIME_JUMP_POWER
            
    else:
        # Single player
        if keys.get(pygame.K_LEFT): opponent.vx = -SLIME_SPEED
        elif keys.get(pygame.K_RIGHT): opponent.vx = SLIME_SPEED
        else: opponent.vx = 0
        
        if keys.get(pygame.K_UP) and opponent.y >= GAME_HEIGHT - GROUND_HEIGHT - 1:
            opponent.vy = SLIME_JUMP_POWER
            
        update_ai()

    # Move slimes
    for slime in (ai, opponent):
        slime.vy += GRAVITY
        slime.x += slime.vx
        slime.y += slime.vy
        
        if slime.x < SLIME_RADIUS: 
            slime.x = SLIME_RADIUS
        if slime.x > GAME_WIDTH - SLIME_RADIUS: 
            slime.x = GAME_WIDTH - SLIME_RADIUS
        if slime.y > GAME_HEIGHT - GROUND_HEIGHT: 
            slime.y = GAME_HEIGHT - GROUND_HEIGHT
            slime.vy = 0

    # Move ball
    ball.vy += GRAVITY
    ball.vx *= BALL_DAMPING
    ball.x += ball.vx
    ball.y += ball.vy

    # Ball / Wall collisions
    if ball.x < BALL_RADIUS:
        ball.x = BALL_RADIUS
        ball.vx *= -BALL_BOUNCE_DAMPING
    if ball.x > GAME_WIDTH - BALL_RADIUS:
        ball.x = GAME_WIDTH - BALL_RADIUS
        ball.vx *= -BALL_BOUNCE_DAMPING
    if ball.y < BALL_RADIUS:
        ball.y = BALL_RADIUS
        ball.vy *= -BALL_BOUNCE_DAMPING

    # Ball / Ground collision and Goal Checks
    if ball.y > GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS:
        ball.y = GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS
        ball.vy *= -BALL_BOUNCE_DAMPING
        
        if ball.x < GOAL_WIDTH:
            state["score_right"] += 1
            init_positions()
        elif ball.x > GAME_WIDTH - GOAL_WIDTH:
            state["score_left"] += 1
            init_positions()

    # Semicircle Collision (Ball / Slime)
    for slime in (ai, opponent):
        dx = ball.x - slime.x
        dy = ball.y - slime.y
        distance = math.sqrt(dx*dx + dy*dy)
        
        if distance < SLIME_RADIUS + BALL_RADIUS:
            angle = math.atan2(dy, dx)
            # Only hit from the top half semicircle
            if ball.y < slime.y or abs(angle) < math.pi * 0.5:
                # push out
                ball.x = slime.x + math.cos(angle) * (SLIME_RADIUS + BALL_RADIUS)
                ball.y = slime.y + math.sin(angle) * (SLIME_RADIUS + BALL_RADIUS)
                
                # velocity transfer
                speed = math.sqrt(ball.vx**2 + ball.vy**2)
                ball.vx = math.cos(angle) * speed * 1.5 + slime.vx * 0.5
                ball.vy = math.sin(angle) * speed * 1.5 + slime.vy * 0.5
                
                # clamp
                new_speed = math.sqrt(ball.vx**2 + ball.vy**2)
                if new_speed > MAX_BALL_SPEED:
                    scale = MAX_BALL_SPEED / new_speed
                    ball.vx *= scale
                    ball.vy *= scale

# ─── DRAW ─────────────────────────────────
def resolve_color(c):
    if isinstance(c, tuple): return c
    if isinstance(c, str) and c.startswith('#'):
        return hex_to_rgb(c)
    return (255, 255, 255)

def draw_half_circle(surface, color, center, radius):
    c_x, c_y = map(int, center)
    r = int(radius)
    rect = pygame.Rect(c_x - r, c_y - r, r * 2, r * 2)
    # the start/stop angles for arc are weird in pygame, drawing a polygon is safer to fill
    points = []
    # top half arc from 180 to 0 degrees
    for deg in range(180, -1, -5):
        rad = math.radians(deg)
        points.append((c_x + r * math.cos(rad), c_y - r * math.sin(rad)))
    pygame.draw.polygon(surface, resolve_color(color), points)

def draw_accent_stripe(surface, color, center, radius):
    c_x, c_y = map(int, center)
    r_outer = int(radius - 5)
    r_inner = int(radius - 15)
    points = []
    # stripe from pi+0.3 to pi+0.7
    for deg in range(162, 126, -3):  # ~180-18 to 180-54
        rad = math.radians(deg)
        points.append((c_x + r_outer * math.cos(rad), c_y - r_outer * math.sin(rad)))
    for deg in range(126, 162, 3):
        rad = math.radians(deg)
        points.append((c_x + r_inner * math.cos(rad), c_y - r_inner * math.sin(rad)))
    if len(points) >= 3:
        pygame.draw.polygon(surface, resolve_color(color), points)

def draw(screen):
    # BG
    screen.fill((0, 0, 255))
    # Ground
    pygame.draw.rect(screen, (128, 128, 128), (0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT))
    
    # Goals
    # Left
    pygame.draw.rect(screen, (255, 255, 255), (GOAL_WIDTH-2, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT, 4, GOAL_HEIGHT))
    # Right
    pygame.draw.rect(screen, (255, 255, 255), (GAME_WIDTH - GOAL_WIDTH - 2, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT, 4, GOAL_HEIGHT))
    
    # Slimes
    def draw_slime(slime, is_right, theme):
        draw_half_circle(screen, theme["color"], (slime.x, slime.y), SLIME_RADIUS)
        draw_accent_stripe(screen, theme["accent"], (slime.x, slime.y), SLIME_RADIUS)
        
        eye_x_offset = -SLIME_RADIUS * 0.3 if is_right else SLIME_RADIUS * 0.3
        pupil_x_offset = -SLIME_RADIUS * 0.35 if is_right else SLIME_RADIUS * 0.35
        
        # Eye white
        pygame.draw.circle(screen, (255, 255, 255), (int(slime.x + eye_x_offset), int(slime.y - SLIME_RADIUS * 0.3)), 5)
        # Pupil
        pygame.draw.circle(screen, (0, 0, 0), (int(slime.x + pupil_x_offset), int(slime.y - SLIME_RADIUS * 0.3)), 2)

    draw_slime(state["leftSlime"], False, state["theme_left"])
    draw_slime(state["rightSlime"], True, state["theme_right"])
    
    # Ball
    pygame.draw.circle(screen, (255, 215, 0), (int(state["ball"].x), int(state["ball"].y)), BALL_RADIUS)

    # Score / Time Overlay
    score_text = f"{state['score_left']}   -   {state['time_left'] // 60:02d}:{state['time_left'] % 60:02d}   -   {state['score_right']}"
    surf = font_large.render(score_text, True, (255, 255, 255))
    screen.blit(surf, (GAME_WIDTH // 2 - surf.get_width() // 2, 20))


def main():
    global font_large, font_med, font_small

    pygame.init()
    screen = pygame.display.set_mode((GAME_WIDTH, GAME_HEIGHT))
    pygame.display.set_caption("Slime Soccer")
    clock = pygame.time.Clock()

    font_large = pygame.font.SysFont("monospace", 32, bold=True)
    font_med = pygame.font.SysFont("monospace", 24, bold=True)
    font_small = pygame.font.SysFont("monospace", 16)

    while True:
        dt = clock.tick(FPS)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
                
            if event.type == pygame.KEYDOWN:
                keys[event.key] = True
            if event.type == pygame.KEYUP:
                keys[event.key] = False
                
            if event.type == SECOND_TICK and state["game_started"]:
                state["time_left"] -= 1
                if state["time_left"] <= 0:
                    state["game_started"] = False
                    pygame.time.set_timer(SECOND_TICK, 0)
                    determine_winner()

        if state["game_started"]:
            update_physics()
            draw(screen)
        else:
            screen.fill((20, 30, 40))
            if state["winner"]:
                w_text = f"{state['winner']} Wins!" if state["winner"] != "Draw" else "It's a Draw!"
                s1 = font_large.render(w_text, True, (255, 255, 0))
                s2 = font_med.render("Press SPACE to return to menu", True, (200, 200, 200))
                screen.blit(s1, (GAME_WIDTH // 2 - s1.get_width() // 2, 100))
                screen.blit(s2, (GAME_WIDTH // 2 - s2.get_width() // 2, 180))
                
                if keys.get(pygame.K_SPACE):
                    state["winner"] = None
                    state["game_mode"] = None
                    state["player_mode"] = None
            elif not state["player_mode"]:
                title = font_large.render("Soccer Slime!", True, (255, 255, 255))
                screen.blit(title, (GAME_WIDTH // 2 - title.get_width() // 2, 60))
                
                msg = font_med.render("Press '1' for Single Player | '2' for Multiplayer", True, (150, 200, 255))
                screen.blit(msg, (GAME_WIDTH // 2 - msg.get_width() // 2, 200))
                
                if keys.get(pygame.K_1):
                    state["player_mode"] = 'single'
                elif keys.get(pygame.K_2):
                    state["player_mode"] = 'multi'
            else:
                title = font_med.render("Select Duration ('1', '2', '4', '8' or '0' for worldcup)", True, (255, 255, 255))
                screen.blit(title, (GAME_WIDTH // 2 - title.get_width() // 2, 100))
                
                if keys.get(pygame.K_1): start_game('1min')
                elif keys.get(pygame.K_2): start_game('2min')
                elif keys.get(pygame.K_4): start_game('4min')
                elif keys.get(pygame.K_8): start_game('8min')
                elif keys.get(pygame.K_0): start_game('worldcup')

        pygame.display.flip()

if __name__ == "__main__":
    main()
