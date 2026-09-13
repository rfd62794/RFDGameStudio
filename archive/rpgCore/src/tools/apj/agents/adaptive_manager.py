"""
Adaptive Agent Manager - Dynamically manages agent activation based on workload
Optimizes resource usage by activating only necessary agents
"""

import logging
from typing import Dict, List, Any, Set
from datetime import datetime, timedelta
from enum import Enum

from .agent_registry import AGENT_REGISTRY, AgentCapability, AgentType
from .child_agent import CHILD_AGENT_MANAGER
from .a2a_communication import A2A_MANAGER

logger = logging.getLogger(__name__)


class AgentPriority(Enum):
    """Agent priority levels"""
    CRITICAL = 1  # Always active (coordinator, strategist)
    HIGH = 2      # Active during work hours
    MEDIUM = 3    # Active when needed
    LOW = 4       # On-demand only

class WorkloadType(Enum):
    """Types of workload that require different agents"""
    DEVELOPMENT = "development"
    ANALYSIS = "analysis"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    PLANNING = "planning"
    REVIEW = "review"


class AdaptiveAgentManager:
    """Manages agent activation based on workload and priorities"""
    
    def __init__(self):
        self.agent_priorities = self._define_agent_priorities()
        self.workload_requirements = self._define_workload_requirements()
        self.active_agents: Set[str] = set()
        self.agent_utilization: Dict[str, float] = {}
        self.last_optimization = datetime.now()
        self.optimization_interval = timedelta(minutes=10)
    
    def _define_agent_priorities(self) -> Dict[str, AgentPriority]:
        """Define priority levels for each agent"""
        return {
            # Critical - always active
            "swarm_coordinator": AgentPriority.CRITICAL,
            "strategist": AgentPriority.CRITICAL,
            
            # High - active during development
            "analyzer": AgentPriority.HIGH,
            "planner": AgentPriority.HIGH,
            "coder": AgentPriority.HIGH,
            
            # Medium - active when needed
            "tester": AgentPriority.MEDIUM,
            "reviewer": AgentPriority.MEDIUM,
            "executor": AgentPriority.MEDIUM,
            
            # Low - on-demand only
            "archivist": AgentPriority.LOW,
            "herald": AgentPriority.LOW
        }
    
    def _define_workload_requirements(self) -> Dict[WorkloadType, List[str]]:
        """Define which agents are needed for each workload type"""
        return {
            WorkloadType.DEVELOPMENT: ["coder", "analyzer", "reviewer", "tester"],
            WorkloadType.ANALYSIS: ["analyzer", "strategist", "planner"],
            WorkloadType.TESTING: ["tester", "coder", "reviewer"],
            WorkloadType.DOCUMENTATION: ["archivist", "herald", "reviewer"],
            WorkloadType.PLANNING: ["planner", "strategist", "analyzer"],
            WorkloadType.REVIEW: ["reviewer", "analyzer", "strategist"]
        }
    
    def optimize_agent_activation(self, current_workload: List[WorkloadType]) -> Dict[str, Any]:
        """Optimize which agents should be active based on current workload"""
        
        if datetime.now() - self.last_optimization < self.optimization_interval:
            return {"status": "too_recent", "active_agents": list(self.active_agents)}
        
        # Determine required agents
        required_agents = set()
        for workload in current_workload:
            required_agents.update(self.workload_requirements.get(workload, []))
        
        # Always include critical agents
        critical_agents = [agent for agent, priority in self.agent_priorities.items() 
                          if priority == AgentPriority.CRITICAL]
        required_agents.update(critical_agents)
        
        # Add high priority agents if there's any workload
        if current_workload:
            high_agents = [agent for agent, priority in self.agent_priorities.items() 
                         if priority == AgentPriority.HIGH]
            required_agents.update(high_agents)
        
        # Update active agents
        previous_active = self.active_agents.copy()
        self.active_agents = required_agents
        
        # Log changes
        activated = required_agents - previous_active
        deactivated = previous_active - required_agents
        
        self.last_optimization = datetime.now()
        
        return {
            "status": "optimized",
            "active_agents": list(self.active_agents),
            "activated": list(activated),
            "deactivated": list(deactivated),
            "total_active": len(self.active_agents),
            "workload_types": [w.value for w in current_workload]
        }
    
    def get_minimum_active_agents(self) -> List[str]:
        """Get the minimum set of agents that should always be active"""
        return [agent for agent, priority in self.agent_priorities.items() 
                if priority == AgentPriority.CRITICAL]
    
    def get_recommended_agents(self, workload: WorkloadType) -> List[str]:
        """Get recommended agents for a specific workload type"""
        base_agents = self.get_minimum_active_agents()
        workload_agents = self.workload_requirements.get(workload, [])
        
        # Add high priority agents
        high_agents = [agent for agent, priority in self.agent_priorities.items() 
                       if priority == AgentPriority.HIGH]
        
        return list(set(base_agents + workload_agents + high_agents))
    
    def calculate_resource_usage(self) -> Dict[str, Any]:
        """Calculate current resource usage and recommendations"""
        
        total_agents = len(self.agent_priorities)
        active_count = len(self.active_agents)
        
        # Estimate memory usage per agent (rough estimates)
        memory_per_agent = {
            AgentPriority.CRITICAL: 50,  # MB
            AgentPriority.HIGH: 40,       # MB
            AgentPriority.MEDIUM: 30,     # MB
            AgentPriority.LOW: 20         # MB
        }
        
        current_memory = sum(
            memory_per_agent[self.agent_priorities.get(agent, AgentPriority.LOW)]
            for agent in self.active_agents
        )
        
        max_memory = sum(
            memory_per_agent[priority] for priority in AgentPriority
        ) * len(self.agent_priorities) // len(AgentPriority)
        
        return {
            "total_agents": total_agents,
            "active_agents": active_count,
            "activation_ratio": f"{active_count}/{total_agents} ({active_count/total_agents:.1%})",
            "estimated_memory_mb": current_memory,
            "max_memory_mb": max_memory,
            "memory_efficiency": f"{current_memory/max_memory:.1%}",
            "recommendations": self._get_resource_recommendations()
        }
    
    def _get_resource_recommendations(self) -> List[str]:
        """Get resource optimization recommendations"""
        
        recommendations = []
        
        if len(self.active_agents) > len(self.get_minimum_active_agents()) * 2:
            recommendations.append("Consider deactivating some medium/low priority agents")
        
        if len(self.active_agents) == len(self.agent_priorities):
            recommendations.append("All agents active - monitor resource usage")
        
        critical_count = len([a for a in self.active_agents 
                             if self.agent_priorities.get(a) == AgentPriority.CRITICAL])
        if critical_count < len(self.get_minimum_active_agents()):
            recommendations.append("Critical agents missing - immediate attention needed")
        
        # Check for idle agents
        idle_threshold = 0.1  # 10% utilization
        idle_agents = [agent for agent, util in self.agent_utilization.items() 
                       if util < idle_threshold and agent in self.active_agents]
        if idle_agents:
            recommendations.append(f"Consider deactivating idle agents: {', '.join(idle_agents)}")
        
        return recommendations
    
    def update_agent_utilization(self, agent_name: str, utilization: float):
        """Update utilization tracking for an agent"""
        self.agent_utilization[agent_name] = utilization
    
    def get_optimization_report(self) -> Dict[str, Any]:
        """Get comprehensive optimization report"""
        
        return {
            "agent_priorities": {agent: priority.value for agent, priority in self.agent_priorities.items()},
            "active_agents": list(self.active_agents),
            "resource_usage": self.calculate_resource_usage(),
            "last_optimization": self.last_optimization.isoformat(),
            "optimization_interval": str(self.optimization_interval),
            "utilization_stats": {
                agent: f"{util:.1%}" for agent, util in self.agent_utilization.items()
            }
        }

# Global adaptive manager
ADAPTIVE_MANAGER = AdaptiveAgentManager()
