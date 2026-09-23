import pygame
import math
from typing import List, Any, Dict, Optional
from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import ArenaLayout
from loguru import logger

class CombatSceneBase(Scene):
    """
    Standard template for turn-based 5v5 combat using ArenaLayout.
    """
    def __init__(self, manager, spec: UISpec, **kwargs):
        super().__init__(manager, spec, **kwargs)
        self.layout = ArenaLayout(spec)
        self.log_messages: List[str] = []
        self.party: List[Optional[Any]] = [None] * 5
        self.enemies: List[Optional[Any]] = [None] * 5
        self.active_actor_id: Optional[str] = None
        self.target_actor_id: Optional[str] = None
        
        # Flash feedback state
        self.flash_timer = 0.0
        self.flash_color: Optional[tuple] = None
        
        self.ui_components = []
        
        # Area Rects from Layout
        self.top_rect = self.layout.header
        self.bottom_rect = self.layout.team_bar
        self.arena_rect = self.layout.arena
        
        # Derived areas for combat units and log
        # Split arena into 3: Party (Left), Log (Center), Enemies (Right)
        margin = spec.margin_md
        side_w = int(self.arena_rect.width * 0.25)
        self.party_rect = pygame.Rect(self.arena_rect.x, self.arena_rect.y + margin, side_w, self.arena_rect.height - 2*margin)
        self.log_rect = pygame.Rect(self.arena_rect.x + side_w + margin, self.arena_rect.y + margin, self.arena_rect.width - 2*side_w - 2*margin, self.arena_rect.height - 2*margin)
        self.enemy_rect = pygame.Rect(self.arena_rect.right - side_w, self.arena_rect.y + margin, side_w, self.arena_rect.height - 2*margin)

    def on_enter(self) -> None:
        self._setup_combat_ui()
        self.on_combat_enter()

    def _setup_combat_ui(self):
        self.ui_components = []
        
        # 1. Background Panels
        Panel(self.top_rect, self.spec, variant="surface").add_to(self.ui_components)
        self.action_panel = Panel(self.bottom_rect, self.spec, variant="surface").add_to(self.ui_components)
        self.log_panel = Panel(self.log_rect, self.spec, variant="card").add_to(self.ui_components)
        
        # 2. Turn Info Labels
        self.turn_label_active = Label("Turn: ...", (20, self.top_rect.centery), self.spec, size="md", bold=True).add_to(self.ui_components)
        self.turn_label_next = Label("Next: ...", (self.top_rect.right - 200, self.top_rect.centery), self.spec, size="sm", centered=False).add_to(self.ui_components)
        
        self._setup_action_buttons()

    def _setup_action_buttons(self):
        """Subclasses implement specific action buttons."""
        pass

    def on_combat_enter(self):
        pass

    def add_log(self, message: str):
        self.log_messages.append(message)
        if len(self.log_messages) > 100:
            self.log_messages.pop(0)

    def trigger_flash(self, color: tuple, duration: float = 0.2):
        self.flash_color = color
        self.flash_timer = duration

    def handle_event(self, event: pygame.event.Event) -> None:
        for comp in reversed(self.ui_components):
            if hasattr(comp, "handle_event") and comp.handle_event(event):
                break

    def update(self, dt: float) -> None:
        dt_ms = int(dt * 1000)
        if self.flash_timer > 0:
            self.flash_timer -= dt
            if self.flash_timer <= 0:
                self.flash_color = None
                
        for comp in self.ui_components:
            comp.update(dt_ms)

    def render(self, surface: pygame.Surface) -> None:
        surface.fill(self.spec.color_bg)
        
        self._render_slots(surface)
        
        for comp in self.ui_components:
            comp.render(surface)
            
        self._render_log_content(surface)
        
        # Draw Flash
        if self.flash_color and self.flash_timer > 0:
            overlay = pygame.Surface((self.spec.screen_width, self.spec.screen_height), pygame.SRCALPHA)
            alpha = int(120 * (self.flash_timer / 0.2))
            overlay.fill((*self.flash_color, alpha))
            surface.blit(overlay, (0, 0))

    def _render_slots(self, surface: pygame.Surface):
        # 5 slots vertically
        slot_h = (self.party_rect.height // 5) - self.spec.margin_sm
        
        # Party (Left)
        for i in range(5):
            y = self.party_rect.y + i * (slot_h + self.spec.margin_sm)
            unit = self.party[i] if i < len(self.party) else None
            self._draw_unit_slot(surface, self.party_rect.x, y, self.party_rect.width, slot_h, unit, side="party")
            
        # Enemies (Right)
        for i in range(5):
            y = self.enemy_rect.y + i * (slot_h + self.spec.margin_sm)
            unit = self.enemies[i] if i < len(self.enemies) else None
            self._draw_unit_slot(surface, self.enemy_rect.x, y, self.enemy_rect.width, slot_h, unit, side="enemy")

    def _draw_unit_slot(self, surface: pygame.Surface, x: int, y: int, w: int, h: int, entity: Optional[Any], side: str):
        rect = pygame.Rect(x, y, w, h)
        
        if not entity:
            Panel(rect, self.spec, variant="surface", border=True).render(surface)
            return

        variant = "card" if getattr(entity, "id", None) == self.active_actor_id else "surface"
        Panel(rect, self.spec, variant=variant, border=True).render(surface)
        
        # Active highlight
        if getattr(entity, "id", None) == self.active_actor_id:
            pygame.draw.rect(surface, self.spec.color_accent, rect, width=2, border_radius=4)
        elif getattr(entity, "id", None) == self.target_actor_id:
            pygame.draw.rect(surface, self.spec.color_danger, rect, width=2, border_radius=4)
        
        # Name and HP
        name = getattr(entity, "name", "Unit")
        stats = getattr(entity, "stats", {})
        hp = stats.get("hp", 0)
        max_hp = stats.get("max_hp", 1)
        
        # Name text using standard fonts (manual render for performance inside slot)
        Label(name, (x + 8, y + 4), self.spec, size="sm", bold=True).render(surface)
        
        # HP Bar
        bar_w = w - 16
        bar_h = 6
        bar_rect = pygame.Rect(x + 8, y + h - 12, bar_w, bar_h)
        pygame.draw.rect(surface, (60, 20, 20), bar_rect)
        if max_hp > 0:
            fill_w = int(bar_w * (max(0, hp) / max_hp))
            pygame.draw.rect(surface, (40, 180, 40), (x+8, y + h - 12, fill_w, bar_h))

    def _render_log_content(self, surface: pygame.Surface):
        rect = self.log_rect
        visible_msgs = self.log_messages[-8:]
        
        for i, msg in enumerate(visible_msgs):
            alpha = int(120 + (i * 135 // 7))
            color = (alpha, alpha, alpha)
            Label(f"> {msg}", (rect.x + 10, rect.y + 10 + i * 20), self.spec, size="xs", color=color).render(surface)

    def on_exit(self) -> None:
        pass
