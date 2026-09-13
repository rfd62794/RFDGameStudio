"""
Tests for UIEvent system
"""

import pytest
import pygame
from src.shared.ui.ui_event import UIEvent


class TestUIEvent:
    """Test UIEvent dataclass"""
    
    def test_ui_event_creation(self):
        """Test that UIEvent can be created with required parameters"""
        event = UIEvent('click', 'button_1', {'x': 10, 'y': 20})
        
        assert event.event_type == 'click'
        assert event.source_id == 'button_1'
        assert event.payload == {'x': 10, 'y': 20}
    
    def test_ui_event_with_none_payload(self):
        """Test that UIEvent can have None payload"""
        event = UIEvent('hover', 'panel_1', None)
        
        assert event.event_type == 'hover'
        assert event.source_id == 'panel_1'
        assert event.payload is None
    
    def test_ui_event_with_complex_payload(self):
        """Test that UIEvent can handle complex payload data"""
        complex_payload = {
            'mouse_pos': (100, 150),
            'button': 1,
            'modifiers': {'shift': True, 'ctrl': False},
            'timestamp': 1234567890
        }
        
        event = UIEvent('click', 'interactive_widget', complex_payload)
        
        assert event.event_type == 'click'
        assert event.source_id == 'interactive_widget'
        assert event.payload == complex_payload
        assert event.payload['mouse_pos'] == (100, 150)
        assert event.payload['button'] == 1
        assert event.payload['modifiers']['shift'] is True
    
    def test_ui_event_types(self):
        """Test different event types"""
        events = [
            UIEvent('click', 'btn', {}),
            UIEvent('hover', 'btn', {}),
            UIEvent('select', 'list', {}),
            UIEvent('focus', 'input', {}),
            UIEvent('blur', 'input', {}),
            UIEvent('change', 'slider', {'value': 0.5}),
            UIEvent('submit', 'form', {'data': 'test'}),
        ]
        
        for i, event in enumerate(events):
            assert event.event_type in ['click', 'hover', 'select', 'focus', 'blur', 'change', 'submit']
            assert event.source_id is not None
            assert event.payload is not None
    
    def test_ui_event_immutability(self):
        """Test that UIEvent fields are accessible but not enforced immutable"""
        # UIEvent is a dataclass, so fields are mutable by default
        event = UIEvent('click', 'btn', {'count': 1})
        
        # Fields should be accessible
        assert event.event_type == 'click'
        assert event.source_id == 'btn'
        assert event.payload['count'] == 1
        
        # Fields can be modified (dataclass behavior)
        event.payload['count'] = 2
        assert event.payload['count'] == 2
    
    def test_ui_event_string_representation(self):
        """Test that UIEvent has reasonable string representation"""
        event = UIEvent('click', 'button_1', {'x': 10, 'y': 20})
        
        str_repr = str(event)
        assert 'click' in str_repr
        assert 'button_1' in str_repr
        assert 'x' in str_repr
        assert 'y' in str_repr
