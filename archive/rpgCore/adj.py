#!/usr/bin/env python3
"""
ADJ System - Top-Level CLI Interface
Primary interface for Robert (Director) and Coding Agent to govern DGT Engine development.

Usage:
    python adj.py status          - Show current DGT Engine status
    python adj.py phase <number>  - Show specific phase status
    python adj.py priorities      - Show top priorities
    python adj.py blockers        - Show current blockers
    python adj.py next            - Show next actions
    python adj.py approve <phase> - Director approval for phase
    python adj.py update          - Update dashboard with current state
    python adj.py strategy <num>  - Phase strategy analysis
"""

import argparse
import json
import os
import sys
import subprocess
import time
import datetime
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Layer imports
from src.tools.apj.data_loader import DataLoader
from src.tools.apj.analysis import StatusAnalyzer
from src.tools.apj.agents.model_router import ModelRouter


class ADJSystem:
    """Top-level ADJ System CLI - Layer-aware"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent
        self.docs_dir = self.root_dir / "docs"
        self.dashboard_file = self.docs_dir / "ADJ_DASHBOARD.md"
        self.milestones_file = self.docs_dir / "MILESTONES.md"
        self.tasks_file = self.docs_dir / "TASKS.md"
        
        # Layer 1: Data loader
        self.data_loader = DataLoader(self.root_dir)
        
        # Layer 2: Local analysis
        self.analyzer = StatusAnalyzer(self.data_loader)
        
        # Layer 3+: Model router
        self.router = ModelRouter()
        
        # Track layers used
        self.layers_used = []
    
    def run_command(self, cmd: List[str]) -> str:
        """Run command and return output"""
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.root_dir)
            return result.stdout.strip()
        except Exception as e:
            return f"Error: {e}"
    
    def _record_layer(self, layer: str):
        """Track which layers are used"""
        self.layers_used.append(layer)
    
    def _run_tests(self) -> int:
        """Run tests and return count"""
        output = self.run_command(["uv", "run", "pytest", "--tb=no", "-q"])
        if "passed" in output:
            # Extract number from "685 passed, 3 skipped"
            for line in output.split('\n'):
                if "passed" in line:
                    parts = line.split()[0]
                    try:
                        return int(parts)
                    except ValueError:
                        pass
        return 0
    
    def get_test_count(self) -> int:
        """Get test count - try journal first, then run tests"""
        self._record_layer("Layer 1: Data Files")
        
        # Try journal first
        cached = self.data_loader.get_latest_test_floor()
        if cached is not None:
            return cached
        
        # Run tests if no cached value
        return self._run_tests()
    
    def get_current_status(self) -> Dict:
        """Get status - use Layer 1 + 2 only"""
        self._record_layer("Layer 1: Data Files")
        self._record_layer("Layer 2: Local Analysis")
        
        return {
            "test_floor": self.get_test_count(),
            "protected_minimum": 462,
            "phases": self.analyzer.milestones,
            "blockers": self.analyzer.get_blockers(),
            "priorities": self.analyzer.get_priorities()
        }
    
    def show_cost(self):
        """Show which layers were used"""
        print("\n🔧 Layers Used:")
        for layer in self.layers_used:
            cost = self.router.get_layer_cost(layer)
            print(f"  {layer} ({cost})")
    
    def show_strategy(self, phase_number: str):
        """Show phase strategy using available layers"""
        phase_data = self.analyzer.get_phase_status(int(phase_number))
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    PHASE {phase_number} STRATEGY ANALYSIS           ║
╚══════════════════════════════════════════════════════════════╝

📊 PHASE DATA:
  Name: {phase_data.get('name', 'Unknown')}
  Status: {phase_data.get('status', 'Unknown')}
  Goals: {', '.join(phase_data.get('goals', []))}
""")
        
        # Use Layer 3 if available
        self._record_layer("Layer 1: Data Files")
        self._record_layer("Layer 2: Local Analysis")
        
        result, layer_used = self.router.phase_strategy(int(phase_number), phase_data)
        self._record_layer(layer_used)
        
        if "error" in result:
            print(f"🤖 AI Analysis: {result.get('fallback', 'Local analysis only')}")
            print(f"📋 Local Analysis:")
            print(f"  - Strategic Importance: {phase_data.get('name', 'Unknown')}")
            print(f"  - Current Status: {phase_data.get('status', 'Unknown')}")
            print(f"  - Success Criteria: Complete phase goals")
        else:
            print(f"🤖 AI Analysis (Layer 3):")
            if 'response' in result:
                print(f"  {result['response']}")
        
        self.show_cost()
    
    def show_inventory_status(self):
        """Show comprehensive inventory status"""
        self._record_layer("Layer 1: Data Files")
        
        # Load symbol map
        symbol_map = self.data_loader.load_symbol_map()
        
        self._record_layer("Layer 2: Local Analysis")
        
        # Classify files
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        # Generate status
        from src.tools.apj.inventory.status_reporter import StatusReporter
        reporter = StatusReporter(symbol_map, classifications)
        status = reporter.get_status()
        
        # Display
        self._print_inventory_status(status)
        self.show_cost()
    
    def show_inventory_demo(self, demo_name: str):
        """Show status of specific demo"""
        symbol_map = self.data_loader.load_symbol_map()
        
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        from src.tools.apj.inventory.status_reporter import StatusReporter
        reporter = StatusReporter(symbol_map, classifications)
        status = reporter.get_status()
        
        if demo_name in status.demos:
            demo_status = status.demos[demo_name]
            print(f"""
Demo: {demo_name}
  Files: {demo_status['files']}
  Docstring Coverage: {demo_status['docstring_coverage']:.1f}%
  Status: {demo_status['status']}
""")
        else:
            print(f"Demo '{demo_name}' not found")
    
    def show_inventory_system(self, system_name: str):
        """Show status of specific system"""
        symbol_map = self.data_loader.load_symbol_map()
        
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        from src.tools.apj.inventory.status_reporter import StatusReporter
        reporter = StatusReporter(symbol_map, classifications)
        status = reporter.get_status()
        
        if system_name in status.systems:
            system_status = status.systems[system_name]
            print(f"""
System: {system_name}
  Files: {system_status['files']}
  Docstring Coverage: {system_status['docstring_coverage']:.1f}%
  Status: {system_status['status']}
""")
        else:
            print(f"System '{system_name}' not found")
    
    def show_missing_docstrings(self, limit: int = 20):
        """Show symbols missing docstrings"""
        symbol_map = self.data_loader.load_symbol_map()
        
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        from src.tools.apj.inventory.status_reporter import StatusReporter
        reporter = StatusReporter(symbol_map, classifications)
        missing = reporter.get_missing_docstrings(limit)
        
        print(f"Missing Docstrings (top {limit}):\n")
        for item in missing:
            print(f"  {item['symbol']} ({item['type']}) - {item['file']}:{item['line']}")
    
    def save_inventory_report(self):
        """Save inventory status to markdown file"""
        symbol_map = self.data_loader.load_symbol_map()
        
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        from src.tools.apj.inventory.status_reporter import StatusReporter
        reporter = StatusReporter(symbol_map, classifications)
        status = reporter.get_status()
        
        # Generate markdown
        report = self._generate_markdown_report(status, reporter)
        
        # Save to docs/INVENTORY_REPORT.md
        report_file = self.docs_dir / "INVENTORY_REPORT.md"
        with open(report_file, 'w') as f:
            f.write(report)
        
        print(f"✅ Report saved: {report_file}")

    def execute_batch(self, milestone_id: str, approval_callback=None):
        """Start executing all tasks for a milestone"""
        self._record_layer("Layer 1: Data Files")
        self._record_layer("Layer 2: Local Analysis")
        
        # Load tasks for milestone
        tasks = self.data_loader.load_milestone_tasks(milestone_id)
        
        if not tasks:
            print(f"No tasks found for milestone {milestone_id}")
            return
        
        # Create batch ID
        from datetime import datetime
        batch_id = f"{milestone_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Run batch
        from src.tools.apj.executor.orchestrator import ExecutionOrchestrator
        orchestrator = ExecutionOrchestrator(self.root_dir)
        
        report = orchestrator.start_batch(batch_id, milestone_id, tasks)
        
        # Save report
        self._save_execution_report(batch_id, report)
        
        return report

    def resume_batch(self, batch_id: str):
        """Resume a batch from where it left off"""
        from src.tools.apj.executor.orchestrator import ExecutionOrchestrator
        orchestrator = ExecutionOrchestrator(self.root_dir)
        
        report = orchestrator.resume_batch(batch_id)
        
        if not report:
            print(f"Batch {batch_id} not found")
            return
        
        # Save report
        self._save_execution_report(batch_id, report)
        
        return report

    def get_batch_status(self, batch_id: str):
        """Get status of a batch"""
        from src.tools.apj.executor.orchestrator import ExecutionOrchestrator
        orchestrator = ExecutionOrchestrator(self.root_dir)
        
        status = orchestrator.get_execution_status(batch_id)
        
        if not status:
            print(f"Batch {batch_id} not found")
            return
        
        print(f"""
Batch: {status['batch_id']}
Milestone: {status['milestone_id']}
Status: {status['status']}

Progress: {status['tasks_completed']}/{status['tasks_attempted']} completed
Tests: {status['total_test_passing']} passing

{'─'*60}

""")
        
        if status['status'] == 'blocked':
            print(f"❌ BLOCKED: {status['blocker_reason']}")
            print(f"\nResume with: python adj.py execute resume {status['batch_id']}")

    def _save_execution_report(self, batch_id: str, report):
        """Save execution report"""
        report_dir = self.docs_dir / "execution"
        report_dir.mkdir(parents=True, exist_ok=True)
        
        report_file = report_dir / f"{batch_id}_report.json"
        with open(report_file, 'w') as f:
            json.dump(report.to_dict(), f, indent=2)

    def show_reality_status(self):
        """Show what's actually implemented vs what's planned"""
        from src.tools.apj.inventory.reality_audit import DEMO_REALITY, SYSTEM_REALITY
        
        print("""
╔══════════════════════════════════════════════════════════════╗
║              REALITY CHECK: Plans vs Implementation            ║
╚══════════════════════════════════════════════════════════════╝

📊 DEMOS (Current Implementation):""")
        
        for demo_name, reality in DEMO_REALITY.items():
            print(f"  {demo_name:20s} {reality['status']:30s} ({reality['files']} files)")
            if reality['missing_tasks']:
                print(f"    Missing: {', '.join(reality['missing_tasks'][:2])}")
            print()
        
        print(f"""
🔧 SYSTEMS (Current Implementation):""")
        
        for system_name, reality in SYSTEM_REALITY.items():
            print(f"  {system_name:20s} {reality['status']:30s} ({reality['coverage']}% docstrings)")
            if reality['missing']:
                print(f"    Missing: {', '.join(reality['missing'][:2])}")
            print()

    def show_alignment_gaps(self):
        """Show where plans don't match reality"""
        from src.tools.apj.inventory.reality_audit import (
            PLANNED_BUT_MISSING, 
            IMPLEMENTED_BUT_UNPLANNED, 
            PARTIAL_IMPLEMENTATIONS
        )
        
        print("""
╔══════════════════════════════════════════════════════════════╗
║              ALIGNMENT GAPS: Plans vs Reality                 ║
╚══════════════════════════════════════════════════════════════╝

❌ PLANS WITHOUT IMPLEMENTATION:""")
        
        for milestone_id, title, status in PLANNED_BUT_MISSING:
            print(f"  {milestone_id}: {title}")
            print(f"    Status: {status}")
        
        print(f"""
❌ FILES WITHOUT PLANS:""")
        
        for name, what, note in IMPLEMENTED_BUT_UNPLANNED:
            print(f"  {name}: {what}")
            print(f"    Note: {note}")
        
        print(f"""
⚠️  PARTIAL IMPLEMENTATIONS:""")
        
        for name, done, missing in PARTIAL_IMPLEMENTATIONS:
            print(f"  {name}")
            print(f"    Done: {done}")
            print(f"    Missing: {missing}")

    def show_model_status(self):
        """Show current model system status"""
        from src.tools.apj.agents.ollama_client import resolve_model, _get_available_models
        from src.tools.apj.agents.openrouter_client import is_director_enabled
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    MODEL SYSTEM STATUS                        ║
╚══════════════════════════════════════════════════════════════╝

🏠 LOCAL (Ollama):""")
        
        try:
            available = _get_available_models()
            if available:
                print(f"  Status: ✅ Running")
                print(f"  Available models: {', '.join(available[:3])}")
                if len(available) > 3:
                    print(f"                    ... and {len(available) - 3} more")
                print(f"  Current model: {resolve_model()}")
            else:
                print(f"  Status: ⚠️  Running but no models loaded")
        except Exception as e:
            print(f"  Status: ❌ {str(e)}")
        
        print(f"""
☁️  REMOTE (OpenRouter):""")
        
        if is_director_enabled():
            print(f"  Status: ✅ Configured")
            print(f"  Approval mode: STRICT (human approval required)")
            print(f"  Cost tracking: Enabled")
        else:
            print(f"  Status: ❌ Not configured or disabled")

    def show_model_usage(self):
        """Show model usage summary"""
        from src.tools.apj.agents.model_monitor import ModelMonitor
        
        monitor = ModelMonitor(self.root_dir)
        monitor.print_summary()

    def show_routing_policy(self):
        """Show how requests are routed"""
        from src.tools.apj.agents.model_contracts import ROUTING_POLICY, TaskType
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    ROUTING POLICY                             ║
╚══════════════════════════════════════════════════════════════╝

Task Type              → System
─────────────────────────────────
""")
        
        for task_type, system in ROUTING_POLICY.items():
            print(f"{task_type.value:20s} → {system}")
        
        print(f"""
Strategy: Try preferred system first, fallback to other if failed
Budget: Enforced by OpenRouter, fallback to Ollama if over budget
""")

    def detect_and_confirm_context(self) -> bool:
        """Boot and start conversational chat"""
        
        from src.tools.apj.context_detector import ContextDetector
        from src.tools.apj.agents.intent_parser import ConversationalInterface
        
        detector = ContextDetector(self.root_dir)
        context = detector.detect_all()
        
        detector.print_summary()
        
        # Get Ollama
        try:
            from src.tools.apj.agents.ollama_client import get_ollama_model
            ollama = get_ollama_model()
        except:
            ollama = None
        
        # Start chat
        chat = ConversationalInterface(self.root_dir, ollama)
        chat.context = context
        # The autonomous swarm runs automatically in __init__
        
        return True
    
    def _get_ollama_model(self):
        """Get Ollama model for swarm"""
        try:
            from src.tools.apj.agents.ollama_client import get_ollama_model
            return get_ollama_model()
        except:
            return None
    
    def _run_game(self, demo_name: str) -> None:
        """Run a specific demo game"""
        print(f"\n🎮 Launching {demo_name} demo...\n")
        
        # Try different demo entry points
        demo_paths = [
            self.src_dir / "demos" / demo_name / "main.py",
            self.src_dir / "demos" / demo_name / "scene.py",
            self.src_dir / "apps" / f"{demo_name}.py"
        ]
        
        game_script = None
        for path in demo_paths:
            if path.exists():
                game_script = path
                break
        
        if not game_script:
            print(f"⚠️  Could not find {demo_name} demo executable")
            return
        
        try:
            import subprocess
            # Run game (blocks until window closes)
            game_process = subprocess.Popen(
                [sys.executable, str(game_script)],
                cwd=self.project_root
            )
            
            # Wait for game to close
            game_process.wait()
            
            print("✅ Game closed")
        
        except Exception as e:
            print(f"❌ Failed to run game: {e}")
    
    def show_phase_roadmap(self, phase_num: int):
        """Show complete roadmap for a phase"""
        self._record_layer("Layer 1: Data Files")
        self._record_layer("Layer 2: Local Analysis")
        
        task_loader = self.data_loader.load_task_loader()
        symbol_map = self.data_loader.load_symbol_map()
        
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        from src.tools.apj.inventory.task_file_mapper import TaskFileMapper
        mapper = TaskFileMapper(task_loader, classifications)
        mapper.build_mappings()
        
        from src.tools.apj.inventory.plan_reporter import PlanReporter
        reporter = PlanReporter(task_loader, mapper)
        roadmap = reporter.get_phase_roadmap(phase_num)
        
        self._print_phase_roadmap(roadmap)
        self.show_cost()

    def show_goal_status(self, goal_id: str):
        """Show implementation status for a goal"""
        self._record_layer("Layer 1: Data Files")
        self._record_layer("Layer 2: Local Analysis")
        
        task_loader = self.data_loader.load_task_loader()
        symbol_map = self.data_loader.load_symbol_map()
        
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        from src.tools.apj.inventory.task_file_mapper import TaskFileMapper
        mapper = TaskFileMapper(task_loader, classifications)
        mapper.build_mappings()
        
        from src.tools.apj.inventory.plan_reporter import PlanReporter
        reporter = PlanReporter(task_loader, mapper)
        status = reporter.get_goal_implementation_status(goal_id)
        
        self._print_goal_status(status)
        self.show_cost()

    def show_file_context(self, file_path: str):
        """Show what goal/task a file implements"""
        self._record_layer("Layer 1: Data Files")
        self._record_layer("Layer 2: Local Analysis")
        
        task_loader = self.data_loader.load_task_loader()
        symbol_map = self.data_loader.load_symbol_map()
        
        from src.tools.apj.inventory.classifier import FileClassifier
        classifier = FileClassifier()
        classifications = classifier.classify_all(symbol_map)
        
        from src.tools.apj.inventory.task_file_mapper import TaskFileMapper
        mapper = TaskFileMapper(task_loader, classifications)
        mapper.build_mappings()
        
        from src.tools.apj.inventory.plan_reporter import PlanReporter
        reporter = PlanReporter(task_loader, mapper)
        context = reporter.get_file_implementation_context(file_path)
        
        self._print_file_context(context)
        self.show_cost()

    def show_task_plan(self, task_id: str):
        """Show detailed implementation plan for a task"""
        self._record_layer("Layer 1: Data Files")
        self._record_layer("Layer 2: Local Analysis")
        
        task_loader = self.data_loader.load_task_loader()
        
        from src.tools.apj.inventory.plan_reporter import PlanReporter
        # Create minimal mapper just for task
        from src.tools.apj.inventory.task_file_mapper import TaskFileMapper
        mapper = TaskFileMapper(task_loader, {})
        
        reporter = PlanReporter(task_loader, mapper)
        plan = reporter.get_task_implementation_plan(task_id)
        
        self._print_task_plan(plan)
        self.show_cost()

    def _print_phase_roadmap(self, roadmap):
        """Pretty-print phase roadmap"""
        milestone = roadmap.get("milestone", {})
        tasks = roadmap.get("tasks", [])
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    PHASE {milestone.get('phase', 'N/A')} ROADMAP              ║
╚══════════════════════════════════════════════════════════════╝

🎯 MILESTONE: {milestone.get('title', 'Unknown')}
📊 STATUS: {milestone.get('status', 'Unknown')}

📋 TASKS ({len(tasks)} total):""")
        
        for task in tasks:
            print(f"  {task.get('task_id', 'Unknown')}: {task.get('task_title', 'Unknown')}")
            print(f"    Status: {task.get('status', 'Unknown')}")
            print(f"    Priority: {task.get('priority', 'Unknown')}")
            print(f"    Hours: {task.get('estimated_hours', 0)}")
            if task.get('files'):
                print(f"    Files: {len(task.get('files', []))}")
            if task.get('systems'):
                print(f"    Systems: {', '.join(task.get('systems', []))}")
            if task.get('demos'):
                print(f"    Demos: {', '.join(task.get('demos', []))}")
            print()
    
    def _print_goal_status(self, status):
        """Pretty-print goal status"""
        goal = status.get("goal", {})
        milestones = goal.get("milestones", [])
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    GOAL IMPLEMENTATION STATUS               ║
╚══════════════════════════════════════════════════════════════╝

🎯 GOAL: {goal.get('goal_title', 'Unknown')}
📊 COMPLETION: {status.get('completion_percent', 0):.1f}%
📋 TASKS: {status.get('complete_tasks', 0)}/{status.get('total_tasks', 0)} complete
📁 FILES: {status.get('total_files', 0)} files involved

🏗️  MILESTONES:""")
        
        for milestone in milestones:
            tasks = milestone.get("tasks", [])
            complete = len([t for t in tasks if t.get("status") == "complete"])
            print(f"  {milestone.get('milestone_title', 'Unknown')}: {complete}/{len(tasks)} tasks")
            for task in tasks[:3]:  # Show first 3 tasks
                status_emoji = "✅" if task.get("status") == "complete" else "🔄" if task.get("status") == "in_progress" else "❌"
                print(f"    {status_emoji} {task.get('task_title', 'Unknown')}")
            if len(tasks) > 3:
                print(f"    ... and {len(tasks) - 3} more")
            print()
    
    def _print_file_context(self, context):
        """Pretty-print file context"""
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    FILE IMPLEMENTATION CONTEXT              ║
╚══════════════════════════════════════════════════════════════╝

📁 FILE: {context.get('file', 'Unknown')}
🔧 SYSTEM: {context.get('system', 'Unknown') or 'None'}
🎮 DEMO: {context.get('demo', 'Unknown') or 'None'}

🎯 CONTRIBUTES TO:""")
        
        goals = context.get("contributes_to", {}).get("goals", [])
        tasks = context.get("contributes_to", {}).get("tasks", [])
        
        if goals:
            print("  Goals:")
            for goal_id in goals:
                print(f"    {goal_id}")
        
        if tasks:
            print("  Tasks:")
            for task in tasks:
                print(f"    {task.get('task_id', 'Unknown')}: {task.get('task_title', 'Unknown')}")
    
    def _print_task_plan(self, plan):
        """Pretty-print task plan"""
        steps = plan.get("steps", [])
        files = plan.get("files", [])
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    TASK IMPLEMENTATION PLAN                 ║
╚══════════════════════════════════════════════════════════════╝

📋 TASK: {plan.get('task_title', 'Unknown')}
📊 STATUS: {plan.get('status', 'Unknown')}
🎯 PRIORITY: {plan.get('priority', 'Unknown')}
⏱️  ESTIMATED: {plan.get('estimated_hours', 0)} hours

📝 DESCRIPTION:
{plan.get('description', 'No description')}

🔧 IMPLEMENTATION STEPS:""")
        
        for i, step in enumerate(steps, 1):
            print(f"  {i}. {step.get('title', 'Unknown')}")
            print(f"     {step.get('description', 'No description')}")
            if step.get('files'):
                print(f"     Files: {', '.join(step.get('files', []))}")
            if step.get('symbols_to_create'):
                print(f"     Symbols: {', '.join(step.get('symbols_to_create', []))}")
            print()
        
        if files:
            print("📁 FILES TO MODIFY:")
            for file_path in files:
                print(f"  {file_path}")
        else:
            print("📁 FILES: None specified")
    
    def _print_inventory_status(self, status):
        """Pretty-print inventory status"""
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║              REPOSITORY INVENTORY STATUS                      ║
║            Last Updated: {status.timestamp}
╚══════════════════════════════════════════════════════════════╝

📦 FILES: {status.total_files} total, {status.files['unique_demos']} demos, {status.files['unique_systems']} systems

📚 DEMOS:""")
        
        for demo_name, demo_status in sorted(status.demos.items()):
            print(f"  {demo_name:20s} {demo_status['files']:3d} files  {demo_status['docstring_coverage']:5.1f}%  {demo_status['status']}")
        
        print(f"""
🔧 SYSTEMS:""")
        
        for system_name, system_status in sorted(status.systems.items()):
            print(f"  {system_name:20s} {system_status['files']:3d} files  {system_status['docstring_coverage']:5.1f}%  {system_status['status']}")
        
        print(f"""
📖 DOCSTRINGS: {status.docstrings['coverage_percent']:.1f}% coverage
  Total symbols: {status.docstrings['total_symbols']}
  With docstrings: {status.docstrings['with_docstrings']}
  Missing: {status.docstrings['missing_docstrings']}
""")
    
    def _generate_markdown_report(self, status, reporter):
        """Generate markdown report for printing"""
        lines = [
            "# Repository Inventory Status",
            f"Generated: {status.timestamp}",
            "",
            "## Summary",
            f"- Total Files: {status.total_files}",
            f"- Demos: {status.files['unique_demos']}",
            f"- Systems: {status.files['unique_systems']}",
            f"- Docstring Coverage: {status.docstrings['coverage_percent']:.1f}%",
            "",
            "## By Demo",
        ]
        
        for demo_name, demo_status in sorted(status.demos.items()):
            status_emoji = demo_status['status'].replace('✅', 'Complete').replace('🔄', 'In Progress').replace('❌', 'Incomplete')
            lines.append(f"- **{demo_name}**: {demo_status['files']} files, {demo_status['docstring_coverage']:.1f}% coverage {status_emoji}")
        
        lines.extend(["", "## By System"])
        
        for system_name, system_status in sorted(status.systems.items()):
            status_emoji = system_status['status'].replace('✅', 'Complete').replace('🔄', 'In Progress').replace('❌', 'Incomplete')
            lines.append(f"- **{system_name}**: {system_status['files']} files, {system_status['docstring_coverage']:.1f}% coverage {status_emoji}")
        
        lines.extend(["", "## Missing Docstrings (Top 20)"])
        
        missing = reporter.get_missing_docstrings(20)
        for i, item in enumerate(missing, 1):
            lines.append(f"{i}. `{item['symbol']}` ({item['type']}) - {item['file']}:{item['line']}")
        
        return "\n".join(lines)
    
    def show_status(self):
        """Show current DGT Engine status"""
        status = self.get_current_status()
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    ADJ SYSTEM - DGT ENGINE STATUS              ║
╚══════════════════════════════════════════════════════════════╝

📊 TEST FLOOR: {status['test_floor']} / {status['protected_minimum']} (protected minimum)

🏗️  PHASE STATUS:
  Phase 1: Entity Unification {status['phases']['phase_1']['status']} ({status['phases']['phase_1']['tests']} tests)
  Phase 2: ECS Foundation     {status['phases']['phase_2']['status']} ({status['phases']['phase_2']['tests']} tests)
  Phase 3: Tower Defense     {status['phases']['phase_3']['status']} ({status['phases']['phase_3']['tests']} tests)

🎯 ACTIVE MILESTONE: M_PHASE3

🚫 CURRENT BLOCKERS:""")
        
        if status['blockers']:
            for i, blocker in enumerate(status['blockers'], 1):
                print(f"  {i}. {blocker['description']} ({blocker['fix_time']} fix)")
        else:
            print("  ✅ No blockers identified")
        
        print(f"""
🔥 TOP PRIORITIES:""")
        
        for priority in status['priorities']:
            print(f"  {priority['priority']}. {priority['task']} ({priority['status']})")
        
        print(f"""
📋 NEXT ACTIONS:
  1. Review blockers above
  2. Address highest priority item
  3. Run 'python adj.py next' for detailed next steps
  4. Run 'python adj.py approve phase3' to approve Phase 3

📖 FULL DASHBOARD: {self.dashboard_file}
""")
        self.show_cost()  # Add cost display
    
    def show_phase(self, phase_number: str):
        """Show specific phase status"""
        phases = {
            "1": {
                "name": "Entity Unification",
                "status": "✅ Complete",
                "milestone": "M1",
                "goals": ["G1: Unified Creature System"],
                "achievements": [
                    "Single Creature class across all demos",
                    "Unified genome system",
                    "Consistent creature behavior"
                ],
                "test_count": 545
            },
            "2": {
                "name": "ECS Foundation",
                "status": "✅ Complete", 
                "milestone": "M2",
                "goals": ["G2: ECS Architecture"],
                "achievements": [
                    "KinematicsComponent + System",
                    "BehaviorComponent + System",
                    "ComponentRegistry + SystemRunner",
                    "ECS proven in Garden integration"
                ],
                "test_count": 583
            },
            "3": {
                "name": "Tower Defense Integration",
                "status": "🔄 In Planning",
                "milestone": "M_PHASE3",
                "goals": ["G3: Multi-Genre Support", "G4: Monetizable Platform", "G5: Production Infrastructure"],
                "achievements": [
                    "Architecture locked (8/8 decisions)",
                    "Sprite systems audited",
                    "Multi-tenant strategy defined"
                ],
                "test_count": "Target 785",
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
        
        if phase_number not in phases:
            print(f"❌ Phase {phase_number} not found. Use: 1, 2, or 3")
            return
        
        phase = phases[phase_number]
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    PHASE {phase_number}: {phase['name']}              ║
╚══════════════════════════════════════════════════════════════╝

📊 STATUS: {phase['status']}
🎯 MILESTONE: {phase['milestone']}
🎯 GOALS: {', '.join(phase['goals'])}

🏆 ACHIEVEMENTS:""")
        
        for achievement in phase['achievements']:
            print(f"  ✅ {achievement}")
        
        if 'test_count' in phase:
            print(f"\n📊 TEST COUNT: {phase['test_count']}")
        
        if 'sub_phases' in phase:
            print(f"\n📋 SUB-PHASES:")
            for sub_phase in phase['sub_phases']:
                print(f"  🔄 {sub_phase}")
        
        print(f"""
📖 MORE INFO: Check {self.dashboard_file} for full details
""")
    
    def show_priorities(self):
        """Show current priorities"""
        priorities = self.get_priorities()
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                        TOP PRIORITIES                          ║
╚══════════════════════════════════════════════════════════════╝
""")
        
        for priority in priorities:
            status_emoji = "✅" if priority['status'] == "✅ Complete" else "🔄"
            print(f"""
{priority['priority']}. {priority['task']}
   Status: {status_emoji} {priority['status']}
   Impact: {priority['impact']}
   Time: {priority['time']}
""")
    
    def show_blockers(self):
        """Show current blockers"""
        blockers = self.get_blockers()
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                          CURRENT BLOCKERS                        ║
╚══════════════════════════════════════════════════════════════╝
""")
        
        if blockers:
            for i, blocker in enumerate(blockers, 1):
                print(f"""
{i}. {blocker['description']}
   Type: {blocker['type']}
   Impact: {blocker['impact']}
   Fix Time: {blocker['fix_time']}
""")
        else:
            print("✅ NO BLOCKERS IDENTIFIED")
            print("All systems operational and ready for development.")
    
    def show_next(self):
        """Show next actions"""
        status = self.get_current_status()
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                          NEXT ACTIONS                            ║
╚══════════════════════════════════════════════════════════════╝

🎯 IMMEDIATE (This Session):
""")
        
        if status['blockers']:
            print("1. Address blockers:")
            for blocker in status['blockers']:
                print(f"   - Fix {blocker['description']} ({blocker['fix_time']})")
        else:
            print("1. ✅ No blockers - proceed with priorities")
        
        print(f"""
2. Review Phase 3 architecture:
   - Check {self.dashboard_file}
   - Verify 8 critical decisions
   - Confirm timeline (6-8 sessions)

3. Director decision needed:
   - Run: python adj.py approve phase3
   - Approve Phase 3 specification
   - Unlock implementation

🚀 SHORT-TERM (Next Session):
""")
        
        if status['priorities'][1]['status'] == "🔄 Awaiting Director":
            print("1. Await Director approval for Phase 3")
            print("2. Once approved, begin Phase 3.0 implementation")
        else:
            print("1. Begin Phase 3.0: ECS Rendering Refactor")
            print("2. Add RenderComponent to ECS system")
            print("3. Create RenderingSystem for ECS pipeline")
        
        print(f"""
📋 COMMANDS TO USE:
  python adj.py status      - Full status overview
  python adj.py phase 3     - Phase 3 details
  python adj.py priorities  - Current priorities
  python adj.py approve 3   - Approve Phase 3 (Director only)
  python adj.py update      - Update dashboard
""")
    
    def approve_phase(self, phase_number: str):
        """Director approval for phase"""
        if phase_number != "3":
            print("❌ Only Phase 3 requires approval at this time")
            return
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    DIRECTOR APPROVAL REQUEST                   ║
╚══════════════════════════════════════════════════════════════╝

🎯 PHASE 3: Tower Defense Integration
📊 Test Target: 785+ passing tests
⏱️  Timeline: 6-8 sessions (40-60 hours)
🏗️  Architecture: Modular sprite-driven engine
🎮  Tenants: Slime Garden (primary) + Fantasy RPG (proof)

✅ CRITICAL DECISIONS LOCKED (8/8):
  1. RenderComponent: Add NOW (Phase 3.0)
  2. RenderingSystem: FULL ECS pipeline
  3. Enemy Sprites: FREE (OpenGameArt/itch.io)
  4. Animation: FULL Framework
  5. Multi-Tenant Config: Implement NOW
  6. Projectiles: Simple (procedural)
  7. Tower Selection: Existing highlight
  8. Turbo Shells: KEEP alive

🎯 SUCCESS CRITERIA:
  - 785+ tests passing
  - Tower Defense playable with pixel-gen towers + sprite enemies
  - Fantasy RPG playable with same code, different assets
  - Multi-tenant configuration proven
  - Zero breaking changes to existing demos

⚠️  RISK ASSESSMENT: LOW
  - All systems exist (SlimeRenderer, SpriteLoader, ECS)
  - Architecture proven (Phase 1-2 complete)
  - No blockers identified
  - Full test coverage planned

📋 IMPLEMENTATION PHASES:
  3.0: ECS Rendering Refactor (690+ tests)
  3.1: Grid System & Components (710+ tests)
  3.2: Tower Defense Systems (730+ tests)
  3.3: TD Session & Persistence (745+ tests)
  3.4: TD Scene & Integration (755+ tests)
  3.5: Fantasy RPG Tenant (770+ tests)
  3.6: Archive & Documentation (785+ tests)

🤔 DIRECTOR DECISION REQUIRED:
""")
        
        response = input("Approve Phase 3? (yes/no/conditional): ").lower().strip()
        
        if response == "yes":
            self._record_approval("phase3", "APPROVED")
            print("✅ Phase 3 APPROVED!")
            print("🚀 PyPro Architect can now proceed with specification.")
            print("📋 Next: Coding Agent will begin Phase 3.0 implementation.")
        elif response == "conditional":
            conditions = input("Conditions: ").strip()
            self._record_approval("phase3", f"CONDITIONAL: {conditions}")
            print(f"🔄 Phase 3 CONDITIONALLY APPROVED")
            print(f"Conditions: {conditions}")
        elif response == "no":
            self._record_approval("phase3", "REJECTED")
            print("❌ Phase 3 REJECTED")
            print("📋 Please provide feedback for revision.")
        else:
            print("❌ Invalid response. Use: yes, no, or conditional")
    
    def _record_approval(self, phase: str, decision: str):
        """Record director approval"""
        approval_file = self.docs_dir / "approvals.json"
        
        approvals = {}
        if approval_file.exists():
            with open(approval_file, 'r') as f:
                approvals = json.load(f)
        
        approvals[phase] = {
            "decision": decision,
            "timestamp": datetime.now().isoformat(),
            "test_floor": self.get_test_count()
        }
        
        with open(approval_file, 'w') as f:
            json.dump(approvals, f, indent=2)
    
    def update_dashboard(self):
        """Update dashboard with current state"""
        status = self.get_current_status()
        
        # Update the dashboard file
        if self.dashboard_file.exists():
            # Read existing dashboard
            with open(self.dashboard_file, 'r') as f:
                content = f.read()
            
            # Update timestamp and test floor
            content = content.replace(
                f"**Last Updated**: ",
                f"**Last Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n**Test Floor**: {status['test_floor']} / 462 (protected minimum)"
            )
            
            with open(self.dashboard_file, 'w') as f:
                f.write(content)
            
            print(f"✅ Dashboard updated: {self.dashboard_file}")
            print(f"📊 Test floor: {status['test_floor']}")
        else:
            print(f"❌ Dashboard file not found: {self.dashboard_file}")


def main():
    parser = argparse.ArgumentParser(description='ADJ - Autonomous Development Governance')
    parser.add_argument('command', nargs='?', default='boot')
    parser.add_argument('arg', nargs='?')
    parser.add_argument('arg2', nargs='?')
    
    args = parser.parse_args()
    
    adj = ADJSystem()
    
    # Boot sequence - detect and confirm context
    if args.command == "boot" or args.command == "status":
        adj.detect_and_confirm_context()
    
    # Polish a demo
    elif args.command == "polish":
        if not args.arg:
            print("Usage: python adj.py polish <demo_name>")
            return
        
        adj.detect_and_confirm_context()
        
        print(f"\n🎨 Creating polish plan for {args.arg}...")
        
        from src.tools.apj.agents.local_agent import LocalAgent
        agent = LocalAgent(adj.root_dir)
        
        # Create polish task
        task = {
            "id": f"POLISH_{args.arg.upper()}",
            "title": f"Polish {args.arg} Demo",
            "description": f"Complete and polish {args.arg} demo based on project status",
            "files": [],  # Auto-detect from agent
            "hours": 10
        }
        
        success = agent.execute_task(task)
        
        if success:
            print(f"\n✅ Polish complete. Ready to test.")
            # Offer to run game
            should_test = input("Run game? (y/n): ").strip().lower() == 'y'
            if should_test:
                adj._run_game(args.arg)
    
    # Execute a planned action
    elif args.command == "execute":
        if not args.arg:
            print("Usage: python adj.py execute <action>")
            return
        
        adj.detect_and_confirm_context()
        
        print(f"\n🚀 Executing: {args.arg}...")
        
        from src.tools.apj.agents.local_agent import LocalAgent
        agent = LocalAgent(adj.root_dir)
        
        # Create task from action
        task = {
            "id": "ACTION_" + args.arg.split(':')[0].replace(' ', '_').upper(),
            "title": args.arg,
            "description": f"Execute: {args.arg}",
            "files": [],
            "hours": 10
        }
        
        success = agent.execute_task(task)
        
        if success:
            print(f"\n✅ Action complete.")
    
    # Create detailed plan
    elif args.command == "plan":
        if not args.arg:
            print("Usage: python adj.py plan <action>")
            return
        
        print(f"\n📋 Creating detailed plan for: {args.arg}...\n")
        
        from src.tools.apj.agents.local_agent import LocalAgent
        agent = LocalAgent(adj.root_dir)
        
        # Use agent to create plan
        plan_prompt = f"""
Create a detailed step-by-step implementation plan for:
{args.arg}

Consider:
- Current project state and blockers
- Existing code and patterns
- Design pillars and technical decisions
- Estimated effort per step
- Success criteria for completion

Provide as JSON with detailed steps.
"""
        
        from pydantic_ai import Agent
        plan_agent = Agent(agent.ollama_model)
        response = plan_agent.run(plan_prompt)
        print(response.data)
    
    # Check if agent can handle task
    elif args.command == "check":
        if not args.arg:
            print("Usage: python adj.py check <action>")
            return
        
        print(f"\n🔍 Checking if agent can handle: {args.arg}...\n")
        
        from src.tools.apj.agents.local_agent import LocalAgent
        agent = LocalAgent(adj.root_dir)
        
        # Create test task
        task = {
            "id": "CHECK_" + args.arg.split(':')[0].replace(' ', '_').upper(),
            "title": args.arg,
            "description": f"Check: {args.arg}",
            "files": [],
            "hours": 10
        }
        
        context = agent._build_task_context(task)
        
        can_proceed, failure = agent.failure_detector.check_before_planning(context)
        
        if can_proceed:
            print(f"✅ Agent can handle this task safely\n")
        else:
            print(agent.failure_handler.handle_failure(failure))
    
    # Swarm management commands
    elif args.command == "swarm":
        if not args.arg:
            print("Usage: python adj.py swarm [status|list|add|templates|suggest]")
            return
        
        if args.arg == "status":
            print(f"\n🐝 Swarm Ecosystem Status:")
            from src.tools.apj.agents.intent_parser import ConversationalInterface
            from src.tools.apj.agents.agent_boot import AGENT_BOOT_MANAGER
            chat = ConversationalInterface(adj.root_dir, adj._get_ollama_model())
            
            if chat.swarm:
                # Get comprehensive swarm status
                status = chat.swarm.get_swarm_status()
                
                print(f"Total Swarm Agents: {status['total_agents']}")
                print(f"Swarm Agents: {', '.join(status['available_agents'])}")
                
                # Show ecosystem status
                if 'ecosystem' in status:
                    eco = status['ecosystem']
                    print(f"\n🤖 Existing Agents: {eco['existing_agents']}")
                    print(f"👶 Child Agents: {eco['child_agents']}")
                    print(f"🔗 A2A-Enabled Agents: {eco['a2a_enabled_agents']}")
                    print(f"🛠️ Available Tools: {len(eco['available_tools'])} tools")
                
                # Show communication status
                if 'communication' in status:
                    comm = status['communication']
                    print(f"\n💬 Communication:")
                    print(f"  Pending Messages: {comm['pending_messages']}")
                    print(f"  Message History: {comm['message_history_size']}")
                
                # Show agent details
                print(f"\n📋 Agent Details:")
                for agent_type, details in status['agent_details'].items():
                    print(f"  {agent_type}: {details['name']} ({details['department']})")
                
                # Show boot manager status if available
                try:
                    boot_status = AGENT_BOOT_MANAGER.boot_time
                    if boot_status:
                        duration = (datetime.now() - boot_status).total_seconds()
                        print(f"\n⏱️  Boot Time: {duration:.2f}s ago")
                except:
                    pass
            else:
                print("❌ Swarm ecosystem not initialized")
        
        elif args.arg == "list":
            print(f"\n📋 Swarm Capabilities:")
            from src.tools.apj.agents.swarm_manager import SwarmManager
            from src.tools.apj.agents.intent_parser import ConversationalInterface
            
            if chat.swarm:
                manager = SwarmManager(chat.swarm, adj.root_dir)
                capabilities = manager.get_swarm_capabilities()
                
                print(f"Total Agents: {capabilities['total_agents']}")
                print(f"Total Templates: {capabilities['total_templates']}")
                print(f"Available Roles: {', '.join(capabilities['available_roles'])}")
                
                print(f"\nAgent Capabilities:")
                for role, details in capabilities['agent_details'].items():
                    print(f"  {role}:")
                    print(f"    Name: {details['name']}")
                    print(f"    Capabilities: {details['capabilities_count']}")
                    print(f"    Dependencies: {details['dependencies_count']}")
                    print(f"    Can Coordinate: {details['can_coordinate']}")
                    print(f"    Can Code: {details['can_code']}")
                    print(f"    Can Test: {details['can_test']}")
                    print(f"    Can Plan: {details['can_plan']}")
            else:
                print("❌ Swarm not initialized")
        
        elif args.arg == "templates":
            print(f"\n📄 Agent Templates:")
            from src.tools.apj.agents.swarm_manager import SwarmManager
            from src.tools.apj.agents.intent_parser import ConversationalInterface
            
            chat = ConversationalInterface(adj.root_dir, adj._get_ollama_model())
            if chat.swarm:
                manager = SwarmManager(chat.swarm, adj.root_dir)
                manager.list_templates()
            else:
                print("❌ Swarm not initialized")
        
        elif args.arg == "add":
            if not args.arg2:
                print("Usage: python adj.py swarm add <template_name>")
                return
            
            print(f"\n➕ Adding agent from template: {args.arg2}")
            from src.tools.apj.agents.swarm_manager import SwarmManager
            from src.tools.apj.agents.intent_parser import ConversationalInterface
            
            chat = ConversationalInterface(adj.root_dir, adj._get_ollama_model())
            if chat.swarm:
                manager = SwarmManager(chat.swarm, adj.root_dir)
                
                # Try to get extension template
                from src.tools.apj.agents.swarm_manager import get_extension_template
                template = get_extension_template(args.arg2)
                
                if template:
                    manager.add_agent_template(template)
                    manager.create_agent_from_template(template.name)
                else:
                    print(f"❌ Unknown template: {args.arg2}")
                    print("Available extensions: documentation, performance, security, deployment")
            else:
                print("❌ Swarm not initialized")
        
        elif args.arg == "suggest":
            print(f"\n💡 Swarm Extension Suggestions:")
            from src.tools.apj.agents.swarm_manager import SwarmManager
            from src.tools.apj.agents.intent_parser import ConversationalInterface
            
            chat = ConversationalInterface(adj.root_dir, adj._get_ollama_model())
            if chat.swarm:
                manager = SwarmManager(chat.swarm, adj.root_dir)
                suggestions = manager.suggest_extensions()
                
                if suggestions:
                    for suggestion in suggestions:
                        print(f"  • {suggestion}")
                else:
                    print("  No specific suggestions - swarm is well-rounded")
            else:
                print("❌ Swarm not initialized")
        
        else:
            print(f"Unknown swarm command: {args.arg}")
            print("Available: status, list, templates, add, suggest")
    
    # Existing commands
    elif args.command == "design":
        # Legacy design command still available
        if not args.arg:
            print("Usage: python adj.py design \"<vision>\"")
            return
        
        from src.tools.apj.orchestrator import AdjOrchestrator
        orchestrator = AdjOrchestrator(Path("."))
        orchestrator.design_game(args.arg)
    
    elif args.command == "status":
        if args.arg == "project":
            from src.tools.apj.project_status import ProjectStatus
            status = ProjectStatus(adj.root_dir)
            status.print_report()
        else:
            adj.detect_and_confirm_context()
    
    elif args.command == "phase":
        if not args.arg:
            print("❌ Phase number required. Use: 1, 2, or 3")
            return
        adj.show_phase(args.arg)
    
    elif args.command == "priorities":
        adj.show_priorities()
    
    elif args.command == "blockers":
        adj.show_blockers()
    
    elif args.command == "next":
        adj.show_next()
    
    elif args.command == "approve":
        adj.show_approve()
    
    elif args.command == "update":
        adj.show_update()
    
    elif args.command == "strategy":
        adj.show_strategy()
    
    elif args.command == "inventory":
        if not args.arg:
            adj.show_inventory_status()
        elif args.arg == "status":
            adj.show_inventory_status()
            adj.get_batch_status(args.arg2)
        else:
            print("Usage: python adj.py execute [batch <milestone>|resume <batch_id>|status <batch_id>]")
    elif args.command == "reality":
        adj.show_reality_status()
    elif args.command == "gaps":
        adj.show_alignment_gaps()
    elif args.command == "models":
        if not args.arg:
            adj.show_model_status()
        elif args.arg == "status":
            adj.show_model_status()
        elif args.arg == "usage":
            adj.show_model_usage()
        elif args.arg == "policy":
            adj.show_routing_policy()
        elif args.arg == "test":
            from src.tools.apj.agents.test_models import test_all
            test_all()
        elif args.arg == "ollama":
            from src.tools.apj.agents.ollama_client import verify_models
            results = verify_models()
            
            print("\nOllama Model Status:")
            for model, present in results.items():
                status = "✅" if present else "❌"
                print(f"  {status} {model}")
        else:
            print("Usage: python adj.py models [status|usage|policy|test|ollama]")
    elif args.command == "test":
        if args.arg == "models":
            from src.tools.apj.agents.test_models import test_all
            test_all()
        else:
            print("Usage: python adj.py test models")
    else:
        print("❌ Unknown command")
        parser.print_help()


if __name__ == "__main__":
    main()
