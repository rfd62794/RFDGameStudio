"""
Menu System - Main Menu and Pause Menu Overlay
ADR 209: Unified Engine Menu System

Provides menu overlays for game state management with phosphor green aesthetics.
"""

import pygame
import tkinter as tk
from tkinter import ttk
from typing import Dict, List, Any, Optional, Callable
from enum import Enum
from loguru import logger


class MenuState(Enum):
    """Menu states"""
    MAIN_MENU = "main_menu"
    PAUSED = "paused"
    SETTINGS = "settings"
    GAME = "game"


class MenuItem:
    """Menu item with action"""
    def __init__(self, text: str, action: Callable[[], None], enabled: bool = True):
        self.text = text
        self.action = action
        self.enabled = enabled
        self.selected = False


class MenuOverlay:
    """Menu overlay system using PPU palette"""
    
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        
        # Phosphor green palette
        self.colors = {
            'background': (0, 0, 0),
            'phosphor_green': (0, 255, 0),
            'phosphor_amber': (255, 191, 0),
            'white': (255, 255, 255),
            'grey': (170, 170, 170),
            'dark_green': (0, 128, 0),
            'bright_green': (0, 255, 128)
        }
        
        # Menu state
        self.state = MenuState.MAIN_MENU
        self.visible = False
        self.selected_index = 0
        
        # Main menu items
        self.main_menu_items = [
            MenuItem("START GAME", self._start_game),
            MenuItem("AI TOURNAMENT", self._ai_tournament),
            MenuItem("SETTINGS", self._show_settings),
            MenuItem("EXIT", self._exit_game)
        ]
        
        # Pause menu items
        self.pause_menu_items = [
            MenuItem("RESUME", self._resume_game),
            MenuItem("RESET LOOP", self._reset_loop),
            MenuItem("MAIN MENU", self._show_main_menu)
        ]
        
        # Settings menu items
        self.settings_menu_items = [
            MenuItem("BACK", self._show_main_menu)
        ]
        
        # Current menu items
        self.current_items = self.main_menu_items
        
        # Font for text rendering
        self.font_large = None
        self.font_small = None
        
        logger.info("📟 MenuOverlay initialized with phosphor palette")
    
    def initialize_fonts(self) -> None:
        """Initialize fonts for menu rendering"""
        try:
            self.font_large = pygame.font.Font(None, 48)
            self.font_small = pygame.font.Font(None, 32)
            logger.info("📝 Menu fonts initialized")
        except Exception as e:
            logger.error(f"Failed to initialize fonts: {e}")
    
    def show_menu(self, menu_state: MenuState = MenuState.MAIN_MENU) -> None:
        """Show menu overlay"""
        self.state = menu_state
        self.visible = True
        self.selected_index = 0
        
        # Set current menu items
        if menu_state == MenuState.MAIN_MENU:
            self.current_items = self.main_menu_items
        elif menu_state == MenuState.PAUSED:
            self.current_items = self.pause_menu_items
        elif menu_state == MenuState.SETTINGS:
            self.current_items = self.settings_menu_items
        
        # Update selection
        self._update_selection()
        
        logger.info(f"📟 Menu shown: {menu_state.value}")
    
    def hide_menu(self) -> None:
        """Hide menu overlay"""
        self.visible = False
        logger.info("📟 Menu hidden")
    
    def handle_input(self, event_type: str, key: int) -> bool:
        """Handle menu input"""
        if not self.visible:
            return False
        
        if event_type == "KEYDOWN":
            if key == pygame.K_UP:
                self._move_selection(-1)
                return True
            elif key == pygame.K_DOWN:
                self._move_selection(1)
                return True
            elif key == pygame.K_RETURN or key == pygame.K_SPACE:
                self._activate_selected()
                return True
            elif key == pygame.K_ESCAPE:
                if self.state == MenuState.MAIN_MENU:
                    self._exit_game()
                else:
                    self._resume_game()
                return True
        
        return False
    
    def _move_selection(self, direction: int) -> None:
        """Move menu selection"""
        self.selected_index = (self.selected_index + direction) % len(self.current_items)
        self._update_selection()
    
    def _update_selection(self) -> None:
        """Update selection state"""
        for i, item in enumerate(self.current_items):
            item.selected = (i == self.selected_index)
    
    def _activate_selected(self) -> None:
        """Activate selected menu item"""
        if self.selected_index < len(self.current_items):
            item = self.current_items[self.selected_index]
            if item.enabled and item.action:
                item.action()
    
    def render(self, surface: pygame.Surface) -> None:
        """Render menu overlay"""
        if not self.visible:
            return
        
        # Create semi-transparent overlay
        overlay = pygame.Surface((self.width, self.height))
        overlay.set_alpha(200)
        overlay.fill(self.colors['background'])
        surface.blit(overlay, (0, 0))
        
        # Render menu title
        title = "MAIN MENU"
        if self.state == MenuState.PAUSED:
            title = "PAUSED"
        elif self.state == MenuState.SETTINGS:
            title = "SETTINGS"
        
        self._render_text_centered(surface, title, self.height // 4, self.font_large, 
                                 self.colors['phosphor_green'])
        
        # Render menu items
        start_y = self.height // 2
        for i, item in enumerate(self.current_items):
            color = self.colors['bright_green'] if item.selected else self.colors['phosphor_green']
            if not item.enabled:
                color = self.colors['grey']
            
            y = start_y + (i * 50)
            self._render_text_centered(surface, item.text, y, self.font_small, color)
            
            # Draw selection indicator
            if item.selected:
                self._draw_selection_indicator(surface, y)
    
    def _render_text_centered(self, surface: pygame.Surface, text: str, y: int, 
                             font, color: Tuple[int, int, int]) -> None:
        """Render centered text"""
        if not font:
            return
        
        text_surface = font.render(text, True, color)
        text_rect = text_surface.get_rect(center=(self.width // 2, y))
        surface.blit(text_surface, text_rect)
    
    def _draw_selection_indicator(self, surface: pygame.Surface, y: int) -> None:
        """Draw selection indicator"""
        indicator_x = self.width // 2 - 200
        indicator_y = y - 15
        
        # Draw arrow indicators
        arrow_color = self.colors['phosphor_amber']
        pygame.draw.polygon(surface, arrow_color, [
            (indicator_x, indicator_y),
            (indicator_x - 15, indicator_y + 10),
            (indicator_x - 15, indicator_y - 10)
        ])
        
        pygame.draw.polygon(surface, arrow_color, [
            (self.width - indicator_x, indicator_y),
            (self.width - indicator_x + 15, indicator_y + 10),
            (self.width - indicator_x + 15, indicator_y - 10)
        ])
    
    # Menu action methods
    def _start_game(self) -> None:
        """Start new game"""
        self.hide_menu()
        logger.info("🎮 Starting new game")
    
    def _ai_tournament(self) -> None:
        """Start AI tournament"""
        self.hide_menu()
        logger.info("🤖 Starting AI tournament")
    
    def _show_settings(self) -> None:
        """Show settings menu"""
        self.show_menu(MenuState.SETTINGS)
    
    def _resume_game(self) -> None:
        """Resume game"""
        self.hide_menu()
        logger.info("▶️ Game resumed")
    
    def _reset_loop(self) -> None:
        """Reset game loop"""
        logger.info("🔄 Resetting game loop")
        # This would trigger a game reset
    
    def _show_main_menu(self) -> None:
        """Show main menu"""
        self.show_menu(MenuState.MAIN_MENU)
    
    def _exit_game(self) -> None:
        """Exit game"""
        logger.info("👋 Exiting game")
        # This would trigger game exit
    
    def get_menu_state(self) -> MenuState:
        """Get current menu state"""
        return self.state
    
    def is_visible(self) -> bool:
        """Check if menu is visible"""
        return self.visible


class MenuSystem:
    """Complete menu system integration"""
    
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.overlay = MenuOverlay(width, height)
        
        # Callbacks for menu actions
        self.on_start_game = None
        self.on_ai_tournament = None
        self.on_resume_game = None
        self.on_reset_loop = None
        self.on_exit_game = None
        
        # Set up menu callbacks
        self._setup_callbacks()
        
        logger.info("📟 MenuSystem initialized")
    
    def _setup_callbacks(self) -> None:
        """Set up menu action callbacks"""
        self.overlay._start_game = self._handle_start_game
        self.overlay._ai_tournament = self._handle_ai_tournament
        self.overlay._resume_game = self._handle_resume_game
        self.overlay._reset_loop = self._handle_reset_loop
        self.overlay._show_main_menu = self._handle_show_main_menu
        self.overlay._exit_game = self._handle_exit_game
    
    def initialize(self) -> None:
        """Initialize menu system"""
        self.overlay.initialize_fonts()
        logger.info("📟 MenuSystem initialized")
    
    def handle_input(self, event_type: str, key: int) -> bool:
        """Handle menu input"""
        return self.overlay.handle_input(event_type, key)
    
    def render(self, surface: pygame.Surface) -> None:
        """Render menu system"""
        self.overlay.render(surface)
    
    def show_main_menu(self) -> None:
        """Show main menu"""
        self.overlay.show_menu(MenuState.MAIN_MENU)
    
    def show_pause_menu(self) -> None:
        """Show pause menu"""
        self.overlay.show_menu(MenuState.PAUSED)
    
    def hide_menu(self) -> None:
        """Hide menu"""
        self.overlay.hide_menu()
    
    def toggle_pause(self) -> None:
        """Toggle pause menu"""
        if self.overlay.visible:
            self.hide_menu()
        else:
            self.show_pause_menu()
    
    def is_menu_active(self) -> bool:
        """Check if menu is active"""
        return self.overlay.visible
    
    # Menu action handlers
    def _handle_start_game(self) -> None:
        """Handle start game action"""
        if self.on_start_game:
            self.on_start_game()
    
    def _handle_ai_tournament(self) -> None:
        """Handle AI tournament action"""
        if self.on_ai_tournament:
            self.on_ai_tournament()
    
    def _handle_resume_game(self) -> None:
        """Handle resume game action"""
        if self.on_resume_game:
            self.on_resume_game()
    
    def _handle_reset_loop(self) -> None:
        """Handle reset loop action"""
        if self.on_reset_loop:
            self.on_reset_loop()
    
    def _handle_show_main_menu(self) -> None:
        """Handle show main menu action"""
        self.show_main_menu()
    
    def _handle_exit_game(self) -> None:
        """Handle exit game action"""
        if self.on_exit_game:
            self.on_exit_game()


def create_menu_system(width: int, height: int) -> MenuSystem:
    """Create a menu system"""
    return MenuSystem(width, height)


# Test function
def test_menu_system():
    """Test the menu system"""
    import pygame
    
    pygame.init()
    
    # Create test surface
    surface = pygame.Surface((800, 600))
    
    # Create menu system
    menu = create_menu_system(800, 600)
    menu.initialize()
    
    # Show main menu
    menu.show_main_menu()
    
    print("📟 Testing Menu System")
    print("=" * 30)
    print("Use UP/DOWN arrows to navigate")
    print("Use ENTER/SPACE to select")
    print("Use ESC to go back/exit")
    print()
    
    # Test rendering
    menu.render(surface)
    print("Menu rendered successfully")
    
    # Test input handling
    test_keys = [pygame.K_UP, pygame.K_DOWN, pygame.K_RETURN]
    for key in test_keys:
        handled = menu.handle_input("KEYDOWN", key)
        print(f"Key {key} handled: {handled}")
    
    print("\nMenu system test complete!")


if __name__ == "__main__":
    test_menu_system()
