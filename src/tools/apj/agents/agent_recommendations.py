"""
Agent Recommendations - Suggests new agents based on project needs and gaps
Analyzes current ecosystem and recommends valuable additions
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum

from .agent_registry import AgentCapability, AgentType


class AgentUrgency(Enum):
    """Urgency level for adding new agents"""
    CRITICAL = 1  # Essential for current blockers
    HIGH = 2      # Significant value for current phase
    MEDIUM = 3    # Useful for efficiency
    LOW = 4       # Nice to have


@dataclass
class AgentRecommendation:
    """Recommendation for a new agent"""
    name: str
    agent_type: AgentType
    capabilities: List[AgentCapability]
    department: str
    description: str
    urgency: AgentUrgency
    rationale: str
    dependencies: List[str]
    estimated_effort: str
    priority_score: int


class AgentRecommendationEngine:
    """Analyzes ecosystem and recommends new agents"""
    
    def __init__(self):
        self.current_agents = {
            "swarm_coordinator", "analyzer", "planner", "coder", "tester", 
            "reviewer", "executor", "strategist", "archivist", "herald"
        }
        self.current_capabilities = self._get_current_capabilities()
    
    def _get_current_capabilities(self) -> set:
        """Get all capabilities currently covered"""
        caps = set()
        for capability in AgentCapability:
            caps.add(capability)
        return caps
    
    def analyze_gaps_and_recommend(self, project_status: Dict[str, Any]) -> List[AgentRecommendation]:
        """Analyze current ecosystem and recommend new agents"""
        
        recommendations = []
        
        # Based on current project blockers and needs
        recommendations.extend(self._recommend_ecospecialist_agents(project_status))
        recommendations.extend(self._recommend_domain_specialists(project_status))
        recommendations.extend(self._recommend_efficiency_agents(project_status))
        recommendations.extend(self._recommend_quality_agents(project_status))
        
        # Sort by priority score
        recommendations.sort(key=lambda r: r.priority_score, reverse=True)
        
        return recommendations
    
    def _recommend_ecospecialist_agents(self, project_status: Dict[str, Any]) -> List[AgentRecommendation]:
        """Recommend ecosystem-specific specialists"""
        
        recommendations = []
        
        # ECS Rendering Specialist (CRITICAL - addresses current blocker)
        if "ECS RenderingSystem missing" in str(project_status.get("blockers", [])):
            recommendations.append(AgentRecommendation(
                name="ecs_specialist",
                agent_type=AgentType.SPECIALIST,
                capabilities=[AgentCapability.CODING, AgentCapability.ANALYSIS, AgentCapability.TESTING],
                department="graphics",
                description="Specialist in ECS rendering systems and graphics pipelines",
                urgency=AgentUrgency.CRITICAL,
                rationale="Directly addresses the ECS RenderingSystem blocker that blocks dungeon and tower defense demos",
                dependencies=["analyzer", "coder"],
                estimated_effort="20-30 hours",
                priority_score=100
            ))
        
        # Tower Defense Architect (HIGH - next major phase)
        if "tower_defense" in str(project_status.get("demos", {})):
            if project_status.get("demos", {}).get("tower_defense") == "INCOMPLETE":
                recommendations.append(AgentRecommendation(
                    name="tower_defense_architect",
                    agent_type=AgentType.SPECIALIST,
                    capabilities=[AgentCapability.PLANNING, AgentCapability.CODING, AgentCapability.DOCUMENTATION],
                    department="gaming",
                    description="Architect specializing in tower defense game mechanics and systems",
                    urgency=AgentUrgency.HIGH,
                    rationale="Essential for completing Tower Defense demo and achieving G3 multi-genre proof",
                    dependencies=["planner", "coder", "tester"],
                    estimated_effort="40-60 hours",
                    priority_score=85
                ))
        
        # Dungeon Master (MEDIUM - polish existing demo)
        if "dungeon" in str(project_status.get("demos", {})):
            if project_status.get("demos", {}).get("dungeon") == "INCOMPLETE":
                recommendations.append(AgentRecommendation(
                    name="dungeon_master",
                    agent_type=AgentType.SPECIALIST,
                    capabilities=[AgentCapability.CODING, AgentCapability.TESTING, AgentCapability.REVIEW],
                    department="gaming",
                    description="Specialist in dungeon crawler mechanics and level design",
                    urgency=AgentUrgency.MEDIUM,
                    rationale="Will help complete and polish the dungeon demo for G3 proof",
                    dependencies=["coder", "tester", "reviewer"],
                    estimated_effort="15-20 hours",
                    priority_score=70
                ))
        
        return recommendations
    
    def _recommend_domain_specialists(self, project_status: Dict[str, Any]) -> List[AgentRecommendation]:
        """Recommend domain-specific specialists"""
        
        recommendations = []
        
        # Performance Analyst (HIGH - optimization focus)
        recommendations.append(AgentRecommendation(
            name="performance_analyst",
            agent_type=AgentType.SPECIALIST,
            capabilities=[AgentCapability.ANALYSIS, AgentCapability.TESTING],
            department="optimization",
            description="Specialist in performance analysis and optimization",
            urgency=AgentUrgency.HIGH,
            rationale="Critical for ensuring the ECS system and demos run efficiently across all platforms",
            dependencies=["analyzer", "tester"],
            estimated_effort="15-25 hours",
            priority_score=80
        ))
        
        # UI/UX Designer (MEDIUM - user experience)
        recommendations.append(AgentRecommendation(
            name="ui_designer",
            agent_type=AgentType.SPECIALIST,
            capabilities=[AgentCapability.DOCUMENTATION, AgentCapability.REVIEW],
            department="design",
            description="Specialist in user interface design and user experience",
            urgency=AgentUrgency.MEDIUM,
            rationale="Will improve the user experience for the ADJ system and game interfaces",
            dependencies=["herald", "reviewer"],
            estimated_effort="10-15 hours",
            priority_score=60
        ))
        
        # Data Scientist (LOW - analytics and insights)
        recommendations.append(AgentRecommendation(
            name="data_scientist",
            agent_type=AgentType.SPECIALIST,
            capabilities=[AgentCapability.ANALYSIS, AgentCapability.DOCUMENTATION],
            department="analytics",
            description="Specialist in data analysis and insights from agent performance",
            urgency=AgentUrgency.LOW,
            rationale="Could provide valuable insights into agent performance and project metrics",
            dependencies=["analyzer", "archivist"],
            estimated_effort="20-30 hours",
            priority_score=40
        ))
        
        return recommendations
    
    def _recommend_efficiency_agents(self, project_status: Dict[str, Any]) -> List[AgentRecommendation]:
        """Recommend efficiency-improving agents"""
        
        recommendations = []
        
        # Automation Engineer (MEDIUM - workflow automation)
        recommendations.append(AgentRecommendation(
            name="automation_engineer",
            agent_type=AgentType.SPECIALIST,
            capabilities=[AgentCapability.CODING, AgentCapability.EXECUTION, AgentCapability.TESTING],
            department="devops",
            description="Specialist in workflow automation and CI/CD pipelines",
            urgency=AgentUrgency.MEDIUM,
            rationale="Could automate testing, deployment, and other repetitive tasks",
            dependencies=["executor", "tester"],
            estimated_effort="25-35 hours",
            priority_score=65
        ))
        
        # Integration Specialist (MEDIUM - system integration)
        recommendations.append(AgentRecommendation(
            name="integration_specialist",
            agent_type=AgentType.SPECIALIST,
            capabilities=[AgentCapability.CODING, AgentCapability.TESTING, AgentCapability.ANALYSIS],
            department="systems",
            description="Specialist in system integration and API management",
            urgency=AgentUrgency.MEDIUM,
            rationale="Could help integrate external services and improve system connectivity",
            dependencies=["coder", "analyzer"],
            estimated_effort="20-30 hours",
            priority_score=55
        ))
        
        return recommendations
    
    def _recommend_quality_agents(self, project_status: Dict[str, Any]) -> List[AgentRecommendation]:
        """Recommend quality-focused agents"""
        
        recommendations = []
        
        # Security Auditor (LOW - security focus)
        recommendations.append(AgentRecommendation(
            name="security_auditor",
            agent_type=AgentType.SPECIALIST,
            capabilities=[AgentCapability.ANALYSIS, AgentCapability.REVIEW],
            department="security",
            description="Specialist in security analysis and vulnerability assessment",
            urgency=AgentUrgency.LOW,
            rationale="Important for long-term project security and best practices",
            dependencies=["reviewer", "analyzer"],
            estimated_effort="15-25 hours",
            priority_score=45
        ))
        
        # Compliance Officer (LOW - standards and compliance)
        recommendations.append(AgentRecommendation(
            name="compliance_officer",
            agent_type=AgentType.SPECIALIST,
            capabilities=[AgentCapability.DOCUMENTATION, AgentCapability.REVIEW],
            department="quality",
            description="Specialist in coding standards and compliance checking",
            urgency=AgentUrgency.LOW,
            rationale="Could ensure consistent code quality and adherence to standards",
            dependencies=["reviewer", "archivist"],
            estimated_effort="10-15 hours",
            priority_score=35
        ))
        
        return recommendations
    
    def get_top_recommendations(self, count: int = 5) -> List[AgentRecommendation]:
        """Get top N recommendations by priority"""
        all_recommendations = self.analyze_gaps_and_recommend({})
        return all_recommendations[:count]
    
    def generate_implementation_plan(self, recommendations: List[AgentRecommendation]) -> Dict[str, Any]:
        """Generate an implementation plan for recommended agents"""
        
        # Group by urgency
        critical = [r for r in recommendations if r.urgency == AgentUrgency.CRITICAL]
        high = [r for r in recommendations if r.urgency == AgentUrgency.HIGH]
        medium = [r for r in recommendations if r.urgency == AgentUrgency.MEDIUM]
        low = [r for r in recommendations if r.urgency == AgentUrgency.LOW]
        
        # Calculate total effort
        total_effort_hours = sum(
            int(r.estimated_effort.split("-")[0]) for r in recommendations
            if r.estimated_effort
        )
        
        return {
            "phases": {
                "Phase 1 (Critical)": {
                    "agents": [r.name for r in critical],
                    "total_effort": f"{sum(int(r.estimated_effort.split('-')[0]) for r in critical if r.estimated_effort)}-{sum(int(r.estimated_effort.split('-')[1]) for r in critical if r.estimated_effort)} hours",
                    "rationale": "Address current blockers and critical needs"
                },
                "Phase 2 (High Priority)": {
                    "agents": [r.name for r in high],
                    "total_effort": f"{sum(int(r.estimated_effort.split('-')[0]) for r in high if r.estimated_effort)}-{sum(int(r.estimated_effort.split('-')[1]) for r in high if r.estimated_effort)} hours",
                    "rationale": "Significant value for current phase"
                },
                "Phase 3 (Medium Priority)": {
                    "agents": [r.name for r in medium],
                    "total_effort": f"{sum(int(r.estimated_effort.split('-')[0]) for r in medium if r.estimated_effort)}-{sum(int(r.estimated_effort.split('-')[1]) for r in medium if r.estimated_effort)} hours",
                    "rationale": "Improve efficiency and capabilities"
                },
                "Phase 4 (Low Priority)": {
                    "agents": [r.name for r in low],
                    "total_effort": f"{sum(int(r.estimated_effort.split('-')[0]) for r in low if r.estimated_effort)}-{sum(int(r.estimated_effort.split('-')[1]) for r in low if r.estimated_effort)} hours",
                    "rationale": "Nice to have additions"
                }
            },
            "summary": {
                "total_agents": len(recommendations),
                "total_effort_hours": total_effort_hours,
                "estimated_weeks": total_effort_hours / 40,  # Assuming 40 hours/week
                "critical_count": len(critical),
                "high_count": len(high),
                "medium_count": len(medium),
                "low_count": len(low)
            }
        }

# Global recommendation engine
RECOMMENDATION_ENGINE = AgentRecommendationEngine()
