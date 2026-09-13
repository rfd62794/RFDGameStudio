"""
Context Detector - Boot-time project state analysis
Scans codebase and documentation, presents current state for confirmation
"""

from pathlib import Path
from typing import Dict, List, Optional
import json
from datetime import datetime


class ContextDetector:
    """
    Automatically detect project state on boot
    Know what exists, what's partial, what's needed
    """
    
    def __init__(self, project_root: Path = Path(".")):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.src_dir = self.project_root / "src"
        
        self.context = {
            "timestamp": datetime.now().isoformat(),
            "documentation": {},
            "codebase": {},
            "demos": {},
            "systems": {},
            "project_status": {},
            "blockers": [],
            "next_actions": []
        }
    
    def detect_all(self) -> Dict:
        """Comprehensive project state detection"""
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║              SCANNING PROJECT STATE                           ║
╚══════════════════════════════════════════════════════════════╝
""")
        
        # Detect documentation
        print("\n📚 Detecting Documentation...")
        self._detect_documentation()
        
        # Detect codebase structure
        print("\n📁 Detecting Codebase Structure...")
        self._detect_codebase()
        
        # Detect demos
        print("\n🎮 Detecting Demos...")
        self._detect_demos()
        
        # Detect systems
        print("\n🔧 Detecting Systems...")
        self._detect_systems()
        
        # Analyze project status
        print("\n📊 Analyzing Project Status...")
        self._analyze_project_status()
        
        # Identify blockers and next steps
        print("\n🚫 Identifying Blockers...")
        self._identify_blockers()
        
        print("\n💡 Planning Next Actions...")
        self._plan_next_actions()
        
        return self.context
    
    def _detect_documentation(self) -> None:
        """Detect all documentation files"""
        
        doc_files = [
            "VISION.md",
            "GOALS.md",
            "DESIGN_PILLARS.md",
            "MILESTONES.md",
            "TASKS.md",
            "INVENTORY_REPORT.md",
        ]
        
        phase_docs = [
            "phase3/FEATURE_SPEC.md",
            "phase3/SYSTEM_SPECS.md",
            "phase3/TECHNICAL_DESIGN.md",
        ]
        
        for doc in doc_files:
            path = self.docs_dir / doc
            if path.exists():
                with open(path) as f:
                    content = f.read()
                self.context["documentation"][doc] = {
                    "exists": True,
                    "size_kb": len(content) / 1024,
                    "lines": len(content.split('\n'))
                }
                print(f"  ✅ {doc}")
            else:
                self.context["documentation"][doc] = {"exists": False}
                print(f"  ❌ {doc}")
        
        for doc in phase_docs:
            path = self.docs_dir / doc
            if path.exists():
                with open(path) as f:
                    content = f.read()
                self.context["documentation"][doc] = {
                    "exists": True,
                    "size_kb": len(content) / 1024,
                    "lines": len(content.split('\n'))
                }
                print(f"  ✅ {doc}")
    
    def _detect_codebase(self) -> None:
        """Detect codebase structure"""
        
        # Count files by type
        py_files = list(self.src_dir.rglob("*.py"))
        test_files = [f for f in py_files if "test" in f.name or "tests" in str(f)]
        impl_files = [f for f in py_files if f not in test_files]
        
        self.context["codebase"] = {
            "total_python_files": len(py_files),
            "implementation_files": len(impl_files),
            "test_files": len(test_files),
            "total_lines": sum(len(f.read_text(encoding='utf-8').split('\n')) for f in impl_files[:50]),  # Sample
            "structure": {
                "src/shared": len(list((self.src_dir / "shared").rglob("*.py"))) if (self.src_dir / "shared").exists() else 0,
                "src/apps": len(list((self.src_dir / "apps").rglob("*.py"))) if (self.src_dir / "apps").exists() else 0,
                "src/demos": len(list((self.src_dir / "demos").rglob("*.py"))) if (self.src_dir / "demos").exists() else 0,
                "src/tools": len(list((self.src_dir / "tools").rglob("*.py"))) if (self.src_dir / "tools").exists() else 0,
            }
        }
        
        print(f"  ✅ {len(py_files)} Python files found")
        print(f"     - {len(impl_files)} implementation files")
        print(f"     - {len(test_files)} test files")
    
    def _detect_demos(self) -> None:
        """Detect demos and their status"""
        
        demos_dir = self.src_dir / "demos"
        
        demos_to_check = [
            ("racing", "Racing Demo"),
            ("dungeon", "Dungeon Demo"),
            ("tower_defense", "Tower Defense Demo"),
            ("breeding", "Breeding Demo"),
            ("slime_breeder", "Slime Breeder"),
        ]
        
        for demo_key, demo_name in demos_to_check:
            demo_path = demos_dir / demo_key if demos_dir.exists() else None
            
            if demo_path and demo_path.exists():
                files = list(demo_path.rglob("*.py"))
                
                # Estimate completion
                completion = self._estimate_completion(demo_key)
                
                self.context["demos"][demo_key] = {
                    "name": demo_name,
                    "exists": True,
                    "file_count": len(files),
                    "estimated_completion": completion,
                    "has_main": (demo_path / "main.py").exists() or (demo_path / "scene.py").exists()
                }
                
                status = "✅ Complete" if completion >= 90 else (
                    "🔄 Partial" if completion >= 50 else "❌ Early"
                )
                print(f"  {status} {demo_name} ({completion}% complete)")
            else:
                self.context["demos"][demo_key] = {
                    "name": demo_name,
                    "exists": False
                }
    
    def _detect_systems(self) -> None:
        """Detect systems and their completeness"""
        
        systems_to_check = [
            ("ecs", "ECS System"),
            ("genetics", "Genetics System"),
            ("rendering", "Rendering System"),
            ("physics", "Physics System"),
            ("ui", "UI System"),
            ("pathfinding", "Pathfinding System"),
        ]
        
        shared_dir = self.src_dir / "shared" if self.src_dir.exists() else None
        
        for system_key, system_name in systems_to_check:
            system_path = shared_dir / system_key if shared_dir else None
            
            if system_path and system_path.exists():
                files = list(system_path.rglob("*.py"))
                test_files = [f for f in files if "test" in f.name]
                
                coverage = len(test_files) / max(1, len(files) - len(test_files)) * 100
                coverage = min(100, coverage)
                
                self.context["systems"][system_key] = {
                    "name": system_name,
                    "exists": True,
                    "file_count": len(files),
                    "test_coverage": coverage,
                    "status": "✅ Complete" if coverage >= 80 else (
                        "🔄 Partial" if coverage >= 50 else "❌ Basic"
                    )
                }
                
                print(f"  {self.context['systems'][system_key]['status']} {system_name} ({coverage:.0f}% test coverage)")
    
    def _analyze_project_status(self) -> None:
        """Analyze overall project status using ProjectStatus"""
        
        try:
            from src.tools.apj.project_status import ProjectStatus
            analyzer = ProjectStatus(self.project_root)
            status = analyzer.analyze_complete_project()
            
            self.context["project_status"] = {
                "goals": {
                    goal_id: goal['status'] 
                    for goal_id, goal in status['by_goal'].items()
                },
                "demos": {
                    demo: data['status']
                    for demo, data in status['by_demo'].items()
                },
                "systems": {
                    system: data['status']
                    for system, data in status['by_system'].items()
                }
            }
        except Exception as e:
            print(f"  ⚠️  Could not analyze project status: {e}")
    
    def _identify_blockers(self) -> None:
        """Identify critical blockers"""
        
        blockers = [
            {
                "blocker": "ECS RenderingSystem missing",
                "impact": "Blocks: Dungeon, Tower Defense, visual systems",
                "task": "T_3_0: ECS Rendering Refactor",
                "effort": "4 hours",
                "critical": True
            },
            {
                "blocker": "Tower Defense incomplete",
                "impact": "Blocks: G3 (multi-genre proof)",
                "task": "Phase 3 (6 tasks)",
                "effort": "40-60 hours",
                "critical": True
            }
        ]
        
        self.context["blockers"] = blockers
        
        for blocker in blockers:
            icon = "🔴" if blocker["critical"] else "🟡"
            print(f"  {icon} {blocker['blocker']}")
            print(f"     Impact: {blocker['impact']}")
    
    def _plan_next_actions(self) -> None:
        """Plan next actions based on current state"""
        
        next_actions = [
            {
                "priority": 1,
                "action": "Build T_3_0: ECS Rendering System",
                "description": "Create RenderComponent, AnimationComponent, RenderingSystem",
                "effort": "4 hours",
                "unblocks": ["Dungeon completion", "Tower Defense start", "Visual systems"]
            },
            {
                "priority": 2,
                "action": "Complete Dungeon Demo",
                "description": "Polish existing dungeon, add missing features, prove multi-genre",
                "effort": "10-15 hours",
                "unblocks": ["G3 proof", "Phase 3 confidence"]
            },
            {
                "priority": 3,
                "action": "Execute Tower Defense Phase 3",
                "description": "Full Tower Defense implementation with genetics integration",
                "effort": "40-60 hours",
                "unblocks": ["G3 completion", "G4 monetization path"]
            }
        ]
        
        self.context["next_actions"] = next_actions
        
        for action in next_actions:
            print(f"  {action['priority']}. {action['action']} ({action['effort']})")
    
    def _estimate_completion(self, demo_key: str) -> int:
        """Estimate demo completion percentage"""
        
        # Known completion levels
        completions = {
            "racing": 95,
            "breeding": 90,
            "dungeon": 40,
            "tower_defense": 5,
            "slime_breeder": 60,
        }
        
        return completions.get(demo_key, 0)
    
    def print_summary(self) -> None:
        """Print formatted summary for user review"""
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║              PROJECT STATE SUMMARY                            ║
╚══════════════════════════════════════════════════════════════╝

📚 DOCUMENTATION
{json.dumps({k: v for k, v in self.context['documentation'].items() if isinstance(v, dict) and v.get('exists')}, indent=2)}

💻 CODEBASE
  Total files: {self.context['codebase'].get('total_python_files', 0)}
  Implementation: {self.context['codebase'].get('implementation_files', 0)}
  Tests: {self.context['codebase'].get('test_files', 0)}

🎮 DEMOS
{json.dumps({k: f"{v['estimated_completion']}% complete" for k, v in self.context['demos'].items() if v.get('exists')}, indent=2)}

🔧 SYSTEMS
{json.dumps({k: v['status'] for k, v in self.context['systems'].items() if v.get('exists')}, indent=2)}

🎯 PROJECT STATUS
{json.dumps({k: v for k, v in self.context['project_status'].items()}, indent=2)}

🔴 CRITICAL BLOCKERS
""")
        
        for blocker in self.context.get('blockers', []):
            if blocker.get('critical'):
                print(f"  • {blocker['blocker']}")
                print(f"    → {blocker['impact']}")

        print(f"""
🚀 NEXT ACTIONS (In Priority Order)
""")
        
        for action in self.context.get('next_actions', []):
            print(f"  {action['priority']}. {action['action']} ({action['effort']})")
            print(f"     {action['description']}")
            print(f"     Unblocks: {', '.join(action['unblocks'])}")
            print()
