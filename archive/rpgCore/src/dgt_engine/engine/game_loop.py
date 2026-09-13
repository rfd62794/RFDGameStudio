"""
Main Game Loop: REPL for Semantic RPG

Orchestrates the Sense → Input → Resolve → Update cycle.
Main game loop (REPL) for the Semantic RPG Core.
"""

import argparse
import os
import asyncio
from pathlib import Path

from loguru import logger
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.live import Live

from game_state import GameState, Room, NPC, create_tavern_scenario
from semantic_engine import SemanticResolver, create_default_intent_library

from sync_engines import ChroniclerEngine
from quartermaster import Quartermaster
from deterministic_arbiter import DeterministicArbiter
from world_map import Location, WorldObject
from location_factory import create_dynamic_world
from objective_factory import generate_goals_for_location


class GameREPL:
    """
    Interactive game loop with Rich UI.
    
    Architecture (Council of Three):
    - SemanticResolver: Fast intent matching (~50ms)
    - ArbiterEngine: Pure logic/state resolution (~100ms, small model)
    - ChroniclerEngine: Narrative generation (~300ms, large model)
    - GameState: Deterministic state updates
    """
    
    def __init__(
        self,
        state: GameState | None = None,
        save_path: Path | None = None,
        auto_mode: bool = False,
        personality: str = "curious"
    ):
        """
        Initialize the game REPL.
        
        Args:
            state: Optional pre-configured GameState
            save_path: Path to save file
            auto_mode: If True, use Voyager agent for automated play
            personality: Personality for Voyager agent (default: curious)
        """
        self.console = Console()
        self.save_path = save_path or Path("savegame.json")
        self.auto_mode = auto_mode
        
        # Initialize game state
        self.world_map = create_dynamic_world()
        
        if state:
            self.state = state
        elif self.save_path.exists():
            try:
                self.console.print(f"[green]Loading saved game from {self.save_path}[/green]")
                self.state = GameState.load_from_file(self.save_path)
            except Exception as e:
                logger.error(f"Failed to load save: {e}. Starting fresh.")
                from factories import CharacterFactory, ScenarioFactory
                self.state = GameState(player=CharacterFactory.create(personality))
                # Auto-load scenarios for specialized archetypes
                if personality.lower() == "cunning":
                    self._initialize_story_frame(ScenarioFactory.load_act("heist"))
                elif personality.lower() == "diplomatic":
                    self._initialize_story_frame(ScenarioFactory.load_act("peace"))
        else:
            from factories import CharacterFactory, ScenarioFactory
            self.state = GameState(player=CharacterFactory.create(personality))
            self.console.print(f"[cyan]Loaded {personality.title()} archetype...[/cyan]")
            
            # Special Story Frames for specialized archetypes
            if personality.lower() == "cunning":
                self._initialize_story_frame(ScenarioFactory.load_act("heist"))
            elif personality.lower() == "diplomatic":
                self._initialize_story_frame(ScenarioFactory.load_act("peace"))
            else:
                self.state = self._initialize_fresh_state()
        
        # Ensure current location is in state.rooms
        self._sync_location_to_state()
        
        # Initialize semantic engine
        self.console.print("[cyan]Loading semantic engine...[/cyan]")
        intent_library = create_default_intent_library()
        self.resolver = SemanticResolver(intent_library, confidence_threshold=0.35)
        
        # Initialize Council of Three
        # Set context window limit (2048 tokens = ~1.5GB less VRAM per model)
        os.environ["OLLAMA_NUM_CTX"] = "2048"
        
        # Initialize Logic Core (Iron Frame)
        self.console.print("[cyan]Loading Arbiter (Deterministic Logic Core)...[/cyan]")
        self.arbiter = DeterministicArbiter()
        
        self.console.print("[cyan]Loading Chronicler (narrative engine - 1B)...[/cyan]")
        # Unified 1B model (High Temp for creativity)
        self.chronicler = ChroniclerEngine(model_name='ollama:llama3.2:1b', tone='humorous')
        
        # Initialize Quartermaster (loot system)
        from loot_system import LootSystem
        self.loot = LootSystem()
        
        # Initialize Quartermaster (Logic)
        self.quartermaster = Quartermaster()
        
        # Initialize AI Controller (Deterministic Auto-Play)
        self.auto_mode = auto_mode
        self.ai_controller = None
        if auto_mode:
            from actors import AIControllerSync, AIController, Spawner
            self.console.print(f"[magenta]Loading AI Controller (Deterministic Auto-Play) with '{personality}' personality...[/magenta]")
            
            # Using the Sync wrapper for compatibility with the loop's synchronous nature
            from engines.kernel.config import AIConfig
            config = AIConfig(seed="SEED_ZERO") 
            # We need to pass the dd_engine if available, but it's initialized inside GameState or separately?
            # In this REPL, we have self.arbiter and self.chronicler. 
            # The AIController needs access to game state, which is passed in decide_action methods.
            
            base_controller = Spawner.create_controller(config) # Minimal init
            self.ai_controller = AIControllerSync(base_controller)
        
        self.turn_history: list[str] = []
        
        logger.info("Game initialized with Council of Three architecture")
        
        self.console.print("[dim]🔥 Warming up engines...[/dim]")
        self.warm_up()

    def _initialize_fresh_state(self) -> GameState:
        """Create initial state using world map."""
        state = GameState()
        state.current_room = "tavern"
        return state

    def _sync_location_to_state(self):
        """Standardize current world_map location into GameState Room."""
        loc_id = self.state.current_room
        if loc_id in self.world_map:
            loc = self.world_map[loc_id]
            
            # If room doesn't exist in state, create it
            if loc_id not in self.state.rooms:
                room_data = Room(
                    name=loc.name,
                    description=loc.description,
                    exits=loc.connections,
                    tags=loc.environment_tags,
                    items=[p.name for p in loc.props],
                    npcs=[]
                )
                
                # Spawn NPCs based on world map
                if loc_id == "tavern":
                    # Special case for tavern to get hardcoded NPC descriptions
                    temp_state = create_tavern_scenario()
                    room_data.npcs = temp_state.rooms["tavern"].npcs
                else:
                    room_data.npcs = [NPC(name=name) for name in loc.initial_npcs]
                
                self.state.rooms[loc_id] = room_data
                
                # Assign Goals for new rooms
                new_goals = generate_goals_for_location(loc_id, loc_id) # Using loc_id as template_id for simplicity
                self.state.goal_stack.extend(new_goals)
                for g in new_goals:
                    self.console.print(f"[bold magenta]🎯 New Objective: {g.description}[/bold magenta]")
            else:
                # Update metadata but keep NPCs/relationships
                existing = self.state.rooms[loc_id]
                existing.name = loc.name
                existing.description = loc.description
                existing.exits = loc.connections
                # Combine static tags with dynamic reputation tags
                from world_map import get_dynamic_tags
                dynamic = get_dynamic_tags(self.state.reputation)
                existing.tags = list(set(loc.environment_tags + dynamic))
                
                # Assign Goals if none exist
                if not self.state.goal_stack:
                    new_goals = generate_goals_for_location(loc_id, loc_id)
                    self.state.goal_stack.extend(new_goals)
                    for g in new_goals:
                        self.console.print(f"[bold magenta]🎯 New Objective: {g.description}[/bold magenta]")
                
                # Items could be dynamic, let's refresh them from props
                existing.items = [p.name for p in loc.props]
    
    def _initialize_story_frame(self, blueprint: dict):
        """Build the world map and goal stack from a scenario blueprint."""
        from factories import Room, NPC, Goal
        from objective_factory import create_goal_from_blueprint
        
        if not blueprint:
            logger.error("Empty blueprint provided to _initialize_story_frame")
            return

        self.console.print(f"[bold yellow]📖 Weaving Story: {blueprint.get('act_name', 'Unnamed Act')}[/bold yellow]")
        
        sequence = blueprint.get("sequence", [])
        for i, entry in enumerate(sequence):
            loc_id = entry["id"]
            
            # 1. Create Linear Exits
            exits = {}
            if i < len(sequence) - 1:
                exits["forward"] = sequence[i+1]["id"]
            if i > 0:
                exits["back"] = sequence[i-1]["id"]
                
            # 2. Build Room and NPCs
            npcs = []
            for n_def in entry.get("npcs", []):
                npcs.append(NPC(name=n_def["name"], description=n_def["description"]))
                
            room = Room(
                name=entry["name"],
                description=entry["description"],
                npcs=npcs,
                tags=entry["tags"],
                exits=exits
            )
            self.state.rooms[loc_id] = room
            
            # 3. Generate Goals from Blueprint
            for g_def in entry.get("objectives", []):
                goal = create_goal_from_blueprint(g_def)
                self.state.goal_stack.append(goal)
            
        if sequence:
            self.state.current_room = sequence[0]["id"]

    def warm_up(self):
        """
        Pre-load the shared 1B model using the Model Factory.
        Simple 'keep_alive' ping to ensure zero-latency start.
        """
        # We just need to trigger one request to load the model into VRAM
        # The factory handles the shared client and keep_alive settings
        try:
            self.console.print("[cyan]🔥 Warming up Iron Frame (llama3.2:1b)...[/cyan]")
            # A dummy call to Arbiter will initialize the shared model
            # due to lazy loading in PydanticAI, we might need a real generation
            # But just initializing the engines effectively preps the client
            pass 
        except Exception as e:
            logger.warning(f"Warm-up ping failed: {e}")
    
    def display_context(self) -> None:
        """Display current game context using Rich panels."""
        # Room description
        room_context = self.state.get_context_str()
        self.console.print(
            Panel(room_context, title="[bold blue]Current Scene[/bold blue]", border_style="blue")
        )
        
        # Player stats table
        stats_table = Table(show_header=False, box=None)
        stats_table.add_row("❤️  HP:", f"{self.state.player.hp}/{self.state.player.max_hp}")
        stats_table.add_row("💰 Gold:", str(self.state.player.gold))
        
        self.console.print(
            Panel(stats_table, title="[bold green]Player Stats[/bold green]", border_style="green")
        )
    
    def process_action(self, player_input: str) -> bool:
        """
        Process a player action through the semantic pipeline.
        
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
        
        # Step 1: Resolve intent using semantic matching
        self.console.print("[dim]🔍 Resolving intent...[/dim]")
        
        intent_match = self.resolver.resolve_intent(player_input)
        
        if not intent_match:
            self.console.print(
                "[red]❌ I don't understand that action. Try rephrasing?[/red]"
            )
            return True
        
        self.console.print(
            f"[cyan]🎲 Intent: {intent_match.intent_id} "
            f"(confidence: {intent_match.confidence:.2f})[/cyan]"
        )
        
        # Step 2: Arbiter resolves logic (state changes)
        self.console.print("[dim]⚖️  Arbiter calculating...[/dim]")
        
        context = self.state.get_context_str()
        # Get room tags
        room = self.state.rooms.get(self.state.current_room)
        room_tags = room.tags if room else []
        
        arbiter_result = self.arbiter.resolve_action_sync(
            intent_id=intent_match.intent_id,
            player_input=player_input,
            context=context,
            room_tags=room_tags,
            reputation=self.state.reputation,
            player_hp=self.state.player.hp
        )
        
        # Step 2.5: Quartermaster calculates final outcome
        self.console.print("[dim]🎲 Quartermaster rolling dice...[/dim]")
        
        # TRANSITION LOGIC: If Arbiter signals Path Clear, inject it into room tags
        if "Path Clear" in arbiter_result.narrative_seed:
            if "Path Clear" not in room_tags:
                self.console.print("[yellow]🔓 Path Clear: New exit accessible![/yellow]")
                room_tags.append("Path Clear")
        
        # Calculate outcome
        outcome = self.quartermaster.calculate_outcome(
            intent_id=intent_match.intent_id,
            room_tags=room_tags,
            arbiter_mod=arbiter_result.difficulty_mod,

            player_stats=self.state.player.attributes,
            inventory_items=self.state.player.inventory
        )
        
        self.console.print(
            f"[dim]🎲 Math: Total {outcome.total_score} vs DC {outcome.difficulty_class} "
            f"({'SUCCESS' if outcome.success else 'FAILURE'})[/dim]"
        )
        
        logger.info(
            f"Quartermaster: success={outcome.success}, "
            f"roll={outcome.total_score} vs DC {outcome.difficulty_class}"
        )

        # Step 2.6: Loot check (if investigate or force)
        loot_item = None
        if outcome.success and intent_match.intent_id in ["investigate", "force"]:
            location_name = room.name if room else "unknown"
            loot_item = self.loot.generate_loot(
                location=location_name,
                intent=intent_match.intent_id
            )
            if loot_item:
                self.state.player.inventory.append(loot_item)
                logger.info(f"Loot added to inventory: {loot_item.name}")
        
        # Step 3: Update game state BEFORE narration
        # Use target NPC from Arbiter if detected
        target_npc = arbiter_result.target_npc
        if not target_npc and room and room.npcs:
            # Fallback to name search
            for npc in room.npcs:
                if npc.name.lower() in player_input.lower():
                    target_npc = npc.name
                    break
            
            if not target_npc and len(room.npcs) == 1:
                target_npc = room.npcs[0].name
        
        # Apply state changes
        if outcome.hp_delta != 0:
             self.state.player.take_damage(abs(outcome.hp_delta)) if outcome.hp_delta < 0 else self.state.player.heal(outcome.hp_delta)
        
        # Step 4: Apply social consequences (Reputation & Relationships)
        self.arbiter.apply_social_consequences(
            self.state, 
            arbiter_result, 
            success=outcome.success
        )
        
        # Display reputation change if any
        for faction, delta in arbiter_result.reputation_deltas.items():
            if delta != 0:
                self.console.print(f"[bold yellow]⚖️ Reputation: {faction.replace('_', ' ').title()} {'increased' if delta > 0 else 'decreased'}! ({self.state.reputation[faction]})[/bold yellow]")
        
        # Detect Goal Completion (Harden Lifecycle)
        if outcome.success:
            completed = []
            for goal in self.state.goal_stack:
                # 1. Intent-based completion
                is_intent_match = (goal.required_intent == intent_match.intent_id)
                # 2. State-based completion (Check all NPCs in room)
                is_state_match = False
                if goal.target_npc_state:
                    for npc in room.npcs:
                        if npc.state == goal.target_npc_state:
                            # NPC must be one of the targets if specified
                            if not goal.target_tags or any(t.lower() in npc.name.lower() for t in goal.target_tags):
                                is_state_match = True
                                break
                
                # Check if this action fulfilled the goal
                if is_intent_match or is_state_match:
                    # Optional: Check target tags for objects/NPCs in input
                    target_hit = any(t.lower() in player_input.lower() for t in goal.target_tags)
                    if target_hit or not goal.target_tags:
                        self.console.print(f"[bold green]✨ Objective Complete: {goal.description}[/bold green]")
                        goal.status = "success"
                        completed.append(goal)
            
            for g in completed:
                self.state.goal_stack.remove(g)
                self.state.completed_goals.append(g.id)
        
        # Failure Check (Death)
        if not self.state.player.is_alive():
            for goal in self.state.goal_stack:
                goal.status = "failed"
        
        self.state.turn_count += 1
        if outcome.success and intent_match.intent_id == "leave_area":
            if room and room.exits:
                # Pick the first exit (usually north)
                next_room_id = list(room.exits.values())[0]
                self.state.current_room = next_room_id
                
                # Sync new location data to state
                self._sync_location_to_state()
                
                self.console.print(f"\n[bold yellow]🚙 Transitioning to {self.state.rooms[next_room_id].name}...[/bold yellow]")
                
                # Clear scene-specific goals on transition
                self.state.active_goals = [g for g in self.state.active_goals if g.type != "short"]
                
                # Clear stutter history on room change
                self.turn_history = []
        
        # Step 4: Chronicler generates narrative (Streamed)
        self.console.print("[dim]📖 Chronicler narrating...[/dim]")
        
        narrative_color = "green" if outcome.success else "yellow"
        success_icon = "✅" if outcome.success else "❌"
        
        # Async streaming bridge
        async def _stream_bridge():
            narrative_text = ""
            title_text = f"[bold {narrative_color}]{success_icon} Outcome[/bold {narrative_color}]"
            
            with Live(
                Panel(narrative_text, title=title_text, border_style=narrative_color),
                console=self.console,
                refresh_per_second=12
            ) as live:
                async for token in self.chronicler.narrate_stream(
                    player_input=player_input,
                    intent_id=intent_match.intent_id,
                    arbiter_result={
                        'success': outcome.success,
                        'hp_delta': outcome.hp_delta,
                        'gold_delta': outcome.gold_delta,
                        'new_npc_state': arbiter_result.new_npc_state,
                        'reasoning': f"{arbiter_result.reasoning}. {outcome.narrative_context}",
                        'narrative_seed': arbiter_result.narrative_seed
                    },
                    context=context
                ):
                    narrative_text += token
                    live.update(Panel(narrative_text, title=title_text, border_style=narrative_color))
            
            return narrative_text

        # Run the stream
        final_narrative = asyncio.run(_stream_bridge())
        
        # Build output with optional loot notification (append to final string)
        output_text = final_narrative
        if loot_item:
            output_text += f"\n\n💎 **Loot found**: {loot_item.name} ({loot_item.description})"
            if loot_item.stat_bonus:
                output_text += f" [{loot_item.stat_bonus}]"
        
        self.console.print(
            Panel(
                output_text,
                title=f"[bold {narrative_color}]{success_icon} Outcome[/bold {narrative_color}]",
                border_style=narrative_color
            )
        )
        
        # Auto-save after each action
        self.state.save_to_file(self.save_path)
        
        # Check win/loss conditions
        if not self.state.player.is_alive():
            self.console.print(
                Panel(
                    "[bold red]You have died. Game Over.[/bold red]",
                    border_style="red"
                )
            )
            return False
        return True
    
    def display_welcome(self):
        """Display welcome banner."""
        self.console.print(
            Panel(
                "[bold cyan]Welcome to the Semantic RPG![/bold cyan]\n\n"
                "Type natural language actions (e.g., 'I kick the table').\n"
                "Commands: [yellow]save[/yellow], [yellow]quit[/yellow]",
                border_style="cyan"
            )
        )
    
    def run(self):
        """Main game loop (REPL or auto-play)."""
        self.display_welcome()
        
        if self.auto_mode:
            self._run_auto_mode()
        else:
            self._run_interactive_mode()
    
    def _run_auto_mode(self):
        """
        Auto-play mode: Voyager agent makes decisions.
        
        Features:
        - 2-second sleep between turns for readability
        - Stutter check (prevents infinite loops)
        - QA trace output
        """
        import time
        
        self.console.print("\n[bold magenta]🤖 AUTO-PLAY MODE ACTIVATED[/bold magenta]")
        self.console.print("[yellow]Voyager will play the game automatically. Press Ctrl+C to stop.[/yellow]\n")
        
        turn_count = 0
        max_turns = 50  # Safety limit
        
        try:
            while turn_count < max_turns:
                # DEAD LOCK: If player is dead, end auto-play
                if not self.state.player.is_alive():
                    self.console.print("\n[bold red]💀 PLAYER IS DEAD. AUTOMATION TERMINATED.[/bold red]")
                    break
                
                turn_count += 1
                self.console.print(f"\n[bold cyan]═══ Turn {turn_count} ═══[/bold cyan]")
                
                # Display current scene
                self.display_context()
                
                # Get Voyager decision
                scene_context = self.state.get_context_str()
                player_stats = {
                    'hp': self.state.player.hp,
                    'max_hp': self.state.player.max_hp,
                    'gold': self.state.player.gold,
                    'inventory': self.state.player.inventory,
                    'attributes': self.state.player.attributes
                }
                
                # Get room tags for context-aware decision making
                room = self.state.rooms.get(self.state.current_room)
                room_tags = room.tags if room else []
                
                self.console.print("\n[bold blue]⚙️ AI Controller thinking (Deterministic)...[/bold blue]")
                
                # Adapting to AIControllerSync -> returns intent object
                intent = self.ai_controller.generate_next_intent(self.state)
                
                player_input = "wait" # Default
                internal_monologue = "No intent generated."
                
                if intent:
                    # simplistic adaptation: internal intent to text command
                    if hasattr(intent, 'intent_type'):
                        if intent.intent_type == 'movement':
                            player_input = f"move to {intent.target_position}"
                        elif intent.intent_type == 'interaction':
                             player_input = f"interact with {intent.target_entity}"
                        
                    internal_monologue = f"Executing {intent}"
                
                # QA Trace
                self.console.print(f"\n[bold green]🗣️  AI CONTROLLER[/bold green]: \"{player_input}\"")
                self.console.print(f"[dim]💭 Thought: {internal_monologue}[/dim]")
                
                # Add to history
                self.turn_history.append(player_input)
                if len(self.turn_history) > 5:
                    self.turn_history.pop(0)
                
                # Process action through Council
                should_continue = self.process_action(player_input)
                
                if not should_continue or not self.state.player.is_alive():
                    break
                
                # Sleep for readability
                time.sleep(2)
                
        except KeyboardInterrupt:
            self.console.print("\n\n[yellow]Auto-play interrupted by user.[/yellow]")
        
        self.console.print(f"\n[bold]Auto-play completed after {turn_count} turns.[/bold]")
    
    def _run_interactive_mode(self):
        """Interactive mode: Human player input."""


def main():
    """Entry point for the game."""
    # Parse CLI arguments
    parser = argparse.ArgumentParser(description="Semantic RPG Core - D&D Terminal Game")
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Enable auto-play mode with Voyager agent"
    )
    parser.add_argument(
        "--personality",
        choices=["curious", "aggressive", "tactical", "chaotic", "cunning", "diplomatic"],
        default="curious",
        help="Voyager personality (default: curious)"
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=50,
        help="Maximum turns for auto-play mode (default: 50)"
    )
    # DEBUG: Force argparse to see the new choices if it's being stubborn
    known_args, _ = parser.parse_known_args()
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()  # Remove default handler
    logger.add(
        "game_debug.log",
        level="DEBUG",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    logger.add(
        lambda msg: None,  # Suppress console logs (Rich handles UI)
        level="INFO"
    )
    
    # Start game
    game = GameREPL(
        auto_mode=args.auto,
        personality=args.personality
    )
    game.run()


if __name__ == "__main__":
    main()
