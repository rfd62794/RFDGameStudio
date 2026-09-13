"""
Conversation Starter - Manages ongoing agent conversations
Keeps agents actively communicating about project status and tasks
"""

import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta
import random

from .a2a_communication import A2A_MANAGER, MessageType, MessagePriority
from .agent_registry import AGENT_REGISTRY

logger = logging.getLogger(__name__)


class ConversationStarter:
    """Manages ongoing agent conversations"""
    
    def __init__(self):
        self.conversation_topics = [
            "project_status_check",
            "blocker_discussion", 
            "next_action_planning",
            "code_review_request",
            "test_status_update",
            "documentation_sync",
            "strategy_alignment",
            "resource_allocation"
        ]
        self.last_conversation_time = {}
        self.conversation_frequency = timedelta(minutes=5)  # Every 5 minutes
    
    def should_start_conversation(self, topic: str) -> bool:
        """Check if it's time for a new conversation"""
        last_time = self.last_conversation_time.get(topic)
        if not last_time:
            return True
        return datetime.now() - last_time > self.conversation_frequency
    
    def start_random_conversation(self, project_status: Dict[str, Any]) -> str:
        """Start a random conversation between agents"""
        
        # Pick a random topic
        topic = random.choice(self.conversation_topics)
        
        if not self.should_start_conversation(topic):
            return f"Skipping {topic} - too recent"
        
        try:
            if topic == "project_status_check":
                return self._start_project_status_check(project_status)
            elif topic == "blocker_discussion":
                return self._start_blocker_discussion(project_status)
            elif topic == "next_action_planning":
                return self._start_next_action_planning(project_status)
            elif topic == "code_review_request":
                return self._start_code_review_request(project_status)
            elif topic == "test_status_update":
                return self._start_test_status_update(project_status)
            elif topic == "documentation_sync":
                return self._start_documentation_sync(project_status)
            elif topic == "strategy_alignment":
                return self._start_strategy_alignment(project_status)
            elif topic == "resource_allocation":
                return self._start_resource_allocation(project_status)
            
        except Exception as e:
            logger.error(f"Failed to start conversation {topic}: {e}")
            return f"Failed: {e}"
    
    def _start_project_status_check(self, project_status: Dict[str, Any]) -> str:
        """Strategist asks coordinator about project status"""
        
        message_id = A2A_MANAGER.send_message(
            sender="strategist",
            recipient="swarm_coordinator",
            message_type=MessageType.REQUEST,
            content={
                "task": "Provide current project status assessment",
                "context": {
                    "focus_areas": ["blockers", "progress", "next_actions"],
                    "urgency": "medium"
                }
            },
            priority=MessagePriority.NORMAL
        )
        
        self.last_conversation_time["project_status_check"] = datetime.now()
        return f"Started project status check: {message_id}"
    
    def _start_blocker_discussion(self, project_status: Dict[str, Any]) -> str:
        """Coordinator discusses blockers with relevant agents"""
        
        blockers = project_status.get("blockers", [])
        if not blockers:
            return "No blockers to discuss"
        
        # Send to analyzer for deep dive
        message_id = A2A_MANAGER.send_message(
            sender="swarm_coordinator",
            recipient="analyzer",
            message_type=MessageType.REQUEST,
            content={
                "task": "Analyze current blockers and propose solutions",
                "context": {
                    "blockers": blockers,
                    "required_output": "solution_approaches"
                }
            },
            priority=MessagePriority.HIGH
        )
        
        self.last_conversation_time["blocker_discussion"] = datetime.now()
        return f"Started blocker discussion: {message_id}"
    
    def _start_next_action_planning(self, project_status: Dict[str, Any]) -> str:
        """Planner coordinates next actions with coordinator"""
        
        message_id = A2A_MANAGER.send_message(
            sender="planner",
            recipient="swarm_coordinator",
            message_type=MessageType.REQUEST,
            content={
                "task": "Review and refine next action priorities",
                "context": {
                    "current_actions": project_status.get("next_actions", []),
                    "available_resources": ["coder", "tester", "reviewer"]
                }
            },
            priority=MessagePriority.NORMAL
        )
        
        self.last_conversation_time["next_action_planning"] = datetime.now()
        return f"Started next action planning: {message_id}"
    
    def _start_code_review_request(self, project_status: Dict[str, Any]) -> str:
        """Coder requests code review from reviewer"""
        
        message_id = A2A_MANAGER.send_message(
            sender="coder",
            recipient="reviewer",
            message_type=MessageType.REQUEST,
            content={
                "task": "Review recent code changes for quality",
                "context": {
                    "focus_areas": ["architecture", "performance", "maintainability"],
                    "urgency": "normal"
                }
            },
            priority=MessagePriority.NORMAL
        )
        
        self.last_conversation_time["code_review_request"] = datetime.now()
        return f"Started code review request: {message_id}"
    
    def _start_test_status_update(self, project_status: Dict[str, Any]) -> str:
        """Tester provides status to coordinator"""
        
        message_id = A2A_MANAGER.send_message(
            sender="tester",
            recipient="swarm_coordinator",
            message_type=MessageType.NOTIFICATION,
            content={
                "task": "Test status update",
                "context": {
                    "test_coverage": "85%",
                    "recent_results": "15 passed, 2 failed",
                    "next_tests": ["ECS rendering", "Dungeon demo"]
                }
            },
            priority=MessagePriority.NORMAL
        )
        
        self.last_conversation_time["test_status_update"] = datetime.now()
        return f"Started test status update: {message_id}"
    
    def _start_documentation_sync(self, project_status: Dict[str, Any]) -> str:
        """Archivist syncs with herald about documentation"""
        
        message_id = A2A_MANAGER.send_message(
            sender="archivist",
            recipient="herald",
            message_type=MessageType.REQUEST,
            content={
                "task": "Update project documentation based on recent changes",
                "context": {
                    "docs_to_update": ["VISION.md", "TASKS.md", "MILESTONES.md"],
                    "recent_changes": "Swarm integration complete"
                }
            },
            priority=MessagePriority.LOW
        )
        
        self.last_conversation_time["documentation_sync"] = datetime.now()
        return f"Started documentation sync: {message_id}"
    
    def _start_strategy_alignment(self, project_status: Dict[str, Any]) -> str:
        """Strategist aligns with planner on strategy"""
        
        message_id = A2A_MANAGER.send_message(
            sender="strategist",
            recipient="planner",
            message_type=MessageType.REQUEST,
            content={
                "task": "Align implementation strategy with current goals",
                "context": {
                    "current_goals": project_status.get("goals", {}),
                    "focus": "Tower Defense integration"
                }
            },
            priority=MessagePriority.HIGH
        )
        
        self.last_conversation_time["strategy_alignment"] = datetime.now()
        return f"Started strategy alignment: {message_id}"
    
    def _start_resource_allocation(self, project_status: Dict[str, Any]) -> str:
        """Coordinator allocates resources to tasks"""
        
        message_id = A2A_MANAGER.broadcast_message(
            sender="swarm_coordinator",
            content={
                "task": "Resource allocation update",
                "context": {
                    "current_allocations": {
                        "coder": "ECS rendering system",
                        "tester": "Dungeon demo validation",
                        "reviewer": "Code quality assurance"
                    },
                    "available_capacity": "medium"
                }
            },
            priority=MessagePriority.NORMAL
        )
        
        self.last_conversation_time["resource_allocation"] = datetime.now()
        return f"Started resource allocation: {message_id}"
    
    def get_conversation_stats(self) -> Dict[str, Any]:
        """Get conversation statistics"""
        
        stats = {
            "total_topics": len(self.conversation_topics),
            "active_topics": len([t for t in self.conversation_topics 
                                if self.should_start_conversation(t)]),
            "last_conversations": {
                topic: time.isoformat() if time else "never"
                for topic, time in self.last_conversation_time.items()
            },
            "conversation_frequency": str(self.conversation_frequency)
        }
        
        return stats

# Global conversation starter
CONVERSATION_STARTER = ConversationStarter()
