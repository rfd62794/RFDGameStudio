"""
Unified Tactical-Narrative Dashboard

Phase 7: Complete Synthetic Reality Implementation
Manages the 70/30 split between 3D Viewport and Director's Monitor with Dialogue.

ADR 024: The Unified Tactical-Narrative Layout Implementation
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align

from ui.renderer_3d import ASCIIDoomRenderer
from ui.layout_manager import DirectorMonitor
from world_ledger import WorldLedger
from game_state import GameState
from logic.faction_system import FactionSystem


class DashboardLayout(Enum):
    """Layout configurations for the unified dashboard."""
    RAYCAST_DOMINANT = "raycast_dominant"  # 70% raycast, 30% dialogue
    BALANCED = "balanced"  # 50/50 split
    MONITOR_DOMINANT = "monitor_dominant"  # 30% raycast, 70% monitor


@dataclass
class DialogueMessage:
    """A dialogue message in the conversation feed."""
    speaker: str
    text: str
    turn: int
    mood: str = "neutral"
    is_player: bool = False
    visual_effect: Optional[str] = None


class ConversationEngine:
    """
    Non-LLM logic handler for NPC conversations.
    
    Calculates NPC mood based on faction tension and player reputation.
    """
    
    def __init__(self, faction_system: FactionSystem):
        """Initialize the conversation engine."""
        self.faction_system = faction_system
        self.conversation_history: List[DialogueMessage] = []
        self.max_history = 50
        
        # Mood calculation weights
        self.reputation_weight = 0.4
        self.faction_tension_weight = 0.3
        self.situational_weight = 0.3
        
        logger.info("Conversation Engine initialized")
    
    def calculate_npc_mood(self, npc_name: str, player_reputation: Dict[str, int], 
                          coordinate: Tuple[int, int]) -> str:
        """
        Calculate NPC mood based on faction tension and player reputation.
        
        Args:
            npc_name: Name of the NPC
            player_reputation: Player's reputation with factions
            coordinate: Current coordinate
            
        Returns:
            Mood string (hostile, unfriendly, neutral, friendly, helpful)
        """
        # Get faction at coordinate
        from world_ledger import Coordinate
        faction = self.faction_system.get_faction_at_coordinate(
            Coordinate(coordinate[0], coordinate[1], 0)
        )
        
        # Calculate mood components
        mood_score = 0.0
        
        if faction:
            # Reputation component (40% weight)
            rep_score = player_reputation.get(faction.id, 0)
            mood_score += (rep_score / 100.0) * self.reputation_weight
            
            # Faction tension component (30% weight)
            # Check faction relations to determine baseline tension
            relations = self.faction_system.get_faction_relations(faction.id)
            
            # Calculate tension from faction relationships
            tension_score = 0.0
            for other_faction, relation in relations.items():
                if relation.value == "hostile":
                    tension_score -= 0.5
                elif relation.value == "war":
                    tension_score -= 0.7
                elif relation.value == "allied":
                    tension_score += 0.3
                elif relation.value == "friendly":
                    tension_score += 0.2
            
            # Normalize tension score and apply weight
            tension_score = max(-1.0, min(1.0, tension_score / len(relations) if relations else 0))
            mood_score += tension_score * self.faction_tension_weight
            
            # Faction type modifier (30% weight)
            # Different faction types have different baseline dispositions
            faction_type_modifiers = {
                "military": -0.1,  # Military factions are more suspicious
                "religious": 0.0,   # Religious factions are neutral
                "economic": 0.2,   # Economic factions are more welcoming
                "political": -0.05, # Political factions are slightly suspicious
                "mystical": 0.1     # Mystical factions are slightly welcoming
            }
            
            faction_modifier = faction_type_modifiers.get(faction.type.value, 0.0)
            mood_score += faction_modifier * self.situational_weight
            
            # Apply faction-specific reputation scaling
            # Military factions care more about law reputation
            # Economic factions care more about underworld reputation
            # Religious factions care more about clergy reputation
            reputation_scaling = 1.0
            
            if faction.type.value == "military":
                law_rep = player_reputation.get("law", 0)
                reputation_scaling = 1.0 + (law_rep / 100.0) * 0.5
            elif faction.type.value == "economic":
                underworld_rep = player_reputation.get("underworld", 0)
                reputation_scaling = 1.0 + (underworld_rep / 100.0) * 0.3
            elif faction.type.value == "religious":
                clergy_rep = player_reputation.get("clergy", 0)
                reputation_scaling = 1.0 + (clergy_rep / 100.0) * 0.4
            
            mood_score *= reputation_scaling
        
        # Convert score to mood
        if mood_score <= -0.6:
            return "hostile"
        elif mood_score <= -0.3:
            return "unfriendly"
        elif mood_score <= 0.3:
            return "neutral"
        elif mood_score <= 0.6:
            return "friendly"
        else:
            return "helpful"
    
    def generate_npc_response(self, npc_name: str, player_action: str, 
                           mood: str, context: Dict[str, Any]) -> DialogueMessage:
        """
        Generate NPC response based on mood and context.
        
        Args:
            npc_name: Name of the NPC
            player_action: What the player did
            mood: Current NPC mood
            context: Context information
            
        Returns:
            DialogueMessage with NPC response
        """
        # Pre-baked response templates by mood
        response_templates = {
            "hostile": [
                f"{npc_name} scowls and draws a weapon.",
                f"{npc_name} says: 'Get out of my sight!'",
                f"{npc_name} glares menacingly."
            ],
            "unfriendly": [
                f"{npc_name} narrows their eyes.",
                f"{npc_name} says: 'What do you want?'",
                f"{npc_name} crosses their arms."
            ],
            "neutral": [
                f"{npc_name} watches you cautiously.",
                f"{npc_name} nods slightly.",
                f"{npc_name} remains silent."
            ],
            "friendly": [
                f"{npc_name} smiles warmly.",
                f"{npc_name} says: 'Greetings, traveler.'",
                f"{npc_name} seems approachable."
            ],
            "helpful": [
                f"{npc_name} beams with enthusiasm.",
                f"{npc_name} says: 'How can I help you?'",
                f"{npc_name} gestures welcomingly."
            ]
        }
        
        # Select response based on mood
        templates = response_templates.get(mood, response_templates["neutral"])
        response_text = templates[hash(npc_name + player_action) % len(templates)]
        
        return DialogueMessage(
            speaker=npc_name,
            text=response_text,
            turn=len(self.conversation_history),
            mood=mood,
            is_player=False
        )
    
    def add_player_message(self, text: str, turn: int) -> DialogueMessage:
        """Add a player message to the conversation."""
        message = DialogueMessage(
            speaker="You",
            text=text,
            turn=turn,
            mood="neutral",
            is_player=True
        )
        
        self.conversation_history.append(message)
        return message
    
    def add_npc_message(self, message: DialogueMessage):
        """Add an NPC message to the conversation."""
        self.conversation_history.append(message)
        
        # Limit history size
        if len(self.conversation_history) > self.max_history:
            self.conversation_history = self.conversation_history[-self.max_history:]
    
    def get_recent_messages(self, count: int = 5) -> List[DialogueMessage]:
        """Get the most recent messages."""
        return self.conversation_history[-count:]
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get summary of the conversation."""
        if not self.conversation_history:
            return {"total_messages": 0, "last_speaker": None}
        
        return {
            "total_messages": len(self.conversation_history),
            "last_speaker": self.conversation_history[-1].speaker,
            "last_mood": self.conversation_history[-1].mood,
            "player_messages": sum(1 for msg in self.conversation_history if msg.is_player),
            "npc_messages": sum(1 for msg in self.conversation_history if not msg.is_player)
        }


class UnifiedDashboard:
    """
    Unified dashboard managing 3D viewport, dialogue, and monitor.
    
    Provides the complete synthetic reality interface.
    """
    
    def __init__(self, world_ledger: WorldLedger, faction_system: FactionSystem):
        """Initialize the unified dashboard."""
        self.world_ledger = world_ledger
        self.faction_system = faction_system
        
        # Initialize components
        self.renderer = ASCIIDoomRenderer(world_ledger, width=80, height=24)
        self.monitor = DirectorMonitor(world_ledger)
        self.conversation_engine = ConversationEngine(faction_system)
        
        # Layout configuration
        self.layout = DashboardLayout.RAYCAST_DOMINANT
        self.console = Console()
        
        # UI state
        self.current_frame = None
        self.current_dialogue = []
        self.player_angle = 0.0
        self.perception_range = 10
        
        logger.info("Unified Dashboard initialized")
    
    def render_dashboard(self, game_state: GameState) -> Layout:
        """
        Render the complete dashboard with all components.
        
        Args:
            game_state: Current game state
            
        Returns:
            Rich Layout object with all panels
        """
        # Update player angle from game state
        self.player_angle = game_state.player_angle
        
        # Calculate perception range from player stats
        wisdom = game_state.player.attributes.get("wisdom", 10)
        intelligence = game_state.player.attributes.get("intelligence", 10)
        self.perception_range = max(5, (wisdom + intelligence) // 2)
        
        # Render 3D viewport
        # Get current NPC mood for threat indicators
        current_npc_mood = None
        faction = self.faction_system.get_faction_at_coordinate(game_state.position)
        if faction:
            current_npc_mood = self.conversation_engine.calculate_npc_mood(
                "Guard", game_state.reputation, 
                (game_state.position.x, game_state.position.y)
            )
            
            # Enable threat mode if NPC is hostile
            self.renderer.set_threat_mode(current_npc_mood in ["hostile", "unfriendly"])
        
        frame = self.renderer.render_frame(
            game_state, 
            self.player_angle, 
            self.perception_range,
            current_npc_mood
        )
        self.current_frame = frame
        
        # Convert frame to string
        frame_str = self.renderer.get_frame_as_string(frame)
        
        # Create 3D viewport panel
        viewport_panel = Panel(
            Text(frame_str, style="dim"),
            title="3D Viewport",
            border_style="blue",
            padding=(0, 0)
        )
        
        # Create conversation panel
        recent_messages = self.conversation_engine.get_recent_messages(5)
        conversation_lines = []
        
        for msg in recent_messages:
            speaker_style = "bold blue" if msg.is_player else "bold green"
            mood_style = {
                "hostile": "red",
                "unfriendly": "yellow",
                "neutral": "white",
                "friendly": "green",
                "helpful": "cyan"
            }.get(msg.mood, "white")
            
            line = f"[{speaker_style}]{msg.speaker}:[/{mood_style}] {msg.text}"
            conversation_lines.append(line)
        
        conversation_text = "\n".join(conversation_lines) if conversation_lines else "No conversation yet..."
        
        conversation_panel = Panel(
            Text(conversation_text, style="dim"),
            title="Dialogue",
            border_style="green",
            padding=(1, 1)
        )
        
        # Create monitor panel
        from d20_core import D20Result
        
        # Create a dummy D20Result for the monitor
        dummy_result = D20Result(
            success=True,
            roll=10,
            total_score=15,
            difficulty_class=12,
            hp_delta=0,
            reputation_deltas={},
            relationship_changes={},
            npc_state_changes={},
            goals_completed=[],
            narrative_context="Test action"
        )
        
        monitor_content = self.monitor.update_monitor(
            dummy_result,
            active_goals=game_state.goal_stack,
            completed_goals=game_state.completed_goals,
            legacy_context=None
        )
        
        monitor_panel = Panel(
            monitor_content,
            title="Director's Monitor",
            border_style="yellow",
            padding=(1, 1)
        )
        
        # Create status panel
        status_table = Table(show_header=False, box=None)
        status_table.add_column("Position", justify="left")
        status_table.add_column("Direction", justify="center")
        status_table.add_column("Perception", justify="center")
        status_table.add_column("Mood", justify="center")
        
        # Get current position and direction
        direction_map = {
            0: "North", 45: "NE", 90: "East", 135: "SE", 
            180: "South", 225: "SW", 270: "West", 315: "NW"
        }
        
        direction = "Unknown"
        for angle, name in direction_map.items():
            if abs(self.player_angle - angle) < 22.5:
                direction = name
                break
        
        # Get NPC mood at current location
        npc_mood = "Unknown"
        faction = self.faction_system.get_faction_at_coordinate(game_state.position)
        if faction:
            npc_mood = self.conversation_engine.calculate_npc_mood(
                "Guard", game_state.reputation, 
                (game_state.position.x, game_state.position.y)
            )
        
        status_table.add_row(
            f"({game_state.position.x}, {game_state.position.y})",
            direction,
            f"{self.perception_range}",
            npc_mood
        )
        
        status_panel = Panel(
            status_table,
            title="Status",
            border_style="cyan",
            padding=(1, 1)
        )
        
        # Create layout based on configuration
        if self.layout == DashboardLayout.RAYCAST_DOMINANT:
            # 70% raycast, 30% dialogue/monitor
            left_layout = Layout()
            left_layout.split_column(
                Layout(viewport_panel, name="3d_viewport"),
                Layout(name="info").split_row(
                    Layout(conversation_panel, name="dialogue"),
                    Layout(status_panel, name="status")
                )
            )
            
            right_layout = Layout()
            right_layout.split_column(
                Layout(monitor_panel, name="monitor")
            )
            
            main_layout = Layout()
            main_layout.split_row(left_layout, right_layout)
            
        elif self.layout == DashboardLayout.BALANCED:
            # 50/50 split
            left_layout = Layout()
            left_layout.split_column(
                Layout(viewport_panel, name="3d_viewport"),
                Layout(conversation_panel, name="dialogue")
            )
            
            right_layout = Layout()
            right_layout.split_column(
                Layout(monitor_panel, name="monitor"),
                Layout(status_panel, name="status")
            )
            
            main_layout = Layout()
            main_layout.split_row(left_layout, right_layout)
            
        else:  # MONITOR_DOMINANT
            left_layout = Layout()
            left_layout.split_column(
                Layout(viewport_panel, name="3d_viewport"),
                Layout(status_panel, name="status")
            )
            
            right_layout = Layout()
            right_layout.split_column(
                Layout(conversation_panel, name="dialogue"),
                Layout(monitor_panel, name="monitor")
            )
            
            main_layout = Layout()
            main_layout.split_row(left_layout, right_layout)
        
        return main_layout
    
    def handle_player_action(self, action: str, game_state: GameState) -> Optional[DialogueMessage]:
        """
        Handle a player action and generate appropriate response.
        
        Args:
            action: Player action description
            game_state: Current game state
            
        Returns:
            NPC response message if applicable
        """
        # Add player message
        player_msg = self.conversation_engine.add_player_message(
            action, 
            len(self.conversation_engine.conversation_history)
        )
        
        # Generate NPC response if there's an NPC nearby
        faction = self.faction_system.get_faction_at_coordinate(game_state.position)
        if faction:
            npc_mood = self.conversation_engine.calculate_npc_mood(
                "Guard", game_state.reputation,
                (game_state.position.x, game_state.position.y)
            )
            
            npc_msg = self.conversation_engine.generate_npc_response(
                "Guard", action, npc_mood, {"faction": faction.name}
            )
            
            self.conversation_engine.add_npc_message(npc_msg)
            return npc_msg
        
        return None
    
    def update_layout(self, layout: DashboardLayout):
        """Update the dashboard layout configuration."""
        self.layout = layout
        logger.info(f"Dashboard layout updated to: {layout.value}")
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get summary of dashboard state."""
        return {
            "layout": self.layout.value,
            "viewport_size": f"{self.renderer.width}x{self.renderer.height}",
            "fov": f"{self.renderer.fov}°",
            "player_angle": self.player_angle,
            "perception_range": self.perception_range,
            "conversation_summary": self.conversation_engine.get_conversation_summary()
        }


# Export for use by game engine
__all__ = ["UnifiedDashboard", "DashboardLayout", "ConversationEngine", "DialogueMessage"]
