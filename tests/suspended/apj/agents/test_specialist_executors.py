"""
Tests for Specialist Executors
"""

import pytest
import asyncio
from src.tools.apj.agents.specialist_executors import (
    execute_documentation_task, execute_architecture_task, execute_genetics_task,
    execute_ui_task, execute_integration_task, execute_debugging_task,
    get_executor_for_agent, TaskResult
)
from src.tools.apj.agents.autonomous_swarm import SwarmTask, TaskStatus


class TestSpecialistExecutors:
    """Test suite for specialist executors"""
    
    def setup_method(self):
        """Set up test task"""
        self.test_task = SwarmTask(
            id="test_task_1",
            title="Test Task",
            description="Test task description",
            agent_type="generic",
            priority=1,
            estimated_hours=1.0,
            dependencies=[],
            assigned_agent="test_agent",
            status=TaskStatus.PENDING
        )
    
    @pytest.mark.asyncio
    async def test_documentation_task_with_sample_python_file(self):
        """Test documentation_task with sample Python file"""
        
        task = SwarmTask(
            id="doc_task_1",
            title="Generate docstrings for ECS components",
            description="Generate docstrings for src/dgt_core/ecs/component.py and src/dgt_core/ecs/system.py",
            agent_type="documentation",
            priority=1,
            estimated_hours=2.0,
            dependencies=[],
            assigned_agent="documentation_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_documentation_task(task)
        
        assert result.success is True
        assert result.agent_name == "documentation_specialist"
        assert result.task_id == "doc_task_1"
        assert result.duration > 0
        assert "docstrings generated" in result.output.lower()
        assert result.files_analyzed is not None
        assert result.work_items is not None
        assert len(result.work_items) > 0
    
    @pytest.mark.asyncio
    async def test_documentation_task_with_readme(self):
        """Test documentation_task with readme keyword"""
        
        task = SwarmTask(
            id="doc_task_2",
            title="Update README with installation guide",
            description="Update README.md with detailed installation instructions",
            agent_type="documentation",
            priority=1,
            estimated_hours=1.5,
            dependencies=[],
            assigned_agent="documentation_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_documentation_task(task)
        
        assert result.success is True
        assert "README.md" in result.files_analyzed
        assert "documentation" in result.output.lower()
    
    @pytest.mark.asyncio
    async def test_architecture_task_with_multi_file_imports(self):
        """Test architecture_task with multi-file imports"""
        
        task = SwarmTask(
            id="arch_task_1",
            title="Analyze ECS system coupling",
            description="Analyze imports and dependencies in ecs/entity.py, ecs/component.py, ecs/system.py",
            agent_type="architecture",
            priority=1,
            estimated_hours=3.0,
            dependencies=[],
            assigned_agent="architecture_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_architecture_task(task)
        
        assert result.success is True
        assert result.agent_name == "architecture_specialist"
        assert result.duration > 0
        assert "coupling" in result.output.lower() or "suggestions" in result.output.lower()
        assert len(result.files_analyzed) >= 2
        assert len(result.work_items) > 0
    
    @pytest.mark.asyncio
    async def test_genetics_task_with_breed_trait_keywords(self):
        """Test genetics_task with breed/trait keywords"""
        
        task = SwarmTask(
            id="gen_task_1",
            title="Implement trait inheritance system",
            description="Create trait system for slime breeding and inheritance patterns",
            agent_type="genetics",
            priority=1,
            estimated_hours=4.0,
            dependencies=[],
            assigned_agent="genetics_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_genetics_task(task)
        
        assert result.success is True
        assert result.agent_name == "genetics_specialist"
        assert result.duration > 0
        assert "trait" in result.output.lower() or "genetics" in result.output.lower()
        assert len(result.work_items) > 0
    
    @pytest.mark.asyncio
    async def test_ui_task_with_ui_keywords(self):
        """Test ui_task with UI keywords"""
        
        task = SwarmTask(
            id="ui_task_1",
            title="Create inventory UI component",
            description="Design and implement inventory user interface with button components",
            agent_type="ui",
            priority=1,
            estimated_hours=2.5,
            dependencies=[],
            assigned_agent="ui_systems_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_ui_task(task)
        
        assert result.success is True
        assert result.agent_name == "ui_systems_specialist"
        assert result.duration > 0
        assert "component" in result.output.lower() or "ui" in result.output.lower()
        assert len(result.work_items) > 0
    
    @pytest.mark.asyncio
    async def test_integration_task_with_cross_system_files(self):
        """Test integration_task with cross-system files"""
        
        task = SwarmTask(
            id="int_task_1",
            title="Test ECS-genetics integration",
            description="Run integration tests for ecs/genetics_integration.py and genetics/ecs_bridge.py",
            agent_type="integration",
            priority=1,
            estimated_hours=2.0,
            dependencies=[],
            assigned_agent="integration_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_integration_task(task)
        
        assert result.success is True
        assert result.agent_name == "integration_specialist"
        assert result.duration > 0
        assert "integration" in result.output.lower() or "test" in result.output.lower()
        assert len(result.work_items) > 0
    
    @pytest.mark.asyncio
    async def test_debugging_task_with_error_patterns(self):
        """Test debugging_task with error patterns"""
        
        task = SwarmTask(
            id="debug_task_1",
            title="Fix entity persistence bug",
            description="Debug and fix the entity persistence error in save_system.py",
            agent_type="debugging",
            priority=1,
            estimated_hours=1.5,
            dependencies=[],
            assigned_agent="debugging_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_debugging_task(task)
        
        assert result.success is True
        assert result.agent_name == "debugging_specialist"
        assert result.duration > 0
        assert "bug" in result.output.lower() or "debug" in result.output.lower()
        assert len(result.work_items) > 0
    
    @pytest.mark.asyncio
    async def test_error_handling_file_not_found(self):
        """Test error handling (file not found, etc.)"""
        
        # Create a task that might cause an error
        task = SwarmTask(
            id="error_task",
            title="Test error handling",
            description="",  # Empty description might cause issues
            agent_type="documentation",
            priority=1,
            estimated_hours=1.0,
            dependencies=[],
            assigned_agent="documentation_specialist",
            status=TaskStatus.PENDING
        )
        
        # This should still succeed (graceful handling)
        result = await execute_documentation_task(task)
        
        # Should either succeed or fail gracefully
        assert isinstance(result, TaskResult)
        assert result.task_id == "error_task"
        assert result.agent_name == "documentation_specialist"
        assert result.duration >= 0
    
    @pytest.mark.asyncio
    async def test_async_execution_can_run_concurrently(self):
        """Test async execution (can run concurrently)"""
        
        tasks = [
            SwarmTask(
                id=f"concurrent_task_{i}",
                title=f"Concurrent Task {i}",
                description="Test concurrent execution",
                agent_type="documentation",
                priority=1,
                estimated_hours=1.0,
                dependencies=[],
                assigned_agent="documentation_specialist",
                status=TaskStatus.PENDING
            )
            for i in range(3)
        ]
        
        # Run tasks concurrently
        results = await asyncio.gather(*[
            execute_documentation_task(task) for task in tasks
        ])
        
        assert len(results) == 3
        for i, result in enumerate(results):
            assert result.success is True
            assert result.task_id == f"concurrent_task_{i}"
            assert result.agent_name == "documentation_specialist"
    
    @pytest.mark.asyncio
    async def test_task_result_format(self):
        """Test TaskResult format"""
        
        result = await execute_documentation_task(self.test_task)
        
        assert isinstance(result, TaskResult)
        assert hasattr(result, 'task_id')
        assert hasattr(result, 'agent_name')
        assert hasattr(result, 'success')
        assert hasattr(result, 'duration')
        assert hasattr(result, 'output')
        assert hasattr(result, 'error')
        assert hasattr(result, 'files_analyzed')
        assert hasattr(result, 'work_items')
        
        # Check types
        assert isinstance(result.task_id, str)
        assert isinstance(result.agent_name, str)
        assert isinstance(result.success, bool)
        assert isinstance(result.duration, float)
        assert isinstance(result.output, (str, type(None)))
        assert isinstance(result.error, (str, type(None)))
        assert isinstance(result.files_analyzed, (list, type(None)))
        assert isinstance(result.work_items, (list, type(None)))
    
    @pytest.mark.asyncio
    async def test_edge_cases_empty_task_description(self):
        """Test edge cases: empty task description"""
        
        task = SwarmTask(
            id="empty_desc_task",
            title="Empty Description Task",
            description="",  # Empty description
            agent_type="documentation",
            priority=1,
            estimated_hours=1.0,
            dependencies=[],
            assigned_agent="documentation_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_documentation_task(task)
        
        # Should handle gracefully
        assert isinstance(result, TaskResult)
        assert result.task_id == "empty_desc_task"
    
    @pytest.mark.asyncio
    async def test_edge_cases_missing_file_references(self):
        """Test edge cases: missing file references"""
        
        task = SwarmTask(
            id="no_files_task",
            title="No Files Task",
            description="Generic task without specific file references",
            agent_type="architecture",
            priority=1,
            estimated_hours=1.0,
            dependencies=[],
            assigned_agent="architecture_specialist",
            status=TaskStatus.PENDING
        )
        
        result = await execute_architecture_task(task)
        
        # Should handle gracefully with generic work
        assert result.success is True
        assert result.output is not None
        assert len(result.output) > 0
    
    def test_get_executor_for_agent(self):
        """Test get_executor_for_agent function"""
        
        # Test known agents
        doc_executor = get_executor_for_agent("documentation_specialist")
        assert doc_executor is not None
        assert doc_executor == execute_documentation_task
        
        arch_executor = get_executor_for_agent("architecture_specialist")
        assert arch_executor is not None
        assert arch_executor == execute_architecture_task
        
        genetics_executor = get_executor_for_agent("genetics_specialist")
        assert genetics_executor is not None
        assert genetics_executor == execute_genetics_task
        
        ui_executor = get_executor_for_agent("ui_systems_specialist")
        assert ui_executor is not None
        assert ui_executor == execute_ui_task
        
        integration_executor = get_executor_for_agent("integration_specialist")
        assert integration_executor is not None
        assert integration_executor == execute_integration_task
        
        debug_executor = get_executor_for_agent("debugging_specialist")
        assert debug_executor is not None
        assert debug_executor == execute_debugging_task
        
        # Test unknown agent
        unknown_executor = get_executor_for_agent("unknown_agent")
        assert unknown_executor is None
    
    @pytest.mark.asyncio
    async def test_realistic_delays_simulation(self):
        """Test realistic delays: await asyncio.sleep(random.uniform(0.1, 0.5))"""
        
        import time
        
        start_time = time.time()
        
        result = await execute_documentation_task(self.test_task)
        
        end_time = time.time()
        actual_duration = end_time - start_time
        
        # Should take some time (not be instantaneous)
        assert actual_duration >= 0.1  # At least 0.1 second
        assert actual_duration <= 2.0  # But not too long
        
        # Duration in result should be close to actual
        assert abs(result.duration - actual_duration) < 0.5
    
    @pytest.mark.asyncio
    async def test_all_executor_functions_return_correct_format(self):
        """Test all executor functions return TaskResult format"""
        
        executors = [
            (execute_documentation_task, "documentation_specialist"),
            (execute_architecture_task, "architecture_specialist"),
            (execute_genetics_task, "genetics_specialist"),
            (execute_ui_task, "ui_systems_specialist"),
            (execute_integration_task, "integration_specialist"),
            (execute_debugging_task, "debugging_specialist"),
        ]
        
        for executor, expected_agent in executors:
            task = SwarmTask(
                id=f"test_{expected_agent}",
                title=f"Test {expected_agent}",
                description=f"Test task for {expected_agent}",
                agent_type=expected_agent.replace("_specialist", ""),
                priority=1,
                estimated_hours=1.0,
                dependencies=[],
                assigned_agent=expected_agent,
                status=TaskStatus.PENDING
            )
            
            result = await executor(task)
            
            assert isinstance(result, TaskResult)
            assert result.success is True
            assert result.agent_name == expected_agent
            assert result.duration > 0
            assert result.output is not None
            assert len(result.output) > 0
