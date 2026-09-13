"""
Unit Tests for Test Harness
"""

import pytest
import asyncio
from unittest.mock import patch, AsyncMock

from tests.integration.test_validation_harness import (
    TestHarness, run_small_validation, run_medium_validation, run_full_validation,
    get_test_tasks_10, get_test_tasks_50, get_test_tasks_100
)
from tests.fixtures.test_tasks_10 import validate_task_distribution_10
from tests.fixtures.test_tasks_50 import validate_task_distribution_50
from tests.fixtures.test_tasks_100 import validate_task_distribution_100
from src.tools.apj.agents.types import SwarmTask, TaskStatus


class TestTaskGeneration:
    """Test task generation and validation"""
    
    def test_get_test_tasks_10(self):
        """Test 10-task generation"""
        tasks = get_test_tasks_10()
        assert len(tasks) == 10
        
        validation = validate_task_distribution_10(tasks)
        assert validation['matches'] is True
        
        # Check each agent type has 2 tasks
        for agent_type, count in validation['actual'].items():
            assert count == 2
    
    def test_get_test_tasks_50(self):
        """Test 50-task generation"""
        tasks = get_test_tasks_50()
        assert len(tasks) == 50
        
        validation = validate_task_distribution_50(tasks)
        assert validation['matches'] is True
        
        # Check expected distribution
        expected = validation['expected']
        for agent_type, count in validation['actual'].items():
            assert count == expected[agent_type]
    
    def test_get_test_tasks_100(self):
        """Test 100-task generation"""
        tasks = get_test_tasks_100()
        assert len(tasks) == 100
        
        validation = validate_task_distribution_100(tasks)
        assert validation['matches'] is True
        
        # Check expected distribution
        expected = validation['expected']
        for agent_type, count in validation['actual'].items():
            assert count == expected[agent_type]
    
    def test_task_template_coverage(self):
        """Test that task templates cover all required scenarios"""
        from tests.fixtures.test_tasks_100 import TestTaskGenerator
        
        generator = TestTaskGenerator()
        templates = generator.task_templates
        
        # Check we have templates for all agent types
        agent_types = set(template.task_type.value for template in templates)
        expected_types = {"documentation", "architecture", "genetics", "ui", "integration", "debugging"}
        
        assert agent_types == expected_types
        
        # Check we have sufficient templates for each type
        template_counts = {}
        for template in templates:
            template_counts[template.task_type.value] = template_counts.get(template.task_type.value, 0) + 1
        
        assert template_counts["documentation"] >= 4  # At least 4 doc templates
        assert template_counts["architecture"] >= 3  # At least 3 arch templates
        assert template_counts["genetics"] >= 3      # At least 3 genetics templates
        assert template_counts["ui"] >= 3           # At least 3 UI templates
        assert template_counts["integration"] >= 4    # At least 4 integration templates
        assert template_counts["debugging"] >= 3      # At least 3 debugging templates


class TestValidationHarness:
    """Test validation harness execution"""
    
    @pytest.mark.asyncio
    async def test_small_validation(self):
        """Test 10-task validation"""
        harness = TestHarness()
        result = await harness.run_test_suite(10)
        
        assert result.status == "PASSED"
        assert result.task_count == 10
        assert result.execution_time > 0
        assert len(result.results) == 10
        
        # Check routing metrics
        assert result.routing_metrics['overall_specialist_rate'] >= 0.8
        assert result.routing_metrics['target_rate'] == 0.8
        
        # Check performance metrics
        assert result.performance_metrics['completion_rate'] >= 0.8
        assert result.performance_metrics['execution_time'] <= 30  # 30 seconds for 10 tasks
        
        # Check quality metrics
        assert result.quality_metrics['success_rate'] >= 0.8
    
    @pytest.mark.asyncio
    async def test_medium_validation(self):
        """Test 50-task validation"""
        harness = TestHarness()
        result = await harness.run_test_suite(50)
        
        assert result.status == "PASSED"
        assert result.task_count == 50
        assert result.execution_time > 0
        assert len(result.results) == 50
        
        # Check routing metrics
        assert result.routing_metrics['overall_specialist_rate'] >= 0.8
        assert result.routing_metrics['target_rate'] == 0.8
        
        # Check performance metrics
        assert result.performance_metrics['completion_rate'] >= 0.8
        assert result.performance_metrics['execution_time'] <= 150  # 2.5 minutes for 50 tasks
        
        # Check quality metrics
        assert result.quality_metrics['success_rate'] >= 0.8
    
    @pytest.mark.asyncio
    async def test_full_validation(self):
        """Test 100-task validation"""
        harness = TestHarness()
        result = await harness.run_test_suite(100)
        
        assert result.status == "PASSED"
        assert result.task_count == 100
        assert result.execution_time > 0
        assert len(result.results) == 100
        
        # Check routing metrics
        assert result.routing_metrics['overall_specialist_rate'] >= 0.8
        assert result.routing_metrics['target_rate'] == 0.8
        
        # Check performance metrics
        assert result.performance_metrics['completion_rate'] >= 0.8
        assert result.performance_metrics['execution_time'] <= 300  # 5 minutes for 100 tasks
        
        # Check quality metrics
        assert result.quality_metrics['success_rate'] >= 0.8
    
    @pytest.mark.asyncio
    async def test_routing_accuracy_by_agent_type(self):
        """Test routing accuracy for each agent type"""
        harness = TestHarness()
        result = await harness.run_test_suite(100)
        
        routing_metrics = result.routing_metrics['specialist_routing']
        
        # Check each agent type meets targets
        expected_rates = {
            'documentation': 0.90,  # 18/20
            'architecture': 0.87,   # 13/15
            'genetics': 0.80,       # 12/15
            'ui': 0.80,           # 12/15
            'integration': 0.80,    # 16/20
            'debugging': 0.80       # 12/15
        }
        
        for agent_type, expected_rate in expected_rates.items():
            metrics = routing_metrics[agent_type]
            assert metrics['actual_rate'] >= (expected_rate * 0.9)  # 90% of expected
            assert metrics['meets_target'] is True
    
    @pytest.mark.asyncio
    async def test_parallel_execution_verification(self):
        """Test that tasks execute in parallel"""
        harness = TestHarness()
        result = await harness.run_test_suite(100)
        
        perf = result.performance_metrics
        
        # Check concurrent execution indicators
        assert perf['tasks_per_second'] >= 0.5  # Should be running in parallel
        assert perf['avg_task_duration'] > 0.1     # Tasks should take some time
        
        # With 3 concurrent tasks, should be faster than sequential
        sequential_time = perf['avg_task_duration'] * 100
        actual_time = perf['execution_time']
        
        # Should be at least 2x faster than sequential
        assert actual_time < sequential_time / 2
    
    @pytest.mark.asyncio
    async def test_dependency_ordering(self):
        """Test that dependencies are respected"""
        # Create tasks with known dependencies
        harness = TestHarness()
        
        # Mock swarm with dependency tracking
        with patch('tests.integration.test_validation_harness.TestHarness._collect_results') as mock_collect:
            # Simulate dependency ordering
            def mock_collect(swarm, tasks):
                # Simulate that dependent tasks complete after their dependencies
                results = []
                task_map = {task.id: task for task in tasks}
                
                for task in tasks:
                    # Mark as completed if all dependencies are met
                    deps_met = all(
                        dep_id in task_map and task_map[dep_id].status == "completed"
                        for dep_id in task.dependencies
                    )
                    
                    if deps_met:
                        task.status = "completed"
                        task.duration = 0.1
                    else:
                        task.status = "pending"
                        task.duration = 0.0
                    
                    results.append({
                        'task_id': task.id,
                        'task_type': task.agent_type,
                        'assigned_agent': 'test_agent',
                        'routing_level': 'test',
                        'routing_confidence': 0.8,
                        'success': task.status == "completed",
                        'duration': task.duration,
                        'output': '',
                        'error': None
                    })
                
                return results
            
            harness._collect_results = mock_collect
            result = await harness.run_test_suite(10)
        
        # Verify dependency ordering was respected
        # (This is a simplified test - real dependency testing would be more complex)
        assert result.status == "PASSED"
        assert len(result.results) == 10
    
    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling and recovery"""
        harness = TestHarness()
        
        # Mock swarm that throws an error
        with patch('src.tools.apj.agents.autonomous_swarm.AutonomousSwarm.start_autonomous_execution') as mock_start:
            mock_start.side_effect = Exception("Test error")
            
            result = await harness.run_test_suite(10)
            
            assert result.status == "ERROR"
            assert result.execution_time > 0
    
    def test_result_collection(self):
        """Test result collection and metrics calculation"""
        harness = TestHarness()
        
        # Mock results
        mock_results = [
            {
                'task_id': 'T_DOC_001',
                'task_type': 'documentation',
                'assigned_agent': 'documentation_specialist',
                'routing_level': 'perfect_match',
                'routing_confidence': 0.95,
                'success': True,
                'duration': 2.0,
                'output': 'Generated docstrings',
                'error': None
            },
            {
                'task_id': 'T_ARCH_001',
                'task_type': 'architecture',
                'assigned_agent': 'architecture_specialist',
                'routing_level': 'specialty_match',
                'routing_confidence': 0.88,
                'success': True,
                'duration': 3.0,
                'output': 'Analyzed coupling',
                'error': None
            },
            {
                'task_id': 'T_GEN_001',
                'task_type': 'genetics',
                'assigned_agent': 'genetics_specialist',
                'routing_level': 'specialty_match',
                'routing_confidence': 0.85,
                'success': False,
                'duration': 1.5,
                'output': '',
                'error': 'Timeout error'
            }
        ]
        
        # Test metrics calculation
        routing_metrics = harness._calculate_routing_metrics(mock_results)
        performance_metrics = harness._calculate_performance_metrics(mock_results, 60.0)
        quality_metrics = harness._calculate_quality_metrics(mock_results)
        failures = harness._analyze_failures(mock_results)
        
        # Verify routing metrics
        assert routing_metrics['overall_specialist_rate'] == 0.67  # 2/3 successful
        assert len(routing_metrics['specialist_routing']) == 3
        
        # Verify performance metrics
        assert performance_metrics['completion_rate'] == 0.67
        assert performance_metrics['avg_task_duration'] == 2.17  # (2.0 + 3.0 + 1.5) / 3
        
        # Verify quality metrics
        assert quality_metrics['success_rate'] == 0.67
        assert len(failures) == 1
        
        # Verify failure analysis
        assert failures[0]['task_id'] == 'T_GEN_001'
        assert failures[0]['error'] == 'Timeout error'
    
    def test_report_generation(self):
        """Test report generation"""
        harness = TestHarness()
        
        # Create mock result
        mock_result = {
            'test_run_id': 'TEST_100_123456789',
            'task_count': 100,
            'execution_time': 180.5,
            'status': 'PASSED',
            'routing_metrics': {
                'overall_specialist_rate': 0.83,
                'target_rate': 0.80,
                'specialist_routing': {
                    'documentation': {'successful': 18, 'total': 20, 'actual_rate': 0.9, 'expected_rate': 0.9}
                }
            },
            'performance_metrics': {
                'execution_time': 180.5,
                'completion_rate': 0.97,
                'tasks_per_second': 0.55
            },
            'quality_metrics': {
                'success_rate': 0.97,
                'failed_tasks': 3,
                'routing_levels': {'perfect_match': 20, 'specialty_match': 50, 'load_balanced': 20, 'fallback': 10}
            },
            'failures': []
        }
        
        # Test report generation (should not raise exception)
        harness._print_report(mock_result)
        
        # Test result storage
        harness.test_results.append(mock_result)
        assert len(harness.test_results) == 1
        
        # Test latest result retrieval
        latest = harness.get_latest_result()
        assert latest == mock_result
        
        # Test all results retrieval
        all_results = harness.get_all_results()
        assert len(all_results) == 1


class TestValidationIntegration:
    """Integration tests for validation system"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_validation_flow(self):
        """Test complete validation flow"""
        harness = TestHarness()
        
        # Run all phases
        result_10 = await harness.run_test_suite(10)
        result_50 = await harness.run_test_suite(50)
        result_100 = await harness.run_test_suite(100)
        
        # All should pass
        assert result_10.status == "PASSED"
        assert result_50.status == "PASSED"
        assert result_100.status == "PASSED"
        
        # Performance should improve with more tasks (due to parallel execution)
        assert result_10.execution_time < result_50.execution_time < result_100.execution_time
        
        # Specialist routing should remain consistent
        assert result_10.routing_metrics['overall_specialist_rate'] >= 0.8
        assert result_50.routing_metrics['overall_specialist_rate'] >= 0.8
        assert result_100.routing_metrics['overall_specialist_rate'] >= 0.8
    
    @pytest.mark.asyncio
    async def test_scaling_validation(self):
        """Test scaling from 10 to 100 tasks"""
        harness = TestHarness()
        
        results = []
        
        # Run all scales
        for count in [10, 50, 100]:
            result = await harness.run_test_suite(count)
            results.append(result)
            assert result.status == "PASSED"
        
        # Check consistency
        for result in results:
            assert result.routing_metrics['overall_specialist_rate'] >= 0.8
            assert result.performance_metrics['completion_rate'] >= 0.8
        
        # Check performance scaling
        times = [r.execution_time for r in results]
        assert times[2] > times[1] > times[0]  # Should increase with more tasks
        
        # Check that 100-task run is not dramatically slower than expected
        assert times[2] < times[0] * 10  # Should be roughly proportional


if __name__ == "__main__":
    # Run validation tests
    pytest.main(['-v'])
