#!/usr/bin/env python3
"""
Test Autonomous Swarm - Demonstrate round-robin execution
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.tools.apj.agents.autonomous_swarm import AUTONOMOUS_SWARM
from src.tools.apj.agents.swarm_workflows import get_workflow, get_workflow_summary


def test_autonomous_swarm():
    """Test autonomous swarm with ECS workflow"""
    
    print("🧪 TESTING AUTONOMOUS SWARM")
    print("=" * 60)
    
    # Test 1: Get workflow summary
    print("\n📋 Testing Workflow Summary:")
    summary = get_workflow_summary("ecs_rendering")
    print(f"• Workflow: {summary['name']}")
    print(f"• Tasks: {summary['total_tasks']}")
    print(f"• Hours: {summary['total_estimated_hours']:.1f}")
    print(f"• Critical Path: {summary['critical_path_hours']:.1f} hours")
    
    # Test 2: Define workflow
    print("\n🔧 Testing Workflow Definition:")
    workflow_tasks = get_workflow("ecs_rendering")
    success = AUTONOMOUS_SWARM.define_task_workflow("ecs_rendering", workflow_tasks)
    print(f"• Workflow defined: {'✅ SUCCESS' if success else '❌ FAILED'}")
    print(f"• Tasks loaded: {len(workflow_tasks)}")
    
    # Test 3: Check swarm status
    print("\n📊 Testing Swarm Status:")
    status = AUTONOMOUS_SWARM.get_swarm_status()
    print(f"• State: {status['state']}")
    print(f"• Total tasks: {status['progress']['total_tasks']}")
    print(f"• Available agents: {len(status['agents'])}")
    
    # Test 4: Show task queue
    print("\n📋 Task Queue:")
    for i, task_id in enumerate(AUTONOMOUS_SWARM.task_queue[:5]):  # Show first 5
        task = AUTONOMOUS_SWARM.tasks[task_id]
        print(f"  {i+1}. {task.title} ({task.agent_type}) - Priority: {task.priority}")
    
    print(f"\n🎯 Autonomous Swarm Test Complete!")
    print("💡 To run the swarm autonomously, use ADJ and say:")
    print("   'start autonomous ecs workflow'")
    print("   'run autonomous round robin'")
    print("   'execute autonomous swarm'")


if __name__ == "__main__":
    test_autonomous_swarm()
