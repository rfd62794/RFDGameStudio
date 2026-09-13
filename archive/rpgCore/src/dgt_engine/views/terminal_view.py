"""
Terminal View - Observer of SimulatorHost

Treats the Terminal as the Console Log of the 2D Engine.
When the Voyager moves in the 2D Engine, the Terminal prints the Action Result.
"""

import asyncio
from typing import Optional, Dict, Any
from pathlib import Path

from loguru import logger
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt
from rich.live import Live

from core.simulator import Observer, ActionResult, SimulatorHost, ViewMode
from game_state import GameState


class TerminalView(Observer):
    """
    Terminal view that observes the unified simulator.
    
    This is NOT a separate game - it's a view of the single simulation.
    The terminal acts as the console log of the 2D engine.
    """
    
    def __init__(self, simulator: SimulatorHost):
        """Initialize terminal view."""
        self.simulator = simulator
        self.console = Console()
        self.running = False
        
        # Display state
        self.last_turn_count = 0
        self.current_narrative = ""
        
        # Rich Live display for streaming updates
        self.live_display: Optional[Live] = None
        
        logger.info("🖥️ TerminalView initialized - Observer of SimulatorHost")
    
    def on_state_changed(self, state: GameState) -> None:
        """Called when game state changes."""
        if state.turn_count != self.last_turn_count:
            self.last_turn_count = state.turn_count
            self._display_context(state)
    
    def on_action_result(self, result: ActionResult) -> None:
        """Called when an action is processed."""
        self._display_action_result(result)
    
    def on_narrative_generated(self, prose: str) -> None:
        """Handle generated narrative."""
        if self.console:
            self.console.print(f"[italic]{prose}[/italic]")
    
    def on_simulator_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Handle simulator events (scene transitions, etc.)."""
        if event_type == "scene_transition":
            # Display cinematic transition header
            message = data.get("message", "--- SCENE TRANSITION ---")
            if self.console:
                self.console.print(f"\n[bold cyan]{message}[/bold cyan]\n")
                
        elif event_type == "scene_lock_released":
            # Display location context when scene lock releases
            location = data.get("location", "Unknown Location")
            if self.console:
                self.console.print(f"[dim]📍 Now in: {location}[/dim]\n")
                
        elif event_type == "portal_transition":
            # Display portal transition
            environment = data.get("environment", "Unknown")
            location = data.get("location", "Unknown")
            if self.console:
                self.console.print(f"[bold yellow]🚪 Portal Transition: {location}[/bold yellow]")
                
        elif event_type == "landmark_interaction":
            # Display landmark interaction
            landmark = data.get("landmark", "Unknown")
            interaction_type = data.get("type", "Unknown")
            if self.console:
                self.console.print(f"[bold green]🎯 Interaction: {landmark} ({interaction_type})[/bold green]")
    
    def _display_context(self, state: GameState) -> None:
        """Display current game context."""
        # Room description
        room_context = state.get_context_str()
        self.console.print(
            Panel(room_context, title="[bold blue]Current Scene[/bold blue]", border_style="blue")
        )
        
        # Player stats table
        stats_table = Table(show_header=False, box=None)
        stats_table.add_row("❤️  HP:", f"{state.player.hp}/{state.player.max_hp}")
        stats_table.add_row("💰 Gold:", str(state.player.gold))
        
        self.console.print(
            Panel(stats_table, title="[bold green]Player Stats[/bold green]", border_style="green")
        )
    
    def _display_action_result(self, result: ActionResult) -> None:
        """Display action result with intent information."""
        # Show intent and confidence
        intent_color = "cyan" if result.success else "yellow"
        success_icon = "✅" if result.success else "❌"
        
        self.console.print(
            f"[{intent_color}]🎲 Intent: {result.intent} {success_icon}[/{intent_color}]"
        )
        
        # Show outcome details
        if result.hp_delta != 0:
            hp_text = f"{'Healed' if result.hp_delta > 0 else 'Damage'}: {abs(result.hp_delta)}"
            self.console.print(f"[red]❤️ {hp_text}[/red]")
        
        if result.gold_delta != 0:
            gold_text = f"{'Gained' if result.gold_delta > 0 else 'Lost'}: {abs(result.gold_delta)} gold"
            self.console.print(f"[yellow]💰 {gold_text}[/yellow]")
        
        if result.room_changed:
            self.console.print(f"[bold magenta]🚙 Moved to {result.new_room}[/bold magenta]")
    
    def _display_narrative(self, prose: str, success: bool) -> None:
        """Display narrative with appropriate styling."""
        narrative_color = "green" if success else "yellow"
        success_icon = "✅" if success else "❌"
        
        self.console.print(
            Panel(
                prose,
                title=f"[bold {narrative_color}]{success_icon} Outcome[/bold {narrative_color}]",
                border_style=narrative_color
            )
        )
    
    def _display_welcome(self) -> None:
        """Display welcome message."""
        if hasattr(self.simulator, 'is_autonomous') and self.simulator.is_autonomous:
            self.console.print(
                Panel(
                    "[bold cyan]Autonomous Movie Mode - Observer View[/bold cyan]\n\n"
                    "🎬 D&D Movie is playing autonomously\n"
                    "Director: LLM generating narrative beacons\n"
                    "Voyager: Moving to AI-defined goals\n"
                    "You are a pure observer - no interaction needed\n"
                    "Commands: [yellow]quit[/yellow] to stop recording",
                    border_style="cyan"
                )
            )
        else:
            self.console.print(
                Panel(
                    "[bold cyan]Terminal View - Observer of Unified Simulator[/bold cyan]\n\n"
                    "Type natural language actions (e.g., 'I kick the table').\n"
                    "This terminal displays the console log of the 2D engine.\n"
                    "Commands: [yellow]save[/yellow], [yellow]quit[/yellow]",
                    border_style="cyan"
                )
            )
    
    async def _input_loop(self) -> None:
        """Async input loop for terminal commands."""
        self.running = True
        
        while self.running and self.simulator.is_running():
            try:
                # Check if in autonomous mode
                if hasattr(self.simulator, 'is_autonomous') and self.simulator.is_autonomous:
                    # Autonomous mode - just observe, no input prompt
                    await asyncio.sleep(1.0)  # Wait 1 second before checking again
                    continue
                
                # Manual mode - get player input
                player_input = Prompt.ask(
                    "\n[bold green]What do you do?[/bold green]",
                    console=self.console
                )
                
                # Handle meta commands
                if player_input.lower() in ["quit", "exit", "q"]:
                    self.console.print("[yellow]Shutting down terminal view...[/yellow]")
                    break
                
                if player_input.lower() in ["save"]:
                    state = self.simulator.get_state()
                    if state:
                        state.save_to_file(Path("savegame.json"))
                        self.console.print("[green]Game saved![/green]")
                    continue
                
                # Submit action to simulator
                self.simulator.submit_action(player_input)
                
                # Small delay to allow processing
                await asyncio.sleep(0.1)
                
            except KeyboardInterrupt:
                self.console.print("\n[yellow]Terminal view interrupted.[/yellow]")
                break
            except Exception as e:
                logger.error(f"❌ Terminal input error: {e}")
                self.console.print(f"[red]Error: {e}[/red]")
        
        self.running = False
    
    async def run(self) -> None:
        """Run the terminal view."""
        self._display_welcome()
        
        # Start input loop
        await self._input_loop()
    
    def start(self) -> None:
        """Start the terminal view."""
        # Run in asyncio event loop
        try:
            asyncio.run(self.run())
        except KeyboardInterrupt:
            logger.info("🖥️ Terminal view stopped by user")
        except Exception as e:
            logger.error(f"❌ Terminal view error: {e}")
    
    def stop(self) -> None:
        """Stop the terminal view."""
        self.running = False
        if self.live_display:
            self.live_display.stop()
        logger.info("🖥️ Terminal view stopped")
