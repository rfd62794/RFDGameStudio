"""
50-Task Test Harness Subset
Balanced validation of routing logic
"""

from tests.fixtures.test_tasks_100 import get_test_tasks_100, validate_task_distribution


def get_test_tasks_50() -> list:
    """Return 50 test tasks (balanced subset of 100)"""
    all_tasks = get_test_tasks_100()
    
    # Take 8-10 tasks from each type for medium validation
    selected = []
    type_counts = {
        "documentation": 0,
        "architecture": 0,
        "genetics": 0,
        "ui": 0,
        "integration": 0,
        "debugging": 0
    }
    
    # Target counts for 50 tasks
    target_counts = {
        "documentation": 8,
        "architecture": 8,
        "genetics": 8,
        "ui": 8,
        "integration": 10,
        "debugging": 8
    }
    
    for task in all_tasks:
        agent_type = task.agent_type
        if type_counts[agent_type] < target_counts[agent_type]:
            selected.append(task)
            type_counts[agent_type] += 1
        if len(selected) >= 50:
            break
    
    return selected


def validate_task_distribution_50(tasks: list) -> dict:
    """Validate 50-task distribution"""
    
    distribution = {}
    for task in tasks:
        agent_type = task.agent_type
        distribution[agent_type] = distribution.get(agent_type, 0) + 1
    
    expected = {
        "documentation": 8,
        "architecture": 8,
        "genetics": 8,
        "ui": 8,
        "integration": 10,
        "debugging": 8
    }
    
    validation = {
        "actual": distribution,
        "expected": expected,
        "matches": True,
        "differences": {}
    }
    
    for agent_type, expected_count in expected.items():
        actual_count = distribution.get(agent_type, 0)
        if actual_count != expected_count:
            validation["matches"] = False
            validation["differences"][agent_type] = {
                "expected": expected_count,
                "actual": actual_count,
                "diff": actual_count - expected_count
            }
    
    return validation


if __name__ == "__main__":
    # Generate and validate 50 tasks
    tasks_50 = get_test_tasks_50()
    validation = validate_task_distribution_50(tasks_50)
    
    print("50-Task Test Harness Generated")
    print(f"Validation: {'✅ PASS' if validation['matches'] else '❌ FAIL'}")
    
    if not validation['matches']:
        print("Distribution Differences:")
        for agent_type, diff in validation['differences'].items():
            print(f"  {agent_type}: Expected {diff['expected']}, Got {diff['actual']} (diff: {diff['diff']})")
    
    print(f"Total Tasks: {len(tasks_50)}")
    for agent_type, count in validation['actual'].items():
        print(f"  {agent_type}: {count} tasks")
