"""
Execution orchestrator - manages batch execution, state, and resumption
"""

from pathlib import Path
from typing import Dict, Optional
import json
from datetime import datetime
from .batch_runner import BatchRunner, BatchReport


class ExecutionOrchestrator:
    """Orchestrate task execution across batches"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.execution_dir = project_root / "docs" / "execution"
        self.execution_dir.mkdir(parents=True, exist_ok=True)
    
    def start_batch(self, 
                   batch_id: str,
                   milestone_id: str,
                   tasks: list) -> BatchReport:
        """Start a new batch execution"""
        runner = BatchRunner(
            self.project_root,
            batch_id,
            milestone_id,
            tasks
        )
        
        report = runner.run_batch(start_from=0)
        
        # Save execution state
        self._save_execution_state(report)
        
        return report
    
    def resume_batch(self, batch_id: str) -> Optional[BatchReport]:
        """Resume a batch from where it left off"""
        state = self._load_execution_state(batch_id)
        if not state:
            return None
        
        # Recreate runner with same tasks
        runner = BatchRunner(
            self.project_root,
            batch_id,
            state['milestone_id'],
            state['tasks']  # Would need to reconstruct tasks
        )
        
        # Resume from current_task_index
        report = runner.run_batch(start_from=state['current_task_index'])
        
        # Save execution state
        self._save_execution_state(report)
        
        return report
    
    def _save_execution_state(self, report: BatchReport) -> None:
        """Save execution state to file"""
        state_file = self.execution_dir / f"{report.batch_id}.json"
        
        with open(state_file, 'w') as f:
            json.dump(report.to_dict(), f, indent=2)
    
    def _load_execution_state(self, batch_id: str) -> Optional[Dict]:
        """Load execution state from file"""
        state_file = self.execution_dir / f"{batch_id}.json"
        
        if not state_file.exists():
            return None
        
        with open(state_file, 'r') as f:
            return json.load(f)
    
    def get_execution_status(self, batch_id: str) -> Optional[Dict]:
        """Get status of a batch"""
        return self._load_execution_state(batch_id)
