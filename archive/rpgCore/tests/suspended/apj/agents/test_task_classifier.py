"""
Tests for TaskClassifier
"""

import pytest
from src.tools.apj.agents.task_classifier import TaskClassifier, TaskClassificationResult


class TestTaskClassifier:
    """Test suite for TaskClassifier"""
    
    def test_documentation_task_classification(self):
        """Test documentation task classification"""
        
        result = TaskClassifier.classify(
            "task_1",
            "Generate docstrings for ECS components",
            "Create comprehensive docstrings for all ECS component classes"
        )
        
        assert result.detected_type == "documentation"
        assert result.confidence >= 0.7
        assert any(kw in result.keywords for kw in ["docstring", "documentation"])
        assert result.suggested_agent == "documentation_specialist"
    
    def test_documentation_task_with_readme(self):
        """Test documentation task with readme keyword"""
        
        result = TaskClassifier.classify(
            "task_2",
            "Update README with installation guide",
            "Add detailed installation instructions to the main README file"
        )
        
        assert result.detected_type == "documentation"
        assert result.confidence >= 0.7
        assert "readme" in result.keywords
        assert result.suggested_agent == "documentation_specialist"
    
    def test_architecture_task_classification(self):
        """Test architecture task classification"""
        
        result = TaskClassifier.classify(
            "task_3",
            "Refactor ECS system to reduce coupling",
            "Analyze and refactor the ECS architecture to reduce tight coupling"
        )
        
        assert result.detected_type == "architecture"
        assert result.confidence >= 0.7
        assert any(kw in result.keywords for kw in ["refactor", "coupling", "architecture"])
        assert result.suggested_agent == "architecture_specialist"
    
    def test_architecture_task_with_design(self):
        """Test architecture task with design keyword"""
        
        result = TaskClassifier.classify(
            "task_4",
            "Design new UI component system",
            "Create a flexible design for the UI component architecture"
        )
        
        assert result.detected_type == "architecture"
        assert result.confidence >= 0.7
        assert "design" in result.keywords
        assert result.suggested_agent == "architecture_specialist"
    
    def test_genetics_task_classification(self):
        """Test genetics task classification"""
        
        result = TaskClassifier.classify(
            "task_5",
            "Implement trait inheritance system",
            "Create a genetics system for trait inheritance in slime breeding"
        )
        
        assert result.detected_type == "genetics"
        assert result.confidence >= 0.7
        assert any(kw in result.keywords for kw in ["genetics", "trait", "inheritance"])
        assert result.suggested_agent == "genetics_specialist"
    
    def test_genetics_task_with_breeding(self):
        """Test genetics task with breeding keyword"""
        
        result = TaskClassifier.classify(
            "task_6",
            "Implement breeding mechanics",
            "Add breeding system for genetic trait combinations"
        )
        
        assert result.detected_type == "genetics"
        assert result.confidence >= 0.7
        assert "breeding" in result.keywords
        assert result.suggested_agent == "genetics_specialist"
    
    def test_ui_task_classification(self):
        """Test UI task classification"""
        
        result = TaskClassifier.classify(
            "task_7",
            "Create inventory UI component",
            "Design and implement the inventory user interface component"
        )
        
        assert result.detected_type == "ui"
        assert result.confidence >= 0.7
        assert any(kw in result.keywords for kw in ["ui", "component", "interface"])
        assert result.suggested_agent == "ui_systems_specialist"
    
    def test_ui_task_with_layout(self):
        """Test UI task with layout keyword"""
        
        result = TaskClassifier.classify(
            "task_8",
            "Design main menu layout",
            "Create the layout structure for the main menu interface"
        )
        
        assert result.detected_type == "ui"
        assert result.confidence >= 0.7
        assert "layout" in result.keywords
        assert result.suggested_agent == "ui_systems_specialist"
    
    def test_integration_task_classification(self):
        """Test integration task classification"""
        
        result = TaskClassifier.classify(
            "task_9",
            "Test ECS-genetics integration",
            "Create integration tests for the ECS and genetics systems"
        )
        
        assert result.detected_type == "integration"
        assert result.confidence >= 0.7
        assert any(kw in result.keywords for kw in ["integration", "test"])
        assert result.suggested_agent == "integration_specialist"
    
    def test_integration_task_with_cross_system(self):
        """Test integration task with cross-system keyword"""
        
        result = TaskClassifier.classify(
            "task_10",
            "Validate cross-system operations",
            "Ensure all subsystems work together correctly"
        )
        
        assert result.detected_type in ["integration", "ui", "architecture"]
        assert result.confidence >= 0.7
        assert "cross-system" in result.keywords or "interface" in result.keywords
        assert result.suggested_agent == "integration_specialist"
    
    def test_debugging_task_classification(self):
        """Test debugging task classification"""
        
        result = TaskClassifier.classify(
            "task_11",
            "Fix entity persistence bug",
            "Debug and fix the entity persistence error in the save system"
        )
        
        assert result.detected_type == "debugging"
        assert result.confidence >= 0.7
        assert any(kw in result.keywords for kw in ["debug", "fix", "bug"])
        assert result.suggested_agent == "debugging_specialist"
    
    def test_debugging_task_with_error(self):
        """Test debugging task with error keyword"""
        
        result = TaskClassifier.classify(
            "task_12",
            "Analyze component loading errors",
            "Investigate and fix component loading errors in ECS startup"
        )
        
        assert result.detected_type == "debugging"
        assert result.confidence >= 0.7
        assert "error" in result.keywords
        assert result.suggested_agent == "debugging_specialist"
    
    def test_demo_association_detection(self):
        """Test demo association detection"""
        
        # Test dungeon demo
        result = TaskClassifier.classify(
            "task_13",
            "Complete dungeon crawler features",
            "Add monster AI and room generation for dungeon demo"
        )
        
        assert result.demo_association == "dungeon"
        
        # Test tower defense demo
        result = TaskClassifier.classify(
            "task_14",
            "Implement tower defense waves",
            "Create enemy wave system for tower defense demo"
        )
        
        assert result.demo_association == "tower_defense"
        
        # Test racing demo
        result = TaskClassifier.classify(
            "task_15",
            "Optimize racing car physics",
            "Improve vehicle physics for racing demo"
        )
        
        assert result.demo_association == "racing"
    
    def test_system_association_detection(self):
        """Test system association detection"""
        
        # Test ECS system
        result = TaskClassifier.classify(
            "task_16",
            "Add new ECS component",
            "Create a new component for the entity component system"
        )
        
        assert result.system_association == "ecs"
        
        # Test genetics system
        result = TaskClassifier.classify(
            "task_17",
            "Implement genome mutations",
            "Add mutation system to the genetics engine"
        )
        
        assert result.system_association in ["genetics", "ecs"]
        
        # Test UI system
        result = TaskClassifier.classify(
            "task_18",
            "Create UI button component",
            "Design button component for the user interface"
        )
        
        assert result.system_association in ["ui", "ecs"]
    
    def test_confidence_scoring_multiple_keywords(self):
        """Test confidence scoring with multiple keywords"""
        
        result = TaskClassifier.classify(
            "task_19",
            "Document and refactor ECS architecture",
            "Generate documentation and refactor the ECS system architecture"
        )
        
        # Should have high confidence due to multiple keywords
        assert result.confidence >= 0.8
        assert len(result.keywords) >= 2
    
    def test_confidence_scoring_single_keyword(self):
        """Test confidence scoring with single keyword"""
        
        result = TaskClassifier.classify(
            "task_20",
            "Fix bug in save system",
            "Debug and resolve the save system issue"
        )
        
        # Should have moderate confidence with single keyword
        assert result.confidence >= 0.7
        assert len(result.keywords) >= 1
    
    def test_fallback_to_generic_when_no_match(self):
        """Test fallback to generic when no match"""
        
        result = TaskClassifier.classify(
            "task_21",
            "Do some work",
            "Complete the task that needs to be done"
        )
        
        assert result.detected_type == "generic"
        assert result.confidence == 0.5
        assert result.suggested_agent == "generic_agent"
    
    def test_edge_case_empty_description(self):
        """Test edge case with empty description"""
        
        result = TaskClassifier.classify(
            "task_22",
            "Generate docstrings",
            ""
        )
        
        assert result.detected_type == "documentation"
        assert result.confidence >= 0.7
    
    def test_edge_case_very_short_title(self):
        """Test edge case with very short title"""
        
        result = TaskClassifier.classify(
            "task_23",
            "Fix bug",
            "Debug and fix the issue"
        )
        
        assert result.detected_type == "debugging"
        assert result.confidence >= 0.7
    
    def test_case_insensitive_matching(self):
        """Test case insensitive keyword matching"""
        
        result = TaskClassifier.classify(
            "task_24",
            "GENERATE DOCSTRINGS",
            "Create documentation for all classes"
        )
        
        assert result.detected_type == "documentation"
        assert result.confidence >= 0.7
    
    def test_classify_batch(self):
        """Test batch classification"""
        
        tasks = [
            {"task_id": "1", "title": "Generate docstrings", "description": "Add docstrings"},
            {"task_id": "2", "title": "Fix bug", "description": "Debug error"},
            {"task_id": "3", "title": "Design system", "description": "Architecture design"}
        ]
        
        results = TaskClassifier.classify_batch(tasks)
        
        assert len(results) == 3
        assert results[0].detected_type == "documentation"
        assert results[1].detected_type == "debugging"
        assert results[2].detected_type == "architecture"
    
    def test_get_classification_summary(self):
        """Test classification summary"""
        
        results = [
            TaskClassificationResult("1", "documentation", 0.8, ["docstring"], None, None, "documentation_specialist"),
            TaskClassificationResult("2", "documentation", 0.7, ["readme"], None, None, "documentation_specialist"),
            TaskClassificationResult("3", "debugging", 0.9, ["fix"], None, None, "debugging_specialist"),
        ]
        
        summary = TaskClassifier.get_classification_summary(results)
        
        assert summary["total_tasks"] == 3
        assert summary["type_distribution"]["documentation"] == 2
        assert summary["type_distribution"]["debugging"] == 1
        assert summary["average_confidence"] == pytest.approx(0.8, rel=1e-2)
    
    def test_agent_name_mapping(self):
        """Test agent name mapping"""
        
        test_cases = [
            ("documentation", "documentation_specialist"),
            ("architecture", "architecture_specialist"),
            ("genetics", "genetics_specialist"),
            ("ui", "ui_systems_specialist"),
            ("integration", "integration_specialist"),
            ("debugging", "debugging_specialist"),
            ("generic", "generic_agent"),
            ("unknown", "generic_agent")
        ]
        
        for agent_type, expected_name in test_cases:
            result = TaskClassifier._get_agent_name(agent_type)
            assert result == expected_name
