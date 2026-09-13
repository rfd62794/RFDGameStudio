"""
Swarm Agent Schemas - Pydantic models for structured output
Integrates with existing Schema Registry system
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime


class SwarmTask(BaseModel):
    """Individual task in swarm assignment"""
    task_id: str = Field(description="Unique task identifier")
    description: str = Field(description="Task description")
    agent: str = Field(description="Agent type to execute task")
    priority: str = Field(description="Task priority (HIGH/MEDIUM/LOW)")
    dependencies: List[str] = Field(default_factory=list, description="Task dependencies")
    output_format: str = Field(description="Expected output format")
    focus: Optional[str] = Field(None, description="Specific focus area")


class SwarmTaskAssignment(BaseModel):
    """Swarm task assignment from coordinator"""
    tasks: List[SwarmTask] = Field(description="List of tasks to execute")
    rationale: str = Field(description="Rationale for task assignment")
    dependencies: Dict[str, List[str]] = Field(default_factory=dict, description="Task dependency map")
    estimated_duration: Optional[str] = Field(None, description="Estimated total duration")


class AnalysisReport(BaseModel):
    """Analysis report from analyzer agent"""
    summary: str = Field(description="Analysis summary")
    findings: List[str] = Field(description="Key findings")
    recommendations: List[str] = Field(description="Recommendations")
    risks: List[str] = Field(default_factory=list, description="Identified risks")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Analysis metrics")


class ImplementationPlan(BaseModel):
    """Implementation plan from planner agent"""
    steps: List[str] = Field(description="Implementation steps")
    dependencies: List[str] = Field(default_factory=list, description="Dependencies")
    estimated_effort: str = Field(description="Estimated effort")
    risks: List[str] = Field(default_factory=list, description="Implementation risks")
    success_criteria: List[str] = Field(description="Success criteria")


class CodeChanges(BaseModel):
    """Code changes from coder agent"""
    files_modified: List[str] = Field(description="Files that were modified")
    changes_made: List[str] = Field(description="Description of changes")
    new_files: List[str] = Field(default_factory=list, description="New files created")
    tests_added: List[str] = Field(default_factory=list, description="Tests added")
    validation_status: str = Field(description="Validation status")


class TestResults(BaseModel):
    """Test results from tester agent"""
    tests_run: int = Field(description="Number of tests run")
    tests_passed: int = Field(description="Number of tests passed")
    tests_failed: int = Field(description="Number of tests failed")
    coverage: Optional[float] = Field(None, description="Code coverage percentage")
    issues_found: List[str] = Field(default_factory=list, description="Issues found")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations")


class ReviewReport(BaseModel):
    """Review report from reviewer agent"""
    overall_quality: str = Field(description="Overall quality assessment")
    issues_found: List[str] = Field(default_factory=list, description="Issues found")
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")
    approval_status: str = Field(description="Approval status")
    next_steps: List[str] = Field(default_factory=list, description="Next steps")


class ExecutionReport(BaseModel):
    """Execution report from executor agent"""
    commands_executed: List[str] = Field(description="Commands that were executed")
    results: List[str] = Field(description="Execution results")
    errors: List[str] = Field(default_factory=list, description="Errors encountered")
    success_status: str = Field(description="Overall success status")
    artifacts_created: List[str] = Field(default_factory=list, description="Artifacts created")


class GenericResponse(BaseModel):
    """Generic response for fallback agents"""
    response: str = Field(description="Agent response")
    confidence: Optional[float] = Field(None, description="Confidence level")
    next_steps: List[str] = Field(default_factory=list, description="Suggested next steps")


# Register schemas with the existing registry
def register_swarm_schemas():
    """Register swarm schemas with the existing SchemaRegistry"""
    
    from src.tools.apj.agents.registry import SchemaRegistry, SCHEMA_REGISTRY
    
    # Add swarm schemas to existing registry
    swarm_schemas = {
        "SwarmTaskAssignment": SwarmTaskAssignment,
        "AnalysisReport": AnalysisReport,
        "ImplementationPlan": ImplementationPlan,
        "CodeChanges": CodeChanges,
        "TestResults": TestResults,
        "ReviewReport": ReviewReport,
        "ExecutionReport": ExecutionReport,
        "GenericResponse": GenericResponse,
    }
    
    for name, schema in swarm_schemas.items():
        SchemaRegistry.register(name, schema)
    
    return SCHEMA_REGISTRY


# Auto-register schemas when module is imported
register_swarm_schemas()
