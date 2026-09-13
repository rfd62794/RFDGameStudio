"""
Voyager - The Mind

Autonomous AI agent with quest-driven objectives and STATE_PONDERING support.
The Voyager navigates the world, discovers Interest Points, and enters
STATE_PONDERING to allow the LLM Chronicler to manifest chaos into narrative.

Navigation/pathfinding primitives are in voyager_navigation.py (The Body).
"""

import asyncio
import time
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum

from loguru import logger

from dgt_engine.systems.kernel.state.models import GameState, InterestPoint
from dgt_engine.systems.kernel.state.enums import AIState as VoyagerState
from dgt_engine.systems.kernel.state.intents import MovementIntent, InteractionIntent, PonderIntent
from dgt_engine.systems.kernel.state.validation import validate_position
from dgt_engine.systems.kernel.state.constants import DIRECTION_VECTORS
from dgt_engine.systems.kernel.constants import (
    MOVEMENT_RANGE_TILES, INTENT_COOLDOWN_MS, PERSISTENCE_INTERVAL_TURNS,
    PATHFINDING_MAX_ITERATIONS, VOYAGER_INTERACTION_RANGE
)
from dgt_engine.systems.kernel.config import VoyagerConfig
from dgt_engine.engine.chronos import ChronosEngine

# Body — pathfinding and navigation primitives
from dgt_engine.game_engine.actors.pawn_navigation import (
    NavigationGoal, PathfindingNode, PathfindingNavigator, IntentGenerator
)


class AIController:
    """Autonomous pathfinding and intent generation with STATE_PONDERING support"""
    
    def __init__(self, config_or_dd_engine, dd_engine=None, chronos_engine=None):
        if hasattr(config_or_dd_engine, 'seed'):
            # It's a VoyagerConfig object
            self.config = config_or_dd_engine
            self.dd_engine = dd_engine
            self.chronos_engine = chronos_engine
        else:
            # Legacy mode
            self.config = VoyagerConfig(seed="DEFAULT")
            self.dd_engine = config_or_dd_engine
            self.chronos_engine = chronos_engine
        
        # Navigation components
        self.navigator = PathfindingNavigator()
        self.intent_generator = IntentGenerator(self.navigator)
        
        # State machine
        self.state = VoyagerState.STATE_IDLE
        self.state_entered_time: float = 0.0
        
        # Navigation state
        self.current_position: Tuple[int, int] = (10, 25)
        self.current_path: List[Tuple[int, int]] = []
        self.current_goal: Optional[NavigationGoal] = None
        
        # Legacy movie script (kept for compatibility)
        self.movie_script = [
            (10, 25),  # Forest edge
            (10, 20),  # Town gate
            (10, 10),  # Town square
            (20, 10),  # Tavern entrance
            (25, 30),  # Tavern interior
            (32, 32),  # Iron Chest (final target)
        ]
        self.current_script_index = 0
        
        # Quest-driven navigation (primary)
        self.quest_mode = True  # Use quest system instead of movie script
        
        # Discovery tracking
        self.discovered_interest_points: List[InterestPoint] = []
        self.last_discovery_time: float = 0.0
        
        # Performance tracking
        self.pathfinding_times: List[float] = []
        self.intent_generation_times: List[float] = []
        
        # Idle state tracking for animations
        self.idle_timer = 0
        self.idle_threshold = 5  # Number of turns before idle animation
        self.is_idle = False

        # Timing
        self.last_intent_time: float = 0.01  # 10ms for movie mode
        
        self.is_idle = False

        logger.info("🧠 AIController initialized - Industrialization Pivot active")

    # === FACADE INTERFACE ===

    async def generate_next_intent(self, game_state: GameState) -> Optional[Union[MovementIntent, InteractionIntent, PonderIntent]]:
        """Generate next intent based on state and quest objectives (Facade method)"""
        start_time = time.time()

        # Update position in Chronos Engine (if available)
        if self.chronos_engine:
            await self.chronos_engine.update_character_position(self.current_position)

        # Update idle timer for animations
        if hasattr(self, 'idle_timer'):
            self.idle_timer += 1
            if self.idle_timer >= self.idle_threshold:
                self.is_idle = True
            else:
                self.is_idle = False

        intent = None

        if self.state == VoyagerState.STATE_IDLE:
            if self.quest_mode:
                intent = await self._follow_quest_objective(game_state)
            else:
                intent = await self._generate_idle_intent(game_state)
        elif self.state == VoyagerState.STATE_PONDERING:
            intent = await self._generate_pondering_intent(game_state)
        elif self.state == VoyagerState.STATE_MOVING:
            intent = await self._generate_movement_intent(game_state)

        # Reset idle timer if moving
        if intent and intent.intent_type == "movement":
            if hasattr(self, 'idle_timer'):
                self.idle_timer = 0
                self.is_idle = False

        # Track performance
        generation_time = time.time() - start_time
        self.intent_generation_times.append(generation_time)

        # Keep performance history manageable
        if len(self.intent_generation_times) > 100:
            self.intent_generation_times = self.intent_generation_times[-50:]

        if intent:
            logger.debug(f"🚶 Generated {intent.intent_type} intent in {generation_time:.3f}s")

        return intent

    async def generate_movement_intent(self, target_position: Tuple[int, int]) -> Optional[MovementIntent]:
        """Generate movement intent with pathfinding (Facade method)"""
        if not validate_position(target_position):
            logger.warning(f"🚶 Invalid target position: {target_position}")
            return None

        # Get collision map (synchronous fallback)
        collision_map = self._get_collision_map()
        
        # Generate path
        path = await self.navigator.find_path(self.current_position, target_position, collision_map)
        
        if not path:
            logger.warning(f"🚶 No path found to {target_position}")
            return None
        
        # Calculate confidence
        confidence = self.intent_generator._calculate_path_confidence(path)
        
        intent = MovementIntent(
            target_position=target_position,
            path=path,
            confidence=confidence,
            timestamp=time.time()
        )
        
        logger.debug(f"🚶 Generated movement intent: {len(path)} steps, confidence: {confidence:.2f}")
        return intent
    
    async def generate_interaction_intent(self, target_entity: str, interaction_type: str, parameters: Dict[str, Any] = None) -> Optional[InteractionIntent]:
        """Generate interaction intent (Facade method)"""
        intent = InteractionIntent(
            target_entity=target_entity,
            interaction_type=interaction_type,
            parameters=parameters or {},
            timestamp=time.time()
        )
        
        logger.debug(f"🚶 Generated interaction intent: {interaction_type} with {target_entity}")
        return intent
    
    async def submit_intent(self, intent: Union[MovementIntent, InteractionIntent, PonderIntent]) -> bool:
        """Submit intent to D&D Engine (Facade method)"""
        # Check intent cooldown
        current_time = time.time()
        if current_time - self.last_intent_time < self.intent_cooldown:
            logger.debug("⏱️ Intent cooldown - waiting")
            return False
        
        self.last_intent_time = current_time
        
        return await self.dd_engine.submit_intent(intent)
    
    async def is_movement_complete(self) -> bool:
        """Check if current movement is complete (Facade method)"""
        if not self.current_path:
            return True
        
        # Check if we've reached the target
        if self.current_position == self.current_path[-1]:
            self.current_path.clear()
            return True
        
        return False
    
    async def update_position(self, new_position: Tuple[int, int]) -> None:
        """Update Voyager position (Facade method)"""
        if validate_position(new_position):
            self.current_position = new_position
            logger.debug(f"🚶 Position updated: {new_position}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get Voyager status (Facade method)"""
        avg_pathfinding_time = sum(self.pathfinding_times) / len(self.pathfinding_times) if self.pathfinding_times else 0
        avg_intent_time = sum(self.intent_generation_times) / len(self.intent_generation_times) if self.intent_generation_times else 0
        
        return {
            "position": self.current_position,
            "state": self.state.value,
            "current_goal": self.current_goal.target_position if self.current_goal else None,
            "path_length": len(self.current_path),
            "discovered_interest_points": len(self.discovered_interest_points),
            "script_index": self.current_script_index,
            "avg_pathfinding_time_ms": avg_pathfinding_time,
            "avg_intent_generation_time_ms": avg_intent_time,
            "health": "good"  # Placeholder
        }
    
    # === STATE MACHINE ===
    
    async def _generate_idle_intent(self, game_state: GameState) -> Optional[Union[MovementIntent, InteractionIntent, PonderIntent]]:
        """Generate intent when idle - now quest-driven with object awareness"""
        current_pos = game_state.player_position
        
        # PRIORITY 1: Check for nearby interactable objects (Object DNA awareness)
        interaction_intent = await self._check_nearby_objects(current_pos)
        if interaction_intent:
            logger.info(f"🎯 Object-Aware Voyager: Found interactable object at {interaction_intent.target_position}")
            return interaction_intent
        
        # PRIORITY 2: Check if we have pending discoveries to ponder
        if self.discovered_interest_points:
            for ip in self.discovered_interest_points:
                if not ip.visited:
                    # Generate ponder intent for unvisited interest point
                    ponder_intent = PonderIntent(
                        interest_point=ip,
                        parameters={"discovery_time": ip.discovery_time},
                        timestamp=time.time()
                    )
                    logger.info(f"🤔 Pondering unvisited interest point at {ip.position}")
                    return ponder_intent
        
        # PRIORITY 3: Follow quest objectives if in quest mode
        if self.quest_mode:
            intent = await self._follow_quest_objective(game_state)
            if intent:
                return intent
        else:
            return await self._follow_legacy_script(game_state)
    
    async def _check_nearby_objects(self, current_position: Tuple[int, int]) -> Optional[InteractionIntent]:
        """Check for nearby objects with D20 interactions and prioritize them"""
        if not self.dd_engine or not hasattr(self.dd_engine, 'object_registry'):
            return None
        
        object_registry = self.dd_engine.object_registry
        
        # Debug: Check what objects are registered
        print(f"🔍 DEBUG: Objects in registry: {list(object_registry.world_objects.keys())}")
        
        # Check adjacent positions (including current position)
        adjacent_positions = [
            current_position,  # Current position
            (current_position[0] + 1, current_position[1]),  # Right
            (current_position[0] - 1, current_position[1]),  # Left
            (current_position[0], current_position[1] + 1),  # Down
            (current_position[0], current_position[1] - 1),  # Up
        ]
        
        print(f"🔍 DEBUG: Checking positions: {adjacent_positions}")
        
        # Prioritize objects by interaction difficulty and value
        best_interaction = None
        best_priority = -1
        
        for pos in adjacent_positions:
            if not validate_position(pos):
                continue
                
            obj = object_registry.get_object_at(pos)
            print(f"🔍 DEBUG: Object at {pos}: {obj}")
            
            if not obj or not obj.characteristics:
                continue
            
            char = obj.characteristics
            
            # Check if object has D20 interactions
            if not hasattr(char, 'd20_checks') or not char.d20_checks:
                continue
            
            # Calculate interaction priority based on object characteristics
            priority = self._calculate_interaction_priority(obj, char)
            print(f"🔍 DEBUG: {obj.asset_id} at {pos} priority: {priority}")
            
            if priority > best_priority:
                # Choose the best available interaction
                best_interaction_type = self._choose_best_interaction(char.d20_checks)
                
                if best_interaction_type:
                    best_interaction = InteractionIntent(
                        target_entity=obj.asset_id,
                        interaction_type=best_interaction_type,
                        target_position=pos,
                        parameters={"object_id": obj.asset_id},
                        timestamp=time.time()
                    )
                    best_priority = priority
                    print(f"🎯 DEBUG: Found best interaction: {best_interaction_type} with {obj.asset_id} at {pos}")
        
        print(f"🔍 DEBUG: Final best_interaction: {best_interaction}")
        return best_interaction
    
    def _calculate_interaction_priority(self, obj, characteristics) -> int:
        """Calculate priority for interacting with an object"""
        priority = 0
        
        # Base priority from rarity (rarer objects are more interesting)
        if hasattr(characteristics, 'rarity'):
            priority += int((1.0 - characteristics.rarity) * 20)
        
        # Priority from tags (certain tags are more interesting)
        if hasattr(characteristics, 'tags'):
            tag_priorities = {
                'magical': 15,
                'rare': 12,
                'valuable': 10,
                'mysterious': 8,
                'container': 6,
                'interactive': 5,
                'hazard': -5,  # Avoid hazards unless necessary
                'trap': -8
            }
            
            for tag in characteristics.tags:
                if tag in tag_priorities:
                    priority += tag_priorities[tag]
        
        # Priority from material (some materials are more interesting)
        if hasattr(characteristics, 'material'):
            material_priorities = {
                'magical_crystal': 10,
                'energy': 8,
                'iron': 6,
                'glass_metal': 7,
                'stone': 3,
                'wood': 2,
                'organic': 1
            }
            
            if characteristics.material in material_priorities:
                priority += material_priorities[characteristics.material]
        
        return priority
    
    def _choose_best_interaction(self, d20_checks: Dict[str, Any]) -> Optional[str]:
        """Choose the best interaction type from available D20 checks"""
        interaction_priorities = {
            'lockpick': 10,      # High value - containers
            'examine': 8,        # Information gathering
            'harvest': 7,        # Resource gathering
            'open': 6,           # Access
            'search': 5,         # Discovery
            'study': 4,          # Learning
            'identify': 3,       # Understanding
            'avoid': -5,         # Defensive
            'disarm': 2,        # Safety
            'cut': 1,            # Resource
            'burn': -2,          # Destructive
            'push': 0,           # Repositioning
        }
        
        best_interaction = None
        best_priority = -1
        
        for interaction_type, check_data in d20_checks.items():
            priority = interaction_priorities.get(interaction_type, 0)
            
            # Consider difficulty (easier tasks might be prioritized for success)
            difficulty = check_data.get('difficulty', 10)
            if difficulty <= 12:  # Relatively easy
                priority += 2
            elif difficulty >= 18:  # Very hard
                priority -= 2
            
            if priority > best_priority:
                best_priority = priority
                best_interaction = interaction_type
        
        return best_interaction
    
    async def _generate_pondering_intent(self, game_state: GameState) -> Optional[PonderIntent]:
        """Generate intent when pondering"""
        # Check if pondering has timed out
        if time.time() - self.state_entered_time > VOYAGER_PONDERING_TIMEOUT_SECONDS:
            logger.warning("🚶 Pondering timeout, returning to idle")
            await self._change_state(VoyagerState.STATE_IDLE)
            return None
        
        # Pondering state - no new intents, waiting for LLM response
        return None
    
    async def _generate_movement_intent(self, game_state: GameState) -> Optional[MovementIntent]:
        """Generate intent when moving"""
        # Continue following current path
        if self.current_path:
            # Get next position in path
            next_position = self.current_path[0]
            
            # Generate movement intent to next position
            return MovementIntent(
                target_position=next_position,
                path=[next_position],
                confidence=1.0,
                timestamp=time.time()
            )
        
        # Path complete, return to idle
        await self._change_state(VoyagerState.STATE_IDLE)
        return None
    
    async def _create_ponder_intent(self, interest_point: InterestPoint) -> PonderIntent:
        """Create ponder intent for Interest Point"""
        await self._change_state(VoyagerState.STATE_PONDERING)
        
        # Create query context for LLM
        query_context = self._generate_query_context(interest_point)
        
        intent = PonderIntent(
            interest_point=interest_point,
            query_context=query_context,
            timestamp=time.time()
        )
        
        logger.info(f"🚶 Creating ponder intent for {interest_point.interest_type.value} at {interest_point.position}")
        return intent
    
    # === MOVIE SCRIPT NAVIGATION ===
    
    async def _follow_quest_objective(self, game_state: GameState) -> Optional[MovementIntent]:
        """Follow quest-driven objectives instead of fixed movie script"""
        try:
            # Get current objective from Chronos Engine
            objective_position = await self.chronos_engine.get_current_objective()
            
            if objective_position:
                logger.info(f"🎯 Quest objective: {objective_position}")
                
                # Check if we're close to objective
                distance = abs(self.current_position[0] - objective_position[0]) + \
                          abs(self.current_position[1] - objective_position[1])
                
                if distance <= 1:
                    # Reached objective, let Chronos handle completion
                    await self.chronos_engine.update_character_position(objective_position)
                    logger.info(f"✅ Quest objective reached: {objective_position}")
                    return None
                
                # Generate movement intent toward objective
                return await self.generate_movement_intent(objective_position)
            else:
                # No active quest, fall back to legacy movie script or exploration
                if self.quest_mode:
                    logger.info("🔍 No active quest - checking for available quests")
                    available_quests = self.chronos_engine.get_available_quests()
                    if available_quests:
                        # Auto-accept highest priority quest
                        next_quest = available_quests[0]
                        if await self.chronos_engine.accept_quest(next_quest.quest_id):
                            logger.info(f"📜 Auto-accepted quest: {next_quest.title}")
                            return await self._follow_quest_objective(game_state)
                
                # Fallback to legacy movie script
                return await self._follow_legacy_script(game_state)
                
        except Exception as e:
            logger.error(f"💥 Quest navigation failed: {e}")
            return await self._follow_legacy_script(game_state)
    
    async def _follow_legacy_script(self, game_state: GameState) -> Optional[MovementIntent]:
        """Fallback to original movie script for compatibility"""
        # Check if script is complete, then switch to discovery mode
        if self.current_script_index >= len(self.movie_script):
            logger.info("🚶 Legacy script complete - switching to Interest Point Discovery")
            return await self._discover_next_interest_point()
        
        target_position = self.movie_script[self.current_script_index]
        
        # Check if we're close to target
        distance = abs(self.current_position[0] - target_position[0]) + \
                  abs(self.current_position[1] - target_position[1])
        
        if distance <= 1:
            # Reached target, move to next script position
            logger.info(f"🚶 Script position reached: {target_position}")
            self.current_script_index += 1
            
            # Generate interaction if this is a special location
            if self.current_script_index <= len(self.movie_script):
                return await self._generate_script_interaction(target_position)
            
            return None
        
        # Generate movement intent toward target
        return await self.generate_movement_intent(target_position)
    
    async def _discover_next_interest_point(self) -> Optional[MovementIntent]:
        """Discover next Interest Point when script is complete"""
        try:
            # Query World Engine for nearby undiscovered Interest Points
            if hasattr(self, 'dd_engine') and self.dd_engine.world_engine:
                world_engine = self.dd_engine.world_engine
                interest_points = await world_engine.get_nearby_interest_points(
                    self.current_position, 
                    radius=10  # Search within 10 tiles
                )
                
                # Filter for undiscovered points
                undiscovered = [
                    ip for ip in interest_points 
                    if not ip.discovered and ip.position not in [p for p in self.movie_script]
                ]
                
                if undiscovered:
                    # Choose nearest undiscovered Interest Point
                    nearest = min(undiscovered, key=lambda ip: 
                        abs(ip.position[0] - self.current_position[0]) + 
                        abs(ip.position[1] - self.current_position[1])
                    )
                    
                    logger.info(f"🎯 Discovered new Interest Point: {nearest.interest_type.value} at {nearest.position}")
                    
                    # Add to movie script dynamically
                    self.movie_script.append(nearest.position)
                    
                    # Generate movement intent toward new Interest Point
                    return await self.generate_movement_intent(nearest.position)
                else:
                    # No nearby Interest Points, expand search radius
                    logger.info("🔍 No nearby Interest Points - expanding search")
                    return await self._explore_further()
            else:
                logger.warning("⚠️ World Engine not available for Interest Point discovery")
                return None
                
        except Exception as e:
            logger.error(f"💥 Interest Point discovery failed: {e}")
            return None
    
    async def _explore_further(self) -> Optional[MovementIntent]:
        """Explore further when no nearby Interest Points found"""
        # Generate a random exploration point within reasonable distance
        import random
        
        # Random walk within 20 tiles
        dx = random.randint(-20, 20)
        dy = random.randint(-20, 20)
        
        new_x = max(0, min(49, self.current_position[0] + dx))
        new_y = max(0, min(49, self.current_position[1] + dy))
        
        exploration_point = (new_x, new_y)
        
        logger.info(f"🗺️ Exploring new area: {exploration_point}")
        
        # Add exploration point to script
        self.movie_script.append(exploration_point)
        
        return await self.generate_movement_intent(exploration_point)
    
    async def _generate_script_interaction(self, position: Tuple[int, int]) -> Optional[InteractionIntent]:
        """Generate interaction for special movie locations"""
        interactions = {
            (10, 25): "forest_gate",
            (10, 20): "town_gate",
            (20, 10): "tavern_entrance",
            (25, 30): "tavern_complete"
        }
        
        interaction_type = interactions.get(position)
        if interaction_type:
            return await self.generate_interaction_intent(
                f"location_{position[0]}_{position[1]}",
                interaction_type
            )
        
        return None
    
    # === DISCOVERY AND PONDERING ===
    
    async def handle_discovery(self, interest_point: InterestPoint) -> None:
        """Handle discovery of new Interest Point"""
        self.discovered_interest_points.append(interest_point)
        self.last_discovery_time = time.time()
        
        logger.info(f"🚶 Discovered {interest_point.interest_type.value} at {interest_point.position}")
    
    def _generate_query_context(self, interest_point: InterestPoint) -> str:
        """Generate query context for LLM"""
        context = f"Interest Point at coordinates {interest_point.position} "
        context += f"of type {interest_point.interest_type.value}. "
        context += f"Seed value: {interest_point.seed_value}. "
        context += "Based on the 1,000-year history of this realm, what is this landmark?"
        
        return context
    
    # === STATE MANAGEMENT ===
    
    async def _change_state(self, new_state: VoyagerState) -> None:
        """Change Voyager state"""
        old_state = self.state
        self.state = new_state
        self.state_entered_time = time.time()
        
        logger.info(f"🚶 State changed: {old_state.value} → {new_state.value}")
        
        # Update D&D Engine
        await self.dd_engine.update_voyager_state(new_state)
    
    # === UTILITY METHODS ===
    
    def _get_collision_map(self) -> List[List[bool]]:
        """Get collision map from D&D Engine (synchronous fallback)"""
        # This would normally get from World Engine via D&D Engine
        # For now, return a simple map
        return [[False for _ in range(50)] for _ in range(50)]
    
    def get_navigation_stats(self) -> Dict[str, Any]:
        """Get navigation statistics"""
        return {
            "pathfinding_count": len(self.pathfinding_times),
            "avg_pathfinding_time_ms": sum(self.pathfinding_times) / len(self.pathfinding_times) if self.pathfinding_times else 0,
            "intent_generation_count": len(self.intent_generation_times),
            "avg_intent_generation_time_ms": sum(self.intent_generation_times) / len(self.intent_generation_times) if self.intent_generation_times else 0,
            "goals_completed": len([g for g in self.intent_generator.current_goals if g.is_expired()]),
            "current_path_length": len(self.current_path)
        }
    
    # === LEGACY COMPATIBILITY METHODS ===
    
    def navigate_to_position(self, target_position: Tuple[int, int]) -> bool:
        """Legacy method - navigate to target position"""
        logger.info(f"🧭 Navigating to {target_position}")
        
        try:
            # Generate movement intent
            intent = self.generate_movement_intent(target_position)
            
            if intent:
                # Submit intent
                success = self.submit_intent(intent)
                
                if success:
                    logger.info(f"🎯 Navigation successful: {self.current_position} → {target_position}")
                else:
                    logger.warning(f"❌ Navigation failed: {target_position}")
                
                return success
            else:
                logger.warning(f"❌ Could not generate movement intent to {target_position}")
                return False
                
        except Exception as e:
            logger.error(f"💥 Navigation error: {e}")
            return False
    
    def interact_with_entity(self, entity: str, interaction_type: str,
                           parameters: Optional[Dict[str, Any]] = None) -> bool:
        """Legacy method - interact with entity at current position"""
        logger.info(f"🤝 Interacting with {entity}: {interaction_type}")
        
        try:
            # Generate interaction intent
            intent = self.generate_interaction_intent(entity, interaction_type, parameters)
            
            if intent:
                # Submit intent
                success = self.submit_intent(intent)
                
                if success:
                    logger.info(f"✅ Interaction successful: {entity}")
                else:
                    logger.warning(f"❌ Interaction failed: {entity}")
                
                return success
            else:
                logger.warning(f"❌ Could not generate interaction intent for {entity}")
                return False
                
        except Exception as e:
            logger.error(f"💥 Interaction error: {e}")
            return False
    
    def add_navigation_goal(self, target_position: Tuple[int, int], priority: int = 1,
                           timeout: float = 30.0) -> None:
        """Legacy method - add navigation goal"""
        goal = NavigationGoal(
            target_position=target_position,
            priority=priority,
            timeout=timeout
        )
        self.intent_generator.add_goal(goal)
    
    def process_next_goal(self) -> bool:
        """Legacy method - process next goal"""
        goal = self.intent_generator.get_next_goal()
        
        if not goal:
            return False
        
        logger.debug(f"🎯 Processing goal: {goal.target_position}")
        return self.navigate_to_position(goal.target_position)


# Factory for creating Voyager instances
class Spawner:
    """Factory for creating AIController instances"""
    
    @staticmethod
    def create_controller(config_or_dd_engine, dd_engine=None, chronos_engine=None) -> AIController:
        """Create a AIController with configuration or dependencies"""
        if hasattr(config_or_dd_engine, 'seed'):
            # It's a VoyagerConfig object
            config = config_or_dd_engine
            return AIController(config, dd_engine, chronos_engine)
        else:
            # Legacy mode - first arg is dd_engine
            return AIController(config_or_dd_engine, dd_engine, chronos_engine)
    
    @staticmethod
    def create_test_controller(dd_engine) -> AIController:
        """Create a AIController for testing"""
        controller = AIController(dd_engine)
        # Add test-specific configuration
        return controller


# === SYNCHRONOUS WRAPPER ===

class AIControllerSync:
    """Synchronous wrapper for AIController (for compatibility)"""
    
    def __init__(self, controller: AIController):
        self.controller = controller
        self._loop = asyncio.new_event_loop()
    
    def generate_next_intent(self, game_state: GameState) -> Optional[Union[MovementIntent, InteractionIntent, PonderIntent]]:
        """Synchronous generate_next_intent"""
        return self._loop.run_until_complete(
            self.controller.generate_next_intent(game_state)
        )
    
    def generate_movement_intent(self, target_position: Tuple[int, int]) -> Optional[MovementIntent]:
        """Synchronous generate_movement_intent"""
        return self._loop.run_until_complete(
            self.controller.generate_movement_intent(target_position)
        )
    
    def submit_intent(self, intent: Union[MovementIntent, InteractionIntent, PonderIntent]) -> bool:
        """Synchronous submit_intent"""
        return self._loop.run_until_complete(
            self.controller.submit_intent(intent)
        )
