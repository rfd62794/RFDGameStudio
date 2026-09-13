"""
Multi-Pass Rendering System - Base Classes

ADR 032: Multi-Pass Component Rendering
Provides the foundation for different rendering methods in specific UI zones.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from game_state import GameState
from world_ledger import WorldLedger


class RenderPassType(Enum):
    """Types of rendering passes for different UI zones."""
    PIXEL_VIEWPORT = "pixel_viewport"      # Zone A: Half-block pixel art
    BRAILLE_RADAR = "braille_radar"        # Zone B: Sub-pixel dot mapping
    ANSI_VITALS = "ansi_vitals"            # Zone C: Progress bars
    GEOMETRIC_PROFILE = "geometric_profile" # Zone D: ASCII line art


@dataclass
class RenderContext:
    """Context shared across all rendering passes."""
    game_state: GameState
    world_ledger: WorldLedger
    viewport_bounds: Tuple[int, int, int, int]  # x, y, width, height
    current_time: float
    frame_count: int
    
    def get_player_position(self) -> Tuple[float, float]:
        """Get current player position."""
        return (self.game_state.position.x, self.game_state.position.y)
    
    def get_world_bounds(self) -> Tuple[int, int, int, int]:
        """Get world coordinate bounds."""
        return self.viewport_bounds


@dataclass
class RenderResult:
    """Result of a rendering pass."""
    content: str  # Rendered content
    width: int   # Content width in characters
    height: int  # Content height in characters
    metadata: Dict[str, Any]  # Additional rendering data


class BaseRenderPass(ABC):
    """
    Abstract base class for all rendering passes.
    
    Each render pass specializes in a specific rendering technique
    optimized for its designated UI zone.
    """
    
    def __init__(self, pass_type: RenderPassType):
        """
        Initialize the render pass.
        
        Args:
            pass_type: Type of this render pass
        """
        self.pass_type = pass_type
        self.last_render_time = 0.0
        self.render_count = 0
        
        logger.debug(f"Initialized {pass_type.value} render pass")
    
    @abstractmethod
    def render(self, context: RenderContext) -> RenderResult:
        """
        Render content using this pass's specialized technique.
        
        Args:
            context: Shared rendering context
            
        Returns:
            RenderResult with content and metadata
        """
        pass
    
    @abstractmethod
    def get_optimal_size(self, context: RenderContext) -> Tuple[int, int]:
        """
        Get the optimal size for this render pass.
        
        Args:
            context: Rendering context
            
        Returns:
            Optimal (width, height) in characters
        """
        pass
    
    def update_statistics(self, render_time: float) -> None:
        """Update rendering statistics."""
        self.last_render_time = render_time
        self.render_count += 1
    
    def get_performance_info(self) -> Dict[str, Any]:
        """Get performance information for this pass."""
        return {
            "pass_type": self.pass_type.value,
            "render_count": self.render_count,
            "last_render_time": self.last_render_time,
            "average_fps": 1.0 / self.last_render_time if self.last_render_time > 0 else 0
        }


class RenderPassRegistry:
    """
    Registry for managing all render passes.
    
    Coordinates the multi-pass rendering system and ensures
    proper synchronization between different rendering techniques.
    """
    
    def __init__(self):
        """Initialize the render pass registry."""
        self.passes: Dict[RenderPassType, BaseRenderPass] = {}
        self.render_order: List[RenderPassType] = []
        
        logger.info("RenderPassRegistry initialized")
    
    def register_pass(self, render_pass: BaseRenderPass) -> None:
        """
        Register a render pass.
        
        Args:
            render_pass: Render pass to register
        """
        self.passes[render_pass.pass_type] = render_pass
        
        # Define render order based on pass type
        if render_pass.pass_type not in self.render_order:
            self.render_order.append(render_pass.pass_type)
            # Sort by priority (viewport first, then others)
            priority_order = [
                RenderPassType.PIXEL_VIEWPORT,
                RenderPassType.BRAILLE_RADAR,
                RenderPassType.GEOMETRIC_PROFILE,
                RenderPassType.ANSI_VITALS
            ]
            self.render_order.sort(key=lambda x: priority_order.index(x) if x in priority_order else 999)
        
        logger.debug(f"Registered {render_pass.pass_type.value} render pass")
    
    def get_pass(self, pass_type: RenderPassType) -> Optional[BaseRenderPass]:
        """Get a specific render pass."""
        return self.passes.get(pass_type)
    
    def get_all_passes(self) -> List[BaseRenderPass]:
        """Get all registered render passes in render order."""
        return [self.passes[pass_type] for pass_type in self.render_order if pass_type in self.passes]
    
    def render_all(self, context: RenderContext) -> Dict[RenderPassType, RenderResult]:
        """
        Render all passes with the given context.
        
        Args:
            context: Shared rendering context
            
        Returns:
            Dictionary of render results by pass type
        """
        results = {}
        
        for render_pass in self.get_all_passes():
            try:
                start_time = context.current_time
                result = render_pass.render(context)
                render_pass.update_statistics(context.current_time - start_time)
                results[render_pass.pass_type] = result
                
                logger.debug(f"Rendered {render_pass.pass_type.value} in {context.current_time - start_time:.4f}s")
                
            except Exception as e:
                logger.error(f"Error rendering {render_pass.pass_type.value}: {e}")
                # Create fallback result
                results[render_pass.pass_type] = RenderResult(
                    content=f"[{render_pass.pass_type.value.upper()} ERROR]",
                    width=1,
                    height=1,
                    metadata={"error": str(e)}
                )
        
        return results
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary for all passes."""
        summary = {
            "total_passes": len(self.passes),
            "render_order": [pass_type.value for pass_type in self.render_order],
            "passes": {}
        }
        
        for pass_type, render_pass in self.passes.items():
            summary["passes"][pass_type.value] = render_pass.get_performance_info()
        
        return summary


# Export for use by other modules
__all__ = [
    "BaseRenderPass",
    "RenderPassType", 
    "RenderContext",
    "RenderResult",
    "RenderPassRegistry"
]
