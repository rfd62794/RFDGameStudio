import pygame
import math
import random
import sys
import importlib
from typing import List, Optional
from dataclasses import dataclass

from src.shared.engine.scene_manager import Scene
from src.shared.ui.spec import UISpec
from src.shared.ui.theme import DEFAULT_THEME
from src.shared.rendering.garden_renderer import GardenRenderer
from src.shared.rendering.slime_renderer import render_slime_from_genome
from src.shared.engine.legacy_adapter import LegacySceneAdapter

from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CulturalBase

@dataclass
class WanderSlime:
    culture: str
    x: float
    y: float
    vx: float
    vy: float
    radius: int
    speed: float
    direction_timer: float
    direction_interval: float
    pause_timer: float
    target_id: int | None
    genome: SlimeGenome

class MainMenuScene(Scene):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.registry = None
        
        # Slime colors using theme culture fallback or arbitrary defaults
        culture_colors = {
            "Ember": (200, 60, 40),
            "Gale": (150, 200, 180),
            "Marsh": (60, 140, 60),
            "Crystal": (180, 60, 200),
            "Tundra": (180, 220, 255),
            "Tide": (60, 100, 200)
        }
        
        size_map = {
            "Ember": ("medium", 28),
            "Gale": ("small", 22),
            "Marsh": ("large", 38),
            "Crystal": ("medium", 26),
            "Tundra": ("massive", 42),
            "Tide": ("medium", 30)
        }
        
        speeds = {
            "Ember": 80.0,
            "Gale": 140.0,
            "Marsh": 30.0,
            "Crystal": 60.0,
            "Tundra": 10.0,
            "Tide": 50.0
        }
        
        intervals = {
            "Ember": 1.5,
            "Gale": 4.0,
            "Marsh": 8.0,
            "Crystal": 2.0,
            "Tundra": 12.0,
            "Tide": 3.0
        }
        
        self.slimes: List[WanderSlime] = []
        self.ground_y = spec.screen_height - (spec.screen_height // 4)
        
        cultures = ["Ember", "Gale", "Marsh", "Crystal", "Tundra", "Tide"]
        
        for i, c in enumerate(cultures):
            size_name, radius = size_map[c]
            cult_enum = next((cb for cb in CulturalBase if cb.value.lower() == c.lower()), CulturalBase.VOID)
            
            genome = SlimeGenome(
                shape="round" if c != "Crystal" else "crystalline",
                size=size_name,
                base_color=culture_colors[c],
                pattern="solid",
                pattern_color=(255, 255, 255),
                accessory="none",
                curiosity=0.5,
                energy=0.5,
                affection=0.5,
                shyness=0.5,
                base_hp=20,
                base_atk=5,
                base_spd=5,
                cultural_base=cult_enum,
                culture_expression={c.lower(): 1.0},
                generation=1,
                level=5
            )
            
            self.slimes.append(WanderSlime(
                culture=c,
                x=random.uniform(radius, spec.screen_width - radius),
                y=0, # Computed dynamically below
                vx=speeds[c] * random.choice([-1, 1]),
                vy=0.0,
                radius=radius,
                speed=speeds[c],
                direction_timer=intervals[c],
                direction_interval=intervals[c],
                pause_timer=0.0,
                target_id=None,
                genome=genome
            ))
            
        self.time_acc = 0.0
        
        self.ship_x = -20
        self.ship_y = spec.screen_height - 140
        self.garden_renderer = GardenRenderer(pygame.Rect(0, 0, spec.screen_width, spec.screen_height))
        
        self.hovered_btn_idx = -1
        self._setup_buttons()

    def on_enter(self, context) -> None:
        super().on_enter(context)
        self.registry = context.resources.get("registry")

    def _setup_buttons(self):
        self.buttons = []
        # Fallback titles if registry not provided
        self.titles = [
            ("Slime Garden", "slime_breeder"),
            ("Dungeon", "dungeon_crawler"),
            ("Racing", "turbo_shells"),
            ("Sumo", "slime_sumo"), # Arbitrary mapping, handled manually later or via registry id matching loosely
            ("Tower Defense", "tower_defense"),
            ("Breeding", "breeding"),
            ("Slime Clan", "slime_clan"),
            ("Last Appt", "last_appointment"),
            ("Space Trader", "space_trader"),
            ("Asteroids", "asteroids"),
            ("Quit", "quit")
        ]
        
        start_y = 120
        btn_h = 36
        btn_w = 200
        x_pos = self.spec.screen_width - btn_w - 60
        
        for i, (label, target) in enumerate(self.titles):
            y_pos = start_y + (i * (btn_h + 8))
            if label == "Quit":
                y_pos += 20 # Gap
            
            rect = pygame.Rect(x_pos, y_pos, btn_w, btn_h)
            self.buttons.append({
                "label": label,
                "target": target,
                "rect": rect
            })

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.MOUSEMOTION:
            self.hovered_btn_idx = -1
            for i, b in enumerate(self.buttons):
                if b["rect"].collidepoint(event.pos):
                    self.hovered_btn_idx = i
                    break
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.hovered_btn_idx != -1:
                self._launch_target(self.buttons[self.hovered_btn_idx]["target"])

    def _launch_target(self, target: str):
        if target == "quit":
            self.request_quit()
            return
            
        if self.registry:
            # First try exact match
            demo = self.registry.get(target)
            if not demo:
                # Try finding close matches by name loosely (e.g. Sumo, Tower Defense)
                for d in self.registry.all():
                    if target.lower() in d.name.lower() or target.lower() in d.id.lower() or d.id.lower() in target.lower() or d.name.lower() in target.lower():
                        demo = d
                        break
            
            if demo:
                # For proper scenes like Slime Garden context:
                if demo.id == "slime_breeder":
                    from src.apps.slime_breeder.ui.scene_garden import GardenScene
                    self.context.manager.switch_to(GardenScene(**self.context.resources))
                else:
                    # Legacy fallback
                    try:
                        module = importlib.import_module(demo.module)
                        entry_func = getattr(module, demo.entry)
                        adapter = LegacySceneAdapter(entry_func)
                        adapter.launch()
                    except Exception as e:
                        print(f"Warning: Failed to launch {demo.name}. {e}")
            else:
                print(f"Warning: Demo '{target}' not found in registry.")

    def tick(self, dt: float) -> None:
        self.time_acc += dt
        self.garden_renderer.update(dt)
        
        for i, s in enumerate(self.slimes):
            s.direction_timer -= dt
            
            if s.culture == "Tundra":
                if s.pause_timer > 0:
                    s.pause_timer -= dt
                    s.vx = 0
                else:
                    s.vx = s.speed * random.choice([-1, 1])
                    if s.direction_timer <= 0:
                        s.direction_timer = s.direction_interval
                        s.pause_timer = random.uniform(4.0, 8.0)
            
            elif s.culture == "Tide":
                s.target_id = -1
                min_dist = 9999
                for j, other in enumerate(self.slimes):
                    if i != j:
                        dist = abs(s.x - other.x)
                        if dist < min_dist:
                            min_dist = dist
                            s.target_id = j
                
                if s.target_id != -1:
                    target = self.slimes[s.target_id]
                    dist = target.x - s.x
                    if abs(dist) < 60:
                        # Circle gently
                        s.vx = math.sin(self.time_acc * 0.5) * s.speed
                    else:
                        s.vx = math.copysign(s.speed, dist)
            
            else:
                if s.direction_timer <= 0:
                    s.direction_timer = s.direction_interval
                    
                    if s.culture == "Ember":
                        s.vx = s.speed * random.choice([-1, 1])
                    elif s.culture == "Crystal":
                        s.vx = s.speed * random.choice([-1, 1, 0])
                    else:
                        s.vx = s.speed * random.choice([-1, 1])
            
            s.x += s.vx * dt
            
            # Bouncing
            if s.x - s.radius < 0:
                s.x = s.radius
                s.vx = abs(s.vx) if s.vx != 0 else s.speed
            elif s.x + s.radius > self.spec.screen_width:
                s.x = self.spec.screen_width - s.radius
                s.vx = -abs(s.vx) if s.vx != 0 else -s.speed

    def render(self, surface: pygame.Surface) -> None:
        surface.fill((20, 25, 30))
        
        ground_rect = pygame.Rect(0, self.ground_y, self.spec.screen_width, self.spec.screen_height - self.ground_y)
        pygame.draw.rect(surface, (35, 50, 35), ground_rect)
        
        self.garden_renderer.render_ship(surface)
        
        # Bob multipliers
        freqs = {
            "Ember": 4.0, "Gale": 2.0, "Marsh": 1.0, 
            "Crystal": 3.0, "Tundra": 0.5, "Tide": 2.5
        }
        amps = {
            "Ember": 3.0, "Gale": 6.0, "Marsh": 2.0, 
            "Crystal": 2.0, "Tundra": 1.0, "Tide": 4.0
        }
        
        for s in self.slimes:
            s.y = self.ground_y - s.radius
            bob = math.sin(self.time_acc * freqs[s.culture]) * amps[s.culture]
            render_y = s.y + bob
            
            # Temporary override of SlimeRenderer radius to enforce visuals
            render_slime_from_genome(surface, s.genome, int(s.x), int(render_y), s.radius)

        font_title = pygame.font.SysFont("Courier New", 42, bold=True)
        title_surf = font_title.render("rpgCore", True, (240, 240, 240))
        sub_font = pygame.font.SysFont("Courier New", 20)
        sub_surf = sub_font.render("Living World Engine", True, (180, 180, 180))
        
        right_x = self.spec.screen_width - 260
        surface.blit(title_surf, (right_x, 40))
        surface.blit(sub_surf, (right_x, 80))
        
        font = pygame.font.SysFont("Courier New", 18)
        
        culture_colors = [
            (200, 60, 40),   # Ember
            (150, 200, 180), # Gale
            (60, 140, 60),   # Marsh
            (180, 60, 200),  # Crystal
            (180, 220, 255), # Tundra
            (60, 100, 200)   # Tide
        ]
        
        for i, b in enumerate(self.buttons):
            r = b["rect"]
            col = (200, 200, 200)
            if i == self.hovered_btn_idx:
                hl_color = culture_colors[i % len(culture_colors)]
                pygame.draw.rect(surface, hl_color, r, 2, border_radius=4)
                col = (255, 255, 255)
            
            text_surf = font.render(f"[ {b['label']} ]", True, col)
            text_rect = text_surf.get_rect(midleft=(r.x + 10, r.centery))
            surface.blit(text_surf, text_rect)
