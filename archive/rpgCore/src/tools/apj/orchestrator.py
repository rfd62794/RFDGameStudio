"""
ADJ Orchestrator - Single command entry point for agentic swarm
Coordinates: Vision parsing, spec generation, Agent execution, game testing
"""

import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, Optional
import json
from datetime import datetime


class AdjOrchestrator:
    """Master orchestrator for entire development pipeline"""
    
    def __init__(self, project_root: Path = Path(".")):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.src_dir = self.project_root / "src"
        self.agent_process = None
        self.game_process = None
        
        # Session tracking
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_dir = self.docs_dir / "sessions" / self.session_id
        self.session_dir.mkdir(parents=True, exist_ok=True)
    
    def design_game(self, vision: str) -> None:
        """
        Single command entry point for designing and building a game
        
        Usage: python adj.py design "Tower Defense with genetics"
        
        Flow:
          1. Parse vision (ask clarifying questions)
          2. Generate specs (auto-create design docs)
          3. Generate tasks (auto-create task list)
          4. Execute tasks (spawn Agent)
          5. Test game (run game.py)
        """
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    ADJ SWARM ORCHESTRATOR                     ║
║              Building: {vision[:40]}...
╚══════════════════════════════════════════════════════════════╝

📋 Phase 1: Vision Parsing & Clarification
═════════════════════════════════════════════════════════════════
""")
        
        # Phase 1: Parse vision through conversation
        design_pillars = self._interactive_vision_parse(vision)
        
        print(f"""
✅ Vision parsed and clarified
📊 Extracted {len(design_pillars.get('pillars', []))} design pillars

📋 Phase 2: Auto-Generate Design Documents
═════════════════════════════════════════════════════════════════
""")
        
        # Phase 2: Auto-generate specs
        feature_spec = self._auto_generate_feature_spec(design_pillars)
        system_specs = self._auto_generate_system_specs(feature_spec)
        technical_design = self._auto_generate_technical_design(system_specs)
        
        print(f"""
✅ DESIGN_PILLARS.md generated
✅ FEATURE_SPEC.md generated
✅ SYSTEM_SPECS.md generated
✅ TECHNICAL_DESIGN.md generated

📋 Phase 3: Auto-Generate Task Breakdown
═════════════════════════════════════════════════════════════════
""")
        
        # Phase 3: Generate tasks
        tasks = self._auto_generate_tasks(technical_design)
        
        print(f"""
✅ TASKS.md generated ({len(tasks)} tasks)

📋 Phase 4: Spawn Agent (Autonomous Execution)
═════════════════════════════════════════════════════════════════
""")
        
        # Phase 4: Spawn Agent as subprocess
        agent_success = self._spawn_agent_subprocess(tasks)
        
        if not agent_success:
            print("❌ Agent execution failed")
            return
        
        print(f"""
✅ Agent completed all tasks
📊 Game implementation ready

📋 Phase 5: Run Game for Testing
═════════════════════════════════════════════════════════════════
""")
        
        # Phase 5: Run game
        self._run_game()
        
        print(f"""
✅ Testing complete
📊 Session saved: {self.session_dir}

════════════════════════════════════════════════════════════════
All done! Game is built and tested.
════════════════════════════════════════════════════════════════
""")
    
    def _interactive_vision_parse(self, vision: str) -> Dict:
        """
        Interactive conversation to parse and clarify vision
        Uses Claude to ask clarifying questions
        """
        
        print(f"Your vision: {vision}\n")
        print("ADJ analyzing and asking clarifying questions...\n")
        
        # Use Claude (via ModelRouter) to understand vision
        from src.tools.apj.agents.model_router import ModelRouter
        from src.tools.apj.agents.model_contracts import ModelRequest, TaskType
        
        router = ModelRouter()
        
        prompt = f"""
You are a game design architect. A designer just described their game vision:

Vision: {vision}

Your job:
1. Understand what they're trying to build
2. Ask 3-5 clarifying questions to understand scope, constraints, core mechanics
3. Based on their answers, extract design pillars (non-negotiable principles)

Ask questions one at a time. Wait for their answer before asking the next.

Be conversational, not robotic.
"""
        
        request = ModelRequest(
            task_type=TaskType.REASONING,
            prompt=prompt,
            max_tokens=1000
        )
        
        response = router.route_request(request)
        print(f"ADJ: {response.response}\n")
        
        # Get user input for first question
        answers = []
        for i in range(3):  # 3 clarifying questions
            user_answer = input("You: ").strip()
            answers.append(user_answer)
            
            if i < 2:  # Ask for next question
                prompt = f"""
Based on this answer: "{user_answer}"

Ask your next clarifying question about the game design.
Be specific and conversational.
"""
                request = ModelRequest(
                    task_type=TaskType.REASONING,
                    prompt=prompt,
                    max_tokens=500
                )
                response = router.route_request(request)
                print(f"ADJ: {response.response}\n")
        
        # Extract design pillars
        design_pillars = self._extract_design_pillars(vision, answers)
        
        return design_pillars
    
    def _extract_design_pillars(self, vision: str, answers: list) -> Dict:
        """Extract design pillars from vision and clarifications"""
        
        from src.tools.apj.agents.model_router import ModelRouter
        from src.tools.apj.agents.model_contracts import ModelRequest, TaskType
        
        router = ModelRouter()
        
        prompt = f"""
Game Vision: {vision}

Clarifications:
{chr(10).join(f'Q{i}: {answers[i]}' for i in range(len(answers)))}

Extract the core design pillars (non-negotiable principles) for this game.

Return as JSON:
{{
  "game_name": "string",
  "core_concept": "string",
  "pillars": [
    {{"pillar": "string", "why": "string"}},
    ...
  ],
  "scope": {{"in": [...], "out": [...]}},
  "must_have_features": [...]
}}
"""
        
        request = ModelRequest(
            task_type=TaskType.REASONING,
            prompt=prompt,
            max_tokens=2000
        )
        
        response = router.route_request(request)
        
        try:
            pillars = json.loads(response.response)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            pillars = {
                "game_name": "New Game",
                "core_concept": vision,
                "pillars": [{"pillar": "Core gameplay", "why": vision}]
            }
        
        # Save to session
        pillars_file = self.session_dir / "design_pillars.json"
        with open(pillars_file, 'w') as f:
            json.dump(pillars, f, indent=2)
        
        return pillars
    
    def _auto_generate_feature_spec(self, pillars: Dict) -> Dict:
        """Auto-generate feature specification"""
        
        from src.tools.apj.agents.model_router import ModelRouter
        from src.tools.apj.agents.model_contracts import ModelRequest, TaskType
        
        router = ModelRouter()
        
        prompt = f"""
Based on these design pillars:
{json.dumps(pillars, indent=2)}

Generate a detailed FEATURE_SPEC that lists:
1. All core features that must exist
2. Features that are out of scope
3. Success criteria for each feature

Return as JSON with structure:
{{
  "core_features": [
    {{"name": "string", "description": "string", "acceptance_criteria": [...]}}
  ],
  "out_of_scope": [...],
  "feature_count": int
}}
"""
        
        request = ModelRequest(
            task_type=TaskType.REASONING,
            prompt=prompt,
            max_tokens=3000
        )
        
        response = router.route_request(request)
        
        try:
            features = json.loads(response.response)
        except json.JSONDecodeError:
            features = {"core_features": []}
        
        # Save to session
        features_file = self.session_dir / "feature_spec.json"
        with open(features_file, 'w') as f:
            json.dump(features, f, indent=2)
        
        print(f"✅ Generated {len(features.get('core_features', []))} core features")
        
        return features
    
    def _auto_generate_system_specs(self, features: Dict) -> Dict:
        """Auto-generate system specifications"""
        
        from src.tools.apj.agents.model_router import ModelRouter
        from src.tools.apj.agents.model_contracts import ModelRequest, TaskType
        
        router = ModelRouter()
        
        prompt = f"""
Based on these features:
{json.dumps(features, indent=2)}

Design the game systems that implement these features:

Return as JSON:
{{
  "systems": [
    {{
      "name": "string",
      "purpose": "string",
      "components": ["ComponentName"],
      "systems": ["SystemName"],
      "integrations": ["OtherSystem"]
    }}
  ]
}}

Use existing DGT Engine systems where applicable (ECS, Genetics, Physics, Rendering, UI).
"""
        
        request = ModelRequest(
            task_type=TaskType.REASONING,
            prompt=prompt,
            max_tokens=3000
        )
        
        response = router.route_request(request)
        
        try:
            systems = json.loads(response.response)
        except json.JSONDecodeError:
            systems = {"systems": []}
        
        # Save to session
        systems_file = self.session_dir / "system_specs.json"
        with open(systems_file, 'w') as f:
            json.dump(systems, f, indent=2)
        
        print(f"✅ Designed {len(systems.get('systems', []))} game systems")
        
        return systems
    
    def _auto_generate_technical_design(self, systems: Dict) -> Dict:
        """Auto-generate technical design with architecture decisions"""
        
        from src.tools.apj.agents.model_router import ModelRouter
        from src.tools.apj.agents.model_contracts import ModelRequest, TaskType
        
        router = ModelRouter()
        
        prompt = f"""
Based on these systems:
{json.dumps(systems, indent=2)}

Create a technical design that includes:
1. Architecture decisions and why
2. Performance targets
3. Quality gates
4. Integration with DGT Engine existing systems

Return as JSON with structure:
{{
  "architecture_decisions": [
    {{"decision": "string", "why": "string", "impact": "string"}}
  ],
  "performance_targets": {{"target": "metric", "value": "number"}},
  "quality_gates": ["requirement"],
  "file_structure": {{"path": "description"}}
}}
"""
        
        request = ModelRequest(
            task_type=TaskType.REASONING,
            prompt=prompt,
            max_tokens=3000
        )
        
        response = router.route_request(request)
        
        try:
            technical = json.loads(response.response)
        except json.JSONDecodeError:
            technical = {"architecture_decisions": []}
        
        # Save to session
        technical_file = self.session_dir / "technical_design.json"
        with open(technical_file, 'w') as f:
            json.dump(technical, f, indent=2)
        
        print(f"✅ Created technical design with {len(technical.get('architecture_decisions', []))} decisions")
        
        return technical
    
    def _auto_generate_tasks(self, technical: Dict) -> list:
        """Auto-generate task breakdown from technical design"""
        
        from src.tools.apj.agents.model_router import ModelRouter
        from src.tools.apj.agents.model_contracts import ModelRequest, TaskType
        
        router = ModelRouter()
        
        prompt = f"""
Based on this technical design:
{json.dumps(technical, indent=2)}

Break down into concrete implementation tasks.

Each task should have:
- Task ID
- Title
- Description  
- Files to create/modify
- Success criteria
- Estimated hours
- Dependencies

Return as JSON:
{{
  "tasks": [
    {{
      "id": "T_X",
      "title": "string",
      "description": "string",
      "files": ["path/to/file.py"],
      "success": ["criterion1", "criterion2"],
      "hours": 2,
      "depends_on": ["T_X-1"]
    }}
  ]
}}
"""
        
        request = ModelRequest(
            task_type=TaskType.REASONING,
            prompt=prompt,
            max_tokens=4000
        )
        
        response = router.route_request(request)
        
        try:
            task_data = json.loads(response.response)
            tasks = task_data.get("tasks", [])
        except json.JSONDecodeError:
            tasks = []
        
        # Save to session
        tasks_file = self.session_dir / "tasks.json"
        with open(tasks_file, 'w') as f:
            json.dump({"tasks": tasks}, f, indent=2)
        
        print(f"✅ Generated {len(tasks)} implementation tasks")
        
        return tasks
    
    def _spawn_agent_subprocess(self, tasks: list) -> bool:
        """Spawn local agent (Ollama-based, fully autonomous)"""
        
        print("\n🤖 Spawning Local Agent (Ollama)...\n")
        
        try:
            from src.tools.apj.agents.local_agent import LocalAgent
            
            agent = LocalAgent(self.project_root)
            
            # Execute each task
            completed = 0
            failed = 0
            
            for task in tasks:
                success = agent.execute_task(task)
                
                if success:
                    completed += 1
                else:
                    failed += 1
                    # Continue to next task even if one fails
            
            print(f"\n{'='*60}")
            print(f"✅ Agent completed: {completed}/{len(tasks)} tasks")
            if failed > 0:
                print(f"❌ Failed: {failed} tasks")
            print(f"{'='*60}\n")
            
            return failed == 0
        
        except Exception as e:
            print(f"❌ Agent error: {e}")
            return False
    
    def _run_game(self) -> None:
        """Run game.py for testing"""
        
        print("\n🎮 Launching game for testing...\n")
        
        game_script = self.src_dir / "apps" / "game.py"
        
        if not game_script.exists():
            print(f"⚠️  game.py not found at {game_script}")
            return
        
        try:
            # Run game (blocks until window closes)
            self.game_process = subprocess.Popen(
                [sys.executable, str(game_script)],
                cwd=self.project_root
            )
            
            # Wait for game to close
            self.game_process.wait()
            
            print("✅ Game closed")
        
        except Exception as e:
            print(f"❌ Failed to run game: {e}")
