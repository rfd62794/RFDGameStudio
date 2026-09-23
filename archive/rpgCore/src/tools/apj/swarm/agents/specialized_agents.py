"""
Specialized agents for critical project domains
Each agent is an expert in its domain with targeted capabilities
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum


class AgentSpecialty(Enum):
    """Agent specialization domains"""
    ECS_RENDERING = "ecs_rendering"
    DUNGEON_POLISH = "dungeon_polish"
    TOWER_DEFENSE = "tower_defense"
    CODE_QUALITY = "code_quality"
    PERFORMANCE = "performance"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    ARCHITECTURE = "architecture"
    GENETICS = "genetics"
    UI_SYSTEMS = "ui_systems"
    INTEGRATION = "integration"
    DEBUGGING = "debugging"


@dataclass
class SpecializedAgent:
    """A specialized agent with domain expertise"""
    name: str
    specialty: AgentSpecialty
    description: str
    capabilities: List[str]
    tools: List[str]
    priority: int
    context_size: int  # How much project context it needs
    dependencies: List[str]  # Other agents it depends on
    
    def __post_init__(self):
        self.id = f"{self.specialty.value}_{id(self)}"
        self.status = "idle"
        self.current_task = None
        self.completed_tasks = 0
        self.failed_tasks = 0


# AGENT 6: Code Quality Specialist
CODE_QUALITY_SPECIALIST = SpecializedAgent(
    name="Code Quality Specialist",
    specialty=AgentSpecialty.CODE_QUALITY,
    description="Ensures high code quality and standards",
    capabilities=[
        "analyze_code_quality",
        "identify_smells",
        "suggest_improvements",
        "enforce_standards",
        "review_code",
        "measure_complexity",
        "check_coverage",
        "optimize_code"
    ],
    tools=[
        "file_ops", "code_ops", "test_ops", "analysis_ops"
    ],
    priority=6,
    context_size=2000,
    dependencies=[]
)


# AGENT 7: Testing Specialist
TESTING_SPECIALIST = SpecializedAgent(
    name="Testing Specialist",
    specialty=AgentSpecialty.TESTING,
    description="Creates and maintains comprehensive test suites",
    capabilities=[
        "create_unit_tests",
        "create_integration_tests",
        "create_system_tests",
        "measure_coverage",
        "test_performance",
        "debug_tests",
        "automate_testing",
        "validate_requirements"
    ],
    tools=[
        "file_ops", "code_ops", "test_ops", "qa_ops"
    ],
    priority=7,
    context_size=2500,
    dependencies=[]
)


# AGENT 8: Documentation Specialist
DOCUMENTATION_SPECIALIST = SpecializedAgent(
    name="Documentation Specialist",
    specialty=AgentSpecialty.DOCUMENTATION,
    description="Creates and maintains professional documentation",
    capabilities=[
        "generate_docstrings",
        "create_architecture_docs",
        "write_api_documentation",
        "create_tutorials",
        "maintain_changelog",
        "generate_readme",
        "document_decisions",
        "create_design_docs"
    ],
    tools=[
        "file_ops", "code_ops", "doc_ops", "template_ops"
    ],
    priority=7,
    context_size=2000,
    dependencies=[]
)


# AGENT 9: Architecture Specialist
ARCHITECTURE_SPECIALIST = SpecializedAgent(
    name="Architecture Specialist",
    specialty=AgentSpecialty.ARCHITECTURE,
    description="Analyzes and improves system architecture",
    capabilities=[
        "analyze_architecture",
        "identify_coupling",
        "suggest_refactoring",
        "design_new_systems",
        "document_architecture",
        "validate_patterns",
        "suggest_optimizations",
        "detect_violations"
    ],
    tools=[
        "file_ops", "code_ops", "analysis_ops", "design_ops"
    ],
    priority=9,
    context_size=3000,
    dependencies=["code_quality", "testing"]
)


# AGENT 10: Genetics System Specialist
GENETICS_SPECIALIST = SpecializedAgent(
    name="Genetics System Specialist",
    specialty=AgentSpecialty.GENETICS,
    description="Implements and integrates genetics systems",
    capabilities=[
        "implement_genetics",
        "integrate_genetics",
        "create_trait_systems",
        "implement_breeding",
        "create_inheritance_rules",
        "test_genetics",
        "optimize_genetics",
        "document_genetics"
    ],
    tools=[
        "file_ops", "code_ops", "test_ops", "genetics_ops"
    ],
    priority=10,
    context_size=2500,
    dependencies=["testing"]
)


# AGENT 11: UI Systems Specialist
UI_SPECIALIST = SpecializedAgent(
    name="UI Systems Specialist",
    specialty=AgentSpecialty.UI_SYSTEMS,
    description="Designs and implements UI systems",
    capabilities=[
        "design_ui_layouts",
        "implement_ui_components",
        "create_ui_systems",
        "implement_input_handling",
        "create_ui_animations",
        "test_ui",
        "optimize_ui",
        "document_ui"
    ],
    tools=[
        "file_ops", "code_ops", "test_ops", "ui_ops"
    ],
    priority=11,
    context_size=2500,
    dependencies=["testing"]
)


# AGENT 12: Integration Specialist
INTEGRATION_SPECIALIST = SpecializedAgent(
    name="Integration Specialist",
    specialty=AgentSpecialty.INTEGRATION,
    description="Ensures systems integrate seamlessly",
    capabilities=[
        "test_integration",
        "identify_integration_issues",
        "create_integration_tests",
        "validate_interfaces",
        "create_adapters",
        "test_cross_system",
        "document_integration",
        "resolve_conflicts"
    ],
    tools=[
        "file_ops", "code_ops", "test_ops", "integration_ops"
    ],
    priority=12,
    context_size=3000,
    dependencies=["testing", "architecture"]
)


# AGENT 13: Debugging Specialist
DEBUGGING_SPECIALIST = SpecializedAgent(
    name="Debugging Specialist",
    specialty=AgentSpecialty.DEBUGGING,
    description="Finds and fixes bugs systematically",
    capabilities=[
        "analyze_errors",
        "trace_issues",
        "create_test_for_bug",
        "fix_bug",
        "verify_fix",
        "identify_root_cause",
        "prevent_regression",
        "document_fix"
    ],
    tools=[
        "file_ops", "code_ops", "test_ops", "debug_ops", "log_ops"
    ],
    priority=13,
    context_size=2000,
    dependencies=["testing"]
)


# Registry of all specialized agents
SPECIALIZED_AGENTS = [
    CODE_QUALITY_SPECIALIST,
    TESTING_SPECIALIST,
    DOCUMENTATION_SPECIALIST,
    ARCHITECTURE_SPECIALIST,
    GENETICS_SPECIALIST,
    UI_SPECIALIST,
    INTEGRATION_SPECIALIST,
    DEBUGGING_SPECIALIST
]
