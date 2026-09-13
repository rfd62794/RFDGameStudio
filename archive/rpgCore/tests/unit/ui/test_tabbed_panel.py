"""
Tests for TabbedPanel component
"""

import pytest
import pygame
from src.shared.ui.tabbed_panel import TabbedPanel, TabDef
from src.shared.ui.theme import DEFAULT_THEME


class TestTabbedPanel:
    
    @classmethod
    def setup_class(cls):
        """Initialize pygame for font rendering"""
        pygame.init()
        pygame.font.init()
    
    @classmethod
    def teardown_class(cls):
        """Clean up pygame"""
        pygame.quit()
    
    def test_tabbed_panel_initialization(self):
        """Test TabbedPanel initialization with tabs"""
        rect = pygame.Rect(0, 0, 400, 300)
        tabs = [
            TabDef("dungeon", "DUNGEON", (180, 60, 60)),
            TabDef("racing", "RACING", (60, 140, 220))
        ]
        
        panel = TabbedPanel(rect, tabs, DEFAULT_THEME)
        
        assert panel.tabs == tabs
        assert panel.active_tab_id == "dungeon"
        assert panel.tab_height == 32
        assert len(panel.tab_rects) == 2
    
    def test_tab_rects_calculation(self):
        """Test tab rectangles are calculated correctly"""
        rect = pygame.Rect(0, 0, 400, 300)
        tabs = [
            TabDef("dungeon", "DUNGEON"),
            TabDef("racing", "RACING"),
            TabDef("conquest", "CONQUEST")
        ]
        
        panel = TabbedPanel(rect, tabs, DEFAULT_THEME)
        
        # Each tab should be 1/3 of width
        expected_width = 400 // 3
        assert panel.tab_rects[0].width == expected_width
        assert panel.tab_rects[1].width == expected_width
        assert panel.tab_rects[2].width == expected_width
        
        # Tabs should be positioned correctly
        assert panel.tab_rects[0].x == 0
        assert panel.tab_rects[1].x == expected_width
        assert panel.tab_rects[2].x == expected_width * 2
    
    def test_tab_switching(self):
        """Test tab switching on click"""
        rect = pygame.Rect(0, 0, 400, 300)
        tabs = [
            TabDef("dungeon", "DUNGEON"),
            TabDef("racing", "RACING")
        ]
        
        panel = TabbedPanel(rect, tabs, DEFAULT_THEME)
        
        # Initially first tab is active
        assert panel.active_tab_id == "dungeon"
        
        # Click on second tab
        click_event = pygame.event.Event(
            pygame.MOUSEBUTTONDOWN,
            {'button': 1, 'pos': (250, 16)}  # Middle of second tab
        )
        
        result = panel.handle_event(click_event)
        
        assert result is not None
        assert result.event_type == 'tab_change'
        assert result.payload['old_tab'] == 'dungeon'
        assert result.payload['new_tab'] == 'racing'
        assert result.payload['tab_index'] == 1
        assert panel.active_tab_id == 'racing'
    
    def test_badge_count_setting(self):
        """Test setting badge counts for tabs"""
        rect = pygame.Rect(0, 0, 400, 300)
        tabs = [
            TabDef("dungeon", "DUNGEON"),
            TabDef("racing", "RACING")
        ]
        
        panel = TabbedPanel(rect, tabs, DEFAULT_THEME)
        
        # Set badge counts
        panel.set_badge("dungeon", 3)
        panel.set_badge("racing", 1)
        
        assert tabs[0].badge_count == 3
        assert tabs[1].badge_count == 1
    
    def test_content_callback(self):
        """Test setting content callbacks"""
        rect = pygame.Rect(0, 0, 400, 300)
        tabs = [TabDef("dungeon", "DUNGEON")]
        
        panel = TabbedPanel(rect, tabs, DEFAULT_THEME)
        
        # Set content callback
        callback_called = False
        
        def test_callback(surface):
            nonlocal callback_called
            callback_called = True
        
        panel.set_content_callback("dungeon", test_callback)
        
        # Render should call callback
        test_surface = pygame.Surface((400, 300))
        panel.render(test_surface)
        
        assert callback_called
    
    def test_render_without_callback(self):
        """Test rendering when no callback is set"""
        rect = pygame.Rect(0, 0, 400, 300)
        tabs = [TabDef("dungeon", "DUNGEON")]
        
        panel = TabbedPanel(rect, tabs, DEFAULT_THEME)
        
        # Should not crash when rendering without callback
        test_surface = pygame.Surface((400, 300))
        panel.render(test_surface)  # Should not raise exception
    
    def test_tab_colors(self):
        """Test tab color stripes"""
        rect = pygame.Rect(0, 0, 400, 300)
        tabs = [
            TabDef("dungeon", "DUNGEON", (255, 0, 0)),  # Red stripe
            TabDef("racing", "RACING", None)  # No stripe
        ]
        
        panel = TabbedPanel(rect, tabs, DEFAULT_THEME)
        
        # Should render without crashing
        test_surface = pygame.Surface((400, 300))
        panel.render(test_surface)  # Should not raise exception
    
    def test_empty_tabs_list(self):
        """Test TabbedPanel with empty tabs list"""
        rect = pygame.Rect(0, 0, 400, 300)
        
        panel = TabbedPanel(rect, [], DEFAULT_THEME)
        
        assert panel.tabs == []
        assert panel.active_tab_id is None
        assert len(panel.tab_rects) == 0
        
        # Should not crash when rendering
        test_surface = pygame.Surface((400, 300))
        panel.render(test_surface)  # Should not raise exception
