"""Tests for zone type definitions and configurations"""

import pytest
from src.shared.dispatch.zone_types import ZoneType, ZoneConfig, get_zone_config, get_all_zone_configs


class TestZoneTypes:
    """Test zone type definitions and configurations"""
    
    def test_zone_type_enum_values(self):
        """Test ZoneType enum has all expected values"""
        expected_zones = ['racing', 'dungeon', 'foraging', 'trade', 'mission', 'arena']
        actual_zones = [zone.value for zone in ZoneType]
        
        for expected in expected_zones:
            assert expected in actual_zones, f"Missing zone type: {expected}"
        
        assert len(actual_zones) == len(expected_zones)
    
    def test_zone_config_completeness(self):
        """Test all zone types have complete configurations"""
        all_configs = get_all_zone_configs()
        
        for zone_type in ZoneType:
            assert zone_type in all_configs, f"Missing config for {zone_type}"
            
            config = all_configs[zone_type]
            
            # Test required fields
            assert config.zone_type == zone_type
            assert isinstance(config.min_stage, str)
            assert isinstance(config.risk_level, str)
            assert isinstance(config.resource_returns, dict)
            assert isinstance(config.duration_ticks, int)
            assert isinstance(config.stat_growth, dict)
            
            # Test valid values
            assert config.min_stage in ["Hatchling", "Juvenile", "Young", "Prime", "Veteran", "Elder"]
            assert config.risk_level in ["none", "low", "standard", "high", "critical"]
            assert config.duration_ticks > 0
    
    def test_zone_config_getter(self):
        """Test get_zone_config function"""
        for zone_type in ZoneType:
            config = get_zone_config(zone_type)
            assert isinstance(config, ZoneConfig)
            assert config.zone_type == zone_type
    
    def test_resource_return_distributions(self):
        """Test resource return distributions make sense for each zone"""
        configs = get_all_zone_configs()
        
        # Racing - gold focus
        racing = configs[ZoneType.RACING]
        assert racing.resource_returns.get('gold', 0) > 0
        assert racing.resource_returns.get('scrap', 0) == 0
        assert racing.resource_returns.get('food', 0) == 0
        
        # Dungeon - scrap focus
        dungeon = configs[ZoneType.DUNGEON]
        assert dungeon.resource_returns.get('scrap', 0) > 0
        assert dungeon.resource_returns.get('gold', 0) > 0  # Some gold too
        assert dungeon.resource_returns.get('food', 0) == 0
        
        # Foraging - food focus
        foraging = configs[ZoneType.FORAGING]
        assert foraging.resource_returns.get('food', 0) > 0
        assert foraging.resource_returns.get('scrap', 0) > 0  # Some scrap too
        assert foraging.resource_returns.get('gold', 0) == 0
        
        # Trade - gold focus
        trade = configs[ZoneType.TRADE]
        assert trade.resource_returns.get('gold', 0) > 0
        assert trade.resource_returns.get('food', 0) > 0  # Some food too
        assert trade.resource_returns.get('scrap', 0) == 0
        
        # Mission - balanced
        mission = configs[ZoneType.MISSION]
        assert mission.resource_returns.get('gold', 0) > 0
        assert mission.resource_returns.get('scrap', 0) > 0
        assert mission.resource_returns.get('food', 0) > 0
        
        # Arena - gold focus
        arena = configs[ZoneType.ARENA]
        assert arena.resource_returns.get('gold', 0) > 0
        assert arena.resource_returns.get('scrap', 0) == 0
        assert arena.resource_returns.get('food', 0) == 0
    
    def test_risk_level_progression(self):
        """Test risk levels make sense for zone types"""
        configs = get_all_zone_configs()
        
        # Low risk zones
        low_risk_zones = [ZoneType.RACING, ZoneType.FORAGING]
        for zone_type in low_risk_zones:
            config = configs[zone_type]
            assert config.risk_level in ['none', 'low']
        
        # High risk zones
        high_risk_zones = [ZoneType.DUNGEON]
        for zone_type in high_risk_zones:
            config = configs[zone_type]
            assert config.risk_level in ['high', 'critical']
        
        # Standard risk zones
        standard_risk_zones = [ZoneType.TRADE, ZoneType.MISSION, ZoneType.ARENA]
        for zone_type in standard_risk_zones:
            config = configs[zone_type]
            assert config.risk_level == 'standard'
    
    def test_minimum_stage_requirements(self):
        """Test minimum stage requirements make sense"""
        configs = get_all_zone_configs()
        
        # Racing and Foraging - can start early
        early_zones = [ZoneType.RACING, ZoneType.FORAGING]
        for zone_type in early_zones:
            config = configs[zone_type]
            stage_order = {'Hatchling': 0, 'Juvenile': 1, 'Young': 2, 'Prime': 3, 'Veteran': 4, 'Elder': 5}
            assert stage_order[config.min_stage] <= stage_order['Juvenile']
        
        # Mission - requires experience
        mission_config = configs[ZoneType.MISSION]
        stage_order = {'Hatchling': 0, 'Juvenile': 1, 'Young': 2, 'Prime': 3, 'Veteran': 4, 'Elder': 5}
        assert stage_order[mission_config.min_stage] >= stage_order['Prime']
        
        # Dungeon and Trade - middle ground
        middle_zones = [ZoneType.DUNGEON, ZoneType.TRADE, ZoneType.ARENA]
        for zone_type in middle_zones:
            config = configs[zone_type]
            stage_order = {'Hatchling': 0, 'Juvenile': 1, 'Young': 2, 'Prime': 3, 'Veteran': 4, 'Elder': 5}
            assert stage_order['Young'] <= stage_order[config.min_stage] <= stage_order['Prime']
    
    def test_duration_reasonableness(self):
        """Test dispatch durations are reasonable"""
        configs = get_all_zone_configs()
        
        for zone_type, config in configs.items():
            # All durations should be between 5 minutes (300 ticks) and 30 minutes (1800 ticks)
            assert 300 <= config.duration_ticks <= 1800, \
                f"{zone_type.value} duration {config.duration_ticks} is unreasonable"
            
            # Higher risk zones should generally take longer
            if config.risk_level in ['high', 'critical']:
                assert config.duration_ticks >= 600, \
                    f"High risk zone {zone_type.value} should take longer than 10 minutes"
    
    def test_stat_growth_relevance(self):
        """Test stat growth makes sense for zone types"""
        configs = get_all_zone_configs()
        
        # Racing - speed and dexterity
        racing = configs[ZoneType.RACING]
        assert 'dexterity' in racing.stat_growth
        assert 'speed' in racing.stat_growth
        assert racing.stat_growth.get('dexterity', 0) > 0
        assert racing.stat_growth.get('speed', 0) > 0
        
        # Dungeon - combat stats
        dungeon = configs[ZoneType.DUNGEON]
        assert 'strength' in dungeon.stat_growth
        assert 'defense' in dungeon.stat_growth
        assert dungeon.stat_growth.get('strength', 0) > 0
        assert dungeon.stat_growth.get('defense', 0) > 0
        
        # Foraging - perception and endurance
        foraging = configs[ZoneType.FORAGING]
        assert 'constitution' in foraging.stat_growth
        assert 'perception' in foraging.stat_growth
        assert foraging.stat_growth.get('constitution', 0) > 0
        assert foraging.stat_growth.get('perception', 0) > 0
        
        # Trade - social stats
        trade = configs[ZoneType.TRADE]
        assert 'charisma' in trade.stat_growth
        assert 'sociability' in trade.stat_growth
        assert trade.stat_growth.get('charisma', 0) > 0
        assert trade.stat_growth.get('sociability', 0) > 0
        
        # Mission - balanced stats
        mission = configs[ZoneType.MISSION]
        assert len(mission.stat_growth) >= 3  # Should grow multiple stats
        
        # Arena - combat stats
        arena = configs[ZoneType.ARENA]
        assert 'strength' in arena.stat_growth
        assert 'defense' in arena.stat_growth
        assert arena.stat_growth.get('strength', 0) > 0
        assert arena.stat_growth.get('defense', 0) > 0
    
    def test_zone_config_immutability(self):
        """Test that zone configs are not accidentally modified"""
        config1 = get_zone_config(ZoneType.RACING)
        config2 = get_zone_config(ZoneType.RACING)
        
        # Modifying one shouldn't affect the other
        original_duration = config1.duration_ticks
        config1.duration_ticks = 9999
        
        assert config2.duration_ticks == original_duration
        assert get_zone_config(ZoneType.RACING).duration_ticks == original_duration
