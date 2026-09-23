"""
Weaver - Rich Narrative Dashboard for DGT System

A Rich-based terminal dashboard for managing Chronos (Quest) and Persona (NPC) pillars.
Provides real-time narrative monitoring, quest management, and NPC inspection
with professional terminal UI design.

Features:
- Live quest tracking with progress indicators
- NPC persona inspector with faction standing
- Real-time narrative event logging
- Interactive quest management
- Faction relationship visualization
- Character mood tracking
"""

import asyncio
import threading
import time
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from pathlib import Path
import json

from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, BarColumn, TextColumn
from rich.live import Live
from rich.text import Text
from rich.align import Align
from rich.columns import Columns
from rich.gauge import Gauge
from rich.tree import Tree
from rich import box
from rich.rule import Rule

from loguru import logger

# Import DGT components
try:
    from narrative.chronos import ChronosEngine, Quest, QuestType, TaskPriority
    from narrative.persona import PersonaEngine, FactionType, Persona
    from actors.voyager import Voyager
    from core.state import GameState
except ImportError as e:
    logger.error(f"Failed to import DGT components: {e}")


@dataclass
class NarrativeEvent:
    """Narrative event for logging"""
    timestamp: float
    event_type: str
    source: str
    message: str
    details: Dict[str, Any] = field(default_factory=dict)


class QuestDashboard:
    """Quest management dashboard"""
    
    def __init__(self, chronos_engine: ChronosEngine):
        self.chronos = chronos_engine
        self.console = Console()
        
    def create_quest_table(self) -> Table:
        """Create quest tracking table"""
        table = Table(
            title="📜 Active Quests",
            box=box.ROUNDED,
            show_header=True,
            header_style="bold magenta"
        )
        
        table.add_column("Quest ID", style="cyan", width=15)
        table.add_column("Title", style="white", width=25)
        table.add_column("Type", style="yellow", width=10)
        table.add_column("Priority", style="red", width=8)
        table.add_column("Target", style="green", width=12)
        table.add_column("Progress", style="blue", width=15)
        
        # Get active quests
        active_quests = self.chronos.get_active_quests()
        
        for quest in active_quests:
            # Calculate progress
            progress = self._calculate_quest_progress(quest)
            progress_bar = self._create_progress_bar(progress)
            
            table.add_row(
                quest.quest_id[:12] + "...",
                quest.title[:22] + ("..." if len(quest.title) > 22 else ""),
                quest.quest_type.value,
                quest.priority.value,
                f"({quest.target_position[0]}, {quest.target_position[1]})",
                progress_bar
            )
        
        if not active_quests:
            table.add_row(
                "No active quests",
                "Start a new adventure!",
                "-",
                "-",
                "-",
                "[dim]None[/dim]"
            )
        
        return table
    
    def _calculate_quest_progress(self, quest: Quest) -> float:
        """Calculate quest progress percentage"""
        # Simple progress calculation based on quest type
        if quest.quest_type == QuestType.MAIN:
            # Main quests have more complex progress
            return min(1.0, len(quest.completed_objectives) / max(1, len(quest.objectives)))
        else:
            # Side quests are simpler
            return 0.5 if quest.is_active else 1.0 if quest.is_completed else 0.0
    
    def _create_progress_bar(self, progress: float) -> str:
        """Create a progress bar string"""
        filled = int(progress * 10)
        bar = "█" * filled + "░" * (10 - filled)
        color = "green" if progress > 0.7 else "yellow" if progress > 0.3 else "red"
        return f"[{color}]{bar}[/{color}] {progress*100:.0f}%"
    
    def create_quest_details(self, quest_id: str) -> Panel:
        """Create detailed quest information panel"""
        quest = self.chronos.get_quest(quest_id)
        if not quest:
            return Panel("Quest not found", title="❌ Quest Details")
        
        details = []
        details.append(f"[bold]ID:[/bold] {quest.quest_id}")
        details.append(f"[bold]Title:[/bold] {quest.title}")
        details.append(f"[bold]Description:[/bold] {quest.description}")
        details.append(f"[bold]Type:[/bold] {quest.quest_type.value}")
        details.append(f"[bold]Priority:[/bold] {quest.priority.value}")
        details.append(f"[bold]Target:[/bold] ({quest.target_position[0]}, {quest.target_position[1]})")
        details.append(f"[bold]Required Level:[/bold] {quest.required_level}")
        details.append(f"[bold]Status:[/bold] {'Active' if quest.is_active else 'Completed' if quest.is_completed else 'Available'}")
        
        if quest.objectives:
            details.append("")
            details.append("[bold]Objectives:[/bold]")
            for i, obj in enumerate(quest.objectives, 1):
                status = "✅" if obj in quest.completed_objectives else "⭕"
                details.append(f"  {status} {obj}")
        
        if quest.rewards:
            details.append("")
            details.append("[bold]Rewards:[/bold]")
            for reward_type, amount in quest.rewards.items():
                details.append(f"  • {reward_type}: {amount}")
        
        return Panel(
            "\\n".join(details),
            title=f"📋 Quest Details: {quest.title}",
            border_style="blue"
        )


class PersonaDashboard:
    """Persona inspection dashboard"""
    
    def __init__(self, persona_engine: PersonaEngine):
        self.persona = persona_engine
        self.console = Console()
    
    def create_persona_table(self) -> Table:
        """Create NPC persona table"""
        table = Table(
            title="👥 Active Personas",
            box=box.ROUNDED,
            show_header=True,
            header_style="bold cyan"
        )
        
        table.add_column("Name", style="white", width=20)
        table.add_column("Faction", style="yellow", width=12)
        table.add_column("Mood", style="green", width=10)
        table.add_column("Trust", style="blue", width=8)
        table.add_column("Position", style="magenta", width=12)
        table.add_column("Tags", style="red", width=15)
        
        # Get active NPCs
        active_npcs = self.persona.get_active_npcs()
        
        for npc in active_npcs:
            # Format mood with emoji
            mood_emoji = self._get_mood_emoji(npc.social_state.current_mood.value)
            mood_text = f"{mood_emoji} {npc.social_state.current_mood.value}"
            
            # Format trust level
            trust_level = f"{npc.social_state.trust_level:.1f}"
            
            # Format tags
            tags = ", ".join(list(npc.personality.tags)[:3])  # First 3 tags
            if len(npc.personality.tags) > 3:
                tags += "..."
            
            table.add_row(
                npc.personality.name[:18] + ("..." if len(npc.personality.name) > 18 else ""),
                npc.personality.primary_faction.value,
                mood_text,
                trust_level,
                f"({npc.position[0]}, {npc.position[1]})",
                tags[:13] + ("..." if len(tags) > 13 else tags)
            )
        
        if not active_npcs:
            table.add_row(
                "No active NPCs",
                "The world is quiet",
                "-",
                "-",
                "-",
                "[dim]None[/dim]"
            )
        
        return table
    
    def _get_mood_emoji(self, mood: str) -> str:
        """Get emoji for mood"""
        mood_emojis = {
            "friendly": "😊",
            "neutral": "😐",
            "hostile": "😠",
            "happy": "😄",
            "sad": "😢",
            "angry": "😡",
            "fearful": "😨",
            "excited": "🤗"
        }
        return mood_emojis.get(mood.lower(), "😐")
    
    def create_persona_details(self, npc_name: str) -> Panel:
        """Create detailed persona information panel"""
        npc = self.persona.get_npc_by_name(npc_name)
        if not npc:
            return Panel("NPC not found", title="❌ Persona Details")
        
        details = []
        details.append(f"[bold]Name:[/bold] {npc.personality.name}")
        details.append(f"[bold]Faction:[/bold] {npc.personality.primary_faction.value}")
        details.append(f"[bold]Mood:[/bold] {self._get_mood_emoji(npc.social_state.current_mood.value)} {npc.social_state.current_mood.value}")
        details.append(f"[bold]Trust Level:[/bold] {npc.social_state.trust_level:.2f}")
        details.append(f"[bold]Position:[/bold] ({npc.position[0]}, {npc.position[1]})")
        
        # Personality traits
        if npc.personality.base_traits:
            details.append("")
            details.append("[bold]Traits:[/bold]")
            for trait in npc.personality.base_traits:
                details.append(f"  • {trait.value}")
        
        # Tags
        if npc.personality.tags:
            details.append("")
            details.append("[bold]Tags:[/bold]")
            for tag in npc.personality.tags:
                details.append(f"  • {tag}")
        
        # Relationships
        relationships = self.persona.get_npc_relationships(npc.personality.name)
        if relationships:
            details.append("")
            details.append("[bold]Relationships:[/bold]")
            for other_npc, relationship in relationships.items():
                details.append(f"  • {other_npc}: {relationship}")
        
        return Panel(
            "\\n".join(details),
            title=f"🧠 Persona Details: {npc.personality.name}",
            border_style="cyan"
        )
    
    def create_faction_standing(self) -> Panel:
        """Create faction standing panel"""
        # Get faction relationships
        factions = self.persona.get_all_factions()
        
        if not factions:
            return Panel("No faction data available", title="🏛️ Faction Standing")
        
        # Create faction relationship matrix
        faction_text = []
        for faction in factions:
            faction_text.append(f"[bold]{faction.value}:[/bold]")
            
            # Get relationships with other factions
            for other_faction in factions:
                if faction != other_faction:
                    standing = self.persona.get_faction_standing(faction, other_faction)
                    relation = self.persona.get_relation_type(faction, other_faction)
                    
                    # Color code based on standing
                    if standing > 0.5:
                        color = "green"
                    elif standing > 0.0:
                        color = "yellow"
                    else:
                        color = "red"
                    
                    faction_text.append(f"  → {other_faction.value}: [{color}]{relation.value} ({standing:+.1f})[/{color}]")
            
            faction_text.append("")
        
        return Panel(
            "\\n".join(faction_text).rstrip(),
            title="🏛️ Faction Relationships",
            border_style="yellow"
        )


class NarrativeLogger:
    """Real-time narrative event logger"""
    
    def __init__(self):
        self.events: List[NarrativeEvent] = []
        self.max_events = 50
        self.console = Console()
    
    def add_event(self, event_type: str, source: str, message: str, details: Dict[str, Any] = None) -> None:
        """Add a narrative event"""
        event = NarrativeEvent(
            timestamp=time.time(),
            event_type=event_type,
            source=source,
            message=message,
            details=details or {}
        )
        
        self.events.append(event)
        
        # Keep only recent events
        if len(self.events) > self.max_events:
            self.events.pop(0)
    
    def create_event_log(self) -> Panel:
        """Create event log panel"""
        if not self.events:
            return Panel("No recent events", title="📝 Narrative Log")
        
        log_lines = []
        for event in reversed(self.events[-20:]):  # Last 20 events
            timestamp = time.strftime("%H:%M:%S", time.localtime(event.timestamp))
            
            # Color code by event type
            event_colors = {
                "quest": "yellow",
                "persona": "cyan",
                "voyager": "green",
                "system": "blue",
                "combat": "red"
            }
            color = event_colors.get(event.event_type, "white")
            
            log_lines.append(f"[dim]{timestamp}[/dim] [{color}]{event.source}[/{color}]: {event.message}")
        
        return Panel(
            "\\n".join(log_lines),
            title="📝 Recent Narrative Events",
            border_style="green"
        )


class WeaverApp:
    """Main Weaver application"""
    
    def __init__(self):
        self.console = Console()
        self.layout = Layout()
        
        # DGT engines
        self.chronos: Optional[ChronosEngine] = None
        self.persona: Optional[PersonaEngine] = None
        self.voyager: Optional[Voyager] = None
        
        # Dashboards
        self.quest_dashboard: Optional[QuestDashboard] = None
        self.persona_dashboard: Optional[PersonaDashboard] = None
        self.narrative_logger: Optional[NarrativeLogger] = None
        
        # UI state
        self.running = False
        self.update_interval = 1.0  # Update every second
        
        # Initialize layout
        self._setup_layout()
        
        # Initialize engines
        self._initialize_engines()
    
    def _setup_layout(self) -> None:
        """Setup the Rich layout"""
        self.layout.split(
            Layout(name="header", size=3),
            Layout(name="main"),
            Layout(name="footer", size=3)
        )
        
        self.layout["main"].split_row(
            Layout(name="left", ratio=1),
            Layout(name="right", ratio=1)
        )
        
        self.layout["left"].split_column(
            Layout(name="quests", size=20),
            Layout(name="personas", size=20),
            Layout(name="events", ratio=1)
        )
        
        self.layout["right"].split_column(
            Layout(name="details", size=15),
            Layout(name="factions", size=15),
            Layout(name="controls", ratio=1)
        )
    
    def _initialize_engines(self) -> None:
        """Initialize DGT engines"""
        try:
            # Initialize engines (minimal setup for dashboard)
            self.chronos = ChronosEngine()
            self.persona = PersonaEngine("WEAVER_SEED")
            
            # Initialize dashboards
            self.quest_dashboard = QuestDashboard(self.chronos)
            self.persona_dashboard = PersonaDashboard(self.persona)
            self.narrative_logger = NarrativeLogger()
            
            # Add some sample data for demonstration
            self._add_sample_data()
            
            logger.info("✅ Weaver engines initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Weaver engines: {e}")
    
    def _add_sample_data(self) -> None:
        """Add sample data for demonstration"""
        # Add sample quests
        sample_quests = [
            Quest(
                quest_id="tavern_quest_001",
                title="Find the Lost Key",
                description="Help the innkeeper find the lost tavern key",
                quest_type=QuestType.SIDE_TASK,
                priority=TaskPriority.MEDIUM,
                target_position=(25, 30),
                required_level=1
            ),
            Quest(
                quest_id="main_quest_001", 
                title="The Iron Chest",
                description="Discover the secrets of the ancient iron chest",
                quest_type=QuestType.MAIN,
                priority=TaskPriority.HIGH,
                target_position=(32, 32),
                required_level=5
            )
        ]
        
        for quest in sample_quests:
            self.chronos.quest_stack.add_quest(quest)
        
        # Add sample narrative events
        self.narrative_logger.add_event(
            "system", "Weaver", "Narrative dashboard initialized"
        )
        self.narrative_logger.add_event(
            "quest", "Chronos", "New quest available: Find the Lost Key"
        )
        self.narrative_logger.add_event(
            "persona", "Persona", "Innkeeper mood: friendly"
        )
    
    def create_header(self) -> Panel:
        """Create header panel"""
        header_text = Text.from_markup(
            "🎭 [bold cyan]DGT Weaver[/bold cyan] - "
            "[yellow]Narrative Dashboard[/yellow] | "
            f"[dim]Live Updates Every {self.update_interval}s[/dim]"
        )
        return Panel(
            Align.center(header_text),
            box=box.DOUBLE,
            border_style="cyan"
        )
    
    def create_footer(self) -> Panel:
        """Create footer panel"""
        footer_text = Text.from_markup(
            "[dim]Controls: [Q]uit | [R]efresh | [Space]Pause Updates | "
            "[1-5]Select Panel | [Enter]View Details[/dim]"
        )
        return Panel(
            Align.center(footer_text),
            box=box.DOUBLE,
            border_style="blue"
        )
    
    def update_display(self) -> None:
        """Update all dashboard components"""
        try:
            # Header
            self.layout["header"].update(self.create_header())
            
            # Quest dashboard
            if self.quest_dashboard:
                self.layout["quests"].update(self.quest_dashboard.create_quest_table())
            
            # Persona dashboard
            if self.persona_dashboard:
                self.layout["personas"].update(self.persona_dashboard.create_persona_table())
            
            # Event log
            if self.narrative_logger:
                self.layout["events"].update(self.narrative_logger.create_event_log())
            
            # Faction standing
            if self.persona_dashboard:
                self.layout["factions"].update(self.persona_dashboard.create_faction_standing())
            
            # Details panel (placeholder)
            details_text = Text.from_markup(
                "[bold cyan]Panel Details[/bold cyan]\\n\\n"
                "Select a quest or persona to view detailed information.\\n\\n"
                "[dim]Use number keys 1-5 to select different panels.[/dim]"
            )
            self.layout["details"].update(Panel(details_text, title="🔍 Details"))
            
            # Controls panel
            controls_text = Text.from_markup(
                "[bold yellow]Quick Actions[/bold yellow]\\n\\n"
                "• [Q]uit Application\\n"
                "• [R]efresh Data\\n"
                "• [Space] Pause Updates\\n"
                "• [1] Quest Panel\\n"
                "• [2] Persona Panel\\n"
                "• [3] Events Panel\\n"
                "• [4] Faction Panel\\n"
                "• [5] Details Panel\\n\\n"
                "[dim]Last Update: [/dim]" + time.strftime("%H:%M:%S")
            )
            self.layout["controls"].update(Panel(controls_text, title="🎮 Controls"))
            
        except Exception as e:
            logger.error(f"❌ Failed to update display: {e}")
    
    def run(self) -> None:
        """Run the Weaver dashboard"""
        self.running = True
        
        # Create Live display
        with Live(self.layout, console=self.console, refresh_per_second=1) as live:
            try:
                while self.running:
                    self.update_display()
                    time.sleep(self.update_interval)
                    
            except KeyboardInterrupt:
                self.console.print("\\n[yellow]Weaver dashboard interrupted by user[/yellow]")
            except Exception as e:
                self.console.print(f"[red]Weaver dashboard error: {e}[/red]")
            finally:
                self.running = False
        
        self.console.print("[green]Weaver dashboard closed[/green]")


def main():
    """Main entry point for Weaver"""
    try:
        app = WeaverApp()
        app.run()
    except KeyboardInterrupt:
        logger.info("🎭 Weaver interrupted by user")
    except Exception as e:
        logger.error(f"💥 Weaver crashed: {e}")


if __name__ == "__main__":
    main()
