"""
Agent Swarm - Coordinated Multi-Agent System
Multiple specialized agents working together with clear boundaries
"""

import json
from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path


class AgentRole(Enum):
    """Specialized agent roles in the swarm"""
    COORDINATOR = "coordinator"          # Orchestrates other agents
    PLANNER = "planner"                  # Creates detailed plans
    CODER = "coder"                      # Generates and modifies code
    TESTER = "tester"                    # Runs and validates tests
    ANALYZER = "analyzer"                # Analyzes code and project state
    EXECUTOR = "executor"                # Executes actions and commands
    REVIEWER = "reviewer"                # Reviews code and decisions


@dataclass
class AgentCapability:
    """What an agent can do"""
    role: AgentRole
    name: str
    description: str
    capabilities: List[str]
    dependencies: List[AgentRole]  # What other agents it needs
    output_format: str  # What it returns


@dataclass
class SwarmTask:
    """Task for the agent swarm"""
    id: str
    description: str
    required_capabilities: List[str]
    input_data: Dict[str, Any]
    expected_output: str
    priority: str  # "high", "medium", "low"


class AgentSwarm:
    """
    Coordinated multi-agent system
    Each agent has clear responsibilities and boundaries
    """
    
    def __init__(self, ollama_model, project_root: Path):
        self.ollama = ollama_model
        self.project_root = project_root
        self.agents = {}
        self.task_queue = []
        self.completed_tasks = []
        
        # Initialize specialized agents
        self._initialize_agents()
    
    def _initialize_agents(self) -> None:
        """Initialize all specialized agents"""
        
        # Coordinator Agent - Orchestrates everything
        self.agents[AgentRole.COORDINATOR] = AgentCapability(
            role=AgentRole.COORDINATOR,
            name="Coordinator",
            description="Orchestrates other agents and manages task flow",
            capabilities=[
                "coordinate_tasks",
                "assign_agents",
                "validate_dependencies",
                "monitor_progress",
                "handle_failures"
            ],
            dependencies=[],
            output_format="task_assignment"
        )
        
        # Planner Agent - Creates detailed plans
        self.agents[AgentRole.PLANNER] = AgentCapability(
            role=AgentRole.PLANNER,
            name="Planner",
            description="Creates detailed step-by-step implementation plans",
            capabilities=[
                "create_implementation_plan",
                "break_down_tasks",
                "estimate_effort",
                "identify_dependencies",
                "validate_plan_feasibility"
            ],
            dependencies=[AgentRole.ANALYZER],
            output_format="implementation_plan"
        )
        
        # Coder Agent - Generates code
        self.agents[AgentRole.CODER] = AgentCapability(
            role=AgentRole.CODER,
            name="Coder",
            description="Generates and modifies code following patterns",
            capabilities=[
                "generate_code",
                "modify_existing_code",
                "refactor_code",
                "add_tests",
                "follow_patterns"
            ],
            dependencies=[AgentRole.PLANNER, AgentRole.ANALYZER],
            output_format="code_changes"
        )
        
        # Tester Agent - Validates code
        self.agents[AgentRole.TESTER] = AgentCapability(
            role=AgentRole.TESTER,
            name="Tester",
            description="Runs tests and validates implementation",
            capabilities=[
                "run_tests",
                "validate_code_quality",
                "check_functionality",
                "performance_test",
                "integration_test"
            ],
            dependencies=[AgentRole.CODER],
            output_format="test_results"
        )
        
        # Analyzer Agent - Understands project
        self.agents[AgentRole.ANALYZER] = AgentCapability(
            role=AgentRole.ANALYZER,
            name="Analyzer",
            description="Analyzes code and project state",
            capabilities=[
                "analyze_codebase",
                "understand_patterns",
                "identify_issues",
                "extract_dependencies",
                "assess_complexity"
            ],
            dependencies=[],
            output_format="analysis_report"
        )
        
        # Executor Agent - Executes actions
        self.agents[AgentRole.EXECUTOR] = AgentCapability(
            role=AgentRole.EXECUTOR,
            name="Executor",
            description="Executes actions and commands",
            capabilities=[
                "execute_commands",
                "run_builds",
                "deploy_code",
                "manage_processes",
                "handle_errors"
            ],
            dependencies=[AgentRole.TESTER],
            output_format="execution_report"
        )
        
        # Reviewer Agent - Reviews work
        self.agents[AgentRole.REVIEWER] = AgentCapability(
            role=AgentRole.REVIEWER,
            name="Reviewer",
            description="Reviews code and decisions",
            capabilities=[
                "review_code",
                "validate_decisions",
                "check_compliance",
                "suggest_improvements",
                "quality_assurance"
            ],
            dependencies=[AgentRole.CODER, AgentRole.TESTER],
            output_format="review_report"
        )
    
    def process_request(self, user_request: str, context: Dict) -> Dict:
        """
        Process a user request through the agent swarm
        
        Returns: Result from swarm processing
        """
        
        print(f"🐝 Swarm processing: {user_request}")
        
        # Step 1: Coordinator analyzes request
        coordinator_result = self._call_agent(
            AgentRole.COORDINATOR,
            f"""
User request: "{user_request}"

Available agents in swarm:
{self._get_agent_summary()}

Project context:
{json.dumps(context.get('project_status', {}), indent=2)}

Analyze this request and determine:
1. Which agents are needed
2. What the task breakdown should be
3. Priority and dependencies
4. Expected output format

Return as JSON with task assignments.
""",
            "task_assignment"
        )
        
        print(f"📋 Coordinator result: {coordinator_result}")
        
        # Step 2: Execute task assignments
        try:
            import re
            
            # Look for JSON block in the response
            # First try to find JSON in markdown code blocks
            json_match = re.search(r'```json\s*\n(.*?)\n```', coordinator_result, re.DOTALL)
            
            if not json_match:
                # Try to find JSON with explicit markers
                json_match = re.search(r'```json\s*(.*?)\s*```', coordinator_result, re.DOTALL)
            
            if not json_match:
                # Try to find JSON between "Task Assignment" and next section
                json_match = re.search(r'Task Assignment.*?```json\s*\n(.*?)\n```', coordinator_result, re.DOTALL)
            
            if not json_match:
                # Fallback: look for any JSON-like structure
                json_match = re.search(r'\{[\s\S]*?\}', coordinator_result)
            
            if json_match:
                # Extract the JSON content
                json_content = json_match.group(1) if json_match.lastindex == 1 else json_match.group()
                
                # Clean up the JSON content - remove leading/trailing whitespace and newlines
                json_content = json_content.strip()
                
                # Additional cleaning: remove any leading newlines or special characters
                while json_content and not json_content.startswith('{'):
                    json_content = json_content[1:].strip()
                
                # Fix escaped newlines and other escape sequences
                # First, handle common escape patterns
                json_content = json_content.replace('\\n', ' ').replace('\\t', ' ')
                
                # Handle escaped quotes properly
                json_content = json_content.replace('\\"', '"')
                
                # Remove any remaining problematic characters except valid JSON chars
                valid_json_chars = set(' \t\n\r{}[],:"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ._-')
                json_content = ''.join(char for char in json_content if char in valid_json_chars)
                
                # Clean up multiple spaces
                json_content = ' '.join(json_content.split())
                
                print(f"🔍 Debug: Cleaned JSON content: {json_content[:200]}...")
                
                # Parse the JSON
                task_assignments = json.loads(json_content)
                
                # Handle both "tasks" array and direct task object
                if "tasks" in task_assignments:
                    return self._execute_task_assignments(task_assignments["tasks"], context)
                elif "task_assignments" in task_assignments:
                    return self._execute_task_assignments(task_assignments["task_assignments"], context)
                else:
                    return self._execute_task_assignments([task_assignments], context)
            else:
                print("🔍 Debug: No JSON found in coordinator response")
                print(f"🔍 Debug: Coordinator result preview: {coordinator_result[:500]}...")
                return {"error": "Could not find JSON in coordinator response"}
                
        except json.JSONDecodeError as e:
            print(f"🔍 Debug: JSON decode error: {e}")
            print(f"🔍 Debug: JSON content was: {json_content if 'json_content' in locals() else 'N/A'}")
            return {"error": f"JSON decode error: {e}"}
        except Exception as e:
            print(f"🔍 Debug: General error: {e}")
            return {"error": f"Failed to process coordinator response: {e}"}
    
    def _execute_task_assignments(self, assignments, context: Dict) -> Dict:
        """Execute the task assignments from coordinator"""
        
        results = {}
        
        # Handle both list of tasks and dict of tasks
        if isinstance(assignments, list):
            # It's a list of task objects
            for i, task in enumerate(assignments):
                task_id = task.get("task_id", f"task_{i}")
                print(f"🔄 Executing task: {task_id}")
                
                # Determine which agent to use
                agent_name = task.get("agent", "")
                if agent_name:
                    # Extract the agent role from the agent name
                    # Handle formats like "Analyzer (analyzer)" or just "analyzer"
                    if "(" in agent_name:
                        # Extract the role from parentheses
                        role_match = re.search(r'\(([^)]+)\)', agent_name)
                        if role_match:
                            agent_role = self._map_task_to_agent(role_match.group(1))
                        else:
                            agent_role = self._map_task_to_agent(agent_name)
                    else:
                        agent_role = self._map_task_to_agent(agent_name)
                    
                    if not agent_role:
                        results[task_id] = {"error": f"No agent available for: {agent_name}"}
                        continue
                    
                    # Call the agent
                    agent_result = self._call_agent(
                        agent_role,
                        f"""
Task: {task.get('description', '')}

Context:
{json.dumps(context, indent=2)}

Execute this task and provide detailed results.
""",
                        "text"  # Use text format for now
                    )
                    
                    results[task_id] = {
                        "agent": agent_role.value,
                        "result": agent_result,
                        "status": "completed"
                    }
                else:
                    results[task_id] = {"error": "No agents specified for task"}
        
        else:
            # It's a dict of tasks (original format)
            for task_id, task_info in assignments.items():
                print(f"🔄 Executing task: {task_id}")
                
                # Determine which agent to use
                agent_role = self._map_task_to_agent(task_info.get("task_type", ""))
                
                if not agent_role:
                    results[task_id] = {"error": f"No agent available for task type: {task_info.get('task_type')}"}
                    continue
                
                # Call the agent
                agent_result = self._call_agent(
                    agent_role,
                    f"""
Task: {task_info.get('description', '')}

Context:
{json.dumps(context, indent=2)}

Execute this task and provide detailed results.
""",
                    task_info.get("output_format", "text")
                )
                
                results[task_id] = {
                    "agent": agent_role.value,
                    "result": agent_result,
                    "status": "completed"
                }
        
        return results
    
    def _call_agent(self, role: AgentRole, prompt: str, expected_format: str = "text") -> str:
        """Call a specific agent with the given prompt"""
        
        agent = self.agents[role]
        
        agent_prompt = f"""
You are {agent.name}, the {agent.description}.

Your capabilities: {', '.join(agent.capabilities)}

Current project context is available through the coordinator.

{prompt}

Provide your response in {expected_format} format.
Be thorough and follow best practices.
"""
        
        try:
            from pydantic_ai import Agent
            from pydantic_ai.models.openai import OpenAIModel
            import asyncio
            
            # Create agent with the model
            ai_agent = Agent(self.ollama)
            
            # Run the agent synchronously
            response = asyncio.run(ai_agent.run(agent_prompt))
            
            # Extract the actual data
            response_text = response.data if hasattr(response, 'data') else str(response)
            return response_text
            
        except Exception as e:
            return f"Error calling {agent.name}: {e}"
    
    def _get_agent_summary(self) -> str:
        """Get summary of all agents"""
        summary = []
        for role, agent in self.agents.items():
            summary.append(f"- {agent.name} ({role.value}): {agent.description}")
        return "\n".join(summary)
    
    def _map_task_to_agent(self, task_type: str) -> Optional[AgentRole]:
        """Map task type to appropriate agent"""
        
        # Normalize the task type
        task_type = task_type.lower().strip()
        
        # Handle various agent name formats
        if "analyzer" in task_type or "analyze" in task_type:
            return AgentRole.ANALYZER
        elif "planner" in task_type or "plan" in task_type:
            return AgentRole.PLANNER
        elif "coder" in task_type or "code" in task_type or "implement" in task_type:
            return AgentRole.CODER
        elif "tester" in task_type or "test" in task_type:
            return AgentRole.TESTER
        elif "executor" in task_type or "execute" in task_type:
            return AgentRole.EXECUTOR
        elif "reviewer" in task_type or "review" in task_type:
            return AgentRole.REVIEWER
        elif "coordinator" in task_type or "coordinate" in task_type:
            return AgentRole.COORDINATOR
        
        # Fallback to original mapping
        task_mapping = {
            "analyze": AgentRole.ANALYZER,
            "plan": AgentRole.PLANNER,
            "code": AgentRole.CODER,
            "test": AgentRole.TESTER,
            "execute": AgentRole.EXECUTOR,
            "review": AgentRole.REVIEWER,
            "coordinate": AgentRole.COORDINATOR
        }
        
        return task_mapping.get(task_type)
    
    def add_agent(self, role: AgentRole, capability: AgentCapability) -> None:
        """Add a new agent to the swarm"""
        
        self.agents[role] = capability
        print(f"✅ Added new agent: {capability.name}")
    
    def get_swarm_status(self) -> Dict:
        """Get current status of the swarm"""
        
        return {
            "total_agents": len(self.agents),
            "available_roles": [role.value for role in self.agents.keys()],
            "agent_details": {
                role.value: {
                    "name": agent.name,
                    "capabilities": len(agent.capabilities),
                    "dependencies": [d.value for d in agent.dependencies]
                }
                for role, agent in self.agents.items()
            },
            "task_queue_size": len(self.task_queue),
            "completed_tasks": len(self.completed_tasks)
        }
