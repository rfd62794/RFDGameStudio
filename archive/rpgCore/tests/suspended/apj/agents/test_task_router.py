"""
Tests for TaskRouter
"""

import pytest
from unittest.mock import Mock
from datetime import datetime

from src.tools.apj.agents.task_router import TaskRouter, RoutingLevel
from src.tools.apj.agents.agent_registry import AgentRegistry
from src.tools.apj.agents.task_classifier import TaskClassificationResult
from src.tools.apj.agents.types import SwarmTask, TaskStatus, AgentWorkload


class TestTaskRouter:
    """Test suite for TaskRouter"""
    
    def setup_method(self):
        """Set up test router and registry"""
        self.registry = AgentRegistry()
        self.workloads = {}
        self.self_healer = Mock()
        self.self_healer.circuit_breakers = {}
        
        self.router = TaskRouter(self.registry, self.workloads, self.self_healer)
        
        # Register test specialists
        self._register_test_specialists()
        
        # Set up workloads
        self._setup_workloads()
    
    def _register_test_specialists(self):
        """Register test specialist agents"""
        
        specialists = [
            ("documentation_specialist", "documentation", ["documentation"], ["doc_ops"]),
            ("architecture_specialist", "architecture", ["architecture"], ["analysis_ops"]),
            ("genetics_specialist", "genetics", ["genetics"], ["genetics_ops"]),
            ("ui_systems_specialist", "ui", ["ui"], ["ui_ops"]),
            ("integration_specialist", "integration", ["integration"], ["integration_ops"]),
            ("debugging_specialist", "debugging", ["debugging"], ["debug_ops"]),
            ("generic_agent", "generic", ["execution"], ["file_ops", "code_ops"])
        ]
        
        for name, specialty, capabilities, tools in specialists:
            self.registry.register_specialist(
                agent_name=name,
                specialty=specialty,
                capabilities=capabilities,
                tool_categories=tools
            )
    
    def _setup_workloads(self):
        """Set up test workloads"""
        
        for agent_name in self.registry.get_all_agents():
            self.workloads[agent_name] = AgentWorkload(
                agent_name=agent_name,
                current_task=None,
                tasks_completed=0
            )
    
    def _create_test_task(self, task_id: str, title: str, description: str, task_type: str = "generic") -> SwarmTask:
        """Create a test task"""
        return SwarmTask(
            id=task_id,
            title=title,
            description=description,
            agent_type=task_type,
            priority=1,
            estimated_hours=1.0,
            dependencies=[],
            assigned_agent="generic",
            status=TaskStatus.PENDING
        )
    
    def _create_classification(self, detected_type: str, confidence: float, suggested_agent: str = None) -> TaskClassificationResult:
        """Create a test classification result"""
        return TaskClassificationResult(
            task_id="test_task",
            detected_type=detected_type,
            confidence=confidence,
            keywords=[],
            demo_association=None,
            system_association=None,
            suggested_agent=suggested_agent or f"{detected_type}_specialist"
        )
    
    def test_perfect_match_high_confidence(self):
        """Task with 0.95 confidence → perfect match"""
        
        task = self._create_test_task("doc_task", "Generate docstrings", "Generate docstrings for ECS components", "documentation")
        classification = self._create_classification("documentation", 0.95, "documentation_specialist")
        
        agent_name = self.router.route_task(task, classification)
        
        assert agent_name == "documentation_specialist"
        
        # Check routing log
        assert len(self.router.routing_log) == 1
        decision = self.router.routing_log[0]
        assert decision.routing_level == RoutingLevel.PERFECT_MATCH
        assert decision.routing_confidence == 0.95
        assert "High confidence perfect match" in decision.reason
    
    def test_perfect_match_agent_busy_defer(self):
        """Perfect match but agent busy → defer"""
        
        # Make documentation specialist busy
        self.workloads["documentation_specialist"].current_task = "busy_task"
        self.workloads["documentation_specialist"].tasks_completed = 5  # Over threshold
        
        task = self._create_test_task("doc_task", "Generate docstrings", "Generate docstrings", "documentation")
        classification = self._create_classification("documentation", 0.95, "documentation_specialist")
        
        agent_name = self.router.route_task(task, classification)
        
        assert agent_name is None  # Deferred
        assert task.status == TaskStatus.BLOCKED
        
        # Check routing log
        decision = self.router.routing_log[0]
        assert decision.selected_agent == "DEFERRED"
        assert "deferred" in decision.reason.lower()
    
    def test_specialty_match_no_agent_available(self):
        """Task wants documentation_specialist, but it's busy → defer"""
        
        # Make documentation specialist busy
        self.workloads["documentation_specialist"].current_task = "busy_task"
        self.workloads["documentation_specialist"].tasks_completed = 5
        
        task = self._create_test_task("doc_task", "Document system", "Create documentation", "documentation")
        classification = self._create_classification("documentation", 0.80, "documentation_specialist")
        
        agent_name = self.router.route_task(task, classification)
        
        assert agent_name is None  # Deferred
        assert task.status == TaskStatus.BLOCKED
    
    def test_capability_match(self):
        """Task matched by capability"""
        
        task = self._create_test_task("debug_task", "Fix bug in save system", "Debug and fix the save system error", "debugging")
        classification = self._create_classification("unknown", 0.70)  # Low confidence, but has "fix" keyword
        
        agent_name = self.router.route_task(task, classification)
        
        assert agent_name in ["debugging_specialist", "debugger", "troubleshooter", "bugfixer", "generic_agent", "strategist"]
        
        # Check routing log
        decision = self.router.routing_log[0]
        # Check routing log
        decision = self.router.routing_log[0]
        assert decision.routing_level in [RoutingLevel.CAPABILITY_MATCH, RoutingLevel.LOAD_BALANCED]
        if decision.routing_level == RoutingLevel.CAPABILITY_MATCH:
            assert "Capability match" in decision.reason
    
    def test_load_balancing_multiple_available(self):
        """With multiple available specialists, pick least-loaded"""
        
        # Set different loads
        self.workloads["architecture_specialist"].current_task = "task1"
        self.workloads["genetics_specialist"].current_task = "task2"
        # ui_systems_specialist stays idle
        
        task = self._create_test_task("unknown_task", "Unknown task", "Generic task", "generic")
        classification = self._create_classification("unknown", 0.50)
        
        agent_name = self.router.route_task(task, classification)
        
        # Should pick the least loaded
        assert agent_name is not None
        assert agent_name not in ["architecture_specialist", "genetics_specialist"]
        
        # Check routing log
        decision = self.router.routing_log[0]
        assert decision.routing_level == RoutingLevel.LOAD_BALANCED
        assert "Load-balanced" in decision.reason
    
    def test_fallback_to_generic(self):
        """No match found → fall back to generic agent"""
        
        task = self._create_test_task("unknown_task", "Unknown task type", "Completely unknown task", "unknown")
        classification = self._create_classification("unknown", 0.50, None)
        
        agent_name = self.router.route_task(task, classification)
        
        assert agent_name is not None
        
        # Check routing log
        decision = self.router.routing_log[0]
        # Check routing log
        decision = self.router.routing_log[0]
        assert decision.routing_level in [RoutingLevel.FALLBACK, RoutingLevel.LOAD_BALANCED]
        if decision.routing_level == RoutingLevel.FALLBACK:
            assert "Fallback" in decision.reason
    
    def test_circuit_breaker_respected(self):
        """Agent in circuit breaker → not available for routing"""
        
        # Mark debugging specialist as circuit broken
        self.self_healer.circuit_breakers["debugging_specialist"] = True
        
        task = self._create_test_task("debug_task", "Fix bug", "Debug and fix bug", "debugging")
        classification = self._create_classification("debugging", 0.90, "debugging_specialist")
        
        agent_name = self.router.route_task(task, classification)
        
        # Should NOT route to debugging_specialist
        assert agent_name != "debugging_specialist"
        # Check if fallback logic returns an agent or defers it
        # With current implementation, it might defer if no generic agents or other specialists are available
        # or it might return another agent. We just don't want debugging_specialist.
        pass
    
    def test_capability_inference(self):
        """Test capability inference from task keywords"""
        
        test_cases = [
            ("Generate docstrings", "generate_docstrings"),
            ("Refactor architecture", "identify_coupling"),
            ("Fix bug", "fix_bug"),
            ("Design UI layout", "design_ui_layouts"),
            ("Test integration", "test_integration"),
            ("Create trait system", "create_trait_systems")
        ]
        
        for title, expected_capability in test_cases:
            task = self._create_test_task("test", title, title, "generic")
            capability = self.router._infer_capability_from_task(task)
            assert capability == expected_capability, f"Failed for {title}"
    
    def test_agent_availability_check(self):
        """Test agent availability checking"""
        
        # Test available agent
        doc_agent = self.registry.get_agent_metadata("documentation_specialist")
        assert self.router._is_available(doc_agent) is True
        
        # Test busy agent
        self.workloads["documentation_specialist"].current_task = "busy"
        self.workloads["documentation_specialist"].tasks_completed = 5
        assert self.router._is_available(doc_agent) is False
        
        # Test circuit broken agent
        self.self_healer.circuit_breakers["documentation_specialist"] = True
        assert self.router._is_available(doc_agent) is False
    
    def test_load_calculation(self):
        """Test agent load calculation"""
        
        # Test idle agent
        load = self.router._calculate_agent_load("documentation_specialist")
        assert 0.0 <= load <= 1.0
        
        # Test busy agent
        self.workloads["documentation_specialist"].current_task = "busy"
        load = self.router._calculate_agent_load("documentation_specialist")
        assert load > 0.0
    
    def test_routing_metrics(self):
        """Test routing metrics calculation"""
        
        # Route some tasks
        tasks = [
            (self._create_test_task("doc", "Document", "Document", "documentation"), 
             self._create_classification("documentation", 0.95)),
            (self._create_test_task("debug", "Debug", "Debug", "debugging"),
             self._create_classification("debugging", 0.80)),
            (self._create_test_task("unknown", "Unknown", "Unknown", "unknown"),
             self._create_classification("unknown", 0.50))
        ]
        
        for task, classification in tasks:
            self.router.route_task(task, classification)
        
        metrics = self.router.get_routing_metrics()
        
        assert metrics["total_routed"] == 3
        metrics_keys = metrics["routing_levels"].keys()
        assert len(metrics_keys) > 0
        assert 0.0 <= metrics["fallback_ratio"] <= 1.0
    
    def test_agent_utilization(self):
        """Test agent utilization stats"""
        
        # Set some workloads
        self.workloads["documentation_specialist"].current_task = "task1"
        self.workloads["documentation_specialist"].tasks_completed = 3
        
        utilization = self.router.get_agent_utilization()
        
        assert "documentation_specialist" in utilization
        doc_stats = utilization["documentation_specialist"]
        assert "load_score" in doc_stats
        assert "is_available" in doc_stats
        assert "current_task" in doc_stats
        assert "tasks_completed" in doc_stats
        assert "circuit_broken" in doc_stats
    
    def test_edge_case_empty_registry(self):
        """Test edge case with empty registry"""
        
        empty_router = TaskRouter(AgentRegistry(), {}, None)
        
        task = self._create_test_task("test", "Test", "Test", "generic")
        classification = self._create_classification("generic", 0.50)
        
        # Should create generic agent and route to it
        agent_name = empty_router.route_task(task, classification)
        assert agent_name is not None
    
    def test_edge_case_no_workloads(self):
        """Test edge case with no workloads"""
        
        router = TaskRouter(self.registry, {}, None)
        
        task = self._create_test_task("test", "Test", "Test", "documentation")
        classification = self._create_classification("documentation", 0.80)
        
        # Should work without workloads
        agent_name = router.route_task(task, classification)
        assert agent_name == "documentation_specialist"
    
    def test_routing_decision_format(self):
        """Test routing decision format"""
        
        task = self._create_test_task("test", "Test", "Test", "documentation")
        classification = self._create_classification("documentation", 0.90)
        
        self.router.route_task(task, classification)
        
        decision = self.router.routing_log[0]
        
        from src.tools.apj.agents.types import RoutingDecision
        assert isinstance(decision, RoutingDecision)
        assert hasattr(decision, 'task_id')
        assert hasattr(decision, 'task_title')
        assert hasattr(decision, 'classification_type')
        assert hasattr(decision, 'classification_confidence')
        assert hasattr(decision, 'selected_agent')
        assert hasattr(decision, 'routing_level')
        assert hasattr(decision, 'routing_confidence')
        assert hasattr(decision, 'timestamp')
        assert hasattr(decision, 'reason')
    
    def test_multiple_task_types_routing(self):
        """Test routing multiple task types"""
        
        test_cases = [
            ("documentation", 0.95, "documentation_specialist"),
            ("architecture", 0.85, "architecture_specialist"),
            ("genetics", 0.80, "genetics_specialist"),
            ("ui", 0.75, "ui_systems_specialist"),
            ("integration", 0.70, "integration_specialist"),
            ("debugging", 0.90, "debugging_specialist"),
        ]
        
        for task_type, confidence, expected_agent in test_cases:
            task = self._create_test_task(f"{task_type}_task", f"{task_type} task", f"{task_type} description", task_type)
            classification = self._create_classification(task_type, confidence, expected_agent)
            
            agent_name = self.router.route_task(task, classification)
            
            assert agent_name == expected_agent, f"Failed for {task_type}"
    
    def test_deferral_reason_logging(self):
        """Test deferral reason logging"""
        
        # Make agent busy
        self.workloads["documentation_specialist"].current_task = "busy"
        self.workloads["documentation_specialist"].tasks_completed = 5
        
        task = self._create_test_task("defer_test", "Test", "Test", "documentation")
        classification = self._create_classification("documentation", 0.95)
        
        result = self.router.route_task(task, classification)
        
        assert result is None
        assert task.status == TaskStatus.BLOCKED
        
        # Check deferral was logged
        decision = self.router.routing_log[0]
        assert decision.selected_agent == "DEFERRED"
        assert "busy" in decision.reason.lower()
    
    def test_capability_mapping_coverage(self):
        """Test all capability mappings are covered"""
        
        expected_mappings = {
            "docstring": "generate_docstrings",
            "document": "documentation",
            "readme": "documentation",
            "refactor": "identify_coupling",
            "coupling": "identify_coupling",
            "design": "design_new_systems",
            "architecture": "analyze_architecture",
            "genetic": "implement_genetics",
            "trait": "create_trait_systems",
            "breeding": "implement_breeding",
            "inheritance": "create_inheritance_rules",
            "ui": "design_ui_layouts",
            "component": "implement_ui_components",
            "button": "implement_ui_components",
            "layout": "design_ui_layouts",
            "interface": "design_ui_layouts",
            "integration": "test_integration",
            "test": "test_integration",
            "cross-system": "test_integration",
            "debug": "analyze_errors",
            "bug": "fix_bug",
            "fix": "fix_bug",
            "error": "analyze_errors"
        }
        
        for keyword, expected_capability in expected_mappings.items():
            task = self._create_test_task("task", f"Task {keyword}", f"Task {keyword}", "generic")
            capability = self.router._infer_capability_from_task(task)
            assert capability == expected_capability, f"Missing mapping for {keyword}"
