"""
Model contracts - standardized interface for all model interactions
"""

from dataclasses import dataclass
from typing import Optional, Dict, List
from enum import Enum
import json


class TaskType(Enum):
    """Types of tasks for routing"""
    ANALYSIS = "analysis"              # Blockers, strategy, planning
    EXECUTION = "execution"            # Code generation, implementation
    REASONING = "reasoning"            # Complex reasoning
    DOCUMENTATION = "documentation"    # Writing docs


@dataclass
class ModelRequest:
    """Standard request to any model"""
    task_type: TaskType
    prompt: str
    max_tokens: int = 2000
    temperature: float = 0.7
    metadata: Optional[Dict] = None


@dataclass
class ModelResponse:
    """Standard response from any model"""
    success: bool
    response: str
    model_used: str
    system: str                    # "ollama" or "openrouter"
    cost_dollars: float
    tokens_input: int
    tokens_output: int
    latency_seconds: float
    error: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dict for logging"""
        return {
            "success": self.success,
            "model": self.model_used,
            "system": self.system,
            "cost": self.cost_dollars,
            "tokens_in": self.tokens_input,
            "tokens_out": self.tokens_output,
            "latency": self.latency_seconds,
            "error": self.error
        }


# Routing policies: which system for which task
ROUTING_POLICY = {
    TaskType.ANALYSIS: "ollama",           # Local analysis, fast
    TaskType.EXECUTION: "openrouter",      # Code execution, needs quality
    TaskType.REASONING: "openrouter",      # Complex reasoning
    TaskType.DOCUMENTATION: "ollama"       # Writing docs locally
}
