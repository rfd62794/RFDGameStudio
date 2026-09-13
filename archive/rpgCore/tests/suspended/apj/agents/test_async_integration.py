"""
Async/Await Integration Tests for AutonomousSwarm
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock
from datetime import datetime

from src.tools.apj.agents.autonomous_swarm import AutonomousSwarm
from src.tools.apj.agents.task_router import TaskRouter, RoutingLevel
from src.tools.apj.agents.agent_registry import AgentRegistry
from src.tools.apj.agents.task_classifier import TaskClassificationResult
from src.tools.apj.agents.types import SwarmTask, TaskStatus, AgentWorkload, SwarmState


class TestAsyncIntegration:
    """Test suite for async/await integration"""
    
    def setup_method(self):
        """Set up test environment"""
        self.swarm = AutonomousSwarm()
        
        # Create test tasks
        self.tasks = {
            "doc_1": SwarmTask("doc_1", "Document system", "Generate docstrings", "documentation", 1, 2.0, [], "documentation_specialist", TaskStatus.PENDING),
            "debug_1": SwarmTask("debug_1", "Fix bug", "Debug and fix error", "debugging", 1, 1.5, [], "debugging_specialist", TaskStatus.PENDING),
            "arch_1": SwarmTask("arch_1", "Design system", "Design architecture", "architecture", 1, 3.0, [], "architecture_specialist", TaskStatus.PENDING),
            "generic_1": SwarmTask("generic_1", "Generic task", "Generic task", "generic", 1, 1.0, [], "generic_agent", TaskStatus.PENDING)
        }
        
        # Add tasks to swarm
        for task_id, task in self.tasks.items():
            self.swarm.tasks[task_id] = task
            self.swarm.task_queue.append(task_id)
    
    @pytest.mark.asyncio
    async def test_async_locks_initialization(self):
        """Test async locks initialization"""
        
        await self.swarm._initialize_async_locks()
        
        assert self.swarm.task_queue_lock is not None
        assert self.swarm.workload_lock is not None
        assert hasattr(self.swarm.task_queue_lock, '__aenter__')
        assert hasattr(self.swarm.workload_lock, '__aenter__')
    
    @pytest.mark.asyncio
    async def test_get_ready_tasks_with_dependencies(self):
        """Test getting ready tasks with dependencies"""
        
        # Create tasks with dependencies
        task1 = SwarmTask("task_1", "Foundation", "Create foundation", "architecture", 1, 1.0, [], "architecture_specialist", TaskStatus.PENDING)
        task2 = SwarmTask("task_2", "Build on foundation", "Build on task 1", "ui", 1, 1.0, ["task_1"], "ui_specialist", TaskStatus.PENDING)
        task3 = SwarmTask("task_3", "Finalize", "Finalize based on tasks 1,2", "documentation", 1, 1.0, ["task_1", "task_2"], "documentation_specialist", TaskStatus.PENDING)
        
        self.swarm.tasks.update({
            "task_1": task1, "task_2": task2, "task_3": task3
        })
        self.swarm.task_queue = ["task_1", "task_2", "task_3"]
        
        # Initially, only task_1 should be ready
        ready = await self.swarm._get_ready_tasks()
        assert len(ready) == 1
        assert ready[0].id == "task_1"
        
        # Complete task_1
        task1.status = TaskStatus.COMPLETED
        task1.completed_at = datetime.now()
        self.swarm.completed_tasks.append("task_1")
        
        # Now task_1 and task_2 should be ready
        ready = await self.swarm._get_ready_tasks()
        assert len(ready) == 2
        ready_ids = [t.id for t in ready]
        assert "task_1" in ready_ids
        assert "task_2" in ready_ids
        assert "task_3" not in ready_ids
        
        # Complete task_2
        task2.status = TaskStatus.COMPLETED
        task2.completed_at = datetime.now()
        self.swarm.completed_tasks.append("task_2")
        
        # All tasks should be ready
        ready = await self.swarm._get_ready_tasks()
        assert len(ready) == 3
        assert all(t.id in ["task_1", "task_2", "task_3"] for t in ready)
    
    @pytest.mark.asyncio
    async def test_get_available_agents(self):
        """Test getting available agents"""
        
        # Make some agents busy
        self.swarm.agent_workloads["documentation_specialist"].current_task = "busy_task"
        self.swarm.agent_workloads["debugging_specialist"].current_task = "busy_task"
        
        # Mock self_healer
        self.swarm.self_healer = Mock()
        self.swarm.self_healer.circuit_breakers = {"architecture_specialist": True}
        
        available = await self.swarm._get_available_agents()
        
        # Should include idle agents not in circuit breaker
        assert "generic_agent" in available
        assert "ui_systems_specialist" in available
        assert "integration_specialist" in available
        assert "genetics_specialist" in available
        
        # Should exclude busy agents
        assert "documentation_specialist" not in available
        assert "debugging_specialist" not in available
        
        # Should exclude circuit-broken agents
        assert "architecture_specialist" not in available
    
    @pytest.mark.asyncio
    async def test_workload_assignment_and_completion(self):
        """Test workload assignment and completion tracking"""
        
        await self.swarm._initialize_async_locks()
        
        # Assign task to agent
        await self.swarm._update_workload_assignment("documentation_specialist", "task_1")
        
        assert self.swarm.agent_workloads["documentation_specialist"].current_task == "task_1"
        
        # Complete task
        await self.swarm._update_workload_completion("documentation_specialist", True, 2.5)
        
        assert self.swarm.agent_workloads["documentation_specialist"].current_task is None
        assert self.swarm.agent_workloads["documentation_specialist"].tasks_completed == 1
        assert self.swarm.agent_workloads["documentation_specialist"].total_work_time == 2.5
        assert self.swarm.agent_workloads["documentation_specialist"].efficiency_score == 1.0
    
    @pytest.mark.asyncio
    async def test_mark_task_complete(self):
        """Test marking tasks as complete or failed"""
        
        task = self.swarm.tasks["doc_1"]
        
        # Mark as complete
        await self.swarm._mark_task_complete("doc_1", True)
        
        assert task.status == TaskStatus.COMPLETED
        assert task.completed_at is not None
        assert "doc_1" in self.swarm.completed_tasks
        assert "doc_1" not in self.swarm.failed_tasks
        
        # Reset for failed test
        task.status = TaskStatus.PENDING
        self.swarm.completed_tasks.remove("doc_1")
        
        # Mark as failed
        await self.swarm._mark_task_complete("doc_1", False)
        
        assert task.status == TaskStatus.FAILED
        assert task.completed_at is not None
        assert "doc_1" in self.swarm.failed_tasks
        assert "doc_1" not in self.swarm.completed_tasks
    
    @pytest.mark.asyncio
    async def test_dependencies_met(self):
        """Test dependency checking logic"""
        
        # Create tasks with dependencies
        task1 = SwarmTask("task_1", "Foundation", "Create foundation", "architecture", 1, 1.0, [], "architecture_specialist", TaskStatus.PENDING)
        task2 = SwarmTask("task_2", "Build on foundation", "Build on task 1", "ui", 1, 1.0, ["task_1"], "ui_specialist", TaskStatus.PENDING)
        task3 = SwarmTask("task_3", "Finalize", "Finalize based on tasks 1,2", "documentation", 1, 1.0, ["task_1", "task_2"], "documentation_specialist", TaskStatus.PENDING)
        task4 = SwarmTask("task_4", "Unknown dependency", "Task with unknown dependency", "generic", 1, 1.0, ["nonexistent"], "generic_agent", TaskStatus.PENDING)
        
        self.swarm.tasks.update({
            "task_1": task1, "task_2": task2, "task_3": task3, "task_4": task4
        })
        
        # Test various dependency scenarios
        assert self.swarm._dependencies_met("task_1") is True  # No dependencies
        assert self.swarm._dependencies_met("task_2") is False  # task_1 not completed
        assert self.swarm._dependencies_met("task_3") is False  # task_1, task_2 not completed
        assert self.swarm._dependencies_met("task_4") is False  # dependency doesn't exist
        
        # Complete task_1
        task1.status = TaskStatus.COMPLETED
        self.swarm.completed_tasks.append("task_1")
        
        assert self.swarm._dependencies_met("task_2") is True  # task_1 completed
        assert self.swarm._dependencies_met("task_3") is False  # task_2 not completed
        assert self.swarm._dependencies_met("task_4") is False  # dependency still doesn't exist
        
        # Complete task_2
        task2.status = TaskStatus.COMPLETED
        self.swarm.completed_tasks.append("task_2")
        
        assert self.swarm._dependencies_met("task_3") is True  # All dependencies completed
        assert self.swarm._dependencies_met("task_4") is False  # dependency still doesn't exist
    
    @pytest.mark.asyncio
    async def test_execute_task_async_success(self):
        """Test async task execution success"""
        
        await self.swarm._initialize_async_locks()
        
        # Mock executor
        mock_executor = AsyncMock()
        mock_executor.return_value = {"success": True, "output": "Task completed"}
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mock_executor):
            result = await self.swarm._execute_task_async("doc_1", "documentation_specialist")
        
        assert result["success"] is True
        assert result["output"] == "Task completed"
        assert "duration" in result
        assert result["duration"] > 0
    
    @pytest.mark.asyncio
    async def test_execute_task_async_timeout(self):
        """Test task execution timeout handling"""
        
        await self.swarm._initialize_async_locks()
        
        # Mock slow executor
        async def slow_executor(task):
            await asyncio.sleep(100)  # Very slow
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=slow_executor):
            result = await self.swarm._execute_task_async("slow_task", "test_agent")
        
        assert result["success"] is False
        assert result["error"] == "Task timeout"
        assert result["duration"] > 0
        assert self.swarm.tasks["slow_task"].status == TaskStatus.FAILED
    
    @pytest.mark.asyncio
    async def test_execute_task_async_failure(self):
        """Test task execution failure handling"""
        
        await self.swarm._initialize_async_locks()
        
        # Mock failing executor
        async def failing_executor(task):
            raise ValueError("Test error")
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=failing_executor):
            result = await self.swarm._execute_task_async("fail_task", "test_agent")
        
        assert result["success"] is False
        assert result["error"] == "Test error"
        assert result["duration"] > 0
        assert self.swarm.tasks["fail_task"].status == TaskStatus.FAILED
    
    @pytest.mark.asyncio
    async def test_generic_task_async_execution(self):
        """Test generic async task execution"""
        
        task = self.swarm.tasks["generic_1"]
        
        result = await self.swarm._execute_generic_task_async(task)
        
        assert result["success"] is True
        assert result["output"] == f"Completed {task.title}"
    
    @pytest.mark.asyncio
    async def test_parallel_execution_3_concurrent(self):
        """Test 3 tasks run concurrently"""
        
        import time
        
        # Create tasks that each take 0.1 seconds
        tasks = [
            SwarmTask("task_1", "Task 1", "Test task 1", "generic", 1, 0.1, [], "generic_agent", TaskStatus.PENDING),
            SwarmTask("task_2", "Task 2", "Test task 2", "generic", 1, 0.1, [], "generic_agent", TaskStatus.PENDING),
            SwarmTask("task_3", "Task 3", "Test task 3", "generic", 1, 0.1, [], "generic_agent", TaskStatus.PENDING)
        ]
        
        # Add tasks to swarm
        for task in tasks:
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Mock executors to simulate 0.1-second work
        async def mock_executor(task):
            await asyncio.sleep(0.1)
            return {"success": True, "output": f"Completed {task.title}"}
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mock_executor):
            start_time = time.time()
            
            # Execute all tasks concurrently
            results = await asyncio.gather(*[
                self.swarm._execute_task_async(task.id, "generic_agent")
                for task in tasks
            ])
            
            elapsed = time.time() - start_time
            
            # Should take ~0.1 seconds (parallel), not 0.3 seconds (sequential)
            assert elapsed < 0.2, f"Expected <0.2s, got {elapsed:.2f}s"
            
            # All should succeed
            assert len(results) == 3
            for result in results:
                assert result["success"] is True

    @pytest.mark.asyncio
    async def test_async_run_entry_point(self):
        """Test main async entry point"""
        
        # Add tasks to swarm
        self.swarm.tasks = {
            "task_1": SwarmTask("task_1", "Test task", "Test task", "generic", 1, 0.1, [], "generic_agent", TaskStatus.PENDING)
        }
        self.swarm.task_queue = ["task_1"]
        
        # Mock execution to avoid real work
        async def mock_execute():
            await asyncio.sleep(0.05)
            self.swarm.state = SwarmState.COMPLETED
            return "completed"
        
        with patch.object(self.swarm, '_execute_autonomous_round_robin', mock_execute):
            await self.swarm.run()
        
        assert self.swarm.state == SwarmState.COMPLETED

    @pytest.mark.asyncio
    async def test_sync_wrapper_backward_compatibility(self):
        """Test synchronous wrapper for backward compatibility"""
        
        # Mock async execution
        async def mock_run():
            await asyncio.sleep(0.1)
            self.swarm.state = SwarmState.COMPLETED
            return "completed"
        
        with patch.object(self.swarm, 'run', mock_run):
            result = self.swarm.run_sync()
            
            assert result == "completed"
            assert self.swarm.state == SwarmState.COMPLETED

    @pytest.mark.asyncio
    async def test_concurrent_queue_modification(self):
        """Test concurrent queue modification safety"""
        
        await self.swarm._initialize_async_locks()
        
        # Add tasks concurrently
        async def add_task(task_id):
            task = SwarmTask(task_id, f"Task {task_id}", f"Test task {task_id}", "generic", 1, 0.1, [], "generic_agent", TaskStatus.PENDING)
            self.swarm.tasks[task_id] = task
            
            async with self.swarm.task_queue_lock:
                self.swarm.task_queue.append(task_id)
        
        # Add multiple tasks concurrently
        tasks = ["task_a", "task_b", "task_c"]
        await asyncio.gather(*[add_task(task_id) for task_id in tasks])
        
        # All tasks should be added
        assert len(self.swarm.tasks) == len(self.tasks) + len(tasks)
        assert len(self.swarm.task_queue) == len(self.swarm.task_queue) + len(tasks)
        assert all(task_id in self.swarm.task_queue for task_id in tasks)

    @pytest.mark.asyncio
    async def test_concurrent_workload_updates(self):
        """Test concurrent workload updates safety"""
        
        await self.swarm._initialize_async_locks()
        
        # Update workloads concurrently
        async def update_workload(agent_name, task_id):
            await self.swarm._update_workload_assignment(agent_name, task_id)
            await asyncio.sleep(0.05)
            await self.swarm._update_workload_completion(agent_name, True, 1.0)
        
        agents = ["documentation_specialist", "debugging_specialist", "architecture_specialist"]
        await asyncio.gather(*[update_workload(agent, f"task_{i}") for i, agent in enumerate(agents)])
        
        # All workloads should be updated
        for agent_name in agents:
            workload = self.swarm.agent_workloads[agent_name]
            assert workload.current_task is None  # Should be completed
            assert workload.tasks_completed == 1
            assert workload.total_work_time == 1.0
            assert workload.efficiency_score == 1.0

    @pytest.mark.asyncio
    async def test_self_healing_integration_async(self):
        """Test self-healing integration with async execution"""
        
        await self.swarm._initialize_async_locks()
        
        # Mock self-healer
        self.swarm.self_healer = Mock()
        self.swarm.self_healer.circuit_breakers = {}
        
        # Mock failing executor
        async def failing_executor(task):
            raise ValueError("Test failure")
        
        # First failure - should trigger recovery attempt
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=failing_executor):
            result = await self.swarm._execute_task_async("fail_task", "test_agent")
        
        assert result["success"] is False
        assert result["error"] == "Test failure"
        
        # Check if self-healer was called
        self.swarm.self_healer.detect_and_recover.assert_called_once()
        assert self.swarm.tasks["fail_task"].status == TaskStatus.FAILED

    @pytest.mark.asyncio
    async def test_learning_system_integration_async(self):
        """Test learning system integration with async execution"""
        
        await self.swarm._initialize_async_locks()
        
        # Mock learning system
        self.swarm.learning_system = Mock()
        
        # Mock successful executor
        async def success_executor(task):
            return {"success": True, "output": "Success"}
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=success_executor):
            result = await self.swarm._execute_task_async("success_task", "test_agent")
        
        # Check if learning system was called for success
        self.swarm.learning_system.record_success.assert_called()
        
        # Mock failing executor
        async def failing_executor(task):
            raise ValueError("Test failure")
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=failing_executor):
            result = await self.swarm._execute_task_async("fail_task", "test_agent")
        
        # Check if learning system was called for failure
        self.swarm.learning_system.record_failure.assert_called()

    @pytest.mark.asyncio
    async def test_monitoring_integration_async(self):
        """Test monitoring integration with async execution"""
        
        await self.swarm._initialize_async_locks()
        
        # Mock monitor
        self.swarm.monitor = Mock()
        
        # Mock executor
        async def mock_executor(task):
            return {"success": True, "output": "Success"}
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mock_executor):
            result = await self.swarm._execute_task_async("test_task", "test_agent")
        
        # Check if monitor was called
        self.swarm.monitor.collect_metrics.assert_called()

    @pytest.mark.asyncio
    async def test_task_timeout_handling(self):
        """Test timeout handling with different timeout values"""
        
        # Test with short timeout
        self.swarm.task_timeout_minutes = 0.1  # 6 seconds
        
        async def slow_executor(task):
            await asyncio.sleep(10)  # 10 seconds, will timeout
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=slow_executor):
            result = await self.swarm._execute_task_async("slow_task", "test_agent")
        
        assert result["success"] is False
        assert result["error"] == "Task timeout"
        assert result["duration"] >= 6.0  # Should be at least timeout duration

    @pytest.mark.asyncio
    async def test_error_propagation_in_async_context(self):
        """Test error propagation in async context"""
        
        await self.swarm._initialize_async_locks()
        
        # Test with various exception types
        error_types = [
            (ValueError, "Value error"),
            (RuntimeError, "Runtime error"),
            (KeyError, "Key error"),
            (AttributeError, "Attribute error")
        ]
        
        for error_class, error_msg in error_types:
            async def failing_executor(task):
                raise error_class(error_msg)
            
            with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=failing_executor):
                result = await self.swarm._execute_task_async(f"error_task_{error_class.__name__}", "test_agent")
                
                assert result["success"] is False
                assert error_msg in result["error"]
                assert result["duration"] > 0

    @pytest.mark.asyncio
    async def test_task_state_transitions(self):
        """Test task state transitions during async execution"""
        
        task = self.swarm.tasks["doc_1"]
        
        # Initial state
        assert task.status == TaskStatus.PENDING
        
        await self.swarm._initialize_async_locks()
        
        # Mock successful executor
        async def success_executor(task):
            return {"success": True, "output": "Success"}
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=success_executor):
            result = await self.swarm._execute_task_async("doc_1", "documentation_specialist")
        
        # Should be marked as completed
        assert task.status == TaskStatus.COMPLETED
        assert task.completed_at is not None
        assert "doc_1" in self.swarm.completed_tasks
        assert "doc_1" not in self.swarm.failed_tasks
