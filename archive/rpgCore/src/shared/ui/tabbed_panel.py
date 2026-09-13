"""
TabbedPanel - Reusable tabbed interface component
"""

import pygame
from typing import List, Optional, Callable, Any
from dataclasses import dataclass
from src.shared.ui.base import UIComponent
from src.shared.ui.theme import UITheme, DEFAULT_THEME
from src.shared.ui.ui_event import UIEvent
from src.shared.ui.spec import UISpec


@dataclass
class TabDef:
    """Definition for a single tab"""
    id: str
    label: str
    color: Optional[tuple] = None
    badge_count: int = 0


class TabbedPanel(UIComponent):
    """Tabbed panel interface with configurable tabs"""
    
    def __init__(self, rect: pygame.Rect, tabs: List[TabDef], theme: Optional[UITheme] = None):
        self.theme = theme or DEFAULT_THEME
        self.tabs = tabs
        self._active_tab_id = tabs[0].id if tabs else None
        self.tab_height = 32
        self.content_callbacks = {}  # tab_id -> callback function
        
        # Calculate tab bar and content areas
        self.tab_bar_rect = pygame.Rect(rect.x, rect.y, rect.width, self.tab_height)
        self.content_rect = pygame.Rect(rect.x, rect.y + self.tab_height, rect.width, rect.height - self.tab_height)
        
        # Tab button rectangles (calculated equally)
        self.tab_rects = self._calculate_tab_rects(rect)
        
        super().__init__(rect, self.theme)
    
    def _calculate_tab_rects(self, rect: pygame.Rect) -> List[pygame.Rect]:
        """Calculate equal-width tab rectangles"""
        if not self.tabs:
            return []
        
        tab_width = rect.width // len(self.tabs)
        tab_rects = []
        
        for i, tab in enumerate(self.tabs):
            tab_rect = pygame.Rect(
                rect.x + i * tab_width,
                rect.y,
                tab_width,
                self.tab_height
            )
            tab_rects.append(tab_rect)
        
        return tab_rects
    
    def set_content_callback(self, tab_id: str, callback: Callable[[pygame.Surface], Any]):
        """Set content rendering callback for a tab"""
        self.content_callbacks[tab_id] = callback
    
    def set_badge(self, tab_id: str, count: int):
        """Set badge count for a tab"""
        for tab in self.tabs:
            if tab.id == tab_id:
                tab.badge_count = count
                break
    
    @property
    def active_tab_id(self) -> str:
        """Get the currently active tab ID"""
        return self._active_tab_id
    
    def handle_event(self, event: pygame.event.Event) -> Optional[UIEvent]:
        """Handle tab switching events"""
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            mouse_pos = event.pos
            
            # Check if click is on any tab
            for i, tab in enumerate(self.tabs):
                if self.tab_rects[i].collidepoint(mouse_pos):
                    if tab.id != self._active_tab_id:
                        old_tab = self._active_tab_id
                        self._active_tab_id = tab.id
                        
                        # Emit tab change event
                        return UIEvent(
                            event_type='tab_change',
                            source_id='tabbed_panel',
                            payload={
                                'old_tab': old_tab,
                                'new_tab': tab.id,
                                'tab_index': i
                            }
                        )
                    break
        
        return None
    
    def render(self, surface: pygame.Surface, data: Any = None) -> None:
        """Render the tabbed panel"""
        # Render tab bar
        for i, tab in enumerate(self.tabs):
            tab_rect = self.tab_rects[i]
            is_active = tab.id == self._active_tab_id
            
            # Tab background
            if is_active:
                bg_color = self.theme.surface_raised
                text_alpha = 255
            else:
                bg_color = self.theme.surface
                text_alpha = 180
            
            pygame.draw.rect(surface, bg_color, tab_rect)
            
            # Tab color stripe (if specified)
            if tab.color:
                stripe_rect = pygame.Rect(tab_rect.x, tab_rect.y, 4, tab_rect.height)
                pygame.draw.rect(surface, tab.color, stripe_rect)
            
            # Tab text
            font = pygame.font.Font(None, 14)
            text = tab.label
            if tab.badge_count > 0:
                text += f" ({tab.badge_count})"
            
            text_surface = font.render(text, True, self.theme.text_primary)
            text_surface.set_alpha(text_alpha)
            
            # Center text in tab
            text_rect = text_surface.get_rect()
            text_rect.center = tab_rect.center
            surface.blit(text_surface, text_rect)
        
        # Render content area
        if self._active_tab_id in self.content_callbacks:
            callback = self.content_callbacks[self._active_tab_id]
            if callback:
                # Create content surface
                content_surface = pygame.Surface((self.content_rect.width, self.content_rect.height), pygame.SRCALPHA)
                callback(content_surface)
                surface.blit(content_surface, self.content_rect.topleft)
        else:
            # Default empty content
            pygame.draw.rect(surface, self.theme.surface, self.content_rect)
            
            # Show empty message
            font = pygame.font.Font(None, 16)
            text = f"No content for tab '{self._active_tab_id}'"
            text_surface = font.render(text, True, self.theme.text_dim)
            text_rect = text_surface.get_rect()
            text_rect.center = self.content_rect.center
            surface.blit(text_surface, text_rect)
