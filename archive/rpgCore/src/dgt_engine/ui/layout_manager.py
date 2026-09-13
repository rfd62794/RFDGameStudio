"""
Layout Manager: Director's Monitor UI

Professional dual-pane dashboard for transparent game debugging.
Left: Cinematic Narrative (70%) | Right: Iron Frame Monitor (30%)

ADR 015: Transparent Debug UI Implementation
"""

from rich.console import Console, Group
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.live import Live
from typing import Optional

from d20_core import D20Result
from logic.perception import PerceptionSystem
from logic.legacy import LegacyHandler


class DirectorMonitor:
    """
    The Director's Monitor - transparent debugging UI for the Iron Frame.
    
    Provides real-time visibility into D20 math, state changes, and decision logic.
    Makes Voyager behavior completely debuggable at a glance.
    """
    
    def __init__(self, console: Console):
        """Initialize the monitor with console reference."""
        self.console = console
        self.layout = Layout()
        self._setup_layout()
    
    def _setup_layout(self):
        """Configure the dual-pane layout with radar and legacy."""
        self.layout.split_column(
            Layout(name="narrative", ratio=7),  # 70% for story
            Layout(name="monitor", ratio=3)      # 30% for debug
        )
        
        # Narrative pane (left)
        self.layout["narrative"].split_row(
            Layout(name="story"),
            Layout(name="context", size=20)  # Context panel at bottom
        )
        
        # Monitor pane (right) - vertical stack
        self.layout["monitor"].split_column(
            Layout(name="combat_log", ratio=2),  # Combat math
            Layout(name="state_changes", ratio=2), # State/reputation
            Layout(name="goals", ratio=1),        # Active goals
            Layout(name="radar", ratio=1),          # Radar panel
            Layout(name="legacy", ratio=1)          # Legacy panel
        )
    
    def format_combat_log(self, d20_result: D20Result) -> Panel:
        """
        Format the combat log with transparent math display.
        
        Shows the "cat-skinning" choices that led to the outcome.
        """
        table = Table(show_header=False, box=None, padding=0)
        table.add_column("Metric", style="bold cyan", width=12)
        table.add_column("Value", style="white")
        
        # Roll Logic with Advantage/Disadvantage
        if d20_result.advantage_type:
            if d20_result.raw_rolls:
                roll_text = f"[ 🎲 {d20_result.raw_rolls[0]} & {d20_result.raw_rolls[1]} ] → {d20_result.roll}"
                if d20_result.advantage_type == "advantage":
                    roll_text += " (ADV)"
                else:
                    roll_text += " (DIS)"
            else:
                roll_text = f"🎲 {d20_result.roll}"
        else:
            roll_text = f"🎲 {d20_result.roll}"
        
        # Color code the roll
        roll_color = "green" if d20_result.success else "red"
        table.add_row("Roll", f"[{roll_color}]{roll_text}[/{roll_color}]")
        
        # Total Score vs DC
        total_color = "green" if d20_result.success else "red"
        table.add_row("Total", f"[{total_color}]{d20_result.total_score}[/{total_color}]")
        table.add_row("DC", str(d20_result.difficulty_class))
        
        # Success/Failure indicator
        result_text = "✅ SUCCESS" if d20_result.success else "❌ FAILURE"
        result_color = "bold green" if d20_result.success else "bold red"
        table.add_row("Result", f"[{result_color}]{result_text}[/{result_color}]")
        
        # Narrative context (technical explanation)
        if d20_result.narrative_context:
            context_lines = d20_result.narrative_context.split(" | ")
            for i, line in enumerate(context_lines[:3]):  # Show first 3 parts
                table.add_row(f"Context {i+1}" if i > 0 else "Context", f"[dim]{line}[/dim]")
        
        return Panel(
            table,
            title="[bold yellow]🎯 Combat Log[/bold yellow]",
            border_style="yellow",
            padding=(0, 1)
        )
    
    def format_state_changes(self, d20_result: D20Result) -> Panel:
        """Format state changes and reputation impacts."""
        table = Table(show_header=False, box=None, padding=0)
        table.add_column("Type", style="bold cyan", width=8)
        table.add_column("Change", style="white")
        
        # HP changes
        if d20_result.hp_delta != 0:
            hp_color = "green" if d20_result.hp_delta > 0 else "red"
            hp_symbol = "+" if d20_result.hp_delta > 0 else ""
            table.add_row("HP", f"[{hp_color}]{hp_symbol}{d20_result.hp_delta} HP[/{hp_color}]")
        
        # Reputation changes
        for faction, delta in d20_result.reputation_deltas.items():
            if delta != 0:
                rep_color = "green" if delta > 0 else "red"
                rep_symbol = "+" if delta > 0 else ""
                faction_name = faction.replace("_", " ").title()
                table.add_row("Rep", f"[{rep_color}]⚖️ {faction_name}: {rep_symbol}{delta}[/{rep_color}]")
        
        # NPC state changes
        for npc_id, new_state in d20_result.npc_state_changes.items():
            state_color = "yellow"  # State changes are always notable
            table.add_row("NPC", f"[{state_color}]{npc_id} → {new_state}[/{state_color}]")
        
        # Relationship changes
        for npc_id, changes in d20_result.relationship_changes.items():
            if changes.get("disposition", 0) != 0:
                disp = changes["disposition"]
                disp_color = "green" if disp > 0 else "red"
                disp_symbol = "+" if disp > 0 else ""
                table.add_row("Rel", f"[{disp_color}]{npc_id}: {disp_symbol}{disp}[/{disp_color}]")
        
        # Tags
        for npc_id, changes in d20_result.relationship_changes.items():
            tags = changes.get("tags", [])
            if tags:
                table.add_row("Tags", f"[cyan]{npc_id}: {', '.join(tags)}[/cyan]")
        
        return Panel(
            table,
            title="[bold cyan]🔄 State Changes[/bold cyan]",
            border_style="cyan",
            padding=(0, 1)
        )
    
    def format_goals_monitor(self, completed_goals: list, active_goals: list) -> Panel:
        """Format goals display with completion tracking."""
        table = Table(show_header=False, box=None, padding=0)
        table.add_column("Status", style="bold", width=8)
        table.add_column("Goal", style="white")
        
        # Completed goals (show recent ones)
        if completed_goals:
            for goal_id in completed_goals[-3:]:  # Show last 3 completed
                table.add_row("✅", f"[green]Completed: {goal_id}[/green]")
        
        # Active goals (show top priority)
        if active_goals:
            for goal in active_goals[:3]:  # Show top 3 active
                goal_text = f"🎯 {goal.description[:30]}..." if len(goal.description) > 30 else f"🎯 {goal.description}"
                table.add_row("📍", f"[yellow]{goal_text}[/yellow]")
        
        return Panel(
            table,
            title="[bold magenta]🎯 Objectives[/bold magenta]",
            border_style="magenta",
            padding=(0, 1)
        )
    
    def format_radar_panel(self, radar_data: List[Dict[str, Any]]) -> Panel:
        """
        Format the radar panel showing detected entities and signatures.
        
        Args:
            radar_data: List of radar blips from perception system
            
        Returns:
            Panel formatted for radar display
        """
        table = Table(show_header=False, box=None, padding=0)
        table.add_column("Type", style="bold cyan", width=8)
        table.add_column("Name", style="white", width=15)
        table.add_column("Dist", style="yellow", width=6)
        table.add_column("Info", style="white", width=20)
        
        for blip in radar_data[:8]:  # Show top 8 blips
            if blip["type"] == "entity":
                # Entity blip
                faction_color = {
                    "law": "blue",
                    "underworld": "red", 
                    "clergy": "yellow",
                    "wild": "green",
                    "merchant": "cyan"
                }.get(blip["faction"], "white")
                
                table.add_row(
                    blip["icon"],
                    f"[{faction_color}]{blip['name'][:12]}[/{faction_color}]",
                    f"[yellow]{blip['distance']}u[/yellow]",
                    f"[dim]{blip['state']}[/dim]"
                )
            else:
                # Signature blip
                table.add_row(
                    blip["icon"],
                    f"[cyan]{blip['name']}[/cyan]",
                    f"[yellow]{blip['distance']}u[/yellow]",
                    f"[dim]{blip['description'][:18]}[/dim]"
                )
        
        return Panel(
            table,
            title="[bold blue]📡 Radar[/bold blue]",
            border_style="blue",
            padding=(0, 1)
        )
    
    def format_legacy_panel(self, legacy_context: List[str]) -> Panel:
        """
        Format the legacy panel showing ghost strings from previous avatars.
        
        Args:
            legacy_context: List of legacy descriptions
            
        Returns:
            Panel formatted for legacy display
        """
        table = Table(show_header=False, box=None, padding=0)
        table.add_column("Echo", style="bold purple", width=20)
        
        if legacy_context:
            for context in legacy_context[:5]:  # Show top 5 echoes
                # Clean up the context string
                clean_context = context.replace("[TAG: ", "").replace("]", "")
                table.add_row(f"[dim]{clean_context}[/dim]")
        else:
            table.add_row("[dim]No legacy echoes nearby[/dim]")
        
        return Panel(
            table,
            title="[bold purple]👻 Legacy[/bold purple]",
            border_style="purple",
            padding=(0, 1)
        )
    
    def update_monitor(
        self, 
        d20_result: D20Result, 
        active_goals: list = None, 
        completed_goals: list = None,
        radar_data: List[Dict[str, Any]] = None,
        legacy_context: List[str] = None
    ):
        """Update all monitor panels with new data."""
        # Update combat log
        self.layout["monitor"]["combat_log"].update(
            self.format_combat_log(d20_result)
        )
        
        # Update state changes
        self.layout["monitor"]["state_changes"].update(
            self.format_state_changes(d20_result)
        )
        
        # Update goals
        active_goals = active_goals or []
        completed_goals = completed_goals or []
        self.layout["monitor"]["goals"].update(
            self.format_goals_monitor(completed_goals, active_goals)
        )
        
        # Update radar if data provided
        if radar_data:
            self.layout["monitor"]["radar"].update(
                self.format_radar_panel(radar_data)
            )
        
        # Update legacy if data provided
        if legacy_context:
            self.layout["monitor"]["legacy"].update(
                self.format_legacy_panel(legacy_context)
            )
    
    def get_layout(self) -> Layout:
        """Get the current layout for rendering."""
        return self.layout
    
    def create_narrative_panel(self, content: str, title: str = "Story", success: bool = True) -> Panel:
        """Create the main narrative panel."""
        color = "green" if success else "red"
        icon = "✅" if success else "❌"
        
        return Panel(
            content,
            title=f"[bold {color}]{icon} {title}[/bold {color}]",
            border_style=color,
            padding=1
        )
    
    def create_context_panel(self, context: str) -> Panel:
        """Create the context panel showing current scene."""
        return Panel(
            context,
            title="[bold blue]📍 Current Scene[/bold blue]",
            border_style="blue",
            padding=(0, 1)
        )


class GameDashboard:
    """
    Main game dashboard combining narrative and monitoring.
    
    Professional game interface that looks like a high-end dev terminal.
    """
    
    def __init__(self, console: Console):
        """Initialize the game dashboard."""
        self.console = console
        self.monitor = DirectorMonitor(console)
        self.live = None
    
    def start_dashboard(self):
        """Start the live dashboard display."""
        self.live = Live(
            self.monitor.get_layout(),
            console=self.console,
            refresh_per_second=4,
            transient=False
        )
        self.live.start()
    
    def stop_dashboard(self):
        """Stop the live dashboard display."""
        if self.live:
            self.live.stop()
    
    def update_dashboard(
        self,
        narrative_content: str,
        d20_result: D20Result,
        context: str,
        active_goals: list = None,
        completed_goals: list = None,
        success: bool = True,
        radar_data: List[Dict[str, Any]] = None,
        perception_system: Optional[PerceptionSystem] = None,
        legacy_handler: Optional[LegacyHandler] = None
    ):
        """Update the entire dashboard with new game state."""
        # Update narrative panel
        self.monitor.layout["narrative"]["story"].update(
            self.monitor.create_narrative_panel(
                narrative_content, 
                "Outcome", 
                success
            )
        )
        
        # Update context panel
        self.monitor.layout["narrative"]["context"].update(
            self.monitor.create_context_panel(context)
        )
        
        # Get legacy context if available
        legacy_context = []
        if legacy_handler and hasattr(self, 'current_player_pos'):
            legacy_context = legacy_handler.get_nearby_legacy_context(self.current_player_pos)
        
        # Update monitor panels
        self.monitor.update_monitor(
            d20_result, 
            active_goals, 
            completed_goals,
            radar_data,
            legacy_context
        )
        
        # Refresh the live display
        if self.live:
            self.live.update(self.monitor.get_layout())
    
    def display_welcome(self, perception_system: Optional[PerceptionSystem] = None, legacy_handler: Optional[LegacyHandler] = None):
        """Display welcome message in dashboard format."""
        welcome_content = (
            "[bold cyan]Welcome to the Semantic RPG - Director's Monitor Edition[/bold cyan]\n\n"
            "Type natural language actions (e.g., 'I kick the table').\n"
            "Commands: [yellow]save[/yellow], [yellow]quit[/yellow]\n\n"
            "[dim]Left: Cinematic Narrative | Right: Iron Frame Monitor[/dim]"
        )
        
        self.monitor.layout["narrative"]["story"].update(
            Panel(welcome_content, border_style="cyan", padding=1)
        )
        
        # Initialize monitor with empty state
        empty_result = D20Result(
            success=False,
            roll=0,
            total_score=0,
            difficulty_class=0,
            hp_delta=0,
            reputation_deltas={},
            relationship_changes={},
            npc_state_changes={},
            goals_completed=[],
            narrative_context="Waiting for action..."
        )
        
        # Get initial radar data if perception system available
        radar_data = []
        if perception_system:
            # Create dummy player data for initial radar
            from world_ledger import Coordinate
            dummy_stats = {"wisdom": 10, "intelligence": 10}
            radar_data = perception_system.get_radar_data(
                Coordinate(0, 0, 0), 
                dummy_stats, 
                0
            )
        
        # Get initial legacy context if available
        legacy_context = []
        if legacy_handler:
            legacy_context = legacy_handler.get_nearby_legacy_context(Coordinate(0, 0, 0))
        
        self.monitor.update_monitor(empty_result, [], [], radar_data, legacy_context)
        
        if self.live:
            self.live.update(self.monitor.get_layout())
        else:
            self.console.print(self.monitor.get_layout())


# Export for use by engine
__all__ = ["DirectorMonitor", "GameDashboard"]
