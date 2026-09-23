"""
Failure Detector - Detect limits and fail gracefully
Know when to ask for help vs when to continue
"""

from enum import Enum
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


class FailureMode(Enum):
    """Types of failures agent can detect"""
    CONTEXT_TOO_COMPLEX = "context_too_complex"
    ARCHITECTURAL_DECISION = "architectural_decision"
    AMBIGUOUS_REQUIREMENTS = "ambiguous_requirements"
    MISSING_REFERENCE = "missing_reference"
    CODE_QUALITY_UNCERTAIN = "code_quality_uncertain"
    INTEGRATION_RISKY = "integration_risky"
    PERFORMANCE_UNKNOWN = "performance_unknown"
    DESIGN_CONFLICT = "design_conflict"
    BEYOND_LOCAL_CAPABILITY = "beyond_local_capability"
    TEST_VERIFICATION_FAILED = "test_verification_failed"


@dataclass
class FailureDetection:
    """Detection result"""
    failure_mode: FailureMode
    severity: str  # "low", "medium", "high", "critical"
    reason: str
    can_continue: bool  # Can agent proceed despite this?
    needs_human: bool  # Does this need human review?
    suggestion: str  # What to do


class FailureDetector:
    """
    Detect when agent is reaching limits
    Know when to fail fast vs continue
    """
    
    def __init__(self):
        self.failures: List[FailureDetection] = []
        self.recovery_attempts = 0
        self.max_recovery_attempts = 3
    
    def check_before_planning(self, context: Dict) -> Tuple[bool, Optional[FailureDetection]]:
        """
        Before agent plans implementation, check if it can handle this
        
        Returns: (can_proceed, failure_if_any)
        """
        
        # Check 1: Is the task too complex for local reasoning?
        if self._is_too_complex(context):
            return False, FailureDetection(
                failure_mode=FailureMode.CONTEXT_TOO_COMPLEX,
                severity="high",
                reason="Task involves too many interdependent systems for local LLM to reason about safely",
                can_continue=False,
                needs_human=True,
                suggestion="Break into smaller tasks or get human architectural review"
            )
        
        # Check 2: Does task require architectural decisions?
        if self._requires_architecture_decision(context):
            return False, FailureDetection(
                failure_mode=FailureMode.ARCHITECTURAL_DECISION,
                severity="high",
                reason="Task requires architectural decisions that should be documented first",
                can_continue=False,
                needs_human=True,
                suggestion="Create architecture design document before implementation"
            )
        
        # Check 3: Are requirements ambiguous?
        if self._requirements_ambiguous(context):
            return False, FailureDetection(
                failure_mode=FailureMode.AMBIGUOUS_REQUIREMENTS,
                severity="medium",
                reason="Task requirements are ambiguous or underspecified",
                can_continue=False,
                needs_human=True,
                suggestion="Clarify requirements with designer before proceeding"
            )
        
        # Check 4: Missing critical references?
        missing = self._check_missing_references(context)
        if missing:
            return False, FailureDetection(
                failure_mode=FailureMode.MISSING_REFERENCE,
                severity="high",
                reason=f"Missing critical references: {', '.join(missing)}",
                can_continue=False,
                needs_human=True,
                suggestion="Document missing pieces before implementation"
            )
        
        return True, None
    
    def check_during_generation(self, file_path: str, generated_code: str, context: Dict) -> Tuple[bool, Optional[FailureDetection]]:
        """
        During code generation, check if generated code is trustworthy
        
        Returns: (code_is_safe, failure_if_any)
        """
        
        # Check 1: Code quality concerns
        quality_issues = self._check_code_quality(generated_code)
        if quality_issues:
            return False, FailureDetection(
                failure_mode=FailureMode.CODE_QUALITY_UNCERTAIN,
                severity="medium",
                reason=f"Generated code has quality concerns: {quality_issues}",
                can_continue=False,
                needs_human=True,
                suggestion="Review generated code manually before commit"
            )
        
        # Check 2: Integration risks
        risks = self._check_integration_risks(file_path, generated_code, context)
        if risks:
            return False, FailureDetection(
                failure_mode=FailureMode.INTEGRATION_RISKY,
                severity="high",
                reason=f"Integration risks detected: {risks}",
                can_continue=False,
                needs_human=True,
                suggestion="Review integration points manually"
            )
        
        # Check 3: Performance implications
        if self._has_performance_concerns(generated_code):
            return False, FailureDetection(
                failure_mode=FailureMode.PERFORMANCE_UNKNOWN,
                severity="medium",
                reason="Generated code has unknown performance implications",
                can_continue=True,  # Can continue but needs review
                needs_human=True,
                suggestion="Performance test before deployment"
            )
        
        return True, None
    
    def check_test_results(self, test_output: str, task_id: str) -> Tuple[bool, Optional[FailureDetection]]:
        """
        After tests run, check if they actually verify success
        
        Returns: (tests_are_valid, failure_if_any)
        """
        
        # Check 1: Are tests passing?
        if "FAILED" in test_output or "ERROR" in test_output:
            return False, FailureDetection(
                failure_mode=FailureMode.TEST_VERIFICATION_FAILED,
                severity="high",
                reason="Tests are failing - implementation is not complete",
                can_continue=False,
                needs_human=True,
                suggestion="Debug and fix failing tests before proceeding"
            )
        
        # Check 2: Are there enough tests?
        if self._insufficient_test_coverage(test_output):
            return False, FailureDetection(
                failure_mode=FailureMode.TEST_VERIFICATION_FAILED,
                severity="medium",
                reason="Test coverage is insufficient",
                can_continue=True,  # Can continue but needs review
                needs_human=True,
                suggestion="Add more tests to verify implementation"
            )
        
        return True, None
    
    def check_design_conflict(self, implementation: str, design_docs: Dict) -> Tuple[bool, Optional[FailureDetection]]:
        """
        Check if implementation conflicts with design principles
        
        Returns: (no_conflict, failure_if_any)
        """
        
        # Check against design pillars
        pillars = design_docs.get("design_pillars", "")
        
        conflicts = self._find_design_conflicts(implementation, pillars)
        if conflicts:
            return False, FailureDetection(
                failure_mode=FailureMode.DESIGN_CONFLICT,
                severity="high",
                reason=f"Implementation conflicts with design pillars: {conflicts}",
                can_continue=False,
                needs_human=True,
                suggestion="Refactor to align with design pillars"
            )
        
        return True, None
    
    # Detection helpers
    
    def _is_too_complex(self, context) -> bool:
        """Task involves too many systems?"""
        systems_touched = len(context.existing_implementations)
        integration_points = context.task_mappings
        
        # If touches more than 3 systems, might be complex
        if systems_touched > 3:
            return True
        
        # If has multiple integration points, might be complex
        if len(integration_points) > 5:
            return True
        
        return False
    
    def _requires_architecture_decision(self, context) -> bool:
        """Does this require architectural decisions?"""
        task = context.current_task
        task_title = task.get("title", "").lower()
        
        # Keywords that suggest architectural decisions
        arch_keywords = [
            "refactor",
            "redesign",
            "restructure",
            "architecture",
            "framework",
            "integration",
            "system"
        ]
        
        return any(keyword in task_title for keyword in arch_keywords)
    
    def _requirements_ambiguous(self, context) -> bool:
        """Are requirements unclear?"""
        task = context.current_task
        
        # Check if success criteria are clear
        success = task.get("success_criteria", [])
        if not success or len(success) < 2:
            return True  # Vague success criteria
        
        # Check if description is detailed enough
        description = task.get("description", "")
        if len(description) < 50:
            return True  # Too brief
        
        return False
    
    def _check_missing_references(self, context) -> List[str]:
        """What key references are missing?"""
        missing = []
        
        # Check for architecture documentation
        if not context.technical_design:
            missing.append("TECHNICAL_DESIGN.md")
        
        # Check for feature specification
        if not context.feature_spec:
            missing.append("FEATURE_SPEC.md")
        
        # Check for system specifications
        if not context.system_specs:
            missing.append("SYSTEM_SPECS.md")
        
        return missing
    
    def _check_code_quality(self, code: str) -> Optional[str]:
        """Check for code quality issues"""
        issues = []
        
        # Check for docstrings
        if "def " in code and "\"\"\"" not in code:
            issues.append("Missing docstrings")
        
        # Check for type hints
        if "def " in code and "->" not in code:
            issues.append("Missing type hints")
        
        # Check for TODO comments
        if "TODO" in code or "FIXME" in code:
            issues.append("Incomplete implementation (has TODOs)")
        
        # Check for error handling
        if "try:" in code and "except:" not in code:
            issues.append("Incomplete error handling")
        
        return "; ".join(issues) if issues else None
    
    def _check_integration_risks(self, file_path: str, code: str, context: Dict) -> Optional[str]:
        """Check for integration risks"""
        risks = []
        
        # Check if modifying core system files
        if "shared" in file_path and "ecs" in file_path:
            if "breaking_change_detected" in code:  # Marker we could add
                risks.append("Potential breaking change to ECS system")
        
        # Check if touching multiple systems
        if code.count("import") > 5:
            risks.append("Many dependencies - high coupling risk")
        
        # Check if modifying existing code
        if "existing_code" in context and len(context["existing_code"]) > 0:
            risks.append("Modifying existing code - compatibility risk")
        
        return "; ".join(risks) if risks else None
    
    def _has_performance_concerns(self, code: str) -> bool:
        """Does code have performance concerns?"""
        
        # Check for nested loops
        if code.count("for ") > 2 and code.count("while ") > 0:
            return True
        
        # Check for recursive functions
        if "def " in code and code.count("return ") > 3:
            return True
        
        return False
    
    def _insufficient_test_coverage(self, test_output: str) -> bool:
        """Are tests sufficient?"""
        
        # If test output mentions coverage, check it
        if "coverage" in test_output.lower():
            if "100%" not in test_output and "95%" not in test_output:
                return True
        
        # If very few tests ran
        if test_output.count("passed") < 3:
            return True
        
        return False
    
    def _find_design_conflicts(self, implementation: str, pillars: str) -> Optional[str]:
        """Check for conflicts with design pillars"""
        
        conflicts = []
        
        # Check pillar 1: Universal Creature
        if "creature" in pillars.lower() and "creature" not in implementation.lower():
            conflicts.append("Doesn't respect Universal Creature pillar")
        
        # Check pillar 2: Visual ≠ Mechanical
        if "visual" in pillars.lower() and implementation.count("visual") < 2:
            conflicts.append("Doesn't separate visual from mechanical")
        
        # Check pillar 3: ECS Architecture
        if "ecs" in pillars.lower() and "component" not in implementation.lower():
            conflicts.append("Doesn't use ECS patterns")
        
        return "; ".join(conflicts) if conflicts else None


class GracefulFailureHandler:
    """Handle failures gracefully"""
    
    def __init__(self):
        self.detector = FailureDetector()
    
    def handle_failure(self, failure: FailureDetection) -> str:
        """
        Handle a detected failure gracefully
        Return actionable message for user
        """
        
        message = f"""
╔══════════════════════════════════════════════════════════════╗
║              AGENT STOPPED - NEEDS HUMAN INPUT                ║
╚══════════════════════════════════════════════════════════════╝

⚠️  Failure Mode: {failure.failure_mode.value}
Severity: {failure.severity.upper()}

Reason:
  {failure.reason}

Suggestion:
  {failure.suggestion}

What to do:
  1. Review the suggestion above
  2. Make necessary changes (documentation, requirements, design)
  3. Run the command again

Agent stopped to prevent:
  - Wasting time on wrong approach
  - Creating code that conflicts with design
  - Building on uncertain foundations
"""
        
        return message
