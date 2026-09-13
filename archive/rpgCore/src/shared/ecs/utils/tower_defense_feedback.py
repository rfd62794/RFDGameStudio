"""
Tower Defense Resource Feedback Mechanism
ADR-009: Session Isolation
"""
from typing import Dict, Any
from loguru import logger

from src.shared.ecs.sessions.tower_defense_session import TowerDefenseSession
from src.shared.teams.roster import Roster


def end_tower_defense_session(session: TowerDefenseSession, roster: Roster) -> Dict[str, Any]:
    """Feed TD session results back to roster"""
    results = {
        "session_id": session.session_id,
        "gold_earned": session.gold_earned,
        "score": session.score,
        "waves_cleared": session.completed_waves,
        "enemies_killed": session.enemies_killed,
        "enemies_escaped": session.enemies_escaped,
        "towers_placed": session.towers_placed,
        "victory": session.victory,
        "result": "Victory" if session.victory else "Defeat",
        "achievements": [],
        "statistics": session.get_statistics(),
    }
    
    # Add gold to roster resources
    if hasattr(roster, 'gold'):
        roster.gold += session.gold_earned
        logger.info(f"Added {session.gold_earned} gold to roster")
    else:
        logger.warning("Roster does not have gold attribute")
    
    # Award achievements
    achievements = _calculate_achievements(session)
    results["achievements"] = achievements
    
    # Add achievements to roster if it supports them
    if hasattr(roster, 'achievements'):
        roster.achievements.extend(achievements)
        logger.info(f"Added {len(achievements)} achievements to roster")
    
    # Log session results
    logger.info(f"TD Session {session.session_id} completed:")
    logger.info(f"  - Gold earned: {session.gold_earned}")
    logger.info(f"  - Score: {session.score}")
    logger.info(f"  - Waves cleared: {session.completed_waves}")
    logger.info(f"  - Enemies killed: {session.enemies_killed}")
    logger.info(f"  - Enemies escaped: {session.enemies_escaped}")
    logger.info(f"  - Victory: {session.victory}")
    
    return results


def _calculate_achievements(session: TowerDefenseSession) -> list[str]:
    """Calculate achievements based on session performance"""
    achievements = []
    
    # Wave achievements
    if session.completed_waves >= 10:
        achievements.append("Wave Master")
    if session.completed_waves >= 20:
        achievements.append("Wave Legend")
    if session.completed_waves >= 50:
        achievements.append("Wave God")
    
    # Score achievements
    if session.score >= 1000:
        achievements.append("Scorer")
    if session.score >= 5000:
        achievements.append("High Scorer")
    if session.score >= 10000:
        achievements.append("Score Master")
    
    # Combat achievements
    if session.enemies_killed >= 100:
        achievements.append("Hunter")
    if session.enemies_killed >= 500:
        achievements.append("Slayer")
    if session.enemies_killed >= 1000:
        achievements.append("Destroyer")
    
    # Defense achievements
    if session.enemies_escaped == 0 and session.completed_waves >= 5:
        achievements.append("Perfect Defense")
    if session.lives >= 15 and session.completed_waves >= 10:
        achievements.append("Fortress")
    
    # Victory achievements
    if session.victory:
        achievements.append("Victorious")
        if session.completed_waves >= 20:
            achievements.append("Champion")
        if session.completed_waves >= 50:
            achievements.append("Legend")
    
    # Special achievements
    if session.towers_placed == 1 and session.completed_waves >= 10:
        achievements.append("Solo Defender")
    if session.towers_placed >= 10 and session.completed_waves >= 20:
        achievements.append("Tower Commander")
    
    # Efficiency achievements
    if session.gold_earned >= 1000:
        achievements.append("Gold Miner")
    if session.enemies_killed >= 100 and session.enemies_escaped <= 5:
        achievements.append("Efficient Killer")
    
    return achievements


def get_session_summary(session: TowerDefenseSession) -> Dict[str, Any]:
    """Get a summary of the session for display"""
    return {
        "session_id": session.session_id,
        "result": "Victory" if session.victory else "Defeat",
        "wave": session.wave,
        "completed_waves": session.completed_waves,
        "score": session.score,
        "gold_earned": session.gold_earned,
        "gold_remaining": session.gold,
        "lives_remaining": session.lives,
        "towers_placed": session.towers_placed,
        "enemies_killed": session.enemies_killed,
        "enemies_escaped": session.enemies_escaped,
        "kill_ratio": session.enemies_killed / max(1, session.enemies_killed + session.enemies_escaped),
        "achievements": _calculate_achievements(session),
        "statistics": session.get_statistics(),
    }


def format_session_results(results: Dict[str, Any]) -> str:
    """Format session results for display"""
    lines = [
        f"=== Tower Defense Session {results['session_id']} ===",
        f"Result: {results['result']}",
        f"Waves Cleared: {results['waves_cleared']}",
        f"Score: {results['score']}",
        f"Gold Earned: {results['gold_earned']}",
        f"Enemies Killed: {results['enemies_killed']}",
        f"Enemies Escaped: {results['enemies_escaped']}",
        f"Towers Placed: {results['towers_placed']}",
    ]
    
    if results['achievements']:
        lines.append("Achievements:")
        for achievement in results['achievements']:
            lines.append(f"  - {achievement}")
    
    return "\n".join(lines)


def validate_session_integrity(session: TowerDefenseSession) -> bool:
    """Validate session integrity for debugging"""
    try:
        # Check basic invariants
        assert session.wave >= 1, "Wave number must be positive"
        assert session.gold >= 0, "Gold cannot be negative"
        assert session.lives >= 0, "Lives cannot be negative"
        assert session.score >= 0, "Score cannot be negative"
        assert session.completed_waves >= 0, "Completed waves cannot be negative"
        assert session.enemies_killed >= 0, "Enemies killed cannot be negative"
        assert session.enemies_escaped >= 0, "Enemies escaped cannot be negative"
        assert session.towers_placed >= 0, "Towers placed cannot be negative"
        
        # Check grid consistency
        assert len(session.tower_grid) == session.towers_placed, "Grid entries must match towers placed"
        
        # Check wave component consistency
        assert session.wave_component.wave_number == session.wave, "Wave component must match session wave"
        
        return True
        
    except AssertionError as e:
        logger.error(f"Session integrity validation failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during session validation: {e}")
        return False
