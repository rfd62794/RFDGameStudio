"""
TaskRouter - Intelligent task-to-agent routing system
Routes tasks to best available agent based on classification and availability
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import random

from .types import SwarmTask, TaskStatus, AgentWorkload, RoutingDecision, RoutingLevel
from .agent_registry import AgentRegistry, AgentMetadata
from .task_classifier import TaskClassificationResult

# Import SelfHealer if available
try:
    from ..swarm.resilience.self_healing import SelfHealer
except ImportError:
    SelfHealer = None

logger = logging.getLogger(__name__)


class TaskRouter:
    """Intelligent task-to-agent matcher"""
    
    def __init__(self, agent_registry: AgentRegistry, workloads: Dict[str, AgentWorkload], self_healer: Optional[SelfHealer] = None):
        self.registry = agent_registry        # Access to agents + their capabilities
        self.workloads = workloads            # Current agent utilization
        self.routing_log: List[RoutingDecision] = []  # Track all routing decisions
        self.self_healer = self_healer        # For circuit breaker integration
        
        # Capability inference mappings
        self.capability_mappings = {
            # Documentation keywords
            "docstring": "generate_docstrings",
            "api_doc": "documentation",
            "document": "documentation",
            "readme": "documentation",
            
            # Architecture keywords
            "refactor": "identify_coupling",
            "coupling": "identify_coupling",
            "architecture": "analyze_architecture",
            
            # UI keywords (must come before 'design')
            "ui": "design_ui_layouts",
            "component": "implement_ui_components",
            "button": "implement_ui_components",
            "layout": "design_ui_layouts",
            "interface": "design_ui_layouts",
            "design": "design_new_systems",
            
            # Genetics keywords
            "genetic": "implement_genetics",
            "trait": "create_trait_systems",
            "breeding": "implement_breeding",
            "inheritance": "create_inheritance_rules",
            
            # Integration keywords
            "integration": "test_integration",
            "test": "test_integration",
            "cross-system": "test_integration",
            
            # Debugging keywords
            "debug": "analyze_errors",
            "bug": "fix_bug",
            "fix": "fix_bug",
            "error": "analyze_errors"
        }
    
    def route_task(
        self,
        task: SwarmTask,
        task_classification: TaskClassificationResult
    ) -> Optional[str]:
        """
        Route a task to the best available agent.
        
        Args:
            task: SwarmTask to route
            task_classification: Classification result (detected_type, confidence, suggested_agent)
        
        Returns:
            agent_name: Name of agent to execute task, or None if deferred
        """
        
        routing_start = datetime.now()
        
        # Level 1: Perfect Match (95% confidence)
        if task_classification.confidence >= 0.9:
            agent = self.registry.find_agent_by_specialty(task_classification.detected_type)
            if agent and self._is_available(agent):
                self._log_routing_decision(task, task_classification, agent.name, RoutingLevel.PERFECT_MATCH, 0.95, "High confidence perfect match")
                return agent.name
            elif agent and not self._is_available(agent):
                # Agent exists but busy - defer
                self._defer_task(task, f"{agent.name} busy (perfect match)")
                return None
        
        # Level 2: Specialty Match (80% confidence)
        agent = self.registry.find_agent_by_specialty(task_classification.detected_type)
        if agent:
            if self._is_available(agent):
                self._log_routing_decision(task, task_classification, agent.name, RoutingLevel.SPECIALTY_MATCH, 0.80, "Specialty match available")
                return agent.name
            else:
                # Agent busy, queue for later
                self._defer_task(task, f"{agent.name} busy (specialty match)")
                return None
        
        # Level 3: Capability Match (70% confidence)
        required_capability = self._infer_capability_from_task(task)
        if required_capability:
            agent = self.registry.find_agent_by_capability(required_capability)
            if agent and self._is_available(agent):
                self._log_routing_decision(task, task_classification, agent.name, RoutingLevel.CAPABILITY_MATCH, 0.70, f"Capability match: {required_capability}")
                return agent.name
        
        # Level 4: Load-Balanced Category Match (60% confidence)
        available_specialists = [
            agent for agent in self.registry.get_all_agents().values()
            if agent.agent_type.value == "specialist" and self._is_available(agent)
        ]
        
        if available_specialists:
            # Pick least-loaded agent
            best_agent = min(available_specialists, key=lambda a: self._calculate_agent_load(a.name))
            load_score = self._calculate_agent_load(best_agent.name)
            self._log_routing_decision(task, task_classification, best_agent.name, RoutingLevel.LOAD_BALANCED, 0.60, f"Load-balanced (load: {load_score:.2f})")
            return best_agent.name
        
        # Level 5: Fallback to Generic Agent (50% confidence)
        generic = self.registry.get_agent_metadata("generic_agent")
        if generic and self._is_available(generic):
            self._log_routing_decision(task, task_classification, generic.name, RoutingLevel.FALLBACK, 0.50, "Fallback to generic agent")
            return generic.name
        else:
            # Should never happen - create generic agent if needed
            self.registry.register_specialist(
                agent_name="generic_agent",
                specialty="generic",
                capabilities=["execution"],
                tool_categories=["file_ops", "code_ops"]
            )
            generic = self.registry.get_agent_metadata("generic_agent")
            self._log_routing_decision(task, task_classification, generic.name, RoutingLevel.FALLBACK, 0.50, "Created fallback generic agent")
            return generic.name
    
    def _is_available(self, agent: AgentMetadata) -> bool:
        """Check if agent can accept new tasks"""
        
        workload = self.workloads.get(agent.name)
        if not workload:
            # Agent not in workload tracking - treat as available
            return True
        
        # Agent is available if:
        # 1. Not marked as unavailable
        if not workload.is_available:
            return False
        
        # 2. Not executing max concurrent tasks
        if workload.current_task and workload.tasks_completed >= 3:  # Simple check for now
            return False
        
        # 3. Not in circuit breaker state (from SelfHealer)
        if self._is_circuit_broken(agent.name):
            return False
        
        return True
    
    def _is_circuit_broken(self, agent_name: str) -> bool:
        """Check if agent is in circuit breaker state"""
        if not self.self_healer:
            return False
        
        return agent_name in self.self_healer.circuit_breakers
    
    def _calculate_agent_load(self, agent_name: str) -> float:
        """
        Calculate normalized load score (0.0 = idle, 1.0 = full)
        
        Formula:
            load = (current_tasks / max_concurrent_tasks) * 0.7 +
                   (avg_task_duration / estimated_task_duration) * 0.3
        """
        
        workload = self.workloads.get(agent_name)
        if not workload:
            return 0.0  # No workload data = idle
        
        # Current capacity utilization (70% weight)
        capacity_util = 0.0
        if workload.current_task:
            capacity_util = 0.5  # Simple: if has current task, 50% utilized
        
        # Efficiency factor (30% weight)
        efficiency_factor = 0.3  # Default efficiency
        
        total_load = (capacity_util * 0.7) + (efficiency_factor * 0.3)
        return min(total_load, 1.0)  # Cap at 1.0
    
    def _infer_capability_from_task(self, task: SwarmTask) -> Optional[str]:
        """Infer required capability from task keywords"""
        
        combined_text = f"{task.title} {task.description}".lower()
        
        # Check for capability keywords
        for keyword, capability in self.capability_mappings.items():
            if keyword in combined_text:
                return capability
        
        return None
    
    def _defer_task(self, task: SwarmTask, reason: str) -> None:
        """
        Defer a task if preferred agent is busy.
        Task goes to back of queue to retry next round.
        """
        # Note: In actual implementation, this would interact with task queue
        # For now, just log the deferral
        logger.info(f"Task {task.id} deferred: {reason}")
        
        # Update task status
        task.status = TaskStatus.BLOCKED  # Use BLOCKED as deferred state
        
        # Log routing decision for deferral
        decision = RoutingDecision(
            task_id=task.id,
            task_title=task.title,
            classification_type="unknown",
            classification_confidence=0.0,
            selected_agent="DEFERRED",
            routing_level=RoutingLevel.SPECIALTY_MATCH,  # Default level
            routing_confidence=0.0,
            timestamp=datetime.now().isoformat(),
            reason=f"Deferred: {reason}"
        )
        self.routing_log.append(decision)
    
    def _log_routing_decision(
        self,
        task: SwarmTask,
        classification: TaskClassificationResult,
        agent_name: str,
        routing_level: RoutingLevel,
        routing_confidence: float,
        reason: str
    ) -> None:
        """Log routing decision for observability"""
        
        decision = RoutingDecision(
            task_id=task.id,
            task_title=task.title,
            classification_type=classification.detected_type,
            classification_confidence=classification.confidence,
            selected_agent=agent_name,
            routing_level=routing_level,
            routing_confidence=routing_confidence,
            timestamp=datetime.now().isoformat(),
            reason=reason
        )
        
        self.routing_log.append(decision)
        logger.info(f"Task {task.id} → {agent_name} ({routing_level.value}, confidence {routing_confidence})")
    
    def get_routing_metrics(self) -> Dict[str, Any]:
        """Get routing metrics for observability"""
        
        if not self.routing_log:
            return {
                "total_routed": 0,
                "routing_levels": {},
                "specialist_ratio": 0.0,
                "fallback_ratio": 0.0
            }
        
        # Count by routing level
        level_counts = {}
        specialist_count = 0
        fallback_count = 0
        
        for decision in self.routing_log:
            if decision.selected_agent == "DEFERRED":
                continue
                
            level = decision.routing_level.value
            level_counts[level] = level_counts.get(level, 0) + 1
            
            if decision.selected_agent == "generic_agent":
                fallback_count += 1
            elif "specialist" in decision.selected_agent:
                specialist_count += 1
        
        total_routed = len([d for d in self.routing_log if d.selected_agent != "DEFERRED"])
        
        return {
            "total_routed": total_routed,
            "routing_levels": level_counts,
            "specialist_ratio": specialist_count / total_routed if total_routed > 0 else 0.0,
            "fallback_ratio": fallback_count / total_routed if total_routed > 0 else 0.0,
            "recent_decisions": self.routing_log[-10:]  # Last 10 decisions
        }
    
    def get_agent_utilization(self) -> Dict[str, Dict[str, Any]]:
        """Get current agent utilization stats"""
        
        utilization = {}
        
        for agent_name, workload in self.workloads.items():
            load_score = self._calculate_agent_load(agent_name)
            is_available = self._is_available(self.registry.get_agent_metadata(agent_name))
            
            utilization[agent_name] = {
                "load_score": load_score,
                "is_available": is_available,
                "current_task": workload.current_task,
                "tasks_completed": workload.tasks_completed,
                "circuit_broken": self._is_circuit_broken(agent_name)
            }
        
        return utilization
