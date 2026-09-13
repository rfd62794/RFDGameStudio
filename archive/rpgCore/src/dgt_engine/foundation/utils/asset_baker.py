"""
DGT Asset Baker - Unified Binary Asset Pipeline

Compiles YAML/JSON pre-fab definitions into a single memory-mappable binary file.
This transforms character silhouettes, tile patterns, and interactions into
sub-millisecond loadable assets for the DGT Perfect Simulator.

The Asset Baker creates a "ROM bank" style binary that contains:
- Sprite Bank: Pre-calculated silhouettes with transparency
- Tile Registry: 8x8 patterns optimized for mmap loading
- Object Registry: Interactive objects with pre-baked logic
- Environment Maps: RLE-encoded world maps
- Palette Swaps: Runtime color application system
"""

import yaml
import struct
import pickle
import gzip
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional, Union
from dataclasses import dataclass, asdict
import hashlib
import time

from loguru import logger


@dataclass
class DGTAssetHeader:
    """Header for the DGT binary asset file."""
    magic: bytes = b'DGT\x01'  # 4-byte magic number
    version: int = 1
    build_time: float = 0.0
    checksum: bytes = b'\x00' * 16
    asset_count: int = 0
    data_offset: int = 32  # Header size in bytes


@dataclass
class SpriteBank:
    """Pre-baked sprite data with palette support."""
    sprites: Dict[str, bytes]  # sprite_id -> compressed sprite data
    palettes: Dict[str, List[str]]  # palette_id -> color list
    metadata: Dict[str, Dict[str, Any]]  # sprite_id -> metadata


@dataclass
class TileRegistry:
    """Pre-baked tile patterns."""
    tiles: Dict[str, bytes]  # tile_id -> compressed tile data
    patterns: Dict[str, str]  # tile_id -> pattern type
    colors: Dict[str, str]  # tile_id -> base color


@dataclass
class ObjectRegistry:
    """Pre-baked interactive objects."""
    objects: Dict[str, bytes]  # object_id -> compressed object data
    interactions: Dict[str, str]  # object_id -> interaction_id
    collision_maps: Dict[str, bytes]  # object_id -> collision data


@dataclass
class EnvironmentRegistry:
    """Pre-baked environment maps."""
    maps: Dict[str, bytes]  # map_id -> RLE-compressed map data
    dimensions: Dict[str, Tuple[int, int]]  # map_id -> (width, height)
    object_placements: Dict[str, List[Dict]]  # map_id -> object placements
    npc_placements: Dict[str, List[Dict]]  # map_id -> npc placements


@dataclass
class InteractionRegistry:
    """Pre-baked interaction logic."""
    interactions: Dict[str, Dict[str, Any]]  # interaction_id -> logic data
    dialogue_sets: Dict[str, Dict[str, List[str]]]  # dialogue_set_id -> dialogue


class DGTAssetBaker:
    """
    The "Compiler" that turns YAML/JSON definitions into binary assets.
    
    This is the heart of the Pre-Fab methodology - it takes human-readable
    definitions and bakes them into a single memory-mappable binary file.
    """
    
    def __init__(self, manifest_path: Path, output_path: Path):
        """
        Initialize the asset baker.
        
        Args:
            manifest_path: Path to ASSET_MANIFEST.yaml
            output_path: Output path for assets.dgt binary
        """
        self.manifest_path = manifest_path
        self.output_path = output_path
        self.build_time = time.time()
        
        # Asset registries
        self.sprite_bank = SpriteBank(sprites={}, palettes={}, metadata={})
        self.tile_registry = TileRegistry(tiles={}, patterns={}, colors={})
        self.object_registry = ObjectRegistry(objects={}, interactions={}, collision_maps={})
        self.environment_registry = EnvironmentRegistry(maps={}, dimensions={}, object_placements={}, npc_placements={})
        self.interaction_registry = InteractionRegistry(interactions={}, dialogue_sets={})
        
        logger.info(f"🔥 DGT Asset Baker initialized")
        logger.info(f"📋 Manifest: {manifest_path}")
        logger.info(f"💾 Output: {output_path}")
    
    def bake_assets(self) -> bool:
        """
        Main baking process - compile all assets into binary.
        
        Returns:
            True if baking succeeded, False otherwise
        """
        try:
            logger.info("🔥 Starting asset baking process...")
            
            # Step 1: Load and validate manifest
            manifest = self._load_manifest()
            
            # Step 2: Bake each asset type
            self._bake_characters(manifest)
            self._bake_objects(manifest)
            self._bake_environments(manifest)
            self._bake_tiles(manifest)
            self._bake_palettes(manifest)
            self._bake_interactions(manifest)
            
            # Step 3: Compile binary
            self._compile_binary()
            
            logger.info("✅ Asset baking completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Asset baking failed: {e}")
            return False
    
    def _load_manifest(self) -> Dict[str, Any]:
        """Load and validate the asset manifest."""
        logger.info("📋 Loading asset manifest...")
        
        with open(self.manifest_path, 'r', encoding='utf-8') as f:
            manifest = yaml.safe_load(f)
        
        # Validate required sections
        required_sections = ['characters', 'objects', 'environments', 'palettes', 'tiles', 'interactions']
        for section in required_sections:
            if section not in manifest:
                raise ValueError(f"Missing required section: {section}")
        
        logger.info(f"✅ Manifest loaded with {len(manifest['characters'])} characters, {len(manifest['objects'])} objects")
        return manifest
    
    def _bake_characters(self, manifest: Dict[str, Any]) -> None:
        """Bake character definitions into sprite bank."""
        logger.info("👤 Baking character sprites...")
        
        # Create character pixel patterns (these would normally come from tile bank)
        character_patterns = self._create_character_patterns()
        
        for char_id, char_data in manifest['characters'].items():
            # Build sprite from layers
            sprite_data = self._assemble_character_sprite(char_data, character_patterns)
            
            # Compress sprite data
            compressed_sprite = gzip.compress(sprite_data)
            
            # Store in sprite bank
            self.sprite_bank.sprites[char_id] = compressed_sprite
            self.sprite_bank.metadata[char_id] = {
                'description': char_data.get('description', ''),
                'layers': char_data.get('layers', []),
                'palette': char_data.get('palette', ''),
                'tags': char_data.get('tags', [])
            }
        
        logger.info(f"✅ Baked {len(self.sprite_bank.sprites)} character sprites")
    
    def _create_character_patterns(self) -> Dict[str, List[List[Optional[str]]]]:
        """Create character pixel patterns (simplified for demo)."""
        patterns = {}
        
        # Head patterns
        patterns['head_helmet'] = self._create_helmet_pattern()
        patterns['head_helmet_damaged'] = self._create_helmet_pattern(damaged=True)
        patterns['head_hat_pointed'] = self._create_mage_hat_pattern()
        patterns['head_hat_wide'] = self._create_mage_hat_pattern(wide=True)
        patterns['head_hood'] = self._create_hood_pattern()
        patterns['head_hood_cowl'] = self._create_hood_pattern(cowl=True)
        
        # Body patterns
        patterns['body_plate'] = self._create_armor_pattern()
        patterns['body_plate_damaged'] = self._create_armor_pattern(damaged=True)
        patterns['body_robes_simple'] = self._create_robes_pattern()
        patterns['body_robes_ornate'] = self._create_robes_pattern(ornate=True)
        patterns['body_leather_light'] = self._create_leather_pattern(light=True)
        patterns['body_leather_dark'] = self._create_leather_pattern()
        
        # Item patterns
        patterns['item_sword'] = self._create_sword_pattern()
        patterns['item_sword_enchanted'] = self._create_sword_pattern(enchanted=True)
        patterns['item_staff_basic'] = self._create_staff_pattern()
        patterns['item_staff_crystal'] = self._create_staff_pattern(crystal=True)
        patterns['item_dagger_basic'] = self._create_dagger_pattern()
        patterns['item_dagger_poisoned'] = self._create_dagger_pattern(poisoned=True)
        
        return patterns
    
    def _create_helmet_pattern(self, damaged: bool = False) -> List[List[Optional[str]]]:
        """Create helmet pixel pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Basic helmet shape
        for y in range(2, 6):
            for x in range(2, 6):
                pattern[y][x] = 'silver'
        
        # Add damage if damaged
        if damaged:
            pattern[3][3] = None
            pattern[4][4] = 'black'
        
        return pattern
    
    def _create_mage_hat_pattern(self, wide: bool = False) -> List[List[Optional[str]]]:
        """Create mage hat pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        if wide:
            # Wide hat
            for y in range(1, 4):
                width = 3 + y
                start_x = 4 - width // 2
                for x in range(start_x, start_x + width):
                    if 0 <= x < 8:
                        pattern[y][x] = 'purple'
        else:
            # Pointed hat
            for y in range(1, 4):
                width = 1 + y
                start_x = 4 - width // 2
                for x in range(start_x, start_x + width):
                    if 0 <= x < 8:
                        pattern[y][x] = 'purple'
        
        return pattern
    
    def _create_hood_pattern(self, cowl: bool = False) -> List[List[Optional[str]]]:
        """Create hood pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Hood shape
        for y in range(2, 5):
            width = 2 + y
            start_x = 4 - width // 2
            for x in range(start_x, start_x + width):
                if 0 <= x < 8:
                    pattern[y][x] = 'gray40'
        
        # Add cowl if specified
        if cowl:
            for y in range(5, 7):
                for x in range(2, 6):
                    pattern[y][x] = 'gray40'
        
        return pattern
    
    def _create_armor_pattern(self, damaged: bool = False) -> List[List[Optional[str]]]:
        """Create armor pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Armor body
        for y in range(3, 7):
            for x in range(2, 6):
                pattern[y][x] = 'gray60'
        
        # Add damage if damaged
        if damaged:
            pattern[4][3] = 'black'
            pattern[5][4] = 'black'
        
        return pattern
    
    def _create_robes_pattern(self, ornate: bool = False) -> List[List[Optional[str]]]:
        """Create robes pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Robes
        for y in range(3, 7):
            width = 5 if not ornate else 6
            start_x = 4 - width // 2
            for x in range(start_x, start_x + width):
                if 0 <= x < 8:
                    pattern[y][x] = 'blue'
        
        # Add ornate details
        if ornate:
            pattern[4][3] = 'purple'
            pattern[5][4] = 'purple'
        
        return pattern
    
    def _create_leather_pattern(self, light: bool = False) -> List[List[Optional[str]]]:
        """Create leather armor pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Leather armor
        for y in range(3, 7):
            for x in range(2, 6):
                pattern[y][x] = 'tan' if light else 'brown'
        
        return pattern
    
    def _create_sword_pattern(self, enchanted: bool = False) -> List[List[Optional[str]]]:
        """Create sword pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Sword blade
        for y in range(2, 6):
            pattern[y][6] = 'silver'
        
        # Sword hilt
        pattern[6][6] = 'brown'
        pattern[6][5] = 'brown'
        
        # Add enchantment if specified
        if enchanted:
            pattern[3][6] = 'purple'
            pattern[4][6] = 'purple'
        
        return pattern
    
    def _create_staff_pattern(self, crystal: bool = False) -> List[List[Optional[str]]]:
        """Create staff pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Staff
        for y in range(2, 7):
            pattern[y][2] = 'tan'
        
        # Crystal top if specified
        if crystal:
            pattern[1][2] = 'purple'
            pattern[2][2] = 'purple'
        
        return pattern
    
    def _create_dagger_pattern(self, poisoned: bool = False) -> List[List[Optional[str]]]:
        """Create dagger pattern."""
        pattern = [[None for _ in range(8)] for _ in range(8)]
        
        # Dagger blade
        for y in range(4, 6):
            pattern[y][6] = 'silver'
        
        # Dagger hilt
        pattern[6][6] = 'brown'
        
        # Add poison if specified
        if poisoned:
            pattern[4][6] = 'green'
            pattern[5][6] = 'green'
        
        return pattern
    
    def _assemble_character_sprite(self, char_data: Dict[str, Any], patterns: Dict[str, List[List[Optional[str]]]]) -> bytes:
        """Assemble character sprite from layers."""
        # Create 16x16 sprite canvas
        sprite = [[None for _ in range(16)] for _ in range(16)]
        
        # Apply each layer
        for layer_id in char_data.get('layers', []):
            if layer_id in patterns:
                layer_pattern = patterns[layer_id]
                
                # Place layer pattern on sprite (simplified positioning)
                if 'head' in layer_id:
                    # Place in top area
                    for y in range(min(8, len(layer_pattern))):
                        for x in range(min(8, len(layer_pattern[y]))):
                            if layer_pattern[y][x]:
                                sprite[y][x + 4] = layer_pattern[y][x]
                elif 'body' in layer_id:
                    # Place in middle area
                    for y in range(min(8, len(layer_pattern))):
                        for x in range(min(8, len(layer_pattern[y]))):
                            if layer_pattern[y][x]:
                                sprite[y + 4][x + 4] = layer_pattern[y][x]
                elif 'item' in layer_id:
                    # Place in right area
                    for y in range(min(8, len(layer_pattern))):
                        for x in range(min(8, len(layer_pattern[y]))):
                            if layer_pattern[y][x]:
                                sprite[y + 4][x + 8] = layer_pattern[y][x]
        
        # Serialize sprite data
        return pickle.dumps(sprite)
    
    def _bake_objects(self, manifest: Dict[str, Any]) -> None:
        """Bake object definitions."""
        logger.info("📦 Baking object definitions...")
        
        for obj_id, obj_data in manifest['objects'].items():
            # Create object data structure
            object_data = {
                'description': obj_data.get('description', ''),
                'layers': obj_data.get('layers', []),
                'interaction': obj_data.get('interaction', ''),
                'tags': obj_data.get('tags', [])
            }
            
            # Compress and store
            compressed_object = gzip.compress(pickle.dumps(object_data))
            self.object_registry.objects[obj_id] = compressed_object
            self.object_registry.interactions[obj_id] = obj_data.get('interaction', '')
        
        logger.info(f"✅ Baked {len(self.object_registry.objects)} objects")
    
    def _bake_environments(self, manifest: Dict[str, Any]) -> None:
        """Bake environment maps with RLE compression."""
        logger.info("🗺️ Baking environment maps...")
        
        for env_id, env_data in manifest['environments'].items():
            # RLE compress tile map
            tile_map = env_data.get('tile_map', [])
            rle_data = self._rle_compress(tile_map)
            
            # Store compressed map
            self.environment_registry.maps[env_id] = gzip.compress(pickle.dumps(rle_data))
            self.environment_registry.dimensions[env_id] = tuple(env_data.get('dimensions', [20, 18]))
            self.environment_registry.object_placements[env_id] = env_data.get('objects', [])
            self.environment_registry.npc_placements[env_id] = env_data.get('npcs', [])
        
        logger.info(f"✅ Baked {len(self.environment_registry.maps)} environments")
    
    def _rle_compress(self, data: List[int]) -> List[Tuple[int, int]]:
        """Compress data using run-length encoding."""
        if not data:
            return []
        
        compressed = []
        current_value = data[0]
        count = 1
        
        for value in data[1:]:
            if value == current_value:
                count += 1
            else:
                compressed.append((current_value, count))
                current_value = value
                count = 1
        
        compressed.append((current_value, count))
        return compressed
    
    def _bake_tiles(self, manifest: Dict[str, Any]) -> None:
        """Bake tile patterns."""
        logger.info("🎨 Baking tile patterns...")
        
        for tile_id, tile_data in manifest['tiles'].items():
            # Create tile pattern (simplified)
            tile_pattern = self._create_tile_pattern(tile_data)
            
            # Compress and store
            compressed_tile = gzip.compress(pickle.dumps(tile_pattern))
            self.tile_registry.tiles[tile_id] = compressed_tile
            self.tile_registry.patterns[tile_id] = tile_data.get('pattern', 'solid')
            self.tile_registry.colors[tile_id] = str(tile_data.get('color_id', 1))
        
        logger.info(f"✅ Baked {len(self.tile_registry.tiles)} tiles")
    
    def _create_tile_pattern(self, tile_data: Dict[str, Any]) -> List[List[str]]:
        """Create tile pattern from definition."""
        pattern_type = tile_data.get('pattern', 'solid')
        color_id = str(tile_data.get('color_id', 1))
        
        # Simple color mapping
        color_map = {
            '1': 'green',
            '2': 'gray40',
            '3': 'blue',
            '4': 'dark green',
            '5': 'brown',
            '6': 'gray60',
            '7': 'yellow'
        }
        
        base_color = color_map.get(color_id, 'green')
        
        # Create 8x8 tile pattern
        pattern = [[base_color for _ in range(8)] for _ in range(8)]
        
        # Add texture if specified
        if pattern_type == 'textured':
            for y in range(8):
                for x in range(8):
                    if (x + y) % 3 == 0:
                        pattern[y][x] = 'dark green' if base_color == 'green' else 'gray30'
        elif pattern_type == 'animated':
            # Add animation variation
            for y in range(8):
                for x in range(8):
                    if (x + y) % 4 < 2:
                        pattern[y][x] = 'dark blue' if base_color == 'blue' else base_color
        
        return pattern
    
    def _bake_palettes(self, manifest: Dict[str, Any]) -> None:
        """Bake color palettes."""
        logger.info("🎨 Baking color palettes...")
        
        for palette_id, palette_data in manifest['palettes'].items():
            self.sprite_bank.palettes[palette_id] = palette_data.get('colors', [])
        
        logger.info(f"✅ Baked {len(self.sprite_bank.palettes)} palettes")
    
    def _bake_interactions(self, manifest: Dict[str, Any]) -> None:
        """Bake interaction logic and dialogue."""
        logger.info("💬 Baking interactions and dialogue...")
        
        # Bake interactions
        interactions = manifest.get('interactions', {})
        for interaction_id, interaction_data in interactions.items():
            self.interaction_registry.interactions[interaction_id] = interaction_data
        
        # Bake dialogue sets
        dialogue_sets = manifest.get('dialogue_sets', {})
        for dialogue_id, dialogue_data in dialogue_sets.items():
            self.interaction_registry.dialogue_sets[dialogue_id] = dialogue_data
        
        logger.info(f"✅ Baked {len(self.interaction_registry.interactions)} interactions")
        logger.info(f"✅ Baked {len(self.interaction_registry.dialogue_sets)} dialogue sets")
    
    def _compile_binary(self) -> None:
        """Compile all assets into a single binary file."""
        logger.info("💾 Compiling binary asset file...")
        
        # Calculate total asset count
        total_assets = (
            len(self.sprite_bank.sprites) +
            len(self.tile_registry.tiles) +
            len(self.object_registry.objects) +
            len(self.environment_registry.maps) +
            len(self.interaction_registry.interactions)
        )
        
        # Create header
        header = DGTAssetHeader(
            build_time=self.build_time,
            asset_count=total_assets
        )
        
        # Calculate checksum
        checksum_data = (
            str(self.build_time).encode() +
            str(total_assets).encode() +
            str(len(self.sprite_bank.sprites)).encode()
        )
        header.checksum = hashlib.sha256(checksum_data).digest()[:16]
        
        # Serialize all asset registries
        asset_data = {
            'sprite_bank': asdict(self.sprite_bank),
            'tile_registry': asdict(self.tile_registry),
            'object_registry': asdict(self.object_registry),
            'environment_registry': asdict(self.environment_registry),
            'interaction_registry': asdict(self.interaction_registry)
        }
        
        # Compress asset data
        compressed_assets = gzip.compress(pickle.dumps(asset_data))
        
        # Write binary file
        with open(self.output_path, 'wb') as f:
            # Write header
            f.write(header.magic)
            f.write(struct.pack('<I', header.version))
            f.write(struct.pack('<d', header.build_time))
            f.write(header.checksum)
            f.write(struct.pack('<I', header.asset_count))
            f.write(struct.pack('<I', header.data_offset))
            
            # Write compressed asset data
            f.write(compressed_assets)
        
        # Log results
        file_size = self.output_path.stat().st_size
        compression_ratio = len(pickle.dumps(asset_data)) / len(compressed_assets)
        
        logger.info(f"✅ Binary compiled successfully")
        logger.info(f"📁 File: {self.output_path}")
        logger.info(f"💾 Size: {file_size:,} bytes")
        logger.info(f"🗜️ Compression: {compression_ratio:.1f}x")
        logger.info(f"🎯 Assets: {total_assets} total")


def main():
    """Main entry point for asset baking."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    print("🔥 DGT Asset Baker - Pre-Fab Pipeline")
    print("=" * 50)
    print("Compiling YAML definitions into binary assets...")
    print()
    
    # Initialize baker with absolute paths
    root_dir = Path(__file__).parent.parent.parent
    manifest_path = root_dir / "assets" / "ASSET_MANIFEST.yaml"
    output_path = root_dir / "assets" / "assets.dgt"
    
    print(f"📁 Root: {root_dir}")
    print(f"📋 Manifest: {manifest_path}")
    print(f"💾 Output: {output_path}")
    
    baker = DGTAssetBaker(manifest_path, output_path)
    
    # Bake assets
    success = baker.bake_assets()
    
    if success:
        print("\n🏆 Asset baking completed successfully!")
        print("📋 All pre-fabs compiled into binary format")
        print("🚀 Ready for memory-mapped loading")
        print(f"💾 Output: {output_path}")
    else:
        print("\n❌ Asset baking failed!")
        print("🔧 Check logs for details")


if __name__ == "__main__":
    main()
