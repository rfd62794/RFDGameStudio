"""
Vitals Component - Real-time Character Sheet Panel

Phase 10: Component-Based UI Architecture
Fixed-Grid Component for character stats, HP, fatigue, and status tracking.

ADR 027: Component-Based UI Synchronization
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align

from loguru import logger


class HealthStatus(Enum):
    """Health status levels with corresponding colors."""
    CRITICAL = "critical"    # < 20% HP
    LOW = "low"            # 20-40% HP
    MEDIUM = "medium"        # 40-70% HP
    HIGH = "high"           # 70-100% HP
    FULL = "full"           # 100% HP


class FatigueStatus(Enum):
    """Fatigue status levels with corresponding colors."""
    RESTED = "rested"        # 0-25% fatigue
    LIGHT = "light"          # 25-50% fatigue
    MODERATE = "moderate"    # 50-75% fatigue
    HEAVY = "heavy"          # 75-90% fatigue
    EXHAUSTED = "exhausted"  # >90% fatigue


@dataclass
class VitalStatus:
    """Current vital status of a character."""
    hp: int
    max_hp: int
    fatigue: int
    max_fatigue: int
    attributes: Dict[str, int]
    status_effects: list
    
    def get_hp_percentage(self) -> float:
        """Get HP as a percentage."""
        return (self.hp / self.max_hp) * 100 if self.max_hp > 0 else 0
    
    def get_fatigue_percentage(self) -> float:
        """Get fatigue as a percentage."""
        return (self.fatigue / self.max_fatigue) * 100 if self.max_fatigue > 0 else 0
    
    def get_health_status(self) -> HealthStatus:
        """Get current health status."""
        hp_pct = self.get_hp_percentage()
        if hp_pct >= 100:
            return HealthStatus.FULL
        elif hp_pct >= 70:
            return HealthStatus.HIGH
        elif hp_pct >= 40:
            return HealthStatus.MEDIUM
        elif hp_pct >= 20:
            return HealthStatus.LOW
        else:
            return HealthStatus.CRITICAL
    
    def get_fatigue_status(self) -> FatigueStatus:
        """Get current fatigue status."""
        fatigue_pct = self.get_fatigue_percentage()
        if fatigue_pct <= 25:
            return FatigueStatus.RESTED
        elif fatigue_pct <= 50:
            return FatigueStatus.LIGHT
        elif fatigue_pct <= 75:
            return FatigueStatus.MODERATE
        elif fatigue_pct <= 90:
            return FatigueStatus.HEAVY
        else:
            return FatigueStatus.EXHAUSTED


class VitalsComponent:
    """
    Real-time character vitals panel component.
    
    Displays HP, fatigue, attributes, and status effects with color-coded alerts.
    """
    
    def __init__(self, console: Console):
        """Initialize the vitals component."""
        self.console = console
        self.last_update = None
        self.pulse_active = False
        self.pulse_duration = 0
        
        # Color mappings
        self.health_colors = {
            HealthStatus.CRITICAL: "bold red",
            HealthStatus.LOW: "red",
            HealthStatus.MEDIUM: "yellow",
            HealthStatus.HIGH: "green",
            HealthStatus.FULL: "bold green"
        }
        
        self.fatigue_colors = {
            FatigueStatus.RESTED: "green",
            FatigueStatus.LIGHT: "yellow",
            FatigueStatus.MODERATE: "orange",
            FatigueStatus.HEAVY: "red",
            FatigueStatus.EXHAUSTED: "bold red"
        }
        
        # Attribute abbreviations
        self.attr_abbrev = {
            "strength": "STR",
            "dexterity": "DEX",
            "constitution": "CON",
            "intelligence": "INT",
            "wisdom": "WIS",
            "charisma": "CHA"
        }
        
        logger.info("Vitals Component initialized with real-time tracking")
    
    def render_vitals(self, vital_status: VitalStatus, pulse: bool = False) -> Panel:
        """
        Render the vitals panel.
        
        Args:
            vital_status: Current character vital status
            pulse: Whether to show pulse effect (for status changes)
            
        Returns:
            Rich Panel containing the vitals display
        """
        # Create main table
        table = Table(show_header=False, box=None, expand=True)
        table.add_column("", width=12, justify="left")
        table.add_column("", width=8, justify="right")
        
        # Character name and level
        table.add_row(
            Text("Voyager", style="bold blue"),
            Text("Level 1", style="bold")
        )
        table.add_row("", "")  # Spacer
        
        # Health bar
        hp_pct = vital_status.get_hp_percentage()
        hp_status = vital_status.get_health_status()
        hp_color = self.health_colors[hp_status]
        
        hp_bar = self._create_progress_bar(hp_pct, 10, hp_color, pulse)
        table.add_row(
            Text("HP", style="bold"),
            f"{vital_status.hp}/{vital_status.max_hp}"
        )
        table.add_row(hp_bar, "")
        
        # Fatigue bar
        fatigue_pct = vital_status.get_fatigue_percentage()
        fatigue_status = vital_status.get_fatigue_status()
        fatigue_color = self.fatigue_colors[fatigue_status]
        
        fatigue_bar = self._create_progress_bar(fatigue_pct, 10, fatigue_color, pulse)
        table.add_row(
            Text("FATIGUE", style="bold"),
            f"{vital_status.get_fatigue_percentage():.0f}%"
        )
        table.add_row(fatigue_bar, "")
        table.add_row("", "")  # Spacer
        
        # Attributes
        table.add_row(
            Text("ATTRIBUTES", style="bold underline"),
            ""
        )
        
        for attr_name, attr_value in vital_status.attributes.items():
            abbrev = self.attr_abbrev.get(attr_name, attr_name[:3].upper())
            
            # Color code attributes based on value
            if attr_value >= 16:
                attr_color = "bold green"
            elif attr_value >= 14:
                attr_color = "green"
            elif attr_value >= 12:
                attr_color = "yellow"
            elif attr_value >= 10:
                attr_color = "white"
            else:
                attr_color = "red"
            
            table.add_row(
                Text(abbrev, style=attr_color),
                Text(str(attr_value), style=attr_color)
            )
        
        # Status effects
        if vital_status.status_effects:
            table.add_row("", "")  # Spacer
            table.add_row(
                Text("EFFECTS", style="bold underline"),
                ""
            )
            
            for effect in vital_status.status_effects:
                # Color code effects by type
                if "poison" in effect.lower():
                    effect_color = "green"
                elif "bless" in effect.lower() or "holy" in effect.lower():
                    effect_color = "yellow"
                elif "curse" in effect.lower() or "dark" in effect.lower():
                    effect_color = "red"
                else:
                    effect_color = "white"
                
                table.add_row(
                    Text("•", style=effect_color),
                    Text(effect, style=effect_color)
                )
        
        # Create panel with appropriate border color based on health
        border_color = self._get_border_color(hp_status, fatigue_status, pulse)
        
        panel = Panel(
            Align.center(table),
            title="[bold blue]VITALS[/bold blue]",
            border_style=border_color,
            padding=(1, 2)
        )
        
        return panel
    
    def _create_progress_bar(self, percentage: float, width: int, color: str, pulse: bool = False) -> str:
        """Create a text-based progress bar."""
        filled = int(percentage / 100 * width)
        empty = width - filled
        
        if pulse:
            # Add pulse effect
            filled_chars = "█" * filled
            empty_chars = "░" * empty
            return f"[{color}]{filled_chars}[white]{empty_chars}"
        else:
            filled_chars = "█" * filled
            empty_chars = "░" * empty
            return f"[{color}]{filled_chars}[dim]{empty_chars}"
    
    def _get_border_color(self, health_status: HealthStatus, fatigue_status: FatigueStatus, pulse: bool) -> str:
        """Get appropriate border color based on status."""
        if pulse:
            return "bold yellow"  # Pulse effect
        elif health_status == HealthStatus.CRITICAL:
            return "bold red"
        elif fatigue_status == FatigueStatus.EXHAUSTED:
            return "bold orange"
        elif health_status == HealthStatus.LOW:
            return "red"
        elif fatigue_status == FatigueStatus.HEAVY:
            return "orange"
        else:
            return "blue"
    
    def update_vitals(self, vital_status: VitalStatus) -> bool:
        """
        Update vitals and return whether status changed.
        
        Args:
            vital_status: New vital status
            
        Returns:
            True if status changed (for pulse effect)
        """
        if self.last_update is None:
            self.last_update = vital_status
            return True
        
        # Check for status changes
        old_health = self.last_update.get_health_status()
        old_fatigue = self.last_update.get_fatigue_status()
        new_health = vital_status.get_health_status()
        new_fatigue = vital_status.get_fatigue_status()
        
        status_changed = (old_health != new_health) or (old_fatigue != new_fatigue)
        
        if status_changed:
            self.last_update = vital_status
            self.pulse_active = True
            self.pulse_duration = 3  # Pulse for 3 frames
        
        return status_changed
    
    def update_pulse(self) -> bool:
        """
        Update pulse state and return whether pulse is active.
        
        Returns:
            True if pulse should be shown
        """
        if self.pulse_active:
            self.pulse_duration -= 1
            if self.pulse_duration <= 0:
                self.pulse_active = False
            return True
        return False
    
    def get_vitals_summary(self, vital_status: VitalStatus) -> Dict[str, Any]:
        """Get a summary of current vitals for external use."""
        return {
            "hp_percentage": vital_status.get_hp_percentage(),
            "fatigue_percentage": vital_status.get_fatigue_percentage(),
            "health_status": vital_status.get_health_status().value,
            "fatigue_status": vital_status.get_fatigue_status().value,
            "status_effects": vital_status.status_effects,
            "is_critical": vital_status.get_hp_percentage() < 20,
            "is_exhausted": vital_status.get_fatigue_percentage() > 90
        }


# Export for use by other components
__all__ = ["VitalsComponent", "VitalStatus", "HealthStatus", "FatigueStatus"]
