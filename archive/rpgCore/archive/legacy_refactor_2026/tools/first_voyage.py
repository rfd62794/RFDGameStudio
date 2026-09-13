"""
The First Voyage - Seed Zero Historical Foundation

This script executes the inaugural 100-turn journey through the DGT world
to establish the Seed_Zero.json manifest - the "Big Bang" of the 1,000-year
historical timeline.

The First Voyage represents the canonical starting point for all future
simulations and serves as the baseline for system validation.
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime

from loguru import logger

import sys
from pathlib import Path

# Add src directory to Python path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from core.simulator import SimulatorHost, ActionResult
from core.intent_registry import IntentRegistry
from game_state import GameState


@dataclass
class VoyageLog:
    """Single turn log entry from The First Voyage."""
    turn_number: int
    timestamp: str
    player_input: str
    intent: str
    success: bool
    prose: str
    hp_delta: int
    gold_delta: int
    location: str
    narrative_seed: str
    system_state: Dict[str, Any]


@dataclass
class SeedZeroManifest:
    """Complete Seed Zero manifest for historical foundation."""
    voyage_id: str
    start_timestamp: str
    end_timestamp: str
    total_turns: int
    final_state: Dict[str, Any]
    voyage_logs: List[VoyageLog]
    system_metrics: Dict[str, Any]
    intent_distribution: Dict[str, int]
    location_history: List[str]
    validation_checksum: str


class FirstVoyageCaptain:
    """
    Autonomous captain for The First Voyage.
    
    Executes a predetermined 100-turn journey through the DGT world
    following a scripted narrative arc.
    """
    
    def __init__(self):
        self.voyage_script = self._generate_voyage_script()
        self.current_turn = 0
        
    def _generate_voyage_script(self) -> List[str]:
        """
        Generate the 100-turn voyage script.
        
        This script represents the canonical journey that establishes
        the historical foundation of the DGT world.
        """
        script = [
            # Turns 1-10: Tavern Introduction
            "I look around the tavern",
            "I talk to the bartender",
            "I investigate the wooden table",
            "I talk to the guard",
            "I investigate the beer mug",
            "I rest at the table",
            "I talk to the bartender about the town",
            "I investigate the tavern entrance",
            "I help the bartender clean up",
            "I talk to the guard about local news",
            
            # Turns 11-20: First Exploration
            "I leave the tavern",
            "I investigate the town square",
            "I talk to the merchant",
            "I investigate the market stalls",
            "I talk to the guard captain",
            "I investigate the town notice board",
            "I trade with the merchant",
            "I investigate the fountain",
            "I talk to the town crier",
            "I rest on the bench",
            
            # Turns 21-30: Social Development
            "I talk to the merchant about goods",
            "I help the merchant with crates",
            "I investigate the merchant's cart",
            "I trade for a healing potion",
            "I talk to the guard captain about safety",
            "I investigate the town walls",
            "I help the guard with patrol duty",
            "I talk to the townsfolk",
            "I investigate the inn",
            "I rest at the inn",
            
            # Turns 31-40: Skill Development
            "I investigate the training grounds",
            "I talk to the weapons master",
            "I use the training dummy",
            "I investigate the armor rack",
            "I talk to the veteran soldier",
            "I practice with the wooden sword",
            "I investigate the archery range",
            "I use the bow and arrows",
            "I talk to the archery instructor",
            "I rest after training",
            
            # Turns 41-50: Mystery Introduction
            "I investigate the strange noises",
            "I talk to the concerned citizen",
            "I investigate the dark alley",
            "I use the lantern to see better",
            "I investigate the mysterious symbols",
            "I talk to the scholar about runes",
            "I investigate the ancient book",
            "I talk to the historian about legends",
            "I investigate the old map",
            "I rest to ponder the mystery",
            
            # Turns 51-60: Adventure Preparation
            "I talk to the merchant about supplies",
            "I trade for rations and water",
            "I investigate the equipment shop",
            "I use the climbing gear",
            "I talk to the guide about the forest",
            "I investigate the forest path",
            "I talk to the ranger about dangers",
            "I investigate the abandoned cabin",
            "I use the healing supplies",
            "I rest at the cabin",
            
            # Turns 61-70: Forest Journey
            "I investigate the forest creatures",
            "I talk to the forest spirit",
            "I investigate the ancient tree",
            "I use the nature knowledge",
            "I talk to the animals",
            "I investigate the hidden path",
            "I investigate the cave entrance",
            "I use the torch to light the way",
            "I talk to the cave echo",
            "I rest in the cave",
            
            # Turns 71-80: Underground Discovery
            "I investigate the cave paintings",
            "I talk to the ancient spirits",
            "I investigate the underground river",
            "I use the boat to cross",
            "I investigate the treasure chamber",
            "I talk to the guardian spirit",
            "I investigate the ancient artifact",
            "I use the magical device",
            "I talk to the wisdom keeper",
            "I rest before the return",
            
            # Turns 81-90: Return Journey
            "I investigate the way back",
            "I talk to the forest guide",
            "I investigate the changed landscape",
            "I use the new knowledge",
            "I talk to the town about discoveries",
            "I investigate the town's reaction",
            "I talk to the council about the artifact",
            "I investigate the council chamber",
            "I use the diplomatic skills",
            "I rest after the journey",
            
            # Turns 91-100: Legacy Establishment
            "I investigate the museum space",
            "I talk to the curator about exhibits",
            "I investigate the historical records",
            "I use the writing materials",
            "I talk to the scholars about knowledge",
            "I investigate the library archives",
            "I talk to the future generations",
            "I investigate the legacy monument",
            "I use the ceremonial tools",
            "I rest and reflect on the journey"
        ]
        
        return script
    
    def get_next_action(self) -> str:
        """Get the next action from the voyage script."""
        if self.current_turn < len(self.voyage_script):
            action = self.voyage_script[self.current_turn]
            self.current_turn += 1
            return action
        else:
            return "I rest and complete my journey"


class FirstVoyageExecutor:
    """
    Executor for The First Voyage simulation.
    
    Manages the 100-turn journey and creates the Seed_Zero manifest.
    """
    
    def __init__(self, save_path: Path = Path("seed_zero_save.json")):
        self.save_path = save_path
        self.captain = FirstVoyageCaptain()
        self.simulator: Optional[SimulatorHost] = None
        self.voyage_logs: List[VoyageLog] = []
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        
    async def execute_voyage(self) -> SeedZeroManifest:
        """
        Execute the complete First Voyage.
        
        Returns:
            SeedZeroManifest with complete journey data
        """
        logger.info("🚀 Initiating The First Voyage - Seed Zero Foundation")
        
        # Initialize simulator
        self.simulator = SimulatorHost(save_path=self.save_path)
        if not self.simulator.initialize():
            raise RuntimeError("Failed to initialize simulator for First Voyage")
        
        self.start_time = datetime.now()
        logger.info(f"⏰ Voyage started at {self.start_time}")
        
        # Execute 100 turns
        for turn in range(1, 101):
            await self._execute_turn(turn)
            
            # Small delay between turns for realism
            await asyncio.sleep(0.1)
        
        self.end_time = datetime.now()
        logger.info(f"⏰ Voyage completed at {self.end_time}")
        
        # Create Seed Zero manifest
        manifest = self._create_seed_zero_manifest()
        
        # Cleanup
        self.simulator.stop()
        
        return manifest
    
    async def _execute_turn(self, turn_number: int) -> None:
        """Execute a single turn of the voyage."""
        logger.info(f"📍 Turn {turn_number}/100")
        
        # Get action from captain
        player_input = self.captain.get_next_action()
        
        # Process action through simulator
        result = await self.simulator.process_action(player_input)
        
        # Create voyage log
        state = self.simulator.get_state()
        log_entry = VoyageLog(
            turn_number=turn_number,
            timestamp=datetime.now().isoformat(),
            player_input=player_input,
            intent=result.intent,
            success=result.success,
            prose=result.prose,
            hp_delta=result.hp_delta,
            gold_delta=result.gold_delta,
            location=state.current_room if state else "unknown",
            narrative_seed=result.narrative_seed,
            system_state={
                "player_hp": state.player.hp if state else 0,
                "player_gold": state.player.gold if state else 0,
                "turn_count": state.turn_count if state else 0,
                "reputation": dict(state.reputation) if state else {}
            }
        )
        
        self.voyage_logs.append(log_entry)
        
        logger.debug(f"✅ Turn {turn_number}: {result.intent} -> {'SUCCESS' if result.success else 'FAILURE'}")
    
    def _create_seed_zero_manifest(self) -> SeedZeroManifest:
        """Create the Seed Zero manifest from voyage data."""
        state = self.simulator.get_state()
        
        # Calculate intent distribution
        intent_distribution = {}
        for log in self.voyage_logs:
            intent_distribution[log.intent] = intent_distribution.get(log.intent, 0) + 1
        
        # Calculate location history
        location_history = list({log.location for log in self.voyage_logs})
        
        # Calculate system metrics
        total_time = (self.end_time - self.start_time).total_seconds()
        avg_turn_time = total_time / 100
        
        system_metrics = {
            "total_voyage_time_seconds": total_time,
            "average_turn_time_seconds": avg_turn_time,
            "total_actions": 100,
            "successful_actions": sum(1 for log in self.voyage_logs if log.success),
            "failed_actions": sum(1 for log in self.voyage_logs if not log.success),
            "unique_intents_used": len(intent_distribution),
            "unique_locations_visited": len(location_history),
            "final_player_hp": state.player.hp if state else 0,
            "final_player_gold": state.player.gold if state else 0,
            "final_reputation": dict(state.reputation) if state else {}
        }
        
        # Create final state snapshot
        final_state = {
            "game_state": state.model_dump() if state else {},
            "simulator_config": {
                "target_fps": 30,
                "view_mode": "terminal",
                "save_path": str(self.save_path)
            },
            "system_timestamp": datetime.now().isoformat()
        }
        
        # Generate validation checksum
        import hashlib
        manifest_data = {
            "voyage_id": "seed_zero_voyage_001",
            "total_turns": 100,
            "final_state": final_state,
            "system_metrics": system_metrics
        }
        checksum = hashlib.sha256(json.dumps(manifest_data, sort_keys=True).encode()).hexdigest()
        
        manifest = SeedZeroManifest(
            voyage_id="seed_zero_voyage_001",
            start_timestamp=self.start_time.isoformat(),
            end_timestamp=self.end_time.isoformat(),
            total_turns=100,
            final_state=final_state,
            voyage_logs=self.voyage_logs,
            system_metrics=system_metrics,
            intent_distribution=intent_distribution,
            location_history=location_history,
            validation_checksum=checksum
        )
        
        return manifest
    
    def save_seed_zero(self, manifest: SeedZeroManifest, output_path: Path = Path("Seed_Zero.json")) -> None:
        """Save the Seed Zero manifest to file."""
        logger.info(f"💾 Saving Seed Zero manifest to {output_path}")
        
        # Convert to serializable format
        manifest_dict = asdict(manifest)
        
        # Save with pretty formatting
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Seed Zero manifest saved successfully")
        
        # Log summary
        metrics = manifest.system_metrics
        logger.info("📊 First Voyage Summary:")
        logger.info(f"   Total time: {metrics['total_voyage_time_seconds']:.2f} seconds")
        logger.info(f"   Success rate: {metrics['successful_actions']}/100")
        logger.info(f"   Intents used: {metrics['unique_intents_used']}")
        logger.info(f"   Locations visited: {metrics['unique_locations_visited']}")
        logger.info(f"   Final HP: {metrics['final_player_hp']}")
        logger.info(f"   Final Gold: {metrics['final_player_gold']}")


async def main():
    """Main execution function for The First Voyage."""
    # Configure logging
    logger.remove()
    logger.add(
        "first_voyage.log",
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}",
        rotation="10 MB"
    )
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🚀 The First Voyage - Seed Zero Foundation")
    print("=" * 50)
    print("Executing 100-turn journey to establish historical baseline...")
    print()
    
    try:
        # Create executor
        executor = FirstVoyageExecutor()
        
        # Execute voyage
        manifest = await executor.execute_voyage()
        
        # Save results
        executor.save_seed_zero(manifest)
        
        print()
        print("🏆 The First Voyage completed successfully!")
        print("📁 Seed_Zero.json created - Historical foundation established")
        print("🎯 Ready for 1,000-year narrative timeline")
        print()
        print("✨ The Big Bang of DGT history is complete.")
        
    except Exception as e:
        logger.error(f"❌ First Voyage failed: {e}")
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
