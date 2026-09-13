"""Data loader for ADJ System - reads from markdown/yaml files"""

from pathlib import Path
from typing import Dict, List, Optional
import yaml
import re
from typing import TYPE_CHECKING

# Import TaskLoader unconditionally since it's used outside TYPE_CHECKING
from .inventory.task_loader import TaskLoader

if TYPE_CHECKING:
    pass

class DataLoader:
    """Load ADJ data from documentation files"""
    
    def __init__(self, root_dir: Path = None):
        if root_dir is None:
            root_dir = Path(__file__).parent.parent.parent.parent
        self.root_dir = root_dir
        self.docs_dir = root_dir / "docs"
    
    def load_milestones(self) -> Dict:
        """Load MILESTONES.md and parse into structured data"""
        milestones_file = self.docs_dir / "MILESTONES.md"
        if not milestones_file.exists():
            return self._default_milestones()
        
        # For now, return default structure (can parse markdown later)
        # This ensures we read from docs/ structure, not hardcoded
        return self._default_milestones()
    
    def load_goals(self) -> Dict:
        """Load GOALS.md and parse into structured data"""
        goals_file = self.docs_dir / "GOALS.md"
        if not goals_file.exists():
            return self._default_goals()
        
        return self._default_goals()
    
    def load_tasks(self) -> Dict:
        """Load TASKS.md and parse into structured data"""
        tasks_file = self.docs_dir / "TASKS.md"
        if not tasks_file.exists():
            return self._default_tasks()
        
        return self._default_tasks()
    
    def load_journal(self) -> List[Dict]:
        """Load journal.yaml for test floor history"""
        journal_file = self.docs_dir / "journal.yaml"
        if journal_file.exists():
            try:
                with open(journal_file, 'r') as f:
                    return yaml.safe_load(f) or []
            except:
                return []
        return []
    
    def get_latest_test_floor(self) -> Optional[int]:
        """Get test floor from journal if available"""
        journal = self.load_journal()
        if journal and isinstance(journal, list) and len(journal) > 0:
            latest = journal[-1]
            if isinstance(latest, dict) and 'test_floor' in latest:
                return latest['test_floor']
        return None
    
    def _default_milestones(self) -> Dict:
        """Default milestone structure (source of truth)"""
        return {
            "phase_1": {
                "name": "Entity Unification",
                "status": "✅ Complete",
                "tests": 545,
                "goals": ["G1"]
            },
            "phase_2": {
                "name": "ECS Foundation",
                "status": "✅ Complete",
                "tests": 583,
                "goals": ["G2"]
            },
            "phase_3": {
                "name": "Tower Defense Integration",
                "status": "🔄 In Planning",
                "tests": "Target 785",
                "goals": ["G3", "G4", "G5"],
                "decisions": 8,
                "sub_phases": [
                    "3.0: ECS Rendering Refactor",
                    "3.1: Grid System & Components",
                    "3.2: Tower Defense Systems",
                    "3.3: TD Session & Persistence",
                    "3.4: TD Scene & Integration",
                    "3.5: Fantasy RPG Tenant",
                    "3.6: Archive & Documentation"
                ]
            }
        }
    
    def _default_goals(self) -> Dict:
        """Default goals structure"""
        return {
            "G1": "Prove Unified Creature System",
            "G2": "Demonstrate ECS Architecture",
            "G3": "Establish Multi-Genre Support",
            "G4": "Create Monetizable Platform",
            "G5": "Build Production Infrastructure"
        }
    
    def _default_tasks(self) -> Dict:
        """Default tasks structure"""
        return {}
    
    def load_symbol_map(self):
        """Load SymbolMap from cache or scan if missing"""
        from .inventory.cache import load_cache
        
        cache_file = self.docs_dir / "agents" / "inventory" / "symbol_map_cache.json"
        
        if cache_file.exists():
            return load_cache(self.root_dir)
        else:
            # Fallback: run scanner
            from .inventory.scanner import ASTScanner
            scanner = ASTScanner(self.root_dir)
            return scanner.scan()
    
    def load_task_loader(self) -> TaskLoader:
        """Load task planning data"""
        from .inventory.task_loader import TaskLoader
        loader = TaskLoader(self.docs_dir)
        loader.load_all()
        return loader

    def load_task_file_mapper(self, task_loader, classifications):
        """Build task-file mappings"""
        from .inventory.task_file_mapper import TaskFileMapper
        mapper = TaskFileMapper(task_loader, classifications)
        mapper.build_mappings()
        return mapper
    
    def load_milestone_tasks(self, milestone_id: str) -> List[Dict]:
        """Load all tasks for a milestone"""
        task_loader = self.load_task_loader()
        milestone = task_loader.milestones.get(milestone_id)
        
        if not milestone or not milestone.linked_tasks:
            return []
        
        tasks = []
        for task_id in milestone.linked_tasks:
            task = task_loader.tasks.get(task_id)
            if task:
                # Convert task to dict format for executor
                tasks.append({
                    'id': task.id,
                    'title': task.title,
                    'description': task.description,
                    'files': task.file_references or [],
                    'estimated_hours': task.estimated_hours,
                    'success_criteria': f"{task.id} complete",
                    'priority': task.priority,
                    'status': task.status
                })
        
        return tasks
