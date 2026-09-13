"""
Goals Component - Objective Tracking Panel

Phase 10: Component-Based UI Architecture
Fixed-Grid Component for goals, objectives, and legacy resonance.

ADR 027: Component-Based UI Synchronization
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align

from loguru import logger


class ObjectiveType(Enum):
    """Types of objectives with corresponding colors."""
    EXPLORE = "explore"        # Blue
    COMBAT = "combat"          # Red
    SOCIAL = "social"          # Green
    INVESTIGATE = "investigate"  # Yellow
    SURVIVE = "survive"        # Orange
    CRAFT = "craft"          # Purple
    DELIVER = "deliver"        # Cyan
    DISCOVER = "discover"      # Magenta


class GoalStatus(Enum):
    """Status of goals with corresponding colors."""
    ACTIVE = "active"          # White
    IN_PROGRESS = "in_progress"  # Yellow
    COMPLETED = "completed"      # Green
    FAILED = "failed"          # Red
    PAUSED = "paused"          # Gray


@dataclass
class Objective:
    """A single objective in the goal system."""
    id: str
    title: str
    description: str
    objective_type: ObjectiveType
    status: GoalStatus
    progress: float  # 0.0 to 1.0
    target_coordinates: Optional[tuple] = None
    current_coordinates: Optional[tuple] = None
    reward: int = 0
    time_limit: Optional[int] = None
    is_legacy: bool = False
    is_critical: bool = False
    created_turn: int = 0
    completed_turn: Optional[int] = None


@dataclass
class GoalState:
    """Current state of the goal system."""
    active_goals: List[Objective]
    completed_goals: List[Objective]
    current_objective: Optional[Objective]
    legacy_resonance: List[str]
    total_completed: int
    total_failed: int
    last_update: float


class GoalsComponent:
    """
    Goals panel component for objective tracking.
    
    Displays active goals, progress, and legacy resonance with visual indicators.
    """
    
    def __init__(self, console: Console):
        """Initialize the goals component."""
        self.console = console
        self.last_update = None
        self.pulse_active = False
        self.pulse_duration = 0
        
        # Color mappings
        self.type_colors = {
            ObjectiveType.EXPLORE: "blue",
            ObjectiveType.COMBAT: "red",
            ObjectiveType.SOCIAL: "green",
            ObjectiveType.INVESTIGATE: "yellow",
            ObjectiveType.SURVIVE: "orange",
            ObjectiveType.CRAFT: "purple",
            ObjectiveType.DELIVER: "cyan",
            ObjectiveType.DISCOVER: "magenta"
        }
        
        self.status_colors = {
            GoalStatus.ACTIVE: "white",
            GoalStatus.IN_PROGRESS: "yellow",
            GoalStatus.COMPLETED: "green",
            GoalStatus.FAILED: "red",
            GoalStatus.PAUSED: "gray"
        }
        
        # Progress bar characters
        self.progress_chars = {
            "empty": "░",
            "partial": "▓",
            "full": "█"
        }
        
        logger.info("Goals Component initialized with objective tracking")
    
    def add_goal(self, objective: Objective) -> bool:
        """
        Add a new goal to the active list.
        
        Args:
            objective: Goal to add
            
        Returns:
            True if goal was added successfully
        """
        # Check for duplicate
        for existing in self.state.active_goals:
            if existing.id == objective.id:
                return False
        
        self.state.active_goals.append(objective)
        self.last_update = self._get_current_time()
        return True
    
    def complete_goal(self, goal_id: str) -> bool:
        """
        Mark a goal as completed.
        
        Args:
            goal_id: ID of goal to complete
            
        Returns:
            True if goal was completed successfully
        """
        for i, goal in enumerate(self.state.active_goals):
            if goal.id == goal_id:
                goal.status = GoalStatus.COMPLETED
                goal.progress = 1.0
                goal.completed_turn = self._get_current_turn()
                
                # Move to completed list
                self.state.completed_goals.append(goal)
                self.state.active_goals.pop(i)
                self.state.total_completed += 1
                
                # Trigger pulse effect
                self.pulse_active = True
                self.pulse_duration = 5
                
                self.last_update = self._get_current_time()
                return True
        
        return False
    
    def fail_goal(self, goal_id: str) -> bool:
        """
        Mark a goal as failed.
        
        Args:
            goal_id: ID of goal to fail
            
        Returns:
            True if goal was failed successfully
        """
        for i, goal in enumerate(self.state.active_goals):
            if goal.id == goal_id:
                goal.status = GoalStatus.FAILED
                goal.progress = 0.0
                goal.completed_turn = self._get_current_turn()
                
                # Move to completed list
                self.state.completed_goals.append(goal)
                self.state.active_goals.pop(i)
                self.state.total_failed += 1
                
                self.last_update = self._get_current_time()
                return True
        
        return False
    
    def update_goal_progress(self, goal_id: str, progress: float, current_coordinates: Optional[tuple] = None) -> bool:
        """
        Update progress for a goal.
        
        Args:
            goal_id: ID of goal to update
            progress: New progress (0.0 to 1.0)
            current_coordinates: Current position of the player
            
        Returns:
            True if progress was updated
        """
        for goal in self.state.active_goals:
            if goal.id == goal_id:
                old_progress = goal.progress
                goal.progress = min(1.0, max(0.0, progress))
                goal.current_coordinates = current_coordinates
                
                # Check if goal was just completed
                if old_progress < 1.0 and goal.progress >= 1.0:
                    return self.complete_goal(goal_id)
                
                # Check if status should change
                if old_progress == 0.0 and goal.progress > 0.0:
                    goal.status = GoalStatus.IN_PROGRESS
                
                self.last_update = self._get_current_time()
                return True
        
        return False
    
    def set_current_objective(self, objective_id: str) -> bool:
        """
        Set the current active objective.
        
        Args:
            objective_id: ID of objective to set as current
            
        Returns:
            True if objective was set successfully
        """
        for goal in self.state.active_goals:
            if goal.id == objective_id:
                self.state.current_objective = goal
                self.last_update = self._get_current_time()
                return True
        
        return False
    
    def add_legacy_resonance(self, resonance: str) -> None:
        """Add legacy resonance to the goal system."""
        if resonance not in self.state.legacy_resonance:
            self.state.legacy_resonance.append(resonance)
            self.last_update = self._get_current_time()
    
    def render_goals(self, goal_state: GoalState) -> Panel:
        """
        Render the goals panel.
        
        Args:
            goal_state: Current goal state
            
        Returns:
            Rich Panel containing the goals display
        """
        # Create main table
        table = Table(show_header=True, box=None, expand=True)
        table.add_column("Status", width=8, justify="center")
        table.add_column("Objective", width=30, justify="left")
        table.add_column("Type", width=10, justify="center")
        table.add_column("Progress", width=15, justify="center")
        table.add_column("Reward", width=8, justify="right")
        
        # Add active goals
        if goal_state.active_goals:
            for goal in goal_state.active_goals:
                # Get colors
                status_color = self.status_colors[goal.status]
                type_color = self.type_colors[goal.objective_type]
                
                # Add status indicator
                status_symbol = {
                    GoalStatus.ACTIVE: "▶",
                    GoalStatus.IN_PROGRESS: "⚡",
                    GoalStatus.COMPLETED: "✓",
                    GoalStatus.FAILED: "✗",
                    GoalStatus.PAUSED: "⏸"
                }.get(goal.status, "?")
                
                # Create progress bar
                progress_bar = self._create_progress_bar(goal.progress, 12)
                
                # Add legacy indicator
                legacy_marker = "◊" if goal.is_legacy else ""
                
                # Add row
                table.add_row(
                    Text(f"{status_symbol}", style=status_color),
                    Text(f"{legacy_marker} {goal.title}", style=type_color),
                    Text(goal.objective_type.value.title(), style=type_color),
                    Text(progress_bar, style=type_color),
                    Text(f"{goal.reward}g" if goal.reward > 0 else "-", style="yellow")
                )
        
        # Add completed goals summary if any
        if goal_state.completed_goals:
            table.add_row("", "", "", "", "", "")  # Separator
            table.add_row(
                Text("✓ COMPLETED", style="green"),
                Text(f"{len(goal_state.completed_goals)} objectives"),
                Text("", ""),
                Text("", ""),
                Text("", "")
            )
        
        # Create panel
        panel = Panel(
            Align.center(table),
            title=f"[bold blue]OBJECTIVES[/bold blue] (Active: {len(goal_state.active_goals)} | Completed: {goal_state.total_completed})",
            border_style="blue",
            padding=(1, 2)
        )
        
        return panel
    
    def render_legacy_resonance(self, legacy_resonance: List[str]) -> Optional[Panel]:
        """
        Render legacy resonance panel.
        
        Args:
            legacy_resonance: List of legacy resonance strings
            
        Returns:
            Rich Panel containing legacy resonance or None if empty
        """
        if not legacy_resonance:
            return None
        
        # Create resonance table
        table = Table(show_header=False, box=None, expand=True)
        table.add_column("Legacy", width=40, justify="left")
        table.add_column("Resonance", width=30, justify="left")
        
        for resonance in legacy_resonance:
            table.add_row(
                Text("◊", style="cyan"),
                Text(resonance, style="cyan")
            )
        
        panel = Panel(
            Align.center(table),
            title="[bold cyan]LEGACY RESONANCE[/bold cyan]",
            border_style="cyan",
            padding=(1, 2)
        )
        
        return panel
    
    def _create_progress_bar(self, percentage: float, width: int) -> str:
        """Create a text-based progress bar."""
        filled = int(percentage / 100 * width)
        empty = width - filled
        
        filled_chars = self.progress_chars["partial"] if 0 < percentage < 1.0 else self.progress_chars["full"]
        empty_chars = self.progress_chars["empty"]
        
        if percentage >= 1.0:
            return f"[green]{filled_chars * width}[/green]"
        elif percentage > 0:
            return f"[yellow]{filled_chars}{empty_chars}[/dim]"
        else:
            return f"[dim]{empty_chars * width}[/dim]"
    
    def _get_current_time(self) -> float:
        """Get current time in seconds."""
        import time
        return time.time()
    
    def _get_current_turn(self) -> int:
        """Get current turn number."""
        # This would come from game state
        return 0  # TODO: Implement turn tracking
    
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
    
    def get_goals_summary(self, goal_state: GoalState) -> Dict[str, Any]:
        """Get a summary of current goals for external use."""
        return {
            "active_goals": len(goal_state.active_goals),
            "completed_goals": len(goal_state.completed_goals),
            "total_completed": goal_state.total_completed,
            "total_failed": goal_state.total_failed,
            "current_objective": goal_state.current_objective.id if goal_state.current_objective else None,
            "legacy_resonance": goal_state.legacy_resonance,
            "pulse_active": self.pulse_active
        }


# Export for use by other components
__all__ = ["GoalsComponent", "GoalState", "Objective", "ObjectiveType", "GoalStatus"]
