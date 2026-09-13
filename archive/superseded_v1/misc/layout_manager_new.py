"""
Layout Manager: Director's Console UI

Phase 10: Component-Based UI Architecture
Fixed-Grid Component Registry for the Director's Console.

ADR 027: Component-Based UI Synchronization
"""

from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align

from loguru import logger

# Import components
from .components.dashboard_ui import DashboardUI, ZoneType
from world_ledger import WorldLedger
from logic.faction_system import FactionSystem
from game_state import GameState


class DirectorConsole:
    """
    The Director's Console - Fixed-Grid Component Registry.
    
    Provides the 4-zone layout with synchronized component updates
    for tactical awareness and 10-second glanceability.
    """
    
    def __init__(self, console: Console, world_ledger: WorldLedger, faction_system: Optional[FactionSystem] = None):
        """Initialize the Director's Console."""
        self.console = console
        self.world_ledger = world_ledger
        self.faction_system = faction_system
        
        # Initialize dashboard UI
        self.dashboard = DashboardUI(console, world_ledger, faction_system)
        
        # Layout configuration
        self.zones = {
            ZoneType.VIEWPORT: {"name": "World View", "description": "Primary game display"},
            ZoneType.VITALS: {"name": "Vitals", "description": "Character stats and status"},
            ZoneType.INVENTORY: {"name": "Inventory", "description": "Items and equipment"},
            ZoneType.GOALS: {"name": "Objectives", "description": "Goals and quests"},
            ZoneType.CONVERSATION: {"name": "Dialogue", "description": "Conversation feed"},
            ZoneType.STATUS: {"name": "Status", "description": "System information"}
        }
        
        # Console dimensions
        self.console_width = 120
        self.console_height = 40
        
        # Start dashboard
        self.dashboard.start_dashboard()
        
        logger.info("Director's Console initialized with 4-zone fixed-grid layout")
    
    def update_game_state(self, game_state: GameState) -> None:
        """
        Update all components with new game state.
        
        Args:
            game_state: Current game state
        """
        self.dashboard.update_game_state(game_state)
    
    def render_console(self) -> Panel:
        """
        Render the complete console layout.
        
        Returns:
            Rich Panel containing the full console display
        """
        return self.dashboard._render_dashboard()
    
    def handle_resize(self) -> None:
        """Handle terminal resize event."""
        # Get current console dimensions
        console_size = self.console.size
        if console_size:
            self.console_width, self.console_height = console_size
            self.dashboard.resize_dashboard(self.console_width, self.console_height)
    
    def get_console_summary(self) -> dict:
        """Get summary of console state."""
        return self.dashboard.get_dashboard_summary()
    
    def get_zone_info(self) -> dict:
        """Get information about all zones."""
        return self.zones
    
    def update_monitor(self, d20_result: D20Result, active_goals: list, completed_goals: list, radar_data: dict, legacy_context: str) -> None:
        """
        Update the monitor with game state information.
        
        Args:
            d20_result: D20 resolution result
            active_goals: List of active goals
            completed_goals: List of completed goals
            radar_data: Radar data for display
            legacy_context: Legacy context string
        """
        # This method is kept for compatibility with existing code
        # The new component system handles this internally
        pass
    
    def display_welcome(self) -> None:
        """Display welcome message."""
        welcome_text = """
[bold blue]DIRECTOR'S CONSOLE[/bold blue]

Welcome to the Synthetic Reality Console
The Iron Frame is ready for your journey.

Commands:
- look - Examine surroundings
- move forward - Move in facing direction
- turn left/right - Change facing direction
- talk - Interact with NPCs
- quit - Exit the console

[bold yellow]Press Enter to begin your journey...[/bold yellow]
        """
        
        panel = Panel(
            welcome_text.strip(),
            title="[bold green]WELCOME TO SYNTHETIC REALITY[/bold green]",
            border_style="green",
            padding=(2, 4)
        )
        
        self.console.print(panel)
    
    def display_goodbye(self) -> None:
        """Display goodbye message."""
        goodbye_text = """
[bold blue]SESSION COMPLETE[/bold blue]

Thank you for exploring the Synthetic Reality Console.
The Iron Frame stands ready for your next journey.

[bold yellow]Press Enter to exit...[/bold yellow]
        """
        
        panel = Panel(
            goodbye_text.strip(),
            title="[bold green]SESSION COMPLETE[/bold green]",
            border_style="green",
            padding=(2, 4)
        )
        
        self.console.print(panel)


# Export for use by other modules
__all__ = ["DirectorConsole"]
