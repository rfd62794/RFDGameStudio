"""
Task Validator - Filters out code fragments, metadata, and invalid tasks
Prevents false positives in project analysis
"""

import re
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class TaskValidationResult:
    """Result of task validation"""
    is_valid: bool
    reason: str
    confidence: float
    suggested_fix: str = ""


class TaskValidator:
    """Filters out code fragments, metadata, and invalid tasks"""
    
    # Patterns that indicate this is NOT a real task
    REJECT_PATTERNS = [
        # Error type lists and imports
        r"^'.*'\s*,\s*'.*'",  # 'Pattern', 'Pattern'... format
        r"BlockingIOError|ChildProcessError|ConnectionError|PermissionError",
        r"ImportError|ModuleNotFoundError|AttributeError",
        r"ValueError|TypeError|KeyError|IndexError",
        
        # File references and locations
        r"\.md:\d+$",  # File references like "STRATEGIC_INVENTORY.md:171"
        r"archive/.*\.py",  # Archive file references
        
        # Python code fragments
        r"^elif|^else:|^for |^if |^while |^try |^except |^finally ",
        r"^def |^class |^import |^from |^return |^print |^logger\.",
        r"^[a-zA-Z_][a-zA-Z0-9_]*\s*=",  # Variable assignments
        r"^\s*\)",  # Closing parentheses
        r"^\s*\}",  # Closing braces
        
        # Configuration and metadata
        r"^log_level\s*:",  # Config keys
        r"^\".*\":\s*\"",  # JSON key-value pairs
        r"^\d+\.\d+,",  # Numeric tuples
        r"^critical_failure_threshold:",
        
        # Common code patterns
        r"self\.",  # Object references
        r"\.get\(",  # Method calls
        r"\[\]",  # List access
        r"\(\)",  # Function calls
        
        # Too short (likely fragments)
        r"^.{0,14}$",  # Very short lines
    ]
    
    # Patterns that strongly indicate a REAL task
    VALID_TASK_PATTERNS = [
        r"implement\s+\w+",  # Implement X
        r"create\s+\w+",  # Create X
        r"build\s+\w+",  # Build X
        r"design\s+\w+",  # Design X
        r"fix\s+\w+",  # Fix X
        r"add\s+\w+",  # Add X
        r"update\s+\w+",  # Update X
        r"refactor\s+\w+",  # Refactor X
        r"test\s+\w+",  # Test X
        r"document\s+\w+",  # Document X
        r"optimize\s+\w+",  # Optimize X
        r"integrate\s+\w+",  # Integrate X
        r"migrate\s+\w+",  # Migrate X
        r"upgrade\s+\w+",  # Upgrade X
    ]
    
    @staticmethod
    def is_valid_task(title: str, description: str, location: str = "") -> TaskValidationResult:
        """
        Returns False if this looks like a code fragment, not a real task
        
        Args:
            title: Task title from analysis
            description: Task description from analysis
            location: Where the task was found
            
        Returns:
            TaskValidationResult with validation details
        """
        
        title = title.strip()
        description = description.strip()
        
        # Check reject patterns first
        for pattern in TaskValidator.REJECT_PATTERNS:
            if re.search(pattern, title, re.IGNORECASE):
                return TaskValidationResult(
                    is_valid=False,
                    reason=f"Matches reject pattern: {pattern}",
                    confidence=0.9,
                    suggested_fix="This appears to be a code fragment or metadata, not a task"
                )
        
        # Check if title is too short
        if len(title) < 15:
            return TaskValidationResult(
                is_valid=False,
                reason="Title too short (likely fragment)",
                confidence=0.8,
                suggested_fix="Task titles should be descriptive and at least 15 characters"
            )
        
        # Check if title and description are identical (copy-paste)
        if title == description:
            return TaskValidationResult(
                is_valid=False,
                reason="Title and description are identical (copy-paste)",
                confidence=0.7,
                suggested_fix="Provide unique descriptions for tasks"
            )
        
        # Check if it looks like a real task
        has_valid_pattern = any(
            re.search(pattern, title, re.IGNORECASE) 
            for pattern in TaskValidator.VALID_TASK_PATTERNS
        )
        
        if has_valid_pattern:
            return TaskValidationResult(
                is_valid=True,
                reason="Contains valid task pattern",
                confidence=0.8
            )
        
        # Check if it contains meaningful action words
        action_words = ["implement", "create", "build", "design", "fix", "add", "update", 
                         "refactor", "test", "document", "optimize", "integrate", "complete"]
        has_action_word = any(word in title.lower() for word in action_words)
        
        if has_action_word:
            return TaskValidationResult(
                is_valid=True,
                reason="Contains action word",
                confidence=0.6
            )
        
        # Default to invalid if no strong indicators
        return TaskValidationResult(
            is_valid=False,
            reason="No clear task indicators found",
            confidence=0.5,
            suggested_fix="Add clear action words like 'implement', 'create', 'fix', etc."
        )
    
    @staticmethod
    def validate_tasks(issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter a list of issues, removing false positives
        
        Args:
            issues: List of issue dictionaries
            
        Returns:
            Filtered list with only valid tasks
        """
        
        valid_tasks = []
        rejected_tasks = []
        
        for issue in issues:
            validation = TaskValidator.is_valid_task(
                issue.get("title", ""),
                issue.get("description", ""),
                issue.get("location", "")
            )
            
            if validation.is_valid:
                valid_tasks.append(issue)
            else:
                rejected_tasks.append({
                    **issue,
                    "validation": {
                        "valid": False,
                        "reason": validation.reason,
                        "confidence": validation.confidence,
                        "suggested_fix": validation.suggested_fix
                    }
                })
        
        return valid_tasks, rejected_tasks
    
    @staticmethod
    def get_validation_summary(rejected_tasks: List[Dict[str, Any]]) -> str:
        """Get a summary of rejected tasks for debugging"""
        
        if not rejected_tasks:
            return "✅ All tasks passed validation"
        
        summary = f"❌ Rejected {len(rejected_tasks)} false positive tasks:\n\n"
        
        # Group by rejection reason
        reasons = {}
        for task in rejected_tasks:
            reason = task["validation"]["reason"]
            reasons[reason] = reasons.get(reason, 0) + 1
        
        for reason, count in sorted(reasons.items(), key=lambda x: x[1], reverse=True):
            summary += f"  • {reason}: {count} tasks\n"
        
        # Show examples of rejected tasks
        summary += "\nExample rejections:\n"
        for task in rejected_tasks[:5]:  # Show first 5
            title = task.get("title", "No title")
            reason = task["validation"]["reason"]
            summary += f"  ❌ '{title}' - {reason}\n"
        
        return summary


# Singleton instance for easy import
TASK_VALIDATOR = TaskValidator()
