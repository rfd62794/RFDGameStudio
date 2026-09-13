"""
Swarm Workflows - Predefined task workflows for autonomous execution
Complete workflows for ECS Rendering, Dungeon Demo, and Tower Defense
"""

from typing import List, Dict, Any


def get_ecs_rendering_workflow() -> List[Dict[str, Any]]:
    """Complete ECS Rendering System workflow"""
    
    return [
        {
            "title": "Analyze ECS Architecture Requirements",
            "description": "Analyze current ECS system and define rendering requirements",
            "agent_type": "analyzer",
            "priority": 1,
            "estimated_hours": 0.5,
            "dependencies": []
        },
        {
            "title": "Design RenderComponent",
            "description": "Design RenderComponent for ECS rendering system",
            "agent_type": "planner",
            "priority": 2,
            "estimated_hours": 0.5,
            "dependencies": ["Analyze ECS Architecture Requirements"]
        },
        {
            "title": "Implement RenderComponent",
            "description": "Implement RenderComponent with rendering data",
            "agent_type": "coder",
            "priority": 2,
            "estimated_hours": 1.0,
            "dependencies": ["Design RenderComponent"]
        },
        {
            "title": "Design AnimationComponent",
            "description": "Design AnimationComponent for sprite animations",
            "agent_type": "planner",
            "priority": 3,
            "estimated_hours": 0.5,
            "dependencies": ["Analyze ECS Architecture Requirements"]
        },
        {
            "title": "Implement AnimationComponent",
            "description": "Implement AnimationComponent with animation logic",
            "agent_type": "coder",
            "priority": 3,
            "estimated_hours": 1.0,
            "dependencies": ["Design AnimationComponent"]
        },
        {
            "title": "Design RenderingSystem",
            "description": "Design RenderingSystem for component processing",
            "agent_type": "planner",
            "priority": 4,
            "estimated_hours": 0.5,
            "dependencies": ["Implement RenderComponent", "Implement AnimationComponent"]
        },
        {
            "title": "Implement RenderingSystem",
            "description": "Implement RenderingSystem with render loop",
            "agent_type": "coder",
            "priority": 4,
            "estimated_hours": 1.5,
            "dependencies": ["Design RenderingSystem"]
        },
        {
            "title": "Create ECS Rendering Tests",
            "description": "Create comprehensive tests for ECS rendering",
            "agent_type": "tester",
            "priority": 5,
            "estimated_hours": 1.0,
            "dependencies": ["Implement RenderingSystem"]
        },
        {
            "title": "Review ECS Rendering Implementation",
            "description": "Review and validate ECS rendering code quality",
            "agent_type": "reviewer",
            "priority": 6,
            "estimated_hours": 0.5,
            "dependencies": ["Create ECS Rendering Tests"]
        },
        {
            "title": "Integrate with GardenECS",
            "description": "Integrate rendering system with GardenECS",
            "agent_type": "coder",
            "priority": 7,
            "estimated_hours": 0.5,
            "dependencies": ["Review ECS Rendering Implementation"]
        },
        {
            "title": "Test ECS Rendering Integration",
            "description": "Test rendering system integration with garden",
            "agent_type": "tester",
            "priority": 8,
            "estimated_hours": 0.5,
            "dependencies": ["Integrate with GardenECS"]
        }
    ]


def get_dungeon_demo_workflow() -> List[Dict[str, Any]]:
    """Complete Dungeon Demo workflow"""
    
    return [
        {
            "title": "Analyze Dungeon Demo Requirements",
            "description": "Analyze current dungeon state and missing features",
            "agent_type": "analyzer",
            "priority": 1,
            "estimated_hours": 0.5,
            "dependencies": []
        },
        {
            "title": "Design Dungeon Feature Enhancements",
            "description": "Design missing features for dungeon demo",
            "agent_type": "planner",
            "priority": 2,
            "estimated_hours": 1.0,
            "dependencies": ["Analyze Dungeon Demo Requirements"]
        },
        {
            "title": "Implement Dungeon Gameplay Features",
            "description": "Implement missing gameplay mechanics",
            "agent_type": "coder",
            "priority": 3,
            "estimated_hours": 3.0,
            "dependencies": ["Design Dungeon Feature Enhancements"]
        },
        {
            "title": "Add Dungeon Visual Effects",
            "description": "Add visual effects and polish to dungeon",
            "agent_type": "coder",
            "priority": 4,
            "estimated_hours": 2.0,
            "dependencies": ["Implement Dungeon Gameplay Features"]
        },
        {
            "title": "Create Dungeon Demo Tests",
            "description": "Create comprehensive tests for dungeon demo",
            "agent_type": "tester",
            "priority": 5,
            "estimated_hours": 2.0,
            "dependencies": ["Add Dungeon Visual Effects"]
        },
        {
            "title": "Review Dungeon Demo Implementation",
            "description": "Review dungeon demo code and gameplay",
            "agent_type": "reviewer",
            "priority": 6,
            "estimated_hours": 1.0,
            "dependencies": ["Create Dungeon Demo Tests"]
        },
        {
            "title": "Optimize Dungeon Performance",
            "description": "Optimize dungeon demo performance",
            "agent_type": "coder",
            "priority": 7,
            "estimated_hours": 1.0,
            "dependencies": ["Review Dungeon Demo Implementation"]
        },
        {
            "title": "Final Dungeon Testing",
            "description": "Final testing and validation of dungeon demo",
            "agent_type": "tester",
            "priority": 8,
            "estimated_hours": 1.0,
            "dependencies": ["Optimize Dungeon Performance"]
        },
        {
            "title": "Document Dungeon Demo",
            "description": "Create documentation for dungeon demo",
            "agent_type": "archivist",
            "priority": 9,
            "estimated_hours": 0.5,
            "dependencies": ["Final Dungeon Testing"]
        },
        {
            "title": "Announce Dungeon Demo Completion",
            "description": "Announce dungeon demo completion",
            "agent_type": "herald",
            "priority": 10,
            "estimated_hours": 0.5,
            "dependencies": ["Document Dungeon Demo"]
        }
    ]


def get_tower_defense_workflow() -> List[Dict[str, Any]]:
    """Complete Tower Defense Phase 3 workflow"""
    
    return [
        {
            "title": "Analyze Tower Defense Requirements",
            "description": "Analyze tower defense game requirements and genetics integration",
            "agent_type": "analyzer",
            "priority": 1,
            "estimated_hours": 1.0,
            "dependencies": []
        },
        {
            "title": "Design Tower Defense Architecture",
            "description": "Design comprehensive tower defense system architecture",
            "agent_type": "planner",
            "priority": 2,
            "estimated_hours": 2.0,
            "dependencies": ["Analyze Tower Defense Requirements"]
        },
        {
            "title": "Design Tower-Genetics Integration",
            "description": "Design integration between towers and creature genetics",
            "agent_type": "planner",
            "priority": 3,
            "estimated_hours": 1.5,
            "dependencies": ["Design Tower Defense Architecture"]
        },
        {
            "title": "Implement Tower Defense Core Systems",
            "description": "Implement core tower defense mechanics",
            "agent_type": "coder",
            "priority": 4,
            "estimated_hours": 8.0,
            "dependencies": ["Design Tower Defense Architecture"]
        },
        {
            "title": "Implement Tower Types",
            "description": "Implement different tower types and abilities",
            "agent_type": "coder",
            "priority": 5,
            "estimated_hours": 6.0,
            "dependencies": ["Implement Tower Defense Core Systems"]
        },
        {
            "title": "Implement Enemy System",
            "description": "Implement enemy spawning and pathfinding",
            "agent_type": "coder",
            "priority": 6,
            "estimated_hours": 5.0,
            "dependencies": ["Implement Tower Defense Core Systems"]
        },
        {
            "title": "Implement Genetics Integration",
            "description": "Integrate creature genetics with tower mechanics",
            "agent_type": "coder",
            "priority": 7,
            "estimated_hours": 4.0,
            "dependencies": ["Implement Tower Types", "Implement Enemy System"]
        },
        {
            "title": "Create Tower Defense UI",
            "description": "Create user interface for tower defense",
            "agent_type": "coder",
            "priority": 8,
            "estimated_hours": 3.0,
            "dependencies": ["Implement Genetics Integration"]
        },
        {
            "title": "Create Tower Defense Tests",
            "description": "Create comprehensive tests for tower defense",
            "agent_type": "tester",
            "priority": 9,
            "estimated_hours": 4.0,
            "dependencies": ["Create Tower Defense UI"]
        },
        {
            "title": "Review Tower Defense Implementation",
            "description": "Review tower defense code and gameplay balance",
            "agent_type": "reviewer",
            "priority": 10,
            "estimated_hours": 2.0,
            "dependencies": ["Create Tower Defense Tests"]
        },
        {
            "title": "Balance Tower Defense Gameplay",
            "description": "Balance tower costs, damage, and enemy difficulty",
            "agent_type": "coder",
            "priority": 11,
            "estimated_hours": 3.0,
            "dependencies": ["Review Tower Defense Implementation"]
        },
        {
            "title": "Optimize Tower Defense Performance",
            "description": "Optimize tower defense performance and memory usage",
            "agent_type": "coder",
            "priority": 12,
            "estimated_hours": 2.0,
            "dependencies": ["Balance Tower Defense Gameplay"]
        },
        {
            "title": "Final Tower Defense Testing",
            "description": "Final testing and validation of tower defense",
            "agent_type": "tester",
            "priority": 13,
            "estimated_hours": 2.0,
            "dependencies": ["Optimize Tower Defense Performance"]
        },
        {
            "title": "Document Tower Defense System",
            "description": "Create comprehensive documentation",
            "agent_type": "archivist",
            "priority": 14,
            "estimated_hours": 1.0,
            "dependencies": ["Final Tower Defense Testing"]
        },
        {
            "title": "Announce Tower Defense Completion",
            "description": "Announce tower defense completion and G3 achievement",
            "agent_type": "herald",
            "priority": 15,
            "estimated_hours": 0.5,
            "dependencies": ["Document Tower Defense System"]
        }
    ]


def get_complete_project_workflow() -> List[Dict[str, Any]]:
    """Complete project workflow from current state to G3 completion"""
    
    # Combine all workflows with proper dependencies
    ecs_workflow = get_ecs_rendering_workflow()
    dungeon_workflow = get_dungeon_demo_workflow()
    tower_defense_workflow = get_tower_defense_workflow()
    
    # Add cross-workflow dependencies
    # Dungeon depends on ECS rendering
    for task in dungeon_workflow:
        if task["dependencies"]:
            task["dependencies"].extend(ecs_workflow[-1]["dependencies"])
        else:
            task["dependencies"] = [ecs_workflow[-1]["title"]]
    
    # Tower Defense depends on Dungeon completion
    for task in tower_defense_workflow:
        if task["dependencies"]:
            task["dependencies"].extend(dungeon_workflow[-1]["dependencies"])
        else:
            task["dependencies"] = [dungeon_workflow[-1]["title"]]
    
    return ecs_workflow + dungeon_workflow + tower_defense_workflow


# Workflow registry
WORKFLOWS = {
    "ecs_rendering": get_ecs_rendering_workflow,
    "dungeon_demo": get_dungeon_demo_workflow,
    "tower_defense": get_tower_defense_workflow,
    "complete_project": get_complete_project_workflow
}


def get_workflow(workflow_name: str) -> List[Dict[str, Any]]:
    """Get workflow by name"""
    
    if workflow_name in WORKFLOWS:
        return WORKFLOWS[workflow_name]()
    else:
        raise ValueError(f"Unknown workflow: {workflow_name}. Available: {list(WORKFLOWS.keys())}")


def list_available_workflows() -> List[str]:
    """List all available workflows"""
    
    return list(WORKFLOWS.keys())


def get_workflow_summary(workflow_name: str) -> Dict[str, Any]:
    """Get summary of workflow statistics"""
    
    workflow = get_workflow(workflow_name)
    
    total_tasks = len(workflow)
    total_hours = sum(task["estimated_hours"] for task in workflow)
    
    agent_counts = {}
    priority_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    
    for task in workflow:
        agent_type = task["agent_type"]
        agent_counts[agent_type] = agent_counts.get(agent_type, 0) + 1
        
        priority = task["priority"]
        if priority <= 5:
            priority_counts[priority] += 1
    
    return {
        "name": workflow_name,
        "total_tasks": total_tasks,
        "total_estimated_hours": total_hours,
        "agent_distribution": agent_counts,
        "priority_distribution": priority_counts,
        "critical_path_hours": sum(task["estimated_hours"] for task in workflow if task["priority"] <= 3)
    }
