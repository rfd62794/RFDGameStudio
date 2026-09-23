"""
Synthetic Reality Engine: Cinematic Orchestrator

The enhanced orchestrator that integrates all seven phases of engineering into a
cohesive cinematic experience. Provides narrated journeys with historical context
and spatial awareness.

Flow: World Bake → Avatar Instantiation → 3D Rendering → Narrated Journey
"""

import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List

from loguru import logger
from rich.console import Console
from rich.panel import Panel
from rich.live import Live

from game_state import GameState
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate
from dgt_engine.logic.faction_system import FactionSystem
from dgt_engine.logic.orientation import OrientationManager
from dgt_engine.ui.dashboard import UnifiedDashboard, DashboardLayout
from dgt_engine.engine.chronos import ChronosEngine
from dgt_engine.foundation.utils.historian import Historian, WorldSeed
from dgt_engine.ui.renderer_3d import ASCIIDoomRenderer
from dgt_engine.engine.d20_core import D20Resolver, D20Result
from dgt_engine.logic.artifacts import ArtifactGenerator
from dgt_engine.game_engine.loot_system import LootSystem


class SyntheticRealityEngine:
    """
    Cinematic Orchestrator - integrates all seven phases of engineering.
    
    Provides narrated journeys with historical context and spatial awareness.
    """
    
    def __init__(
        self,
        state: Optional[GameState] = None,
        save_path: Optional[Path] = None,
        cinematic_mode: bool = True
    ):
        """Initialize the Synthetic Reality Engine with all systems."""
        self.console = Console()
        self.save_path = save_path or Path("savegame.json")
        self.cinematic_mode = cinematic_mode
        
        # Core systems
        self.world_ledger = WorldLedger()
        self.faction_system = FactionSystem(self.world_ledger)
        self.chronos = ChronosEngine(self.world_ledger)
        self.historian = Historian(self.world_ledger)
        self.d20_resolver = D20Resolver(self.faction_system)
        self.artifact_generator = ArtifactGenerator(self.world_ledger, self.faction_system)
        self.loot_system = LootSystem(self.world_ledger, self.faction_system)
        
        # Presentation systems
        self.dashboard = UnifiedDashboard(self.world_ledger, self.faction_system)
        self.renderer = ASCIIDoomRenderer(self.world_ledger)
        self.orientation_manager = OrientationManager()
        
        # Initialize game state
        self.state = state or self._create_fresh_state()
        
        # Cinematic settings
        self.scene_duration = 2.0
        self.narration_enabled = True
        
        logger.info("Synthetic Reality Engine initialized with cinematic orchestrator")
    
    def _create_fresh_state(self) -> GameState:
        """Create fresh game state with synthetic reality integration."""
        from game_state import PlayerStats
        
        player = PlayerStats(
            name="Synthetic Voyager",
            attributes={"strength": 12, "dexterity": 14, "constitution": 13, "intelligence": 11, "wisdom": 10, "charisma": 12},
            hp=100,
            max_hp=100,
            gold=100
        )
        
        state = GameState(player=player)
        state.position = Coordinate(0, 0, 0)
        state.player_angle = 0.0
        state.world_time = 0
        
        # Set initial reputation
        state.reputation = {
            "law": 10,
            "underworld": 0,
            "clergy": 5,
            "legion": 25,
            "cult": -10,
            "traders": 15
        }
        
        return state
    
    def bake_world(self) -> bool:
        """Phase 1: World Baking - Create the sedimentary world with 1,000-year history."""
        try:
            # Create factions
            faction_configs = [
                {
                    "id": "legion",
                    "name": "The Iron Legion",
                    "type": "military",
                    "color": "red",
                    "home_base": [0, 0],
                    "current_power": 0.8,
                    "relations": {"cult": "hostile", "traders": "neutral"},
                    "goals": ["expand_territory", "defend_borders"],
                    "expansion_rate": 0.2,
                    "aggression_level": 0.9
                },
                {
                    "id": "cult",
                    "name": "The Shadow Cult",
                    "type": "religious",
                    "color": "purple",
                    "home_base": [10, 10],
                    "current_power": 0.6,
                    "relations": {"legion": "hostile", "traders": "neutral"},
                    "goals": ["convert_followers", "establish_shrines"],
                    "expansion_rate": 0.1,
                    "aggression_level": 0.7
                },
                {
                    "id": "traders",
                    "name": "The Merchant Guild",
                    "type": "economic",
                    "color": "gold",
                    "home_base": [-5, -5],
                    "current_power": 0.7,
                    "relations": {"legion": "neutral", "cult": "neutral"},
                    "goals": ["establish_trade_routes", "accumulate_wealth"],
                    "expansion_rate": 0.3,
                    "aggression_level": 0.3
                }
            ]
            
            factions = self.faction_system.create_factions(faction_configs)
            
            # Simulate faction history
            for turn in range(0, 100, 10):
                self.faction_system.simulate_factions(turn)
            
            # Initialize world chunks
            for x in range(-10, 11):
                for y in range(-10, 11):
                    coord = Coordinate(x, y, 0)
                    chunk = self.world_ledger.get_chunk(coord, 0)
            
            logger.info("World baking complete - synthetic reality ready")
            return True
            
        except Exception as e:
            logger.error(f"World baking failed: {e}")
            return False
    
    def generate_historical_narration(self, coordinate: Coordinate) -> str:
        """Generate narration about historical context at current location."""
        try:
            # Get historical context
            historical_tags = self.world_ledger.get_historical_tags(coordinate)
            
            if not historical_tags:
                return "This area appears untouched by the great events of history."
            
            # Generate narrative based on historical tags
            narratives = []
            
            for tag in historical_tags:
                if "war" in tag.lower():
                    narratives.append("The echoes of ancient battles still linger in this place.")
                elif "peace" in tag.lower():
                    narratives.append("This land has known long periods of peace and prosperity.")
                elif "disaster" in tag.lower():
                    narratives.append("Catastrophe once reshaped this landscape, leaving scars that time cannot heal.")
                elif "discovery" in tag.lower():
                    narratives.append("Great discoveries were made here, changing the course of history.")
                elif "mystery" in tag.lower():
                    narratives.append("This place holds secrets that have yet to be uncovered.")
            
            if narratives:
                return " ".join(narratives[:2])  # Limit to 2 narratives
            else:
                return f"This location bears the marks of: {', '.join(historical_tags[:3])}"
                
        except Exception as e:
            logger.error(f"Historical narration failed: {e}")
            return "The history of this place is shrouded in mystery."
    
    def generate_artifact_commentary(self, artifact) -> str:
        """Generate commentary about discovered artifacts."""
        try:
            if not artifact:
                return "No artifacts of note are visible here."
            
            commentary = f"You discover {artifact.name}, "
            
            # Add lineage information
            if hasattr(artifact, 'lineage') and artifact.lineage:
                commentary += f"crafted in {artifact.lineage.get('epoch', 'unknown times')}. "
            
            # Add faction context
            if hasattr(artifact, 'faction_affinity') and artifact.faction_affinity:
                faction_name = artifact.faction_affinity.value.title()
                commentary += f"It bears the mark of the {faction_name}. "
            
            # Add special properties
            if hasattr(artifact, 'special_properties') and artifact.special_properties:
                properties = ", ".join(artifact.special_properties)
                commentary += f"It seems {properties}. "
            
            # Add value
            if hasattr(artifact, 'value') and artifact.value:
                commentary += f"Such an item would be worth approximately {artifact.value} gold coins."
            
            return commentary
            
        except Exception as e:
            logger.error(f"Artifact commentary failed: {e}")
            return "The artifact's significance eludes you for now."
    
    def render_cinematic_scene(self, scene_name: str, description: str, duration: float = None):
        """Render a cinematic scene with 3D view and narration."""
        if duration is None:
            duration = self.scene_duration
        
        # Get current NPC mood for threat indicators
        current_npc_mood = None
        faction = self.faction_system.get_faction_at_coordinate(self.state.position)
        if faction:
            current_npc_mood = self.dashboard.conversation_engine.calculate_npc_mood(
                "Guard", self.state.reputation, 
                (self.state.position.x, self.state.position.y)
            )
            self.renderer.set_threat_mode(current_npc_mood in ["hostile", "unfriendly"])
        
        # Calculate perception range
        wisdom = self.state.player.attributes.get("wisdom", 10)
        intelligence = self.state.player.attributes.get("intelligence", 10)
        perception_range = max(5, (wisdom + intelligence) // 2)
        
        # Render 3D viewport
        frame = self.renderer.render_frame(
            self.state, 
            self.state.player_angle, 
            perception_range,
            current_npc_mood
        )
        
        # Convert frame to string
        frame_str = self.renderer.get_frame_as_string(frame)
        
        # Display scene
        self.console.print(f"\n🎬 [bold cyan]SCENE: {scene_name}[/bold cyan]")
        self.console.print(f"📝 {description}")
        self.console.print("-" * 60)
        
        # Show 3D view
        self.console.print("🎮 [bold green]3D VIEWPORT:[/bold green]")
        self.console.print(frame_str)
        
        # Show status
        self.console.print(f"📍 Position: ({self.state.position.x}, {self.state.position.y})")
        self.console.print(f"🧭 Facing: {self.orientation_manager.get_facing_direction()}")
        self.console.print(f"👁️  Perception: {perception_range}")
        
        if current_npc_mood:
            self.console.print(f"😊 NPC Mood: {current_npc_mood}")
        
        # Generate historical narration
        if self.narration_enabled:
            historical_narration = self.generate_historical_narration(self.state.position)
            self.console.print(f"\n📚 [bold yellow]HISTORICAL CONTEXT:[/bold yellow]")
            self.console.print(historical_narration)
            
            # Check for artifacts
            artifact = self.artifact_generator.generate_artifact(self.state.position, self.state.world_time)
            if artifact:
                artifact_commentary = self.generate_artifact_commentary(artifact)
                self.console.print(f"\n🏺️ [bold magenta]ARTIFACT DISCOVERED:[/bold magenta]")
                self.console.print(artifact_commentary)
        
        # Wait for scene duration
        if not self.cinematic_mode:
            input("\n[Press Enter to continue...]")
        else:
            import time
            time.sleep(duration)
    
    async def process_action_with_narration(self, player_input: str) -> bool:
        """Process action with cinematic narration and historical context."""
        # Handle meta commands
        if player_input.lower() in ["quit", "exit", "q"]:
            return False
        
        if player_input.lower() in ["save"]:
            self.state.save_to_file(self.save_path)
            self.console.print("[green]Game saved![/green]")
            return True
        
        # Generate historical context for action
        historical_context = self.generate_historical_narration(self.state.position)
        
        # Process movement actions
        if player_input.lower() == "look":
            self.render_cinematic_scene(
                "Observation",
                f"You survey your surroundings. {historical_context}",
                duration=1.0
            )
            return True
        
        elif player_input.lower() == "turn left":
            self.orientation_manager.turn_left()
            self.state.player_angle = self.orientation_manager.get_orientation().angle
            self.render_cinematic_scene(
                "Turning Left",
                f"You turn left. Now facing {self.orientation_manager.get_facing_direction()}. {historical_context}",
                duration=0.5
            )
            return True
        
        elif player_input.lower() == "turn right":
            self.orientation_manager.turn_right()
            self.state.player_angle = self.orientation_manager.get_orientation().angle
            self.render_cinematic_scene(
                "Turning Right",
                f"You turn right. Now facing {self.orientation_manager.get_facing_direction()}. {historical_context}",
                duration=0.5
            )
            return True
        
        elif player_input.lower() == "move forward":
            new_pos = self.orientation_manager.move_forward()
            old_pos = self.state.position
            self.state.position = Coordinate(new_pos.x, new_pos.y, 0)
            
            # Check for artifacts at new position
            artifact = self.artifact_generator.generate_artifact(self.state.position, self.state.world_time)
            
            scene_description = f"You move forward from ({old_pos.x}, {old_pos.y}) to ({new_pos.x}, {new_pos.y})."
            
            if artifact:
                scene_description += f" You discover {artifact.name}!"
            
            self.render_cinematic_scene(
                "Movement",
                f"{scene_description} {historical_context}",
                duration=1.0
            )
            return True
        
        elif player_input.lower() == "talk":
            # Handle dialogue with historical context
            npc_response = self.dashboard.handle_player_action(
                "Greetings, I come in peace to learn about this place.",
                self.state
            )
            
            if npc_response:
                self.render_cinematic_scene(
                    "Dialogue",
                    f"You attempt to converse with the locals. {npc_response.text} {historical_context}",
                    duration=2.0
                )
            else:
                self.render_cinematic_scene(
                    "Dialogue",
                    f"You call out, but no one responds to your words. {historical_context}",
                    duration=1.5
                )
            return True
        
        # Default action
        self.render_cinematic_scene(
            "Action",
            f"You attempt to {player_input}. {historical_context}",
            duration=1.5
        )
        
        return True
    
    def cleanup(self):
        """Clean up resources when shutting down."""
        logger.info("Synthetic Reality Engine shutting down")
    
    async def process_action(self, player_input: str) -> bool:
        """
        Main action processing pipeline.
        
        Returns:
            True to continue game, False to quit
        """
        # Handle meta commands
        if player_input.lower() in ["quit", "exit", "q"]:
            return False
        
        if player_input.lower() in ["save"]:
            self.state.save_to_file(self.save_path)
            self.console.print("[green]Game saved![/green]")
            return True
        
        # Step 1: Sense - Resolve intent
        self.console.print("[dim]🔍 Resolving intent...[/dim]")
        intent_match = self.semantic_resolver.resolve_intent(player_input)
        
        if not intent_match:
            self.console.print(
                "[red]❌ I don't understand that action. Try rephrasing?[/red]"
            )
            return True
        
        self.console.print(
            f"[cyan]🎲 Intent: {intent_match.intent_id} "
            f"(confidence: {intent_match.confidence:.2f})[/cyan]"
        )
        
        # Step 2: Resolve - D20 Core calculations
        self.console.print("[dim]⚖️  D20 Core calculating...[/dim]")
        
        room = self.state.rooms.get(self.state.current_room)
        room_tags = room.tags if room else []
        
        # Detect target NPC
        target_npc = self._detect_target_npc(player_input, room)
        
        d20_result = self.d20_resolver.resolve_action(
            intent_id=intent_match.intent_id,
            player_input=player_input,
            game_state=self.state,
            room_tags=room_tags,
            target_npc=target_npc
        )
        
        self.console.print(
            f"[dim]🎲 Math: {d20_result.total_score} vs DC {d20_result.difficulty_class} "
            f"({'SUCCESS' if d20_result.success else 'FAILURE'})[/dim]"
        )
        
        # Step 3: Act - Apply state changes
        self._apply_d20_result(d20_result, intent_match.intent_id, player_input)
        
        # Step 4: Check for loot
        loot_item = self._check_for_loot(d20_result, intent_match.intent_id, room)
        
        # Step 5: Narrate - Generate narrative
        if self.use_dashboard:
            # Update dashboard with D20 result immediately (instant feedback)
            self.dashboard.update_dashboard(
                narrative_content="Generating narrative...",
                d20_result=d20_result,
                context=self.state.get_context_str(),
                active_goals=self.state.goal_stack,
                completed_goals=[],
                success=d20_result.success
            )
        
        final_narrative = await self._narrate_outcome(player_input, intent_match.intent_id, d20_result, loot_item)
        
        # Step 6: Update dashboard with final narrative
        if self.use_dashboard:
            self.dashboard.update_dashboard(
                narrative_content=final_narrative,
                d20_result=d20_result,
                context=self.state.get_context_str(),
                active_goals=self.state.goal_stack,
                completed_goals=d20_result.goals_completed,
                success=d20_result.success
            )
        
        # Step 7: Auto-save
        self.state.save_to_file(self.save_path)
        
        # Step 8: Check win/loss conditions
        return self._check_game_over()
    
    def _detect_target_npc(self, player_input: str, room) -> Optional[str]:
        """Detect which NPC the player is targeting."""
        if not room or not room.npcs:
            return None
        
        input_lower = player_input.lower()
        
        # Check for explicit NPC names
        for npc in room.npcs:
            if npc.name.lower() in input_lower:
                return npc.name
        
        # If only one NPC, assume that's the target
        if len(room.npcs) == 1:
            return room.npcs[0].name
        
        return None
    
    def _apply_d20_result(self, result: D20Result, intent_id: str, player_input: str):
        """Apply all state changes from D20 resolution."""
        # Apply HP changes
        if result.hp_delta != 0:
            if result.hp_delta < 0:
                self.state.player.take_damage(abs(result.hp_delta))
            else:
                self.state.player.heal(result.hp_delta)
        
        # Apply reputation changes
        for faction, delta in result.reputation_deltas.items():
            self.state.reputation[faction] = self.state.reputation.get(faction, 0) + delta
            if delta != 0:
                self.console.print(
                    f"[bold yellow]⚖️ Reputation: {faction.replace('_', ' ').title()} "
                    f"{'increased' if delta > 0 else 'decreased'}! ({self.state.reputation[faction]})[/bold yellow]"
                )
        
        # Apply relationship changes
        for npc_id, changes in result.relationship_changes.items():
            self.state.update_relationship(
                self.state.current_room,
                npc_id,
                delta_disposition=changes["disposition"],
                new_tags=changes["tags"]
            )
        
        # Apply NPC state changes
        room = self.state.rooms.get(self.state.current_room)
        if room:
            for npc_id, new_state in result.npc_state_changes.items():
                for npc in room.npcs:
                    if npc.name.lower() == npc_id.lower():
                        npc.update_state(new_state)
                        break
        
        # Apply goal completion
        for goal_id in result.goals_completed:
            for goal in self.state.goal_stack:
                if goal.id == goal_id:
                    goal.status = "success"
                    self.state.completed_goals.append(goal_id)
                    self.console.print(f"[bold green]✨ Objective Complete: {goal.description}[/bold green]")
                    self.state.goal_stack.remove(goal)
                    break
        
        # Handle room transitions
        if result.success and intent_id == "leave_area":
            self._handle_room_transition()
        
        # Increment turn counter
        self.state.turn_count += 1
    
    def _check_for_loot(self, d20_result: D20Result, intent_id: str, room) -> Optional:
        """Check if action generates loot."""
        if not d20_result.success or intent_id not in ["investigate", "force"]:
            return None
        
        if not room:
            return None
        
        loot_item = self.loot_system.generate_loot(
            location=room.name,
            intent=intent_id
        )
        
        if loot_item:
            self.state.player.inventory.append(loot_item)
            logger.info(f"Loot added to inventory: {loot_item.name}")
        
        return loot_item
    
    async def narrate_outcome(self, player_input: str, intent_id: str, d20_result: D20Result, loot_item):
        """Generate and display narrative output."""
        self.console.print("[dim]📖 Narrator generating story...[/dim]")
        
        narrative_color = "green" if d20_result.success else "yellow"
        success_icon = "✅" if d20_result.success else "❌"
        
        # Use context manager to create compact narrative context
        compact_context = self.context_manager.minify_context(
            self.state, 
            intent_id, 
            max_tokens=200  # Keep it tight for LLM
        )
        
        # Stream narrative generation
        async def _stream_bridge():
            narrative_text = ""
            title_text = f"[bold {narrative_color}]{success_icon} Outcome[/bold {narrative_color}]"
            
            with Live(
                Panel(narrative_text, title=title_text, border_style=narrative_color),
                console=self.console,
                refresh_per_second=12
            ) as live:
                async for token in self.narrator.narrate_stream(
                    player_input=player_input,
                    intent_id=intent_id,
                    d20_result=d20_result,
                    context=compact_context  # Use minified context
                ):
                    narrative_text += token
                    live.update(Panel(narrative_text, title=title_text, border_style=narrative_color))
            
            return narrative_text
        
        final_narrative = await _stream_bridge()
        
        # Append loot notification if any
        output_text = final_narrative
        if loot_item:
            output_text += f"\n\n💎 **Loot found**: {loot_item.name} ({loot_item.description})"
            if hasattr(loot_item, 'stat_bonus') and loot_item.stat_bonus:
                output_text += f" [{loot_item.stat_bonus}]"
        
        self.console.print(
            Panel(
                output_text,
                title=f"[bold {narrative_color}]{success_icon} Outcome[/bold {narrative_color}]",
                border_style=narrative_color
            )
        )
    
    def _handle_room_transition(self):
        """Handle transitioning to a new room."""
        room = self.state.rooms.get(self.state.current_room)
        if not room or not room.exits:
            return
        
        # Take the first exit (simple logic for now)
        next_room_id = list(room.exits.values())[0]
        self.state.current_room = next_room_id
        
        # Sync new location data
        self._sync_world_to_state()
        
        self.console.print(f"\n[bold yellow]🚙 Transitioning to {self.state.rooms[next_room_id].name}...[/bold yellow]")
        
        # Clear scene-specific goals
        self.state.goal_stack = [g for g in self.state.goal_stack if g.type != "short"]
    
    def _check_game_over(self) -> bool:
        """Check if game should end."""
        if not self.state.player.is_alive():
            self.console.print(
                Panel(
                    "[bold red]You have died. Game Over.[/bold red]",
                    border_style="red"
                )
            )
            return False
        
        return True
    
    def display_context(self) -> None:
        """Display current game context."""
        if not self.use_dashboard:
            # Only display context if dashboard is not enabled
            room_context = self.state.get_context_str()
            self.console.print(
                Panel(room_context, title="[bold blue]Current Scene[/bold blue]", border_style="blue")
            )
            
            # Player stats table
            from rich.table import Table
            stats_table = Table(show_header=False, box=None)
            stats_table.add_row("❤️  HP:", f"{self.state.player.hp}/{self.state.player.max_hp}")
            stats_table.add_row("💰 Gold:", str(self.state.player.gold))
            
            self.console.print(
                Panel(stats_table, title="[bold green]Player Stats[/bold green]", border_style="green")
            )
    
    def cleanup(self):
        """Clean up resources when shutting down."""
        if self.use_dashboard and hasattr(self, 'dashboard'):
            self.dashboard.stop_dashboard()


# Export for use by main game loop
__all__ = ["SyntheticRealityEngine"]
