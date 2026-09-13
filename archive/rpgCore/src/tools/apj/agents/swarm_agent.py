"""
Swarm Agent Integration - Integrates existing agents with swarm coordination
Uses BaseAgent framework, tools, child agents, and A2A communication
"""

import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

from .base_agent import BaseAgent, AgentConfig, PromptConfig
from .agent_registry import AGENT_REGISTRY, AgentCapability, AgentType
from .tools import TOOL_REGISTRY, ToolResult
from .child_agent import CHILD_AGENT_MANAGER, ChildAgentManager
from .a2a_communication import A2A_MANAGER, MessageHandler, MessageType, MessagePriority, A2AMessage
from .model_router import ModelRouter

logger = logging.getLogger(__name__)


class SwarmCoordinator(BaseAgent):
    """
    Enhanced Swarm Coordinator with full agent ecosystem integration
    - Integrates existing agents (strategist, archivist, herald, docstring)
    - Provides tools to agents
    - Enables child agent creation
    - Supports agent-to-agent communication
    """
    
    def __init__(self, config: AgentConfig, force_reinit: bool = False):
        super().__init__(config)
        self.model_router = ModelRouter()
        self.swarm_agents = {}
        self._initialize_swarm_agents(force_reinit)
        self._setup_a2a_handler()
        self._integrate_existing_agents()
    
    def _setup_a2a_handler(self):
        """Setup A2A communication handler"""
        self.message_handler = MessageHandler(self.config.name)
        
        # Set A2A support flag
        self.message_handler.supports_a2a = True
        
        # Register message handlers
        self.message_handler.register_handler(MessageType.REQUEST, self._handle_request)
        self.message_handler.register_handler(MessageType.TASK, self._handle_task)
        self.message_handler.register_handler(MessageType.NOTIFICATION, self._handle_notification)
        
        # Register with A2A manager with metadata indicating support
        try:
            A2A_MANAGER.register_agent(self.config.name, self.message_handler)
            logger.info(f"🔗 Swarm coordinator registered for A2A communication")
        except Exception as e:
            logger.error(f"❌ Failed to register swarm coordinator: {e}")
            # Ensure the handler supports A2A even if registration failed
            self.message_handler.supports_a2a = True
    
    def _handle_request(self, message: A2AMessage) -> Optional[A2AMessage]:
        """Handle incoming request messages"""
        try:
            # Process the request
            content = message.content
            task = content.get("task", "")
            context = content.get("context", {})
            
            result = self.process_request(task, context)
            
            # Send response
            return A2AMessage(
                id=str(uuid.uuid4()),
                sender=self.config.name,
                recipient=message.sender,
                message_type=MessageType.RESPONSE,
                priority=MessagePriority.NORMAL,
                content={"result": result, "original_request_id": message.id},
                timestamp=datetime.now(),
                reply_to=message.id
            )
        except Exception as e:
            return A2AMessage(
                id=str(uuid.uuid4()),
                sender=self.config.name,
                recipient=message.sender,
                message_type=MessageType.RESPONSE,
                priority=MessagePriority.NORMAL,
                content={"error": str(e), "original_request_id": message.id},
                timestamp=datetime.now(),
                reply_to=message.id
            )
    
    def _handle_task(self, message: A2AMessage) -> Optional[A2AMessage]:
        """Handle task assignment messages"""
        # Similar to request handling but for task delegation
        return self._handle_request(message)
    
    def _handle_notification(self, message: A2AMessage) -> Optional[A2AMessage]:
        """Handle notification messages (no response needed)"""
        # Log or process notification
        logger.info(f"Received notification from {message.sender}: {message.content}")
        return None
    
    def _integrate_existing_agents(self):
        """Integrate existing agents into swarm"""
        existing_agents = AGENT_REGISTRY.get_agents_by_type(AgentType.SPECIALIST)
        
        for agent_metadata in existing_agents:
            if agent_metadata.config_file:
                try:
                    agent = AGENT_REGISTRY.create_agent_instance(agent_metadata.name)
                    if agent:
                        self.swarm_agents[agent_metadata.name] = agent
                        logger.info(f"Integrated existing agent: {agent_metadata.name}")
                except Exception as e:
                    logger.warning(f"Failed to integrate agent {agent_metadata.name}: {e}")
    
    def _initialize_swarm_agents(self, force_reinit: bool = False) -> None:
        """Initialize all swarm agents using existing BaseAgent framework"""
        
        logger.info("Initializing swarm agents with BaseAgent framework")
        
        # Define swarm agent configurations
        swarm_configs = {
            "coordinator": {
                "name": "swarm_coordinator",
                "role": "Coordinate swarm tasks and manage agent orchestration",
                "department": "planning",
                "model_preference": "local",
                "prompts": {
                    "system": "docs/agents/prompts/coordinator_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                "schema_name": "SwarmTaskAssignment",
                "fallback": {
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Use single agent analysis",
                        "rationale": "Swarm coordination failed",
                        "risk": "low"
                    }
                },
                "open_questions": ["Can you provide more specific details?"],
                "archivist_risks_addressed": [],
                "corpus_hash": ""
            },
            "analyzer": {
                "name": "swarm_analyzer",
                "role": "Analyze codebase and project state",
                "department": "analysis",
                "model_preference": "local",
                "prompts": {
                    "system": "docs/agents/prompts/analyzer_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                "schema_name": "AnalysisReport",
                "fallback": {
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Manual analysis",
                        "rationale": "Agent analysis failed",
                        "risk": "low"
                    }
                },
                "open_questions": ["Can you provide more specific details?"],
                "archivist_risks_addressed": [],
                "corpus_hash": ""
            },
            "planner": {
                "name": "swarm_planner",
                "role": "Create detailed implementation plans",
                "department": "planning",
                "model_preference": "local",
                "prompts": {
                    "system": "docs/agents/prompts/planner_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                "schema_name": "ImplementationPlan",
                "fallback": {
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Manual task assignment",
                        "rationale": "Swarm coordination failed - use manual analysis",
                        "risk": "low"
                    }
                },
                "open_questions": ["Can you provide more specific details?"],
                "archivist_risks_addressed": [],
                "corpus_hash": ""
            },
            "coder": {
                "name": "swarm_coder",
                "role": "Generate and modify code following patterns",
                "department": "execution",
                "model_preference": "local",
                "prompts": {
                    "system": "docs/agents/prompts/coder_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                "schema_name": "CodeChanges",
                "fallback": {
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Manual task assignment",
                        "rationale": "Swarm coordination failed - use manual analysis",
                        "risk": "low"
                    },
                    "alternatives": []
                },
                "open_questions": ["Can you provide more specific details?"],
                "archivist_risks_addressed": [],
                "corpus_hash": ""
            },
            "tester": {
                "name": "swarm_tester",
                "role": "Run tests and validate implementation",
                "department": "execution",
                "model_preference": "local",
                "prompts": {
                    "system": "docs/agents/prompts/tester_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                "schema_name": "TestResults",
                "fallback": {
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Manual task assignment",
                        "rationale": "Swarm coordination failed - use manual analysis",
                        "risk": "low"
                    },
                    "alternatives": []
                },
                "open_questions": ["Can you provide more specific details?"],
                "archivist_risks_addressed": [],
                "corpus_hash": ""
            },
            "reviewer": {
                "name": "swarm_reviewer",
                "role": "Review code and decisions for quality",
                "department": "analysis",
                "model_preference": "local",
                "prompts": {
                    "system": "docs/agents/prompts/reviewer_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                "schema_name": "ReviewReport",
                "fallback": {
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Manual task assignment",
                        "rationale": "Swarm coordination failed - use manual analysis",
                        "risk": "low"
                    },
                    "alternatives": []
                },
                "open_questions": ["Can you provide more specific details?"],
                "archivist_risks_addressed": [],
                "corpus_hash": ""
            },
            "executor": {
                "name": "swarm_executor",
                "role": "Execute actions and commands",
                "department": "execution",
                "model_preference": "local",
                "prompts": {
                    "system": "docs/agents/prompts/executor_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                "schema_name": "ExecutionReport",
                "fallback": {
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Manual task assignment",
                        "rationale": "Swarm coordination failed - use manual analysis",
                        "risk": "low"
                    },
                    "alternatives": []
                },
                "open_questions": ["Can you provide more specific details?"],
                "archivist_risks_addressed": [],
                "corpus_hash": ""
            }
        }
        
        # Initialize each swarm agent
        for agent_type, config_data in swarm_configs.items():
            try:
                # Create AgentConfig from dict
                config = AgentConfig(**config_data)
                
                # Create BaseAgent instance
                agent = BaseAgent(config)
                self.swarm_agents[agent_type] = agent
                
                logger.info(f"Initialized swarm agent: {agent_type}")
                
            except Exception as e:
                logger.error(f"Failed to initialize {agent_type}: {e}")
                # Create fallback agent
                self.swarm_agents[agent_type] = self._create_fallback_agent(agent_type)
    
    def _create_fallback_agent(self, agent_type: str) -> BaseAgent:
        """Create a fallback agent using existing LocalAgent"""
        
        fallback_config = AgentConfig(
            name=f"fallback_{agent_type}",
            role=f"Fallback {agent_type} agent",
            department="execution",
            model_preference="local",
            prompts={
                "system": "docs/agents/prompts/generic_system.md",
                "fewshot": "docs/agents/prompts/generic_system.md"
            },
            schema_name="GenericResponse",
            fallback={
                "recommended": {
                    "label": "FALLBACK",
                    "title": "Manual fallback",
                    "rationale": "Agent system failed",
                    "risk": "low"
                },
                "alternatives": []
            },
            open_questions=["Can you provide more specific details?"],
            archivist_risks_addressed=[],
            corpus_hash=""
        )
        
        return BaseAgent(fallback_config)
    
    def process_request(self, user_request: str, context: Dict) -> Dict:
        """
        Process user request through swarm coordination
        Uses existing BaseAgent framework for each agent
        """
        
        logger.info(f"Processing swarm request: {user_request}")
        
        # Step 1: Use coordinator to analyze and plan
        coordinator_result = self._call_agent(
            "coordinator",
            f"""
User request: "{user_request}"

Available swarm agents: {list(self.swarm_agents.keys())}

Project context:
{json.dumps(context.get('project_status', {}), indent=2)}

Analyze this request and create a task assignment plan.
Use the SwarmTaskAssignment schema for structured output.
"""
        )
        
        # Step 2: Execute task assignments
        if hasattr(coordinator_result, 'tasks'):
            # Pydantic object format
            return self._execute_swarm_tasks(coordinator_result.tasks, context)
        elif isinstance(coordinator_result, dict) and 'tasks' in coordinator_result:
            # Dict format
            return self._execute_swarm_tasks(coordinator_result['tasks'], context)
        else:
            # Fallback: single agent execution
            return self._fallback_execution(user_request, context)
    
    def _call_agent(self, agent_type: str, prompt: str) -> Any:
        """Call a specific swarm agent using BaseAgent framework"""
        
        if agent_type not in self.swarm_agents:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        agent = self.swarm_agents[agent_type]
        
        try:
            # For coordinator, use lower temperature for more consistent JSON
            if agent_type == "coordinator":
                # Temporarily adjust model temperature for coordinator
                original_temp = getattr(agent.model_name, 'temperature', 0.3)
                if hasattr(agent.model_name, 'temperature'):
                    agent.model_name.temperature = 0.1  # Lower temperature for consistent JSON
                
                result = agent.run(prompt)
                
                # Restore original temperature
                if hasattr(agent.model_name, 'temperature'):
                    agent.model_name.temperature = original_temp
            else:
                result = agent.run(prompt)
            
            return result
                
        except Exception as e:
            logger.error(f"Error calling {agent_type}: {e}")
            return {"error": f"Agent {agent_type} failed: {e}"}
    
    def _execute_swarm_tasks(self, tasks: List[Dict], context: Dict) -> Dict:
        """Execute swarm tasks using existing BaseAgent system"""
        
        results = {}
        
        for task in tasks:
            # Handle both dict and Pydantic object formats
            if hasattr(task, 'task_id'):
                # Pydantic object format
                task_id = task.task_id
                agent_type = task.agent
                description = task.description
                focus = getattr(task, 'focus', None)
            else:
                # Dict format
                task_id = task.get("task_id", f"task_{len(results)}")
                agent_type = task.get("agent", "analyzer")
                description = task.get("description", "")
                focus = task.get("focus", None)
            
            print(f" Executing task: {task_id}")
            
            # Normalize agent type
            agent_type = self._normalize_agent_type(agent_type)
            
            if agent_type not in self.swarm_agents:
                results[task_id] = {"error": f"Agent {agent_type} not available"}
                continue
            
            # Execute task using BaseAgent
            task_prompt = f"""
Task: {description}

Context:
{json.dumps(context, indent=2)}

Execute this task and provide detailed results.
Focus: {focus if focus else 'general analysis'}
"""
            
            try:
                result = self._call_agent(agent_type, task_prompt)
                
                results[task_id] = {
                    "agent": agent_type,
                    "result": result,
                    "status": "completed"
                }
                
            except Exception as e:
                results[task_id] = {
                    "agent": agent_type,
                    "error": str(e),
                    "status": "failed"
                }
        
        return results
    
    def _normalize_agent_type(self, agent_type: str) -> str:
        """Normalize agent type names"""
        
        agent_type = agent_type.lower().strip()
        
        # Handle various formats
        if "coordinator" in agent_type:
            return "coordinator"
        elif "analyzer" in agent_type or "analyze" in agent_type:
            return "analyzer"
        elif "planner" in agent_type or "plan" in agent_type:
            return "planner"
        elif "coder" in agent_type or "code" in agent_type:
            return "coder"
        elif "tester" in agent_type or "test" in agent_type:
            return "tester"
        elif "reviewer" in agent_type or "review" in agent_type:
            return "reviewer"
        elif "executor" in agent_type or "execute" in agent_type:
            return "executor"
        else:
            return "analyzer"  # Default fallback
    
    def _fallback_execution(self, user_request: str, context: Dict) -> Dict:
        """Fallback execution using analyzer agent"""
        
        fallback_prompt = f"""
User request: "{user_request}"

Context:
{json.dumps(context, indent=2)}

Please analyze this request and provide a helpful response.
"""
        
        try:
            result = self._call_agent("analyzer", fallback_prompt)
            
            return {
                "fallback_analysis": {
                    "agent": "analyzer",
                    "result": result,
                    "status": "completed"
                }
            }
            
        except Exception as e:
            return {
                "fallback_error": {
                    "error": f"Fallback execution failed: {e}",
                    "status": "failed"
                }
            }
    
    def send_a2a_message(self, recipient: str, message_type: MessageType,
                        content: Dict[str, Any], priority: MessagePriority = MessagePriority.NORMAL) -> str:
        """Send message to another agent"""
        return A2A_MANAGER.send_message(
            sender=self.config.name,
            recipient=recipient,
            message_type=message_type,
            content=content,
            priority=priority
        )
    
    def broadcast_to_all_agents(self, content: Dict[str, Any]) -> str:
        """Broadcast message to all agents"""
        return A2A_MANAGER.broadcast_message(
            sender=self.config.name,
            content=content
        )
    
    def get_swarm_status(self) -> Dict:
        """Get current status of the enhanced swarm"""
        
        # Get basic swarm status
        swarm_status = {
            "total_agents": len(self.swarm_agents),
            "available_agents": list(self.swarm_agents.keys()),
            "agent_details": {
                agent_type: {
                    "name": agent.config.name if hasattr(agent, 'config') else agent_type,
                    "role": agent.config.role if hasattr(agent, 'config') else "Unknown",
                    "department": agent.config.department if hasattr(agent, 'config') else "Unknown",
                }
                for agent_type, agent in self.swarm_agents.items()
            }
        }
        
        # Add ecosystem status
        ecosystem_status = {
            "existing_agents": len(AGENT_REGISTRY.get_agents_by_type(AgentType.SPECIALIST)),
            "child_agents": len(CHILD_AGENT_MANAGER.get_all_children()),
            "a2a_enabled_agents": len([name for name in AGENT_REGISTRY.get_all_agents() 
                                      if AGENT_REGISTRY.supports_a2a(name)]),
            "available_tools": list(TOOL_REGISTRY.get_all_tools().keys())
        }
        
        # Add message queue status
        message_status = {
            "pending_messages": len(A2A_MANAGER.get_pending_messages(self.config.name)),
            "message_history_size": len(A2A_MANAGER.get_message_history(self.config.name))
        }
        
        return {
            **swarm_status,
            "ecosystem": ecosystem_status,
            "communication": message_status
        }
    
    def get_available_agents(self) -> Dict[str, Any]:
        """Get status of swarm agents"""
        
        return {
            "total_agents": len(self.swarm_agents),
            "available_agents": list(self.swarm_agents.keys()),
            "agent_details": {
                agent_type: {
                    "name": agent.config.name if hasattr(agent, 'config') else agent_type,
                    "role": agent.config.role if hasattr(agent, 'config') else "Unknown",
                    "department": agent.config.department if hasattr(agent, 'config') else "Unknown",
                    "model": agent.config.model_preference if hasattr(agent, 'config') else "Unknown"
                }
                for agent_type, agent in self.swarm_agents.items()
            }
        }
