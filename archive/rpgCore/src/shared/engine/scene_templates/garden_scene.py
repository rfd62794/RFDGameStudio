import pygame
from typing import List, Any, Optional, Tuple
from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.base import UIComponent
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import HubLayout

class GardenSceneBase(Scene):
    """
    Standard template for entity creation and ambient interaction.
    Follows HubLayout: Top Bar, Main (Garden), Side (Details), Bottom (Status).
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.layout = HubLayout(self.spec)
        
        # Backward compatibility aliases/convenience
        self.garden_rect = self.layout.main_area
        self.detail_rect = self.layout.side_panel
        self.bar_rect = self.layout.status_bar
        
        self.ui_components: List[UIComponent] = []
        self.selected_entities: List[Any] = []

    def on_enter(self, context) -> None:
        super().on_enter(context)
        self._base_setup_ui()
        self.on_garden_enter()

    def _base_setup_ui(self):
        # Details Panel
        self.detail_panel = Panel(self.detail_rect, self.spec, variant="surface")
        self.ui_components.append(self.detail_panel)
        
        # Status Bar / Action Bar area
        self.action_bar = Panel(self.bar_rect, self.spec, variant="surface")
        self.ui_components.append(self.action_bar)

    def on_garden_enter(self):
        """Hook for subclasses to add extra UI components."""
        pass

    def handle_event(self, event: pygame.event.Event) -> None:
        # 1. UI Interaction
        consumed = False
        for comp in reversed(self.ui_components):
            if hasattr(comp, "handle_event") and comp.handle_event(event):
                consumed = True
                break
        if consumed: return
        
        # 2. Entity Selection
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.garden_rect.collidepoint(event.pos):
                entity = self.pick_entity(event.pos)
                mods = pygame.key.get_mods()
                is_shift = mods & pygame.KMOD_SHIFT
                
                if entity:
                    if is_shift:
                        if entity in self.selected_entities:
                            self.selected_entities.remove(entity)
                        else:
                            self.selected_entities.append(entity)
                    else:
                        self.selected_entities = [entity]
                else:
                    if not is_shift:
                        self.selected_entities = []
                self.on_selection_changed()

    def pick_entity(self, pos: Tuple[int, int]) -> Optional[Any]:
        """Subclasses implement collision check."""
        return None

    def on_selection_changed(self):
        """Hook for subclasses when selection updates."""
        pass

    def tick(self, dt: float) -> None:
        for comp in self.ui_components:
            comp.update(int(dt * 1000))
        self.update_garden(dt)

    def update_garden(self, dt: float):
        """Subclasses implement entity updates."""
        pass

    def render(self, surface: pygame.Surface) -> None:
        surface.fill(self.spec.color_bg)
        self.render_garden(surface)
        for comp in self.ui_components:
            comp.render(surface)

    def render_garden(self, surface: pygame.Surface):
        """Subclasses implement entity rendering."""
        pass

    def on_exit(self) -> None:
        """Cleanup logic."""
        pass
