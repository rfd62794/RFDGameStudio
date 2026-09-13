"""
Task-file mapper - links tasks to files and files to tasks
"""

from typing import Dict, List, Set, Optional
from dataclasses import dataclass
from .task_loader import TaskLoader, Task, Step
from .classifier import FileClassification


@dataclass
class TaskFileMapping:
    """Mapping between task and files"""
    task_id: str
    task_title: str
    files: List[str]              # Files this task creates/modifies
    required_systems: List[str]   # Systems involved
    required_demos: List[str]     # Demos involved
    status: str                   # "queued", "in_progress", "complete"


@dataclass
class FileTaskMapping:
    """Mapping from file to tasks"""
    file_path: str
    demo: Optional[str]           # Demo this file belongs to
    system: Optional[str]         # System this file belongs to
    related_tasks: List[str]      # Tasks that create/use this file
    related_goals: List[str]      # Goals this file helps achieve


class TaskFileMapper:
    """Map tasks to files bidirectionally"""
    
    def __init__(self, task_loader: TaskLoader, classifications: Dict[str, FileClassification]):
        self.task_loader = task_loader
        self.classifications = classifications
        self.task_to_files: Dict[str, TaskFileMapping] = {}
        self.file_to_tasks: Dict[str, FileTaskMapping] = {}
    
    def build_mappings(self) -> None:
        """Build bidirectional mappings"""
        # Task → Files
        for task_id, task in self.task_loader.tasks.items():
            self._map_task_to_files(task_id, task)
        
        # File → Tasks
        for file_path, classification in self.classifications.items():
            self._map_file_to_tasks(file_path, classification)
    
    def _map_task_to_files(self, task_id: str, task: Task) -> None:
        """Map single task to its files"""
        files = self.task_loader.get_task_files(task_id)
        
        # Infer systems and demos from files
        systems = set()
        demos = set()
        
        for file_path in files:
            if file_path in self.classifications:
                c = self.classifications[file_path]
                if c.system:
                    systems.add(c.system)
                if c.demo:
                    demos.add(c.demo)
        
        self.task_to_files[task_id] = TaskFileMapping(
            task_id=task_id,
            task_title=task.title,
            files=files,
            required_systems=sorted(list(systems)),
            required_demos=sorted(list(demos)),
            status=task.status
        )
    
    def _map_file_to_tasks(self, file_path: str, classification: FileClassification) -> None:
        """Map single file to related tasks"""
        related_tasks = []
        related_goals = []
        
        # Find tasks that reference this file
        for task_id, task_mapping in self.task_to_files.items():
            if file_path in task_mapping.files:
                related_tasks.append(task_id)
                
                # Find goals for this task
                if task_id in self.task_loader.tasks:
                    task = self.task_loader.tasks[task_id]
                    if task.linked_milestone:
                        milestone = self.task_loader.milestones.get(task.linked_milestone)
                        if milestone and milestone.linked_goals:
                            related_goals.extend(milestone.linked_goals)
        
        self.file_to_tasks[file_path] = FileTaskMapping(
            file_path=file_path,
            demo=classification.demo,
            system=classification.system,
            related_tasks=related_tasks,
            related_goals=sorted(list(set(related_goals)))
        )
    
    def get_task_files(self, task_id: str) -> Optional[TaskFileMapping]:
        """Get files for a task"""
        return self.task_to_files.get(task_id)
    
    def get_file_tasks(self, file_path: str) -> Optional[FileTaskMapping]:
        """Get tasks for a file"""
        return self.file_to_tasks.get(file_path)
    
    def get_goal_tree(self, goal_id: str) -> Dict:
        """Get complete tree from goal down to files"""
        goal = self.task_loader.get_goal(goal_id)
        if not goal:
            return {}
        
        tree = {
            "goal_id": goal.id,
            "goal_title": goal.title,
            "milestones": []
        }
        
        for milestone_id in (goal.linked_milestones or []):
            milestone = self.task_loader.milestones.get(milestone_id)
            if not milestone:
                continue
            
            milestone_entry = {
                "milestone_id": milestone.id,
                "milestone_title": milestone.title,
                "status": milestone.status,
                "tasks": []
            }
            
            for task_id in (milestone.linked_tasks or []):
                task_mapping = self.task_to_files.get(task_id)
                if not task_mapping:
                    continue
                
                task_entry = {
                    "task_id": task_id,
                    "task_title": task_mapping.task_title,
                    "status": task_mapping.status,
                    "files": task_mapping.files,
                    "systems": task_mapping.required_systems,
                    "demos": task_mapping.required_demos
                }
                
                milestone_entry["tasks"].append(task_entry)
            
            tree["milestones"].append(milestone_entry)
        
        return tree
    
    def get_file_lineage(self, file_path: str) -> Dict:
        """Get complete lineage from file up to goals"""
        file_mapping = self.file_to_tasks.get(file_path)
        if not file_mapping:
            return {}
        
        lineage = {
            "file": file_path,
            "demo": file_mapping.demo,
            "system": file_mapping.system,
            "tasks": [],
            "milestones": set(),
            "goals": set()
        }
        
        for task_id in file_mapping.related_tasks:
            task = self.task_loader.tasks.get(task_id)
            if task:
                lineage["tasks"].append({
                    "task_id": task_id,
                    "task_title": task.title,
                    "status": task.status
                })
                
                if task.linked_milestone:
                    lineage["milestones"].add(task.linked_milestone)
        
        for milestone_id in lineage["milestones"]:
            milestone = self.task_loader.milestones.get(milestone_id)
            if milestone and milestone.linked_goals:
                lineage["goals"].update(milestone.linked_goals)
        
        lineage["milestones"] = sorted(list(lineage["milestones"]))
        lineage["goals"] = sorted(list(lineage["goals"]))
        
        return lineage
