"""
Shared types for APJ agents
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid


class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class SwarmState(Enum):
    """Swarm execution state"""
    IDLE = "idle"
    ACTIVE = "active"
    PAUSED = "paused"
    ERROR = "error"
    COMPLETED = "completed"


@dataclass
class SwarmTask:
    """Represents a task in the swarm"""
    id: str
    title: str
    description: str
    agent_type: str
    priority: int
    estimated_hours: float
    dependencies: List[str] = field(default_factory=list)
    assigned_agent: str = "generic"
    status: TaskStatus = TaskStatus.PENDING
    file_references: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    output: Optional[str] = None
    duration: Optional[float] = None
    classification: Optional[Any] = None  # TaskClassificationResult
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Post-initialization processing"""
        if not self.id:
            self.id = str(uuid.uuid4())


@dataclass
class AgentWorkload:
    """Tracks agent workload and performance"""
    agent_name: str
    current_task: Optional[str] = None
    tasks_completed: int = 0
    total_work_time: float = 0.0
    efficiency_score: float = 1.0
    last_task_time: Optional[datetime] = None
    is_available: bool = True
    error_count: int = 0
    success_count: int = 0
    
    def update_task_completion(self, duration: float, success: bool):
        """Update workload after task completion"""
        self.tasks_completed += 1
        self.total_work_time += duration
        self.last_task_time = datetime.now()
        
        if success:
            self.success_count += 1
        else:
            self.error_count += 1
        
        # Update efficiency score
        if self.total_work_time > 0:
            self.efficiency_score = self.tasks_completed / self.total_work_time


@dataclass
class TaskResult:
    """Result of task execution"""
    task_id: str
    agent_name: str
    success: bool
    duration: float
    output: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RoutingDecision:
    """Decision made by TaskRouter"""
    task_id: str
    task_title: str
    classification_type: str
    classification_confidence: float
    selected_agent: str
    routing_level: str
    routing_confidence: float
    timestamp: datetime = field(default_factory=datetime.now)
    reason: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


class RoutingLevel(Enum):
    """Routing priority levels"""
    PERFECT_MATCH = "perfect_match"
    SPECIALTY_MATCH = "specialty_match"
    CAPABILITY_MATCH = "capability_match"
    LOAD_BALANCED = "load_balanced"
    FALLBACK = "fallback"
    DEFERRED = "deferred"
