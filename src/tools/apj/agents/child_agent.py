"""
Child Agent System - Dynamic agent creation and management
Allows agents to create specialized child agents for specific tasks
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import uuid
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig
from .agent_registry import AGENT_REGISTRY, AgentMetadata, AgentType
from .tools import TOOL_REGISTRY, ToolResult

@dataclass
class ChildAgentConfig:
    """Configuration for child agents"""
    name: str
    parent_agent: str
    purpose: str
    capabilities: List[str]
    tools: List[str]
    lifespan: Optional[int] = None  # in operations, None = permanent
    memory_limit: Optional[int] = None  # in MB
    
class ChildAgent(BaseAgent):
    """Dynamically created child agent"""
    
    def __init__(self, config: AgentConfig, child_config: ChildAgentConfig):
        super().__init__(config)
        self.child_config = child_config
        self.created_at = datetime.now()
        self.operations_count = 0
        self.memory_usage = 0
        self.parent_agent = child_config.parent_agent
        self._setup_tools()
    
    def _setup_tools(self):
        """Setup tools for this child agent"""
        self.available_tools = {}
        for tool_name in self.child_config.tools:
            tool = TOOL_REGISTRY.get_tool(tool_name)
            if tool:
                self.available_tools[tool_name] = tool
    
    def use_tool(self, tool_name: str, method: str, *args, **kwargs) -> ToolResult:
        """Use a tool"""
        if tool_name not in self.available_tools:
            return ToolResult(False, None, f"Tool not available: {tool_name}")
        
        tool = self.available_tools[tool_name]
        if not hasattr(tool, method):
            return ToolResult(False, None, f"Method not found: {method}")
        
        try:
            result = getattr(tool, method)(*args, **kwargs)
            self.operations_count += 1
            return result
        except Exception as e:
            return ToolResult(False, None, str(e))
    
    def is_expired(self) -> bool:
        """Check if child agent has expired"""
        if self.child_config.lifespan is None:
            return False
        return self.operations_count >= self.child_config.lifespan
    
    def get_status(self) -> Dict[str, Any]:
        """Get child agent status"""
        return {
            "name": self.child_config.name,
            "parent": self.parent_agent,
            "purpose": self.child_config.purpose,
            "created_at": self.created_at.isoformat(),
            "operations_count": self.operations_count,
            "memory_usage": self.memory_usage,
            "available_tools": list(self.available_tools.keys()),
            "is_expired": self.is_expired()
        }

class ChildAgentManager:
    """Manages child agent lifecycle"""
    
    def __init__(self):
        self._child_agents: Dict[str, ChildAgent] = {}
        self._child_configs: Dict[str, ChildAgentConfig] = {}
    
    def create_child_agent(self, parent_name: str, purpose: str, 
                          capabilities: List[str], tools: List[str],
                          lifespan: Optional[int] = None) -> Optional[str]:
        """Create a new child agent"""
        
        # Check if parent can create children
        if not AGENT_REGISTRY.can_create_children(parent_name):
            return None
        
        # Generate unique name
        child_id = str(uuid.uuid4())[:8]
        child_name = f"{parent_name}_child_{child_id}"
        
        # Create child config
        child_config = ChildAgentConfig(
            name=child_name,
            parent_agent=parent_name,
            purpose=purpose,
            capabilities=capabilities,
            tools=tools,
            lifespan=lifespan
        )
        
        # Create agent config
        agent_config = AgentConfig(
            name=child_name,
            role=f"Child agent for {purpose}",
            department="dynamic",
            model_preference="local",
            prompts={
                "system": f"You are a child agent created by {parent_name}. Your purpose is: {purpose}",
                "fewshot": "docs/agents/prompts/generic_system.md"
            },
            schema_name="GenericResponse",
            fallback={
                "recommended": {
                    "label": "FALLBACK",
                    "title": "Child agent fallback",
                    "rationale": "Child agent task failed",
                    "risk": "low"
                },
                "alternatives": []
            },
            open_questions=[],
            archivist_risks_addressed=[],
            corpus_hash=""
        )
        
        try:
            # Create child agent
            child_agent = ChildAgent(agent_config, child_config)
            
            # Register child agent
            self._child_agents[child_name] = child_agent
            self._child_configs[child_name] = child_config
            
            # Register in agent registry
            child_metadata = AgentMetadata(
                name=child_name,
                agent_type=AgentType.CHILD,
                capabilities=capabilities,
                department="dynamic",
                description=f"Child agent for {purpose}",
                parent_agent=parent_name,
                can_create_children=False,
                supports_a2a=True
            )
            AGENT_REGISTRY.register_agent(child_metadata)
            
            return child_name
            
        except Exception as e:
            print(f"Failed to create child agent: {e}")
            return None
    
    def get_child_agent(self, name: str) -> Optional[ChildAgent]:
        """Get child agent by name"""
        return self._child_agents.get(name)
    
    def get_children_of_parent(self, parent_name: str) -> List[str]:
        """Get all children of a parent agent"""
        return [name for name, config in self._child_configs.items() 
                if config.parent_agent == parent_name]
    
    def cleanup_expired_agents(self) -> List[str]:
        """Clean up expired child agents"""
        expired = []
        for name, agent in self._child_agents.items():
            if agent.is_expired():
                expired.append(name)
        
        for name in expired:
            self.remove_child_agent(name)
        
        return expired
    
    def remove_child_agent(self, name: str) -> bool:
        """Remove a child agent"""
        if name in self._child_agents:
            del self._child_agents[name]
        if name in self._child_configs:
            del self._child_configs[name]
        return True
    
    def get_all_children(self) -> Dict[str, ChildAgent]:
        """Get all child agents"""
        return self._child_agents.copy()
    
    def get_child_status(self, name: str) -> Optional[Dict[str, Any]]:
        """Get child agent status"""
        agent = self.get_child_agent(name)
        return agent.get_status() if agent else None

# Global child agent manager
CHILD_AGENT_MANAGER = ChildAgentManager()
