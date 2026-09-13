"""
Refactored Game Loop: Clean Domain-Driven Design

Replaces the God Class GameREPL with the new D&D Essentials Framework.
Uses the GameEngine orchestrator with clean separation of concerns.

Architecture:
- GameEngine: Thin orchestrator (traffic controller)
- D20Resolver: Deterministic game logic (Heart)
- Narrator: LLM interface (DM)
- WorldFactory: Location generation (Set)
- CharacterFactory: Character creation (Actor)
"""

import argparse
import asyncio
from pathlib import Path

from loguru import logger
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

from engine import GameEngine
from game_state import GameState


class RefactoredGameLoop:
    """
    Clean game loop using the Domain-Driven Design framework.
    
    This is now just a thin UI layer - all game logic is in specialized modules.
    """
    
    def __init__(
        self,
        state: GameState | None = None,
        save_path: Path | None = None,
        auto_mode: bool = False,
        personality: str = "curious"
    ):
        """Initialize the refactored game loop."""
        self.console = Console()
        self.auto_mode = auto_mode
        self.personality = personality
        
        # Initialize the clean engine
        self.engine = GameEngine(
            state=state,
            save_path=save_path,
            personality=personality
        )
        
        # Initialize auto-play agent if needed
        self.voyager = None
        if auto_mode:
            from voyager_sync import SyncVoyagerAgent
            self.console.print(f"[magenta]Loading Voyager with '{personality}' personality...[/magenta]")
            self.voyager = SyncVoyagerAgent(
                personality=personality, 
                model_name="llama3.2:1b"
            )
        
        self.turn_history: list[str] = []
        logger.info("Refactored game loop initialized with Domain-Driven Design")
    
    def display_welcome(self):
        """Display welcome banner."""
        self.console.print(
            Panel(
                "[bold cyan]Welcome to the Semantic RPG - Refactored![/bold cyan]\n\n"
                "Type natural language actions (e.g., 'I kick the table').\n"
                "Commands: [yellow]save[/yellow], [yellow]quit[/yellow]\n\n"
                "[dim]Now with clean Domain-Driven Design architecture![/dim]",
                border_style="cyan"
            )
        )
    
    async def process_player_input(self, player_input: str) -> bool:
        """
        Process player input through the clean engine.
        
        Returns:
            True to continue game, False to quit
        """
        return await self.engine.process_action(player_input)
    
    async def run_interactive_mode(self):
        """Run interactive game loop."""
        self.display_welcome()
        
        while True:
            # Display current context
            self.engine.display_context()
            
            # Get player input
            try:
                player_input = Prompt.ask(
                    "\n[bold green]What do you do?[/bold green]",
                    console=self.console
                )
            except KeyboardInterrupt:
                self.console.print("\n[yellow]Game interrupted. Goodbye![/yellow]")
                break
            
            # Process action
            should_continue = await self.process_player_input(player_input)
            
            if not should_continue:
                break
    
    async def run_auto_mode(self):
        """Run auto-play mode with Voyager agent."""
        import time
        
        self.console.print("\n[bold magenta]🤖 AUTO-PLAY MODE ACTIVATED[/bold magenta]")
        self.console.print("[yellow]Voyager will play the game automatically. Press Ctrl+C to stop.[/yellow]\n")
        
        turn_count = 0
        max_turns = 50
        
        try:
            while turn_count < max_turns:
                # Check if player is dead
                if not self.engine.state.player.is_alive():
                    self.console.print("\n[bold red]💀 PLAYER IS DEAD. AUTOMATION TERMINATED.[/bold red]")
                    break
                
                turn_count += 1
                self.console.print(f"\n[bold cyan]═══ Turn {turn_count} ═══[/bold cyan]")
                
                # Display current scene
                self.engine.display_context()
                
                # Get Voyager decision
                scene_context = self.engine.state.get_context_str()
                player_stats = {
                    'hp': self.engine.state.player.hp,
                    'max_hp': self.engine.state.player.max_hp,
                    'gold': self.engine.state.player.gold,
                    'inventory': self.engine.state.player.inventory,
                    'attributes': self.engine.state.player.attributes
                }
                
                room = self.engine.state.rooms.get(self.engine.state.current_room)
                room_tags = room.tags if room else []
                
                self.console.print("\n[bold blue]⚙️ Voyager thinking...[/bold blue]")
                decision = self.voyager.decide_action_sync(
                    scene_context=scene_context,
                    player_stats=player_stats,
                    turn_history=self.turn_history,
                    room_tags=room_tags,
                    goal_stack=self.engine.state.goal_stack
                )
                
                player_input = decision.action
                
                # Stutter check
                if self.turn_history and self.turn_history[-1] == player_input:
                    self.console.print("[yellow]⚠️  Stutter detected! Forcing variation...[/yellow]")
                    player_input = "I look around the room carefully"
                
                # Display Voyager reasoning
                self.console.print(f"\n[bold green]🗣️  VOYAGER ({decision.selected_action_id})[/bold green]: \"{player_input}\"")
                self.console.print(f"[dim]💭 Thought: {decision.internal_monologue}[/dim]")
                self.console.print(f"[dim]🧠 Strategy: {decision.strategic_reasoning}[/dim]")
                
                # Add to history
                self.turn_history.append(player_input)
                if len(self.turn_history) > 5:
                    self.turn_history.pop(0)
                
                # Process action
                should_continue = await self.process_player_input(player_input)
                
                if not should_continue:
                    break
                
                # Sleep for readability
                time.sleep(2)
                
        except KeyboardInterrupt:
            self.console.print("\n\n[yellow]Auto-play interrupted by user.[/yellow]")
        
        self.console.print(f"\n[bold]Auto-play completed after {turn_count} turns.[/bold]")
    
    async def run(self):
        """Main game loop entry point."""
        try:
            if self.auto_mode:
                await self.run_auto_mode()
            else:
                await self.run_interactive_mode()
        finally:
            # Clean up dashboard resources
            self.engine.cleanup()


def main():
    """Entry point for the refactored game."""
    # Parse CLI arguments
    parser = argparse.ArgumentParser(description="Semantic RPG Core - Refactored D&D Framework")
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Enable auto-play mode with Voyager agent"
    )
    parser.add_argument(
        "--personality",
        choices=["curious", "aggressive", "tactical", "chaotic", "cunning", "diplomatic"],
        default="curious",
        help="Character personality (default: curious)"
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=50,
        help="Maximum turns for auto-play mode (default: 50)"
    )
    
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
    
    # Create and run game
    game = RefactoredGameLoop(
        auto_mode=args.auto,
        personality=args.personality
    )
    
    # Run the async game loop
    asyncio.run(game.run())


if __name__ == "__main__":
    main()
