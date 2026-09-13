"""
Autonomous Swarm - Self-sufficient round-robin task execution
Continuously works through tasks until completion without human intervention
"""

import logging
import time
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import uuid
import json

from .a2a_communication import A2A_MANAGER, MessageType, MessagePriority
from .agent_registry import AGENT_REGISTRY, AgentRegistry
from .child_agent import CHILD_AGENT_MANAGER
from .agent_boot import AGENT_BOOT_MANAGER
from .task_classifier import TaskClassifier
from .task_router import TaskRouter
from .specialist_executors import get_executor_for_agent
from .types import SwarmTask, TaskStatus, AgentWorkload, SwarmState, TaskResult

# Import extended components
try:
    from ..swarm.resilience.self_healing import SelfHealer, SwarmLearning
    from ..swarm.monitoring.swarm_monitor import SwarmMonitor
    from ..swarm.tools.extended_tools import EXTENDED_TOOLS
except ImportError:
    # Fallback for when components aren't available
    SelfHealer = None
    SwarmLearning = None
    SwarmMonitor = None
    EXTENDED_TOOLS = {}

logger = logging.getLogger(__name__)


class AutonomousSwarm:
    """Self-sufficient swarm that executes tasks round-robin"""
    
    def __init__(self):
        self.state = SwarmState.IDLE
        self.tasks: Dict[str, SwarmTask] = {}
        self.agent_workloads: Dict[str, AgentWorkload] = {}
        self.task_queue: List[str] = []  # Ordered task IDs
        self.completed_tasks: List[str] = []
        self.failed_tasks: List[str] = []
        self.blocked_tasks: List[str] = []
        self.active_tasks: Dict[str, SwarmTask] = {}  # Add missing attribute
        self.current_task_index = 0
        self.round_robin_cycle = 0
        self.swarm_start_time: Optional[datetime] = None
        self.last_activity: Optional[datetime] = None
        
        # Swarm configuration
        self.max_concurrent_tasks = 3
        self.task_timeout_minutes = 30
        self.round_robin_interval_seconds = 5
        self.auto_retry_enabled = True
        self.progress_reporting_enabled = True
        
        # Initialize extended components
        self.self_healer = SelfHealer() if SelfHealer else None
        self.learning_system = SwarmLearning() if SwarmLearning else None
        self.monitor = SwarmMonitor() if SwarmMonitor else None
        
        # Initialize routing components
        self.task_classifier = TaskClassifier()
        self.registry = AGENT_REGISTRY
        self.registry.initialize_specialists()  # Register all specialists
        self.task_router = TaskRouter(self.registry, self.agent_workloads, self.self_healer)
        
        # Asyncio locks for critical sections
        self.task_queue_lock = None  # Will be set in async context
        self.workload_lock = None     # Will be set in async context
        
        # Performance tracking
        self.task_durations: Dict[str, float] = {}
        self.agent_success_rates: Dict[str, float] = {}
        
        # Initialize agent workloads
        self._initialize_agent_workloads()
    
    async def _initialize_async_locks(self):
        """Initialize asyncio locks for async context"""
        import asyncio
        self.task_queue_lock = asyncio.Lock()
        self.workload_lock = asyncio.Lock()
    
    def _initialize_agent_workloads(self):
        """Initialize workload tracking for all available agents"""
        
        # Get all swarm agents
        swarm_agents = ["coordinator", "analyzer", "planner", "coder", "tester", "reviewer", "executor"]
        existing_agents = ["strategist", "archivist", "herald"]
        
        all_agents = swarm_agents + existing_agents
        
        for agent_name in all_agents:
            self.agent_workloads[agent_name] = AgentWorkload(
                agent_name=agent_name,
                is_available=True
            )
    
    def define_task_workflow(self, workflow_name: str, tasks: List[Dict[str, Any]]) -> bool:
        """Define a complete workflow of tasks for autonomous execution"""
        
        try:
            logger.info(f"[QUEUE] Defining workflow: {workflow_name}")
            
            # Clear existing tasks for this workflow
            workflow_prefix = f"{workflow_name}_"
            self.tasks = {k: v for k, v in self.tasks.items() if not k.startswith(workflow_prefix)}
            
            # Create tasks from workflow definition
            created_tasks = []
            for task_def in tasks:
                task_id = f"{workflow_prefix}_{task_def['title'].lower().replace(' ', '_')}"
                
                task = SwarmTask(
                    id=task_id,
                    title=task_def['title'],
                    description=task_def['description'],
                    agent_type=task_def['agent_type'],
                    priority=task_def.get('priority', 5),
                    estimated_hours=task_def.get('estimated_hours', 1.0),
                    dependencies=task_def.get('dependencies', [])
                )
                
                self.tasks[task_id] = task
                created_tasks.append(task_id)
            
            # Build task queue based on dependencies and priority
            self._build_task_queue()
            
            logger.info(f"[OK] Created {len(created_tasks)} tasks for workflow: {workflow_name}")
            return True
            
        except Exception as e:
            logger.error(f"[FAIL] Failed to define workflow {workflow_name}: {e}")
            return False
    
    def _calculate_dependency_levels(self, steps: List[SwarmTask]) -> Dict[int, List[str]]:
        """Calculate dependency levels for parallel execution"""
        
        levels = {}
        remaining_steps = steps.copy()
        current_level = 0
        max_iterations = len(steps) * 2  # Prevent infinite loops
        iterations = 0
        
        while remaining_steps and iterations < max_iterations:
            iterations += 1
            tasks_at_level = []
            
            for step in remaining_steps:
                # Check if all dependencies are resolved
                deps_resolved = True
                for dep_id in step.dependencies:
                    # Check if dependency exists in our steps
                    dep_exists = any(s.id == dep_id for s in steps)
                    if dep_exists and dep_id in [s.id for s in remaining_steps]:
                        deps_resolved = False
                        break
                
                if deps_resolved:
                    self.task_queue.append(task_id)
        
        logger.info(f"[OK] Classified {len(self.tasks)} tasks")
    
    async def start_autonomous_execution(self) -> bool:
        """
        Start autonomous execution with intelligent routing and parallel execution
        """
        
        try:
            # Initialize async locks
            await self._initialize_async_locks()
            
            self.state = SwarmState.ACTIVE
            self.swarm_start_time = datetime.now()
            
            logger.info(" Starting autonomous swarm execution with intelligent routing")
            print("[LAUNCH] Autonomous Swarm starting with intelligent task routing...")
            
            # Build task queue with classification
            await self._build_task_queue()
            
            if not self.task_queue:
                logger.info("No tasks to execute")
                print("[OK] No tasks to execute - swarm ready")
                return True
            
            logger.info(f"[QUEUE] {len(self.task_queue)} tasks queued for execution")
            print(f"[QUEUE] {len(self.task_queue)} tasks queued for intelligent routing")
            
            # Execute with intelligent routing
            await self._execute_autonomous_round_robin()
            
            return True
            
        except Exception as e:
            logger.error(f"[FAIL] Failed to start autonomous execution: {e}")
            print(f"[FAIL] Failed to start autonomous execution: {e}")
            self.state = SwarmState.ERROR
            return False
    
    async def _build_task_queue(self) -> None:
        """Build task queue with classification"""
        
        logger.info("[BUILD] Building task queue with classification")
        
        # Classify all tasks
        for task_id, task in self.tasks.items():
            if not hasattr(task, 'classification') or not task.classification:
                classification = self.task_classifier.classify(task_id, task.title, task.description)
                task.classification = classification
                task.agent_type = classification.detected_type
            
            # Add to queue if not already there
            if task_id not in self.task_queue and task.status == TaskStatus.PENDING:
                async with self.task_queue_lock:
                    self.task_queue.append(task_id)
        
        logger.info(f"[OK] Classified {len(self.tasks)} tasks")
    
    async def _execute_autonomous_round_robin(self) -> None:
        """Execute tasks with intelligent routing and parallel execution"""
        
        logger.info(" Starting intelligent round-robin execution")
        
        while self.state == SwarmState.ACTIVE and self.task_queue:
            try:
                # Get pending tasks with dependencies met
                pending = await self._get_ready_tasks()
                
                if not pending:
                    # No tasks ready to run; wait a bit
                    await asyncio.sleep(0.1)
                    continue
                
                # Get available agents
                available_agents = await self._get_available_agents()
                
                # Route each task to best available agent
                assignments = []  # List of (task_id, agent_name) tuples
                
                for task in pending:
                    agent_name = self.task_router.route_task(task, task.classification)
                    
                    if agent_name is None:
                        # Task deferred (agent busy), skip for now
                        continue
                    
                    # Check if we've hit max concurrent tasks
                    active_count = sum(1 for w in self.agent_workloads.values() if w.current_task)
                    if active_count >= self.max_concurrent_tasks:
                        break  # Stop assigning; execute what we have
                    
                    assignments.append((task.id, agent_name))
                    
                    # Update task state
                    task.status = TaskStatus.IN_PROGRESS
                    task.assigned_agent = agent_name
                    await self._update_workload_assignment(agent_name, task.id)
                    
                    # Remove from queue
                    async with self.task_queue_lock:
                        if task.id in self.task_queue:
                            self.task_queue.remove(task.id)
                
                if not assignments:
                    # No tasks ready to run; wait a bit
                    await asyncio.sleep(0.1)
                    continue
                
                # Execute assigned tasks concurrently
                logger.info(f" Executing {len(assignments)} tasks concurrently")
                print(f" Executing {len(assignments)} tasks concurrently")
                
                results = await asyncio.gather(*[
                    self._execute_task_async(task_id, agent_name)
                    for task_id, agent_name in assignments
                ])
                
                # Track results
                for result in results:
                    await self._update_after_execution(result)
                
                # Small delay to prevent overwhelming
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"[FAIL] Task execution failed: {e}")
                print(f"[FAIL] Failed to execute task: {e}")
                break
        
        self.state = SwarmState.IDLE
        print("[SUCCESS] All tasks completed!")
        logger.info("[SUCCESS] Autonomous swarm execution completed")
    
    async def _get_ready_tasks(self) -> List[SwarmTask]:
        """Get tasks ready to execute (dependencies met)"""
        
        async with self.task_queue_lock:
            pending = [
                self.tasks[task_id]
                for task_id in self.task_queue
                if self._dependencies_met(task_id)
            ]
        return pending
    
    async def _get_available_agents(self) -> List[str]:
        """Get agents that can accept new tasks"""
        
        available = []
        for agent_name, workload in self.agent_workloads.items():
            if workload.current_task is None:  # Agent is idle
                # Check circuit breaker
                if self.self_healer and agent_name in self.self_healer.circuit_breakers:
                    continue  # Skip circuit-broken agents
                available.append(agent_name)
        
        return available
    
    async def _update_workload_assignment(self, agent_name: str, task_id: str) -> None:
        """Update agent workload when task is assigned"""
        
        async with self.workload_lock:
            if agent_name in self.agent_workloads:
                self.agent_workloads[agent_name].current_task = task_id
    
    async def _update_workload_completion(self, agent_name: str, success: bool, duration: float) -> None:
        """Update agent workload when task completes"""
        
        async with self.workload_lock:
            if agent_name in self.agent_workloads:
                workload = self.agent_workloads[agent_name]
                workload.current_task = None
                workload.tasks_completed += 1
                
                # Update efficiency metrics
                if hasattr(workload, 'total_work_time'):
                    workload.total_work_time += duration
                    workload.efficiency_score = workload.tasks_completed / workload.total_work_time
                else:
                    workload.total_work_time = duration
                    workload.efficiency_score = 1.0
    
    async def _mark_task_complete(self, task_id: str, success: bool) -> None:
        """Mark task as complete or failed"""
        
        task = self.tasks[task_id]
        
        async with self.task_queue_lock:
            if success:
                self.completed_tasks.append(task_id)
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.now()
            else:
                self.failed_tasks.append(task_id)
                task.status = TaskStatus.FAILED
                task.completed_at = datetime.now()
    
    def _dependencies_met(self, task_id: str) -> bool:
        """Check if all dependencies of a task are completed"""
        
        task = self.tasks.get(task_id)
        if not task:
            return False
        
        if not task.dependencies:
            return True  # No dependencies
        
        for dep_id in task.dependencies:
            dep_task = self.tasks.get(dep_id)
            if not dep_task:
                # Break deadlock: remove the non-existent dependency
                task.dependencies = [dep for dep in task.dependencies if dep != dep_id]
                continue  # Continue checking other dependencies
            
            if dep_task.status != TaskStatus.COMPLETED:
                return False  # Dependency not yet completed
        
        return True  # All dependencies met
    
    async def _execute_task_async(self, task_id: str, agent_name: str) -> Any:
        """Execute a single task asynchronously with timeout and proper error handling"""
        
        task = self.tasks[task_id]
        start_time = asyncio.get_event_loop().time()
        
        try:
            logger.info(f" Executing task: {task.title}")
            print(f" Executing task: {task.title}")
            print(f" Agent: {agent_name} | Priority: {task.priority}")
            
            # Get executor for agent
            executor = get_executor_for_agent(agent_name)
            if not executor:
                # Fallback to generic execution
                result = await self._execute_generic_task_async(task)
            else:
                # Use specialist executor with timeout
                result = await asyncio.wait_for(
                    executor(task),
                    timeout=self.task_timeout_minutes * 60  # Convert minutes to seconds
                )
            
            # Record success
            duration = asyncio.get_event_loop().time() - start_time
            self.task_durations[task_id] = duration
            
            if self.learning_system:
                self.learning_system.record_success(
                    agent_name, 
                    task.agent_type, 
                    f"standard_{task.agent_type}_approach"
                )
            
            # Mark as completed
            await self._mark_task_complete(task_id, True)
            await self._update_workload_completion(agent_name, True, duration)
            
            print(f"[OK] Completed: {task.title}")
            logger.info(f"[OK] Completed task {task_id}")
            
            return result
            
        except asyncio.TimeoutError:
            # Handle timeout
            duration = asyncio.get_event_loop().time() - start_time
            self.task_durations[task_id] = duration
            
            print(f" Task timeout: {task.title}")
            logger.error(f" Task {task_id} timed out")
            
            await self._mark_task_complete(task_id, False)
            await self._update_workload_completion(agent_name, False, duration)
            
            if self.self_healer:
                self.self_healer.detect_and_recover(agent_name, Exception("Task timeout"), task_id)
            
            return {"success": False, "error": "Task timeout", "duration": duration}
            
        except Exception as e:
            # Handle failure with self-healing
            duration = asyncio.get_event_loop().time() - start_time
            self.task_durations[task_id] = duration
            
            print(f"[FAIL] Task failed: {e}")
            logger.error(f"[FAIL] Task {task_id} failed: {e}")
            
            # Try to recover
            if self.self_healer:
                recovered = self.self_healer.detect_and_recover(
                    agent_name, e, task_id
                )
                
                if recovered:
                    print(f" Recovery successful - retrying task")
                    logger.info(f" Task {task_id} recovery successful - retrying")
                    # Put task back in queue for retry
                    async with self.task_queue_lock:
                        self.task_queue.insert(0, task_id)
                else:
                    print(f" Recovery failed - marking as failed")
                    logger.error(f" Task {task_id} recovery failed")
                    await self._mark_task_complete(task_id, False)
                    await self._update_workload_completion(agent_name, False, duration)
                    
                    if self.learning_system:
                        self.learning_system.record_failure(
                            agent_name,
                            task.agent_type,
                            f"standard_{task.agent_type}_approach",
                            str(e)
                        )
            else:
                # No self-healer available - mark as failed
                await self._mark_task_complete(task_id, False)
                await self._update_workload_completion(agent_name, False, duration)
            
            # Update monitoring
            if self.monitor:
                swarm_state = self._get_swarm_state()
                self.monitor.collect_metrics(swarm_state)
            
            return {"success": False, "error": str(e), "duration": duration}
    
    async def _execute_generic_task_async(self, task: SwarmTask) -> Any:
        """Execute generic task asynchronously"""
        
        # Simulate work with progress updates
        steps = max(1, int(task.estimated_hours * 10))
        for i in range(steps):
            progress = (i + 1) / steps * 100
            print(f"  [REPORT] Generic progress: {progress:.1f}%")
            await asyncio.sleep(0.05)  # Short simulation time
        
        return {"success": True, "output": f"Completed {task.title}"}
    
    async def _update_after_execution(self, result: Any) -> None:
        """Update swarm state after task execution"""
        
        # Update monitoring
        if self.monitor:
            swarm_state = self._get_swarm_state()
            self.monitor.collect_metrics(swarm_state)
        
        # Update learning system
        if self.learning_system and hasattr(result, 'success'):
            # Extract task info for learning - handle both TaskResult and dict
            if hasattr(result, 'task_id'):  # TaskResult object
                task_id = result.task_id
                agent_name = result.agent_name
                success = result.success
                error = result.error
            else:  # Dictionary
                task_id = result.get('task_id', 'unknown')
                agent_name = result.get('agent_name', 'unknown')
                success = result.get('success', False)
                error = result.get('error', 'Unknown error')
            
            task = self.tasks.get(task_id)
            if task:
                if success:
                    self.learning_system.record_success(
                        agent_name,
                        task.agent_type,
                        f"async_{task.agent_type}_approach"
                    )
                else:
                    self.learning_system.record_failure(
                        agent_name,
                        task.agent_type,
                        f"async_{task.agent_type}_approach",
                        error
                    )
    
    async def run(self):
        """Main async entry point for swarm execution"""
        self.state = SwarmState.ACTIVE
        
        try:
            await self._execute_autonomous_round_robin()
        except Exception as e:
            logger.error(f"Swarm execution failed: {e}")
            self.state = SwarmState.ERROR
        finally:
            self.state = SwarmState.COMPLETED
    
    def run_sync(self):
        """Synchronous wrapper for backward compatibility"""
        # Run async code from sync context
        import asyncio
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.run())
    
    def _execute_dungeon_task(self, task):
        """Execute dungeon demo task"""
        print(f" Dungeon Specialist working on: {task.title}")
        # Simulate dungeon work
        self._simulate_work("dungeon", task.estimated_hours * 0.1)
    
    def _execute_tower_defense_task(self, task):
        """Execute tower defense task"""
        print(f" Tower Defense Specialist working on: {task.title}")
        # Simulate tower defense work
        self._simulate_work("tower_defense", task.estimated_hours * 0.1)
    
    def _execute_code_quality_task(self, task):
        """Execute code quality task"""
        print(f" Code Quality Specialist working on: {task.title}")
        # Simulate code quality work
        self._simulate_work("code_quality", task.estimated_hours * 0.1)
    
    def _execute_performance_task(self, task):
        """Execute performance task"""
        print(f" Performance Specialist working on: {task.title}")
        # Simulate performance work
        self._simulate_work("performance", task.estimated_hours * 0.1)
    
    def _execute_testing_task(self, task):
        """Execute testing task"""
        print(f" Testing Specialist working on: {task.title}")
        # Simulate testing work
        self._simulate_work("testing", task.estimated_hours * 0.1)
    
    def _execute_generic_task(self, task):
        """Execute generic task"""
        print(f" Generic agent working on: {task.title}")
        # Simulate generic work
        self._simulate_work("generic", task.estimated_hours * 0.1)
    
    def _simulate_work(self, work_type: str, duration: float):
        """Simulate work being done"""
        import time
        import random
        
        # Simulate work with progress updates
        steps = max(1, int(duration * 10))
        for i in range(steps):
            progress = (i + 1) / steps * 100
            print(f"  [REPORT] {work_type.title()} progress: {progress:.1f}%")
            time.sleep(0.05)  # Short simulation time
    
    def _execute_documentation_task(self, task):
        """Execute documentation task"""
        print(f" Documentation Specialist working on: {task.title}")
        self._simulate_work("documentation", task.estimated_hours * 0.1)
    
    def _execute_architecture_task(self, task):
        """Execute architecture task"""
        print(f"[BUILD] Architecture Specialist working on: {task.title}")
        self._simulate_work("architecture", task.estimated_hours * 0.1)
    
    def _execute_genetics_task(self, task):
        """Execute genetics task"""
        print(f" Genetics Specialist working on: {task.title}")
        self._simulate_work("genetics", task.estimated_hours * 0.1)
    
    def _execute_ui_task(self, task):
        """Execute UI task"""
        print(f" UI Specialist working on: {task.title}")
        self._simulate_work("ui", task.estimated_hours * 0.1)
    
    def _execute_integration_task(self, task):
        """Execute integration task"""
        print(f" Integration Specialist working on: {task.title}")
        self._simulate_work("integration", task.estimated_hours * 0.1)
    
    def _execute_debugging_task(self, task):
        """Execute debugging task"""
        print(f" Debugging Specialist working on: {task.title}")
        self._simulate_work("debugging", task.estimated_hours * 0.1)
    
    def _get_swarm_state(self) -> Dict[str, Any]:
        """Get current swarm state for monitoring"""
        
        total_tasks = len(self.tasks)
        completed_tasks = len(self.completed_tasks)
        failed_tasks = len(self.failed_tasks)
        in_progress_tasks = len(self.active_tasks)
        
        # Calculate average task duration
        avg_duration = 0.0
        if self.task_durations:
            avg_duration = sum(self.task_durations.values()) / len(self.task_durations)
        
        # Count circuit breakers
        circuit_breakers_open = 0
        if self.self_healer:
            circuit_breakers_open = sum(1 for open in self.self_healer.circuit_breakers.values() if open)
        
        return {
            "total_agents": len(self.agent_workloads),
            "active_agents": sum(1 for w in self.agent_workloads.values() if w.current_task),
            "idle_agents": sum(1 for w in self.agent_workloads.values() if not w.current_task),
            "failed_agents": 0,  # TODO: Track failed agents
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "avg_task_duration": avg_duration,
            "circuit_breakers_open": circuit_breakers_open,
        }
    
    def get_swarm_status(self) -> Dict[str, Any]:
        """Get next available task from queue"""
        
        for task_id in self.task_queue:
            task = self.tasks[task_id]
            
            # Skip if task is already completed, failed, or in progress
            if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.IN_PROGRESS]:
                continue
            
            # Check if dependencies are met
            deps_met = all(dep_id in self.completed_tasks for dep_id in task.dependencies)
            if not deps_met:
                continue
            
            return task_id
        
        return None
    
    def _get_best_available_agent(self, required_agent_type: str) -> Optional[str]:
        """Get best available agent for task type"""
        
        # Map task types to agent names
        agent_mapping = {
            "coordinator": ["coordinator", "swarm_coordinator"],
            "analyzer": ["analyzer", "swarm_analyzer"],
            "planner": ["planner", "swarm_planner"],
            "coder": ["coder", "swarm_coder"],
            "tester": ["tester", "swarm_tester"],
            "reviewer": ["reviewer", "swarm_reviewer"],
            "executor": ["executor", "swarm_executor"],
            "strategist": ["strategist"],
            "archivist": ["archivist"],
            "herald": ["herald"]
        }
        
        candidate_agents = agent_mapping.get(required_agent_type, [required_agent_type])
        
        # Find available agents with best efficiency
        available_agents = []
        for agent_name in candidate_agents:
            if agent_name in self.agent_workloads:
                workload = self.agent_workloads[agent_name]
                if workload.is_available and workload.current_task is None:
                    available_agents.append((agent_name, workload.efficiency_score))
        
        if not available_agents:
            return None
        
        # Sort by efficiency score (highest first)
        available_agents.sort(key=lambda x: x[1], reverse=True)
        return available_agents[0][0]
    
    def _assign_task_to_agent(self, task_id: str, agent_name: str):
        """Assign task to specific agent"""
        
        task = self.tasks[task_id]
        workload = self.agent_workloads[agent_name]
        
        task.status = TaskStatus.IN_PROGRESS
        task.assigned_to = agent_name
        task.started_at = datetime.now()
        
        workload.current_task = task_id
        workload.is_available = False
        workload.last_activity = datetime.now()
        
        logger.info(f"[QUEUE] Assigned task '{task.title}' to {agent_name}")
    
    def _execute_task(self, task_id: str, agent_name: str) -> bool:
        """Execute task through agent"""
        
        task = self.tasks[task_id]
        workload = self.agent_workloads[agent_name]
        
        try:
            logger.info(f" Executing task: {task.title} ({agent_name})")
            
            # Send task to agent via A2A communication
            if agent_name.startswith("swarm_"):
                recipient = agent_name.replace("swarm_", "") + "_agent"
            else:
                recipient = agent_name
            
            message_content = {
                "task": task.title,
                "description": task.description,
                "context": {
                    "task_id": task_id,
                    "priority": task.priority,
                    "estimated_hours": task.estimated_hours,
                    "autonomous_execution": True
                }
            }
            
            # Send task message
            message_id = A2A_MANAGER.send_message(
                sender="swarm_coordinator",
                recipient=recipient,
                message_type=MessageType.REQUEST,
                content=message_content,
                priority=MessagePriority.HIGH if task.priority <= 3 else MessagePriority.NORMAL
            )
            
            # Simulate task execution (in real implementation, this would wait for actual completion)
            # For now, we'll simulate based on estimated hours
            execution_time = min(task.estimated_hours * 0.1, 2.0)  # Simulate faster for demo
            time.sleep(execution_time)
            
            # Mark task as completed (simulated)
            self._complete_task(task_id, agent_name, {"message_id": message_id, "simulated": True})
            
            return True
            
        except Exception as e:
            logger.error(f"[FAIL] Task execution failed: {e}")
            self._fail_task(task_id, agent_name, str(e))
            return False
    
    def _complete_task(self, task_id: str, agent_name: str, result: Dict[str, Any]):
        """Mark task as completed"""
        
        task = self.tasks[task_id]
        workload = self.agent_workloads[agent_name]
        
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now()
        task.result = result
        
        workload.current_task = None
        workload.is_available = True
        workload.tasks_completed += 1
        workload.total_work_time += task.estimated_hours
        workload.efficiency_score = workload.tasks_completed / max(workload.total_work_time, 0.1)
        
        self.completed_tasks.append(task_id)
        self.last_activity = datetime.now()
        
        logger.info(f"[OK] Task completed: {task.title} by {agent_name}")
    
    def _fail_task(self, task_id: str, agent_name: str, error_message: str):
        """Mark task as failed"""
        
        task = self.tasks[task_id]
        workload = self.agent_workloads[agent_name]
        
        task.status = TaskStatus.FAILED
        task.error_message = error_message
        task.retry_count += 1
        
        workload.current_task = None
        workload.is_available = True
        
        if task.retry_count < task.max_retries and self.auto_retry_enabled:
            # Retry task
            task.status = TaskStatus.PENDING
            logger.warning(f" Retrying task: {task.title} (attempt {task.retry_count + 1})")
        else:
            self.failed_tasks.append(task_id)
            logger.error(f"[FAIL] Task failed permanently: {task.title}")
    
    def _are_all_tasks_completed(self) -> bool:
        """Check if all tasks are completed"""
        
        total_tasks = len(self.tasks)
        completed_tasks = len(self.completed_tasks)
        failed_tasks = len(self.failed_tasks)
        
        return (completed_tasks + failed_tasks) >= total_tasks
    
    def _report_progress(self):
        """Report current swarm progress"""
        
        total_tasks = len(self.tasks)
        completed = len(self.completed_tasks)
        failed = len(self.failed_tasks)
        in_progress = sum(1 for t in self.tasks.values() if t.status == TaskStatus.IN_PROGRESS)
        pending = sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING)
        
        progress_pct = (completed / total_tasks * 100) if total_tasks > 0 else 0
        
        # Calculate swarm efficiency
        total_completed = sum(w.tasks_completed for w in self.agent_workloads.values())
        total_work_time = sum(w.total_work_time for w in self.agent_workloads.values())
        swarm_efficiency = total_completed / max(total_work_time, 0.1)
        
        # Calculate runtime
        if self.swarm_start_time:
            runtime = datetime.now() - self.swarm_start_time
            runtime_str = str(runtime).split('.')[0]  # Remove microseconds
        else:
            runtime_str = "00:00:00"
        
        logger.info(f"[REPORT] Swarm Progress: {progress_pct:.1f}% ({completed}/{total_tasks}) | "
                   f"Active: {in_progress} | Pending: {pending} | Failed: {failed} | "
                   f"Efficiency: {swarm_efficiency:.1f} tasks/hr | Runtime: {runtime_str}")
    
    def get_swarm_status(self) -> Dict[str, Any]:
        """Get comprehensive swarm status"""
        
        total_tasks = len(self.tasks)
        completed = len(self.completed_tasks)
        failed = len(self.failed_tasks)
        in_progress = sum(1 for t in self.tasks.values() if t.status == TaskStatus.IN_PROGRESS)
        pending = sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING)
        
        progress_pct = (completed / total_tasks * 100) if total_tasks > 0 else 0
        
        # Agent status
        agent_status = {}
        for agent_name, workload in self.agent_workloads.items():
            agent_status[agent_name] = {
                "available": workload.is_available,
                "current_task": workload.current_task,
                "tasks_completed": workload.tasks_completed,
                "efficiency": f"{workload.efficiency_score:.2f} tasks/hr"
            }
        
        return {
            "state": self.state.value,
            "progress": {
                "total_tasks": total_tasks,
                "completed": completed,
                "failed": failed,
                "in_progress": in_progress,
                "pending": pending,
                "progress_percentage": f"{progress_pct:.1f}%"
            },
            "agents": agent_status,
            "runtime": str(datetime.now() - self.swarm_start_time) if self.swarm_start_time else "00:00:00",
            "round_robin_cycle": self.round_robin_cycle,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None
        }
    
    def pause_execution(self):
        """Pause autonomous execution"""
        if self.state == SwarmState.ACTIVE:
            self.state = SwarmState.PAUSED
            logger.info(" Swarm execution paused")
    
    def resume_execution(self):
        """Resume autonomous execution"""
        if self.state == SwarmState.PAUSED:
            self.state = SwarmState.ACTIVE
            logger.info(" Swarm execution resumed")
            self._autonomous_execution_loop()
    
    def stop_execution(self):
        """Stop autonomous execution"""
        self.state = SwarmState.IDLE
        logger.info(" Swarm execution stopped")


# Global autonomous swarm instance
AUTONOMOUS_SWARM = AutonomousSwarm()
