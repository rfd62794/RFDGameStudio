"""
C-Style API Facades for RPG Core Pillars

Provides simple, game-designer-friendly interfaces for each pillar.
These facades expose the essential functionality without the complexity
of the full async implementations.

Design Principles:
- Simple function calls with clear inputs/outputs
- No async complexity for level designers
- Deterministic behavior for game design tools
- Clear separation between pillars
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

# Import pillar engines
from engines.world import WorldEngine, WorldEngineFactory
from engines.mind import DDEngine, DDEngineFactory
from engines.body import GraphicsEngine, GraphicsEngineFactory
from actors.voyager import Voyager, VoyagerFactory
from narrative.chronos import ChronosEngine, ChronosEngineFactory
from narrative.persona import PersonaEngine, PersonaEngineFactory


# === WORLD PILLAR API (Map Editor) ===

class WorldAPI:
    """C-style API for World Engine - Map Editor Interface"""
    
    def __init__(self, seed: str = "WORLD_SEED"):
        self.engine = WorldEngineFactory.create_world(seed)
    
    def get_tile_map(self, x: int, y: int, width: int, height: int) -> List[List[int]]:
        """Get collision/tile map for specified region"""
        tile_map = []
        for dy in range(height):
            row = []
            for dx in range(width):
                pos = (x + dx, y + dy)
                # Synchronous fallback for API
                tile = self.engine._generate_tile_sync(pos)
                row.append(tile.tile_type.value)
            tile_map.append(row)
        return tile_map
    
    def get_biome_map(self, x: int, y: int, width: int, height: int) -> List[List[str]]:
        """Get biome map for specified region"""
        biome_map = []
        for dy in range(height):
            row = []
            for dx in range(width):
                pos = (x + dx, y + dy)
                biome = self.engine._generate_biome_sync(pos)
                row.append(biome.value)
            biome_map.append(row)
        return biome_map
    
    def get_interest_points(self, x: int, y: int, radius: int) -> List[Dict]:
        """Get interest points in specified area"""
        points = []
        for ip in self.engine.interest_points:
            dist = abs(ip.position[0] - x) + abs(ip.position[1] - y)
            if dist <= radius:
                points.append({
                    "position": ip.position,
                    "type": ip.interest_type.value,
                    "discovered": ip.discovered
                })
        return points
    
    def apply_delta(self, x: int, y: int, delta_type: str, data: Dict) -> bool:
        """Apply world change at position"""
        try:
            from core.state import WorldDelta
            import time
            
            delta = WorldDelta(
                position=(x, y),
                delta_type=delta_type,
                timestamp=time.time(),
                data=data
            )
            self.engine.apply_world_delta(delta)
            return True
        except Exception:
            return False


# === MIND PILLAR API (Rules Judge) ===

class MindAPI:
    """C-style API for D&D Engine - Rules Judge Interface"""
    
    def __init__(self):
        self.engine = DDEngineFactory.create_engine()
    
    def validate_movement(self, from_x: int, from_y: int, to_x: int, to_y: int) -> Dict:
        """Validate movement intent"""
        try:
            from core.state import MovementIntent
            
            intent = MovementIntent(
                intent_type="movement",
                target_position=(to_x, to_y),
                path=[(to_x, to_y)],  # Simple path
                confidence=1.0
            )
            
            # Synchronous validation
            validation = self.engine._validate_movement_intent(intent)
            
            return {
                "legal": validation.is_valid,
                "reason": validation.message,
                "result": validation.validation_result.value
            }
        except Exception as e:
            return {
                "legal": False,
                "reason": str(e),
                "result": "error"
            }
    
    def validate_interaction(self, x: int, y: int, interaction_type: str) -> Dict:
        """Validate interaction intent"""
        try:
            from core.state import InteractionIntent
            
            intent = InteractionIntent(
                intent_type="interaction",
                target_entity=f"location_{x}_{y}",
                interaction_type=interaction_type,
                parameters={}
            )
            
            # Synchronous validation
            validation = self.engine._validate_interaction_intent(intent)
            
            return {
                "legal": validation.is_valid,
                "reason": validation.message,
                "result": validation.validation_result.value
            }
        except Exception as e:
            return {
                "legal": False,
                "reason": str(e),
                "result": "error"
            }
    
    def get_player_position(self) -> Tuple[int, int]:
        """Get current player position"""
        state = self.engine.get_current_state()
        return state.player_position
    
    def get_game_state(self) -> Dict:
        """Get simplified game state"""
        state = self.engine.get_current_state()
        return {
            "player_position": state.player_position,
            "turn_count": state.turn_count,
            "voyager_state": state.voyager_state,
            "active_effects": len(state.active_effects)
        }


# === BODY PILLAR API (VRAM Previewer) ===

class BodyAPI:
    """C-style API for Graphics Engine - VRAM Preview Interface"""
    
    def __init__(self, assets_path: str = "assets/"):
        self.engine = GraphicsEngineFactory.create_engine(assets_path)
    
    def render_frame(self, game_state: Dict) -> List[List[List[int]]]:
        """Render 160x144 frame from game state"""
        try:
            # Convert simple game state to GameState
            from core.state import GameState
            
            state = GameState()
            state.player_position = game_state.get("player_position", (10, 25))
            
            # Render frame (synchronous)
            frame = self.engine.render_frame_sync(state)
            
            # Convert to simple RGB array
            rgb_array = []
            for layer_name, layer_data in frame.layers.items():
                if hasattr(layer_data, 'tolist'):
                    rgb_array.append(layer_data.tolist())
                else:
                    rgb_array.append([[128, 128, 128] * 160] * 144)  # Gray fallback
            
            return rgb_array
        except Exception:
            # Return gray frame on error
            return [[[128, 128, 128] * 160] * 144]
    
    def get_viewport_info(self) -> Dict:
        """Get viewport information"""
        return {
            "width": self.engine.width,
            "height": self.engine.height,
            "target_fps": self.engine.target_fps
        }


# === CHRONOS PILLAR API (Quest Manager) ===

class ChronosAPI:
    """C-style API for Chronos Engine - Quest Manager Interface"""
    
    def __init__(self):
        self.engine = ChronosEngineFactory.create_engine()
    
    def get_current_quest(self) -> Optional[Dict]:
        """Get current active quest"""
        objective = self.engine.quest_stack.get_current_objective()
        if not objective:
            return None
        
        if self.engine.quest_stack.active_quest:
            quest = self.engine.quest_stack.quests[self.engine.quest_stack.active_quest]
            return {
                "id": quest.quest_id,
                "title": quest.title,
                "description": quest.description,
                "target_position": quest.target_position,
                "status": quest.status.value,
                "priority": quest.priority.value
            }
        return None
    
    def get_available_quests(self) -> List[Dict]:
        """Get all available quests"""
        quests = []
        for quest in self.engine.get_available_quests():
            quests.append({
                "id": quest.quest_id,
                "title": quest.title,
                "description": quest.description,
                "target_position": quest.target_position,
                "required_level": quest.required_level,
                "priority": quest.priority.value
            })
        return quests
    
    def accept_quest(self, quest_id: str) -> bool:
        """Accept a quest"""
        return self.engine.quest_stack.activate_quest(quest_id, self.engine.character_stats.level)
    
    def complete_quest(self, quest_id: str) -> bool:
        """Complete current quest"""
        return self.engine.quest_stack.complete_quest(quest_id)
    
    def get_character_stats(self) -> Dict:
        """Get character progression stats"""
        stats = self.engine.character_stats
        return {
            "level": stats.level,
            "experience": stats.experience,
            "experience_to_next": stats.experience_to_next,
            "health": stats.health,
            "max_health": stats.max_health,
            "mana": stats.mana,
            "max_mana": stats.max_mana,
            "strength": stats.strength,
            "dexterity": stats.dexterity,
            "intelligence": stats.intelligence,
            "wisdom": stats.wisdom
        }
    
    def add_main_quest(self, positions: List[Tuple[int, int]]) -> None:
        """Initialize main quest with positions"""
        self.engine.initialize_main_quest(positions)


# === PERSONA PILLAR API (Social Simulator) ===

class PersonaAPI:
    """C-style API for Persona Engine - Social Simulator Interface"""
    
    def __init__(self, world_seed: str = "WORLD_SEED"):
        self.engine = PersonaEngineFactory.create_engine(world_seed)
    
    def create_npc(self, x: int, y: int, npc_type: str = "random") -> Dict:
        """Create NPC at position"""
        npc = self.engine.generate_npc_at_position((x, y), npc_type)
        if npc:
            return {
                "npc_id": npc.npc_id,
                "name": npc.personality.name,
                "position": npc.position,
                "faction": npc.personality.primary_faction.value,
                "sprite_type": npc.sprite_type,
                "sprite_color": npc.sprite_color,
                "special_features": npc.special_features,
                "traits": [trait.value for trait in npc.personality.base_traits],
                "confidence": npc.personality.confidence,
                "talkativeness": npc.personality.talkativeness,
                "generosity": npc.personality.generosity,
                "courage": npc.personality.courage
            }
        return {}
    
    def get_npc_at_position(self, x: int, y: int) -> Optional[Dict]:
        """Get NPC at specific position"""
        npc = self.engine.npc_registry.get_npc_at_position((x, y))
        if npc:
            return {
                "npc_id": npc.npc_id,
                "name": npc.personality.name,
                "current_mood": npc.social_state.current_mood.value,
                "mood_intensity": npc.social_state.mood_intensity,
                "trust_level": npc.social_state.trust_level,
                "interaction_count": npc.social_state.interaction_count,
                "current_activity": npc.daily_routine.current_activity
            }
        return None
    
    def get_npcs_in_area(self, center_x: int, center_y: int, radius: int) -> List[Dict]:
        """Get all NPCs within radius"""
        npcs = self.engine.get_npcs_in_area((center_x, center_y), radius)
        return npcs
    
    def interact_with_npc(self, npc_id: str, interaction_type: str = "talk") -> Dict:
        """Get social response from NPC"""
        response = self.engine.get_social_response(npc_id)
        if response:
            # Update social state based on interaction
            impact = 0.0
            if interaction_type == "friendly":
                impact = 5.0
            elif interaction_type == "hostile":
                impact = -10.0
            elif interaction_type == "trade":
                impact = 2.0
            
            self.engine.update_social_state(npc_id, interaction_type, impact)
            
            return response
        return {}
    
    def get_faction_standing(self, faction1: str, faction2: str) -> Dict:
        """Get relationship between factions"""
        from narrative.persona import FactionType
        
        try:
            f1 = FactionType(faction1)
            f2 = FactionType(faction2)
            
            standing = self.engine.faction_system.get_standing(f1, f2)
            relation = self.engine.faction_system.get_relation_type(f1, f2)
            
            return {
                "standing": standing,
                "relation": relation.value,
                "description": f"{faction1} ↔ {faction2}: {relation.value} ({standing:+.1f})"
            }
        except ValueError:
            return {"error": "Invalid faction name"}
    
    def modify_faction_standing(self, faction1: str, faction2: str, change: float, reason: str = "") -> bool:
        """Modify standing between factions"""
        try:
            from narrative.persona import FactionType
            
            f1 = FactionType(faction1)
            f2 = FactionType(faction2)
            
            self.engine.faction_system.modify_standing(f1, f2, change, reason)
            return True
        except ValueError:
            return False
    
    def seed_location_personas(self, location_type: str, positions: List[Tuple[int, int]]) -> int:
        """Seed NPCs at specific locations"""
        seeded_count = 0
        
        npc_type_map = {
            "tavern": "innkeeper",
            "guard_post": "guard",
            "market": "merchant",
            "temple": "mystic"
        }
        
        base_type = npc_type_map.get(location_type, "patron")
        
        for position in positions:
            npc = self.engine.generate_npc_at_position(position, base_type)
            if npc:
                seeded_count += 1
        
        return seeded_count


# === UNIFIED RPG CORE API ===

class RPGCoreAPI:
    """Unified API for all RPG Core pillars"""
    
    def __init__(self, seed: str = "RPG_SEED"):
        self.world = WorldAPI(seed)
        self.mind = MindAPI()
        self.body = BodyAPI()
        self.chronos = ChronosAPI()
        self.persona = PersonaAPI(seed)
        
        # Connect pillars
        self.mind.engine.set_world_engine(self.world.engine)
        
    # === High-Level Game Design Functions ===
    
    def create_map_region(self, x: int, y: int, width: int, height: int) -> Dict:
        """Create complete map region with all data"""
        return {
            "tiles": self.world.get_tile_map(x, y, width, height),
            "biomes": self.world.get_biome_map(x, y, width, height),
            "interest_points": self.world.get_interest_points(x + width//2, y + height//2, max(width, height))
        }
    
    def validate_action(self, action_type: str, *args) -> Dict:
        """Validate any game action"""
        if action_type == "movement":
            return self.mind.validate_movement(*args)
        elif action_type == "interaction":
            return self.mind.validate_interaction(*args)
        else:
            return {"legal": False, "reason": "Unknown action type", "result": "error"}
    
    def get_game_snapshot(self) -> Dict:
        """Get complete game state snapshot"""
        return {
            "player": self.mind.get_player_position(),
            "state": self.mind.get_game_state(),
            "character": self.chronos.get_character_stats(),
            "current_quest": self.chronos.get_current_quest(),
            "available_quests": self.chronos.get_available_quests()
        }
    
    def render_current_view(self) -> List[List[List[int]]]:
        """Render current game view"""
        game_state = self.mind.get_game_state()
        return self.body.render_frame(game_state)


# === FACTORY FUNCTIONS ===

def create_world_editor(seed: str = "WORLD_SEED") -> WorldAPI:
    """Create World Editor API instance"""
    return WorldAPI(seed)

def create_rules_judge() -> MindAPI:
    """Create Rules Judge API instance"""
    return MindAPI()

def create_vram_previewer(assets_path: str = "assets/") -> BodyAPI:
    """Create VRAM Previewer API instance"""
    return BodyAPI(assets_path)

def create_quest_manager() -> ChronosAPI:
    """Create Quest Manager API instance"""
    return ChronosAPI()

def create_social_simulator(world_seed: str = "WORLD_SEED") -> PersonaAPI:
    """Create Social Simulator API instance"""
    return PersonaAPI(world_seed)

def create_rpg_core(seed: str = "RPG_SEED") -> RPGCoreAPI:
    """Create complete RPG Core API instance"""
    return RPGCoreAPI(seed)


# === USAGE EXAMPLES ===

"""
# Level Designer Usage Examples

# 1. Create a map editor
world = create_world_editor("TAVEN_SEED")
tile_map = world.get_tile_map(0, 0, 20, 20)
biome_map = world.get_biome_map(0, 0, 20, 20)

# 2. Validate game actions
mind = create_rules_judge()
movement_check = mind.validate_movement(10, 10, 11, 10)
interaction_check = mind.validate_interaction(11, 10, "open_door")

# 3. Preview game graphics
body = create_vram_previewer()
game_state = mind.get_game_state()
frame = body.render_frame(game_state)

# 4. Manage quests
quests = create_quest_manager()
current_quest = quests.get_current_quest()
character_stats = quests.get_character_stats()

# 5. Social simulation
persona = create_social_simulator("TAVERN_SEED")
innkeeper = persona.create_npc(25, 30, "innkeeper")
social_response = persona.interact_with_npc(innkeeper["npc_id"], "friendly")
faction_standing = persona.get_faction_standing("player", "merchant")

# 6. Complete RPG Core
rpg = create_rpg_core("TAVERN_SEED")
map_region = rpg.create_map_region(0, 0, 50, 50)
action_check = rpg.validate_action("movement", 10, 10, 15, 15)
game_snapshot = rpg.get_game_snapshot()
current_view = rpg.render_current_view()

# 7. Tavern quest workflow
tavern_npc = persona.create_npc(25, 30, "innkeeper")
if tavern_npc:
    response = persona.interact_with_npc(tavern_npc["npc_id"], "talk")
    if response.get("will_help", 0) > 0.3:
        # NPC gives quest
        new_quest = quests.get_available_quests()[0]
        quests.accept_quest(new_quest["id"])
"""
