"""
Plan reporter - generates reports showing goal to file mappings
"""

from typing import Dict
from .task_loader import TaskLoader
from .task_file_mapper import TaskFileMapper


class PlanReporter:
    """Generate reports showing planning and implementation alignment"""
    
    def __init__(self, task_loader: TaskLoader, mapper: TaskFileMapper):
        self.task_loader = task_loader
        self.mapper = mapper
    
    def get_goal_implementation_status(self, goal_id: str) -> Dict:
        """Show implementation status for a goal"""
        tree = self.mapper.get_goal_tree(goal_id)
        
        # Calculate completion
        total_tasks = 0
        complete_tasks = 0
        total_files = 0
        
        for milestone in tree.get("milestones", []):
            for task in milestone.get("tasks", []):
                total_tasks += 1
                total_files += len(task.get("files", []))
                
                if task.get("status") == "complete":
                    complete_tasks += 1
        
        completion_percent = (complete_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return {
            "goal": tree,
            "total_tasks": total_tasks,
            "complete_tasks": complete_tasks,
            "pending_tasks": total_tasks - complete_tasks,
            "total_files": total_files,
            "completion_percent": completion_percent
        }
    
    def get_file_implementation_context(self, file_path: str) -> Dict:
        """Show what goal/task this file implements"""
        lineage = self.mapper.get_file_lineage(file_path)
        
        context = {
            "file": file_path,
            "system": lineage.get("system"),
            "demo": lineage.get("demo"),
            "contributes_to": {
                "goals": lineage.get("goals", []),
                "tasks": lineage.get("tasks", [])
            }
        }
        
        return context
    
    def get_task_implementation_plan(self, task_id: str) -> Dict:
        """Show detailed implementation plan for a task"""
        task = self.task_loader.tasks.get(task_id)
        if not task:
            return {}
        
        steps = self.task_loader.get_task_steps(task_id)
        files = self.task_loader.get_task_files(task_id)
        
        plan = {
            "task_id": task_id,
            "task_title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "estimated_hours": task.estimated_hours,
            "steps": [
                {
                    "step_id": step.id,
                    "title": step.title,
                    "description": step.description,
                    "files": step.file_references or [],
                    "symbols_to_create": step.symbols_to_create or []
                }
                for step in steps
            ],
            "files": files
        }
        
        return plan
    
    def get_phase_roadmap(self, phase_num: int) -> Dict:
        """Get complete roadmap for a phase"""
        milestone_id = f"M_PHASE{phase_num}" if phase_num == 3 else f"M{phase_num}"
        milestone = self.task_loader.milestones.get(milestone_id)
        
        if not milestone:
            return {}
        
        roadmap = {
            "milestone": {
                "id": milestone.id,
                "title": milestone.title,
                "status": milestone.status,
                "phase": milestone.phase
            },
            "tasks": []
        }
        
        for task_id in (milestone.linked_tasks or []):
            task = self.task_loader.tasks.get(task_id)
            if task:
                task_mapping = self.mapper.get_task_files(task_id)
                roadmap["tasks"].append({
                    "task_id": task_id,
                    "task_title": task.title,
                    "status": task.status,
                    "priority": task.priority,
                    "estimated_hours": task.estimated_hours,
                    "files": task_mapping.files if task_mapping else [],
                    "systems": task_mapping.required_systems if task_mapping else [],
                    "demos": task_mapping.required_demos if task_mapping else []
                })
        
        return roadmap
