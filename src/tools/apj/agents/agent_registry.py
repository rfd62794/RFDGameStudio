"""
Agent Registry - Central registry for all agents in the system
Manages agent discovery, capabilities, and swarm integration
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import yaml
from pathlib import Path

from .base_agent import BaseAgent, AgentConfig
from .registry import SCHEMA_REGISTRY
from .task_classifier import TaskClassificationResult

class AgentType(Enum):
    """Agent types in the system"""
    SWARM = "swarm"  # Swarm coordination agents
    SPECIALIST = "specialist"  # Domain-specific agents
    TOOL = "tool"  # Tool/utility agents
    CHILD = "child"  # Dynamically created child agents

class AgentCapability(Enum):
    """Agent capabilities"""
    ANALYSIS = "analysis"
    PLANNING = "planning"
    CODING = "coding"
    TESTING = "testing"
    REVIEW = "review"
    EXECUTION = "execution"
    STRATEGY = "strategy"
    ARCHIVAL = "archival"
    COMMUNICATION = "communication"
    DOCUMENTATION = "documentation"
    COORDINATION = "coordination"
    DEBUGGING = "debugging"
    ARCHITECTURE = "architecture"
    GENETICS = "genetics"
    UI = "ui"
    INTEGRATION = "integration"

@dataclass
class AgentMetadata:
    """Metadata for registered agents"""
    name: str
    agent_type: AgentType
    capabilities: List[AgentCapability]
    department: str
    description: str
    config_file: Optional[str] = None
    tools: List[str] = None
    can_create_children: bool = False
    supports_a2a: bool = False  # Agent-to-Agent communication
    parent_agent: Optional[str] = None
    child_agents: List[str] = None
    # New fields for specialists
    specialty: Optional[str] = None  # e.g., "documentation", "architecture"
    tool_categories: List[str] = None  # e.g., ["file_ops", "code_ops"]
    context_size: int = 2000
    dependencies: List[str] = None  # Other agents this agent depends on

class AgentRegistry:
    """Central registry for all agents"""
    
    def __init__(self):
        self._agents: Dict[str, AgentMetadata] = {}
        self._agent_instances: Dict[str, BaseAgent] = {}
        self._load_existing_agents()
    
    def _load_existing_agents(self):
        """Load existing agents from configs"""
        config_dir = Path("docs/agents/configs")
        
        # Load known existing agents
        existing_agents = {
            "strategist": AgentMetadata(
                name="strategist",
                agent_type=AgentType.SPECIALIST,
                capabilities=[AgentCapability.STRATEGY, AgentCapability.PLANNING],
                department="planning",
                description="Strategic planning and goal setting",
                config_file="strategist.yaml",
                can_create_children=True,
                supports_a2a=True
            ),
            "archivist": AgentMetadata(
                name="archivist", 
                agent_type=AgentType.SPECIALIST,
                capabilities=[AgentCapability.ARCHIVAL, AgentCapability.DOCUMENTATION],
                department="memory",
                description="Document management and archival",
                config_file="archivist.yaml",
                can_create_children=False,
                supports_a2a=True
            ),
            "herald": AgentMetadata(
                name="herald",
                agent_type=AgentType.SPECIALIST,
                capabilities=[AgentCapability.COMMUNICATION],
                department="persona",
                description="Communication and messaging",
                config_file="herald.yaml",
                can_create_children=False,
                supports_a2a=True
            ),
            "docstring": AgentMetadata(
                name="docstring",
                agent_type=AgentType.TOOL,
                capabilities=[AgentCapability.DOCUMENTATION],
                department="tools",
                description="Code documentation generation",
                config_file="docstring.yaml",
                can_create_children=False,
                supports_a2a=False
            )
        }
        
        # Add swarm agents
        swarm_agents = {
            "coordinator": AgentMetadata(
                name="coordinator",
                agent_type=AgentType.SWARM,
                capabilities=[AgentCapability.PLANNING, AgentCapability.COORDINATION],
                department="planning",
                description="Swarm task coordination",
                can_create_children=True,
                supports_a2a=True
            ),
            "analyzer": AgentMetadata(
                name="analyzer",
                agent_type=AgentType.SWARM,
                capabilities=[AgentCapability.ANALYSIS],
                department="analysis",
                description="Codebase analysis",
                can_create_children=False,
                supports_a2a=True
            ),
            "planner": AgentMetadata(
                name="planner",
                agent_type=AgentType.SWARM,
                capabilities=[AgentCapability.PLANNING],
                department="planning",
                description="Implementation planning",
                can_create_children=False,
                supports_a2a=True
            ),
            "coder": AgentMetadata(
                name="coder",
                agent_type=AgentType.SWARM,
                capabilities=[AgentCapability.CODING],
                department="execution",
                description="Code generation",
                can_create_children=False,
                supports_a2a=True
            ),
            "tester": AgentMetadata(
                name="tester",
                agent_type=AgentType.SWARM,
                capabilities=[AgentCapability.TESTING],
                department="execution",
                description="Testing and validation",
                can_create_children=False,
                supports_a2a=True
            ),
            "reviewer": AgentMetadata(
                name="reviewer",
                agent_type=AgentType.SWARM,
                capabilities=[AgentCapability.REVIEW],
                department="analysis",
                description="Code review",
                can_create_children=False,
                supports_a2a=True
            ),
            "executor": AgentMetadata(
                name="executor",
                agent_type=AgentType.SWARM,
                capabilities=[AgentCapability.EXECUTION],
                department="execution",
                description="Command execution",
                can_create_children=False,
                supports_a2a=True
            )
        }
        
        self._agents.update(existing_agents)
        self._agents.update(swarm_agents)
    
    def register_agent(self, metadata: AgentMetadata):
        """Register a new agent"""
        self._agents[metadata.name] = metadata
    
    def get_agent_metadata(self, name: str) -> Optional[AgentMetadata]:
        """Get agent metadata"""
        return self._agents.get(name)
    
    def get_agents_by_capability(self, capability: AgentCapability) -> List[AgentMetadata]:
        """Get agents with specific capability"""
        return [agent for agent in self._agents.values() 
                if capability in agent.capabilities]
    
    def get_agents_by_type(self, agent_type: AgentType) -> List[AgentMetadata]:
        """Get agents by type"""
        return [agent for agent in self._agents.values() 
                if agent.agent_type == agent_type]
    
    def can_create_children(self, agent_name: str) -> bool:
        """Check if agent can create children"""
        metadata = self.get_agent_metadata(agent_name)
        return metadata.can_create_children if metadata else False
    
    def supports_a2a(self, agent_name: str) -> bool:
        """Check if agent supports A2A communication"""
        metadata = self.get_agent_metadata(agent_name)
        return metadata.supports_a2a if metadata else False
    
    def get_all_agents(self) -> Dict[str, AgentMetadata]:
        """Get all registered agents"""
        return self._agents.copy()
    
    def create_agent_instance(self, name: str) -> Optional[BaseAgent]:
        """Create agent instance from config"""
        metadata = self.get_agent_metadata(name)
        if not metadata or not metadata.config_file:
            return None
        
        try:
            # Try to load config directly
            config_path = Path("docs/agents/configs") / f"{metadata.config_file}"
            if config_path.exists():
                config_data = yaml.safe_load(config_path.read_text(encoding="utf-8"))
                config = AgentConfig(**config_data)
                agent = BaseAgent(config)
                self._agent_instances[name] = agent
                return agent
            else:
                # Fallback to from_config method
                config = AgentConfig.from_config(name)
                agent = BaseAgent(config)
                self._agent_instances[name] = agent
                return agent
        except Exception as e:
            print(f"Failed to create agent {name}: {e}")
            return None
    
    def get_agent_instance(self, name: str) -> Optional[BaseAgent]:
        """Get existing agent instance or create new one"""
        if name in self._agent_instances:
            return self._agent_instances[name]
        return self.create_agent_instance(name)
    
    def register_specialist(
        self,
        agent_name: str,
        specialty: str,
        capabilities: List[str],
        tool_categories: List[str],
        context_size: int = 2000,
        dependencies: Optional[List[str]] = None,
        display_name: Optional[str] = None
    ) -> None:
        """Register a specialized agent"""
        
        # Convert string capabilities to AgentCapability enum
        agent_capabilities = []
        for cap in capabilities:
            try:
                agent_capabilities.append(AgentCapability(cap))
            except ValueError:
                # Skip unknown capabilities
                continue
        
        # Use display_name if provided, otherwise use agent_name
        final_display_name = display_name or agent_name
        
        # Create AgentMetadata for the specialist
        metadata = AgentMetadata(
            name=final_display_name,  # Use display name for the metadata
            agent_type=AgentType.SPECIALIST,
            capabilities=agent_capabilities,
            department="specialists",
            description=f"Specialist agent for {specialty}",
            tools=tool_categories,
            can_create_children=False,
            supports_a2a=True,
            specialty=specialty,
            tool_categories=tool_categories,
            context_size=context_size,
            dependencies=dependencies or []
        )
        
        # Store in registry with both keys for lookup
        self._agents[final_display_name] = metadata
        self._agents[agent_name] = metadata  # Also store with internal name
    
    def find_agent_by_specialty(self, specialty: str) -> Optional[AgentMetadata]:
        """Find agent by specialty (e.g., "documentation" → documentation_specialist)"""
        
        for agent_name, metadata in self._agents.items():
            if metadata.specialty == specialty:
                return metadata
        
        return None
    
    def find_agent_by_capability(self, capability: str) -> Optional[AgentMetadata]:
        """Find agent that has a specific capability (e.g., "fix_bug" → debugging_specialist)"""
        
        try:
            target_capability = AgentCapability(capability)
        except ValueError:
            # Convert string to known capability
            capability_map = {
                "fix_bug": "debugging",
                "generate_docstrings": "documentation",
                "analyze_architecture": "architecture",
                "implement_genetics": "genetics",
                "design_ui": "ui",
                "test_integration": "integration"
            }
            target_str = capability_map.get(capability, capability)
            try:
                target_capability = AgentCapability(target_str)
            except ValueError:
                return None
        
        for agent_name, metadata in self._agents.items():
            if target_capability in metadata.capabilities:
                return metadata
        
        return None
    
    def find_best_agent_for_task(
        self,
        task_id: str,
        task_classification: TaskClassificationResult
    ) -> AgentMetadata:
        """Find best agent for a task (primary routing method)"""
        
        # Priority: specialty match > capability match > fallback to generic
        
        # Try specialty match first
        if task_classification.detected_type != "generic":
            specialty_agent = self.find_agent_by_specialty(task_classification.detected_type)
            if specialty_agent:
                print(f"Task {task_id} routed to {specialty_agent.name} (specialty match, confidence {task_classification.confidence})")
                return specialty_agent
        
        # Try capability match
        for keyword in task_classification.keywords:
            capability_agent = self.find_agent_by_capability(keyword)
            if capability_agent:
                print(f"Task {task_id} routed to {capability_agent.name} (capability match, confidence {task_classification.confidence})")
                return capability_agent
        
        # Fallback to generic agent
        generic_agent = self.get_agent_metadata("generic_agent")
        if not generic_agent:
            # Create a generic agent if it doesn't exist
            generic_agent = AgentMetadata(
                name="generic_agent",
                agent_type=AgentType.SPECIALIST,
                capabilities=[AgentCapability.EXECUTION],
                department="general",
                description="Generic agent for general tasks",
                tools=["file_ops", "code_ops"]
            )
            self._agents["generic_agent"] = generic_agent
        
        print(f"Task {task_id} routed to {generic_agent.name} (fallback, confidence {task_classification.confidence})")
        return generic_agent
    
    def get_agent_availability(self, agent_name: str) -> Dict[str, Any]:
        """Check if agent is available (not already executing max tasks)"""
        
        metadata = self.get_agent_metadata(agent_name)
        if not metadata:
            return {
                "is_available": False,
                "current_task": None,
                "tasks_completed": 0,
                "efficiency_score": 0.0,
                "error": "Agent not found"
            }
        
        # For now, assume all agents are available
        # In a full implementation, this would check agent workload
        return {
            "is_available": True,
            "current_task": None,
            "tasks_completed": 0,
            "efficiency_score": 1.0,
            "max_concurrent_tasks": 1,
            "current_load": 0
        }
    
    def initialize_specialists(self) -> None:
        """Initialize specialist agents from specialized_agents module"""
        
        # Try to import from specialized_agents module
        try:
            from ..swarm.agents.specialized_agents import SPECIALIZED_AGENTS as SPECIALIST_AGENTS
            
            specialists = SPECIALIST_AGENTS
            
            for specialist in specialists:
                # Filter dependencies to only those that exist
                available_deps = []
                for dep in specialist.dependencies:
                    # Check both by specialty and by name
                    found_agent = None
                    # First try by specialty (e.g., "code_quality")
                    for agent_metadata in self._agents.values():
                        if agent_metadata.specialty == dep:
                            found_agent = agent_metadata
                            break
                    # If not found, try by name (e.g., "Code Quality Specialist")
                    if not found_agent:
                        for agent_metadata in self._agents.values():
                            if agent_metadata.name == dep:
                                found_agent = agent_metadata
                                break
                    
                    if found_agent:
                        available_deps.append(dep)
                    else:
                        print(f"[WARN]  Skipping dependency '{dep}' for {specialist.name} - not found in registry")
                
                self.register_specialist(
                    agent_name=specialist.name,
                    specialty=specialist.specialty.value,
                    capabilities=specialist.capabilities,
                    tool_categories=specialist.tools,
                    context_size=specialist.context_size,
                    dependencies=available_deps
                )
                
                print(f"[OK] Registered specialist: {specialist.name} ({specialist.specialty.value})")
        
        except ImportError as e:
            print(f"[WARN]  Could not import specialist agents: {e}")
            # Fallback: register basic specialists manually
            print("[INFO] Using fallback specialist registration...")
            self._register_fallback_specialists()
    
    def _register_fallback_specialists(self) -> None:
        """Register basic specialists if import fails"""
        
        # First register dependency specialists that others depend on
        dependency_specialists = {
            "code_quality_specialist": {
                "specialty": "code_quality",
                "capabilities": ["code_quality", "analysis", "testing"],
                "tools": ["code_ops", "test_ops"],
                "context_size": 300,
                "dependencies": [],
                "display_name": "Code Quality Specialist"
            },
            "testing_specialist": {
                "specialty": "testing",
                "capabilities": ["testing", "quality_assurance"],
                "tools": ["test_ops", "qa_ops"],
                "context_size": 400,
                "dependencies": [],
                "display_name": "Testing Specialist"
            }
        }
        
        # Register dependency specialists first
        for agent_name, config in dependency_specialists.items():
            self.register_specialist(
                agent_name=agent_name,
                specialty=config["specialty"],
                capabilities=config["capabilities"],
                tool_categories=config["tools"],
                context_size=config["context_size"],
                dependencies=config["dependencies"],
                display_name=config.get("display_name")
            )
            print(f"[OK] Registered fallback specialist: {config.get('display_name', agent_name)} ({config['specialty']})")
        
        # Now register base specialists without dependencies
        base_specialists = {
            "documentation_specialist": {
                "specialty": "documentation",
                "capabilities": ["documentation", "analysis"],
                "tools": ["doc_ops"],
                "context_size": 1000,
                "dependencies": [],
                "display_name": "Documentation Specialist"
            },
            "architecture_specialist": {
                "specialty": "architecture",
                "capabilities": ["architecture", "analysis"],
                "tools": ["analysis_ops"],
                "context_size": 500,
                "dependencies": ["code_quality", "testing"],  # Now these dependencies exist
                "display_name": "Architecture Specialist"
            },
            "genetics_specialist": {
                "specialty": "genetics",
                "capabilities": ["genetics", "breeding"],
                "tools": ["genetics_ops"],
                "context_size": 300,
                "dependencies": ["testing"],  # Now this dependency exists
                "display_name": "Genetics System Specialist"
            },
            "ui_systems_specialist": {
                "specialty": "ui",
                "capabilities": ["ui", "design"],
                "tools": ["ui_ops"],
                "context_size": 200,
                "dependencies": ["testing"],  # Now this dependency exists
                "display_name": "UI Systems Specialist"
            }
        }
        
        # Register base specialists
        for agent_name, config in base_specialists.items():
            # Filter dependencies to only those that exist
            available_deps = []
            for dep in config["dependencies"]:
                # Check both display names and specialties
                found_agent = None
                for agent_metadata in self._agents.values():
                    if agent_metadata.name == dep or agent_metadata.specialty == dep:
                        found_agent = agent_metadata
                        break
                
                if found_agent:
                    available_deps.append(dep)
                else:
                    print(f"[WARN]  Skipping dependency '{dep}' for {config['display_name']} - not found in registry")
            
            self.register_specialist(
                agent_name=agent_name,
                specialty=config["specialty"],
                capabilities=config["capabilities"],
                tool_categories=config["tools"],
                context_size=config["context_size"],
                dependencies=available_deps,
                display_name=config.get("display_name")
            )
            print(f"[OK] Registered fallback specialist: {config.get('display_name', agent_name)} ({config['specialty']})")
        
        # Now register specialists with dependencies
        dependent_specialists = {
            "integration_specialist": {
                "specialty": "integration",
                "capabilities": ["integration", "testing"],
                "tools": ["integration_ops"],
                "context_size": 400,
                "dependencies": ["testing", "architecture"],
                "display_name": "Integration Specialist"
            },
            "debugging_specialist": {
                "specialty": "debugging",
                "capabilities": ["debugging", "testing"],
                "tools": ["debug_ops"],
                "context_size": 250,
                "dependencies": ["testing"],
                "display_name": "Debugging Specialist"
            }
        }
        
        # Register dependent specialists
        for agent_name, config in dependent_specialists.items():
            # Filter dependencies to only those that exist - check both display names and internal names
            available_deps = []
            for dep in config["dependencies"]:
                # First try to find by display name (e.g., "Testing Specialist")
                found_agent = None
                for agent_metadata in self._agents.values():
                    if agent_metadata.name == dep or agent_metadata.specialty == dep:
                        found_agent = agent_metadata
                        break
                
                if found_agent:
                    available_deps.append(dep)
                else:
                    print(f"[WARN]  Skipping dependency '{dep}' for {config['display_name']} - not found in registry")
            
            self.register_specialist(
                agent_name=agent_name,
                specialty=config["specialty"],
                capabilities=config["capabilities"],
                tool_categories=config["tools"],
                context_size=config["context_size"],
                dependencies=available_deps,
                display_name=config.get("display_name")
            )
            print(f"[OK] Registered fallback specialist: {config.get('display_name', agent_name)} ({config['specialty']})")

# Global agent registry
AGENT_REGISTRY = AgentRegistry()
