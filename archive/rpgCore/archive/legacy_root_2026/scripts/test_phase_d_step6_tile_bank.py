#!/usr/bin/env python3
"""
Phase D Step 6 Verification - TileBank System

Tests for Game Boy-style tile pattern management with bank switching.

Tests:
1. Initialization and lifecycle
2. Tile registration and retrieval
3. Bank switching mechanics
4. Tile count limits (256 max per bank)
5. Animation frame support
6. Collision flag tracking
7. Tile type classification
8. Status reporting and metrics
9. Intent processing
10. Factory functions and configuration variants
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from game_engine.systems.graphics import (
    TileBank,
    TilePattern,
    TileType,
    create_default_tile_bank,
    create_large_tile_bank,
    create_minimal_tile_bank,
)
from game_engine.foundation import SystemStatus


def test_1_initialization_and_lifecycle():
    """Test 1: Initialization and lifecycle"""
    print("Test 1: Initialization and lifecycle...", end=" ")

    bank = TileBank()
    assert bank is not None
    assert bank.status == SystemStatus.UNINITIALIZED

    result = bank.initialize()
    assert result == True
    assert bank.status == SystemStatus.RUNNING

    bank.tick(0.016)
    assert bank.status == SystemStatus.RUNNING

    bank.shutdown()
    assert bank.status == SystemStatus.STOPPED

    print("[OK]")


def test_2_tile_registration_and_retrieval():
    """Test 2: Tile registration and retrieval"""
    print("Test 2: Tile registration and retrieval...", end=" ")

    bank = create_default_tile_bank()

    pixels = [[(255, 0, 0) for _ in range(8)] for _ in range(8)]
    tile = TilePattern(pixels, TileType.SOLID, is_solid=True)

    result = bank.register_tile(10, tile)
    assert result['success'] == True
    assert result['tile_id'] == 10

    retrieved = bank.get_tile(10)
    assert retrieved is not None
    assert retrieved.tile_type == TileType.SOLID
    assert retrieved.is_solid == True

    missing = bank.get_tile(999)
    assert missing is None

    bank.shutdown()
    print("[OK]")


def test_3_bank_switching_mechanics():
    """Test 3: Bank switching mechanics"""
    print("Test 3: Bank switching mechanics...", end=" ")

    bank = create_default_tile_bank()

    assert bank.current_bank == 0

    pixels_red = [[(255, 0, 0) for _ in range(8)] for _ in range(8)]
    tile_red = TilePattern(pixels_red, TileType.CUSTOM, is_solid=False)
    bank.register_tile(50, tile_red, bank_idx=0)

    pixels_green = [[(0, 255, 0) for _ in range(8)] for _ in range(8)]
    tile_green = TilePattern(pixels_green, TileType.CUSTOM, is_solid=False)
    bank.register_tile(50, tile_green, bank_idx=1)

    result = bank.switch_bank(1)
    assert result == True
    assert bank.current_bank == 1

    tile = bank.get_tile(50)
    assert tile is not None
    assert tile.pixels[0][0] == (0, 255, 0)

    result = bank.switch_bank(0)
    assert result == True
    assert bank.current_bank == 0
    tile = bank.get_tile(50)
    assert tile.pixels[0][0] == (255, 0, 0)

    result = bank.switch_bank(99)
    assert result == False
    assert bank.current_bank == 0

    bank.shutdown()
    print("[OK]")


def test_4_tile_count_limits():
    """Test 4: Tile count limits (256 max per bank)"""
    print("Test 4: Tile count limits...", end=" ")

    bank = create_default_tile_bank()

    pixels = [[(100, 100, 100) for _ in range(8)] for _ in range(8)]
    tile = TilePattern(pixels, TileType.CUSTOM, is_solid=False)

    for tile_id in range(0, 256):
        result = bank.register_tile(tile_id, tile)
        assert result['success'] == True

    status = bank.get_status()
    assert status['tiles_in_current_bank'] == 256

    result = bank.register_tile(256, tile)
    assert result['success'] == False
    assert "Invalid tile ID" in result['error']

    result = bank.register_tile(-1, tile)
    assert result['success'] == False

    bank.shutdown()
    print("[OK]")


def test_5_animation_frame_support():
    """Test 5: Animation frame support"""
    print("Test 5: Animation frame support...", end=" ")

    bank = create_default_tile_bank()

    base = [[(100, 100, 200) for _ in range(8)] for _ in range(8)]
    frame1 = [[(150, 150, 255) for _ in range(8)] for _ in range(8)]
    frame2 = [[(50, 50, 150) for _ in range(8)] for _ in range(8)]

    tile = TilePattern(
        base,
        TileType.WATER,
        is_solid=False,
        animation_frames=[frame1, frame2],
        frame_duration=0.1
    )

    bank.register_tile(100, tile)

    frame = bank.get_tile_frame(100, time=0.0)
    assert frame is not None
    assert frame[0][0] == (100, 100, 200)

    frame = bank.get_tile_frame(100, time=0.1)
    assert frame is not None
    assert frame[0][0] == (150, 150, 255)

    frame = bank.get_tile_frame(100, time=0.2)
    assert frame is not None
    assert frame[0][0] == (50, 50, 150)

    bank.shutdown()
    print("[OK]")


def test_6_collision_flag_tracking():
    """Test 6: Collision flag tracking"""
    print("Test 6: Collision flag tracking...", end=" ")

    bank = create_default_tile_bank()

    pixels = [[(128, 128, 128) for _ in range(8)] for _ in range(8)]
    solid_tile = TilePattern(pixels, TileType.SOLID, is_solid=True)

    empty_pixels = [[(0, 0, 0) for _ in range(8)] for _ in range(8)]
    empty_tile = TilePattern(empty_pixels, TileType.EMPTY, is_solid=False)

    bank.register_tile(1, solid_tile)
    bank.register_tile(2, empty_tile)

    assert bank.is_tile_solid(1) == True
    assert bank.is_tile_solid(2) == False
    assert bank.is_tile_solid(999) == False

    bank.shutdown()
    print("[OK]")


def test_7_tile_type_classification():
    """Test 7: Tile type classification"""
    print("Test 7: Tile type classification...", end=" ")

    bank = create_default_tile_bank()

    pixels = [[(100, 100, 100) for _ in range(8)] for _ in range(8)]

    tiles = {
        1: TilePattern(pixels, TileType.GRASS),
        2: TilePattern(pixels, TileType.WATER),
        3: TilePattern(pixels, TileType.SOLID),
        4: TilePattern(pixels, TileType.SPIKE),
        5: TilePattern(pixels, TileType.LAVA),
    }

    for tile_id, tile in tiles.items():
        bank.register_tile(tile_id, tile)

    assert bank.get_tile_type(1) == TileType.GRASS
    assert bank.get_tile_type(2) == TileType.WATER
    assert bank.get_tile_type(3) == TileType.SOLID
    assert bank.get_tile_type(4) == TileType.SPIKE
    assert bank.get_tile_type(5) == TileType.LAVA
    assert bank.get_tile_type(999) is None

    bank.shutdown()
    print("[OK]")


def test_8_status_reporting_and_metrics():
    """Test 8: Status reporting and metrics"""
    print("Test 8: Status reporting and metrics...", end=" ")

    bank = create_default_tile_bank()

    status = bank.get_status()
    assert isinstance(status, dict)
    assert 'status' in status
    assert 'initialized' in status
    assert status['status'] == 'RUNNING'
    assert status['initialized'] == True
    assert 'current_bank' in status
    assert status['current_bank'] == 0
    assert 'max_banks' in status
    assert status['max_banks'] == 4
    assert 'tiles_in_current_bank' in status

    bank.switch_bank(1)
    status = bank.get_status()
    assert status['current_bank'] == 1
    assert status['total_bank_switches'] == 1

    bank.shutdown()
    print("[OK]")


def test_9_intent_processing():
    """Test 9: Intent processing"""
    print("Test 9: Intent processing...", end=" ")

    bank = create_default_tile_bank()

    pixels = [[(200, 100, 50) for _ in range(8)] for _ in range(8)]
    tile = TilePattern(pixels, TileType.CUSTOM)

    intent = {
        "action": "register_tile",
        "tile_id": 75,
        "tile": tile,
        "bank": 0
    }
    result = bank.process_intent(intent)
    assert result['success'] == True

    intent = {
        "action": "switch_bank",
        "bank": 2
    }
    result = bank.process_intent(intent)
    assert result['success'] == True
    assert result['current_bank'] == 2

    intent = {
        "action": "get_tile",
        "tile_id": 1,
        "bank": 0
    }
    result = bank.process_intent(intent)
    assert result['success'] == True
    assert result['tile'] is not None

    intent = {
        "action": "get_tile_count",
        "bank": 0
    }
    result = bank.process_intent(intent)
    assert 'tile_count' in result

    intent = {"action": "unknown"}
    result = bank.process_intent(intent)
    assert 'error' in result

    bank.shutdown()
    print("[OK]")


def test_10_factory_functions():
    """Test 10: Factory functions and configuration variants"""
    print("Test 10: Factory functions...", end=" ")

    default = create_default_tile_bank()
    assert default is not None
    assert default.status == SystemStatus.RUNNING
    status = default.get_status()
    assert status['max_banks'] == 4
    default.shutdown()

    large = create_large_tile_bank()
    assert large is not None
    assert large.status == SystemStatus.RUNNING
    status = large.get_status()
    assert status['max_banks'] == 8
    large.shutdown()

    minimal = create_minimal_tile_bank()
    assert minimal is not None
    assert minimal.status == SystemStatus.RUNNING
    status = minimal.get_status()
    assert status['max_banks'] == 2
    minimal.shutdown()

    print("[OK]")


def main():
    """Run all tests"""
    print("=" * 60)
    print("PHASE D STEP 6: TILE BANK TESTS")
    print("=" * 60)

    try:
        test_1_initialization_and_lifecycle()
        test_2_tile_registration_and_retrieval()
        test_3_bank_switching_mechanics()
        test_4_tile_count_limits()
        test_5_animation_frame_support()
        test_6_collision_flag_tracking()
        test_7_tile_type_classification()
        test_8_status_reporting_and_metrics()
        test_9_intent_processing()
        test_10_factory_functions()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED [OK]")
        print("=" * 60)
        return 0

    except AssertionError as e:
        print(f"\n[FAIL] {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
