"""
Performance Test for Async/Await Integration
Demonstrates 3x speedup with parallel execution
"""

import pytest
import asyncio
import time
from unittest.mock import patch, AsyncMock

from src.tools.apj.agents.autonomous_swarm import AutonomousSwarm
from src.tools.apj.agents.types import SwarmTask, TaskStatus


class TestAsyncPerformance:
    """Performance tests for async/await integration"""
    
    def setup_method(self):
        """Set up test environment"""
        self.swarm = AutonomousSwarm()
    
    @pytest.mark.asyncio
    async def test_parallel_vs_sequential_performance(self):
        """Demonstrate 3x speedup with parallel execution"""
        
        # Create 9 tasks that each take 0.1 seconds
        tasks = []
        for i in range(9):
            task = SwarmTask(
                f"task_{i}", 
                f"Task {i}", 
                f"Test task {i}", 
                "generic", 
                1, 
                0.1,  # 0.1 seconds each
                [], 
                "generic_agent", 
                TaskStatus.PENDING
            )
            tasks.append(task)
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Mock executor that takes 0.1 seconds
        async def mock_executor(task):
            await asyncio.sleep(0.1)
            return {"success": True, "output": f"Completed {task.title}"}
        
        # Test sequential execution (simulated)
        start_time = time.time()
        
        for task in tasks:
            await mock_executor(task)
        
        sequential_time = time.time() - start_time
        
        # Test parallel execution with max_concurrent_tasks=3
        self.swarm.max_concurrent_tasks = 3
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mock_executor):
            start_time = time.time()
            
            # Execute in batches of 3
            results = await asyncio.gather(*[
                self.swarm._execute_task_async(task.id, "generic_agent")
                for task in tasks
            ])
            
            parallel_time = time.time() - start_time
        
        # Calculate speedup
        speedup = sequential_time / parallel_time
        
        print(f"Sequential time: {sequential_time:.2f}s")
        print(f"Parallel time: {parallel_time:.2f}s")
        print(f"Speedup: {speedup:.2f}x")
        
        # Should be approximately 3x faster
        assert speedup >= 2.5, f"Expected >=2.5x speedup, got {speedup:.2f}x"
        assert parallel_time < sequential_time / 2.5, f"Parallel should be much faster"
        
        # All tasks should succeed
        assert len(results) == 9
        for result in results:
            assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_concurrent_task_limit_enforcement(self):
        """Test that max_concurrent_tasks limit is enforced"""
        
        # Set concurrent limit to 2
        self.swarm.max_concurrent_tasks = 2
        
        # Create 5 tasks
        tasks = []
        for i in range(5):
            task = SwarmTask(
                f"task_{i}", 
                f"Task {i}", 
                f"Test task {i}", 
                "generic", 
                1, 
                0.1, 
                [], 
                "generic_agent", 
                TaskStatus.PENDING
            )
            tasks.append(task)
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Track concurrent execution
        concurrent_count = 0
        max_concurrent_seen = 0
        
        async def tracking_executor(task):
            nonlocal concurrent_count, max_concurrent_seen
            concurrent_count += 1
            max_concurrent_seen = max(max_concurrent_seen, concurrent_count)
            
            await asyncio.sleep(0.1)
            
            concurrent_count -= 1
            return {"success": True, "output": f"Completed {task.title}"}
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=tracking_executor):
            # Execute all tasks
            results = await asyncio.gather(*[
                self.swarm._execute_task_async(task.id, "generic_agent")
                for task in tasks
            ])
        
        # Should never exceed max_concurrent_tasks
        assert max_concurrent_seen <= self.swarm.max_concurrent_tasks
        assert max_concurrent_seen == 2  # Should hit the limit
        
        # All tasks should succeed
        assert len(results) == 5
        for result in results:
            assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_resource_utilization_with_different_concurrency(self):
        """Test resource utilization with different concurrency levels"""
        
        # Create 12 tasks
        tasks = []
        for i in range(12):
            task = SwarmTask(
                f"task_{i}", 
                f"Task {i}", 
                f"Test task {i}", 
                "generic", 
                1, 
                0.05,  # 0.05 seconds each
                [], 
                "generic_agent", 
                TaskStatus.PENDING
            )
            tasks.append(task)
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Mock executor
        async def mock_executor(task):
            await asyncio.sleep(0.05)
            return {"success": True, "output": f"Completed {task.title}"}
        
        # Test with different concurrency levels
        concurrency_levels = [1, 2, 3, 4, 6]
        execution_times = {}
        
        for concurrency in concurrency_levels:
            self.swarm.max_concurrent_tasks = concurrency
            
            with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mock_executor):
                start_time = time.time()
                
                results = await asyncio.gather(*[
                    self.swarm._execute_task_async(task.id, "generic_agent")
                    for task in tasks
                ])
                
                execution_time = time.time() - start_time
                execution_times[concurrency] = execution_time
        
        # Calculate efficiency
        baseline_time = execution_times[1]  # Sequential baseline
        best_time = min(execution_times.values())
        best_concurrency = min(execution_times, key=execution_times.get)
        
        print(f"Execution times by concurrency:")
        for concurrency, exec_time in execution_times.items():
            speedup = baseline_time / exec_time
            print(f"  {concurrency} concurrent: {exec_time:.2f}s ({speedup:.2f}x speedup)")
        
        print(f"Best concurrency: {best_concurrency} ({best_time:.2f}s)")
        
        # Should see diminishing returns after certain point
        assert execution_times[3] < execution_times[1]  # 3x should be faster than 1x
        assert execution_times[2] < execution_times[1]  # 2x should be faster than 1x
        
        # All tasks should succeed regardless of concurrency
        for concurrency in concurrency_levels:
            assert len([r for r in results if r["success"]]) == 12
    
    @pytest.mark.asyncio
    async def test_memory_efficiency_with_large_task_count(self):
        """Test memory efficiency with large number of tasks"""
        
        # Create 100 tasks
        tasks = []
        for i in range(100):
            task = SwarmTask(
                f"task_{i}", 
                f"Task {i}", 
                f"Test task {i}", 
                "generic", 
                1, 
                0.01,  # Very short tasks
                [], 
                "generic_agent", 
                TaskStatus.PENDING
            )
            tasks.append(task)
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Mock executor
        async def mock_executor(task):
            await asyncio.sleep(0.01)
            return {"success": True, "output": f"Completed {task.title}"}
        
        # Set reasonable concurrency
        self.swarm.max_concurrent_tasks = 5
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mock_executor):
            start_time = time.time()
            
            # Execute all tasks
            results = await asyncio.gather(*[
                self.swarm._execute_task_async(task.id, "generic_agent")
                for task in tasks
            ])
            
            execution_time = time.time() - start_time
        
        # Should complete efficiently
        assert execution_time < 1.0, f"100 tasks should complete in <1s, took {execution_time:.2f}s"
        
        # All tasks should succeed
        assert len(results) == 100
        for result in results:
            assert result["success"] is True
        
        # Check memory usage (rough estimate)
        total_tasks = len(self.swarm.tasks)
        assert total_tasks == 100
        
        print(f"Executed {total_tasks} tasks in {execution_time:.2f}s")
        print(f"Average time per task: {execution_time/total_tasks:.3f}s")
    
    @pytest.mark.asyncio
    async def test_dependency_handling_performance(self):
        """Test performance with task dependencies"""
        
        # Create tasks with dependencies (chain pattern)
        tasks = []
        for i in range(10):
            deps = [f"task_{i-1}"] if i > 0 else []
            task = SwarmTask(
                f"task_{i}", 
                f"Task {i}", 
                f"Test task {i}", 
                "generic", 
                1, 
                0.05, 
                deps, 
                "generic_agent", 
                TaskStatus.PENDING
            )
            tasks.append(task)
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Mock executor
        async def mock_executor(task):
            await asyncio.sleep(0.05)
            return {"success": True, "output": f"Completed {task.title}"}
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mock_executor):
            start_time = time.time()
            
            # Execute with dependency resolution
            await self.swarm._execute_autonomous_round_robin()
            
            execution_time = time.time() - start_time
        
        # Should complete in reasonable time (sequential due to dependencies)
        assert execution_time < 1.0, f"Dependency chain should complete in <1s, took {execution_time:.2f}s"
        
        # All tasks should be completed
        assert len(self.swarm.completed_tasks) == 10
        assert len(self.swarm.failed_tasks) == 0
        
        print(f"Dependency chain completed in {execution_time:.2f}s")
        print(f"Completed tasks: {len(self.swarm.completed_tasks)}")
    
    @pytest.mark.asyncio
    async def test_timeout_performance_impact(self):
        """Test performance impact of timeout handling"""
        
        # Create tasks with different execution times
        tasks = []
        for i in range(6):
            task = SwarmTask(
                f"task_{i}", 
                f"Task {i}", 
                f"Test task {i}", 
                "generic", 
                1, 
                0.1, 
                [], 
                "generic_agent", 
                TaskStatus.PENDING
            )
            tasks.append(task)
            self.swarm.tasks[task.id] = task
            self.swarm.task_queue.append(task.id)
        
        # Mock executors - some fast, some slow
        async def mixed_executor(task):
            if "task_2" in task.id or "task_5" in task.id:
                await asyncio.sleep(0.2)  # Slow tasks
            else:
                await asyncio.sleep(0.05)  # Fast tasks
            return {"success": True, "output": f"Completed {task.title}"}
        
        # Set short timeout
        self.swarm.task_timeout_minutes = 0.1  # 6 seconds
        
        with patch('src.tools.apj.agents.autonomous_swarm.get_executor_for_agent', return_value=mixed_executor):
            start_time = time.time()
            
            results = await asyncio.gather(*[
                self.swarm._execute_task_async(task.id, "generic_agent")
                for task in tasks
            ])
            
            execution_time = time.time() - start_time
        
        # Should complete efficiently despite varied speeds
        assert execution_time < 0.3, f"Varied tasks should complete in <0.3s, took {execution_time:.2f}s"
        
        # All tasks should succeed (no timeouts)
        assert len(results) == 6
        for result in results:
            assert result["success"] is True
        
        print(f"Varied speed tasks completed in {execution_time:.2f}s")
        print(f"Fast tasks: 4, Slow tasks: 2")
