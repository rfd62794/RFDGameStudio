"""
Task Classifier - Analyze tasks to classify type and suggest the right agent
Intelligent routing for autonomous swarm task execution
"""

import re
from dataclasses import dataclass
from typing import Optional, List
from .task_validator import TASK_VALIDATOR


@dataclass
class TaskClassificationResult:
    """Result of task classification"""
    task_id: str
    detected_type: str  # "documentation", "architecture", "genetics", "ui", "integration", "debugging"
    confidence: float  # 0.5-1.0
    keywords: List[str]  # action verbs found in title/description
    demo_association: Optional[str]  # "racing", "dungeon", "tower_defense", etc.
    system_association: Optional[str]  # "ecs", "genetics", "rendering", "ui", etc.
    suggested_agent: str  # mapped agent name


class TaskClassifier:
    """Classify tasks by type for intelligent routing"""
    
    # Agent type keywords
    TYPE_KEYWORDS = {
        "documentation": [
            "document", "docstring", "readme", "api_doc", "documentation", 
            "generate_docstrings", "create_architecture_docs", "write_api_documentation",
            "create_tutorials", "maintain_changelog", "generate_readme", "document_decisions",
            "create_design_docs"
        ],
        "architecture": [
            "refactor", "architecture", "coupling", "design", "analyze_architecture",
            "identify_coupling", "suggest_refactoring", "design_new_systems",
            "document_architecture", "validate_patterns", "suggest_optimizations",
            "detect_violations"
        ],
        "genetics": [
            "genetic", "trait", "breeding", "inheritance", "implement_genetics",
            "integrate_genetics", "create_trait_systems", "implement_breeding",
            "create_inheritance_rules", "test_genetics", "optimize_genetics", "document_genetics"
        ],
        "ui": [
            "ui", "component", "button", "layout", "interface", "design_ui_layouts",
            "implement_ui_components", "create_ui_systems", "implement_input_handling",
            "create_ui_animations", "test_ui", "optimize_ui", "document_ui"
        ],
        "integration": [
            "integration", "test", "cross-system", "test_integration", "identify_integration_issues",
            "create_integration_tests", "validate_interfaces", "create_adapters",
            "test_cross_system", "document_integration", "resolve_conflicts"
        ],
        "debugging": [
            "debug", "bug", "fix", "error", "test_case", "analyze_errors", "trace_issues",
            "create_test_for_bug", "fix_bug", "verify_fix", "identify_root_cause",
            "prevent_regression", "document_fix"
        ]
    }
    
    # Demo association patterns
    DEMO_PATTERNS = {
        "racing": ["racing", "race", "car", "vehicle", "track", "lap"],
        "dungeon": ["dungeon", "crawler", "maze", "room", "monster", "npc"],
        "tower_defense": ["tower", "defense", "td", "wave", "enemy", "path"],
        "slime_breeder": ["slime", "breeder", "breed", "genetics", "trait"],
        "space": ["space", "ship", "planet", "asteroid", "orbit"],
        "breeding": ["breeding", "mate", "offspring", "genetics", "trait"]
    }
    
    # System association patterns
    SYSTEM_PATTERNS = {
        "ecs": ["ecs", "entity", "component", "system", "kinematics", "behavior"],
        "genetics": ["genetics", "genome", "trait", "breeding", "inheritance"],
        "rendering": ["render", "graphics", "draw", "display", "visual"],
        "ui": ["ui", "interface", "button", "layout", "component"],
        "physics": ["physics", "collision", "movement", "velocity", "force"],
        "audio": ["audio", "sound", "music", "effect", "volume"]
    }
    
    @staticmethod
    def classify(task_id: str, title: str, description: str) -> TaskClassificationResult:
        """Classify a task based on title and description"""
        
        # Combine title and description for analysis
        combined_text = f"{title} {description}".lower()
        
        # Find keywords for each type
        type_scores = {}
        found_keywords = {}
        
        for task_type, keywords in TaskClassifier.TYPE_KEYWORDS.items():
            matched_keywords = []
            score = 0
            
            for keyword in keywords:
                if keyword in combined_text:
                    matched_keywords.append(keyword)
                    score += 1
            
            if matched_keywords:
                type_scores[task_type] = score
                found_keywords[task_type] = matched_keywords
        
        # Determine best type
        detected_type = "generic"
        confidence = 0.5
        keywords = []
        
        if type_scores:
            # Get type with highest score
            detected_type = max(type_scores, key=type_scores.get)
            keywords = found_keywords[detected_type]
            
            # Calculate confidence based on score
            score = type_scores[detected_type]
            if score >= 3:
                confidence = 0.9
            elif score >= 2:
                confidence = 0.8
            elif score >= 1:
                confidence = 0.7
            else:
                confidence = 0.6
        
        # Detect demo association
        demo_association = TaskClassifier._detect_demo_association(combined_text)
        
        # Detect system association
        system_association = TaskClassifier._detect_system_association(combined_text)
        
        # Get suggested agent
        suggested_agent = TaskClassifier._get_agent_name(detected_type)
        
        return TaskClassificationResult(
            task_id=task_id,
            detected_type=detected_type,
            confidence=confidence,
            keywords=keywords,
            demo_association=demo_association,
            system_association=system_association,
            suggested_agent=suggested_agent
        )
    
    @staticmethod
    def _detect_demo_association(text: str) -> Optional[str]:
        """Detect which demo this task relates to"""
        
        for demo_name, patterns in TaskClassifier.DEMO_PATTERNS.items():
            for pattern in patterns:
                if pattern in text:
                    return demo_name
        
        return None
    
    @staticmethod
    def _detect_system_association(text: str) -> Optional[str]:
        """Detect which system this task relates to"""
        
        for system_name, patterns in TaskClassifier.SYSTEM_PATTERNS.items():
            for pattern in patterns:
                if pattern in text:
                    return system_name
        
        return None
    
    @staticmethod
    def _get_agent_name(agent_type: str) -> str:
        """Map agent type to agent name"""
        
        type_to_agent = {
            "documentation": "documentation_specialist",
            "architecture": "architecture_specialist", 
            "genetics": "genetics_specialist",
            "ui": "ui_systems_specialist",
            "integration": "integration_specialist",
            "debugging": "debugging_specialist",
            "generic": "generic_agent"
        }
        
        return type_to_agent.get(agent_type, "generic_agent")
    
    @staticmethod
    def classify_batch(tasks: List[dict]) -> List[TaskClassificationResult]:
        """Classify multiple tasks at once"""
        
        results = []
        for task in tasks:
            result = TaskClassifier.classify(
                task.get("task_id", ""),
                task.get("title", ""),
                task.get("description", "")
            )
            results.append(result)
        
        return results
    
    @staticmethod
    def get_classification_summary(results: List[TaskClassificationResult]) -> dict:
        """Get summary of classification results"""
        
        type_counts = {}
        demo_counts = {}
        system_counts = {}
        total_confidence = 0
        
        for result in results:
            # Count types
            type_counts[result.detected_type] = type_counts.get(result.detected_type, 0) + 1
            
            # Count demos
            if result.demo_association:
                demo_counts[result.demo_association] = demo_counts.get(result.demo_association, 0) + 1
            
            # Count systems
            if result.system_association:
                system_counts[result.system_association] = system_counts.get(result.system_association, 0) + 1
            
            total_confidence += result.confidence
        
        return {
            "total_tasks": len(results),
            "type_distribution": type_counts,
            "demo_distribution": demo_counts,
            "system_distribution": system_counts,
            "average_confidence": total_confidence / len(results) if results else 0
        }
