"""
Workflow Builder Agent - Dynamic workflow design and optimization
Creates custom workflows for any task or project requirement
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json
from datetime import datetime

from .agent_registry import AGENT_REGISTRY, AgentCapability, AgentType

logger = logging.getLogger(__name__)


class TaskComplexity(Enum):
    """Task complexity levels"""
    SIMPLE = "simple"      # 1-2 hours, single agent
    MODERATE = "moderate"  # 2-4 hours, 2-3 agents
    COMPLEX = "complex"    # 4-8 hours, 3-5 agents
    EXPERT = "expert"      # 8+ hours, 5+ agents


class WorkflowType(Enum):
    """Types of workflows"""
    DEVELOPMENT = "development"
    ANALYSIS = "analysis"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    PLANNING = "planning"
    REVIEW = "review"
    INTEGRATION = "integration"
    DEPLOYMENT = "deployment"


@dataclass
class TaskTemplate:
    """Template for common task types"""
    name: str
    description: str
    agent_type: str
    complexity: TaskComplexity
    estimated_hours: float
    dependencies: List[str] = field(default_factory=list)
    prerequisites: List[str] = field(default_factory=list)
    deliverables: List[str] = field(default_factory=list)
    quality_gates: List[str] = field(default_factory=list)


@dataclass
class WorkflowStep:
    """Individual step in a workflow"""
    id: str
    title: str
    description: str
    agent_type: str
    priority: int
    estimated_hours: float
    dependencies: List[str] = field(default_factory=list)
    complexity: TaskComplexity = TaskComplexity.MODERATE
    deliverables: List[str] = field(default_factory=list)
    quality_gates: List[str] = field(default_factory=list)
    optional: bool = False
    parallel_group: Optional[str] = None


@dataclass
class WorkflowPlan:
    """Complete workflow plan"""
    name: str
    description: str
    workflow_type: WorkflowType
    total_tasks: int
    total_estimated_hours: float
    critical_path_hours: float
    steps: List[WorkflowStep]
    agent_distribution: Dict[str, int] = field(default_factory=dict)
    risk_factors: List[str] = field(default_factory=list)
    optimization_suggestions: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


class WorkflowBuilder:
    """Intelligent workflow design and optimization agent"""
    
    def __init__(self):
        self.task_templates = self._initialize_task_templates()
        self.agent_capabilities = self._map_agent_capabilities()
        self.complexity_multipliers = {
            TaskComplexity.SIMPLE: 1.0,
            TaskComplexity.MODERATE: 1.2,
            TaskComplexity.COMPLEX: 1.5,
            TaskComplexity.EXPERT: 2.0
        }
        
    def _initialize_task_templates(self) -> Dict[str, TaskTemplate]:
        """Initialize templates for common task types"""
        
        templates = {
            # Analysis Tasks
            "analyze_requirements": TaskTemplate(
                name="Analyze Requirements",
                description="Analyze and understand project requirements",
                agent_type="analyzer",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=1.0,
                deliverables=["requirements_analysis", "stakeholder_needs", "constraints"],
                quality_gates=["requirements_complete", "stakeholder_approval"]
            ),
            
            "analyze_architecture": TaskTemplate(
                name="Analyze Architecture",
                description="Analyze current architecture and identify integration points",
                agent_type="analyzer",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=1.5,
                deliverables=["architecture_analysis", "integration_points", "technical_risks"],
                quality_gates=["architecture_complete", "risks_identified"]
            ),
            
            "analyze_codebase": TaskTemplate(
                name="Analyze Codebase",
                description="Analyze existing codebase for patterns and issues",
                agent_type="analyzer",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=2.0,
                deliverables=["codebase_analysis", "code_patterns", "technical_debt"],
                quality_gates=["analysis_complete", "patterns_identified"]
            ),
            
            # Planning Tasks
            "design_solution": TaskTemplate(
                name="Design Solution",
                description="Design technical solution and approach",
                agent_type="planner",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=2.0,
                deliverables=["solution_design", "technical_approach", "implementation_plan"],
                quality_gates=["design_complete", "approach_approved"]
            ),
            
            "plan_implementation": TaskTemplate(
                name="Plan Implementation",
                description="Create detailed implementation plan",
                agent_type="planner",
                complexity=TaskComplexity.SIMPLE,
                estimated_hours=1.0,
                deliverables=["implementation_plan", "task_breakdown", "resource_allocation"],
                quality_gates=["plan_complete", "resources_allocated"]
            ),
            
            "plan_testing": TaskTemplate(
                name="Plan Testing Strategy",
                description="Design comprehensive testing strategy",
                agent_type="planner",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=1.5,
                deliverables=["testing_strategy", "test_plan", "quality_metrics"],
                quality_gates=["strategy_complete", "metrics_defined"]
            ),
            
            # Development Tasks
            "implement_core": TaskTemplate(
                name="Implement Core Functionality",
                description="Implement core system functionality",
                agent_type="coder",
                complexity=TaskComplexity.COMPLEX,
                estimated_hours=4.0,
                deliverables=["core_implementation", "unit_tests", "documentation"],
                quality_gates=["functionality_complete", "tests_passing", "documented"]
            ),
            
            "implement_features": TaskTemplate(
                name="Implement Features",
                description="Implement specific features",
                agent_type="coder",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=3.0,
                deliverables=["feature_implementation", "feature_tests", "feature_docs"],
                quality_gates=["features_complete", "tests_passing", "documented"]
            ),
            
            "integrate_systems": TaskTemplate(
                name="Integrate Systems",
                description="Integrate multiple systems or components",
                agent_type="coder",
                complexity=TaskComplexity.COMPLEX,
                estimated_hours=3.0,
                deliverables=["integration_code", "integration_tests", "integration_docs"],
                quality_gates=["integration_complete", "tests_passing", "documented"]
            ),
            
            # Testing Tasks
            "create_tests": TaskTemplate(
                name="Create Tests",
                description="Create comprehensive test suite",
                agent_type="tester",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=2.0,
                deliverables=["test_suite", "test_data", "test_documentation"],
                quality_gates=["tests_complete", "coverage_adequate", "documented"]
            ),
            
            "execute_tests": TaskTemplate(
                name="Execute Tests",
                description="Execute test suite and validate results",
                agent_type="tester",
                complexity=TaskComplexity.SIMPLE,
                estimated_hours=1.0,
                deliverables=["test_results", "bug_reports", "quality_report"],
                quality_gates=["tests_executed", "results_analyzed", "quality_validated"]
            ),
            
            "performance_testing": TaskTemplate(
                name="Performance Testing",
                description="Execute performance and load testing",
                agent_type="tester",
                complexity=TaskComplexity.COMPLEX,
                estimated_hours=3.0,
                deliverables=["performance_results", "bottleneck_analysis", "optimization_recommendations"],
                quality_gates=["performance_tested", "bottlenecks_identified", "recommendations_provided"]
            ),
            
            # Review Tasks
            "code_review": TaskTemplate(
                name="Code Review",
                description="Review code for quality and best practices",
                agent_type="reviewer",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=1.5,
                deliverables=["review_report", "feedback_document", "quality_assessment"],
                quality_gates=["review_complete", "feedback_provided", "quality_assessed"]
            ),
            
            "architecture_review": TaskTemplate(
                name="Architecture Review",
                description="Review architecture for scalability and maintainability",
                agent_type="reviewer",
                complexity=TaskComplexity.COMPLEX,
                estimated_hours=2.0,
                deliverables=["architecture_review", "scalability_assessment", "improvement_recommendations"],
                quality_gates=["review_complete", "scalability_assessed", "recommendations_provided"]
            ),
            
            # Documentation Tasks
            "create_documentation": TaskTemplate(
                name="Create Documentation",
                description="Create comprehensive documentation",
                agent_type="archivist",
                complexity=TaskComplexity.MODERATE,
                estimated_hours=2.0,
                deliverables=["documentation", "user_guides", "api_docs"],
                quality_gates=["documentation_complete", "guides_created", "api_documented"]
            ),
            
            "update_documentation": TaskTemplate(
                name="Update Documentation",
                description="Update existing documentation",
                agent_type="archivist",
                complexity=TaskComplexity.SIMPLE,
                estimated_hours=1.0,
                deliverables=["updated_docs", "change_log", "version_notes"],
                quality_gates=["docs_updated", "changes_logged", "version_noted"]
            ),
            
            # Communication Tasks
            "announce_completion": TaskTemplate(
                name="Announce Completion",
                description="Announce project completion and achievements",
                agent_type="herald",
                complexity=TaskComplexity.SIMPLE,
                estimated_hours=0.5,
                deliverables=["announcement", "achievement_summary", "next_steps"],
                quality_gates=["announcement_sent", "achievements_summarized", "next_steps_defined"]
            )
        }
        
        return templates
    
    def _map_agent_capabilities(self) -> Dict[str, List[str]]:
        """Map agents to their primary capabilities"""
        
        return {
            "analyzer": ["analysis", "investigation", "research", "assessment"],
            "planner": ["planning", "design", "strategy", "coordination"],
            "coder": ["implementation", "development", "coding", "integration"],
            "tester": ["testing", "validation", "quality_assurance", "verification"],
            "reviewer": ["review", "audit", "assessment", "quality_control"],
            "archivist": ["documentation", "knowledge_management", "organization"],
            "herald": ["communication", "announcement", "reporting", "coordination"],
            "executor": ["execution", "deployment", "operations", "automation"],
            "strategist": ["strategy", "vision", "planning", "analysis"],
            "coordinator": ["coordination", "management", "orchestration", "leadership"]
        }
    
    def build_workflow(self, 
                      request: str,
                      context: Optional[Dict[str, Any]] = None,
                      constraints: Optional[Dict[str, Any]] = None) -> WorkflowPlan:
        """Build a custom workflow based on request and context"""
        
        logger.info(f"🔧 Building workflow for: {request}")
        
        # Parse request and determine workflow type
        workflow_type = self._determine_workflow_type(request)
        
        # Analyze complexity and scope
        complexity = self._analyze_complexity(request, context)
        
        # Generate workflow steps
        steps = self._generate_workflow_steps(request, workflow_type, complexity, context)
        
        # Optimize workflow
        optimized_steps = self._optimize_workflow(steps, constraints)
        
        # Calculate metrics
        total_tasks = len(optimized_steps)
        total_hours = sum(step.estimated_hours for step in optimized_steps)
        critical_path_hours = self._calculate_critical_path(optimized_steps)
        
        # Analyze agent distribution
        agent_distribution = self._calculate_agent_distribution(optimized_steps)
        
        # Identify risks and optimizations
        risk_factors = self._identify_risks(optimized_steps, context)
        optimization_suggestions = self._suggest_optimizations(optimized_steps, constraints)
        
        # Create workflow plan
        workflow = WorkflowPlan(
            name=self._generate_workflow_name(request),
            description=self._generate_workflow_description(request),
            workflow_type=workflow_type,
            total_tasks=total_tasks,
            total_estimated_hours=total_hours,
            critical_path_hours=critical_path_hours,
            steps=optimized_steps,
            agent_distribution=agent_distribution,
            risk_factors=risk_factors,
            optimization_suggestions=optimization_suggestions
        )
        
        logger.info(f"✅ Built workflow: {workflow.name} ({total_tasks} tasks, {total_hours:.1f} hours)")
        return workflow
    
    def _determine_workflow_type(self, request: str) -> WorkflowType:
        """Determine the type of workflow based on request"""
        
        request_lower = request.lower()
        
        if any(word in request_lower for word in ["implement", "build", "code", "develop"]):
            return WorkflowType.DEVELOPMENT
        elif any(word in request_lower for word in ["analyze", "investigate", "research"]):
            return WorkflowType.ANALYSIS
        elif any(word in request_lower for word in ["test", "validate", "verify"]):
            return WorkflowType.TESTING
        elif any(word in request_lower for word in ["document", "docs", "manual"]):
            return WorkflowType.DOCUMENTATION
        elif any(word in request_lower for word in ["plan", "design", "strategy"]):
            return WorkflowType.PLANNING
        elif any(word in request_lower for word in ["review", "audit", "assess"]):
            return WorkflowType.REVIEW
        elif any(word in request_lower for word in ["integrate", "connect", "merge"]):
            return WorkflowType.INTEGRATION
        elif any(word in request_lower for word in ["deploy", "release", "launch"]):
            return WorkflowType.DEPLOYMENT
        else:
            return WorkflowType.DEVELOPMENT  # Default
    
    def _analyze_complexity(self, request: str, context: Optional[Dict[str, Any]]) -> TaskComplexity:
        """Analyze task complexity based on request and context"""
        
        request_lower = request.lower()
        
        # Complexity indicators
        complexity_indicators = {
            TaskComplexity.SIMPLE: ["simple", "basic", "quick", "minor", "small"],
            TaskComplexity.MODERATE: ["moderate", "standard", "typical", "normal"],
            TaskComplexity.COMPLEX: ["complex", "advanced", "comprehensive", "detailed"],
            TaskComplexity.EXPERT: ["expert", "enterprise", "large-scale", "mission-critical"]
        }
        
        # Check for explicit complexity indicators
        for complexity, indicators in complexity_indicators.items():
            if any(indicator in request_lower for indicator in indicators):
                return complexity
        
        # Analyze based on scope and context
        if context:
            # Check for scale indicators
            if context.get("scale") == "large":
                return TaskComplexity.EXPERT
            elif context.get("scale") == "medium":
                return TaskComplexity.COMPLEX
            elif context.get("scale") == "small":
                return TaskComplexity.MODERATE
            
            # Check for integration complexity
            if context.get("integrations", 0) > 3:
                return TaskComplexity.EXPERT
            elif context.get("integrations", 0) > 1:
                return TaskComplexity.COMPLEX
            
            # Check for stakeholder complexity
            if context.get("stakeholders", 0) > 5:
                return TaskComplexity.EXPERT
            elif context.get("stakeholders", 0) > 2:
                return TaskComplexity.COMPLEX
        
        # Default complexity based on request length and keywords
        if len(request) > 200 or "system" in request_lower or "architecture" in request_lower:
            return TaskComplexity.COMPLEX
        elif len(request) > 100 or "feature" in request_lower or "component" in request_lower:
            return TaskComplexity.MODERATE
        else:
            return TaskComplexity.SIMPLE
    
    def _generate_workflow_steps(self, 
                                request: str,
                                workflow_type: WorkflowType,
                                complexity: TaskComplexity,
                                context: Optional[Dict[str, Any]]) -> List[WorkflowStep]:
        """Generate workflow steps based on request and workflow type"""
        
        steps = []
        step_counter = 1
        
        # Common step patterns by workflow type
        if workflow_type == WorkflowType.DEVELOPMENT:
            steps.extend(self._generate_development_steps(request, complexity, context, step_counter))
        elif workflow_type == WorkflowType.ANALYSIS:
            steps.extend(self._generate_analysis_steps(request, complexity, context, step_counter))
        elif workflow_type == WorkflowType.TESTING:
            steps.extend(self._generate_testing_steps(request, complexity, context, step_counter))
        elif workflow_type == WorkflowType.DOCUMENTATION:
            steps.extend(self._generate_documentation_steps(request, complexity, context, step_counter))
        elif workflow_type == WorkflowType.PLANNING:
            steps.extend(self._generate_planning_steps(request, complexity, context, step_counter))
        elif workflow_type == WorkflowType.REVIEW:
            steps.extend(self._generate_review_steps(request, complexity, context, step_counter))
        elif workflow_type == WorkflowType.INTEGRATION:
            steps.extend(self._generate_integration_steps(request, complexity, context, step_counter))
        elif workflow_type == WorkflowType.DEPLOYMENT:
            steps.extend(self._generate_deployment_steps(request, complexity, context, step_counter))
        else:
            # Default to development workflow
            steps.extend(self._generate_development_steps(request, complexity, context, step_counter))
        
        return steps
    
    def _generate_development_steps(self, 
                                  request: str,
                                  complexity: TaskComplexity,
                                  context: Optional[Dict[str, Any]],
                                  start_counter: int) -> List[WorkflowStep]:
        """Generate development workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Step 1: Requirements Analysis
        if "analyze_requirements" in self.task_templates:
            template = self.task_templates["analyze_requirements"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=1,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 2: Architecture Analysis (if complex)
        if complexity in [TaskComplexity.COMPLEX, TaskComplexity.EXPERT]:
            if "analyze_architecture" in self.task_templates:
                template = self.task_templates["analyze_architecture"]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=2,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        # Step 3: Solution Design
        if "design_solution" in self.task_templates:
            template = self.task_templates["design_solution"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=3,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 4: Implementation Planning
        if "plan_implementation" in self.task_templates:
            template = self.task_templates["plan_implementation"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=4,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 5: Core Implementation
        if "implement_core" in self.task_templates:
            template = self.task_templates["implement_core"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=5,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 6: Feature Implementation (if needed)
        if complexity in [TaskComplexity.MODERATE, TaskComplexity.COMPLEX, TaskComplexity.EXPERT]:
            if "implement_features" in self.task_templates:
                template = self.task_templates["implement_features"]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=6,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        # Step 7: Testing Strategy
        if "plan_testing" in self.task_templates:
            template = self.task_templates["plan_testing"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=7,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-2}"],  # Can start after core implementation
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 8: Test Creation
        if "create_tests" in self.task_templates:
            template = self.task_templates["create_tests"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=8,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 9: Code Review
        if "code_review" in self.task_templates:
            template = self.task_templates["code_review"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=9,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-3}"],  # After implementation
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 10: Test Execution
        if "execute_tests" in self.task_templates:
            template = self.task_templates["execute_tests"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=10,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-2}"],  # After test creation
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        # Step 11: Documentation (optional)
        if complexity in [TaskComplexity.COMPLEX, TaskComplexity.EXPERT]:
            if "create_documentation" in self.task_templates:
                template = self.task_templates["create_documentation"]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=11,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates,
                    optional=True
                ))
                counter += 1
        
        # Step 12: Announcement
        if "announce_completion" in self.task_templates:
            template = self.task_templates["announce_completion"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=12,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        return steps
    
    def _generate_analysis_steps(self, 
                                request: str,
                                complexity: TaskComplexity,
                                context: Optional[Dict[str, Any]],
                                start_counter: int) -> List[WorkflowStep]:
        """Generate analysis workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Analysis-specific steps
        analysis_templates = [
            ("analyze_requirements", 1),
            ("analyze_codebase", 2),
            ("analyze_architecture", 3)
        ]
        
        for template_name, priority in analysis_templates:
            if template_name in self.task_templates:
                template = self.task_templates[template_name]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=priority,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"] if counter > start_counter else [],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        # Add review and documentation
        if "code_review" in self.task_templates:
            template = self.task_templates["code_review"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=4,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        if "create_documentation" in self.task_templates:
            template = self.task_templates["create_documentation"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=5,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        return steps
    
    def _generate_testing_steps(self, 
                               request: str,
                               complexity: TaskComplexity,
                               context: Optional[Dict[str, Any]],
                               start_counter: int) -> List[WorkflowStep]:
        """Generate testing workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Testing-specific steps
        testing_templates = [
            ("plan_testing", 1),
            ("create_tests", 2),
            ("execute_tests", 3)
        ]
        
        for template_name, priority in testing_templates:
            if template_name in self.task_templates:
                template = self.task_templates[template_name]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=priority,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"] if counter > start_counter else [],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        # Add performance testing for complex workflows
        if complexity in [TaskComplexity.COMPLEX, TaskComplexity.EXPERT]:
            if "performance_testing" in self.task_templates:
                template = self.task_templates["performance_testing"]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=4,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        return steps
    
    def _generate_documentation_steps(self, 
                                    request: str,
                                    complexity: TaskComplexity,
                                    context: Optional[Dict[str, Any]],
                                    start_counter: int) -> List[WorkflowStep]:
        """Generate documentation workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Documentation-specific steps
        if "create_documentation" in self.task_templates:
            template = self.task_templates["create_documentation"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=1,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        if "update_documentation" in self.task_templates:
            template = self.task_templates["update_documentation"]
            steps.append(WorkflowStep(
                id=f"step_{counter}",
                title=template.name,
                description=template.description,
                agent_type=template.agent_type,
                priority=2,
                estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                dependencies=[f"step_{counter-1}"],
                deliverables=template.deliverables,
                quality_gates=template.quality_gates
            ))
            counter += 1
        
        return steps
    
    def _generate_planning_steps(self, 
                               request: str,
                               complexity: TaskComplexity,
                               context: Optional[Dict[str, Any]],
                               start_counter: int) -> List[WorkflowStep]:
        """Generate planning workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Planning-specific steps
        planning_templates = [
            ("analyze_requirements", 1),
            ("design_solution", 2),
            ("plan_implementation", 3),
            ("plan_testing", 4)
        ]
        
        for template_name, priority in planning_templates:
            if template_name in self.task_templates:
                template = self.task_templates[template_name]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=priority,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"] if counter > start_counter else [],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        return steps
    
    def _generate_review_steps(self, 
                              request: str,
                              complexity: TaskComplexity,
                              context: Optional[Dict[str, Any]],
                              start_counter: int) -> List[WorkflowStep]:
        """Generate review workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Review-specific steps
        review_templates = [
            ("analyze_codebase", 1),
            ("code_review", 2)
        ]
        
        for template_name, priority in review_templates:
            if template_name in self.task_templates:
                template = self.task_templates[template_name]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=priority,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"] if counter > start_counter else [],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        # Add architecture review for complex workflows
        if complexity in [TaskComplexity.COMPLEX, TaskComplexity.EXPERT]:
            if "architecture_review" in self.task_templates:
                template = self.task_templates["architecture_review"]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=3,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        return steps
    
    def _generate_integration_steps(self, 
                                   request: str,
                                   complexity: TaskComplexity,
                                   context: Optional[Dict[str, Any]],
                                   start_counter: int) -> List[WorkflowStep]:
        """Generate integration workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Integration-specific steps
        integration_templates = [
            ("analyze_architecture", 1),
            ("design_solution", 2),
            ("integrate_systems", 3),
            ("create_tests", 4),
            ("execute_tests", 5)
        ]
        
        for template_name, priority in integration_templates:
            if template_name in self.task_templates:
                template = self.task_templates[template_name]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=priority,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"] if counter > start_counter else [],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        return steps
    
    def _generate_deployment_steps(self, 
                                  request: str,
                                  complexity: TaskComplexity,
                                  context: Optional[Dict[str, Any]],
                                  start_counter: int) -> List[WorkflowStep]:
        """Generate deployment workflow steps"""
        
        steps = []
        counter = start_counter
        
        # Deployment-specific steps
        deployment_templates = [
            ("plan_implementation", 1),
            ("create_tests", 2),
            ("execute_tests", 3)
        ]
        
        for template_name, priority in deployment_templates:
            if template_name in self.task_templates:
                template = self.task_templates[template_name]
                steps.append(WorkflowStep(
                    id=f"step_{counter}",
                    title=template.name,
                    description=template.description,
                    agent_type=template.agent_type,
                    priority=priority,
                    estimated_hours=template.estimated_hours * self.complexity_multipliers[complexity],
                    dependencies=[f"step_{counter-1}"] if counter > start_counter else [],
                    deliverables=template.deliverables,
                    quality_gates=template.quality_gates
                ))
                counter += 1
        
        return steps
    
    def _optimize_workflow(self, 
                          steps: List[WorkflowStep],
                          constraints: Optional[Dict[str, Any]]) -> List[WorkflowStep]:
        """Optimize workflow based on constraints and best practices"""
        
        optimized_steps = steps.copy()
        
        # Apply constraint-based optimizations
        if constraints:
            # Time constraint optimization
            if "max_hours" in constraints:
                optimized_steps = self._optimize_for_time(optimized_steps, constraints["max_hours"])
            
            # Resource constraint optimization
            if "max_agents" in constraints:
                optimized_steps = self._optimize_for_resources(optimized_steps, constraints["max_agents"])
            
            # Quality constraint optimization
            if "quality_level" in constraints:
                optimized_steps = self._optimize_for_quality(optimized_steps, constraints["quality_level"])
        
        # Apply general optimizations
        optimized_steps = self._optimize_dependencies(optimized_steps)
        optimized_steps = self._optimize_parallel_execution(optimized_steps)
        
        return optimized_steps
    
    def _optimize_for_time(self, steps: List[WorkflowStep], max_hours: float) -> List[WorkflowStep]:
        """Optimize workflow for time constraints"""
        
        current_total = sum(step.estimated_hours for step in steps)
        
        if current_total <= max_hours:
            return steps
        
        # Reduce optional tasks first
        for step in steps:
            if step.optional and step.estimated_hours > 0:
                reduction = min(step.estimated_hours * 0.5, current_total - max_hours)
                step.estimated_hours -= reduction
                current_total -= reduction
                
                if current_total <= max_hours:
                    break
        
        # If still over limit, reduce all tasks proportionally
        if current_total > max_hours:
            reduction_factor = max_hours / current_total
            for step in steps:
                step.estimated_hours *= reduction_factor
        
        return steps
    
    def _optimize_for_resources(self, steps: List[WorkflowStep], max_agents: int) -> List[WorkflowStep]:
        """Optimize workflow for resource constraints"""
        
        # Count unique agent types
        agent_types = set(step.agent_type for step in steps)
        
        if len(agent_types) <= max_agents:
            return steps
        
        # Consolidate similar agent types
        agent_consolidation = {
            "analyzer": "strategist",
            "planner": "strategist",
            "reviewer": "analyzer"
        }
        
        for step in steps:
            if step.agent_type in agent_consolidation:
                step.agent_type = agent_consolidation[step.agent_type]
        
        return steps
    
    def _optimize_for_quality(self, steps: List[WorkflowStep], quality_level: str) -> List[WorkflowStep]:
        """Optimize workflow for quality requirements"""
        
        if quality_level == "high":
            # Add more review steps
            review_steps = [step for step in steps if step.agent_type == "reviewer"]
            for review_step in review_steps:
                # Duplicate review step for additional quality assurance
                additional_review = WorkflowStep(
                    id=f"{review_step.id}_qa",
                    title=f"QA {review_step.title}",
                    description=review_step.description,
                    agent_type="reviewer",
                    priority=review_step.priority + 1,
                    estimated_hours=review_step.estimated_hours * 0.5,
                    dependencies=[review_step.id],
                    deliverables=review_step.deliverables,
                    quality_gates=review_step.quality_gates
                )
                steps.append(additional_review)
        
        elif quality_level == "basic":
            # Remove optional review steps
            steps = [step for step in steps if not (step.optional and step.agent_type == "reviewer")]
        
        return steps
    
    def _optimize_dependencies(self, steps: List[WorkflowStep]) -> List[WorkflowStep]:
        """Optimize task dependencies for better parallelization"""
        
        # Remove unnecessary dependencies
        for step in steps:
            optimized_deps = []
            for dep_id in step.dependencies:
                # Keep dependency only if it's truly necessary
                if self._is_dependency_necessary(step, dep_id, steps):
                    optimized_deps.append(dep_id)
            step.dependencies = optimized_deps
        
        return steps
    
    def _optimize_parallel_execution(self, steps: List[WorkflowStep]) -> List[WorkflowStep]:
        """Identify and mark tasks that can be executed in parallel"""
        
        # Group tasks by dependency level
        dependency_levels = self._calculate_dependency_levels(steps)
        
        # Assign parallel groups
        for level, task_ids in dependency_levels.items():
            if len(task_ids) > 1:
                # Tasks at the same level can be parallel
                parallel_group = f"parallel_{level}"
                for task_id in task_ids:
                    for step in steps:
                        if step.id == task_id:
                            step.parallel_group = parallel_group
                            break
        
        return steps
    
    def _is_dependency_necessary(self, step: WorkflowStep, dep_id: str, all_steps: List[WorkflowStep]) -> bool:
        """Check if a dependency is truly necessary"""
        
        # Find the dependency step
        dep_step = None
        for s in all_steps:
            if s.id == dep_id:
                dep_step = s
                break
        
        if not dep_step:
            return False
        
        # Check if tasks use different agents (can be parallel)
        if step.agent_type != dep_step.agent_type:
            return False
        
        # Check if dependency is for quality gate
        if dep_step.quality_gates and any(gate in step.description.lower() for gate in dep_step.quality_gates):
            return True
        
        return True
    
    def _calculate_dependency_levels(self, steps: List[WorkflowStep]) -> Dict[int, List[str]]:
        """Calculate dependency levels for parallel execution"""
        
        levels = {}
        remaining_steps = steps.copy()
        current_level = 0
        
        while remaining_steps:
            tasks_at_level = []
            
            for step in remaining_steps:
                # Check if all dependencies are resolved
                deps_resolved = all(
                    dep_id not in [s.id for s in remaining_steps]
                    for dep_id in step.dependencies
                )
                
                if deps_resolved:
                    tasks_at_level.append(step.id)
            
            if not tasks_at_level:
                # Circular dependency - break it
                for step in remaining_steps:
                    if step.dependencies:
                        step.dependencies = []
                        tasks_at_level.append(step.id)
                        break
            
            levels[current_level] = tasks_at_level
            
            # Remove processed tasks
            remaining_steps = [s for s in remaining_steps if s.id not in tasks_at_level]
            current_level += 1
        
        return levels
    
    def _calculate_critical_path(self, steps: List[WorkflowStep]) -> float:
        """Calculate critical path hours"""
        
        # Build dependency graph
        step_map = {step.id: step for step in steps}
        
        def calculate_path_hours(step_id: str, visited: set = None) -> float:
            if visited is None:
                visited = set()
            
            if step_id in visited:
                return 0  # Circular dependency
            
            visited.add(step_id)
            step = step_map[step_id]
            
            if not step.dependencies:
                return step.estimated_hours
            
            max_dep_hours = 0
            for dep_id in step.dependencies:
                dep_hours = calculate_path_hours(dep_id, visited.copy())
                max_dep_hours = max(max_dep_hours, dep_hours)
            
            return step.estimated_hours + max_dep_hours
        
        # Find the longest path
        max_hours = 0
        for step_id in step_map:
            path_hours = calculate_path_hours(step_id)
            max_hours = max(max_hours, path_hours)
        
        return max_hours
    
    def _calculate_agent_distribution(self, steps: List[WorkflowStep]) -> Dict[str, int]:
        """Calculate distribution of tasks across agents"""
        
        distribution = {}
        for step in steps:
            agent_type = step.agent_type
            distribution[agent_type] = distribution.get(agent_type, 0) + 1
        
        return distribution
    
    def _identify_risks(self, steps: List[WorkflowStep], context: Optional[Dict[str, Any]]) -> List[str]:
        """Identify potential risks in the workflow"""
        
        risks = []
        
        # Check for long-running tasks
        for step in steps:
            if step.estimated_hours > 8:
                risks.append(f"Long-running task: {step.title} ({step.estimated_hours:.1f} hours)")
        
        # Check for complex dependencies
        max_deps = max(len(step.dependencies) for step in steps) if steps else 0
        if max_deps > 3:
            risks.append(f"Complex dependencies: some tasks have {max_deps} dependencies")
        
        # Check for single points of failure
        agent_counts = self._calculate_agent_distribution(steps)
        for agent, count in agent_counts.items():
            if count > len(steps) * 0.5:  # More than 50% of tasks
                risks.append(f"Agent concentration: {agent} handles {count} tasks")
        
        # Context-based risks
        if context:
            if context.get("integrations", 0) > 2:
                risks.append("High integration complexity")
            if context.get("stakeholders", 0) > 5:
                risks.append("Many stakeholders may cause delays")
        
        return risks
    
    def _suggest_optimizations(self, steps: List[WorkflowStep], constraints: Optional[Dict[str, Any]]) -> List[str]:
        """Suggest workflow optimizations"""
        
        suggestions = []
        
        # Parallel execution opportunities
        parallel_groups = set(step.parallel_group for step in steps if step.parallel_group)
        if len(parallel_groups) > 1:
            suggestions.append(f"Can execute {len(parallel_groups)} task groups in parallel")
        
        # Optional tasks
        optional_tasks = [step for step in steps if step.optional]
        if optional_tasks:
            suggestions.append(f"Consider skipping {len(optional_tasks)} optional tasks to save time")
        
        # Agent utilization
        agent_counts = self._calculate_agent_distribution(steps)
        underutilized = [agent for agent, count in agent_counts.items() if count == 1]
        if underutilized:
            suggestions.append(f"Agents with minimal workload: {', '.join(underutilized)}")
        
        # Quality gates
        quality_gates = sum(len(step.quality_gates) for step in steps)
        if quality_gates > len(steps) * 2:
            suggestions.append("Consider reducing quality gates for faster delivery")
        
        return suggestions
    
    def _generate_workflow_name(self, request: str) -> str:
        """Generate a descriptive workflow name"""
        
        # Extract key terms from request
        request_lower = request.lower()
        
        if "ecs" in request_lower and "rendering" in request_lower:
            return "ECS Rendering System Workflow"
        elif "dungeon" in request_lower:
            return "Dungeon Demo Workflow"
        elif "tower defense" in request_lower:
            return "Tower Defense Workflow"
        elif "integration" in request_lower:
            return "System Integration Workflow"
        elif "testing" in request_lower:
            return "Testing Strategy Workflow"
        elif "documentation" in request_lower:
            return "Documentation Workflow"
        elif "analysis" in request_lower:
            return "Analysis Workflow"
        else:
            # Generate generic name
            words = request.split()[:3]  # First 3 words
            return f"{' '.join(words).title()} Workflow"
    
    def _generate_workflow_description(self, request: str) -> str:
        """Generate workflow description"""
        
        return f"Automatically generated workflow for: {request}"
    
    def export_workflow(self, workflow: WorkflowPlan, format: str = "json") -> str:
        """Export workflow in specified format"""
        
        if format == "json":
            return self._export_json(workflow)
        elif format == "yaml":
            return self._export_yaml(workflow)
        elif format == "markdown":
            return self._export_markdown(workflow)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def _export_json(self, workflow: WorkflowPlan) -> str:
        """Export workflow as JSON"""
        
        workflow_dict = {
            "name": workflow.name,
            "description": workflow.description,
            "workflow_type": workflow.workflow_type.value,
            "total_tasks": workflow.total_tasks,
            "total_estimated_hours": workflow.total_estimated_hours,
            "critical_path_hours": workflow.critical_path_hours,
            "agent_distribution": workflow.agent_distribution,
            "risk_factors": workflow.risk_factors,
            "optimization_suggestions": workflow.optimization_suggestions,
            "steps": [
                {
                    "id": step.id,
                    "title": step.title,
                    "description": step.description,
                    "agent_type": step.agent_type,
                    "priority": step.priority,
                    "estimated_hours": step.estimated_hours,
                    "dependencies": step.dependencies,
                    "complexity": step.complexity.value,
                    "deliverables": step.deliverables,
                    "quality_gates": step.quality_gates,
                    "optional": step.optional,
                    "parallel_group": step.parallel_group
                }
                for step in workflow.steps
            ]
        }
        
        return json.dumps(workflow_dict, indent=2)
    
    def _export_yaml(self, workflow: WorkflowPlan) -> str:
        """Export workflow as YAML"""
        
        # Simple YAML export (would use yaml library in production)
        yaml_lines = [
            f"name: {workflow.name}",
            f"description: {workflow.description}",
            f"workflow_type: {workflow.workflow_type.value}",
            f"total_tasks: {workflow.total_tasks}",
            f"total_estimated_hours: {workflow.total_estimated_hours}",
            f"critical_path_hours: {workflow.critical_path_hours}",
            "",
            "steps:"
        ]
        
        for step in workflow.steps:
            yaml_lines.extend([
                f"  - id: {step.id}",
                f"    title: {step.title}",
                f"    agent_type: {step.agent_type}",
                f"    priority: {step.priority}",
                f"    estimated_hours: {step.estimated_hours}",
                f"    dependencies: {step.dependencies}",
                ""
            ])
        
        return "\n".join(yaml_lines)
    
    def _export_markdown(self, workflow: WorkflowPlan) -> str:
        """Export workflow as Markdown"""
        
        md_lines = [
            f"# {workflow.name}",
            "",
            f"**Description**: {workflow.description}",
            f"**Type**: {workflow.workflow_type.value}",
            f"**Tasks**: {workflow.total_tasks}",
            f"**Estimated Hours**: {workflow.total_estimated_hours:.1f}",
            f"**Critical Path**: {workflow.critical_path_hours:.1f} hours",
            "",
            "## Agent Distribution",
            ""
        ]
        
        for agent, count in workflow.agent_distribution.items():
            md_lines.append(f"- **{agent}**: {count} tasks")
        
        md_lines.extend([
            "",
            "## Workflow Steps",
            ""
        ])
        
        for i, step in enumerate(workflow.steps, 1):
            md_lines.extend([
                f"### {i}. {step.title}",
                "",
                f"**Agent**: {step.agent_type}",
                f"**Priority**: {step.priority}",
                f"**Estimated**: {step.estimated_hours:.1f} hours",
                f"**Dependencies**: {', '.join(step.dependencies) if step.dependencies else 'None'}",
                f"**Description**: {step.description}",
                ""
            ])
            
            if step.deliverables:
                md_lines.extend([
                    "**Deliverables**:",
                    *[f"- {deliverable}" for deliverable in step.deliverables],
                    ""
                ])
            
            if step.quality_gates:
                md_lines.extend([
                    "**Quality Gates**:",
                    *[f"- {gate}" for gate in step.quality_gates],
                    ""
                ])
        
        if workflow.risk_factors:
            md_lines.extend([
                "## Risk Factors",
                *[f"- {risk}" for risk in workflow.risk_factors],
                ""
            ])
        
        if workflow.optimization_suggestions:
            md_lines.extend([
                "## Optimization Suggestions",
                *[f"- {suggestion}" for suggestion in workflow.optimization_suggestions],
                ""
            ])
        
        return "\n".join(md_lines)


# Global workflow builder instance
WORKFLOW_BUILDER = WorkflowBuilder()
