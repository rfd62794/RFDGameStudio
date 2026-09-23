"""
100-Task Test Harness for APJ Swarm Routing Validation
Comprehensive validation of routing logic before full-scale deployment
"""

from dataclasses import dataclass
from typing import List, Dict, Any
from enum import Enum
import random

from src.tools.apj.agents.types import SwarmTask, TaskStatus


class TaskType(Enum):
    """Task types for test harness"""
    DOCUMENTATION = "documentation"
    ARCHITECTURE = "architecture"
    GENETICS = "genetics"
    UI = "ui"
    INTEGRATION = "integration"
    DEBUGGING = "debugging"


@dataclass
class TaskTemplate:
    """Template for generating test tasks"""
    task_type: TaskType
    base_id: str
    title_pattern: str
    description_pattern: str
    priority_range: tuple
    hours_range: tuple
    confidence_range: tuple
    file_references: List[str]
    tags: List[str]
    dependencies: List[str] = None


class MockTaskGenerator:
    """Generate test tasks covering all agent types"""
    
    def __init__(self):
        self.task_templates = self._create_task_templates()
        self.task_counter = 1
    
    def _create_task_templates(self) -> List[TaskTemplate]:
        """Create task templates for each agent type"""
        
        templates = []
        
        # Documentation Tasks (20)
        doc_templates = [
            TaskTemplate(
                TaskType.DOCUMENTATION, "DOC",
                "Generate docstrings for {file}",
                "Analyze {file_path} and generate Google-style docstrings for:\n{methods}\nEnsure docstrings document parameters, return types, and exceptions.",
                (1, 2), (1.5, 2.5), (0.85, 0.95),
                ["{file_path}"],
                ["docstring", "api_doc", "{domain}_system"]
            ),
            TaskTemplate(
                TaskType.DOCUMENTATION, "DOC",
                "Create API documentation for {module}",
                "Generate comprehensive API documentation for {module_path}:\n{classes}\nInclude method signatures, parameters, return types, and usage examples.",
                (1, 2), (2.0, 3.0), (0.88, 0.94),
                ["{module_path}"],
                ["api_doc", "documentation", "{module_name}"]
            ),
            TaskTemplate(
                TaskType.DOCUMENTATION, "DOC",
                "Document architecture decisions for {system}",
                "Document architectural decisions and patterns used in {system_name}:\n{decisions}\nInclude rationale and trade-offs.",
                (2, 3), (2.5, 4.0), (0.82, 0.90),
                ["docs/architecture/{system_name}.md"],
                ["architecture", "documentation", "adr", "{system_name}"]
            ),
            TaskTemplate(
                TaskType.DOCUMENTATION, "DOC",
                "Update changelog for {version}",
                "Update CHANGELOG.md for version {version}:\n{features}\n{bug_fixes}\n{breaking_changes}\nFollow semantic versioning format.",
                (1, 2), (1.0, 2.0), (0.90, 0.95),
                ["CHANGELOG.md"],
                ["changelog", "documentation", "release_notes", "{version}"]
            ),
        ]
        templates.extend(doc_templates)
        
        # Architecture Tasks (15)
        arch_templates = [
            TaskTemplate(
                TaskType.ARCHITECTURE, "ARCH",
                "Analyze coupling in {system}",
                "Analyze {system_path} and identify:\n1. Tight coupling between {components}\n2. Circular dependencies (if any)\n3. Violations of DRY principle\n4. Suggest refactoring approach",
                (2, 3), (2.5, 4.0), (0.80, 0.92),
                ["src/{system}/component_a.py", "src/{system}/component_b.py"],
                ["architecture", "coupling", "refactoring", "{system_name}"]
            ),
            TaskTemplate(
                TaskType.ARCHITECTURE, "ARCH",
                "Design refactoring for {module}",
                "Design refactoring approach for {module_name}:\n{current_issues}\nPropose new architecture that addresses:\n- Separation of concerns\n- Reduced coupling\n- Improved testability",
                (2, 3), (3.0, 5.0), (0.78, 0.88),
                ["src/{module_path}"],
                ["architecture", "refactoring", "design", "{module_name}"]
            ),
            TaskTemplate(
                TaskType.ARCHITECTURE, "ARCH",
                "Identify pattern violations in {system}",
                "Review {system_name} for pattern violations:\n{patterns}\nDocument violations and suggest improvements according to best practices.",
                (2, 3), (2.0, 3.5), (0.75, 0.85),
                ["{system_path}"],
                ["architecture", "patterns", "violations", "{system_name}"]
            ),
        ]
        templates.extend(arch_templates)
        
        # Genetics Tasks (15)
        gen_templates = [
            TaskTemplate(
                TaskType.GENETICS, "GEN",
                "Implement trait system for {demo}",
                "Design and implement trait system for {demo_name}:\n1. Define TraitDefinition dataclass\n2. Implement Genome class\n3. Create breeding algorithm\n4. Add trait expression logic",
                (2, 3), (3.0, 5.0), (0.78, 0.90),
                ["src/game_engine/systems/genetics/", "apps/{demo_name}/"],
                ["genetics", "trait_system", "breeding", "{demo_name}"]
            ),
            TaskTemplate(
                TaskType.GENETICS, "GEN",
                "Create breeding algorithm for {demo}",
                "Implement breeding algorithm for {demo_name}:\n{requirements}\nShould handle:\n- Parent genome combination\n- Trait inheritance (dominant/recessive)\n- Mutation probability",
                (2, 3), (2.5, 4.0), (0.80, 0.88),
                ["src/game_engine/systems/genetics/", "apps/{demo_name}/"],
                ["genetics", "breeding", "algorithm", "{demo_name}"]
            ),
            TaskTemplate(
                TaskType.GENETICS, "GEN",
                "Add inheritance rules to genetics system",
                "Implement inheritance rules for trait system:\n{rules}\nHandle:\n- Dominant/recessive traits\n- Multiple trait inheritance\n- Probability calculations",
                (2, 3), (2.0, 3.5), (0.75, 0.85),
                ["src/game_engine/systems/genetics/"],
                ["genetics", "inheritance", "rules", "trait_system"]
            ),
        ]
        templates.extend(gen_templates)
        
        # UI Tasks (15)
        ui_templates = [
            TaskTemplate(
                TaskType.UI, "UI",
                "Design {component} UI component",
                "Design UI component for {component_name}:\n{requirements}\nDeliverables:\n- UIComponent class\n- Layout configuration\n- Event handler stubs",
                (1, 2), (2.5, 4.0), (0.75, 0.88),
                ["apps/{demo_name}/ui/", "src/game_engine/ui/"],
                ["ui", "component", "design", "{component_name}"]
            ),
            TaskTemplate(
                TaskType.UI, "UI",
                "Implement layout for {screen}",
                "Implement layout for {screen_name}:\n{layout_spec}\nShould handle:\n- Responsive design\n- Component positioning\n- User interactions",
                (1, 2), (2.0, 3.5), (0.80, 0.87),
                ["apps/{demo_name}/ui/{screen_name}.py"],
                ["ui", "layout", "implementation", "{screen_name}"]
            ),
            TaskTemplate(
                TaskType.UI, "UI",
                "Add input handling to {component}",
                "Add input handling to {component_name}:\n{input_types}\nShould handle:\n- Mouse/keyboard events\n- Touch gestures\n- Input validation",
                (1, 2), (1.5, 2.5), (0.82, 0.90),
                ["apps/{demo_name}/ui/{component_name}.py"],
                ["ui", "input", "events", "{component_name}"]
            ),
        ]
        templates.extend(ui_templates)
        
        # Integration Tasks (20)
        int_templates = [
            TaskTemplate(
                TaskType.INTEGRATION, "INT",
                "Test {system_a} integration with {system_b}",
                "Verify that {system_a} integrates correctly with {system_b}:\n{test_cases}\nShould:\n- Create test entities\n- Apply operations\n- Verify no race conditions",
                (2, 3), (2.0, 3.5), (0.70, 0.87),
                ["src/game_engine/systems/{system_a}/", "src/game_engine/systems/{system_b}/"],
                ["integration", "test", "{system_a}", "{system_b}"]
            ),
            TaskTemplate(
                TaskType.INTEGRATION, "INT",
                "Validate interface between {module_a} and {module_b}",
                "Test interface compatibility between {module_a} and {module_b}:\n{interface_points}\nEnsure:\n- Method signatures match\n- Data types compatible\n- Error handling works",
                (2, 3), (1.5, 2.5), (0.75, 0.85),
                ["src/{module_a_path}", "src/{module_b_path}"],
                ["integration", "interface", "validation", "{module_a}"]
            ),
            TaskTemplate(
                TaskType.INTEGRATION, "INT",
                "Create adapter for {legacy_system}",
                "Create adapter to integrate {legacy_system} with new architecture:\n{requirements}\nShould:\n- Wrap legacy API\n- Provide modern interface\n- Handle data transformation",
                (2, 3), (3.0, 4.5), (0.72, 0.82),
                ["src/adapters/{legacy_system}_adapter.py"],
                ["integration", "adapter", "legacy", "{legacy_system}"]
            ),
        ]
        templates.extend(int_templates)
        
        # Debugging Tasks (15)
        debug_templates = [
            TaskTemplate(
                TaskType.DEBUGGING, "DBG",
                "Fix {error_type} in {system}",
                "Debug and fix {error_type} in {system_name}:\n{error_context}\nSteps:\n1. Reproduce error\n2. Identify root cause\n3. Create test case\n4. Fix the code\n5. Verify fix",
                (1, 2), (1.5, 3.0), (0.72, 0.85),
                ["src/game_engine/systems/{system_path}/{file_name}.py"],
                ["debugging", "bug_fix", "{error_type}", "{system_name}"]
            ),
            TaskTemplate(
                TaskType.DEBUGGING, "DBG",
                "Create test case for {issue}",
                "Create comprehensive test case for {issue_name}:\n{issue_description}\nTest should:\n- Reproduce the issue\n- Verify fix works\n- Prevent regression",
                (1, 2), (1.0, 2.0), (0.80, 0.90),
                ["tests/unit/systems/{system_path}/test_{issue_name}.py"],
                ["debugging", "test_case", "{issue_name}", "regression"]
            ),
            TaskTemplate(
                TaskType.DEBUGGING, "DBG",
                "Analyze performance issue in {system}",
                "Analyze performance issue in {system_name}:\n{symptoms}\nInvestigate:\n- Identify bottlenecks\n- Profile critical paths\n- Suggest optimizations",
                (2, 3), (2.0, 3.5), (0.70, 0.80),
                ["src/game_engine/systems/{system_path}/"],
                ["debugging", "performance", "optimization", "{system_name}"]
            ),
        ]
        templates.extend(debug_templates)
        
        return templates
    
    def generate_tasks(self, count: int = 100) -> List[SwarmTask]:
        """Generate specified number of test tasks"""
        
        tasks = []
        task_counts = {
            TaskType.DOCUMENTATION: 20,
            TaskType.ARCHITECTURE: 15,
            TaskType.GENETICS: 15,
            TaskType.UI: 15,
            TaskType.INTEGRATION: 20,
            TaskType.DEBUGGING: 15
        }
        
        # Validate count matches expected distribution
        total_expected = sum(task_counts.values())
        if count != total_expected:
            raise ValueError(f"Expected {total_expected} tasks, got {count}")
        
        # Generate tasks for each type
        for task_type, type_count in task_counts.items():
            type_templates = [t for t in self.task_templates if t.task_type == task_type]
            
            for i in range(type_count):
                template = random.choice(type_templates)
                task = self._create_task_from_template(template, i)
                tasks.append(task)
        
        # Add some dependencies
        self._add_dependencies(tasks)
        
        return tasks
    
    def _create_task_from_template(self, template: TaskTemplate, index: int) -> SwarmTask:
        """Create a task from template"""
        
        task_id = f"T_{template.base_id}_{index+1:03d}"
        
        # Format title and description
        title = template.title_pattern.format(
            component=f"component_{index+1}",
            demo=f"demo_{index+1}",
            error_type=f"error_type_{index+1}",
            file=f"file_{index+1}.py",
            issue=f"issue_{index+1}",
            legacy_system=f"LegacySystem_{index+1}",
            module=f"module_{index+1}",
            module_a=f"module_a_{index+1}",
            module_b=f"module_b_{index+1}",
            screen=f"screen_{index+1}",
            system=f"system_{index+1}",
            system_a=f"system_a_{index+1}",
            system_b=f"system_b_{index+1}",
            version=f"v0.{index+1}.0"
        )
        
        description = template.description_pattern.format(
            agent_type="unknown",
            breaking_changes=f"Breaking change {index+1}",
            bug_fixes=f"Bug fix {index+1}, Bug fix {index+2}",
            classes=f"Class{index+1}, Class{index+2}",
            component=f"component_{index+1}",
            component_name=f"component_{index+1}",
            components=f"ComponentA, ComponentB, ComponentC",
            count=100,
            current_issues=f"Issue 1, Issue 2, Issue 3",
            decisions=f"Decision 1, Decision 2, Decision 3",
            demo=f"demo_{index+1}",
            demo_name=f"demo_{index+1}",
            domain=f"domain_{index+1}",
            error_context=f"Error occurs when {index+1} operations",
            error_type=f"error_type_{index+1}",
            features=f"Feature {index+1}, Feature {index+2}",
            file=f"file_{index+1}.py",
            file_name=f"file_{index+1}.py",
            file_path=f"src/path/to/file_{index+1}.py",
            input_types=f"Mouse, keyboard, touch",
            interface_points=f"Method A, Method B",
            issue=f"issue_{index+1}",
            issue_description=f"Issue description for {index+1}",
            issue_name=f"issue_{index+1}",
            layout_spec=f"Grid layout with responsive design",
            legacy_system=f"LegacySystem_{index+1}",
            methods=f"method_{index+1}(), method_{index+2}()",
            module=f"module_{index+1}",
            module_a=f"module_a_{index+1}",
            module_a_path=f"modules/module_a_{index+1}",
            module_b=f"module_b_{index+1}",
            module_b_path=f"modules/module_b_{index+1}",
            module_name=f"Module {index+1}",
            module_path=f"src/modules/module_{index+1}",
            patterns=f"Pattern 1, Pattern 2",
            requirements=f"Requirement 1, Requirement 2",
            rules=f"Rule 1, Rule 2, Rule 3",
            screen=f"screen_{index+1}",
            screen_name=f"screen_{index+1}",
            symptoms=f"Symptom 1, Symptom 2",
            system=f"system_{index+1}",
            system_a=f"system_a_{index+1}",
            system_b=f"system_b_{index+1}",
            system_name=f"System {index+1}",
            system_path=f"systems/system_{index+1}",
            test_cases=f"Test case {index+1}, Test case {index+2}",
            version=f"v0.{index+1}.0"
        )
        
        # Random values within ranges
        priority = random.randint(*template.priority_range)
        estimated_hours = round(random.uniform(*template.hours_range), 1)
        confidence = round(random.uniform(*template.confidence_range), 2)
        
        # Format file references
        file_references = []
        for ref in template.file_references:
            try:
                # Try to format with all possible placeholders
                formatted_ref = ref.format(
                    file=f"file_{index+1}",
                    module_path=f"modules/module_{index+1}",
                    system_path=f"systems/system_{index+1}",
                    demo_name=f"demo_{index+1}",
                    file_name=f"file_{index+1}.py",
                    issue_name=f"issue_{index+1}",
                    system_name=f"system_{index+1}",
                    component_name=f"component_{index+1}",
                    screen_name=f"screen_{index+1}"
                )
                file_references.append(formatted_ref)
            except (KeyError, IndexError):
                # If formatting fails, just use the ref as-is
                file_references.append(ref)
        
        # Format tags
        tags = []
        for tag in template.tags:
            if tag.startswith("{") and tag.endswith("}"):
                tags.append(tag[1:-1].format(index=index+1))
            else:
                tags.append(tag)
        
        return SwarmTask(
            id=task_id,
            title=title,
            description=description,
            agent_type=template.task_type.value,
            priority=priority,
            estimated_hours=estimated_hours,
            dependencies=[],
            file_references=file_references,
            tags=tags,
            status=TaskStatus.PENDING
        )
    
    def _add_dependencies(self, tasks: List[SwarmTask]):
        """Add some dependencies between tasks"""
        
        # Create a few dependency chains
        dependency_chains = [
            # Architecture chain
            ("T_ARCH_001", ["T_ARCH_002"]),
            ("T_ARCH_002", ["T_INT_001"]),
            ("T_INT_001", ["T_DBG_002"]),
            
            # Genetics chain
            ("T_GEN_001", ["T_GEN_002"]),
            ("T_GEN_002", ["T_GEN_003"]),
            
            # UI chain
            ("T_UI_001", ["T_UI_002"]),
            ("T_UI_002", ["T_UI_003"]),
            
            # Documentation chain
            ("T_DOC_001", ["T_DOC_002"]),
            ("T_DOC_002", ["T_DOC_003"]),
        ]
        
        task_map = {task.id: task for task in tasks}
        
        for task_id, deps in dependency_chains:
            if task_id in task_map:
                task_map[task_id].dependencies = [dep for dep in deps if dep in task_map]


def get_test_tasks_100() -> List[SwarmTask]:
    """Return 100 test tasks covering all agent types"""
    generator = MockTaskGenerator()
    return generator.generate_tasks(100)


def get_test_tasks_50() -> List[SwarmTask]:
    """Return 50 test tasks (subset of 100)"""
    generator = MockTaskGenerator()
    all_tasks = generator.generate_tasks(100)
    
    # Take first 50 tasks (balanced distribution)
    return all_tasks[:50]


def get_test_tasks_10() -> List[SwarmTask]:
    """Return 10 test tasks (small validation)"""
    generator = MockTaskGenerator()
    all_tasks = generator.generate_tasks(100)
    
    # Take 2 tasks from each type for small validation
    selected = []
    type_counts = {
        TaskType.DOCUMENTATION: 0,
        TaskType.ARCHITECTURE: 0,
        TaskType.GENETICS: 0,
        TaskType.UI: 0,
        TaskType.INTEGRATION: 0,
        TaskType.DEBUGGING: 0
    }
    
    for task in all_tasks:
        task_type = TaskType(task.agent_type)
        if type_counts[task_type] < 2:
            selected.append(task)
            type_counts[task_type] += 1
        if len(selected) >= 10:
            break
    
    return selected


# Task distribution validation
def validate_task_distribution(tasks: List[SwarmTask]) -> Dict[str, Any]:
    """Validate that tasks are properly distributed"""
    
    distribution = {}
    for task in tasks:
        agent_type = task.agent_type
        distribution[agent_type] = distribution.get(agent_type, 0) + 1
    
    expected = {
        "documentation": 20,
        "architecture": 15,
        "genetics": 15,
        "ui": 15,
        "integration": 20,
        "debugging": 15
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
    # Generate and validate test tasks
    tasks_100 = get_test_tasks_100()
    validation = validate_task_distribution(tasks_100)
    
    print("100-Task Test Harness Generated")
    print(f"Validation: {'✅ PASS' if validation['matches'] else '❌ FAIL'}")
    
    if not validation['matches']:
        print("Distribution Differences:")
        for agent_type, diff in validation['differences'].items():
            print(f"  {agent_type}: Expected {diff['expected']}, Got {diff['actual']} (diff: {diff['diff']})")
    
    print(f"Total Tasks: {len(tasks_100)}")
    for agent_type, count in validation['actual'].items():
        print(f"  {agent_type}: {count} tasks")
