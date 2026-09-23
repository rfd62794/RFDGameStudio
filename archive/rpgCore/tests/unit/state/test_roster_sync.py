"""
Tests for RosterSyncService - ensures EntityRegistry and Roster stay in sync
"""

import pytest
from unittest.mock import MagicMock, patch

from src.shared.state.roster_sync import RosterSyncService
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.state.entity_registry import EntityRegistry
from src.shared.genetics.cultural_base import CulturalBase
from src.shared.genetics.genome import SlimeGenome


class TestRosterSyncService:
    
    def setup_method(self):
        """Set up test fixtures"""
        self.roster = Roster()
        self.registry = EntityRegistry()
        self.sync_service = RosterSyncService(self.roster, self.registry)
        
        # Create test slime
        self.test_slime = RosterSlime(
            slime_id="test_slime",
            name="Test Slime",
            genome=SlimeGenome(
                shape="round",
                size="medium",
                base_color=[100, 200, 100],
                pattern="spotted",
                pattern_color=[50, 50, 50],
                accessory="none",
                curiosity=0.5,
                energy=0.5,
                affection=0.5,
                shyness=0.5,
                base_hp=20.0,
                base_atk=5.0,
                base_spd=5.0,
                generation=1,
                cultural_base=CulturalBase.VOID
            )
        )
    
    def test_add_slime_success(self):
        """Test successful slime addition to both systems"""
        result = self.sync_service.add_slime(self.test_slime)
        
        assert result is True
        assert self.test_slime in self.roster.slimes
        assert self.registry.get(self.test_slime.slime_id) == self.test_slime
        assert self.sync_service.is_synced()
    
    def test_add_slime_failure_rollback(self):
        """Test rollback on add failure"""
        # Mock roster.add_slime to raise exception
        with patch.object(self.roster, 'add_slime', side_effect=Exception("Add failed")):
            result = self.sync_service.add_slime(self.test_slime)
            
            assert result is False
            assert self.test_slime not in self.roster.slimes
            assert self.registry.get(self.test_slime.slime_id) is None
            assert self.sync_service.is_synced()
    
    def test_remove_slime_success(self):
        """Test successful slime removal from both systems"""
        # First add the slime
        self.sync_service.add_slime(self.test_slime)
        assert self.sync_service.is_synced()
        
        # Then remove it
        result = self.sync_service.remove_slime(self.test_slime.slime_id)
        
        assert result is True
        assert self.test_slime not in self.roster.slimes
        assert self.registry.get(self.test_slime.slime_id) is None
        assert self.sync_service.is_synced()
    
    def test_remove_slime_not_found(self):
        """Test removing non-existent slime"""
        result = self.sync_service.remove_slime("nonexistent")
        
        assert result is False
        assert self.sync_service.is_synced()  # Should still be synced (both empty)
    
    def test_sync_from_roster(self):
        """Test rebuilding registry from roster"""
        # Add slimes directly to roster (simulating loaded state)
        self.roster.add_slime(self.test_slime)
        
        # Add another slime to roster
        another_slime = RosterSlime(
            slime_id="another_slime",
            name="Another",
            genome=SlimeGenome(
                shape="elongated",
                size="large",
                base_color=[255, 100, 100],
                pattern="solid",
                pattern_color=[255, 255, 255],
                accessory="crown",
                curiosity=0.8,
                energy=0.2,
                affection=0.9,
                shyness=0.1,
                base_hp=30.0,
                base_atk=8.0,
                base_spd=4.0,
                generation=2,
                cultural_base=CulturalBase.EMBER
            )
        )
        self.roster.add_slime(another_slime)
        
        # Registry should be empty initially
        assert len(self.registry.all()) == 0
        assert not self.sync_service.is_synced()
        
        # Sync from roster
        count = self.sync_service.sync_from_roster()
        
        assert count == 2
        assert len(self.registry.all()) == 2
        assert self.registry.get(self.test_slime.slime_id) == self.test_slime
        assert self.registry.get(another_slime.slime_id) == another_slime
        assert self.sync_service.is_synced()
    
    def test_is_synced_true(self):
        """Test is_synced returns True when systems match"""
        # Add slime to both systems
        self.sync_service.add_slime(self.test_slime)
        assert self.sync_service.is_synced()
    
    def test_is_synced_false_roster_ahead(self):
        """Test is_synced returns False when roster has more slimes"""
        # Add slime only to roster
        self.roster.add_slime(self.test_slime)
        assert not self.sync_service.is_synced()
    
    def test_is_synced_false_registry_ahead(self):
        """Test is_synced returns False when registry has more slimes"""
        # Add slime only to registry
        self.registry.register(self.test_slime)
        assert not self.sync_service.is_synced()
    
    def test_is_synced_false_different_slimes(self):
        """Test is_synced returns False when systems have different slimes"""
        # Add different slimes to each system
        roster_slime = RosterSlime(
            slime_id="roster_slime",
            name="Roster Only",
            genome=SlimeGenome(
                shape="round",
                size="small",
                base_color=[100, 100, 100],
                pattern="solid",
                pattern_color=[100, 100, 100],
                accessory="none",
                curiosity=0.5,
                energy=0.5,
                affection=0.5,
                shyness=0.5,
                base_hp=20.0,
                base_atk=5.0,
                base_spd=5.0,
                generation=1,
                cultural_base=CulturalBase.VOID
            )
        )
        
        registry_slime = RosterSlime(
            slime_id="registry_slime",
            name="Registry Only",
            genome=SlimeGenome(
                shape="cubic",
                size="large",
                base_color=[200, 200, 200],
                pattern="spotted",
                pattern_color=[150, 150, 150],
                accessory="shell",
                curiosity=0.3,
                energy=0.7,
                affection=0.8,
                shyness=0.2,
                base_hp=25.0,
                base_atk=6.0,
                base_spd=6.0,
                generation=1,
                cultural_base=CulturalBase.CRYSTAL
            )
        )
        
        self.roster.add_slime(roster_slime)
        self.registry.register(registry_slime)
        
        assert not self.sync_service.is_synced()
    
    def test_rollback_add_partial_failure(self):
        """Test rollback when registry.register fails"""
        # Mock registry.register to raise exception after roster.add_slime succeeds
        with patch.object(self.registry, 'register', side_effect=Exception("Registry failed")):
            result = self.sync_service.add_slime(self.test_slime)
            
            assert result is False
            # Both systems should be clean due to rollback
            assert self.test_slime not in self.roster.slimes
            assert self.registry.get(self.test_slime.slime_id) is None
    
    def test_multiple_operations_sync_maintained(self):
        """Test that sync is maintained across multiple operations"""
        # Add multiple slimes
        slimes = []
        for i in range(3):
            slime = RosterSlime(
                slime_id=f"slime_{i}",
                name=f"Slime {i}",
                genome=SlimeGenome(
                    shape="round",
                    size="medium",
                    base_color=[100 + i*50, 100, 100],
                    pattern="solid",
                    pattern_color=[255, 255, 255],
                    accessory="none",
                    curiosity=0.5,
                    energy=0.5,
                    affection=0.5,
                    shyness=0.5,
                    base_hp=20.0,
                    base_atk=5.0,
                    base_spd=5.0,
                    generation=1,
                    cultural_base=CulturalBase.VOID
                )
            )
            slimes.append(slime)
            self.sync_service.add_slime(slime)
            assert self.sync_service.is_synced()
        
        # Remove one slime
        self.sync_service.remove_slime("slime_1")
        assert self.sync_service.is_synced()
        
        # Verify remaining slimes
        assert len(self.roster.slimes) == 2
        assert len(self.registry.all()) == 2
        assert self.registry.get("slime_0") is not None
        assert self.registry.get("slime_2") is not None
        assert self.registry.get("slime_1") is None
    
    def test_sync_from_roster_clears_existing(self):
        """Test that sync_from_roster clears existing registry content"""
        # Add some slimes to registry
        old_slime = RosterSlime(
            slime_id="old_slime",
            name="Old",
            genome=SlimeGenome(
                shape="round",
                size="small",
                base_color=[50, 50, 50],
                pattern="solid",
                pattern_color=[50, 50, 50],
                accessory="none",
                curiosity=0.5,
                energy=0.5,
                affection=0.5,
                shyness=0.5,
                base_hp=20.0,
                base_atk=5.0,
                base_spd=5.0,
                generation=1,
                cultural_base=CulturalBase.VOID
            )
        )
        self.registry.register(old_slime)
        
        # Add different slime to roster
        self.roster.add_slime(self.test_slime)
        
        # Sync should clear old and add new
        count = self.sync_service.sync_from_roster()
        
        assert count == 1
        assert len(self.registry.all()) == 1
        assert self.registry.get("old_slime") is None
        assert self.registry.get(self.test_slime.slime_id) == self.test_slime
        assert self.sync_service.is_synced()
