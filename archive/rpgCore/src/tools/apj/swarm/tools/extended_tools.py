"""
Extended tool library for swarm agents
Comprehensive set of tools for all domains
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Callable, Dict


class ToolCategory(Enum):
    """Tool categories"""
    FILE_OPS = "file_ops"
    CODE_OPS = "code_ops"
    TEST_OPS = "test_ops"
    SYSTEM_OPS = "system_ops"
    ECS_OPS = "ecs_ops"
    GAME_OPS = "game_ops"
    LINT_OPS = "lint_ops"
    PERF_OPS = "perf_ops"
    COVERAGE_OPS = "coverage_ops"
    DOC_OPS = "doc_ops"
    TEMPLATE_OPS = "template_ops"
    ANALYSIS_OPS = "analysis_ops"
    DESIGN_OPS = "design_ops"
    GENETICS_OPS = "genetics_ops"
    UI_OPS = "ui_ops"
    INTEGRATION_OPS = "integration_ops"
    DEBUG_OPS = "debug_ops"
    LOG_OPS = "log_ops"


@dataclass
class Tool:
    """Base tool definition"""
    name: str
    category: ToolCategory
    description: str
    inputs: List[str]
    outputs: List[str]
    capabilities: List[str]
    error_handling: str  # How it handles errors


# NEW TOOL SETS

# Documentation Operations
DOC_TOOLS = [
    Tool(
        name="generate_docstrings",
        category=ToolCategory.DOC_OPS,
        description="Generate docstrings for all functions/classes",
        inputs=["file_path"],
        outputs=["modified_file"],
        capabilities=["docstring_gen", "quality_check"],
        error_handling="graceful_skip"
    ),
    Tool(
        name="create_architecture_doc",
        category=ToolCategory.DOC_OPS,
        description="Create architecture documentation",
        inputs=["system_files", "design_docs"],
        outputs=["architecture_md"],
        capabilities=["diagram_gen", "doc_gen"],
        error_handling="retry_with_simpler_format"
    ),
    Tool(
        name="generate_changelog",
        category=ToolCategory.DOC_OPS,
        description="Generate changelog from git history",
        inputs=["git_log"],
        outputs=["changelog_md"],
        capabilities=["log_parse", "formatting"],
        error_handling="manual_review"
    ),
]

# Analysis Operations
ANALYSIS_TOOLS = [
    Tool(
        name="analyze_architecture",
        category=ToolCategory.ANALYSIS_OPS,
        description="Analyze system architecture for issues",
        inputs=["codebase"],
        outputs=["architecture_report"],
        capabilities=["coupling_analysis", "dependency_graph", "pattern_detection"],
        error_handling="comprehensive_logging"
    ),
    Tool(
        name="identify_code_smells",
        category=ToolCategory.ANALYSIS_OPS,
        description="Identify code smells and anti-patterns",
        inputs=["code_files"],
        outputs=["smell_report"],
        capabilities=["pattern_recognition", "complexity_analysis"],
        error_handling="false_positive_filter"
    ),
    Tool(
        name="dependency_analysis",
        category=ToolCategory.ANALYSIS_OPS,
        description="Analyze dependencies and coupling",
        inputs=["codebase"],
        outputs=["dependency_graph"],
        capabilities=["graph_generation", "cycle_detection"],
        error_handling="graceful_timeout"
    ),
]

# Design Operations
DESIGN_TOOLS = [
    Tool(
        name="design_component",
        category=ToolCategory.DESIGN_OPS,
        description="Design a new component",
        inputs=["requirements", "constraints"],
        outputs=["component_design"],
        capabilities=["oop_design", "pattern_selection"],
        error_handling="iteration_with_feedback"
    ),
    Tool(
        name="design_system",
        category=ToolCategory.DESIGN_OPS,
        description="Design a new system",
        inputs=["system_requirements", "existing_systems"],
        outputs=["system_design"],
        capabilities=["system_design", "integration_planning"],
        error_handling="review_required"
    ),
]

# Genetics Operations
GENETICS_TOOLS = [
    Tool(
        name="implement_trait",
        category=ToolCategory.GENETICS_OPS,
        description="Implement a genetic trait",
        inputs=["trait_spec", "existing_genetics"],
        outputs=["trait_implementation"],
        capabilities=["genetics_impl", "testing"],
        error_handling="rollback_on_failure"
    ),
    Tool(
        name="test_genetics",
        category=ToolCategory.GENETICS_OPS,
        description="Test genetics system",
        inputs=["genetics_code"],
        outputs=["test_results"],
        capabilities=["test_gen", "statistics"],
        error_handling="detailed_reporting"
    ),
]

# UI Operations
UI_TOOLS = [
    Tool(
        name="design_ui_layout",
        category=ToolCategory.UI_OPS,
        description="Design UI layout",
        inputs=["requirements", "constraints"],
        outputs=["ui_design"],
        capabilities=["layout_design", "responsiveness"],
        error_handling="iteration"
    ),
    Tool(
        name="implement_ui_component",
        category=ToolCategory.UI_OPS,
        description="Implement UI component",
        inputs=["ui_spec", "existing_ui"],
        outputs=["component_code"],
        capabilities=["ui_coding", "event_handling"],
        error_handling="graceful_degradation"
    ),
]

# Integration Operations
INTEGRATION_TOOLS = [
    Tool(
        name="test_integration",
        category=ToolCategory.INTEGRATION_OPS,
        description="Test system integration",
        inputs=["system_interfaces"],
        outputs=["integration_report"],
        capabilities=["integration_testing", "issue_detection"],
        error_handling="detailed_logging"
    ),
    Tool(
        name="validate_integration",
        category=ToolCategory.INTEGRATION_OPS,
        description="Validate integration points",
        inputs=["interface_specs"],
        outputs=["validation_report"],
        capabilities=["interface_validation", "compatibility_check"],
        error_handling="detailed_reporting"
    ),
]

# Debug Operations
DEBUG_TOOLS = [
    Tool(
        name="trace_error",
        category=ToolCategory.DEBUG_OPS,
        description="Trace error to root cause",
        inputs=["error_log", "code"],
        outputs=["root_cause_analysis"],
        capabilities=["stack_trace_analysis", "log_analysis"],
        error_handling="best_effort"
    ),
    Tool(
        name="create_test_for_bug",
        category=ToolCategory.DEBUG_OPS,
        description="Create test that reproduces bug",
        inputs=["bug_description", "code"],
        outputs=["test_code"],
        capabilities=["test_generation", "bug_reproduction"],
        error_handling="manual_refinement"
    ),
]

# Log Operations
LOG_TOOLS = [
    Tool(
        name="analyze_logs",
        category=ToolCategory.LOG_OPS,
        description="Analyze logs for issues",
        inputs=["log_files"],
        outputs=["issue_report"],
        capabilities=["log_parsing", "pattern_detection"],
        error_handling="graceful_skip"
    ),
    Tool(
        name="extract_errors",
        category=ToolCategory.LOG_OPS,
        description="Extract errors from logs",
        inputs=["log_files"],
        outputs=["error_list"],
        capabilities=["log_parsing", "error_classification"],
        error_handling="filter_duplicates"
    ),
]

# Tool Registry
EXTENDED_TOOLS = {
    ToolCategory.DOC_OPS: DOC_TOOLS,
    ToolCategory.ANALYSIS_OPS: ANALYSIS_TOOLS,
    ToolCategory.DESIGN_OPS: DESIGN_TOOLS,
    ToolCategory.GENETICS_OPS: GENETICS_TOOLS,
    ToolCategory.UI_OPS: UI_TOOLS,
    ToolCategory.INTEGRATION_OPS: INTEGRATION_TOOLS,
    ToolCategory.DEBUG_OPS: DEBUG_TOOLS,
    ToolCategory.LOG_OPS: LOG_TOOLS,
}
