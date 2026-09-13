"""
Project Analyzer - Auto-detects work from project documentation
Analyzes docs, blockers, and project state to determine what needs to be done
"""

import logging
import os
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import json

from .agent_registry import AGENT_REGISTRY
from .workflow_builder import WORKFLOW_BUILDER
from .autonomous_swarm import AUTONOMOUS_SWARM
from .task_validator import TASK_VALIDATOR

logger = logging.getLogger(__name__)


class ProjectState(Enum):
    """Project completion states"""
    BLOCKED = "blocked"
    IN_PROGRESS = "in_progress"
    INCOMPLETE = "incomplete"
    COMPLETE = "complete"
    MISSING = "missing"


class Priority(Enum):
    """Task priority levels"""
    CRITICAL = 1  # Blocking other work
    HIGH = 2      # Important for current phase
    MEDIUM = 3    # Nice to have
    LOW = 4       # Can wait


@dataclass
class ProjectIssue:
    """Issue detected in project"""
    title: str
    description: str
    location: str  # File or section where found
    priority: Priority
    state: ProjectState
    impact: List[str]  # What this blocks
    suggested_action: str
    confidence: float  # 0.0-1.0 how certain we are


@dataclass
class WorkRecommendation:
    """Recommended work to be done"""
    title: str
    description: str
    priority: Priority
    estimated_hours: float
    agent_types: List[str]
    dependencies: List[str]
    rationale: str
    auto_execute: bool = False  # Can this be started automatically?


class ProjectAnalyzer:
    """Analyzes project state and auto-detects required work"""
    
    def __init__(self, project_root: str):
        self.project_root = project_root
        self.issues: List[ProjectIssue] = []
        self.recommendations: List[WorkRecommendation] = []
        self.project_state = {}
        
        # Patterns for detecting issues
        self.blocker_patterns = [
            r"BLOCKED|blocked|blocking",
            r"MISSING|missing|absent",
            r"INCOMPLETE|incomplete|unfinished",
            r"TODO|FIXME|HACK",
            r"BUG|error|issue|problem",
            r"FAILED|failed|failure"
        ]
        
        self.goal_patterns = [
            r"GOAL|target|objective",
            r"COMPLETE|complete|finish",
            r"ACHIEVE|achieve|accomplish"
        ]
        
        self.system_patterns = [
            r"system|component|module",
            r"architecture|design|structure",
            r"implementation|code|develop"
        ]
    
    def analyze_project(self) -> Dict[str, Any]:
        """Comprehensive project analysis"""
        
        logger.info("🔍 Starting comprehensive project analysis")
        
        # Analyze different aspects
        self._analyze_documentation()
        self._analyze_project_status()
        self._analyze_blockers()
        self._analyze_goals()
        self._analyze_systems()
        
        # Generate recommendations
        self._generate_recommendations()
        
        # Create analysis report
        analysis_report = {
            "timestamp": datetime.now().isoformat(),
            "issues_detected": len(self.issues),
            "recommendations": len(self.recommendations),
            "critical_issues": len([i for i in self.issues if i.priority == Priority.CRITICAL]),
            "high_priority_issues": len([i for i in self.issues if i.priority == Priority.HIGH]),
            "auto_executable_tasks": len([r for r in self.recommendations if r.auto_execute]),
            "project_health": self._calculate_project_health(),
            "issues": [self._serialize_issue(issue) for issue in self.issues],
            "recommendations": [self._serialize_recommendation(rec) for rec in self.recommendations]
        }
        
        logger.info(f"✅ Analysis complete: {len(self.issues)} issues, {len(self.recommendations)} recommendations")
        return analysis_report
    
    def _analyze_documentation(self):
        """Analyze project documentation for issues"""
        
        doc_files = [
            "VISION.md",
            "TASKS.md", 
            "MILESTONES.md",
            "README.md",
            "docs/PROJECT_STATUS.md",
            "docs/TECHNICAL_DESIGN.md"
        ]
        
        for doc_file in doc_files:
            doc_path = os.path.join(self.project_root, doc_file)
            if os.path.exists(doc_path):
                self._analyze_file(doc_path, "documentation")
    
    def _analyze_project_status(self):
        """Analyze current project status"""
        
        # Look for project status files
        status_files = [
            "docs/PROJECT_STATUS.md",
            "docs/project_status.json",
            "status.md"
        ]
        
        for status_file in status_files:
            status_path = os.path.join(self.project_root, status_file)
            if os.path.exists(status_path):
                self._analyze_file(status_path, "project_status")
    
    def _analyze_blockers(self):
        """Identify current blockers"""
        
        # Look for blocker mentions in docs
        for root, dirs, files in os.walk(self.project_root):
            # Skip certain directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', '.git']]
            
            for file in files:
                # Only analyze relevant file types
                if not file.endswith(('.md', '.txt', '.json', '.py', '.yaml', '.yml')):
                    continue
                
                # Skip certain files
                if file.startswith(('session_', 'test_', '.', '~')):
                    continue
                
                file_path = os.path.join(root, file)
                self._analyze_file(file_path, "blockers")
    
    def _analyze_goals(self):
        """Analyze project goals and completion status"""
        
        # Look for goal definitions
        goal_files = [
            "VISION.md",
            "TASKS.md",
            "MILESTONES.md",
            "docs/GOALS.md"
        ]
        
        for goal_file in goal_files:
            goal_path = os.path.join(self.project_root, goal_file)
            if os.path.exists(goal_path):
                self._analyze_file(goal_path, "goals")
    
    def _analyze_systems(self):
        """Analyze system components and their status"""
        
        # Look for system documentation
        system_files = [
            "docs/TECHNICAL_DESIGN.md",
            "docs/ARCHITECTURE.md",
            "docs/SYSTEMS.md"
        ]
        
        for system_file in system_files:
            system_path = os.path.join(self.project_root, system_file)
            if os.path.exists(system_path):
                self._analyze_file(system_path, "systems")
    
    def _analyze_file(self, file_path: str, analysis_type: str):
        """Analyze a single file for issues"""
        
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            content = None
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue
            
            if content is None:
                logger.warning(f"Could not decode {file_path} with any encoding")
                return
            
            relative_path = os.path.relpath(file_path, self.project_root)
            
            if analysis_type == "blockers":
                self._find_blockers(content, relative_path)
            elif analysis_type == "goals":
                self._find_goals(content, relative_path)
            elif analysis_type == "systems":
                self._find_system_issues(content, relative_path)
            elif analysis_type == "project_status":
                self._parse_project_status(content, relative_path)
            else:
                self._find_general_issues(content, relative_path)
                
        except Exception as e:
            logger.warning(f"Failed to analyze {file_path}: {e}")
    
    def _find_blockers(self, content: str, file_path: str):
        """Find blocker mentions in content"""
        
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            # Skip lines that are too short or clearly not blockers
            if len(line.strip()) < 10:
                continue
                
            # Skip lines that are clearly code comments or debug output
            if line.strip().startswith(('#', '//', 'print(', 'logger.', '"""', "'''")):
                continue
                
            # Skip lines that are clearly variable assignments or function definitions
            if any(pattern in line for pattern in ['=', 'def ', 'class ', 'import ', 'from ']):
                continue
                
            # Only look for actual blocker patterns in meaningful text
            for pattern in self.blocker_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    # Extract the blocker description
                    blocker_text = line.strip()
                    if blocker_text.startswith(('•', '-', '*', '#')):
                        blocker_text = blocker_text[1:].strip()
                    
                    # Skip if it's clearly not a real blocker
                    if len(blocker_text) < 5 or blocker_text.startswith(('logger.', 'print(', 'return ', 'if ')):
                        continue
                    
                    # Validate that this is a real task, not a code fragment
                    validation = TASK_VALIDATOR.is_valid_task(
                        f"Blocker: {blocker_text}",
                        blocker_text,
                        f"{file_path}:{i}"
                    )
                    
                    if not validation.is_valid:
                        # Skip false positives
                        logger.debug(f"Skipping false positive: {blocker_text[:50]}... - {validation.reason}")
                        continue
                    
                    # Determine priority
                    priority = self._determine_priority(blocker_text)
                    
                    # Only process if it's actually critical
                    if priority == Priority.CRITICAL:
                        # Determine what it blocks
                        impact = self._extract_impact(blocker_text, content)
                        
                        issue = ProjectIssue(
                            title=f"Blocker: {blocker_text[:50]}...",
                            description=blocker_text,
                            location=f"{file_path}:{i}",
                            priority=priority,
                            state=ProjectState.BLOCKED,
                            impact=impact,
                            suggested_action=self._suggest_blocker_action(blocker_text),
                            confidence=0.8
                        )
                        
                        self.issues.append(issue)
    
    def _find_goals(self, content: str, file_path: str):
        """Find goal completion status"""
        
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            # Look for incomplete goals
            if re.search(r'INCOMPLETE|incomplete|unfinished', line, re.IGNORECASE):
                goal_text = line.strip()
                if goal_text.startswith(('•', '-', '*', '#')):
                    goal_text = goal_text[1:].strip()
                
                issue = ProjectIssue(
                    title=f"Incomplete Goal: {goal_text[:50]}...",
                    description=goal_text,
                    location=f"{file_path}:{i}",
                    priority=Priority.HIGH,
                    state=ProjectState.INCOMPLETE,
                    impact=["project_progress", "milestone_completion"],
                    suggested_action="Complete the identified goal",
                    confidence=0.7
                )
                
                self.issues.append(issue)
    
    def _find_system_issues(self, content: str, file_path: str):
        """Find system component issues"""
        
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            # Look for missing or incomplete systems
            if re.search(r'MISSING|missing|absent|incomplete', line, re.IGNORECASE):
                if any(word in line.lower() for word in ['system', 'component', 'module']):
                    system_text = line.strip()
                    if system_text.startswith(('•', '-', '*', '#')):
                        system_text = system_text[1:].strip()
                    
                    issue = ProjectIssue(
                        title=f"System Issue: {system_text[:50]}...",
                        description=system_text,
                        location=f"{file_path}:{i}",
                        priority=Priority.HIGH,
                        state=ProjectState.MISSING,
                        impact=["system_functionality", "integration"],
                        suggested_action="Implement or complete the missing system",
                        confidence=0.6
                    )
                    
                    self.issues.append(issue)
    
    def _parse_project_status(self, content: str, file_path: str):
        """Parse structured project status"""
        
        # Try to parse as JSON first
        try:
            if file_path.endswith('.json'):
                status_data = json.loads(content)
                self._process_status_json(status_data, file_path)
                return
        except json.JSONDecodeError:
            pass
        
        # Parse markdown status
        self._process_status_markdown(content, file_path)
    
    def _process_status_json(self, status_data: Dict, file_path: str):
        """Process JSON status data"""
        
        # Look for blockers
        if 'blockers' in status_data:
            for blocker in status_data['blockers']:
                if isinstance(blocker, dict):
                    blocker_text = blocker.get('blocker', str(blocker))
                    impact = blocker.get('blocks', [])
                else:
                    blocker_text = str(blocker)
                    impact = []
                
                issue = ProjectIssue(
                    title=f"Blocker: {blocker_text[:50]}...",
                    description=blocker_text,
                    location=file_path,
                    priority=Priority.CRITICAL,
                    state=ProjectState.BLOCKED,
                    impact=impact,
                    suggested_action="Resolve the identified blocker",
                    confidence=0.9
                )
                
                self.issues.append(issue)
        
        # Look for incomplete demos/systems
        for section in ['demos', 'systems', 'goals']:
            if section in status_data:
                for key, value in status_data[section].items():
                    if isinstance(value, str) and 'INCOMPLETE' in value:
                        issue = ProjectIssue(
                            title=f"Incomplete {section[:-1]}: {key}",
                            description=f"{key} is marked as {value}",
                            location=file_path,
                            priority=Priority.HIGH,
                            state=ProjectState.INCOMPLETE,
                            impact=[f"{section}_completion"],
                            suggested_action=f"Complete the {key} {section[:-1]}",
                            confidence=0.8
                        )
                        
                        self.issues.append(issue)
    
    def _process_status_markdown(self, content: str, file_path: str):
        """Process markdown status content"""
        
        lines = content.split('\n')
        current_section = None
        
        for line in lines:
            # Detect sections
            if line.startswith('##'):
                current_section = line.replace('##', '').strip().lower()
                continue
            
            # Look for status indicators
            if any(indicator in line for indicator in ['❌', '🔴', 'BLOCKED', 'INCOMPLETE']):
                item_text = line.strip()
                
                # Clean up the text
                for prefix in ['❌', '🔴', '🟡', '🟢', '✅', '🔄', '⚠️']:
                    item_text = item_text.replace(prefix, '').strip()
                
                if item_text.startswith(('•', '-', '*', '#')):
                    item_text = item_text[1:].strip()
                
                # Determine state and priority
                if 'BLOCKED' in line or '❌' in line or '🔴' in line:
                    state = ProjectState.BLOCKED
                    priority = Priority.CRITICAL
                elif 'INCOMPLETE' in line or '🟡' in line or '🔄' in line:
                    state = ProjectState.INCOMPLETE
                    priority = Priority.HIGH
                else:
                    state = ProjectState.IN_PROGRESS
                    priority = Priority.MEDIUM
                
                issue = ProjectIssue(
                    title=f"Status Issue: {item_text[:50]}...",
                    description=item_text,
                    location=file_path,
                    priority=priority,
                    state=state,
                    impact=[current_section] if current_section else [],
                    suggested_action=self._suggest_status_action(item_text, state),
                    confidence=0.7
                )
                
                self.issues.append(issue)
    
    def _find_general_issues(self, content: str, file_path: str):
        """Find general issues in content"""
        
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            # Skip lines that are too short
            if len(line.strip()) < 10:
                continue
                
            # Skip lines that are clearly code comments or debug output
            if line.strip().startswith(('#', '//', 'print(', 'logger.', '"""', "'''")):
                continue
                
            # Skip lines that are clearly variable assignments or function definitions
            if any(pattern in line for pattern in ['=', 'def ', 'class ', 'import ', 'from ', 'return ']):
                continue
                
            # Look for TODO/FIXME/HACK comments in meaningful text
            if re.search(r'TODO|FIXME|HACK|BUG', line, re.IGNORECASE):
                issue_text = line.strip()
                if issue_text.startswith(('•', '-', '*', '#', '//')):
                    issue_text = issue_text[1:].strip()
                
                # Skip if it's clearly not a real issue
                if len(issue_text) < 5 or issue_text.startswith(('logger.', 'print(', 'return ', 'if ')):
                    continue
                
                # Validate that this is a real task, not a code fragment
                validation = TASK_VALIDATOR.is_valid_task(
                    f"Issue: {issue_text}",
                    issue_text,
                    f"{file_path}:{i}"
                )
                
                if not validation.is_valid:
                    # Skip false positives
                    logger.debug(f"Skipping false positive issue: {issue_text[:50]}... - {validation.reason}")
                    continue
                
                priority = Priority.MEDIUM
                if 'CRITICAL' in issue_text.upper():
                    priority = Priority.HIGH
                
                issue = ProjectIssue(
                    title=f"Issue: {issue_text[:50]}...",
                    description=issue_text,
                    location=f"{file_path}:{i}",
                    priority=priority,
                    state=ProjectState.IN_PROGRESS,
                    impact=["code_quality", "maintenance"],
                    suggested_action="Address the identified issue",
                    confidence=0.6
                )
                
                self.issues.append(issue)
    
    def _determine_priority(self, text: str) -> Priority:
        """Determine priority based on text content"""
        
        text_upper = text.upper()
        
        if any(word in text_upper for word in ['CRITICAL', 'BLOCKING', 'URGENT']):
            return Priority.CRITICAL
        elif any(word in text_upper for word in ['HIGH', 'IMPORTANT', 'PRIORITY']):
            return Priority.HIGH
        elif any(word in text_upper for word in ['MEDIUM', 'MODERATE']):
            return Priority.MEDIUM
        else:
            return Priority.LOW
    
    def _extract_impact(self, text: str, full_content: str) -> List[str]:
        """Extract what this issue impacts"""
        
        impact = []
        
        # Look for impact keywords
        if any(word in text.lower() for word in ['block', 'prevent', 'stop']):
            impact.append("progress")
        
        if any(word in text.lower() for word in ['demo', 'game', 'feature']):
            impact.append("features")
        
        if any(word in text.lower() for word in ['system', 'architecture', 'component']):
            impact.append("systems")
        
        if any(word in text.lower() for word in ['test', 'quality', 'validation']):
            impact.append("quality")
        
        if any(word in text.lower() for word in ['release', 'deployment', 'production']):
            impact.append("deployment")
        
        return impact if impact else ["general"]
    
    def _suggest_blocker_action(self, blocker_text: str) -> str:
        """Suggest action for blocker"""
        
        if "rendering" in blocker_text.lower():
            return "Implement ECS Rendering System"
        elif "system" in blocker_text.lower():
            return "Complete the missing system implementation"
        elif "integration" in blocker_text.lower():
            return "Resolve integration issues"
        elif "test" in blocker_text.lower():
            return "Complete testing requirements"
        else:
            return "Investigate and resolve the blocker"
    
    def _suggest_status_action(self, text: str, state: ProjectState) -> str:
        """Suggest action based on status"""
        
        if state == ProjectState.INCOMPLETE:
            return "Complete the identified item"
        elif state == ProjectState.BLOCKED:
            return "Resolve blocking issues"
        else:
            return "Continue work on the item"
    
    def _generate_recommendations(self):
        """Generate work recommendations from issues"""
        
        # Group issues by type and priority
        critical_issues = [i for i in self.issues if i.priority == Priority.CRITICAL]
        high_issues = [i for i in self.issues if i.priority == Priority.HIGH]
        
        # Generate recommendations for critical issues first
        for issue in critical_issues:
            rec = self._create_recommendation(issue, auto_execute=True)
            if rec:
                self.recommendations.append(rec)
        
        # Generate recommendations for high priority issues
        for issue in high_issues:
            rec = self._create_recommendation(issue, auto_execute=False)
            if rec:
                self.recommendations.append(rec)
        
        # Sort recommendations by priority
        self.recommendations.sort(key=lambda r: r.priority.value)
    
    def _create_recommendation(self, issue: ProjectIssue, auto_execute: bool = False) -> Optional[WorkRecommendation]:
        """Create work recommendation from issue"""
        
        # Determine agent types needed
        agent_types = self._determine_agent_types(issue)
        
        # Estimate hours based on complexity
        estimated_hours = self._estimate_hours(issue)
        
        # Generate rationale
        rationale = f"Address {issue.title.lower()} to resolve {', '.join(issue.impact)}"
        
        # Determine dependencies
        dependencies = self._determine_dependencies(issue)
        
        recommendation = WorkRecommendation(
            title=issue.title.replace("Blocker: ", "").replace("Status Issue: ", "").replace("Incomplete Goal: ", ""),
            description=issue.description,
            priority=issue.priority,
            estimated_hours=estimated_hours,
            agent_types=agent_types,
            dependencies=dependencies,
            rationale=rationale,
            auto_execute=auto_execute and issue.priority == Priority.CRITICAL
        )
        
        return recommendation
    
    def _determine_agent_types(self, issue: ProjectIssue) -> List[str]:
        """Determine which agents are needed"""
        
        agent_types = []
        
        # Based on issue content
        if any(word in issue.description.lower() for word in ['analyze', 'investigate', 'research']):
            agent_types.append("analyzer")
        
        if any(word in issue.description.lower() for word in ['plan', 'design', 'architecture']):
            agent_types.append("planner")
        
        if any(word in issue.description.lower() for word in ['implement', 'code', 'build', 'develop']):
            agent_types.append("coder")
        
        if any(word in issue.description.lower() for word in ['test', 'validate', 'verify']):
            agent_types.append("tester")
        
        if any(word in issue.description.lower() for word in ['review', 'audit', 'quality']):
            agent_types.append("reviewer")
        
        if any(word in issue.description.lower() for word in ['document', 'docs', 'manual']):
            agent_types.append("archivist")
        
        # Default to analyzer if no specific agents identified
        if not agent_types:
            agent_types = ["analyzer"]
        
        return agent_types
    
    def _estimate_hours(self, issue: ProjectIssue) -> float:
        """Estimate hours needed to resolve issue"""
        
        base_hours = 2.0
        
        # Adjust based on priority
        if issue.priority == Priority.CRITICAL:
            base_hours *= 1.5
        elif issue.priority == Priority.HIGH:
            base_hours *= 1.2
        
        # Adjust based on complexity
        if any(word in issue.description.lower() for word in ['system', 'architecture', 'complex']):
            base_hours *= 2.0
        elif any(word in issue.description.lower() for word in ['simple', 'basic', 'minor']):
            base_hours *= 0.5
        
        # Adjust based on impact
        if len(issue.impact) > 2:
            base_hours *= 1.3
        
        return max(0.5, base_hours)
    
    def _determine_dependencies(self, issue: ProjectIssue) -> List[str]:
        """Determine dependencies for the recommendation"""
        
        dependencies = []
        
        # If it's a system issue, it might depend on analysis
        if any(word in issue.description.lower() for word in ['system', 'component']):
            dependencies.append("requirements_analysis")
        
        # If it's a complex issue, it might depend on planning
        if any(word in issue.description.lower() for word in ['complex', 'architecture']):
            dependencies.append("solution_design")
        
        return dependencies
    
    def _calculate_project_health(self) -> str:
        """Calculate overall project health"""
        
        total_issues = len(self.issues)
        critical_issues = len([i for i in self.issues if i.priority == Priority.CRITICAL])
        high_issues = len([i for i in self.issues if i.priority == Priority.HIGH])
        
        if critical_issues > 0:
            return "CRITICAL"
        elif high_issues > 3:
            return "POOR"
        elif high_issues > 0:
            return "FAIR"
        elif total_issues > 5:
            return "GOOD"
        else:
            return "EXCELLENT"
    
    def _serialize_issue(self, issue: ProjectIssue) -> Dict[str, Any]:
        """Serialize issue for JSON output"""
        
        return {
            "title": issue.title,
            "description": issue.description,
            "location": issue.location,
            "priority": issue.priority.name,
            "state": issue.state.value,
            "impact": issue.impact,
            "suggested_action": issue.suggested_action,
            "confidence": issue.confidence
        }
    
    def _serialize_recommendation(self, rec: WorkRecommendation) -> Dict[str, Any]:
        """Serialize recommendation for JSON output"""
        
        return {
            "title": rec.title,
            "description": rec.description,
            "priority": rec.priority.name,
            "estimated_hours": rec.estimated_hours,
            "agent_types": rec.agent_types,
            "dependencies": rec.dependencies,
            "rationale": rec.rationale,
            "auto_execute": rec.auto_execute
        }
    
    def auto_execute_critical_tasks(self) -> List[str]:
        """Auto-execute critical tasks if possible"""
        
        auto_executed = []
        
        for rec in self.recommendations:
            if rec.auto_execute:
                try:
                    # Build workflow for this task
                    workflow = WORKFLOW_BUILDER.build_workflow(
                        request=rec.title,
                        context={"auto_detected": True, "priority": rec.priority.name}
                    )
                    
                    # Execute with autonomous swarm
                    workflow_tasks = [
                        {
                            "title": step.title,
                            "description": step.description,
                            "agent_type": step.agent_type,
                            "priority": step.priority,
                            "estimated_hours": step.estimated_hours,
                            "dependencies": step.dependencies
                        }
                        for step in workflow.steps
                    ]
                    
                    success = AUTONOMOUS_SWARM.define_task_workflow(f"auto_{rec.title.replace(' ', '_')}", workflow_tasks)
                    
                    if success:
                        auto_executed.append(rec.title)
                        logger.info(f"🚀 Auto-executed critical task: {rec.title}")
                    
                except Exception as e:
                    logger.error(f"Failed to auto-execute {rec.title}: {e}")
        
        return auto_executed


# Global project analyzer
PROJECT_ANALYZER = ProjectAnalyzer(os.getcwd())
