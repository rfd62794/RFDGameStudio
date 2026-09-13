"""
Agent Boot Sequence - Initializes and connects all agents in the ecosystem
Wakes up agents, establishes communication, and sets up initial conversations
"""

import logging
from typing import Dict, List, Any
from datetime import datetime
import uuid

from .agent_registry import AGENT_REGISTRY, AgentType, AgentCapability
from .swarm_agent import SwarmCoordinator
from .base_agent import AgentConfig
from .a2a_communication import A2A_MANAGER, MessageType, MessagePriority, A2AMessage
from .child_agent import CHILD_AGENT_MANAGER
from .tools import TOOL_REGISTRY

logger = logging.getLogger(__name__)


class AgentBootManager:
    """Manages the complete agent ecosystem boot sequence"""
    
    def __init__(self):
        self.swarm_coordinator = None
        self.boot_time = datetime.now()
        self.initialized_agents = {}
        self.communication_links = []
    
    def boot_ecosystem(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Boot complete agent ecosystem with auto-detection"""
        
        logger.info("🚀 Booting Complete Agent Ecosystem")
        
        results = {
            "success": True,
            "phases": {},
            "errors": [],
            "boot_time": datetime.now()
        }
        
        try:
            # Phase 1: Initialize Swarm
            logger.info("📝 Phase 1: Initializing Swarm")
            swarm_results = self._initialize_swarm()
            results["phases"]["swarm"] = swarm_results
            
            # Phase 2: Initialize Existing Agents
            logger.info("🤖 Phase 2: Initializing Existing Agents")
            agent_results = self._initialize_existing_agents()
            results["phases"]["existing_agents"] = agent_results
            
            # Phase 3: Setup Communication
            logger.info("🔗 Phase 3: Setting Up Communication")
            comm_results = self._setup_communication()
            results["phases"]["communication"] = comm_results
            
            # Phase 4: Auto-Detect Work (NEW)
            logger.info("🔍 Phase 4: Auto-Detecting Work from Documentation")
            analysis_results = self._auto_detect_work()
            results["phases"]["auto_detection"] = analysis_results
            
            # Phase 5: Start Initial Conversations
            logger.info("💬 Phase 5: Starting Initial Conversations")
            project_status = context.get('project_status', {}) if context else {}
            conversation_results = self._start_initial_conversations(project_status)
            results["phases"]["conversations"] = conversation_results
            
            # Phase 6: Create Child Agents
            logger.info("👶 Phase 6: Creating Child Agents")
            child_results = self._create_child_agents(project_status)
            results["phases"]["child_agents"] = child_results
            
            # Phase 7: Auto-Execute Critical Tasks (NEW)
            logger.info("🚀 Phase 7: Auto-Executing Critical Tasks")
            auto_results = self._auto_execute_critical_tasks()
            results["phases"]["auto_execution"] = auto_results
            
            # Update context with analysis results
            if context:
                context.update({
                    "project_analysis": analysis_results.get("analysis", {}),
                    "auto_executed_tasks": auto_results.get("executed_tasks", [])
                })
            
            logger.info("✅ Agent ecosystem boot completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Ecosystem boot failed: {e}")
            results["success"] = False
            results["errors"].append(str(e))
        
        results["boot_time"] = datetime.now()
        self.boot_time = results["boot_time"]
        
        return results
    
    def _initialize_swarm(self) -> Dict[str, Any]:
        """Initialize the swarm coordinator"""
        logger.info("🐝 Initializing Swarm Coordinator")
        
        try:
            # Create swarm coordinator config
            swarm_config = AgentConfig(
                name="swarm_coordinator",
                role="Master coordinator for agent ecosystem",
                department="coordination",
                model_preference="local",
                prompts={
                    "system": "docs/agents/prompts/coordinator_system.md",
                    "fewshot": "docs/agents/prompts/generic_system.md"
                },
                schema_name="SwarmTaskAssignment",
                fallback={
                    "recommended": {
                        "label": "FALLBACK",
                        "title": "Use individual agents",
                        "rationale": "Swarm coordination failed",
                        "risk": "medium"
                    },
                    "alternatives": []
                },
                open_questions=[],
                archivist_risks_addressed=[],
                corpus_hash=""
            )
            
            # Initialize swarm coordinator
            self.swarm_coordinator = SwarmCoordinator(swarm_config, force_reinit=True)
            self.initialized_agents["swarm_coordinator"] = self.swarm_coordinator
            
            return {
                "success": True,
                "agent_count": len(self.swarm_coordinator.swarm_agents),
                "available_agents": list(self.swarm_coordinator.swarm_agents.keys())
            }
            
        except Exception as e:
            logger.error(f"Failed to boot swarm coordinator: {e}")
            return {"success": False, "error": str(e)}
    
    def _initialize_existing_agents(self) -> Dict[str, Any]:
        """Initialize existing specialist agents"""
        logger.info("🤖 Initializing Existing Specialist Agents")
        
        results = {
            "success": True,
            "agents": {},
            "failed": []
        }
        
        existing_agents = AGENT_REGISTRY.get_agents_by_type(AgentType.SPECIALIST)
        
        for agent_metadata in existing_agents:
            try:
                agent = AGENT_REGISTRY.create_agent_instance(agent_metadata.name)
                if agent:
                    self.initialized_agents[agent_metadata.name] = agent
                    results["agents"][agent_metadata.name] = {
                        "capabilities": [cap.value for cap in agent_metadata.capabilities],
                        "department": agent_metadata.department,
                        "supports_a2a": agent_metadata.supports_a2a
                    }
                    logger.info(f"✅ Initialized agent: {agent_metadata.name}")
                else:
                    results["failed"].append(agent_metadata.name)
                    logger.warning(f"❌ Failed to initialize: {agent_metadata.name}")
                    
            except Exception as e:
                results["failed"].append(agent_metadata.name)
                results["success"] = False
                logger.error(f"❌ Error initializing {agent_metadata.name}: {e}")
        
        return results
    
    def _setup_communication(self) -> Dict[str, Any]:
        """Establish communication links between agents"""
        logger.info("🔗 Establishing Agent Communication Links")
        
        results = {
            "success": True,
            "links": [],
            "failed": []
        }
        
        # Register all agents for A2A communication
        for agent_name, agent in self.initialized_agents.items():
            if AGENT_REGISTRY.supports_a2a(agent_name):
                try:
                    # Create message handler for agent
                    from .a2a_communication import MessageHandler
                    handler = MessageHandler(agent_name)
                    
                    # Register basic handlers
                    handler.register_handler(MessageType.REQUEST, self._create_request_handler(agent))
                    handler.register_handler(MessageType.NOTIFICATION, self._create_notification_handler(agent))
                    
                    # Register with A2A manager
                    A2A_MANAGER.register_agent(agent_name, handler)
                    results["links"].append(agent_name)
                    logger.info(f"🔗 Connected {agent_name} to A2A network")
                    
                except Exception as e:
                    results["failed"].append(agent_name)
                    results["success"] = False
                    logger.error(f"❌ Failed to connect {agent_name}: {e}")
        
        # Swarm coordinator is already registered in its constructor
        if "swarm_coordinator" in A2A_MANAGER._message_handlers:
            results["links"].append("swarm_coordinator")
            logger.info(f"🔗 swarm_coordinator already connected to A2A network")
        
        return results
    
    def _create_request_handler(self, agent):
        """Create request handler for agent"""
        def handler(message: A2AMessage) -> A2AMessage:
            try:
                # Process request with agent
                task = message.content.get("task", "")
                result = agent.run(task)
                
                return A2AMessage(
                    id=str(uuid.uuid4()),
                    sender=agent.config.name,
                    recipient=message.sender,
                    message_type=MessageType.RESPONSE,
                    priority=MessagePriority.NORMAL,
                    content={"result": result, "request_id": message.id},
                    timestamp=datetime.now(),
                    reply_to=message.id
                )
            except Exception as e:
                return A2AMessage(
                    id=str(uuid.uuid4()),
                    sender=agent.config.name,
                    recipient=message.sender,
                    message_type=MessageType.RESPONSE,
                    priority=MessagePriority.NORMAL,
                    content={"error": str(e), "request_id": message.id},
                    timestamp=datetime.now(),
                    reply_to=message.id
                )
        return handler
    
    def _create_notification_handler(self, agent):
        """Create notification handler for agent"""
        def handler(message: A2AMessage) -> None:
            logger.info(f"📢 {agent.config.name} received notification: {message.content}")
        return handler
    
    def _start_initial_conversations(self, project_status: Dict[str, Any]) -> Dict[str, Any]:
        """Start initial conversations based on project status"""
        logger.info("💬 Starting Initial Agent Conversations")
        
        results = {
            "success": True,
            "conversations": [],
            "failed": []
        }
        
        try:
            # Wait a moment for A2A registration to complete
            import time
            time.sleep(0.1)
            
            # Extract project information safely
            blockers = []
            goals = {}
            next_actions = []
            
            if isinstance(project_status, dict):
                blockers = project_status.get("blockers", [])
                goals = project_status.get("goals", {})
                next_actions = project_status.get("next_actions", [])
            
            # Conversation 1: Coordinator asks strategist about current blockers
            if "strategist" in self.initialized_agents:
                try:
                    print(f"🤖 swarm_coordinator → strategist: Analyzing {len(blockers)} blockers...")
                    message_id = self.swarm_coordinator.send_a2a_message(
                        recipient="strategist",
                        message_type=MessageType.REQUEST,
                        content={
                            "task": "Analyze current project blockers and recommend strategy",
                            "context": {
                                "blockers": blockers,
                                "goals": goals,
                                "next_actions": next_actions
                            }
                        },
                        priority=MessagePriority.HIGH
                    )
                    results["conversations"].append({
                        "type": "coordinator_to_strategist",
                        "message_id": message_id,
                        "topic": "Blocker analysis and strategy"
                    })
                    print(f"✅ Message sent: {message_id[:8]}...")
                except Exception as e:
                    results["failed"].append(f"coordinator_to_strategist: {e}")
                    print(f"❌ Failed: {e}")
            
            # Conversation 2: Coordinator asks archivist to document current state
            if "archivist" in self.initialized_agents:
                try:
                    print(f"🤖 swarm_coordinator → archivist: Documenting project state...")
                    message_id = self.swarm_coordinator.send_a2a_message(
                        recipient="archivist",
                        message_type=MessageType.REQUEST,
                        content={
                            "task": "Document current project state and progress",
                            "context": {
                                "project_status": project_status,
                                "timestamp": datetime.now().isoformat()
                            }
                        },
                        priority=MessagePriority.NORMAL
                    )
                    results["conversations"].append({
                        "type": "coordinator_to_archivist",
                        "message_id": message_id,
                        "topic": "Project state documentation"
                    })
                    print(f"✅ Message sent: {message_id[:8]}...")
                except Exception as e:
                    results["failed"].append(f"coordinator_to_archivist: {e}")
                    print(f"❌ Failed: {e}")
            
            # Conversation 3: Coordinator broadcasts project status to all agents
            try:
                print(f"📢 swarm_coordinator → ALL: Broadcasting project status update...")
                broadcast_id = self.swarm_coordinator.broadcast_to_all_agents({
                    "type": "project_status_update",
                    "status": project_status,
                    "timestamp": datetime.now().isoformat(),
                    "action_required": True
                })
                results["conversations"].append({
                    "type": "broadcast",
                    "message_id": broadcast_id,
                    "topic": "Project status broadcast"
                })
                print(f"✅ Broadcast sent: {broadcast_id[:8]}...")
            except Exception as e:
                results["failed"].append(f"broadcast: {e}")
                print(f"❌ Failed: {e}")
            
            logger.info(f"🗣️ Started {len(results['conversations'])} initial conversations")
            print(f"💬 Conversations started: {len(results['conversations'])} successful, {len(results['failed'])} failed")
            
        except Exception as e:
            results["success"] = False
            results["failed"].append(str(e))
            logger.error(f"❌ Failed to start conversations: {e}")
            print(f"❌ Conversation error: {e}")
        
        return results
    
    def _create_specialized_children(self, project_status: Dict[str, Any]) -> Dict[str, Any]:
        """Create specialized child agents based on project needs"""
        
        results = {
            "success": True,
            "children": [],
            "failed": []
        }
        
        try:
            # Import extended specialized agents
            from ..swarm.agents.specialized_agents import (
                DOCUMENTATION_SPECIALIST,
                ARCHITECTURE_SPECIALIST,
                GENETICS_SPECIALIST,
                UI_SPECIALIST,
                INTEGRATION_SPECIALIST,
                DEBUGGING_SPECIALIST
            )
            
            # Analyze project status to determine needed agents
            critical_issues = project_status.get("critical_issues", 0)
            demos = project_status.get("demos", {})
            
            print(f"👶 Creating specialized child agents for {critical_issues} critical issues...")
            
            # Original agents (keep existing)
            # Child Agent 1: ECS Rendering Specialist
            if critical_issues > 0:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose="ECS Rendering System implementation",
                    capabilities=["ecs_design", "rendering", "component_architecture"],
                    tools=["file_ops", "code_ops", "test_ops", "ecs_ops"],
                    lifespan=150
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": "ECS Rendering System",
                        "capabilities": ["ecs_design", "rendering", "component_architecture"],
                        "priority": 1
                    })
                    print(f"🎯 Created ECS Rendering Specialist: {child_id[:8]}...")
            
            # Child Agent 2: Dungeon Demo Specialist
            if demos.get("dungeon", "INCOMPLETE") == "INCOMPLETE":
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose="Complete and polish Dungeon demo",
                    capabilities=["gameplay", "level_design", "narrative"],
                    tools=["file_ops", "code_ops", "test_ops", "game_ops"],
                    lifespan=120
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": "Dungeon Demo Specialist",
                        "capabilities": ["gameplay", "level_design", "narrative"],
                        "priority": 2
                    })
                    print(f"🎯 Created Dungeon Demo Specialist: {child_id[:8]}...")
            
            # Child Agent 3: Tower Defense Architect
            if demos.get("tower_defense", "INCOMPLETE") == "INCOMPLETE":
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose="Design and implement Tower Defense systems",
                    capabilities=["tower_defense", "genetics_integration", "ai_design"],
                    tools=["file_ops", "code_ops", "test_ops", "system_ops"],
                    lifespan=180
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": "Tower Defense Architect",
                        "capabilities": ["tower_defense", "genetics_integration", "ai_design"],
                        "priority": 3
                    })
                    print(f"🎯 Created Tower Defense Architect: {child_id[:8]}...")
            
            # NEW EXTENDED AGENTS
            
            # Child Agent 4: Documentation Specialist
            if critical_issues > 5:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose=DOCUMENTATION_SPECIALIST.description,
                    capabilities=DOCUMENTATION_SPECIALIST.capabilities,
                    tools=DOCUMENTATION_SPECIALIST.tools,
                    lifespan=100
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": DOCUMENTATION_SPECIALIST.name,
                        "capabilities": DOCUMENTATION_SPECIALIST.capabilities,
                        "priority": 4
                    })
                    print(f"📝 Created Documentation Specialist: {child_id[:8]}...")
            
            # Child Agent 5: Architecture Specialist
            if critical_issues > 10:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose=ARCHITECTURE_SPECIALIST.description,
                    capabilities=ARCHITECTURE_SPECIALIST.capabilities,
                    tools=ARCHITECTURE_SPECIALIST.tools,
                    lifespan=120
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": ARCHITECTURE_SPECIALIST.name,
                        "capabilities": ARCHITECTURE_SPECIALIST.capabilities,
                        "priority": 5
                    })
                    print(f"🏗️ Created Architecture Specialist: {child_id[:8]}...")
            
            # Child Agent 6: Genetics System Specialist
            if demos.get("tower_defense", "INCOMPLETE") == "INCOMPLETE":
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose=GENETICS_SPECIALIST.description,
                    capabilities=GENETICS_SPECIALIST.capabilities,
                    tools=GENETICS_SPECIALIST.tools,
                    lifespan=140
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": GENETICS_SPECIALIST.name,
                        "capabilities": GENETICS_SPECIALIST.capabilities,
                        "priority": 6
                    })
                    print(f"🧬 Created Genetics Specialist: {child_id[:8]}...")
            
            # Child Agent 7: UI Systems Specialist
            if critical_issues > 15:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose=UI_SPECIALIST.description,
                    capabilities=UI_SPECIALIST.capabilities,
                    tools=UI_SPECIALIST.tools,
                    lifespan=110
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": UI_SPECIALIST.name,
                        "capabilities": UI_SPECIALIST.capabilities,
                        "priority": 7
                    })
                    print(f"🎨 Created UI Specialist: {child_id[:8]}...")
            
            # Child Agent 8: Integration Specialist
            if critical_issues > 20:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose=INTEGRATION_SPECIALIST.description,
                    capabilities=INTEGRATION_SPECIALIST.capabilities,
                    tools=INTEGRATION_SPECIALIST.tools,
                    lifespan=130
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": INTEGRATION_SPECIALIST.name,
                        "capabilities": INTEGRATION_SPECIALIST.capabilities,
                        "priority": 8
                    })
                    print(f"🔗 Created Integration Specialist: {child_id[:8]}...")
            
            # Child Agent 9: Debugging Specialist
            if critical_issues > 25:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose=DEBUGGING_SPECIALIST.description,
                    capabilities=DEBUGGING_SPECIALIST.capabilities,
                    tools=DEBUGGING_SPECIALIST.tools,
                    lifespan=90
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": DEBUGGING_SPECIALIST.name,
                        "capabilities": DEBUGGING_SPECIALIST.capabilities,
                        "priority": 9
                    })
                    print(f"🐛 Created Debugging Specialist: {child_id[:8]}...")
            
            # Original agents (continued)
            # Child Agent 10: Code Quality Specialist
            if critical_issues > 30:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose="Improve code quality and fix critical issues",
                    capabilities=["refactoring", "testing", "documentation"],
                    tools=["file_ops", "code_ops", "test_ops", "lint_ops"],
                    lifespan=100
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": "Code Quality Specialist",
                        "capabilities": ["refactoring", "testing", "documentation"],
                        "priority": 10
                    })
                    print(f"🎯 Created Code Quality Specialist: {child_id[:8]}...")
            
            # Child Agent 11: Performance Optimization Specialist
            if critical_issues > 35:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose="Optimize performance and fix bottlenecks",
                    capabilities=["performance", "profiling", "optimization"],
                    tools=["file_ops", "code_ops", "test_ops", "perf_ops"],
                    lifespan=80
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": "Performance Specialist",
                        "capabilities": ["performance", "profiling", "optimization"],
                        "priority": 11
                    })
                    print(f"🎯 Created Performance Specialist: {child_id[:8]}...")
            
            # Child Agent 12: Testing Specialist
            if critical_issues > 40:
                child_id = self.swarm_coordinator.create_child_agent(
                    purpose="Create comprehensive test suites",
                    capabilities=["unit_testing", "integration_testing", "test_automation"],
                    tools=["file_ops", "code_ops", "test_ops", "coverage_ops"],
                    lifespan=90
                )
                if child_id:
                    results["children"].append({
                        "id": child_id,
                        "purpose": "Testing Specialist",
                        "capabilities": ["unit_testing", "integration_testing", "test_automation"],
                        "priority": 12
                    })
                    print(f"🎯 Created Testing Specialist: {child_id[:8]}...")
            
            logger.info(f"👶 Created {len(results['children'])} specialized child agents")
            print(f"🎯 Total specialized agents created: {len(results['children'])}")
            
        except Exception as e:
            results["success"] = False
            results["failed"].append(str(e))
            logger.error(f"❌ Failed to create child agents: {e}")
        
        return results
    
    def _create_child_agents(self, project_status: Dict[str, Any]) -> Dict[str, Any]:
        """Create child agents - wrapper for specialized children"""
        return self._create_specialized_children(project_status)
    
    def get_swarm_status(self) -> Dict[str, Any]:
        """Generate final boot status report"""
        
        # Process any pending messages
        processed_messages = A2A_MANAGER.process_messages()
        
        # Get comprehensive status
        swarm_status = self.swarm_coordinator.get_swarm_status() if self.swarm_coordinator else {}
        
        status = {
            "boot_time": self.boot_time.isoformat(),
            "duration_seconds": (datetime.now() - self.boot_time).total_seconds(),
            "initialized_agents": len(self.initialized_agents),
            "swarm_status": swarm_status,
            "communication_links": len(A2A_MANAGER._message_handlers),
            "child_agents": len(CHILD_AGENT_MANAGER.get_all_children()),
            "processed_messages": len(processed_messages),
            "available_tools": len(TOOL_REGISTRY.get_all_tools()),
            "ecosystem_health": self._calculate_ecosystem_health()
        }
        
        return status
    
    def _auto_detect_work(self) -> Dict[str, Any]:
        """Auto-detect work from project documentation"""
        
        try:
            from .project_analyzer import PROJECT_ANALYZER
            
            print(f"🔍 Auto-Detecting Work from Documentation...")
            print(f"📚 Scanning project files...")
            
            # Analyze project
            analysis = PROJECT_ANALYZER.analyze_project()
            
            print(f"📊 Analysis Results:")
            print(f"  • Issues Detected: {analysis['issues_detected']}")
            print(f"  • Recommendations: {analysis['recommendations']}")
            print(f"  • Critical Issues: {analysis['critical_issues']}")
            print(f"  • High Priority: {analysis['high_priority_issues']}")
            print(f"  • Auto-Executable: {analysis['auto_executable_tasks']}")
            print(f"  • Project Health: {analysis['project_health']}")
            
            # Show critical issues found
            critical_issues = [issue for issue in analysis['issues'] if issue['priority'] == 'CRITICAL']
            if critical_issues:
                print(f"\n🚨 Critical Issues Found:")
                for issue in critical_issues[:3]:  # Show first 3
                    print(f"  • {issue['title']}")
                    print(f"    Location: {issue['location']}")
                    print(f"    Impact: {', '.join(issue['impact'])}")
            
            return {
                "success": True,
                "analysis": analysis,
                "issues_detected": analysis["issues_detected"],
                "recommendations": analysis["recommendations"],
                "critical_issues": analysis["critical_issues"],
                "project_health": analysis["project_health"]
            }
            
        except Exception as e:
            logger.error(f"❌ Auto-detection failed: {e}")
            print(f"❌ Auto-detection failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "analysis": {}
            }
    
    def _auto_execute_critical_tasks(self) -> Dict[str, Any]:
        """Auto-execute critical tasks if possible"""
        
        try:
            from .project_analyzer import PROJECT_ANALYZER
            
            # Get critical tasks
            print(f"🚀 Auto-Executing Critical Tasks...")
            executed_tasks = PROJECT_ANALYZER.auto_execute_critical_tasks()
            
            if executed_tasks:
                print(f"✅ Auto-Executed {len(executed_tasks)} Critical Tasks:")
                for task in executed_tasks:
                    print(f"  🎯 {task}")
            else:
                print(f"ℹ️ No critical tasks ready for auto-execution")
            
            return {
                "success": True,
                "executed_tasks": executed_tasks,
                "count": len(executed_tasks)
            }
            
        except Exception as e:
            logger.error(f"❌ Auto-execution failed: {e}")
            print(f"❌ Auto-execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "executed_tasks": []
            }
    
    def _calculate_ecosystem_health(self) -> Dict[str, Any]:
        """Calculate overall ecosystem health metrics"""
        
        health = {
            "overall": "healthy",
            "metrics": {},
            "issues": []
        }
        
        # Agent health - count all available agents (swarm + existing)
        swarm_count = len(self.swarm_coordinator.swarm_agents) if self.swarm_coordinator else 0
        existing_count = len(AGENT_REGISTRY.get_agents_by_type(AgentType.SPECIALIST))
        total_expected = 11  # 7 swarm + 4 existing
        total_available = swarm_count + existing_count
        coverage_ratio = total_available / total_expected
        
        health["metrics"]["agent_coverage"] = f"{total_available}/{total_expected} ({coverage_ratio:.1%})"
        health["metrics"]["swarm_agents"] = swarm_count
        health["metrics"]["existing_agents"] = existing_count
        
        if coverage_ratio < 0.8:
            health["overall"] = "degraded"
            health["issues"].append("Low agent coverage")
        elif coverage_ratio < 0.95:
            health["overall"] = "good"
            health["issues"].append("Some agents missing")
        
        # Communication health
        a2a_agents = len([name for name in AGENT_REGISTRY.get_all_agents() 
                           if AGENT_REGISTRY.supports_a2a(name)])
        a2a_ratio = a2a_agents / total_expected
        health["metrics"]["a2a_coverage"] = f"{a2a_agents}/{total_expected} ({a2a_ratio:.1%})"
        
        # Tool availability
        tool_count = len(TOOL_REGISTRY.get_all_tools())
        health["metrics"]["available_tools"] = tool_count
        
        # Message processing
        pending = len(A2A_MANAGER._message_queue)
        health["metrics"]["pending_messages"] = pending
        
        if pending > 10:
            if health["overall"] == "healthy":
                health["overall"] = "good"
            health["issues"].append("High message queue")
        
        # Overall assessment
        if not health["issues"]:
            health["overall"] = "excellent"
        
        return health

# Global boot manager
AGENT_BOOT_MANAGER = AgentBootManager()
