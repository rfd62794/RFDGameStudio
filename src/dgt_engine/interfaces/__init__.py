"""
COMPATIBILITY SHIM — interfaces → foundation.interfaces

This module re-exports from foundation.interfaces for backward compatibility.
All new code should import from foundation.interfaces directly.
"""

from foundation.interfaces import *  # noqa: F401,F403
from foundation.interfaces.protocols import *  # noqa: F401,F403
from foundation.interfaces.entity_protocol import *  # noqa: F401,F403
