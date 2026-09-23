"""
Swarm Manager - Manage and extend Agent Swarm capabilities
Provides tools to safely add new agents and capabilities
"""

from typing import Dict, List, Optional, Type
from pathlib import Path
import json
from dataclasses import dataclass, asdict


@dataclass
class AgentTemplate:
    """Template for creating new agents"""
    name: str
    role: str
    description: str
    capabilities: List[str]
    dependencies: List[str]
    output_format: str
    prompt_template: str
    validation_rules: List[str]


class SwarmManager:
    """
    Manage and safely extend the Agent Swarm
    Provides validation and testing for new agents
    """
    
    def __init__(self, swarm, project_root: Path):
        self.swarm = swarm
        self.project_root = project_root
        self.templates_dir = project_root / "src" / "tools" / "apj" / "agents" / "templates"
        self.templates_dir.mkdir(exist_ok=True)
        
        # Load existing templates
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, AgentTemplate]:
        """Load existing agent templates"""
        templates = {}
        
        template_files = list(self.templates_dir.glob("*.json"))
        for template_file in template_files:
            try:
                with open(template_file) as f:
                    data = json.load(f)
                template = AgentTemplate(**data)
                templates[template.name] = template
            except Exception as e:
                print(f"⚠️  Could not load template {template_file}: {e}")
        
        return templates
    
    def add_agent_template(self, template: AgentTemplate) -> bool:
        """
        Add a new agent template with validation
        
        Returns: True if added successfully
        """
        
        # Validate template
        if not self._validate_template(template):
            return False
        
        # Save template
        template_file = self.templates_dir / f"{template.name}.json"
        
        try:
            with open(template_file, 'w') as f:
                json.dump(asdict(template), f, indent=2)
            
            self.templates[template.name] = template
            print(f"✅ Added agent template: {template.name}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to save template: {e}")
            return False
    
    def _validate_template(self, template: AgentTemplate) -> bool:
        """Validate agent template before adding"""
        
        # Check for required fields
        if not all([template.name, template.role, template.description]):
            print("❌ Template missing required fields (name, role, description)")
            return False
        
        # Check for duplicate names
        if template.name in self.templates:
            print(f"❌ Template with name '{template.name}' already exists")
            return False
        
        # Validate capabilities
        if not template.capabilities:
            print("❌ Template must have at least one capability")
            return False
        
        # Validate dependencies
        for dep in template.dependencies:
            if dep not in [agent.role.value for agent in self.swarm.agents.values()]:
                print(f"❌ Unknown dependency: {dep}")
                return False
        
        # Validate prompt template
        if not template.prompt_template:
            print("❌ Template must have a prompt template")
            return False
        
        print(f"✅ Template validation passed for: {template.name}")
        return True
    
    def create_agent_from_template(self, template_name: str) -> bool:
        """
        Create a new agent from template and add to swarm
        
        Returns: True if created successfully
        """
        
        if template_name not in self.templates:
            print(f"❌ Template not found: {template_name}")
            return False
        
        template = self.templates[template_name]
        
        # Create the agent capability
        from .agent_swarm import AgentCapability, AgentRole
        
        # Map role string to enum
        role_mapping = {
            "coordinator": AgentRole.COORDINATOR,
            "planner": AgentRole.PLANNER,
            "coder": AgentRole.CODER,
            "tester": AgentRole.TESTER,
            "analyzer": AgentRole.ANALYZER,
            "executor": AgentRole.EXECUTOR,
            "reviewer": AgentRole.REVIEWER
        }
        
        role = role_mapping.get(template.role.lower())
        if not role:
            print(f"❌ Unknown role: {template.role}")
            return False
        
        # Map dependencies
        dep_mapping = {agent.role.value: agent.role for agent in self.swarm.agents.values()}
        dependencies = [dep_mapping.get(dep) for dep in template.dependencies]
        dependencies = [d for d in dependencies if d is not None]
        
        capability = AgentCapability(
            role=role,
            name=template.name,
            description=template.description,
            capabilities=template.capabilities,
            dependencies=dependencies,
            output_format=template.output_format
        )
        
        # Add to swarm
        self.swarm.add_agent(role, capability)
        
        # Save prompt template
        self._save_prompt_template(template)
        
        print(f"✅ Created agent from template: {template.name}")
        return True
    
    def _save_prompt_template(self, template: AgentTemplate) -> None:
        """Save prompt template for the agent"""
        
        prompt_file = self.templates_dir / f"{template.name}_prompt.txt"
        
        try:
            with open(prompt_file, 'w') as f:
                f.write(template.prompt_template)
        except Exception as e:
            print(f"⚠️  Could not save prompt template: {e}")
    
    def list_templates(self) -> None:
        """List all available agent templates"""
        
        print("📋 Available Agent Templates:")
        print("=" * 50)
        
        for name, template in self.templates.items():
            print(f"\n🔹 {name}")
            print(f"   Role: {template.role}")
            print(f"   Description: {template.description}")
            print(f"   Capabilities: {', '.join(template.capabilities[:3])}...")
            print(f"   Dependencies: {', '.join(template.dependencies) if template.dependencies else 'None'}")
    
    def get_swarm_capabilities(self) -> Dict:
        """Get comprehensive swarm capabilities"""
        
        capabilities = {
            "total_agents": len(self.swarm.agents),
            "total_templates": len(self.templates),
            "available_roles": [role.value for role in self.swarm.agents.keys()],
            "agent_details": {}
        }
        
        for role, agent in self.swarm.agents.items():
            capabilities["agent_details"][role.value] = {
                "name": agent.name,
                "capabilities_count": len(agent.capabilities),
                "dependencies_count": len(agent.dependencies),
                "can_coordinate": role == AgentRole.COORDINATOR,
                "can_code": role == AgentRole.CODER,
                "can_test": role == AgentRole.TESTER,
                "can_plan": role == AgentRole.PLANNER
            }
        
        return capabilities
    
    def suggest_extensions(self) -> List[str]:
        """Suggest useful extensions based on current capabilities"""
        
        suggestions = []
        
        # Check for missing common capabilities
        all_capabilities = set()
        for agent in self.swarm.agents.values():
            all_capabilities.update(agent.capabilities)
        
        missing_capabilities = {
            "documentation": "Generate and update documentation",
            "performance": "Analyze and optimize performance",
            "security": "Security analysis and vulnerability scanning",
            "deployment": "Handle deployment and CI/CD",
            "monitoring": "System monitoring and alerting",
            "debugging": "Advanced debugging and issue diagnosis",
            "database": "Database schema and migration management",
            "api": "API design and documentation generation",
            "ui": "UI/UX design and component generation"
        }
        
        for cap, desc in missing_capabilities.items():
            if cap not in all_capabilities:
                suggestions.append(f"Add {cap.title()} agent: {desc}")
        
        return suggestions
    
    def create_extension_templates(self) -> None:
        """Create templates for common extensions"""
        
        # Documentation Agent
        doc_template = AgentTemplate(
            name="DocumentationAgent",
            role="analyzer",
            description="Generates and maintains project documentation",
            capabilities=[
                "generate_docs",
                "update_readme",
                "create_api_docs",
                "maintain_changelog",
                "validate_documentation"
            ],
            dependencies=["analyzer"],
            output_format="documentation_report",
            prompt_template="""
You are the Documentation Agent, responsible for maintaining project documentation.

Your task is to: {task}

Current project context:
{context}

Generate comprehensive documentation that:
1. Is accurate and up-to-date
2. Follows project documentation standards
3. Includes examples and usage instructions
4. Is properly formatted and structured

Provide the documentation in markdown format.
""",
            validation_rules=[
                "Must generate valid markdown",
                "Must include examples",
                "Must be accurate to current code"
            ]
        )
        
        # Performance Agent
        perf_template = AgentTemplate(
            name="PerformanceAgent",
            role="analyzer",
            description="Analyzes and optimizes system performance",
            capabilities=[
                "analyze_performance",
                "identify_bottlenecks",
                "suggest_optimizations",
                "profile_code",
                "benchmark_systems"
            ],
            dependencies=["analyzer", "tester"],
            output_format="performance_report",
            prompt_template="""
You are the Performance Agent, responsible for system performance analysis.

Your task is to: {task}

Current project context:
{context}

Analyze performance and provide:
1. Performance bottlenecks identification
2. Optimization suggestions
3. Benchmark results
4. Code profiling data
5. Performance recommendations

Focus on practical, actionable improvements.
""",
            validation_rules=[
                "Must identify specific bottlenecks",
                "Must provide measurable metrics",
                "Must suggest concrete optimizations"
            ]
        )
        
        # Add templates
        self.add_agent_template(doc_template)
        self.add_agent_template(perf_template)
        
        print("✅ Created extension templates for Documentation and Performance agents")


# Pre-defined templates for common extensions
COMMON_EXTENSIONS = {
    "documentation": {
        "name": "DocumentationAgent",
        "role": "analyzer",
        "description": "Generates and maintains project documentation",
        "capabilities": ["generate_docs", "update_readme", "create_api_docs"],
        "dependencies": ["analyzer"],
        "output_format": "documentation_report"
    },
    "performance": {
        "name": "PerformanceAgent", 
        "role": "analyzer",
        "description": "Analyzes and optimizes system performance",
        "capabilities": ["analyze_performance", "identify_bottlenecks", "suggest_optimizations"],
        "dependencies": ["analyzer"],
        "output_format": "performance_report"
    },
    "security": {
        "name": "SecurityAgent",
        "role": "analyzer", 
        "description": "Security analysis and vulnerability scanning",
        "capabilities": ["scan_vulnerabilities", "analyze_security", "suggest_fixes"],
        "dependencies": ["analyzer"],
        "output_format": "security_report"
    },
    "deployment": {
        "name": "DeploymentAgent",
        "role": "executor",
        "description": "Handles deployment and CI/CD processes",
        "capabilities": ["deploy_code", "manage_ci_cd", "handle_rollback"],
        "dependencies": ["executor"],
        "output_format": "deployment_report"
    }
}


def get_extension_template(extension_name: str) -> Optional[AgentTemplate]:
    """Get a pre-defined extension template"""
    
    if extension_name not in COMMON_EXTENSIONS:
        return None
    
    data = COMMON_EXTENSIONS[extension_name]
    
    # Create basic prompt template
    prompt_template = f"""
You are the {data['name']}, responsible for {data['description']}.

Your task is to: {{task}}

Current project context:
{{context}}

{{description}}

Focus on practical, actionable results.
"""
    
    return AgentTemplate(
        name=data["name"],
        role=data["role"],
        description=data["description"],
        capabilities=data["capabilities"],
        dependencies=data["dependencies"],
        output_format=data["output_format"],
        prompt_template=prompt_template,
        validation_rules=["Must be accurate", "Must be actionable", "Must follow best practices"]
    )
