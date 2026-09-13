"""
Location Resolver - Geographic Soul for the DGT World

ADR 050: State-Action Synchronization

Translates (x, y) coordinates into "Pre-baked Area Names" from the YAML manifest.
This eliminates the "Undefined Location" bug and gives the Voyager a proper
geographic context for narrative generation.

The Location Resolver connects the mmap assets to the coordinate system,
ensuring that as the Voyager moves through the world, the narrative reflects
the current biome and area names.
"""

from typing import Dict, Optional, Tuple, List, Any
from dataclasses import dataclass
from pathlib import Path
import yaml

from loguru import logger


@dataclass
class LocationData:
    """Data structure for a location/area in the DGT world."""
    name: str
    description: str
    coordinates: List[Tuple[int, int]]  # List of (x, y) coordinates that belong to this location
    biome: str
    exits: Dict[str, str]  # Direction -> location_id
    npcs: List[str]  # NPC names in this location
    objects: List[str]  # Object names in this location
    tile_type: str  # Primary tile type for this location


class LocationResolver:
    """
    Resolves coordinates to location names and provides geographic context.
    
    This system ensures that the Voyager always knows "where they are" and
    provides the Chronicler with proper area names for narrative generation.
    """
    
    def __init__(self, manifest_path: Optional[Path] = None):
        """
        Initialize the location resolver.
        
        Args:
            manifest_path: Path to the ASSET_MANIFEST.yaml file
        """
        self.manifest_path = manifest_path or Path("assets/ASSET_MANIFEST.yaml")
        self.locations: Dict[str, LocationData] = {}
        self.coordinate_to_location: Dict[Tuple[int, int], str] = {}
        
        # Load location data from manifest
        self._load_location_data()
        
        logger.info("🗺️ Location Resolver initialized")
    
    def _load_location_data(self) -> None:
        """Load location data from the asset manifest."""
        try:
            with open(self.manifest_path, 'r') as f:
                manifest = yaml.safe_load(f)
            
            # Extract location data from environments
            environments = manifest.get('environments', {})
            
            for env_id, env_data in environments.items():
                location_name = env_data.get('name', env_id)
                description = env_data.get('description', f"Unknown area {env_id}")
                
                # Decode RLE-encoded tile map to coordinates
                tile_map = env_data.get('tile_map', [])
                coordinates = self._decode_rle_tile_map(tile_map, env_data.get('dimensions', [20, 18]))
                
                # Extract exits
                exits = env_data.get('exits', {})
                
                # Extract NPCs
                npcs = []
                for npc in env_data.get('npcs', []):
                    npcs.append(npc.get('type', f"NPC_{len(npcs)}"))
                
                # Extract objects
                objects = []
                for obj in env_data.get('objects', []):
                    objects.append(obj.get('type', f"Object_{len(objects)}"))
                
                # Determine primary tile type from tags
                tags = env_data.get('tags', [])
                if 'interior' in tags:
                    tile_type = "interior"
                elif 'exterior' in tags:
                    tile_type = "exterior"
                elif 'forest' in tags:
                    tile_type = "forest"
                elif 'town' in tags:
                    tile_type = "town"
                else:
                    tile_type = "unknown"
                
                # Create location data
                location = LocationData(
                    name=location_name,
                    description=description,
                    coordinates=coordinates,
                    biome=env_data.get('biome', tags[0] if tags else 'unknown'),
                    exits=exits,
                    npcs=npcs,
                    objects=objects,
                    tile_type=tile_type
                )
                
                self.locations[env_id] = location
                
                # Build coordinate to location mapping
                for coord in coordinates:
                    self.coordinate_to_location[coord] = env_id
            
            logger.info(f"🗺️ Loaded {len(self.locations)} locations from manifest")
            
        except Exception as e:
            logger.error(f"❌ Failed to load location data: {e}")
            # Create default location
            self._create_default_location()
    
    def _decode_rle_tile_map(self, tile_map: List[int], dimensions: List[int]) -> List[Tuple[int, int]]:
        """
        Decode RLE-encoded tile map to coordinate list.
        
        Args:
            tile_map: RLE-encoded tile map [tile_id, count, tile_id, count, ...]
            dimensions: [width, height] of the map
            
        Returns:
            List of (x, y) coordinates where tiles exist
        """
        if not tile_map or len(tile_map) < 2:
            return []
        
        width, height = dimensions
        coordinates = []
        
        # Decode RLE
        decoded_map = []
        i = 0
        while i < len(tile_map):
            tile_id = tile_map[i]
            count = tile_map[i + 1] if i + 1 < len(tile_map) else 1
            decoded_map.extend([tile_id] * count)
            i += 2
        
        # Convert to coordinates
        for y in range(height):
            for x in range(width):
                if y * width + x < len(decoded_map):
                    tile_id = decoded_map[y * width + x]
                    if tile_id != 0:  # 0 = empty/walkable
                        coordinates.append((x, y))
        
        return coordinates
    
    def _determine_tile_type(self, tile_map: List[List[int]]) -> str:
        """Determine the primary tile type for a location."""
        if not tile_map:
            return "empty"
        
        # Count tile types
        tile_counts = {}
        for row in tile_map:
            for tile_id in row:
                tile_counts[tile_id] = tile_counts.get(tile_id, 0) + 1
        
        # Find most common non-zero tile
        if not tile_counts:
            return "empty"
        
        most_common_tile = max(tile_counts, key=tile_counts.get)
        
        # Map tile IDs to types
        tile_type_map = {
            1: "stone",
            2: "water",
            3: "wood",
            4: "metal",
            5: "grass",
            6: "sand",
            7: "dirt",
            8: "snow",
            9: "lava"
        }
        
        return tile_type_map.get(most_common_tile, "unknown")
    
    def _create_default_location(self) -> None:
        """Create a default location for when manifest loading fails."""
        default_location = LocationData(
            name="Unknown Area",
            description="An undefined area in the DGT world",
            coordinates=[(0, 0)],
            biome="unknown",
            exits={},
            npcs=[],
            objects=[],
            tile_type="empty"
        )
        
        self.locations["default"] = default_location
        self.coordinate_to_location[(0, 0)] = "default"
        
        logger.warning("⚠️ Created default location due to manifest loading failure")
    
    def get_location_at(self, x: int, y: int) -> Optional[str]:
        """
        Get the location name at the specified coordinates.
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Location name or None if not found
        """
        return self.coordinate_to_location.get((x, y))
    
    def get_location_data(self, location_id: str) -> Optional[LocationData]:
        """
        Get detailed data for a location.
        
        Args:
            location_id: Location identifier
            
        Returns:
            LocationData or None if not found
        """
        return self.locations.get(location_id)
    
    def get_current_location(self, state: 'GameState') -> Optional[str]:
        """
        Get the current location based on game state.
        
        Args:
            state: Current game state
            
        Returns:
            Current location name or None
        """
        if not state or not hasattr(state, 'position'):
            return None
        
        return self.get_location_at(state.position.x, state.position.y)
    
    def get_location_description(self, x: int, y: int) -> str:
        """
        Get a descriptive string for the location at coordinates.
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Location description
        """
        location_id = self.get_location_at(x, y)
        if location_id:
            location_data = self.get_location_data(location_id)
            if location_data:
                return f"{location_data.name} ({location_data.biome})"
        return "Unknown Location"
    
    def get_nearby_locations(self, x: int, y: int, radius: int = 5) -> List[str]:
        """
        Get all locations within radius of coordinates.
        
        Args:
            x: Center X coordinate
            y: Center Y coordinate
            radius: Search radius
            
        Returns:
            List of location names within radius
        """
        nearby_locations = set()
        
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                check_x, check_y = x + dx, y + dy
                location_id = self.get_location_at(check_x, check_y)
                if location_id:
                    nearby_locations.add(location_id)
        
        return list(nearby_locations)
    
    def get_exits_from_location(self, location_id: str) -> Dict[str, str]:
        """
        Get all exits from a location.
        
        Args:
            location_id: Location identifier
            
        Returns:
            Dictionary of direction -> location_id
        """
        location_data = self.get_location_data(location_id)
        return location_data.exits if location_data else {}
    
    def get_npcs_in_location(self, location_id: str) -> List[str]:
        """
        Get all NPCs in a location.
        
        Args:
            location_id: Location identifier
            
        Returns:
            List of NPC names
        """
        location_data = self.get_location_data(location_id)
        return location_data.npcs if location_data else []
    
    def get_objects_in_location(self, location_id: str) -> List[str]:
        """
        Get all objects in a location.
        
        Args:
            location_id: Location identifier
            
        Returns:
            List of object names
        """
        location_data = self.get_location_data(location_id)
        return location_data.objects if location_data else []
    
    def is_walkable(self, x: int, y: int) -> bool:
        """
        Check if coordinates are walkable.
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            True if walkable, False otherwise
        """
        location_id = self.get_location_at(x, y)
        if location_id:
            location_data = self.get_location_data(location_id)
            return location_data.tile_type != "water" and location_data.tile_type != "lava"
        return True  # Default to walkable
    
    def get_location_summary(self) -> Dict[str, Any]:
        """Get a summary of all loaded locations."""
        return {
            "total_locations": len(self.locations),
            "total_coordinates": len(self.coordinate_to_location),
            "biomes": list(set(loc.biome for loc in self.locations.values())),
            "tile_types": list(set(loc.tile_type for loc in self.locations.values())),
            "locations": list(self.locations.keys())
        }
    
    def validate_coordinate_coverage(self) -> Dict[str, Any]:
        """
        Validate that coordinate mapping covers all location coordinates.
        
        Returns:
            Validation report
        """
        total_coords = sum(len(loc.coordinates) for loc in self.locations.values())
        mapped_coords = len(self.coordinate_to_location)
        
        unmapped_coords = []
        for location in self.locations.values():
            for coord in location.coordinates:
                if coord not in self.coordinate_to_location:
                    unmapped_coords.append(coord)
        
        return {
            "total_location_coords": total_coords,
            "mapped_coords": mapped_coords,
            "unmapped_coords": len(unmapped_coords),
            "coverage_percentage": (mapped_coords / total_coords * 100) if total_coords > 0 else 0,
            "unmapped_examples": unmapped_coords[:5]  # First 5 examples
        }


# Factory for creating location resolver
class LocationResolverFactory:
    """Factory for creating location resolvers."""
    
    @staticmethod
    def create_location_resolver(manifest_path: Optional[Path] = None) -> LocationResolver:
        """Create location resolver with manifest path."""
        return LocationResolver(manifest_path)
