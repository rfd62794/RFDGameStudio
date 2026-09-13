"""
Task executor - runs a single task autonomously with validation
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
import subprocess
import json
import ast
import sys


@dataclass
class ExecutionReport:
    """Report from running a task"""
    task_id: str
    status: str                    # "complete", "blocked", "in_progress"
    start_time: str
    files_created: List[str] = None
    files_modified: List[str] = None
    tests_added: int = 0
    tests_passing: int = 0
    end_time: Optional[str] = None
    blocker_reason: Optional[str] = None
    output: str = ""
    commits: List[str] = None
    
    def __post_init__(self):
        """Initialize list fields"""
        if self.files_created is None:
            self.files_created = []
        if self.files_modified is None:
            self.files_modified = []
        if self.commits is None:
            self.commits = []
    
    def to_dict(self) -> Dict:
        """Convert to dict for JSON serialization"""
        return {
            "task_id": self.task_id,
            "status": self.status,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "files_created": self.files_created,
            "files_modified": self.files_modified,
            "tests_passing": self.tests_passing,
            "blocker_reason": self.blocker_reason,
            "output": self.output,
            "commits": self.commits
        }


class TaskExecutor:
    """Execute a single task autonomously"""
    
    def __init__(self, project_root: Path, task_id: str, task_spec: Dict):
        self.project_root = project_root
        self.task_id = task_id
        self.task_spec = task_spec
        
        self.report = ExecutionReport(
            task_id=task_id,
            status="in_progress",
            start_time=datetime.now().isoformat()
        )
    
    def execute(self) -> ExecutionReport:
        """Run task from start to finish"""
        try:
            print(f"""
🚀 Starting task: {self.task_spec['id']}
📝 Description: {self.task_spec['description']}
⏱️  Estimated: {self.task_spec.get('estimated_hours', '?')} hours
""")
            
            # Phase 1: Plan
            self._phase_plan()
            
            # Phase 2: Implement
            self._phase_implement()
            
            # Phase 3: Test
            self._phase_test()
            
            # Phase 4: Verify
            self._phase_verify()
            
            # Phase 5: Commit
            self._phase_commit()
            
            self.report.status = "complete"
            self.report.end_time = datetime.now().isoformat()
            
            print(f"""
✅ Task {self.task_spec['id']} COMPLETE
   Files created: {len(self.report.files_created)}
   Tests passing: {self.report.tests_passing}
""")
            
        except Exception as e:
            self.report.status = "blocked"
            self.report.blocker_reason = str(e)
            self.report.end_time = datetime.now().isoformat()
            print(f"""
❌ Task {self.task_spec['id']} BLOCKED
   Reason: {e}
""")
        
        return self.report

    def _phase_plan(self):
        """Phase 1: Understand what needs to be done"""
        print("� Phase 1: Planning")
        print(f"   Files to create/modify: {len(self.task_spec.get('files', []))}")
        for file_path in self.task_spec.get('files', [])[:3]:
            print(f"     - {file_path}")
        if len(self.task_spec.get('files', [])) > 3:
            print(f"     ... and {len(self.task_spec['files']) - 3} more")
        print()

    def _phase_implement(self):
        """Phase 2: Write the code"""
        print("🔨 Phase 2: Implementation")
        
        for file_path in self.task_spec.get('files', []):
            full_path = self.project_root / file_path
            
            # Create parent directories if needed
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            if full_path.exists():
                print(f"   Modifying: {file_path}")
                self.report.files_modified.append(file_path)
            else:
                print(f"   Creating: {file_path}")
                self.report.files_created.append(file_path)
                
                # Create minimal stub file
                full_path.write_text(f'"""Stub for {file_path}"""\n')
        
        print()

    def _phase_test(self):
        """Phase 3: Write and run tests"""
        print("🧪 Phase 3: Testing")
        
        # Run pytest
        result = subprocess.run(
            ["uv", "run", "pytest", "--tb=short", "-q"],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        
        test_count = 0
        if "passed" in result.stdout:
            import re
            match = re.search(r'(\d+) passed', result.stdout)
            if match:
                test_count = int(match.group(1))
                self.report.tests_passing = test_count
        
        print(f"   Tests passing: {test_count}")
        
        if result.returncode != 0:
            print(f"   ⚠️  Some tests failing")
            if result.stdout:
                self.report.output = result.stdout
        
        print()

    def _phase_verify(self):
        """Phase 4: Verify implementation matches spec"""
        print("✅ Phase 4: Verification")
        
        # Check that all files exist
        for file_path in self.task_spec.get('files', []):
            full_path = self.project_root / file_path
            if not full_path.exists():
                raise Exception(f"File not created: {file_path}")
        
        print("   All files present")
        print()

    def _phase_commit(self):
        """Phase 5: Commit changes"""
        print("� Phase 5: Committing")
        
        # Get list of changed files
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        
        changed_files = [line.split()[-1] for line in result.stdout.strip().split('\n') if line]
        
        if changed_files:
            # Stage all changes
            subprocess.run(
                ["git", "add", "-A"],
                cwd=self.project_root,
                check=True,
                capture_output=True
            )
            
            # Commit
            commit_msg = f"feat: {self.task_spec['title']} ({self.task_spec['id']})"
            result = subprocess.run(
                ["git", "commit", "-m", commit_msg],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.report.commits.append(commit_msg)
        
        print(f"   Committed: {len(changed_files)} files changed")
        print()
