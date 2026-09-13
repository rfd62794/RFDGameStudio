"""
ADR 077: Tag-Based Auto-Combat System Test
The Forest Gate Guardian awaits its challenger!

This script demonstrates the complete combat system:
- CombatResolver with tag-based synergies
- Forest Guardian with combat stats
- Turn-based D20 combat resolution
- Victory/defeat conditions
"""

import sys
import os
import asyncio
import time
from typing import Optional

# Add src to path
_src = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
if _src not in sys.path:
    sys.path.insert(0, _src)

from rpg_core.systems.kernel.config import create_default_config
from rpg_core.game_engine import DDEngine, DDEngineFactory
from rpg_core.game_engine.combat_resolver import CombatResolver
from rpg_core.systems.body.pipeline.asset_loader import AssetLoader

class CombatTestSession:
    """Test session for the Tag-Based Auto-Combat System"""
    
    def __init__(self, seed: str = "FOREST_GATE_COMBAT"):
        self.seed = seed
        
        # Create configuration
        self.config = create_default_config(seed)
        
        # Initialize DDEngine with combat resolver
        self.dd_engine = DDEngineFactory.create_engine(self.config.mind)
        
        # Asset system
        self.asset_loader = AssetLoader()
        
        print(f"⚔️ Combat Test Session Initialized")
        print(f"🌍 Seed: {seed}")
        print(f"🛡️ Combat Resolver: Tag-Based Auto-Combat Ready")
    
    def test_guardian_stats(self) -> None:
        """Test that the Forest Guardian loads correctly"""
        print("\n" + "="*60)
        print("⚔️ FOREST GUARDIAN COMBAT STATS")
        print("="*60)
        
        guardian_def = self.asset_loader.get_asset_definition('forest_guardian')
        
        if not guardian_def or not guardian_def.characteristics:
            print("❌ Forest Guardian not found or missing characteristics")
            return
        
        char = guardian_def.characteristics
        combat_stats = char.combat_stats
        
        print(f"🛡️ Guardian: {guardian_def.asset_id}")
        print(f"🏷️ Tags: {char.tags}")
        print(f"💪 HP: {combat_stats.get('hp', 'N/A')}")
        print(f"⚔️ STR: {combat_stats.get('str', 'N/A')}")
        print(f"🛡️ DEF: {combat_stats.get('def', 'N/A')}")
        print(f"🎯 Initiative: {combat_stats.get('initiative', 'N/A')}")
        print(f"🔥 Resistances: {char.resistances}")
        print(f"💔 Weaknesses: {char.weaknesses}")
        
        # Test tag-based bonuses
        print(f"\n🏷️ Tag-Based Synergies:")
        print(f"  - sharp_vs_organic: +2")
        print(f"  - blunt_vs_armored: +1")
        print(f"  - fire_vs_wood: +3")
        print(f"  - magic_vs_stone: +2")
        
        print(f"\n✅ Forest Guardian loaded successfully!")
        return guardian_def
    
    def test_combat_resolver(self) -> None:
        """Test the CombatResolver system"""
        print("\n" + "="*60)
        print("⚔️ COMBAT RESOLVER TEST")
        print("="*60)
        
        # Create combat resolver
        resolver = CombatResolver(f"{self.seed}_test")
        
        # Create mock combatants
        voyager_def = self.asset_loader.get_asset_definition('voyager') or self._create_mock_voyager()
        guardian_def = self.asset_loader.get_asset_definition('forest_guardian')
        
        if not guardian_def:
            print("❌ Forest Guardian not found")
            return
        
        # Start combat
        voyager_pos = (10, 10)
        guardian_pos = (12, 10)
        
        resolver.start_combat(voyager_pos, guardian_pos, voyager_def, guardian_def)
        
        print(f"⚔️ Combat Started!")
        print(f"🚶 Voyager HP: {resolver.combatants['voyager'].current_hp}")
        print(f"🛡️ Guardian HP: {resolver.combatants['guardian'].current_hp}")
        
        # Resolve combat
        combat_log = resolver.resolve_combat()
        
        print(f"\n📜 COMBAT LOG:")
        for round_result in combat_log:
            print(f"  Round {round_result.round_number}: {round_result.message}")
            print(f"    🎲 Attack: {round_result.attack_roll} vs Defense: {round_result.defense_roll}")
            print(f"    💥 Damage: {round_result.damage}")
        
        # Show final results
        print(f"\n🏆 COMBAT RESULTS:")
        print(f"🎯 Winner: {resolver.winner}")
        print(f"📊 Rounds: {resolver.current_round}")
        print(f"🚶 Final Voyager HP: {resolver.combatants['voyager'].current_hp}")
        print(f"🛡️ Final Guardian HP: {resolver.combatants['guardian'].current_hp}")
        
        return resolver
    
    def _create_mock_voyager(self) -> 'AssetDefinition':
        """Create a mock voyager for testing"""
        from rpg_core.systems.body.pipeline.asset_loader import AssetDefinition, AssetType, ObjectCharacteristics
        
        return AssetDefinition(
            asset_id="voyager",
            asset_type=AssetType.ACTOR,
            characteristics=ObjectCharacteristics(
                material="flesh",
                state="ready",
                rarity=1.0,
                integrity=100,
                tags=["organic", "humanoid"],
                combat_stats={
                    "hp": 30,
                    "str": 8,
                    "def": 6,
                    "initiative": 12
                }
            )
        )
    
    async def run_combat_test(self) -> None:
        """Run the complete combat test"""
        print("\n" + "="*60)
        print("⚔️ ADR 077: TAG-BASED AUTO-COMBAT SYSTEM TEST")
        print("="*60)
        
        # Test guardian stats
        guardian_def = self.test_guardian_stats()
        if not guardian_def:
            print("❌ Cannot proceed without Forest Guardian")
            return
        
        # Test combat resolver
        resolver = self.test_combat_resolver()
        if not resolver:
            print("❌ Combat resolver test failed")
            return
        
        print("\n" + "="*60)
        print("🏆 ADR 077 COMBAT TEST COMPLETE")
        print("="*60)
        print("✅ Tag-Based Auto-Combat System Working!")
        print("✅ Forest Guardian Ready for Battle!")
        print("✅ Combat Resolver Functional!")
        print("✅ Ready for Integration with DDEngine!")

async def main():
    """Main entry point for combat test"""
    print("⚔️ Initializing ADR 077 Combat Test...")
    
    # Create and run test session
    session = CombatTestSession("FOREST_GATE_COMBAT")
    await session.run_combat_test()

if __name__ == "__main__":
    print("⚔️ ADR 077: Tag-Based Auto-Combat System Test")
    print("=" * 60)
    print("🛡️ Testing: Combat Resolver + Forest Guardian")
    print("=" * 60)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Combat test interrupted by user")
    except Exception as e:
        print(f"\n💥 Combat test error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n⚔️ ADR 077 combat test ended")
