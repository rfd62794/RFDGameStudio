"""
Cinematic Camera System

Dynamic zoom/pan camera that knows where the action is.
Focuses on the Voyager during travel, pans to include NPCs during interactions,
and provides cinematic framing for the autonomous movie experience.

This is the "Director of Photography" for the D&D movie.
"""

import math
from typing import Tuple, Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import time

from loguru import logger


class CameraMode(Enum):
    """Camera operational modes."""
    FOLLOW_VOYAGER = "follow_voyager"
    FOCUS_INTERACTION = "focus_interaction"
    CINEMATIC_PAN = "cinematic_pan"
    OVERVIEW = "overview"
    ZOOM_IN = "zoom_in"
    ZOOM_OUT = "zoom_out"


class FocusTarget(Enum):
    """Camera focus targets."""
    VOYAGER = "voyager"
    NPC = "npc"
    OBJECT = "object"
    LOCATION = "location"


@dataclass
class CameraPosition:
    """Camera position and zoom state."""
    center_x: float
    center_y: float
    zoom_level: float
    target_x: Optional[float] = None
    target_y: Optional[float] = None
    target_zoom: Optional[float] = None
    transition_speed: float = 0.1


@dataclass
class FocusPoint:
    """Point of interest for camera focus."""
    position: Tuple[int, int]
    priority: int
    target_type: FocusTarget
    description: str
    timestamp: float


class CinematicCamera:
    """
    Cinematic camera with dynamic zoom/pan capabilities.
    
    Automatically focuses on the action and provides smooth transitions
    between different cinematic shots.
    """
    
    def __init__(self, viewport_width: int, viewport_height: int):
        """
        Initialize the cinematic camera.
        
        Args:
            viewport_width: Width of the viewport in pixels
            viewport_height: Height of the viewport in pixels
        """
        self.viewport_width = viewport_width
        self.viewport_height = viewport_height
        
        # Camera state
        self.mode = CameraMode.FOLLOW_VOYAGER
        self.position = CameraPosition(0, 0, 1.0)
        self.target_position: Optional[CameraPosition] = None
        
        # Focus management
        self.focus_points: List[FocusPoint] = []
        self.current_focus: Optional[FocusPoint] = None
        
        # Cinematic settings
        self.min_zoom = 0.5
        self.max_zoom = 2.0
        self.default_zoom = 1.0
        self.transition_speed = 0.05
        self.smoothing_factor = 0.1
        
        # Auto-focus settings
        self.perception_range = 100  # Pixels
        self.focus_priority_threshold = 3
        
        logger.info("🎥 Cinematic camera initialized")
    
    def update(self, voyager_pos: Tuple[int, int], npcs: List[Dict[str, Any]], 
               objects: List[Dict[str, Any]], dt: float) -> Tuple[int, int, int, int]:
        """
        Update camera position and zoom based on current game state.
        
        Args:
            voyager_pos: Current Voyager position
            npcs: List of NPCs in the scene
            objects: List of objects in the scene
            dt: Time delta for smooth transitions
            
        Returns:
            Tuple of (viewport_x, viewport_y, viewport_width, viewport_height)
        """
        # Update focus points
        self._update_focus_points(voyager_pos, npcs, objects)
        
        # Determine camera mode based on context
        self._determine_camera_mode(voyager_pos, npcs, objects)
        
        # Calculate target position
        target_pos = self._calculate_target_position(voyager_pos, npcs, objects)
        
        # Smooth transition to target
        self._smooth_transition(target_pos, dt)
        
        # Calculate viewport bounds
        return self._calculate_viewport_bounds()
    
    def _update_focus_points(self, voyager_pos: Tuple[int, int], 
                           npcs: List[Dict[str, Any]], objects: List[Dict[str, Any]]) -> None:
        """Update focus points based on current game state."""
        self.focus_points.clear()
        current_time = time.time()
        
        # Always include Voyager as focus point
        self.focus_points.append(FocusPoint(
            position=voyager_pos,
            priority=5,
            target_type=FocusTarget.VOYAGER,
            description="Voyager",
            timestamp=current_time
        ))
        
        # Add nearby NPCs
        for npc in npcs:
            npc_pos = npc.get('position', (0, 0))
            distance = self._calculate_distance(voyager_pos, npc_pos)
            
            if distance <= self.perception_range:
                priority = self._calculate_npc_priority(npc, distance)
                self.focus_points.append(FocusPoint(
                    position=npc_pos,
                    priority=priority,
                    target_type=FocusTarget.NPC,
                    description=npc.get('name', 'Unknown NPC'),
                    timestamp=current_time
                ))
        
        # Add important objects
        for obj in objects:
            obj_pos = obj.get('position', (0, 0))
            distance = self._calculate_distance(voyager_pos, obj_pos)
            
            if distance <= self.perception_range:
                priority = self._calculate_object_priority(obj, distance)
                self.focus_points.append(FocusPoint(
                    position=obj_pos,
                    priority=priority,
                    target_type=FocusTarget.OBJECT,
                    description=obj.get('name', 'Unknown object'),
                    timestamp=current_time
                ))
        
        # Sort by priority
        self.focus_points.sort(key=lambda fp: fp.priority, reverse=True)
    
    def _determine_camera_mode(self, voyager_pos: Tuple[int, int], 
                             npcs: List[Dict[str, Any]], objects: List[Dict[str, Any]]) -> None:
        """Determine camera mode based on context."""
        # Check for high-priority interactions
        high_priority_focus = [fp for fp in self.focus_points if fp.priority >= self.focus_priority_threshold]
        
        if len(high_priority_focus) > 1:
            # Multiple high-priority points - use cinematic pan
            self.mode = CameraMode.CINEMATIC_PAN
        elif len(high_priority_focus) == 1:
            # Single high-priority point - focus on interaction
            self.mode = CameraMode.FOCUS_INTERACTION
        else:
            # Default - follow Voyager
            self.mode = CameraMode.FOLLOW_VOYAGER
    
    def _calculate_target_position(self, voyager_pos: Tuple[int, int], 
                                  npcs: List[Dict[str, Any]], objects: List[Dict[str, Any]]) -> CameraPosition:
        """Calculate target camera position based on current mode."""
        if self.mode == CameraMode.FOLLOW_VOYAGER:
            return self._calculate_voyager_focus(voyager_pos)
        elif self.mode == CameraMode.FOCUS_INTERACTION:
            return self._calculate_interaction_focus(voyager_pos, npcs, objects)
        elif self.mode == CameraMode.CINEMATIC_PAN:
            return self._calculate_cinematic_pan(voyager_pos, npcs, objects)
        else:
            return self._calculate_overview(voyager_pos, npcs, objects)
    
    def _calculate_voyager_focus(self, voyager_pos: Tuple[int, int]) -> CameraPosition:
        """Calculate camera position focused on Voyager."""
        return CameraPosition(
            center_x=float(voyager_pos[0]),
            center_y=float(voyager_pos[1]),
            zoom_level=self.default_zoom
        )
    
    def _calculate_interaction_focus(self, voyager_pos: Tuple[int, int], 
                                   npcs: List[Dict[str, Any]], objects: List[Dict[str, Any]]) -> CameraPosition:
        """Calculate camera position for interaction focus."""
        if not self.focus_points:
            return self._calculate_voyager_focus(voyager_pos)
        
        # Get highest priority focus point
        primary_focus = self.focus_points[0]
        
        # Calculate center between Voyager and focus point
        center_x = (voyager_pos[0] + primary_focus.position[0]) / 2
        center_y = (voyager_pos[1] + primary_focus.position[1]) / 2
        
        # Zoom in for interaction
        zoom_level = self.default_zoom * 1.2
        
        return CameraPosition(
            center_x=center_x,
            center_y=center_y,
            zoom_level=min(zoom_level, self.max_zoom)
        )
    
    def _calculate_cinematic_pan(self, voyager_pos: Tuple[int, int], 
                                npcs: List[Dict[str, Any]], objects: List[Dict[str, Any]]) -> CameraPosition:
        """Calculate camera position for cinematic pan."""
        if len(self.focus_points) < 2:
            return self._calculate_voyager_focus(voyager_pos)
        
        # Calculate bounding box of important focus points
        focus_positions = [fp.position for fp in self.focus_points[:3]]  # Top 3 focus points
        
        min_x = min(pos[0] for pos in focus_positions)
        max_x = max(pos[0] for pos in focus_positions)
        min_y = min(pos[1] for pos in focus_positions)
        max_y = max(pos[1] for pos in focus_positions)
        
        # Calculate center of bounding box
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Calculate zoom to fit all focus points
        width_needed = max_x - min_x + 50  # Add padding
        height_needed = max_y - min_y + 50
        
        zoom_x = self.viewport_width / width_needed
        zoom_y = self.viewport_height / height_needed
        zoom_level = min(zoom_x, zoom_y, self.default_zoom)
        
        return CameraPosition(
            center_x=center_x,
            center_y=center_y,
            zoom_level=max(zoom_level, self.min_zoom)
        )
    
    def _calculate_overview(self, voyager_pos: Tuple[int, int], 
                          npcs: List[Dict[str, Any]], objects: List[Dict[str, Any]]) -> CameraPosition:
        """Calculate camera position for overview shot."""
        # Zoom out for overview
        zoom_level = self.default_zoom * 0.7
        
        return CameraPosition(
            center_x=float(voyager_pos[0]),
            center_y=float(voyager_pos[1]),
            zoom_level=max(zoom_level, self.min_zoom)
        )
    
    def _smooth_transition(self, target_pos: CameraPosition, dt: float) -> None:
        """Smoothly transition camera to target position."""
        # Smooth position transition
        self.position.center_x += (target_pos.center_x - self.position.center_x) * self.smoothing_factor
        self.position.center_y += (target_pos.center_y - self.position.center_y) * self.smoothing_factor
        self.position.zoom_level += (target_pos.zoom_level - self.position.zoom_level) * self.smoothing_factor
    
    def _calculate_viewport_bounds(self) -> Tuple[int, int, int, int]:
        """Calculate viewport bounds based on camera position and zoom."""
        # Calculate viewport size based on zoom
        viewport_width = self.viewport_width / self.position.zoom_level
        viewport_height = self.viewport_height / self.position.zoom_level
        
        # Calculate top-left corner
        viewport_x = int(self.position.center_x - viewport_width / 2)
        viewport_y = int(self.position.center_y - viewport_height / 2)
        
        # Ensure viewport stays within bounds
        viewport_x = max(0, viewport_x)
        viewport_y = max(0, viewport_y)
        
        return viewport_x, viewport_y, int(viewport_width), int(viewport_height)
    
    def _calculate_distance(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> float:
        """Calculate distance between two positions."""
        dx = pos1[0] - pos2[0]
        dy = pos1[1] - pos2[1]
        return math.sqrt(dx * dx + dy * dy)
    
    def _calculate_npc_priority(self, npc: Dict[str, Any], distance: float) -> int:
        """Calculate priority for NPC focus."""
        base_priority = 3
        
        # Adjust based on NPC state
        state = npc.get('state', 'neutral')
        if state == 'hostile':
            base_priority += 2
        elif state == 'charmed':
            base_priority += 1
        
        # Adjust based on distance
        if distance < 30:
            base_priority += 1
        
        return base_priority
    
    def _calculate_object_priority(self, obj: Dict[str, Any], distance: float) -> int:
        """Calculate priority for object focus."""
        base_priority = 2
        
        # Adjust based on object type
        obj_type = obj.get('type', 'unknown')
        if obj_type == 'chest':
            base_priority += 2
        elif obj_type == 'weapon':
            base_priority += 1
        
        # Adjust based on distance
        if distance < 20:
            base_priority += 1
        
        return base_priority
    
    def set_manual_focus(self, position: Tuple[int, int], zoom_level: float = None) -> None:
        """Set manual camera focus."""
        self.target_position = CameraPosition(
            center_x=float(position[0]),
            center_y=float(position[1]),
            zoom_level=zoom_level or self.default_zoom
        )
        
        self.mode = CameraMode.OVERVIEW
        logger.info(f"🎥 Manual focus set to {position}")
    
    def zoom_in(self) -> None:
        """Zoom camera in."""
        new_zoom = min(self.position.zoom_level * 1.2, self.max_zoom)
        self.position.zoom_level = new_zoom
        logger.info(f"🎥 Zoomed in to {new_zoom:.2f}x")
    
    def zoom_out(self) -> None:
        """Zoom camera out."""
        new_zoom = max(self.position.zoom_level * 0.8, self.min_zoom)
        self.position.zoom_level = new_zoom
        logger.info(f"🎥 Zoomed out to {new_zoom:.2f}x")
    
    def reset_zoom(self) -> None:
        """Reset zoom to default level."""
        self.position.zoom_level = self.default_zoom
        logger.info(f"🎥 Zoom reset to {self.default_zoom}x")
    
    def get_camera_info(self) -> Dict[str, Any]:
        """Get current camera information."""
        return {
            'mode': self.mode.value,
            'position': {
                'center_x': self.position.center_x,
                'center_y': self.position.center_y,
                'zoom_level': self.position.zoom_level
            },
            'focus_points': len(self.focus_points),
            'current_focus': self.current_focus.description if self.current_focus else None
        }


class CameraController:
    """
    Controller for managing cinematic camera operations.
    
    Provides high-level interface for camera operations and
    integrates with the Director for cinematic timing.
    """
    
    def __init__(self, viewport_width: int, viewport_height: int):
        self.camera = CinematicCamera(viewport_width, viewport_height)
        self.is_cinematic_mode = False
        self.cinematic_queue: List[Dict[str, Any]] = []
        
        logger.info("🎬 Camera controller initialized")
    
    def start_cinematic_mode(self) -> None:
        """Start cinematic mode."""
        self.is_cinematic_mode = True
        logger.info("🎬 Cinematic mode started")
    
    def stop_cinematic_mode(self) -> None:
        """Stop cinematic mode."""
        self.is_cinematic_mode = False
        self.cinematic_queue.clear()
        logger.info("🎬 Cinematic mode stopped")
    
    def queue_cinematic_shot(self, shot_type: str, duration: float, 
                           target: Optional[Tuple[int, int]] = None) -> None:
        """
        Queue a cinematic shot.
        
        Args:
            shot_type: Type of shot ('zoom_in', 'zoom_out', 'pan', 'focus')
            duration: Duration of the shot in seconds
            target: Target position for the shot
        """
        self.cinematic_queue.append({
            'type': shot_type,
            'duration': duration,
            'target': target,
            'start_time': None
        })
        
        logger.info(f"🎬 Queued cinematic shot: {shot_type}")
    
    def execute_cinematic_queue(self, dt: float) -> bool:
        """
        Execute queued cinematic shots.
        
        Args:
            dt: Time delta
            
        Returns:
            True if cinematic shots are being executed, False otherwise
        """
        if not self.cinematic_queue:
            return False
        
        current_shot = self.cinematic_queue[0]
        
        # Initialize shot start time
        if current_shot['start_time'] is None:
            current_shot['start_time'] = time.time()
        
        # Execute shot
        shot_type = current_shot['type']
        
        if shot_type == 'zoom_in':
            self.camera.zoom_in()
        elif shot_type == 'zoom_out':
            self.camera.zoom_out()
        elif shot_type == 'focus' and current_shot['target']:
            self.camera.set_manual_focus(current_shot['target'])
        
        # Check if shot is complete
        elapsed = time.time() - current_shot['start_time']
        if elapsed >= current_shot['duration']:
            self.cinematic_queue.pop(0)
            logger.info(f"🎬 Completed cinematic shot: {shot_type}")
        
        return len(self.cinematic_queue) > 0
    
    def update(self, voyager_pos: Tuple[int, int], npcs: List[Dict[str, Any]], 
               objects: List[Dict[str, Any]], dt: float) -> Tuple[int, int, int, int]:
        """Update camera and execute cinematic queue."""
        # Execute cinematic shots
        is_cinematic = self.execute_cinematic_queue(dt)
        
        # Update camera
        return self.camera.update(voyager_pos, npcs, objects, dt)
    
    def get_camera_state(self) -> Dict[str, Any]:
        """Get current camera state."""
        return {
            'camera_info': self.camera.get_camera_info(),
            'cinematic_mode': self.is_cinematic_mode,
            'cinematic_queue_length': len(self.cinematic_queue)
        }


# Factory for creating camera components
class CameraFactory:
    """Factory for creating camera components."""
    
    @staticmethod
    def create_cinematic_camera(viewport_width: int, viewport_height: int) -> CinematicCamera:
        """Create cinematic camera."""
        return CinematicCamera(viewport_width, viewport_height)
    
    @staticmethod
    def create_camera_controller(viewport_width: int, viewport_height: int) -> CameraController:
        """Create camera controller."""
        return CameraController(viewport_width, viewport_height)
