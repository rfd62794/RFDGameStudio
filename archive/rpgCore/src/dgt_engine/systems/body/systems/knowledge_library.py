"""
Knowledge Library - Genetic Pattern Discovery and Tracking
SRP: Manages discovered genetic patterns and provides analytics
"""

import json
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from loguru import logger
from foundation.types import Result
from engines.body.components.genetic_component import GeneticComponent


@dataclass
class DiscoveryRecord:
    """Record of a genetic pattern discovery"""
    genetic_id: str
    discovery_time: float
    wave_number: int
    source_type: str  # 'asteroid', 'ship', 'breeding'
    parent_ids: List[str]
    generation: int
    traits_summary: Dict[str, str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DiscoveryRecord':
        """Create from dictionary"""
        return cls(**data)


@dataclass
class PatternAnalysis:
    """Analysis of genetic patterns over time"""
    total_discoveries: int
    unique_generations: int
    most_common_traits: Dict[str, float]
    evolution_trends: Dict[str, List[float]]
    diversity_score: float
    last_update: float


class KnowledgeLibrary:
    """
    Library for tracking and analyzing discovered genetic patterns.
    Provides persistent storage and analytics for genetic evolution.
    """
    
    def __init__(self, library_file: Optional[str] = None):
        """
        Initialize knowledge library
        
        Args:
            library_file: File to store library data (optional)
        """
        self.library_file = library_file
        
        # Discovery tracking
        self.discoveries: Dict[str, DiscoveryRecord] = {}
        self.genetic_components: Dict[str, GeneticComponent] = {}
        
        # Analytics cache
        self._analysis_cache: Optional[PatternAnalysis] = None
        self._cache_timestamp: float = 0.0
        self._cache_ttl: float = 5.0  # Cache for 5 seconds
        
        # Statistics
        self.total_discoveries = 0
        self.first_discovery_time: Optional[float] = None
        
        # Load existing data
        self._load_library()
    
    def add_discovery(self, 
                      genetic_component: GeneticComponent,
                      wave_number: int,
                      source_type: str = 'asteroid') -> Result[DiscoveryRecord]:
        """
        Add a new genetic pattern discovery
        
        Args:
            genetic_component: Discovered genetic component
            wave_number: Wave number when discovered
            source_type: Type of source (asteroid, ship, breeding)
            
        Returns:
            Result containing discovery record
        """
        try:
            genetic_id = genetic_component.genetic_code.genetic_id
            
            # Check if already discovered
            if genetic_id in self.discoveries:
                return Result(success=False, error="Pattern already discovered")
            
            # Create discovery record
            discovery = DiscoveryRecord(
                genetic_id=genetic_id,
                discovery_time=time.time(),
                wave_number=wave_number,
                source_type=source_type,
                parent_ids=genetic_component.genetic_code.parent_ids,
                generation=genetic_component.genetic_code.generation,
                traits_summary=genetic_component.get_genetic_info()['traits']
            )
            
            # Store discovery
            self.discoveries[genetic_id] = discovery
            self.genetic_components[genetic_id] = genetic_component
            
            # Update statistics
            self.total_discoveries += 1
            if self.first_discovery_time is None:
                self.first_discovery_time = discovery.discovery_time
            
            # Invalidate cache
            self._analysis_cache = None
            
            # Save to file
            self._save_library()
            
            return Result(success=True, value=discovery)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to add discovery: {e}")
    
    def get_discovery(self, genetic_id: str) -> Optional[DiscoveryRecord]:
        """Get discovery record by genetic ID"""
        return self.discoveries.get(genetic_id)
    
    def get_genetic_component(self, genetic_id: str) -> Optional[GeneticComponent]:
        """Get genetic component by ID"""
        return self.genetic_components.get(genetic_id)
    
    def get_all_discoveries(self) -> List[DiscoveryRecord]:
        """Get all discoveries sorted by discovery time"""
        return sorted(self.discoveries.values(), key=lambda x: x.discovery_time, reverse=True)
    
    def get_discoveries_by_generation(self, generation: int) -> List[DiscoveryRecord]:
        """Get discoveries from a specific generation"""
        return [d for d in self.discoveries.values() if d.generation == generation]
    
    def get_discoveries_by_source(self, source_type: str) -> List[DiscoveryRecord]:
        """Get discoveries from a specific source type"""
        return [d for d in self.discoveries.values() if d.source_type == source_type]
    
    def get_lineage_tree(self, genetic_id: str) -> Dict[str, Any]:
        """
        Get the complete lineage tree for a genetic pattern
        
        Args:
            genetic_id: Root genetic ID
            
        Returns:
            Dictionary containing lineage tree structure
        """
        if genetic_id not in self.discoveries:
            return {}
        
        tree = {
            'genetic_id': genetic_id,
            'discovery': self.discoveries[genetic_id],
            'children': []
        }
        
        # Find children (patterns that have this as parent)
        for discovery in self.discoveries.values():
            if genetic_id in discovery.parent_ids:
                child_tree = self.get_lineage_tree(discovery.genetic_id)
                if child_tree:
                    tree['children'].append(child_tree)
        
        return tree
    
    def analyze_patterns(self) -> PatternAnalysis:
        """
        Analyze all discovered patterns
        
        Returns:
            Pattern analysis results
        """
        # Check cache
        current_time = time.time()
        if (self._analysis_cache and 
            current_time - self._cache_timestamp < self._cache_ttl):
            return self._analysis_cache
        
        if not self.discoveries:
            analysis = PatternAnalysis(
                total_discoveries=0,
                unique_generations=0,
                most_common_traits={},
                evolution_trends={},
                diversity_score=0.0,
                last_update=current_time
            )
            self._analysis_cache = analysis
            self._cache_timestamp = current_time
            return analysis
        
        # Calculate statistics
        generations = set()
        trait_values = {
            'speed': [],
            'mass': [],
            'thrust': [],
            'rotation': [],
            'friction': [],
            'aggression': [],
            'curiosity': [],
            'herd': []
        }
        
        for discovery in self.discoveries.values():
            generations.add(discovery.generation)
            
            # Extract trait values
            genetic_component = self.genetic_components[discovery.genetic_id]
            traits = genetic_component.genetic_code.traits
            
            trait_values['speed'].append(traits.speed_modifier)
            trait_values['mass'].append(traits.mass_modifier)
            trait_values['thrust'].append(traits.thrust_efficiency)
            trait_values['rotation'].append(traits.rotation_speed)
            trait_values['friction'].append(traits.friction_modifier)
            trait_values['aggression'].append(traits.aggression)
            trait_values['curiosity'].append(traits.curiosity)
            trait_values['herd'].append(traits.herd_mentality)
        
        # Calculate most common traits (averages)
        most_common_traits = {}
        for trait, values in trait_values.items():
            if values:
                most_common_traits[trait] = sum(values) / len(values)
            else:
                most_common_traits[trait] = 1.0
        
        # Calculate evolution trends (trait changes over generations)
        evolution_trends = {}
        for trait in trait_values.keys():
            trait_by_generation = {}
            for discovery in self.discoveries.values():
                gen = discovery.generation
                if gen not in trait_by_generation:
                    trait_by_generation[gen] = []
                
                genetic_component = self.genetic_components[discovery.genetic_id]
                traits = genetic_component.genetic_code.traits
                trait_by_generation[gen].append(getattr(traits, f"{trait}_modifier" if trait != 'thrust' else 'thrust_efficiency'))
            
            # Calculate average per generation
            trend = []
            for gen in sorted(trait_by_generation.keys()):
                avg = sum(trait_by_generation[gen]) / len(trait_by_generation[gen])
                trend.append(avg)
            
            evolution_trends[trait] = trend
        
        # Calculate diversity score (standard deviation of traits)
        diversity_score = 0.0
        if len(self.discoveries) > 1:
            for values in trait_values.values():
                if len(values) > 1:
                    mean = sum(values) / len(values)
                    variance = sum((x - mean) ** 2 for x in values) / len(values)
                    diversity_score += variance ** 0.5
            diversity_score /= len(trait_values)
        
        analysis = PatternAnalysis(
            total_discoveries=len(self.discoveries),
            unique_generations=len(generations),
            most_common_traits=most_common_traits,
            evolution_trends=evolution_trends,
            diversity_score=diversity_score,
            last_update=current_time
        )
        
        # Cache results
        self._analysis_cache = analysis
        self._cache_timestamp = current_time
        
        return analysis
    
    def get_library_stats(self) -> Dict[str, Any]:
        """Get library statistics for display"""
        if not self.discoveries:
            return {
                'total_discoveries': 0,
                'generations': 0,
                'sources': {},
                'time_span': 0,
                'diversity_score': 0.0
            }
        
        # Source distribution
        sources = {}
        for discovery in self.discoveries.values():
            source = discovery.source_type
            sources[source] = sources.get(source, 0) + 1
        
        # Time span
        times = [d.discovery_time for d in self.discoveries.values()]
        time_span = max(times) - min(times) if times else 0
        
        # Get diversity from analysis
        analysis = self.analyze_patterns()
        
        return {
            'total_discoveries': len(self.discoveries),
            'generations': len(set(d.generation for d in self.discoveries.values())),
            'sources': sources,
            'time_span': time_span,
            'diversity_score': analysis.diversity_score,
            'first_discovery': self.first_discovery_time,
            'last_analysis': analysis.last_update
        }
    
    def export_library(self, file_path: str) -> Result[bool]:
        """
        Export library data to file
        
        Args:
            file_path: Path to export file
            
        Returns:
            Result containing success status
        """
        try:
            export_data = {
                'discoveries': [d.to_dict() for d in self.discoveries.values()],
                'genetic_components': {
                    gid: component.genetic_code.__dict__
                    for gid, component in self.genetic_components.items()
                },
                'stats': self.get_library_stats(),
                'analysis': self.analyze_patterns().__dict__,
                'export_time': time.time()
            }
            
            with open(file_path, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Export failed: {e}")
    
    def _load_library(self) -> None:
        """Load library data from file"""
        if not self.library_file:
            return
        
        try:
            file_path = Path(self.library_file)
            if file_path.exists():
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                # Load discoveries
                for discovery_data in data.get('discoveries', []):
                    discovery = DiscoveryRecord.from_dict(discovery_data)
                    self.discoveries[discovery.genetic_id] = discovery
                
                # Note: Genetic components are not fully restored to avoid
                # complex object reconstruction issues
                
                logger.info(f"📚 Loaded {len(self.discoveries)} discoveries from library")
                
        except Exception as e:
            logger.warning(f"Failed to load library: {e}")
            # Start fresh if loading fails
            self.discoveries.clear()
            self.genetic_components.clear()
    
    def _save_library(self) -> None:
        """Save library data to file"""
        if not self.library_file:
            return
        
        try:
            file_path = Path(self.library_file)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save discoveries only (genetic components are too complex)
            data = {
                'discoveries': [d.to_dict() for d in self.discoveries.values()],
                'stats': self.get_library_stats(),
                'last_save': time.time()
            }
            
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.warning(f"Failed to save library: {e}")


# Factory function
def create_knowledge_library(library_file: Optional[str] = None) -> KnowledgeLibrary:
    """Create a knowledge library"""
    return KnowledgeLibrary(library_file)
