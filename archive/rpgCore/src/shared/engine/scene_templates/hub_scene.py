import pygame
from typing import Dict, Any, List, Optional
from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.button import Button

class HubScene(Scene):
    """
    Standard template for Safe Zones and Multi-Exit Hubs.
    Features: Persistent state handling, flavor text area, and pre-wired exit buttons.
    """
    def on_enter(self, **kwargs) -> None:
        self.state = kwargs.get("persistent_state", {})
        self.flavor_text = kwargs.get("flavor_text", "A quiet place between worlds.")
        self.exits: Dict[str, str] = kwargs.get("exits", {}) # Name -> SceneID
        
        self.ui_components = []
        self._setup_hub_ui()

    def _setup_hub_ui(self):
        width, height = self.manager.width, self.manager.height
        
        # Bottom Flavor Panel
        panel_h = 100
        self.flavor_panel = Panel(pygame.Rect(0, height - panel_h, width, panel_h), bg_color=(20, 20, 40))
        self.ui_components.append(self.flavor_panel)
        
        self.flavor_label = Label(pygame.Rect(20, 20, width - 40, 60), text=self.flavor_text)
        self.flavor_panel.add_child(self.flavor_label)
        
        # Exit Buttons (Right Column)
        btn_w, btn_h = 200, 40
        for i, (name, scene_id) in enumerate(self.exits.items()):
            btn_rect = pygame.Rect(width - btn_w - 20, 20 + i * (btn_h + 10), btn_w, btn_h)
            btn = Button(btn_rect, text=name, on_click=lambda sid=scene_id: self.request_scene(sid))
            self.ui_components.append(btn)

    def on_exit(self) -> None:
        """Cleanup logic."""
        pass

    def handle_events(self, events: List[pygame.event.Event]) -> None:
        for event in events:
            if event.type == pygame.QUIT:
                self.request_quit()
            
            for comp in reversed(self.ui_components):
                if hasattr(comp, "handle_event") and comp.handle_event(event):
                    break

    def update(self, dt_ms: float) -> None:
        for comp in self.ui_components:
            comp.update(int(dt_ms))

    def render(self, surface: pygame.Surface) -> None:
        surface.fill((10, 10, 20))
        for comp in self.ui_components:
            comp.render(surface)
