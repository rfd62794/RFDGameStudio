"""
Integration tests for TaskRouter with AutonomousSwarm
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

from src.tools.apj.agents.task_router import TaskRouter, RoutingLevel
from src.tools.apj.agents.agent_registry import AgentRegistry
from src.tools.apj.agents.task_classifier import TaskClassificationResult
from src.tools.apj.agents.autonomous_swarm import AutonomousSwarm
from src.tools.apj.agents.types import SwarmTask, TaskStatus, AgentWorkload


class TestTaskRouterIntegration:
    """Integration tests for TaskRouter with AutonomousSwarm"""
    
    def setup_method(self):
        """Set up test environment"""
        self.registry = AgentRegistry()
        self.workloads = {}
        self.self_healer = Mock()
        self.self_healer.circuit_breakers = {}
        
        # Register test specialists
        self._register_test_specialists()
        
        # Set up workloads
        self._setup_workloads()
        
        # Create TaskRouter
        self.router = TaskRouter(self.registry, self.workloads, self.self_healer)
        
        # Create AutonomousSwarm
        self.swarm = AutonomousSwarm()
    
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
    
    @pytest.mark.asyncio
    async def test_50_task_mixed_routing(self):
        """Route 50 tasks of different types → verify distribution"""
        
        # Create 50-task test set
        task_types = {
            "documentation": 10,
            "architecture": 8,
            "genetics": 8,
            "ui": 8,
            "integration": 8,
            "debugging": 8,
            "generic": 6
        }
        
        tasks = []
        classifications = []
        task_id_counter = 0
        
        for task_type, count in task_types.items():
            for i in range(count):
                task_id = f"task_{task_id_counter}"
                task = self._create_test_task(
                    task_id, 
                    f"{task_type.title()} Task {i}",
                    f"Test {task_type} task number {i}",
                    task_type
                )
                
                confidence = 0.95 if task_type != "generic" else 0.50
                classification = self._create_classification(task_type, confidence)
                
                tasks.append(task)
                classifications.append(classification)
                task_id_counter += 1
        
        # Route all tasks
        routing_results = {}
        for task, classification in zip(tasks, classifications):
            agent_name = self.router.route_task(task, classification)
            if agent_name:
                routing_results[agent_name] = routing_results.get(agent_name, 0) + 1
        
        # Verify distribution
        assert len(routing_results) >= 6  # Should route to multiple agents
        
        # Check that specialists got most tasks
        specialist_tasks = sum(count for agent, count in routing_results.items() 
                            if "specialist" in agent and agent != "generic_agent")
        total_tasks = sum(routing_results.values())
        
        specialist_ratio = specialist_tasks / total_tasks if total_tasks > 0 else 0
        assert specialist_ratio >= 0.8, f"Specialist ratio {specialist_ratio:.2f} < 0.8"
        
        # Check routing metrics
        metrics = self.router.get_routing_metrics()
        assert metrics["total_routed"] == len(tasks)
        assert metrics["specialist_ratio"] >= 0.8
        assert metrics["fallback_ratio"] <= 0.2
    
    @pytest.mark.asyncio
    async def test_parallel_execution_3_concurrent(self):
        """3 tasks executing in parallel"""
        
        # Create 3 independent tasks
        tasks = [
            self._create_test_task("doc_1", "Document system", "Generate docstrings", "documentation"),
            self._create_test_task("debug_1", "Fix bug", "Debug and fix error", "debugging"),
            self._create_test_task("arch_1", "Design system", "Design architecture", "architecture")
        ]
        
        # Classify tasks
        classifications = [
            self._create_classification("documentation", 0.95),
            self._create_classification("debugging", 0.90),
            self._create_classification("architecture", 0.85)
        ]
        
        # Route tasks
        assignments = []
        for task, classification in zip(tasks, classifications):
            agent_name = self.router.route_task(task, classification)
            if agent_name:
                assignments.append((task.id, agent_name))
        
        # Should route to 3 different agents
        assert len(assignments) == 3
        assigned_agents = [agent for _, agent in assignments]
        assert len(set(assigned_agents)) == 3  # All different
        
        # Verify all are specialists
        for agent_name in assigned_agents:
            assert "specialist" in agent_name
    
    @pytest.mark.asyncio
    async def test_dependency_ordering(self):
        """Tasks with dependencies execute in order"""
        
        # Create tasks with dependencies
        task1 = self._create_test_task("task_1", "Foundation", "Create foundation", "architecture")
        task2 = self._create_test_task("task_2", "Build on foundation", "Build on task 1", "ui")
        task3 = self._create_test_task("task_3", "Finalize", "Finalize based on tasks 1,2", "documentation")
        
        # Set dependencies
        task2.dependencies = ["task_1"]
        task3.dependencies = ["task_1", "task_2"]
        
        # Add to swarm
        self.swarm.tasks = {
            "task_1": task1,
            "task_2": task2,
            "task_3": task3
        }
        
        # Test dependency checking
        assert self.swarm._can_execute("task_1") is True  # No dependencies
        assert self.swarm._can_execute("task_2") is False  # task_1 not completed
        assert self.swarm._can_execute("task_3") is False  # task_1, task_2 not completed
        
        # Complete task_1
        task1.status = TaskStatus.COMPLETED
        self.swarm.completed_tasks.append("task_1")
        
        # Re-check dependencies
        assert self.swarm._can_execute("task_2") is True  # task_1 completed
        assert self.swarm._can_execute("task_3") is False  # task_2 not completed
    
    def test_circuit_breaker_integration(self):
        """Test circuit breaker integration with routing"""
        
        # Mark debugging specialist as circuit broken
        self.self_healer.circuit_breakers["debugging_specialist"] = True
        
        # Create debugging task
        task = self._create_test_task("debug_task", "Fix bug", "Debug and fix bug", "debugging")
        classification = self._create_classification("debugging", 0.95, "debugging_specialist")
        
        # Route task
        agent_name = self.router.route_task(task, classification)
        
        # Should NOT route to debugging_specialist
        assert agent_name != "debugging_specialist"
        # Should fall back to another agent or defer
        assert agent_name is None or agent_name == "generic_agent" or "specialist" in agent_name
    
    def test_load_balancing_with_busy_agents(self):
        """Test load balancing when some agents are busy"""
        
        # Make some agents busy
        self.workloads["documentation_specialist"].current_task = "busy"
        self.workloads["documentation_specialist"].tasks_completed = 5
        self.workloads["architecture_specialist"].current_task = "busy"
        self.workloads["architecture_specialist"].tasks_completed = 3
        
        # Create generic task (will use load balancing)
        task = self._create_test_task("generic_task", "Generic task", "Generic task", "generic")
        classification = self._create_classification("generic", 0.50)
        
        # Route task
        agent_name = self.router.route_task(task, classification)
        
        # Should route to least loaded agent (not documentation or architecture)
        assert agent_name not in ["documentation_specialist", "architecture_specialist"]
        assert agent_name is not None
    
    def test_deferral_and_retry_mechanism(self):
        """Test task deferral when preferred agent is busy"""
        
        # Make documentation specialist busy
        self.workloads["documentation_specialist"].current_task = "busy"
        self.workloads["documentation_specialist"].tasks_completed = 5
        
        # Create documentation task with high confidence
        task = self._create_test_task("doc_task", "Document system", "Generate docstrings", "documentation")
        classification = self._create_classification("documentation", 0.95, "documentation_specialist")
        
        # Route task
        agent_name = self.router.route_task(task, classification)
        
        # Should be deferred (None returned)
        assert agent_name is None
        assert task.status == TaskStatus.BLOCKED
        
        # Check routing log
        decision = self.router.routing_log[0]
        assert decision.selected_agent == "DEFERRED"
        assert "busy" in decision.reason.lower()
    
    def test_routing_metrics_accuracy(self):
        """Test routing metrics accuracy"""
        
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
        
        # Verify metrics
        assert metrics["total_routed"] == 3
        assert "perfect_match" in metrics["routing_levels"]
        assert "specialty_match" in metrics["routing_levels"]
        assert "load_balanced" in metrics["routing_levels"]
        assert 0.0 <= metrics["specialist_ratio"] <= 1.0
        assert 0.0 <= metrics["fallback_ratio"] <= 1.0
        assert len(metrics["recent_decisions"]) <= 10
    
    def test_agent_utilization_tracking(self):
        """Test agent utilization tracking"""
        
        # Set some workloads
        self.workloads["documentation_specialist"].current_task = "task1"
        self.workloads["documentation_specialist"].tasks_completed = 3
        self.workloads["debugging_specialist"].tasks_completed = 1
        
        # Mark agent as circuit broken
        self.self_healer.circuit_breakers["debugging_specialist"] = True
        
        utilization = self.router.get_agent_utilization()
        
        # Check documentation specialist
        doc_stats = utilization["documentation_specialist"]
        assert doc_stats["load_score"] > 0.0
        assert doc_stats["current_task"] == "task1"
        assert doc_stats["tasks_completed"] == 3
        assert doc_stats["circuit_broken"] is False
        
        # Check debugging specialist
        debug_stats = utilization["debugging_specialist"]
        assert debug_stats["circuit_broken"] is True
    
    @pytest.mark.asyncio
    async def test_autonomous_swarm_integration(self):
        """Test integration with AutonomousSwarm"""
        
        # Create test tasks
        tasks = [
            self._create_test_task("doc_1", "Document system", "Generate docstrings", "documentation"),
            self._create_test_task("debug_1", "Fix bug", "Debug and fix error", "debugging"),
        ]
        
        # Add tasks to swarm
        for task in tasks:
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Test task queue building
        await self.swarm._build_task_queue()
        
        # Verify tasks are classified
        for task in tasks:
            assert hasattr(task, 'classification')
            assert task.classification is not None
            assert task.agent_type != "generic" or task.classification.detected_type == "generic"
    
    def test_edge_case_all_agents_busy(self):
        """Test edge case: all agents busy"""
        
        # Make all agents busy
        for agent_name in self.workloads:
            self.workloads[agent_name].current_task = "busy"
            self.workloads[agent_name].tasks_completed = 5
        
        # Create task
        task = self._create_test_task("busy_test", "Test task", "Test task", "generic")
        classification = self._create_classification("generic", 0.50)
        
        # Route task
        agent_name = self.router.route_task(task, classification)
        
        # Should return None because all agents are busy and no generic agent exists
        assert agent_name is None
    
    def test_edge_case_no_workloads(self):
        """Test edge case: no workloads provided"""
        
        # Create router without workloads
        router = TaskRouter(self.registry, {}, self.self_healer)
        
        # Create task
        task = self._create_test_task("test", "Test", "Test", "documentation")
        classification = self._create_classification("documentation", 0.80)
        
        # Should still route successfully
        agent_name = router.route_task(task, classification)
        assert agent_name == "documentation_specialist"
