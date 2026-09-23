"""Tests for the culture amplification table."""

import pytest
from src.shared.stats.culture_table import CULTURE_AMP_TABLE


class TestCultureTable:
    """Test the culture amplification table implementation."""
    
    def test_all_seven_cultures_present(self):
        """Test that all seven cultures are present in the amp table."""
        expected_cultures = {'ember', 'gale', 'marsh', 'crystal', 'tundra', 'tide', 'void'}
        actual_cultures = set(CULTURE_AMP_TABLE.keys())
        
        assert actual_cultures == expected_cultures
        assert len(actual_cultures) == 7
    
    def test_each_culture_has_six_stats(self):
        """Test that each culture has exactly six stat amplifications."""
        for culture, stats in CULTURE_AMP_TABLE.items():
            assert isinstance(stats, dict)
            assert len(stats) == 6
            
            expected_stats = {'vit', 'pwr', 'agi', 'mnd', 'res', 'chm'}
            actual_stats = set(stats.keys())
            assert actual_stats == expected_stats
    
    def test_ember_primary_stat_is_pwr(self):
        """Test that ember's primary stat is PWR (1.25x)."""
        ember_stats = CULTURE_AMP_TABLE['ember']
        assert ember_stats['pwr'] == 1.25
        assert ember_stats['pwr'] > ember_stats['vit']
        assert ember_stats['pwr'] > ember_stats['agi']
        assert ember_stats['pwr'] > ember_stats['mnd']
        assert ember_stats['pwr'] > ember_stats['res']
        assert ember_stats['pwr'] > ember_stats['chm']
    
    def test_gale_primary_stat_is_agi(self):
        """Test that gale's primary stat is AGI (1.25x)."""
        gale_stats = CULTURE_AMP_TABLE['gale']
        assert gale_stats['agi'] == 1.25
        assert gale_stats['agi'] > gale_stats['vit']
        assert gale_stats['agi'] > gale_stats['pwr']
        assert gale_stats['agi'] > gale_stats['mnd']
        assert gale_stats['agi'] > gale_stats['res']
        assert gale_stats['agi'] > gale_stats['chm']
    
    def test_marsh_primary_stat_is_vit(self):
        """Test that marsh's primary stat is VIT (1.25x)."""
        marsh_stats = CULTURE_AMP_TABLE['marsh']
        assert marsh_stats['vit'] == 1.25
        assert marsh_stats['vit'] > marsh_stats['pwr']
        assert marsh_stats['vit'] > marsh_stats['agi']
        assert marsh_stats['vit'] > marsh_stats['mnd']
        assert marsh_stats['vit'] > marsh_stats['res']
        assert marsh_stats['vit'] > marsh_stats['chm']
    
    def test_tundra_primary_stat_is_res(self):
        """Test that tundra's primary stat is RES (1.25x)."""
        tundra_stats = CULTURE_AMP_TABLE['tundra']
        assert tundra_stats['res'] == 1.25
        assert tundra_stats['res'] > tundra_stats['vit']
        assert tundra_stats['res'] > tundra_stats['pwr']
        assert tundra_stats['res'] > tundra_stats['agi']
        assert tundra_stats['res'] > tundra_stats['mnd']
        assert tundra_stats['res'] > tundra_stats['chm']
    
    def test_void_all_stats_equal_1_0(self):
        """Test that void has all stats at 1.0x (no amplification)."""
        void_stats = CULTURE_AMP_TABLE['void']
        for stat, amp in void_stats.items():
            assert amp == 1.0, f"Void {stat} should be 1.0, got {amp}"
    
    def test_gale_culture_present(self):
        """Test that 'gale' culture is in the amp table."""
        assert 'gale' in CULTURE_AMP_TABLE
    
    def test_crystal_chm_is_0_8_not_0_5(self):
        """Test that crystal's CHM is 0.8 (not the old 0.5)."""
        crystal_stats = CULTURE_AMP_TABLE['crystal']
        assert crystal_stats['chm'] == 0.8
        assert crystal_stats['chm'] > 0.5  # Higher than old value
        assert crystal_stats['chm'] < 1.0  # Still a penalty
    
    def test_stat_amplification_ranges(self):
        """Test that all amplifications are within expected ranges."""
        for culture, stats in CULTURE_AMP_TABLE.items():
            for stat, amp in stats.items():
                assert 0.7 <= amp <= 1.25, f"{culture}.{stat} = {amp} outside valid range [0.7, 1.25]"
    
    def test_no_duplicate_cultures(self):
        """Test that there are no duplicate culture entries."""
        cultures = list(CULTURE_AMP_TABLE.keys())
        assert len(cultures) == len(set(cultures)), "Duplicate cultures found in amp table"
