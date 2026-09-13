"""
Narrative Pre-Caching System: Predictive Dialogue Generation

Eliminates the 500ms LLM pause by pre-generating likely narratives
based on Voyager's trajectory and proximity to NPCs.

The "Latent Narrative" approach - while the player moves, the system
looks ahead and pre-caches probable conversations.
"""

import asyncio
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Set
from enum import Enum
import time
from pathlib import Path
import json
import math

import numpy as np
from loguru import logger
from pydantic import BaseModel

# Import game components
from .narrative_engine import ActionOutcome, NarrativeEngine
from .game_state import GameState, NPC
from .logic.orientation import OrientationManager, Orientation


class PreCachePriority(Enum):
    """Priority levels for narrative pre-caching."""
    CRITICAL = 1    # NPC within 3 tiles (imminent interaction)
    HIGH = 2        # NPC within 5 tiles (likely interaction)
    MEDIUM = 3      # NPC within 8 tiles (possible interaction)
    LOW = 4         # Distant NPCs (background preparation)


@dataclass
class PreCacheRequest:
    """A request for pre-cached narrative generation."""
    npc_id: str
    intent_id: str
    player_input: str
    context: str
    priority: PreCachePriority
    distance: float
    timestamp: float = field(default_factory=time.time)
    
    def __hash__(self):
        """Make hashable for set operations."""
        return hash((self.npc_id, self.intent_id, self.player_input))


@dataclass
class CachedNarrative:
    """A pre-cached narrative outcome."""
    request: PreCacheRequest
    outcome: ActionOutcome
    created_at: float
    access_count: int = 0
    last_accessed: float = field(default_factory=time.time)
    
    def is_expired(self, max_age: float = 300.0) -> bool:
        """Check if cache entry is expired (default 5 minutes)."""
        return time.time() - self.created_at > max_age
    
    def is_stale(self, max_staleness: float = 60.0) -> bool:
        """Check if cache entry is stale (default 1 minute since last access)."""
        return time.time() - self.last_accessed > max_staleness


@dataclass
class TrajectoryVector:
    """Represents player's current trajectory for cache validation."""
    position: Tuple[float, float]
    heading: float  # Angle in degrees
    timestamp: float = field(default_factory=time.time)
    
    def angle_to(self, other: 'TrajectoryVector') -> float:
        """Calculate angle difference between two trajectories."""
        angle_diff = abs(self.heading - other.heading)
        # Normalize to 0-180 range
        if angle_diff > 180:
            angle_diff = 360 - angle_diff
        return angle_diff
    
    def distance_to(self, other: 'TrajectoryVector') -> float:
        """Calculate Manhattan distance to another trajectory."""
        return abs(self.position[0] - other.position[0]) + abs(self.position[1] - other.position[1])


class NarrativeBuffer:
    """
    Priority queue for narrative pre-caching.
    
    Maintains a rolling buffer of likely interactions based on
    player position and trajectory analysis.
    """
    
    def __init__(self, max_size: int = 50):
        """
        Initialize narrative buffer.
        
        Args:
            max_size: Maximum number of cached narratives
        """
        self.max_size = max_size
        self._cache: Dict[str, CachedNarrative] = {}
        self._priority_queue: List[PreCacheRequest] = []
        self._processing: Set[str] = set()  # Currently being processed
        self._hit_count = 0
        self._miss_count = 0
        
        # Trajectory tracking for cache invalidation
        self._current_trajectory: Optional[TrajectoryVector] = None
        self._cache_valid_trajectory: Optional[TrajectoryVector] = None
        self._trajectory_threshold_angle = 45.0  # Degrees
        self._trajectory_threshold_distance = 3.0  # Tiles
        
        # Common intents for pre-caching (most likely interactions)
        self._common_intents = ["talk", "attack", "distract", "examine", "trade"]
        
    def _make_cache_key(self, request: PreCacheRequest) -> str:
        """Generate cache key for a request."""
        return f"{request.npc_id}:{request.intent_id}:{hash(request.player_input) % 10000}"
    
    def get(self, npc_id: str, intent_id: str, player_input: str) -> Optional[ActionOutcome]:
        """
        Get cached narrative if available.
        
        Args:
            npc_id: Target NPC ID
            intent_id: Resolved intent
            player_input: Original player input
            
        Returns:
            Cached ActionOutcome or None if not found
        """
        # Create a mock request for key generation
        mock_request = PreCacheRequest(
            npc_id=npc_id,
            intent_id=intent_id,
            player_input=player_input,
            priority=PreCachePriority.HIGH,
            distance=0.0
        )
        
        cache_key = self._make_cache_key(mock_request)
        
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            
            # Check if still valid
            if not cached.is_expired() and not cached.is_stale():
                cached.access_count += 1
                cached.last_accessed = time.time()
                self._hit_count += 1
                logger.debug(f"🎯 Cache hit: {npc_id} - {intent_id}")
                return cached.outcome
            else:
                # Remove expired/stale entry
                del self._cache[cache_key]
                logger.debug(f"🗑️ Cache expired: {npc_id} - {intent_id}")
        
        self._miss_count += 1
        return None
    
    def add(self, request: PreCacheRequest, outcome: ActionOutcome) -> None:
        """
        Add a new cached narrative.
        
        Args:
            request: The pre-cache request
            outcome: Generated narrative outcome
        """
        cache_key = self._make_cache_key(request)
        
        # Create cached entry
        cached = CachedNarrative(
            request=request,
            outcome=outcome,
            created_at=time.time()
        )
        
        # Add to cache
        self._cache[cache_key] = cached
        
        # Remove from processing set
        self._processing.discard(cache_key)
        
        # Maintain cache size
        self._evict_if_needed()
        
        logger.debug(f"💾 Cached narrative: {request.npc_id} - {request.intent_id}")
    
    def _evict_if_needed(self) -> None:
        """Evict least useful entries if cache is full."""
        if len(self._cache) <= self.max_size:
            return
        
        # Sort by (expired, stale, low priority, old)
        entries = list(self._cache.items())
        entries.sort(key=lambda x: (
            x[1].is_expired(),
            x[1].is_stale(),
            x[1].request.priority.value,
            x[1].created_at
        ))
        
        # Remove worst entries
        to_remove = len(self._cache) - self.max_size + 5  # Remove extra for breathing room
        for i in range(min(to_remove, len(entries))):
            cache_key = entries[i][0]
            del self._cache[cache_key]
            logger.debug(f"🗑️ Evicted cache entry: {cache_key}")
    
    def queue_request(self, request: PreCacheRequest) -> bool:
        """
        Queue a pre-cache request if not already cached/processing.
        
        Args:
            request: Pre-cache request to queue
            
        Returns:
            True if request was queued, False if already cached/processing
        """
        cache_key = self._make_cache_key(request)
        
        # Check if already cached
        if cache_key in self._cache:
            return False
        
        # Check if already processing
        if cache_key in self._processing:
            return False
        
        # Add to queue and processing set
        self._priority_queue.append(request)
        self._processing.add(cache_key)
        
        # Sort queue by priority (critical first)
        self._priority_queue.sort(key=lambda x: x.priority.value)
        
        logger.debug(f"📝 Queued pre-cache: {request.npc_id} - {request.intent_id} (priority: {request.priority.name})")
        return True
    
    def get_next_request(self) -> Optional[PreCacheRequest]:
        """Get the next highest priority request to process."""
        if not self._priority_queue:
            return None
        
        return self._priority_queue.pop(0)
    
    def get_stats(self) -> Dict[str, any]:
        """Get cache performance statistics."""
        total_requests = self._hit_count + self._miss_count
        hit_rate = self._hit_count / total_requests if total_requests > 0 else 0.0
        
        return {
            "cache_size": len(self._cache),
            "queue_size": len(self._priority_queue),
            "processing": len(self._processing),
            "hit_count": self._hit_count,
            "miss_count": self._miss_count,
            "hit_rate": hit_rate,
            "trajectory_valid": self._cache_valid_trajectory is not None,
            "cache_invalidations": getattr(self, '_invalidation_count', 0)
        }
    
    def update_trajectory(self, position: Tuple[float, float], heading: float) -> bool:
        """
        Update player trajectory and invalidate cache if necessary.
        
        Args:
            position: Current player position (x, y)
            heading: Current player heading in degrees
            
        Returns:
            True if cache was invalidated, False otherwise
        """
        new_trajectory = TrajectoryVector(position, heading)
        
        # If this is the first trajectory, mark cache as valid
        if self._current_trajectory is None:
            self._current_trajectory = new_trajectory
            self._cache_valid_trajectory = new_trajectory
            return False
        
        # Check if trajectory changed significantly
        angle_change = self._current_trajectory.angle_to(new_trajectory)
        distance_change = self._current_trajectory.distance_to(new_trajectory)
        
        # Update current trajectory
        self._current_trajectory = new_trajectory
        
        # Check if cache invalidation is needed
        if (angle_change > self._trajectory_threshold_angle or 
            distance_change > self._trajectory_threshold_distance):
            
            logger.info(f"🔄 Trajectory changed: angle={angle_change:.1f}°, distance={distance_change:.1f}")
            self.invalidate_cache()
            return True
        
        return False
    
    def invalidate_cache(self) -> None:
        """Invalidate cache due to trajectory change."""
        if not self._cache:
            return
        
        invalidated_count = len(self._cache)
        self._cache.clear()
        self._priority_queue.clear()
        self._processing.clear()
        
        # Update cache valid trajectory
        self._cache_valid_trajectory = self._current_trajectory
        
        # Track invalidation count
        if not hasattr(self, '_invalidation_count'):
            self._invalidation_count = 0
        self._invalidation_count += 1
        
        logger.info(f"🗑️ Cache invalidated: {invalidated_count} entries cleared")
    
    def is_trajectory_valid(self) -> bool:
        """Check if current cache is valid for current trajectory."""
        if self._cache_valid_trajectory is None or self._current_trajectory is None:
            return True  # No trajectory to validate against
        
        angle_change = self._cache_valid_trajectory.angle_to(self._current_trajectory)
        distance_change = self._cache_valid_trajectory.distance_to(self._current_trajectory)
        
        return (angle_change <= self._trajectory_threshold_angle and 
                distance_change <= self._trajectory_threshold_distance)


class PredictiveNarrativeEngine:
    """
    Narrative engine with predictive pre-caching.
    
    Analyzes player movement and pre-generates likely dialogues
    to eliminate LLM latency during gameplay.
    """
    
    def __init__(self, narrative_engine: NarrativeEngine, buffer_size: int = 50):
        """
        Initialize predictive narrative engine.
        
        Args:
            narrative_engine: Base narrative engine for LLM generation
            buffer_size: Size of narrative cache buffer
        """
        self.narrative_engine = narrative_engine
        self.buffer = NarrativeBuffer(buffer_size)
        self._precache_task: Optional[asyncio.Task] = None
        self._running = False
        
        # Orientation integration
        self._orientation_manager: Optional[OrientationManager] = None
        self._last_position: Optional[Tuple[float, float]] = None
        self._last_heading: Optional[float] = None
        
        # Pre-caching configuration
        self.precache_distances = {
            PreCachePriority.CRITICAL: 3.0,
            PreCachePriority.HIGH: 5.0,
            PreCachePriority.MEDIUM: 8.0,
            PreCachePriority.LOW: 12.0
        }
        
        logger.info("🧠 Predictive Narrative Engine initialized")
    
    def set_orientation_manager(self, orientation_manager: OrientationManager) -> None:
        """
        Set the orientation manager for trajectory tracking.
        
        Args:
            orientation_manager: The game's orientation manager
        """
        self._orientation_manager = orientation_manager
        logger.info("🧭 Orientation manager integrated for trajectory-aware caching")
    
    async def start(self) -> None:
        """Start the pre-caching background task."""
        if self._running:
            return
        
        self._running = True
        self._precache_task = asyncio.create_task(self._precache_loop())
        logger.info("🚀 Narrative pre-caching started")
    
    async def stop(self) -> None:
        """Stop the pre-caching background task."""
        self._running = False
        if self._precache_task:
            self._precache_task.cancel()
            try:
                await self._precache_task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 Narrative pre-caching stopped")
    
    async def generate_outcome(
        self,
        intent_id: str,
        player_input: str,
        context: str,
        player_hp: int = 100,
        player_gold: int = 0,
        npc_id: Optional[str] = None
    ) -> ActionOutcome:
        """
        Generate narrative outcome with cache lookup.
        
        Args:
            intent_id: Matched intent
            player_input: Original player text
            context: Room description and NPC states
            player_hp: Current player health
            player_gold: Current player gold
            npc_id: Target NPC ID if applicable
            
        Returns:
            Generated ActionOutcome
        """
        # Try cache first
        if npc_id:
            cached = self.buffer.get(npc_id, intent_id, player_input)
            if cached:
                logger.info(f"⚡ Instant narrative: {npc_id} - {intent_id}")
                return cached
        
        # Generate new outcome
        logger.info(f"🧠 Generating narrative: {intent_id}")
        outcome = await self.narrative_engine.generate_outcome(
            intent_id, player_input, context, player_hp, player_gold
        )
        
        # Cache the result for future use
        if npc_id:
            mock_request = PreCacheRequest(
                npc_id=npc_id,
                intent_id=intent_id,
                player_input=player_input,
                priority=PreCachePriority.HIGH,
                distance=0.0
            )
            self.buffer.add(mock_request, outcome)
        
        return outcome
    
    def look_ahead(self, game_state: GameState) -> None:
        """
        Analyze player position and queue likely narrative requests.
        
        Args:
            game_state: Current game state
        """
        if not self._running:
            return
        
        # Get current position and heading from orientation manager
        current_pos = game_state.player.position
        current_heading = 0.0
        
        if self._orientation_manager:
            orientation = self._orientation_manager.get_orientation()
            current_pos = (orientation.position_x, orientation.position_y)
            current_heading = orientation.angle
        
        # Update trajectory and invalidate cache if necessary
        cache_invalidated = self.buffer.update_trajectory(current_pos, current_heading)
        
        if cache_invalidated:
            logger.info("🔄 Cache invalidated due to trajectory change, re-queuing...")
        
        player_pos = current_pos
        current_room = game_state.current_room
        
        # Get NPCs in current room
        npcs = current_room.npcs if current_room else []
        
        for npc in npcs:
            # Calculate distance to NPC
            npc_pos = npc.get('position', (0, 0))
            distance = abs(player_pos[0] - npc_pos[0]) + abs(player_pos[1] - npc_pos[1])
            
            # Determine priority based on distance
            priority = self._get_priority_by_distance(distance)
            
            # Check if NPC is in front of player (within 90° cone)
            if self._orientation_manager:
                if not self._is_npc_in_front(npc_pos, player_pos, current_heading):
                    priority = PreCachePriority.LOW  # Deprioritize NPCs behind player
            
            # Queue common intents for this NPC
            for intent_id in self.buffer._common_intents:
                # Generate sample player inputs for this intent
                sample_inputs = self._generate_sample_inputs(intent_id, npc.get('name', 'someone'))
                
                for player_input in sample_inputs:
                    request = PreCacheRequest(
                        npc_id=npc.get('id', f'npc_{npc.get('name', 'unknown')}'),
                        intent_id=intent_id,
                        player_input=player_input,
                        priority=priority,
                        distance=distance
                    )
                    
                    self.buffer.queue_request(request)
    
    def _is_npc_in_front(self, npc_pos: Tuple[float, float], player_pos: Tuple[float, float], player_heading: float) -> bool:
        """
        Check if NPC is in front of player (within 90° cone).
        
        Args:
            npc_pos: NPC position
            player_pos: Player position
            player_heading: Player heading in degrees
            
        Returns:
            True if NPC is in front of player
        """
        # Calculate angle to NPC
        dx = npc_pos[0] - player_pos[0]
        dy = npc_pos[1] - player_pos[1]
        angle_to_npc = math.degrees(math.atan2(dy, dx))
        
        # Normalize angles
        angle_to_npc = angle_to_npc % 360
        player_heading = player_heading % 360
        
        # Calculate angle difference
        angle_diff = abs(angle_to_npc - player_heading)
        if angle_diff > 180:
            angle_diff = 360 - angle_diff
        
        # Check if within 90° cone (45° on each side)
        return angle_diff <= 45.0
    
    def _get_priority_by_distance(self, distance: float) -> PreCachePriority:
        """Convert distance to pre-cache priority."""
        for priority, max_dist in self.precache_distances.items():
            if distance <= max_dist:
                return priority
        return PreCachePriority.LOW
    
    def _generate_sample_inputs(self, intent_id: str, npc_name: str) -> List[str]:
        """Generate sample player inputs for an intent."""
        templates = {
            "talk": [f"I talk to {npc_name}", f"Hello {npc_name}", f"I greet {npc_name}"],
            "attack": [f"I attack {npc_name}", f"I hit {npc_name}", f"I fight {npc_name}"],
            "distract": [f"I distract {npc_name}", f"I throw something at {npc_name}"],
            "examine": [f"I examine {npc_name}", f"I look at {npc_name}", f"I study {npc_name}"],
            "trade": [f"I trade with {npc_name}", f"I want to buy something", f"Show me your wares"]
        }
        
        return templates.get(intent_id, [f"I {intent_id} {npc_name}"])
    
    async def _precache_loop(self) -> None:
        """Background loop for processing pre-cache requests."""
        logger.info("🔄 Pre-cache loop started")
        
        while self._running:
            try:
                # Get next request
                request = self.buffer.get_next_request()
                if not request:
                    await asyncio.sleep(0.1)  # No requests, wait briefly
                    continue
                
                # Generate context for this request
                context = f"Player is near {request.npc_id} (distance: {request.distance})"
                
                # Generate outcome
                logger.debug(f"🔄 Pre-caching: {request.npc_id} - {request.intent_id}")
                outcome = await self.narrative_engine.generate_outcome(
                    request.intent_id,
                    request.player_input,
                    context
                )
                
                # Cache the result
                self.buffer.add(request, outcome)
                
                # Small delay to prevent overwhelming the LLM
                await asyncio.sleep(0.05)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Pre-cache error: {e}")
                await asyncio.sleep(0.5)  # Back off on error
        
        logger.info("🔄 Pre-cache loop stopped")
    
    def get_stats(self) -> Dict[str, any]:
        """Get predictive engine statistics."""
        stats = self.buffer.get_stats()
        stats.update({
            "running": self._running,
            "precache_task_active": self._precache_task and not self._precache_task.done()
        })
        return stats


# Factory function for easy integration
def create_predictive_engine(model_name: str = "ollama:llama3.2:3b", tone: str = "serious") -> PredictiveNarrativeEngine:
    """
    Create a predictive narrative engine with default configuration.
    
    Args:
        model_name: Ollama model identifier
        tone: Narrative tone
        
    Returns:
        Configured PredictiveNarrativeEngine
    """
    base_engine = NarrativeEngine(model_name, tone)
    return PredictiveNarrativeEngine(base_engine)
