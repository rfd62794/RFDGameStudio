"""
UIEvent - Standard event system for UI components

Defines the standard event format that UI components can emit.
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class UIEvent:
    """Standard event format for UI component interactions."""
    event_type: str   # 'click', 'hover', 'select', 'deselect', 'change', 'submit'
    source_id: str    # which component fired it
    payload: Any = None  # component-specific data
