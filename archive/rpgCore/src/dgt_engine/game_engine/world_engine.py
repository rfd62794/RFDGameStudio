"""
World Engine - The World Pillar (Deterministic Chaos Foundation)

Implements the Chaos-Seed Protocol: deterministic world generation with
Interest Points that the LLM Chronicler will manifest into narrative elements.

The World Engine is purely mathematical and deterministic - it generates
the "canvas" of possibilities but never decides what they "mean".
"""

import hashlib
import time
import asyncio
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from pathlib import Path

from loguru import logger

from dgt_engine.systems.kernel.state.models import (
    Tile, TileType, BiomeType, InterestPoint, InterestType, Chunk, WorldDelta, TileData
)
from dgt_engine.systems.kernel.state.validation import validate_position
from dgt_engine.foundation.constants import (
    WORLD_SIZE_X, WORLD_SIZE_Y, CHUNK_SIZE, INTEREST_POINT_SPAWN_CHANCE,
    PERMUTATION_TABLE_SIZE, NOISE_SCALE, NOISE_OCTAVES, NOISE_PERSISTENCE, NOISE_LACUNARITY,
    INTEREST_POINT_DENSITY, INTEREST_POINT_MIN_DISTANCE, INTEREST_POINT_MAX_PER_CHUNK
)
from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader, ObjectRegistry


@dataclass
class PermutationTable:
    """Hash-based permutation table for deterministic noise generation"""
    seed: str
    table: List[int]
    
    def __post_init__(self):
        if len(self.table) != PERMUTATION_TABLE_SIZE:
            raise ValueError(f"Permutation table must have exactly {PERMUTATION_TABLE_SIZE} entries")
    
    @classmethod
    def from_seed(cls, seed: str) -> 'PermutationTable':
        """Generate permutation table from seed using MD5 hash"""
        # Create base permutation
        base_table = list(range(PERMUTATION_TABLE_SIZE))
        
        # Use seed to shuffle the table deterministically
        hash_obj = hashlib.md5(seed.encode('utf-8'))
        hash_bytes = hash_obj.digest()
        
        # Convert hash bytes to shuffle indices
        shuffle_indices = []
        for i in range(0, len(hash_bytes), 4):
            if i + 4 <= len(hash_bytes):
                value = int.from_bytes(hash_bytes[i:i+4], 'big')
                shuffle_indices.append(value % PERMUTATION_TABLE_SIZE)
        
        # Apply deterministic shuffle
        for i in range(PERMUTATION_TABLE_SIZE):
            j = shuffle_indices[i % len(shuffle_indices)]
            base_table[i], base_table[j] = base_table[j], base_table[i]
        
        return cls(seed=seed, table=base_table)
    
    def get_value(self, x: int, y: int) -> int:
        """Get permutation value for coordinates"""
        return self.table[(x + y) % PERMUTATION_TABLE_SIZE]
    
    def get_gradient(self, x: int, y: int) -> Tuple[float, float]:
        """Get gradient vector for Perlin noise"""
        hash_val = self.get_value(x, y)
        
        # Convert hash to gradient direction (8 directions)
        angle = (hash_val / PERMUTATION_TABLE_SIZE) * 2 * 3.14159
        return (hash_val % 3 - 1, (hash_val // 3) % 3 - 1)


@dataclass
class Chunk:
    """A chunk of the world (10x10 tiles)"""
    chunk_x: int
    chunk_y: int
    tiles: List[List[TileData]]
    interest_points: List[InterestPoint]
    generated: bool = False
    generation_timestamp: float = 0.0
    
    def __post_init__(self):
        if not self.generated:
            self.generation_timestamp = time.time()


class WorldEngine:
    """Deterministic world generation engine with Chaos-Seed Protocol"""
    
    def __init__(self, seed: str = "SEED_ZERO"):
        self.seed = seed
        
        # World storage
        self.chunks: Dict[Tuple[int, int], Chunk] = {}
        self.interest_points: List[InterestPoint] = []
        
        # Asset management
        self.asset_loader = AssetLoader()
        self.object_registry = ObjectRegistry(self.asset_loader)
        
        # Generation cache
        self._noise_cache: Dict[Tuple[int, int], float] = {}
        self._biome_cache: Dict[Tuple[int, int], BiomeType] = {}
        
        # Generation state
        self._generation_lock = asyncio.Lock()
        self._generation_queue: List[Tuple[int, int]] = []
        self._generation_set: set = set()  # Track queued chunks
        
        # Permutation table for deterministic noise
        self.permutation_table = PermutationTable.from_seed(seed)
        
        # Chronos Engine reference (to be injected)
        self.chronos_engine = None
        
        logger.info(f"🌍 World Engine initialized with seed: {seed}")
    
    # === FACADE INTERFACE ===
    
    async def get_tile_at(self, position: Tuple[int, int]) -> Tile:
        """Get tile data at position (Facade method)"""
        if not validate_position(position):
            raise WorldGenerationError(f"Invalid position: {position}")
        
        # Ensure chunk is generated
        chunk_pos = self._position_to_chunk(position)
        await self._ensure_chunk_generated(chunk_pos)
        
        chunk = self.chunks[chunk_pos]
        local_x = position[0] % CHUNK_SIZE
        local_y = position[1] % CHUNK_SIZE
        
        return chunk.tiles[local_y][local_x]
    
    async def get_biome(self, position: Tuple[int, int]) -> BiomeType:
        """Get biome type at position (Facade method)"""
        if not validate_position(position):
            raise WorldGenerationError(f"Invalid position: {position}")
        
        if position not in self._biome_cache:
            self._biome_cache[position] = await self._generate_biome(position)
        
        return self._biome_cache[position]
    
    async def get_collision_map(self) -> List[List[bool]]:
        """Get collision map for pathfinding (Facade method)"""
        collision_map = []
        
        for y in range(WORLD_SIZE_Y):
            row = []
            for x in range(WORLD_SIZE_X):
                tile = await self.get_tile_at((x, y))
                row.append(not tile.walkable)
            collision_map.append(row)
        
        return collision_map
    
    async def get_interest_points(self) -> List[InterestPoint]:
        """Get all interest points (Facade method)"""
        return self.interest_points.copy()
    
    async def get_nearby_interest_points(self, position: Tuple[int, int], radius: int = 5) -> List[InterestPoint]:
        """Get interest points near position (Facade method)"""
        nearby = []
        
        for interest_point in self.interest_points:
            distance = abs(position[0] - interest_point.position[0]) + \
                      abs(position[1] - interest_point.position[1])
            
            if distance <= radius:
                nearby.append(interest_point)
        
        return nearby
    
    async def pre_generate_chunks(self, center_position: Tuple[int, int]) -> None:
        """Pre-generate chunks around position (Background task)"""
        center_chunk = self._position_to_chunk(center_position)
        
        # Generate chunks in 3x3 area around center
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                chunk_pos = (center_chunk[0] + dx, center_chunk[1] + dy)
                if chunk_pos not in self.chunks and chunk_pos not in self._generation_set:
                    self._generation_queue.append(chunk_pos)
                    self._generation_set.add(chunk_pos)
        
        # Process generation queue
        await self._process_generation_queue()
    
    # === CORE GENERATION METHODS ===
    
    async def _ensure_chunk_generated(self, chunk_pos: Tuple[int, int]) -> None:
        """Ensure chunk is generated"""
        if chunk_pos not in self.chunks:
            async with self._generation_lock:
                if chunk_pos not in self.chunks:
                    await self._generate_chunk(chunk_pos)
    
    async def _generate_chunk(self, chunk_pos: Tuple[int, int]) -> None:
        """Generate a single chunk with potential task spawning"""
        start_time = time.time()
        
        # Generate tiles
        tiles = []
        for local_y in range(CHUNK_SIZE):
            tile_row = []
            for local_x in range(CHUNK_SIZE):
                world_pos = (
                    chunk_pos[0] * CHUNK_SIZE + local_x,
                    chunk_pos[1] * CHUNK_SIZE + local_y
                )
                tile = await self._generate_tile(world_pos)
                tile_row.append(tile)
            tiles.append(tile_row)
        
        # Create chunk
        chunk = Chunk(
            chunk_pos,
            CHUNK_SIZE,
            f"{self.seed}_chunk_{chunk_pos[0]}_{chunk_pos[1]}",
            {},  # tiles
            []   # interest_points
        )
        
        # Initialize tiles dict properly
        chunk.tiles = {}
        
        # Add tiles to chunk
        for y, tile_row in enumerate(tiles):
            for x, tile_data in enumerate(tile_row):
                chunk.tiles[(x, y)] = tile_data.tile
        
        # Store chunk
        self.chunks[chunk_pos] = chunk
        
        # Spawn procedural objects from asset registry
        await self._spawn_objects_in_chunk(chunk_pos, chunk)
        
        # Spawn procedural tasks if Chronos Engine is available
        if self.chronos_engine:
            chunk_seed = f"{self.seed}_chunk_{chunk_pos[0]}_{chunk_pos[1]}"
            world_center = (
                chunk_pos[0] * CHUNK_SIZE + CHUNK_SIZE // 2,
                chunk_pos[1] * CHUNK_SIZE + CHUNK_SIZE // 2
            )
            
            task = await self.chronos_engine.add_procedural_task(world_center, chunk_seed)
            if task:
                logger.info(f"📋 Task spawned in chunk {chunk_pos}: {task.title}")
        
        generation_time = time.time() - start_time
        logger.debug(f"🌍 Generated chunk {chunk_pos} in {generation_time:.3f}s")
    
    def set_chronos_engine(self, chronos_engine: ChronosEngine) -> None:
        """Inject Chronos Engine dependency for task spawning"""
        self.chronos_engine = chronos_engine
        logger.info("🌍 Chronos Engine dependency injected for task spawning")
    
    async def _generate_tile(self, position: Tuple[int, int]) -> Tile:
        """Generate a single tile"""
        # Generate noise value
        noise_value = self._generate_perlin_noise(position)
        
        # Determine biome
        biome = await self.get_biome(position)
        
        # Determine tile type based on biome and noise
        tile_type = self._determine_tile_type(noise_value, biome)
        
        # Determine walkability
        walkable = self._determine_walkability(tile_type, biome)
        
        # Generate metadata
        metadata = {
            "noise_value": noise_value,
            "biome": biome.value,
            "generated_at": time.time()
        }
        
        # Create Tile object first
        tile = Tile(
            tile_type=tile_type,
            walkable=walkable
        )
        
        return TileData(
            tile=tile,
            biome=biome,
            metadata=metadata
        )
    
    def _generate_perlin_noise(self, position: Tuple[int, int]) -> float:
        """Generate Perlin noise value for position"""
        if position in self._noise_cache:
            return self._noise_cache[position]
        
        value = 0.0
        amplitude = 1.0
        frequency = NOISE_SCALE
        
        for octave in range(NOISE_OCTAVES):
            sample_x = position[0] * frequency
            sample_y = position[1] * frequency
            
            octave_value = self._perlin_octave(sample_x, sample_y)
            value += octave_value * amplitude
            
            amplitude *= NOISE_PERSISTENCE
            frequency *= NOISE_LACUNARITY
        
        # Normalize to [0, 1]
        value = (value + 1.0) / 2.0
        self._noise_cache[position] = value
        
        return value
    
    def _perlin_octave(self, x: float, y: float) -> float:
        """Generate single octave of Perlin noise"""
        # Get grid coordinates
        x0 = int(x)
        y0 = int(y)
        x1 = x0 + 1
        y1 = y0 + 1
        
        # Get interpolation weights
        sx = x - x0
        sy = y - y0
        
        # Get gradient vectors
        g00 = self.permutation_table.get_gradient(x0, y0)
        g10 = self.permutation_table.get_gradient(x1, y0)
        g01 = self.permutation_table.get_gradient(x0, y1)
        g11 = self.permutation_table.get_gradient(x1, y1)
        
        # Calculate dot products
        n00 = g00[0] * sx + g00[1] * sy
        n10 = g10[0] * (sx - 1) + g10[1] * sy
        n01 = g01[0] * sx + g01[1] * (sy - 1)
        n11 = g11[0] * (sx - 1) + g11[1] * (sy - 1)
        
        # Interpolate
        wx = self._fade(sx)
        wy = self._fade(sy)
        
        nx0 = n00 * (1 - wx) + n10 * wx
        nx1 = n01 * (1 - wx) + n11 * wx
        
        return nx0 * (1 - wy) + nx1 * wy
    
    def _fade(self, t: float) -> float:
        """Fade function for Perlin noise interpolation"""
        return t * t * t * (t * (t * 6 - 15) + 10)
    
    async def _generate_biome(self, position: Tuple[int, int]) -> BiomeType:
        """Generate biome type for position"""
        # Use larger-scale noise for biome generation
        biome_noise = self._generate_perlin_noise((
            position[0] // 10, 
            position[1] // 10
        ))
        
        if biome_noise < 0.2:
            return BiomeType.WATER
        elif biome_noise < 0.4:
            return BiomeType.FOREST
        elif biome_noise < 0.6:
            return BiomeType.GRASS
        elif biome_noise < 0.8:
            return BiomeType.MOUNTAIN
        else:
            return BiomeType.DESERT
    
    def _determine_tile_type(self, noise_value: float, biome: BiomeType) -> TileType:
        """Determine tile type based on noise and biome"""
        if biome == BiomeType.WATER:
            return TileType.WATER
        elif biome == BiomeType.FOREST:
            if noise_value < 0.3:
                return TileType.GRASS
            else:
                return TileType.FOREST
        elif biome == BiomeType.MOUNTAIN:
            if noise_value < 0.4:
                return TileType.STONE
            else:
                return TileType.MOUNTAIN
        elif biome == BiomeType.DESERT:
            return TileType.SAND
        else:  # GRASS
            if noise_value < 0.1:
                return TileType.WATER
            elif noise_value < 0.8:
                return TileType.GRASS
            else:
                return TileType.STONE
    
    def _determine_walkability(self, tile_type: TileType, biome: BiomeType) -> bool:
        """Determine if tile is walkable"""
        unwalkable_tiles = {
            TileType.WATER, TileType.MOUNTAIN, 
            TileType.WALL, TileType.DOOR_CLOSED
        }
        return tile_type not in unwalkable_tiles
    
    async def _generate_chunk_interest_points(self, chunk_pos: Tuple[int, int]) -> List[InterestPoint]:
        """Generate interest points for a chunk"""
        interest_points = []
        
        # Calculate number of interest points for this chunk
        chunk_seed = f"{self.seed}_chunk_{chunk_pos[0]}_{chunk_pos[1]}"
        chunk_hash = hashlib.md5(chunk_seed.encode()).hexdigest()
        chunk_value = int(chunk_hash[:8], 16) / 0xFFFFFFFF
        
        num_points = int(chunk_value * INTEREST_POINT_MAX_PER_CHUNK)
        
        # Generate interest points
        for i in range(num_points):
            position = await self._generate_interest_point_position(chunk_pos, i)
            interest_type = await self._generate_interest_point_type(position, i)
            
            interest_point = InterestPoint(
                position=position,
                interest_type=interest_type,
                seed_value=hash(f"{chunk_seed}_{i}") % 1000000,
                discovered=False
            )
            
            interest_points.append(interest_point)
        
        return interest_points
    
    async def _spawn_objects_in_chunk(self, chunk_pos: Tuple[int, int], chunk: Chunk) -> None:
        """Spawn procedural objects in chunk based on asset registry"""
        # Get spawnable objects from asset loader
        spawnable_objects = self.asset_loader.get_spawnable_objects()
        
        if not spawnable_objects:
            return
        
        # Calculate spawn chance for this chunk
        chunk_seed = f"{self.seed}_objects_{chunk_pos[0]}_{chunk_pos[1]}"
        chunk_hash = hashlib.md5(chunk_seed.encode()).hexdigest()
        chunk_value = int(chunk_hash[:8], 16) / 0xFFFFFFFF
        
        # Determine number of objects to spawn (0-3 per chunk)
        max_objects = 3
        num_objects = int(chunk_value * max_objects)
        
        # Spawn objects
        for i in range(num_objects):
            # Select random object based on rarity
            object_def = self._select_object_by_rarity(spawnable_objects, chunk_seed, i)
            
            if object_def:
                # Generate position within chunk
                world_pos = await self._generate_object_position(chunk_pos, i)
                
                # Spawn object in world
                spawned_obj = self.object_registry.spawn_object(object_def.asset_id, world_pos)
                
                if spawned_obj:
                    # Add interest point for object
                    interest_point = InterestPoint(
                        position=world_pos,
                        interest_type=InterestType.STRUCTURE,
                        seed_value=hash(f"{chunk_seed}_{i}") % 1000000,
                        discovered=False
                    )
                    chunk.interest_points = [interest_point]
                    self.interest_points.append(interest_point)
                    
                    logger.debug(f"🏗️ Spawned {object_def.asset_id} at {world_pos}")
    
    def _select_object_by_rarity(self, spawnable_objects: List, chunk_seed: str, index: int) -> Optional:
        """Select object based on rarity using deterministic random"""
        import random
        
        # Create deterministic random generator
        rand = random.Random(f"{chunk_seed}_{index}")
        
        # Weight objects by rarity (lower rarity = higher chance)
        weighted_objects = []
        for obj_def in spawnable_objects:
            if obj_def.characteristics:
                weight = 1.0 - obj_def.characteristics.rarity
                weighted_objects.extend([obj_def] * int(weight * 10))
        
        if weighted_objects:
            return rand.choice(weighted_objects)
        
        return None
    
    async def _generate_object_position(self, chunk_pos: Tuple[int, int], index: int) -> Tuple[int, int]:
        """Generate deterministic position for object within chunk"""
        # Use hash for deterministic positioning
        pos_seed = f"{self.seed}_objpos_{chunk_pos[0]}_{chunk_pos[1]}_{index}"
        pos_hash = hashlib.md5(pos_seed.encode()).hexdigest()
        
        # Extract coordinates from hash
        x_offset = int(pos_hash[:4], 16) % CHUNK_SIZE
        y_offset = int(pos_hash[4:8], 16) % CHUNK_SIZE
        
        # Convert to world coordinates
        world_x = chunk_pos[0] * CHUNK_SIZE + x_offset
        world_y = chunk_pos[1] * CHUNK_SIZE + y_offset
        
        return (world_x, world_y)

    def _position_to_chunk(self, position: Tuple[int, int]) -> Tuple[int, int]:
        """Convert world position to chunk coordinates"""
        return (position[0] // CHUNK_SIZE, position[1] // CHUNK_SIZE)
    
    def add_chunks_to_generation_queue(self, center_chunk: Tuple[int, int], radius: int) -> None:
        """Add chunks to generation queue"""
        for chunk_x in range(center_chunk[0] - radius, center_chunk[0] + radius + 1):
            for chunk_y in range(center_chunk[1] - radius, center_chunk[1] + radius + 1):
                chunk_pos = (chunk_x, chunk_y)
                if chunk_pos not in self.chunks and chunk_pos not in self._generation_set:
                    self._generation_queue.append(chunk_pos)
                    self._generation_set.add(chunk_pos)
    
    async def _process_generation_queue(self) -> None:
        """Process background chunk generation queue"""
        while self._generation_queue:
            chunk_pos = self._generation_queue.pop()
            
            if chunk_pos not in self.chunks:
                await self._generate_chunk(chunk_pos)
    
    def get_world_deltas(self) -> Dict[Tuple[int, int], WorldDelta]:
        """Get world state changes (for persistence)"""
        deltas = {}
        
        for interest_point in self.interest_points:
            if interest_point.manifestation:
                delta = WorldDelta(
                    position=interest_point.position,
                    delta_type="interest_manifestation",
                    timestamp=interest_point.manifestation_timestamp or time.time(),
                    data={
                        "interest_type": interest_point.interest_type.value,
                        "manifestation": interest_point.manifestation,
                        "seed_value": interest_point.seed_value
                    }
                )
                deltas[interest_point.position] = delta
        
        return deltas
    
    def apply_world_delta(self, delta: WorldDelta) -> None:
        """Apply world state change (from persistence)"""
        if delta.delta_type == "interest_manifestation":
            # Find corresponding interest point
            for interest_point in self.interest_points:
                if interest_point.position == delta.position:
                    interest_point.manifestation = delta.data.get("manifestation")
                    interest_point.manifestation_timestamp = delta.timestamp
                    break
    
    # === DEBUG AND UTILITIES ===
    
    def get_generation_stats(self) -> Dict[str, Any]:
        """Get world generation statistics"""
        return {
            "seed": self.seed,
            "chunks_generated": len(self.chunks),
            "interest_points_total": len(self.interest_points),
            "interest_points_discovered": sum(1 for ip in self.interest_points if ip.discovered),
            "interest_points_manifested": sum(1 for ip in self.interest_points if ip.manifestation),
            "cache_size": len(self._noise_cache) + len(self._biome_cache)
        }
    
    def clear_cache(self) -> None:
        """Clear generation cache"""
        self._noise_cache.clear()
        self._biome_cache.clear()
        logger.info("🌍 World Engine cache cleared")


# === FACTORY ===

class WorldEngineFactory:
    """Factory for creating World Engine instances"""
    
    @staticmethod
    def create_world(config_or_seed) -> WorldEngine:
        """Create a World Engine with configuration or seed"""
        if hasattr(config_or_seed, 'seed'):
            # It's a WorldConfig object
            config = config_or_seed
            return WorldEngine(config.seed)
        else:
            # It's a seed string (legacy compatibility)
            return WorldEngine(config_or_seed)
    
    @staticmethod
    def create_tavern_world() -> WorldEngine:
        """Create World Engine with tavern-specific seed"""
        return WorldEngine("TAVERN_SEED")
    
    @staticmethod
    def create_test_world() -> WorldEngine:
        """Create World Engine for testing"""
        return WorldEngine("TEST_SEED")


# === SYNCHRONOUS WRAPPER ===

class WorldEngineSync:
    """Synchronous wrapper for World Engine (for compatibility)"""
    
    def __init__(self, world_engine: WorldEngine):
        self.world_engine = world_engine
        self._loop = asyncio.new_event_loop()
    
    def get_tile_at(self, position: Tuple[int, int]) -> TileData:
        """Synchronous get_tile_at"""
        return self._loop.run_until_complete(
            self.world_engine.get_tile_at(position)
        )
    
    def get_biome(self, position: Tuple[int, int]) -> BiomeType:
        """Synchronous get_biome"""
        return self._loop.run_until_complete(
            self.world_engine.get_biome(position)
        )
    
    def get_collision_map(self) -> List[List[bool]]:
        """Synchronous get_collision_map"""
        return self._loop.run_until_complete(
            self.world_engine.get_collision_map()
        )
    
    def get_interest_points(self) -> List[InterestPoint]:
        """Synchronous get_interest_points"""
        return self._loop.run_until_complete(
            self.world_engine.get_interest_points()
        )
