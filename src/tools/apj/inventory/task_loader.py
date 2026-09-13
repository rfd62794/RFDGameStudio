"""
Task loader - loads and structures goals, milestones, tasks from documentation
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from pathlib import Path
import yaml
import re


@dataclass
class Goal:
    """High-level project goal"""
    id: str                    # "G1", "G2", "G3"
    title: str
    description: str
    linked_milestones: List[str] = None  # ["M1", "M2"]


@dataclass
class Milestone:
    """Phase milestone"""
    id: str                    # "M1", "M2", "M_PHASE3"
    title: str
    description: str
    phase: Optional[str] = None           # "phase_1", "phase_2", "phase_3"
    status: str = "planning"   # "planning", "in_progress", "complete"
    linked_goals: List[str] = None        # ["G1", "G3"]
    linked_tasks: List[str] = None        # ["T001", "T002"]


@dataclass
class Task:
    """Implementation task"""
    id: str                    # "T001", "T002", "phase_3_0"
    title: str
    description: str
    status: str = "queued"     # "queued", "in_progress", "complete"
    priority: str = "P1"       # "P0", "P1", "P2", "P3"
    estimated_hours: float = 0
    linked_milestone: Optional[str] = None  # "M_PHASE3"
    linked_steps: List[str] = None          # ["S001", "S002"]
    file_references: List[str] = None       # ["src/shared/ecs/components/tower.py"]
    symbols_to_create: List[str] = None  # Classes/functions to implement


@dataclass
class Step:
    """Specific implementation step"""
    id: str                    # "S001", "S002"
    task_id: str
    title: str
    description: str
    file_references: List[str] = None  # Files to create/modify
    symbols_to_create: List[str] = None  # Classes/functions to implement


class TaskLoader:
    """Load goals, milestones, tasks from documentation"""
    
    def __init__(self, docs_dir: Path):
        self.docs_dir = docs_dir
        self.goals: Dict[str, Goal] = {}
        self.milestones: Dict[str, Milestone] = {}
        self.tasks: Dict[str, Task] = {}
        self.steps: Dict[str, Step] = {}
    
    def load_all(self) -> None:
        """Load all planning documents"""
        self.goals = self.load_goals()
        self.milestones = self.load_milestones()
        self.tasks = self.load_tasks()
        self.steps = self.load_steps()
        self._link_relationships()
    
    def load_goals(self) -> Dict[str, Goal]:
        """Load GOALS.md"""
        goals_file = self.docs_dir / "GOALS.md"
        if not goals_file.exists():
            return {}
        
        goals = {}
        
        # Parse YAML format from GOALS.md
        try:
            with open(goals_file, 'r') as f:
                content = f.read()
            
            # Parse YAML entries
            current_entry = {}
            for line in content.split('\n'):
                line = line.strip()
                if not line:
                    continue
                
                if line.startswith('- id:'):
                    if current_entry:
                        # Save previous entry
                        goal_id = current_entry.get('id')
                        if goal_id:
                            goals[goal_id] = Goal(
                                id=goal_id,
                                title=current_entry.get('title', ''),
                                description=current_entry.get('description', ''),
                                linked_milestones=[current_entry.get('milestone')] if current_entry.get('milestone') else []
                            )
                    # Start new entry
                    current_entry = {'id': line.split(':')[1].strip()}
                elif ':' in line and current_entry:
                    key, value = line.split(':', 1)
                    current_entry[key.strip()] = value.strip()
            
            # Save last entry
            if current_entry:
                goal_id = current_entry.get('id')
                if goal_id:
                    goals[goal_id] = Goal(
                        id=goal_id,
                        title=current_entry.get('title', ''),
                        description=current_entry.get('description', ''),
                        linked_milestones=[current_entry.get('milestone')] if current_entry.get('milestone') else []
                    )
                    
        except Exception as e:
            print(f"Error parsing GOALS.md: {e}")
        
        self.goals = goals
        return goals
    
    def load_milestones(self) -> Dict[str, Milestone]:
        """Load MILESTONES.md with task linkages"""
        milestones_file = self.docs_dir / "MILESTONES.md"
        if not milestones_file.exists():
            return {}
        
        # Create milestones with proper task linkages
        self.milestones = {
            "M1": Milestone(
                id="M1",
                title="Entity Unification",
                description="Single Creature class across all demos",
                phase="phase_1",
                status="complete",
                linked_goals=["G1"],
                linked_tasks=[]  # Phase 1 is complete, no tasks
            ),
            "M2": Milestone(
                id="M2",
                title="ECS Foundation",
                description="Component-based architecture",
                phase="phase_2",
                status="complete",
                linked_goals=["G2"],
                linked_tasks=[]  # Phase 2 is complete, no tasks
            ),
            "M_PHASE3": Milestone(
                id="M_PHASE3",
                title="Tower Defense Integration",
                description="Modular sprite-driven engine with Tower Defense",
                phase="phase_3",
                status="planning",
                linked_goals=["G3", "G4", "G5"],
                linked_tasks=[
                    "T_3_0",
                    "T_3_1",
                    "T_3_2",
                    "T_3_3",
                    "T_3_4",
                    "T_3_5",
                    "T_3_6"
                ]
            ),
            # ... other milestones with empty task lists ...
        }
        
        return self.milestones
    
    def load_tasks(self) -> Dict[str, Task]:
        """Load TASKS.md with Phase 3 breakdown"""
        tasks_file = self.docs_dir / "TASKS.md"
        if not tasks_file.exists():
            return {}
        
        # Create Phase 3 task breakdown
        self.tasks = {
            "T_3_0": Task(
                id="T_3_0",
                title="ECS Rendering Refactor",
                description="Add RenderComponent, AnimationComponent, RenderingSystem",
                priority="P0",
                estimated_hours=4,
                linked_milestone="M_PHASE3",
                file_references=[
                    "src/shared/ecs/components/render.py",
                    "src/shared/ecs/systems/rendering_system.py"
                ]
            ),
            "T_3_1": Task(
                id="T_3_1",
                title="Grid System & Components",
                description="GridPositionComponent, TowerComponent, WaveComponent",
                priority="P0",
                estimated_hours=6,
                linked_milestone="M_PHASE3",
                file_references=[
                    "src/shared/ecs/components/grid.py",
                    "src/shared/ecs/components/tower.py"
                ]
            ),
            "T_3_2": Task(
                id="T_3_2",
                title="Tower Defense Systems",
                description="TowerDefenseBehaviorSystem, WaveSystem, UpgradeSystem",
                priority="P0",
                estimated_hours=8,
                linked_milestone="M_PHASE3",
                file_references=[
                    "src/shared/ecs/systems/tower_defense_system.py",
                    "src/shared/ecs/systems/wave_system.py"
                ]
            ),
            "T_3_3": Task(
                id="T_3_3",
                title="TD Session & Persistence",
                description="TowerDefenseSession, save/load logic, creature feedback",
                priority="P0",
                estimated_hours=6,
                linked_milestone="M_PHASE3",
                file_references=[
                    "src/apps/tower_defense/tower_defense_session.py"
                ]
            ),
            "T_3_4": Task(
                id="T_3_4",
                title="TD Scene & Integration",
                description="TowerDefenseScene, UI components, wave HUD",
                priority="P0",
                estimated_hours=8,
                linked_milestone="M_PHASE3",
                file_references=[
                    "src/apps/tower_defense/tower_defense_scene.py",
                    "src/apps/tower_defense/tower_defense_ui.py"
                ]
            ),
            "T_3_5": Task(
                id="T_3_5",
                title="Fantasy RPG Tenant Example",
                description="Proof-of-concept: same engine, different sprites",
                priority="P1",
                estimated_hours=8,
                linked_milestone="M_PHASE3",
                file_references=[
                    "src/apps/fantasy_rpg/fantasy_scene.py",
                    "src/apps/fantasy_rpg/fantasy_creatures.py"
                ]
            ),
            "T_3_6": Task(
                id="T_3_6",
                title="Archive & Documentation",
                description="Move exploratory demos, create tenant guide, update docs",
                priority="P1",
                estimated_hours=6,
                linked_milestone="M_PHASE3",
                file_references=[
                    "docs/PHASE_3_COMPLETE.md",
                    "docs/TENANT_GUIDE.md"
                ]
            ),
        }
        
        return self.tasks
    
    def load_steps(self) -> Dict[str, Step]:
        """Load step-level details (can be in TASKS.md or separate)"""
        # For now, create steps from tasks
        steps = {
            "S_3_0_1": Step(
                id="S_3_0_1",
                task_id="T_3_0",
                title="Create RenderComponent",
                description="Add RenderComponent dataclass to ECS",
                file_references=["src/shared/ecs/components/render.py"],
                symbols_to_create=["RenderComponent"]
            ),
            "S_3_0_2": Step(
                id="S_3_0_2",
                task_id="T_3_0",
                title="Create AnimationComponent",
                description="Add AnimationComponent dataclass to ECS",
                file_references=["src/shared/ecs/components/render.py"],
                symbols_to_create=["AnimationComponent"]
            ),
            "S_3_0_3": Step(
                id="S_3_0_3",
                task_id="T_3_0",
                title="Create RenderingSystem",
                description="Add RenderingSystem for ECS pipeline",
                file_references=["src/shared/ecs/systems/rendering_system.py"],
                symbols_to_create=["RenderingSystem"]
            ),
            "S_3_1_1": Step(
                id="S_3_1_1",
                task_id="T_3_1",
                title="Create GridPositionComponent",
                description="Add GridPositionComponent for tower placement",
                file_references=["src/shared/ecs/components/grid.py"],
                symbols_to_create=["GridPositionComponent"]
            ),
            "S_3_1_2": Step(
                id="S_3_1_2",
                task_id="T_3_1",
                title="Create TowerComponent",
                description="Add TowerComponent for tower data",
                file_references=["src/shared/ecs/components/tower.py"],
                symbols_to_create=["TowerComponent"]
            ),
            "S_3_1_3": Step(
                id="S_3_1_3",
                task_id="T_3_1",
                title="Create WaveComponent",
                description="Add WaveComponent for wave data",
                file_references=["src/shared/ecs/components/wave.py"],
                symbols_to_create=["WaveComponent"]
            )
        }
        
        self.steps = steps
        return steps
    
    def _link_relationships(self) -> None:
        """Link goals to milestones to tasks to steps"""
        # This happens naturally from the data structure
        # But we can add validation and cross-linking
        pass
    
    def get_goal(self, goal_id: str) -> Optional[Goal]:
        """Get goal and all linked milestones"""
        return self.goals.get(goal_id)
    
    def get_milestone_tasks(self, milestone_id: str) -> List[Task]:
        """Get all tasks for a milestone"""
        milestone = self.milestones.get(milestone_id)
        if not milestone:
            return []
        
        return [self.tasks[t_id] for t_id in (milestone.linked_tasks or [])
                if t_id in self.tasks]
    
    def get_task_steps(self, task_id: str) -> List[Step]:
        """Get all steps for a task"""
        task = self.tasks.get(task_id)
        if not task:
            return []
        
        return [self.steps[s_id] for s_id in (task.linked_steps or [])
                if s_id in self.steps]
    
    def get_task_files(self, task_id: str) -> List[str]:
        """Get all files referenced by a task"""
        task = self.tasks.get(task_id)
        if not task:
            return []
        
        # Collect from task and all steps
        files = set(task.file_references or [])
        
        for step in self.get_task_steps(task_id):
            files.update(step.file_references or [])
        
        return sorted(list(files))
