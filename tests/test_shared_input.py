"""
Shared Input Controller Tests
"""
import pytest
import pygame
from src.shared.input.controller_base import InputController

class MockController(InputController):
    def define_actions(self):
        # Add a custom action
        self.action_map[pygame.K_t] = "test_action"

def test_controller_base_action_mapping():
    """Verify that keys map to correct actions."""
    ctrl = MockController()
    
    # Test WASD
    event_w = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_w)
    actions = ctrl.handle_event(event_w)
    assert "up" in actions
    assert ctrl.is_action_active("up")
    
    # Test custom action
    event_t = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_t)
    actions = ctrl.handle_event(event_t)
    assert "test_action" in actions
    assert ctrl.is_action_active("test_action")

def test_controller_numpad_support():
    """Verify NumPad keys are mapped correctly."""
    ctrl = MockController()
    
    # KP8 -> up
    event_kp8 = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_KP8)
    ctrl.handle_event(event_kp8)
    assert ctrl.is_action_active("up")
    
    # KP5 -> fire
    event_kp5 = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_KP5)
    ctrl.handle_event(event_kp5)
    assert ctrl.is_action_active("fire")
    
    # KP0 -> fire
    event_kp0 = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_KP0)
    ctrl.handle_event(event_kp0)
    assert ctrl.is_action_active("fire")

def test_key_up_removes_action():
    """Verify releasing a key stops the action."""
    ctrl = MockController()
    event_down = pygame.event.Event(pygame.KEYDOWN, key=pygame.K_w)
    ctrl.handle_event(event_down)
    assert ctrl.is_action_active("up")
    
    event_up = pygame.event.Event(pygame.KEYUP, key=pygame.K_w)
    ctrl.handle_event(event_up)
    assert not ctrl.is_action_active("up")
