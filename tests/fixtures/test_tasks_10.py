"""
10-Task Small Validation Suite
Quick validation of routing logic
"""

from tests.fixtures.test_tasks_100 import get_test_tasks_100


def get_test_tasks_10() -> list:
    """Return 10 test tasks (small validation)"""
    all_tasks = get_test_tasks_100()
    
    # Take 2 tasks from each type for small validation
    selected = []
    type_counts = {
        "documentation": 0,
        "architecture": 0,
        "genetics": 0,
        "ui": 0,
        "integration": 0,
        "debugging": 0
    }
    
    for task in all_tasks:
        agent_type = task.agent_type
        if type_counts[agent_type] < 2:
            selected.append(task)
            type_counts[agent_type] += 1
        if len(selected) >= 10:
            break
    
    return selected


def validate_task_distribution_10(tasks: list) -> dict:
    """Validate 10-task distribution"""
    
    distribution = {}
    for task in tasks:
        agent_type = task.agent_type
        distribution[agent_type] = distribution.get(agent_type, 0) + 1
    
    expected = {
        "documentation": 2,
        "architecture": 2,
        "genetics": 2,
        "ui": 2,
        "integration": 2,
        "debugging": 2
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
    # Generate and validate 10 tasks
    tasks_10 = get_test_tasks_10()
    validation = validate_task_distribution_10(tasks_10)
    
    print("10-Task Small Validation Suite Generated")
    print(f"Validation: {'✅ PASS' if validation['matches'] else '❌ FAIL'}")
    
    if not validation['matches']:
        print("Distribution Differences:")
        for agent_type, diff in validation['differences'].items():
            print(f"  {agent_type}: Expected {diff['expected']}, Got {diff['actual']} (diff: {diff['diff']})")
    
    print(f"Total Tasks: {len(tasks_10)}")
    for agent_type, count in validation['actual'].items():
        print(f"  {agent_type}: {count} tasks")
