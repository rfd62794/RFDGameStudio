"""
Tests for UIComponent abstract base class
"""

import pytest
import pygame
from src.shared.ui.base_component import UIComponent
from src.shared.ui.theme import UITheme
from src.shared.ui.ui_event import UIEvent


class MockUIComponent(UIComponent):
    """Mock implementation for testing"""
    
    def __init__(self, rect, theme=None, z_order=0):
        super().__init__(rect, theme, z_order)
        self.render_called = False
        self.render_data = None
        self.update_called = False
        self.update_dt = None
        self.handle_event_called = False
        self.last_event = None
    
    def render(self, surface, data=None):
        self.render_called = True
        self.render_data = data
    
    def handle_event(self, event):
        self.handle_event_called = True
        self.last_event = event
        if event.type == pygame.MOUSEBUTTONDOWN:
            return UIEvent('click', 'mock_component', {'pos': event.pos})
        return None
    
    def update(self, dt):
        self.update_called = True
        self.update_dt = dt


class TestUIComponent:
    """Test UIComponent abstract base class compliance"""
    
    def test_component_initialization(self):
        """Test that component initializes with required parameters"""
        rect = pygame.Rect(10, 20, 100, 50)
        theme = UITheme()
        
        component = MockUIComponent(rect, theme)
        
        assert component.rect == rect
        assert component.theme == theme
        assert component.z_order == 0
    
    def test_component_initialization_without_theme(self):
        """Test that component can initialize without theme"""
        rect = pygame.Rect(10, 20, 100, 50)
        
        component = MockUIComponent(rect)
        
        assert component.rect == rect
        assert component.theme is None
        assert component.z_order == 0
    
    def test_component_bounds_property(self):
        """Test that bounds property returns rect"""
        rect = pygame.Rect(10, 20, 100, 50)
        component = MockUIComponent(rect)
        
        assert component.bounds == rect
    
    def test_render_interface(self):
        """Test that render method follows required signature"""
        rect = pygame.Rect(10, 20, 100, 50)
        component = MockUIComponent(rect)
        surface = pygame.Surface((200, 200))
        test_data = {'test': 'data'}
        
        component.render(surface, test_data)
        
        assert component.render_called
        assert component.render_data == test_data
    
    def test_handle_event_interface(self):
        """Test that handle_event method follows required signature"""
        rect = pygame.Rect(10, 20, 100, 50)
        component = MockUIComponent(rect)
        
        # Test event that returns UIEvent
        click_event = pygame.event.Event(pygame.MOUSEBUTTONDOWN, pos=(50, 25))
        result = component.handle_event(click_event)
        
        assert component.handle_event_called
        assert result is not None
        assert result.event_type == 'click'
        assert result.source_id == 'mock_component'
        assert result.payload == {'pos': (50, 25)}
        
        # Test event that returns None
        component.handle_event_called = False
        other_event = pygame.event.Event(pygame.MOUSEMOTION, pos=(60, 30))
        result = component.handle_event(other_event)
        
        assert component.handle_event_called
        assert result is None
    
    def test_update_interface(self):
        """Test that update method follows required signature"""
        rect = pygame.Rect(10, 20, 100, 50)
        component = MockUIComponent(rect)
        
        component.tick(0.016)  # 16ms
        
        assert component.update_called
        assert component.update_dt == 0.016
    
    def test_z_order_initialization(self):
        """Test that z_order can be set during initialization"""
        rect = pygame.Rect(10, 20, 100, 50)
        
        component = MockUIComponent(rect, z_order=5)
        
        assert component.z_order == 5
    
    def test_theme_parameter_optional(self):
        """Test that theme parameter is optional"""
        rect = pygame.Rect(10, 20, 100, 50)
        
        # Should not raise error
        component1 = MockUIComponent(rect)
        component2 = MockUIComponent(rect, None)
        component3 = MockUIComponent(rect, UITheme())
        
        assert component1.theme is None
        assert component2.theme is None
        assert component3.theme is not None
