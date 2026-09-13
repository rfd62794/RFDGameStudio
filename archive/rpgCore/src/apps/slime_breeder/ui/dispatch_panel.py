"""
DispatchPanel - UI for managing slime dispatches and resource flow
"""

import pygame
from typing import List, Optional, Dict, Any
from src.shared.ui.base import UIComponent
from src.shared.ui.theme import UITheme, DEFAULT_THEME
from src.shared.ui.ui_event import UIEvent
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.spec import UISpec
from src.shared.dispatch.zone_types import ZoneType, get_zone_config
from src.shared.teams.roster import RosterSlime, TeamRole


class DispatchPanel(UIComponent):
    """Panel for managing slime dispatches and viewing resources"""
    
    def __init__(self, rect: pygame.Rect, spec: UISpec, theme: Optional[UITheme] = None):
        self.theme = theme or DEFAULT_THEME
        self.spec = spec
        
        super().__init__(rect, self.theme)
        
        # State
        self.selected_slimes: List[RosterSlime] = []
        self.selected_zone: Optional[ZoneType] = None
        
        # UI Components
        self.components: List[UIComponent] = []
        self._setup_ui()
    
    def _setup_ui(self):
        """Setup the dispatch panel UI"""
        x, y = 0, 0
        width, height = self.rect.width, self.rect.height
        
        # Background panel
        self.bg_panel = Panel(self.rect, self.spec, variant="surface", theme=self.theme)
        self.components.append(self.bg_panel)
        
        # Title
        self.title_label = Label("DISPATCH CENTER", (x + 10, y + 10), self.spec, 
                                size="lg", bold=True, theme=self.theme)
        self.components.append(self.title_label)
        
        # Resources display
        self.resources_label = Label("Resources:", (x + 10, y + 40), self.spec, 
                                     size="md", theme=self.theme)
        self.components.append(self.resources_label)
        
        # Zone selection
        self.zone_label = Label("Select Zone:", (x + 10, y + 70), self.spec, 
                                 size="md", theme=self.theme)
        self.components.append(self.zone_label)
        
        # Dispatch button
        self.dispatch_btn = Button("DISPATCH", pygame.Rect(x + 10, y + height - 40, 100, 30),
                                   self._on_dispatch_clicked, self.spec, variant="primary", theme=self.theme)
        self.components.append(self.dispatch_btn)
    
    def update_data(self, resources: Dict[str, int], available_slimes: List[RosterSlime]):
        """Update panel with current data"""
        self.resources = resources
        self.available_slimes = available_slimes
        
        # Update resources display
        resource_text = f"Gold: {resources.get('gold', 0)} | Food: {resources.get('food', 0)} | Scrap: {resources.get('scrap', 0)}"
        # Update the resources label text (would need to modify Label class to support text updates)
        # For now, we'll recreate it
        self._update_resources_display(resource_text)
    
    def _update_resources_display(self, resource_text: str):
        """Update the resources display"""
        # Remove old resources label
        if self.resources_label in self.components:
            self.components.remove(self.resources_label)
        
        # Create new one
        x, y = 0, 0
        self.resources_label = Label(resource_text, (x + 10, y + 40), self.spec, 
                                     size="md", theme=self.theme)
        self.components.append(self.resources_label)
    
    def _on_dispatch_clicked(self):
        """Handle dispatch button click"""
        if not self.selected_slimes or not self.selected_zone:
            return
        
        # Create dispatch
        try:
            from src.shared.dispatch.dispatch_system import DispatchSystem
            dispatch_system = DispatchSystem()  # In real implementation, this would be shared
            
            dispatch = dispatch_system.create_dispatch(
                self.selected_slimes, 
                self.selected_zone, 
                0  # current tick
            )
            
            # Add to active dispatches
            dispatch_system.active_dispatches.append(dispatch)
            
            # Clear selection
            self.selected_slimes = []
            self.selected_zone = None
            
            # Emit event
            event = UIEvent("dispatch_created", "dispatch_panel", {
                "dispatch": dispatch,
                "slime_count": len(self.selected_slimes),
                "zone": self.selected_zone.value
            })
            
        except Exception as e:
            # Handle dispatch creation errors
            print(f"Dispatch failed: {e}")
    
    def handle_event(self, event: pygame.event.Event) -> Optional[UIEvent]:
        """Handle UI events"""
        # Pass to components first
        for comp in reversed(self.components):
            if hasattr(comp, 'handle_event'):
                result = comp.handle_event(event)
                if result:
                    return result
        
        return None
    
    def render(self, surface: pygame.Surface, data: Any = None) -> None:
        """Render the dispatch panel"""
        # Render all components
        for comp in self.components:
            comp.render(surface)
        
        # Render selection info
        if self.selected_slimes:
            slime_text = f"Selected: {len(self.selected_slimes)} slimes"
            font = pygame.font.Font(None, 16)
            text_surface = font.render(slime_text, True, self.theme.text_primary)
            surface.blit(text_surface, (10, 100))
        
        if self.selected_zone:
            zone_config = get_zone_config(self.selected_zone)
            zone_text = f"Zone: {self.selected_zone.value} (Duration: {zone_config.duration} ticks)"
            font = pygame.font.Font(None, 16)
            text_surface = font.render(zone_text, True, self.theme.text_secondary)
            surface.blit(text_surface, (10, 120))
