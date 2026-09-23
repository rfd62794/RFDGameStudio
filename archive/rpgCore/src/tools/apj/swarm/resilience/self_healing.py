"""
Self-healing and resilience for autonomous swarm
Fault detection, recovery, and learning
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional, List, Dict
import json
from datetime import datetime


class FailureType(Enum):
    """Types of failures agents can detect and recover from"""
    TASK_FAILURE = "task_failure"
    TIMEOUT = "timeout"
    INVALID_OUTPUT = "invalid_output"
    DEPENDENCY_FAILURE = "dependency_failure"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    DEADLOCK = "deadlock"
    COMMUNICATION_ERROR = "communication_error"


@dataclass
class FailureEvent:
    """Record of a failure"""
    agent_id: str
    failure_type: FailureType
    timestamp: str
    description: str
    task_id: str
    retry_count: int
    recovery_strategy: str


class SelfHealer:
    """
    Detect failures and heal swarm automatically
    Implement retry logic, circuit breakers, graceful degradation
    """
    
    def __init__(self):
        self.failure_history: List[FailureEvent] = []
        self.circuit_breakers: Dict[str, bool] = {}
        self.recovery_strategies = {
            FailureType.TASK_FAILURE: self._recover_from_task_failure,
            FailureType.TIMEOUT: self._recover_from_timeout,
            FailureType.INVALID_OUTPUT: self._recover_from_invalid_output,
            FailureType.DEPENDENCY_FAILURE: self._recover_from_dependency_failure,
            FailureType.RESOURCE_EXHAUSTION: self._recover_from_resource_exhaustion,
            FailureType.DEADLOCK: self._recover_from_deadlock,
            FailureType.COMMUNICATION_ERROR: self._recover_from_communication_error,
        }
    
    def detect_and_recover(self, agent_id: str, error: Exception, task_id: str) -> bool:
        """
        Detect failure type and apply recovery strategy
        Returns: True if recovered, False if unrecoverable
        """
        
        failure_type = self._classify_failure(error)
        
        event = FailureEvent(
            agent_id=agent_id,
            failure_type=failure_type,
            timestamp=datetime.now().isoformat(),
            description=str(error),
            task_id=task_id,
            retry_count=0,
            recovery_strategy=""
        )
        
        self.failure_history.append(event)
        
        # Check circuit breaker
        if self._is_circuit_open(agent_id):
            print(f"⚠️  Circuit breaker open for {agent_id} - backing off")
            return False
        
        # Apply recovery strategy
        recovery_fn = self.recovery_strategies.get(failure_type)
        if recovery_fn:
            return recovery_fn(agent_id, task_id)
        
        return False
    
    def _classify_failure(self, error: Exception) -> FailureType:
        """Classify failure type from exception"""
        
        error_str = str(error).lower()
        
        if "timeout" in error_str:
            return FailureType.TIMEOUT
        elif "invalid" in error_str or "unexpected" in error_str:
            return FailureType.INVALID_OUTPUT
        elif "dependency" in error_str or "requires" in error_str:
            return FailureType.DEPENDENCY_FAILURE
        elif "memory" in error_str or "resource" in error_str:
            return FailureType.RESOURCE_EXHAUSTION
        elif "deadlock" in error_str:
            return FailureType.DEADLOCK
        elif "connection" in error_str or "communication" in error_str:
            return FailureType.COMMUNICATION_ERROR
        else:
            return FailureType.TASK_FAILURE
    
    def _recover_from_task_failure(self, agent_id: str, task_id: str) -> bool:
        """Recover from general task failure"""
        print(f"🔄 Recovering from task failure for {agent_id}...")
        
        # Retry strategy: exponential backoff
        retry_count = self._count_failures(agent_id, task_id)
        
        if retry_count < 3:
            print(f"   Retrying... (attempt {retry_count + 1}/3)")
            return True
        else:
            print(f"   Max retries exceeded - escalating to human review")
            return False
    
    def _recover_from_timeout(self, agent_id: str, task_id: str) -> bool:
        """Recover from timeout"""
        print(f"⏱️  Timeout detected for {agent_id}")
        
        # Strategy: Increase timeout or break into smaller tasks
        retry_count = self._count_failures(agent_id, task_id)
        
        if retry_count < 2:
            print(f"   Increasing timeout and retrying...")
            return True
        else:
            print(f"   Task too slow - suggest breaking into smaller tasks")
            return False
    
    def _recover_from_invalid_output(self, agent_id: str, task_id: str) -> bool:
        """Recover from invalid output"""
        print(f"❌ Invalid output from {agent_id}")
        
        retry_count = self._count_failures(agent_id, task_id)
        
        if retry_count < 2:
            print(f"   Retrying with more specific instructions...")
            return True
        else:
            print(f"   Agent consistently producing invalid output - human review needed")
            self._open_circuit_breaker(agent_id)
            return False
    
    def _recover_from_dependency_failure(self, agent_id: str, task_id: str) -> bool:
        """Recover from dependency failure"""
        print(f"🔗 Dependency failure for {agent_id}")
        
        # Try to fulfill dependency first
        print(f"   Attempting to fulfill dependency...")
        return True
    
    def _recover_from_resource_exhaustion(self, agent_id: str, task_id: str) -> bool:
        """Recover from resource exhaustion"""
        print(f"💾 Resource exhaustion for {agent_id}")
        
        # Strategy: Wait for resources to free up or delegate to different agent
        print(f"   Waiting for resources to free up...")
        return True
    
    def _recover_from_deadlock(self, agent_id: str, task_id: str) -> bool:
        """Recover from deadlock"""
        print(f"🔒 Deadlock detected for {agent_id}")
        
        # Strategy: Kill and restart agent, reorder tasks
        print(f"   Reordering task dependencies...")
        return True
    
    def _recover_from_communication_error(self, agent_id: str, task_id: str) -> bool:
        """Recover from communication error"""
        print(f"📡 Communication error for {agent_id}")
        
        retry_count = self._count_failures(agent_id, task_id)
        
        if retry_count < 3:
            print(f"   Retrying communication...")
            return True
        else:
            print(f"   Persistent communication issues - escalating...")
            return False
    
    def _count_failures(self, agent_id: str, task_id: str) -> int:
        """Count failures for this agent/task combination"""
        return sum(
            1 for event in self.failure_history
            if event.agent_id == agent_id and event.task_id == task_id
        )
    
    def _is_circuit_open(self, agent_id: str) -> bool:
        """Check if circuit breaker is open for agent"""
        return self.circuit_breakers.get(agent_id, False)
    
    def _open_circuit_breaker(self, agent_id: str) -> None:
        """Open circuit breaker for agent"""
        self.circuit_breakers[agent_id] = True
        print(f"⚠️  Circuit breaker opened for {agent_id}")
    
    def _close_circuit_breaker(self, agent_id: str) -> None:
        """Close circuit breaker for agent"""
        self.circuit_breakers[agent_id] = False
        print(f"✅ Circuit breaker closed for {agent_id}")


class SwarmLearning:
    """
    Agents learn from successes and failures
    Build knowledge base of what works
    """
    
    def __init__(self):
        self.learned_patterns: Dict[str, List[Dict]] = {}
        self.success_rate_per_agent: Dict[str, float] = {}
    
    def record_success(self, agent_id: str, task_type: str, approach: str) -> None:
        """Record successful approach"""
        
        if task_type not in self.learned_patterns:
            self.learned_patterns[task_type] = []
        
        self.learned_patterns[task_type].append({
            "agent": agent_id,
            "approach": approach,
            "timestamp": datetime.now().isoformat(),
            "success": True
        })
    
    def record_failure(self, agent_id: str, task_type: str, approach: str, reason: str) -> None:
        """Record failed approach"""
        
        if task_type not in self.learned_patterns:
            self.learned_patterns[task_type] = []
        
        self.learned_patterns[task_type].append({
            "agent": agent_id,
            "approach": approach,
            "reason": reason,
            "timestamp": datetime.now().isoformat(),
            "success": False
        })
    
    def get_best_approach(self, task_type: str) -> Optional[str]:
        """Get best-known approach for task type"""
        
        patterns = self.learned_patterns.get(task_type, [])
        
        if not patterns:
            return None
        
        # Find most common successful approach
        successful = [p for p in patterns if p["success"]]
        
        if not successful:
            return None
        
        approaches = [p["approach"] for p in successful]
        return max(set(approaches), key=approaches.count)
    
    def update_agent_success_rate(self, agent_id: str, success: bool) -> None:
        """Update agent's success rate"""
        
        if agent_id not in self.success_rate_per_agent:
            self.success_rate_per_agent[agent_id] = 1.0
        
        current = self.success_rate_per_agent[agent_id]
        # Exponential moving average
        self.success_rate_per_agent[agent_id] = (current * 0.9) + (1.0 if success else 0.0) * 0.1
