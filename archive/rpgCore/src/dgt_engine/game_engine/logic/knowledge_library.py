"""
Knowledge Library - Shared Epigenetic Learning System
Manages technique storage, retrieval, and inheritance between AI generations
"""

import json
import math
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from loguru import logger
from dgt_engine.foundation.types import Result

from .technique_extractor import TechniqueTemplate, create_technique_extractor


class KnowledgeLibrary:
    """Shared knowledge library for epigenetic learning between AI generations"""
    
    def __init__(self, library_path: str = "data/knowledge_library.json"):
        self.library_path = Path(library_path)
        self.techniques: List[TechniqueTemplate] = []
        self.success_vectors = {
            'avoidance_patterns': [],
            'collection_patterns': [],
            'navigation_patterns': []
        }
        self.learning_statistics = {
            'total_extractions': 0,
            'successful_applications': 0,
            'failed_applications': 0,
            'average_success_rate': 0.0
        }
        
        # Technique extractor for distilling new knowledge
        self.extractor = create_technique_extractor()
        
        # Knowledge decay parameters
        self.max_technique_age = 1000.0  # Maximum age before decay
        self.min_success_rate = 0.3  # Minimum success rate to keep technique
        self.usage_threshold = 5  # Minimum usage count to maintain technique
        
        # Load existing knowledge
        self.load_library()
        
        logger.info(f"📚 Knowledge Library initialized with {len(self.techniques)} techniques")
    
    def load_library(self) -> Result[bool]:
        """Load knowledge library from file"""
        try:
            if not self.library_path.exists():
                # Create initial empty library
                self._create_empty_library()
                return Result(success=True, value=True)
            
            with open(self.library_path, 'r') as f:
                data = json.load(f)
            
            # Load techniques
            self.techniques = []
            for technique_data in data.get('techniques', []):
                technique = TechniqueTemplate.from_dict(technique_data)
                self.techniques.append(technique)
            
            # Load success vectors
            self.success_vectors = data.get('success_vectors', {
                'avoidance_patterns': [],
                'collection_patterns': [],
                'navigation_patterns': []
            })
            
            # Load statistics
            self.learning_statistics = data.get('learning_statistics', {
                'total_extractions': 0,
                'successful_applications': 0,
                'failed_applications': 0,
                'average_success_rate': 0.0
            })
            
            logger.info(f"📖 Loaded {len(self.techniques)} techniques from library")
            return Result(success=True, value=True)
            
        except Exception as e:
            logger.error(f"Failed to load knowledge library: {e}")
            return Result(success=False, error=f"Failed to load library: {e}")
    
    def save_library(self) -> Result[bool]:
        """Save knowledge library to file"""
        try:
            # Prepare data for serialization
            data = {
                'metadata': {
                    'version': '1.0',
                    'created': '2026-02-12',
                    'description': 'Shared Knowledge Library for AI Pilots - Epigenetic Learning',
                    'total_techniques': len(self.techniques),
                    'last_updated': None  # Would add timestamp
                },
                'techniques': [technique.to_dict() for technique in self.techniques],
                'success_vectors': self.success_vectors,
                'learning_statistics': self.learning_statistics
            }
            
            # Ensure directory exists
            self.library_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save to file
            with open(self.library_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"💾 Saved {len(self.techniques)} techniques to library")
            return Result(success=True, value=True)
            
        except Exception as e:
            logger.error(f"Failed to save knowledge library: {e}")
            return Result(success=False, error=f"Failed to save library: {e}")
    
    def _create_empty_library(self) -> None:
        """Create empty knowledge library file"""
        data = {
            'metadata': {
                'version': '1.0',
                'created': '2026-02-12',
                'description': 'Shared Knowledge Library for AI Pilots - Epigenetic Learning',
                'total_techniques': 0,
                'last_updated': None
            },
            'techniques': [],
            'success_vectors': {
                'avoidance_patterns': [],
                'collection_patterns': [],
                'navigation_patterns': []
            },
            'learning_statistics': {
                'total_extractions': 0,
                'successful_applications': 0,
                'failed_applications': 0,
                'average_success_rate': 0.0
            }
        }
        
        self.library_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.library_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_experience_frame(self, timestamp: float, inputs: List[float], outputs: List[float],
                           fitness: float, stress_level: float) -> None:
        """Add experience frame for potential technique extraction"""
        self.extractor.add_frame(timestamp, inputs, outputs, fitness, stress_level)
        
        # Check if new techniques were extracted
        new_techniques = self.extractor.get_techniques()
        
        # Add new techniques to library
        for technique in new_techniques:
            if technique not in self.techniques:
                self._add_technique_to_library(technique)
                self.learning_statistics['total_extractions'] += 1
    
    def _add_technique_to_library(self, technique: TechniqueTemplate) -> None:
        """Add technique to library with validation"""
        # Check for similar existing techniques
        similar = self._find_similar_technique(technique)
        
        if similar:
            # Merge with existing technique
            self._merge_techniques(similar, technique)
            logger.debug(f"🔄 Merged technique: {technique.name}")
        else:
            # Add new technique
            self.techniques.append(technique)
            logger.info(f"📚 Added new technique: {technique.name}")
            
            # Auto-save library
            self.save_library()
    
    def _find_similar_technique(self, technique: TechniqueTemplate) -> Optional[TechniqueTemplate]:
        """Find similar existing technique"""
        for existing in self.techniques:
            similarity = self._calculate_technique_similarity(technique, existing)
            if similarity > 0.8:  # High similarity threshold
                return existing
        return None
    
    def _calculate_technique_similarity(self, technique1: TechniqueTemplate, technique2: TechniqueTemplate) -> float:
        """Calculate similarity between two techniques"""
        # Simple similarity based on input/output patterns
        input_similarity = self._calculate_pattern_similarity(
            technique1.input_pattern, technique2.input_pattern
        )
        output_similarity = self._calculate_pattern_similarity(
            technique1.output_action, technique2.output_action
        )
        
        return (input_similarity + output_similarity) / 2.0
    
    def _calculate_pattern_similarity(self, pattern1: Dict[str, Any], pattern2: Dict[str, Any]) -> float:
        """Calculate similarity between two patterns"""
        if not pattern1 or not pattern2:
            return 0.0
        
        # Find common keys
        common_keys = set(pattern1.keys()) & set(pattern2.keys())
        
        if not common_keys:
            return 0.0
        
        # Calculate similarity for common keys
        similarities = []
        
        for key in common_keys:
            val1 = pattern1[key]
            val2 = pattern2[key]
            
            if isinstance(val1, dict) and isinstance(val2, dict):
                if 'avg' in val1 and 'avg' in val2:
                    similarity = 1.0 - abs(val1['avg'] - val2['avg'])
                    similarities.append(max(0.0, similarity))
        
        return sum(similarities) / len(similarities) if similarities else 0.0
    
    def _merge_techniques(self, existing: TechniqueTemplate, new: TechniqueTemplate) -> None:
        """Merge new technique data into existing technique"""
        # Update usage and success metrics
        existing.usage_count += new.usage_count
        existing.last_used = max(existing.last_used, new.last_used)
        
        # Weighted average of fitness scores
        total_usage = existing.usage_count + new.usage_count
        existing.fitness_score = (existing.fitness_score * existing.usage_count + 
                                new.fitness_score * new.usage_count) / total_usage
        
        # Update success rate
        existing.success_rate = (existing.success_rate * existing.usage_count + 
                               new.success_rate * new.usage_count) / total_usage
    
    def get_technique_for_situation(self, current_inputs: List[float]) -> Optional[TechniqueTemplate]:
        """Get best matching technique for current situation"""
        best_technique = None
        best_score = 0.0
        
        for technique in self.techniques:
            score = self._calculate_match_score(technique, current_inputs)
            if score > best_score and score > 0.5:  # Minimum threshold
                best_technique = technique
                best_score = score
        
        if best_technique:
            best_technique.usage_count += 1
            best_technique.last_used = self.learning_statistics.get('current_time', 0.0)
            self.learning_statistics['successful_applications'] += 1
        
        return best_technique
    
    def _calculate_match_score(self, technique: TechniqueTemplate, current_inputs: List[float]) -> float:
        """Calculate how well technique matches current situation"""
        if not technique.input_pattern:
            return 0.0
        
        # Convert current inputs to dictionary format
        input_names = ['distance', 'angle', 'vx', 'vy', 'heading', 'scrap_distance']
        current_dict = {}
        
        for i, value in enumerate(current_inputs):
            if i < len(input_names):
                current_dict[input_names[i]] = value
        
        # Calculate match score
        return self._calculate_pattern_similarity(technique.input_pattern, current_dict)
    
    def get_bias_for_new_generation(self) -> Dict[str, Any]:
        """Get bias information for new AI generation"""
        # Get top performing techniques
        top_techniques = sorted(self.techniques, 
                              key=lambda t: t.fitness_score * t.success_rate, 
                              reverse=True)[:10]
        
        bias_info = {
            'technique_count': len(top_techniques),
            'bias_patterns': [],
            'avoidance_patterns': [],
            'collection_patterns': []
        }
        
        for technique in top_techniques:
            # Create bias pattern from technique
            bias_pattern = {
                'name': technique.name,
                'input_pattern': technique.input_pattern,
                'output_bias': technique.output_action,
                'fitness': technique.fitness_score,
                'success_rate': technique.success_rate
            }
            
            bias_info['bias_patterns'].append(bias_pattern)
            
            # Categorize by type
            if 'avoid' in technique.name.lower() or 'turn' in technique.name.lower():
                bias_info['avoidance_patterns'].append(bias_pattern)
            elif 'collect' in technique.name.lower() or 'scrap' in technique.name.lower():
                bias_info['collection_patterns'].append(bias_pattern)
        
        return bias_info
    
    def apply_knowledge_decay(self, current_time: float) -> None:
        """Apply knowledge decay to remove old or unsuccessful techniques"""
        original_count = len(self.techniques)
        
        # Remove old techniques
        self.techniques = [
            tech for tech in self.techniques 
            if current_time - tech.last_used < self.max_technique_age
        ]
        
        # Remove unsuccessful techniques
        self.techniques = [
            tech for tech in self.techniques 
            if tech.success_rate >= self.min_success_rate
        ]
        
        # Remove rarely used techniques
        self.techniques = [
            tech for tech in self.techniques 
            if tech.usage_count >= self.usage_threshold or tech.fitness_score > 100.0
        ]
        
        removed_count = original_count - len(self.techniques)
        
        if removed_count > 0:
            logger.info(f"🧹 Applied knowledge decay: removed {removed_count} techniques, {len(self.techniques)} remaining")
        
        # Update statistics
        self.learning_statistics['average_success_rate'] = (
            sum(tech.success_rate for tech in self.techniques) / len(self.techniques)
            if self.techniques else 0.0
        )
    
    def get_library_statistics(self) -> Dict[str, Any]:
        """Get comprehensive library statistics"""
        return {
            'total_techniques': len(self.techniques),
            'learning_statistics': self.learning_statistics.copy(),
            'technique_categories': {
                'avoidance': len([t for t in self.techniques if 'avoid' in t.name.lower() or 'turn' in t.name.lower()]),
                'collection': len([t for t in self.techniques if 'collect' in t.name.lower() or 'scrap' in t.name.lower()]),
                'navigation': len([t for t in self.techniques if 'boost' in t.name.lower() or 'brake' in t.name.lower()]),
                'combat': len([t for t in self.techniques if 'fire' in t.name.lower()])
            },
            'average_fitness': sum(t.fitness_score for t in self.techniques) / len(self.techniques) if self.techniques else 0.0,
            'average_success_rate': sum(t.success_rate for t in self.techniques) / len(self.techniques) if self.techniques else 0.0,
            'most_used_techniques': sorted(self.techniques, key=lambda t: t.usage_count, reverse=True)[:5],
            'highest_fitness_techniques': sorted(self.techniques, key=lambda t: t.fitness_score, reverse=True)[:5]
        }
    
    def export_techniques_for_training(self) -> List[Dict[str, Any]]:
        """Export techniques in format suitable for training new AI"""
        training_data = []
        
        for technique in self.techniques:
            if technique.success_rate > 0.5 and technique.usage_count > 2:  # Only proven techniques
                training_example = {
                    'inputs': self._pattern_to_input_list(technique.input_pattern),
                    'target_outputs': self._pattern_to_output_list(technique.output_action),
                    'weight': technique.success_rate * technique.fitness_score,
                    'description': technique.description
                }
                training_data.append(training_example)
        
        return training_data
    
    def _pattern_to_input_list(self, pattern: Dict[str, Any]) -> List[float]:
        """Convert input pattern to input list format"""
        input_names = ['distance', 'angle', 'vx', 'vy', 'heading', 'scrap_distance']
        inputs = []
        
        for name in input_names:
            if name in pattern and 'avg' in pattern[name]:
                inputs.append(pattern[name]['avg'])
            else:
                inputs.append(0.0)  # Default value
        
        return inputs
    
    def _pattern_to_output_list(self, pattern: Dict[str, Any]) -> List[float]:
        """Convert output pattern to output list format"""
        output_names = ['thrust', 'rotation', 'fire_weapon']
        outputs = []
        
        for name in output_names:
            if name in pattern and 'avg' in pattern[name]:
                outputs.append(pattern[name]['avg'])
            else:
                outputs.append(0.0)  # Default value
        
        return outputs


# Factory function
def create_knowledge_library(library_path: str = "src/foundation/persistence/knowledge_library.json") -> KnowledgeLibrary:
    """Create knowledge library for epigenetic learning"""
    return KnowledgeLibrary(library_path)
