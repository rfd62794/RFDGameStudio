"""
Narrative Bridge - ADR 177: Loot-to-Lore Pipeline
Connects successful extractions to rpgCore persistence and story systems
"""

import json
import time
import random
from typing import Dict, List, Any, Optional
from pathlib import Path
from dataclasses import dataclass

from loguru import logger


@dataclass
class ExtractionResult:
    """Result of a 60-second extraction run"""
    success: bool
    final_mass: float
    energy_remaining: float
    distance_traveled: float
    asteroid_hits: int
    survival_time: float
    clone_number: int


class NarrativeBridge:
    """Bridge between game mechanics and narrative systems"""
    
    def __init__(self):
        self.locker_path = Path("src/assets/locker.json")
        self.archive_path = Path("archive/stories")
        
        # Story thresholds for unlocking content
        self.story_thresholds = {
            1: "first_extraction.md",
            5: "seasoned_scout.md", 
            10: "veteran_pilot.md",
            25: "master_salvager.md"
        }
        
        # Med-Bay de-sync logs
        self.med_bay_logs = [
            "Clone #{clone_number} stabilized. Memory fragments indicate high-velocity impact.",
            "Neural pathways recalibrated. Previous clone suffered de-sync at velocity {impact_velocity:.1f}.",
            "Cellular reconstruction complete. Clone #{clone_number} reporting for duty. Avoid high-speed collisions.",
            "Temporal displacement detected. Clone #{clone_number} experiencing temporal drift from asteroid field.",
            "Consciousness restored. Medical log: Clone #{clone_number} terminated due to structural integrity failure."
        ]
        
        logger.info("📖 Narrative Bridge initialized - Loot-to-Lore pipeline active")
    
    def load_locker(self) -> Dict[str, Any]:
        """Load locker data from file"""
        try:
            if self.locker_path.exists():
                with open(self.locker_path, 'r') as f:
                    return json.load(f)
            else:
                # Create default locker
                default_locker = {
                    "player_stats": {
                        "total_scrap_collected": 0,
                        "successful_extractions": 0,
                        "failed_attempts": 0,
                        "clone_number": 1,
                        "highest_mass_achieved": 0.0,
                        "total_distance_traveled": 0.0,
                        "credits": 0
                    },
                    "recent_extractions": [],
                    "unlocked_stories": [],
                    "med_bay_logs": []
                }
                self.save_locker(default_locker)
                return default_locker
        except Exception as e:
            logger.error(f"❌ Failed to load locker: {e}")
            return self._get_empty_locker()
    
    def save_locker(self, locker_data: Dict[str, Any]) -> bool:
        """Save locker data to file"""
        try:
            # Ensure directory exists
            self.locker_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(self.locker_path, 'w') as f:
                json.dump(locker_data, f, indent=2)
            
            logger.debug(f"💾 Locker saved successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save locker: {e}")
            return False
    
    def _get_empty_locker(self) -> Dict[str, Any]:
        """Get empty locker structure"""
        return {
            "player_stats": {
                "total_scrap_collected": 0,
                "successful_extractions": 0,
                "failed_attempts": 0,
                "clone_number": 1,
                "highest_mass_achieved": 0.0,
                "total_distance_traveled": 0.0,
                "credits": 0
            },
            "recent_extractions": [],
            "unlocked_stories": [],
            "med_bay_logs": []
        }
    
    def process_extraction(self, result: ExtractionResult) -> Dict[str, Any]:
        """Process extraction result and update locker"""
        locker = self.load_locker()
        stats = locker["player_stats"]
        
        if result.success:
            # SUCCESSFUL EXTRACTION
            stats["successful_extractions"] += 1
            
            # Convert mass to scrap and credits
            scrap_collected = max(1.0, result.final_mass - 10.0)  # Base mass is 10
            credits_earned = int(scrap_collected * 10)  # 10 credits per scrap unit
            
            stats["total_scrap_collected"] += scrap_collected
            stats["credits"] += credits_earned
            stats["total_distance_traveled"] += result.distance_traveled
            
            # Update highest mass achieved
            if result.final_mass > stats["highest_mass_achieved"]:
                stats["highest_mass_achieved"] = result.final_mass
            
            # Add to recent extractions
            extraction_record = {
                "timestamp": time.time(),
                "mass": result.final_mass,
                "scrap": scrap_collected,
                "credits": credits_earned,
                "survival_time": result.survival_time,
                "energy_remaining": result.energy_remaining
            }
            
            locker["recent_extractions"].append(extraction_record)
            
            # Keep only last 10 extractions
            if len(locker["recent_extractions"]) > 10:
                locker["recent_extractions"] = locker["recent_extractions"][-10:]
            
            # Check for story unlocks
            new_stories = self._check_story_unlocks(stats["successful_extractions"], locker["unlocked_stories"])
            locker["unlocked_stories"].extend(new_stories)
            
            # Save updated locker
            self.save_locker(locker)
            
            logger.success(f"🏆 EXTRACTION RECORDED: +{scrap_collected:.1f} scrap, +{credits_earned} credits")
            
            return {
                "type": "success",
                "scrap_collected": scrap_collected,
                "credits_earned": credits_earned,
                "new_stories": new_stories,
                "total_extractions": stats["successful_extractions"],
                "total_credits": stats["credits"]
            }
            
        else:
            # FAILED EXTRACTION (DE-SYNC)
            stats["failed_attempts"] += 1
            stats["clone_number"] += 1
            
            # Add med-bay log
            med_log = self._generate_med_bay_log(result.clone_number, result.asteroid_hits)
            locker["med_bay_logs"].append({
                "timestamp": time.time(),
                "clone_number": result.clone_number,
                "log": med_log
            })
            
            # Keep only last 5 med-bay logs
            if len(locker["med_bay_logs"]) > 5:
                locker["med_bay_logs"] = locker["med_bay_logs"][-5:]
            
            # Save updated locker
            self.save_locker(locker)
            
            logger.error(f"💥 DE-SYNC RECORDED: Clone #{result.clone_number} terminated")
            
            return {
                "type": "failure",
                "clone_number": result.clone_number,
                "med_bay_log": med_log,
                "total_failures": stats["failed_attempts"]
            }
    
    def _check_story_unlocks(self, extraction_count: int, unlocked_stories: List[str]) -> List[str]:
        """Check for new story unlocks based on extraction count"""
        new_stories = []
        
        for threshold, story_file in self.story_thresholds.items():
            if extraction_count >= threshold and story_file not in unlocked_stories:
                new_stories.append(story_file)
        
        return new_stories
    
    def _generate_med_bay_log(self, clone_number: int, asteroid_hits: int) -> str:
        """Generate med-bay log for de-synced clone"""
        template = random.choice(self.med_bay_logs)
        
        # Format the template
        try:
            log = template.format(
                clone_number=clone_number,
                impact_velocity=random.uniform(5.1, 15.0)
            )
        except KeyError:
            # Fallback if template has unexpected placeholders
            log = f"Clone #{clone_number} stabilized. Memory fragments indicate high-velocity impact after {asteroid_hits} collisions."
        
        return log
    
    def get_random_story(self) -> Optional[str]:
        """Get a random story from the archive"""
        try:
            if not self.archive_path.exists():
                return None
            
            story_files = list(self.archive_path.glob("*.md"))
            if not story_files:
                return None
            
            # Pick random story
            story_file = random.choice(story_files)
            
            with open(story_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract first paragraph or first few lines
            lines = content.split('\n')
            story_lines = []
            
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#'):
                    story_lines.append(line)
                    if len(story_lines) >= 3:  # First 3 non-empty lines
                        break
            
            return '\n'.join(story_lines) if story_lines else None
            
        except Exception as e:
            logger.warning(f"⚠️ Could not load story: {e}")
            return None
    
    def get_player_summary(self) -> Dict[str, Any]:
        """Get comprehensive player summary"""
        locker = self.load_locker()
        stats = locker["player_stats"]
        
        return {
            "total_scrap": stats["total_scrap_collected"],
            "credits": stats["credits"],
            "successful_extractions": stats["successful_extractions"],
            "failed_attempts": stats["failed_attempts"],
            "clone_number": stats["clone_number"],
            "success_rate": (stats["successful_extractions"] / max(1, stats["successful_extractions"] + stats["failed_attempts"])) * 100,
            "highest_mass": stats["highest_mass_achieved"],
            "total_distance": stats["total_distance_traveled"],
            "unlocked_stories": len(locker["unlocked_stories"]),
            "recent_extractions": locker["recent_extractions"][-3:]  # Last 3 extractions
        }


# Global narrative bridge instance
narrative_bridge = NarrativeBridge()


def process_extraction_result(result: ExtractionResult) -> Dict[str, Any]:
    """Convenience function to process extraction result"""
    return narrative_bridge.process_extraction(result)


def get_player_summary() -> Dict[str, Any]:
    """Convenience function to get player summary"""
    return narrative_bridge.get_player_summary()


def get_random_story_snippet() -> Optional[str]:
    """Convenience function to get random story"""
    return narrative_bridge.get_random_story()
