"""
Batch runner - executes multiple tasks in sequence
         Checkpoint between tasks
         Ask for approval before continuing
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Callable
from datetime import datetime
from pathlib import Path
import json
from .task_executor import TaskExecutor, ExecutionReport


@dataclass
class BatchReport:
    """Report from running a batch of tasks"""
    batch_id: str
    milestone_id: str
    start_time: str
    status: str = "in_progress"  # "in_progress", "complete", "blocked"
    tasks_attempted: int = 0
    tasks_completed: int = 0
    tasks_blocked: int = 0
    total_test_passing: int = 0
    current_task_index: int = 0
    task_reports: List[ExecutionReport] = None
    blocker_info: Optional[Dict] = None
    end_time: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dict for JSON serialization"""
        return {
            "batch_id": self.batch_id,
            "milestone_id": self.milestone_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "tasks_attempted": self.tasks_attempted,
            "tasks_completed": self.tasks_completed,
            "tasks_blocked": self.tasks_blocked,
            "total_test_passing": self.total_test_passing,
            "current_task_index": self.current_task_index,
            "status": self.status,
            "blocker_reason": self.blocker_info.get("reason") if self.blocker_info else None
        }


class BatchRunner:
    """Run a batch of tasks autonomously with checkpoints"""
    
    def __init__(self, 
                 project_root: Path,
                 batch_id: str,
                 milestone_id: str,
                 tasks: List[Dict],
                 approval_callback: Optional[Callable] = None):
        """
        Args:
            project_root: Project root directory
            batch_id: Unique batch identifier
            milestone_id: Which milestone this batch implements
            tasks: List of task specs
            approval_callback: Function to call for approval (blocking)
        """
        self.project_root = project_root
        self.batch_id = batch_id
        self.milestone_id = milestone_id
        self.tasks = tasks
        self.approval_callback = approval_callback or self._default_approval
        
        self.report = BatchReport(
            batch_id=batch_id,
            milestone_id=milestone_id,
            start_time=datetime.now().isoformat(),
            task_reports=[]
        )
    
    def run_batch(self, start_from: int = 0) -> BatchReport:
        """Run batch of tasks autonomously"""
        self.report.current_task_index = start_from
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║              AUTONOMOUS BATCH EXECUTION STARTED                 ║
║                                                                  ║
║  Batch: {self.batch_id}
║  Milestone: {self.milestone_id}
║  Tasks: {len(self.tasks)} total
║  Starting from: Task {start_from + 1}
║                                                                  ║
║  Agent will run autonomously and checkpoint between tasks.      ║
║  Robert will be asked to approve before continuing.            ║
╚══════════════════════════════════════════════════════════════╝
""")
        
        while self.report.current_task_index < len(self.tasks):
            task_spec = self.tasks[self.report.current_task_index]
            
            print(f"\n{'─'*60}")
            print(f"Task {self.report.current_task_index + 1}/{len(self.tasks)}: {task_spec['title']}")
            print(f"{'─'*60}\n")
            
            # Execute the task
            executor = TaskExecutor(
                self.project_root,
                task_spec['id'],
                task_spec
            )
            
            task_report = executor.execute()
            self.report.task_reports.append(task_report)
            self.report.tasks_attempted += 1
            
            if task_report.status == "complete":
                self.report.tasks_completed += 1
                self.report.total_test_passing += task_report.tests_passing
            else:
                self.report.tasks_blocked += 1
                self.report.blocker_info = {
                    "task_id": task_spec['id'],
                    "reason": task_report.blocker_reason
                }
                # Stop execution, wait for intervention
                break
            
            self.report.current_task_index += 1
            
            # Checkpoint between tasks (not after last task)
            if self.report.current_task_index < len(self.tasks):
                should_continue = self._checkpoint()
                if not should_continue:
                    break
        
        # Finalize report
        self.report.status = (
            "complete" if self.report.tasks_blocked == 0 
            else "blocked"
        )
        self.report.end_time = datetime.now().isoformat()
        
        # Print summary
        self._print_summary()
        
        return report
    
    def _checkpoint(self) -> bool:
        """Check in with director between tasks"""
        completed = self.report.tasks_completed
        total = len(self.tasks)
        next_index = self.report.current_task_index
        
        print(f"\n{'═'*60}")
        print(f"CHECKPOINT")
        print(f"{'═'*60}")
        print(f"\n✅ Completed: {completed}/{total_tasks} tasks")
        print(f"📊 Tests passing: {self.report.total_test_passing}")
        
        if next_index < len(self.tasks):
            next_task = self.tasks[next_index]
            print(f"\n⏭️  Next Task: {next_index + 1}. {next_task['title']}")
            print(f"   Estimated: {next_task.get('estimated_hours', '?')} hours")
            print(f"   Files: {', '.join(next_task.get('files', [])[:3])}")
            if len(next_task.get('files', [])) > 3:
                print(f"           ... and {len(next_task['files']) - 3} more")
        
        print(f"\n{'─'*60}")
        
        # Ask director for approval
        approval = self.approval_callback(
            task_num=self.report.current_task_index + 1,
            total_tasks=len(self.tasks),
            completed=completed
        )
        
        if not approval:
            print("⏹️  Batch execution stopped (director approval declined)")
            return False
        
        print("✅ Continuing to next task...\n")
        return True
    
    def _default_approval(self, task_num: int, total_tasks: int, completed: int) -> bool:
        """Default approval (wait for user input)"""
        response = input(f"Continue to task {task_num}/{total_tasks}? (yes/no): ").strip().lower()
        return response in ["yes", "y"]
    
    def _print_summary(self):
        """Print batch completion summary"""
        print(f"\n{'═'*60}")
        print(f"BATCH EXECUTION SUMMARY")
        print(f"{'═'*60}\n")
        
        if self.report.status == "complete":
            print(f"✅ COMPLETE: All {self.report.tasks_completed} tasks succeeded")
        else:
            print(f"❌ BLOCKED: {self.report.tasks_completed} completed, 1 blocked")
            if self.report.blocker_info:
                print(f"\n   Blocked at: {self.report.blocker_info['task_id']}")
                print(f"   Reason: {self.report.blocker_info['reason']}")
        
        print(f"\n📊 Final State:")
        print(f"   Tasks completed: {self.report.tasks_completed}/{self.report.tasks_attempted}")
        print(f"   Total tests passing: {self.report.total_test_passing}")
        print(f"   Status: {self.report.status}")
        
        if self.report.status == "blocked":
            print(f"\n⚠️  ACTION NEEDED")
            print(f"   1. Review the blocker above")
            print(f"   2. Fix or adjust the plan")
            print(f"   3. Resume with: python adj.py execute resume {self.batch_id}")
        
        print(f"\n{'═'*60}\n")
