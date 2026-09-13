"""Local analysis layer - pure Python, no external calls"""

from typing import Dict, List

class StatusAnalyzer:
    """Analyze status from loaded data"""
    
    def __init__(self, data_loader):
        self.data_loader = data_loader
        self.milestones = data_loader.load_milestones()
        self.goals = data_loader.load_goals()
    
    def get_phase_status(self, phase_num: int) -> Dict:
        """Get phase status from loaded data"""
        phase_key = f"phase_{phase_num}"
        return self.milestones.get(phase_key, {})
    
    def get_active_phase(self) -> int:
        """Detect which phase is currently active"""
        for phase_num in [3, 2, 1]:
            phase = self.milestones.get(f"phase_{phase_num}", {})
            if phase.get("status", "").startswith("🔄"):
                return phase_num
        return 3  # Default to phase 3
    
    def get_blockers(self) -> List[Dict]:
        """Detect blockers from data"""
        blockers = []
        
        # Phase 3 specific blockers
        if self.milestones["phase_3"]["status"].startswith("🔄"):
            # Check if approval is pending
            blockers.append({
                "type": "approval",
                "description": "Phase 3 awaiting Director approval",
                "impact": "high",
                "fix_time": "Awaiting Robert"
            })
        
        return blockers
    
    def get_priorities(self) -> List[Dict]:
        """Get current priorities from data"""
        priorities = []
        
        # Priority 1: Fix tests
        priorities.append({
            "priority": 1,
            "task": "Fix any remaining test failures",
            "impact": "Unblocks all development",
            "time": "30 minutes",
            "status": "✅ Complete"
        })
        
        # Priority 2: Phase 3 approval
        priorities.append({
            "priority": 2,
            "task": "Director approval for Phase 3",
            "impact": "Unlocks Phase 3 specification",
            "time": "Awaiting Robert",
            "status": "🔄 Awaiting Director"
        })
        
        # Priority 3: Implementation
        priorities.append({
            "priority": 3,
            "task": "Begin Phase 3 implementation",
            "impact": "Modular sprite-driven engine",
            "time": "6-8 sessions",
            "status": "🔄 Pending approval"
        })
        
        return priorities
