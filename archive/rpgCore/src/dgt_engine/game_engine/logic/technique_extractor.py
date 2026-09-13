"""
Technique Extractor - Behavioral Fingerprinting for Knowledge Storage
Extracts successful maneuvers from neural network behavior for shared knowledge
"""

import json
import math
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from loguru import logger
from dgt_engine.foundation.types import Result

@dataclass
class TechniqueTemplate:
    """Represents a learned technique extracted from successful behavior"""
    id: str
    name: str
    description: str
    input_pattern: Dict[str, Any]  # Input state pattern
    output_action: Dict[str, Any]  # Output action pattern
    fitness_score: float
    usage_count: int
    success_rate: float
    last_used: float
    generation_created: int
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TechniqueTemplate':
        """Create from dictionary for JSON deserialization"""
        return cls(**data)


class TechniqueExtractor:
    """Extracts and manages learned techniques from AI behavior"""
    
    def __init__(self):
        self.techniques: List[TechniqueTemplate] = []
        self.extraction_buffer: List[Dict[str, Any]] = []
        self.min_frames_for_extraction = 60  # Minimum frames for technique extraction
        self.fitness_threshold = 50.0  # Minimum fitness for technique extraction
        
        # Pattern matching parameters
        self.input_similarity_threshold = 0.8  # How similar inputs must be
        self.output_consistency_threshold = 0.7  # How consistent outputs must be
        
        logger.info("🧠 TechniqueExtractor initialized for behavioral fingerprinting")
    
    def add_frame(self, timestamp: float, inputs: List[float], outputs: List[float], 
                  fitness: float, stress_level: float) -> None:
        """Add a frame to the extraction buffer"""
        frame_data = {
            'timestamp': timestamp,
            'inputs': inputs.copy(),
            'outputs': outputs.copy(),
            'fitness': fitness,
            'stress_level': stress_level
        }
        
        self.extraction_buffer.append(frame_data)
        
        # Keep buffer manageable
        if len(self.extraction_buffer) > 300:  # 5 seconds at 60fps
            self.extraction_buffer = self.extraction_buffer[-150:]
        
        # Check for extraction opportunities
        self._check_extraction_opportunity(timestamp)
    
    def _check_extraction_opportunity(self, current_time: float) -> None:
        """Check if current buffer contains extractable technique"""
        if len(self.extraction_buffer) < self.min_frames_for_extraction:
            return
        
        # Look for high-fitness, low-stress sequences
        recent_frames = self.extraction_buffer[-self.min_frames_for_extraction:]
        
        # Calculate average fitness and stress
        avg_fitness = sum(frame['fitness'] for frame in recent_frames) / len(recent_frames)
        avg_stress = sum(frame['stress_level'] for frame in recent_frames) / len(recent_frames)
        
        # Check if this is a successful maneuver
        if avg_fitness > self.fitness_threshold and avg_stress < 0.3:
            # Check for consistent behavior patterns
            if self._has_consistent_patterns(recent_frames):
                # Extract technique
                technique = self._extract_technique(recent_frames, current_time)
                if technique:
                    self._add_technique(technique)
    
    def _has_consistent_patterns(self, frames: List[Dict[str, Any]]) -> bool:
        """Check if frames show consistent input-output patterns"""
        if len(frames) < 10:
            return False
        
        # Analyze input patterns
        input_patterns = self._analyze_input_patterns(frames)
        output_patterns = self._analyze_output_patterns(frames)
        
        # Check for consistency
        input_consistency = self._calculate_consistency(input_patterns)
        output_consistency = self._calculate_consistency(output_patterns)
        
        return (input_consistency > self.input_similarity_threshold and 
                output_consistency > self.output_consistency_threshold)
    
    def _analyze_input_patterns(self, frames: List[Dict[str, Any]]) -> List[List[float]]:
        """Analyze patterns in input sequences"""
        patterns = []
        
        for frame in frames:
            patterns.append(frame['inputs'].copy())
        
        return patterns
    
    def _analyze_output_patterns(self, frames: List[Dict[str, Any]]) -> List[List[float]]:
        """Analyze patterns in output sequences"""
        patterns = []
        
        for frame in frames:
            patterns.append(frame['outputs'].copy())
        
        return patterns
    
    def _calculate_consistency(self, patterns: List[List[float]]) -> float:
        """Calculate consistency of patterns"""
        if len(patterns) < 2:
            return 1.0
        
        # Calculate average similarity between consecutive patterns
        similarities = []
        
        for i in range(len(patterns) - 1):
            similarity = self._calculate_pattern_similarity(patterns[i], patterns[i + 1])
            similarities.append(similarity)
        
        if not similarities:
            return 0.0
        
        return sum(similarities) / len(similarities)
    
    def _calculate_pattern_similarity(self, pattern1: List[float], pattern2: List[float]) -> float:
        """Calculate similarity between two patterns"""
        if len(pattern1) != len(pattern2):
            return 0.0
        
        # Calculate cosine similarity
        dot_product = sum(a * b for a, b in zip(pattern1, pattern2))
        magnitude1 = math.sqrt(sum(a * a for a in pattern1))
        magnitude2 = math.sqrt(sum(b * b for b in pattern2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    def _extract_technique(self, frames: List[Dict[str, Any]], timestamp: float) -> Optional[TechniqueTemplate]:
        """Extract technique from successful behavior sequence"""
        try:
            # Analyze the behavior pattern
            input_pattern = self._distill_input_pattern(frames)
            output_pattern = self._distill_output_pattern(frames)
            
            # Generate technique name based on behavior
            technique_name = self._generate_technique_name(input_pattern, output_pattern)
            
            # Create technique template
            technique = TechniqueTemplate(
                id=f"tech_{int(timestamp * 1000)}",
                name=technique_name,
                description=self._generate_description(input_pattern, output_pattern),
                input_pattern=input_pattern,
                output_action=output_pattern,
                fitness_score=sum(frame['fitness'] for frame in frames) / len(frames),
                usage_count=0,
                success_rate=1.0,
                last_used=timestamp,
                generation_created=0  # Would be set by evolution system
            )
            
            logger.debug(f"🎯 Extracted technique: {technique_name}")
            return technique
            
        except Exception as e:
            logger.error(f"Failed to extract technique: {e}")
            return None
    
    def _distill_input_pattern(self, frames: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Distill input pattern from frames"""
        # Calculate average input values
        avg_inputs = []
        
        for i in range(len(frames[0]['inputs'])):
            avg_value = sum(frame['inputs'][i] for frame in frames) / len(frames)
            avg_inputs.append(avg_value)
        
        # Identify significant inputs (those with high variance or extreme values)
        significant_inputs = {}
        
        for i, avg_value in enumerate(avg_inputs):
            variance = sum((frame['inputs'][i] - avg_value) ** 2 for frame in frames) / len(frames)
            
            # Mark as significant if variance is high or value is extreme
            if variance > 0.1 or abs(avg_value) > 0.7:
                input_names = ['distance', 'angle', 'vx', 'vy', 'heading', 'scrap_distance']
                if i < len(input_names):
                    significant_inputs[input_names[i]] = {
                        'avg': avg_value,
                        'variance': variance,
                        'min': min(frame['inputs'][i] for frame in frames),
                        'max': max(frame['inputs'][i] for frame in frames),
                        'significant': True
                    }
        
        return significant_inputs
    
    def _distill_output_pattern(self, frames: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Distill output action pattern from frames"""
        # Calculate average output values
        avg_outputs = []
        
        for i in range(len(frames[0]['outputs'])):
            avg_value = sum(frame['outputs'][i] for frame in frames) / len(frames)
            avg_outputs.append(avg_value)
        
        # Identify significant outputs
        significant_outputs = {}
        output_names = ['thrust', 'rotation', 'fire_weapon']
        
        for i, avg_value in enumerate(avg_outputs):
            variance = sum((frame['outputs'][i] - avg_value) ** 2 for frame in frames) / len(frames)
            
            # Mark as significant if variance is low (consistent) or value is extreme
            if variance < 0.1 or abs(avg_value) > 0.5:
                significant_outputs[output_names[i]] = {
                    'avg': avg_value,
                    'consistency': 1.0 - variance,  # Lower variance = higher consistency
                    'min': min(frame['outputs'][i] for frame in frames),
                    'max': max(frame['outputs'][i] for frame in frames),
                    'significant': True
                }
        
        return significant_outputs
    
    def _generate_technique_name(self, input_pattern: Dict[str, Any], output_pattern: Dict[str, Any]) -> str:
        """Generate descriptive name for technique"""
        name_parts = []
        
        # Analyze input conditions
        if 'distance' in input_pattern:
            distance = input_pattern['distance']['avg']
            if distance < 0.3:
                name_parts.append("Close")
            elif distance > 0.7:
                name_parts.append("Far")
        
        if 'angle' in input_pattern:
            angle = input_pattern['angle']['avg']
            if abs(angle) > 0.7:
                name_parts.append("Behind")
            elif abs(angle) < 0.3:
                name_parts.append("Ahead")
        
        if 'scrap_distance' in input_pattern and input_pattern['scrap_distance']['avg'] < 0.5:
            name_parts.append("Scrap")
        
        # Analyze output actions
        if 'thrust' in output_pattern:
            thrust = output_pattern['thrust']['avg']
            if thrust > 0.5:
                name_parts.append("Boost")
            elif thrust < -0.5:
                name_parts.append("Brake")
        
        if 'rotation' in output_pattern:
            rotation = output_pattern['rotation']['avg']
            if rotation > 0.5:
                name_parts.append("TurnRight")
            elif rotation < -0.5:
                name_parts.append("TurnLeft")
        
        if 'fire_weapon' in output_pattern and output_pattern['fire_weapon']['avg'] > 0.5:
            name_parts.append("Fire")
        
        # Combine name parts
        if name_parts:
            return " ".join(name_parts)
        else:
            return "Unknown Technique"
    
    def _generate_description(self, input_pattern: Dict[str, Any], output_pattern: Dict[str, Any]) -> str:
        """Generate description of technique"""
        description_parts = []
        
        # Input description
        if input_pattern:
            if 'distance' in input_pattern:
                distance = input_pattern['distance']['avg']
                if distance < 0.3:
                    description_parts.append("Close range maneuver")
                elif distance > 0.7:
                    description_parts.append("Long range approach")
            
            if 'angle' in input_pattern:
                angle = input_pattern['angle']['avg']
                if abs(angle) > 0.7:
                    description_parts.append("Target behind")
                elif abs(angle) < 0.3:
                    description_parts.append("Target ahead")
        
        # Output description
        if output_pattern:
            if 'thrust' in output_pattern:
                thrust = output_pattern['thrust']['avg']
                if thrust > 0.5:
                    description_parts.append("Aggressive thrust")
                elif thrust < -0.5:
                    description_parts.append("Reverse thrust")
            
            if 'rotation' in output_pattern:
                rotation = output_pattern['rotation']['avg']
                if abs(rotation) > 0.5:
                    description_parts.append("Sharp turn")
            
            if 'fire_weapon' in output_pattern and output_pattern['fire_weapon']['avg'] > 0.5:
                description_parts.append("Weapon fire")
        
        return " | ".join(description_parts) if description_parts else "Unknown maneuver"
    
    def _add_technique(self, technique: TechniqueTemplate) -> None:
        """Add technique to library"""
        # Check for similar existing techniques
        similar_technique = self._find_similar_technique(technique)
        
        if similar_technique:
            # Merge with existing technique (improve with new data)
            self._merge_techniques(similar_technique, technique)
        else:
            # Add new technique
            self.techniques.append(technique)
        
        logger.info(f"📚 Added technique to library: {technique.name}")
    
    def _find_similar_technique(self, technique: TechniqueTemplate) -> Optional[TechniqueTemplate]:
        """Find similar existing technique"""
        for existing in self.techniques:
            similarity = self._calculate_technique_similarity(technique, existing)
            if similarity > 0.8:  # High similarity threshold
                return existing
        return None
    
    def _calculate_technique_similarity(self, technique1: TechniqueTemplate, technique2: TechniqueTemplate) -> float:
        """Calculate similarity between two techniques"""
        # Compare input patterns
        input_similarity = self._calculate_pattern_dict_similarity(
            technique1.input_pattern, technique2.input_pattern
        )
        
        # Compare output patterns
        output_similarity = self._calculate_pattern_dict_similarity(
            technique1.output_action, technique2.output_action
        )
        
        return (input_similarity + output_similarity) / 2.0
    
    def _calculate_pattern_dict_similarity(self, pattern1: Dict[str, Any], pattern2: Dict[str, Any]) -> float:
        """Calculate similarity between two pattern dictionaries"""
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
                # Recursively compare nested dictionaries
                similarity = self._calculate_pattern_dict_similarity(val1, val2)
                similarities.append(similarity)
            else:
                # Compare scalar values
                if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                    similarity = 1.0 - min(abs(val1 - val2), 1.0)
                    similarities.append(similarity)
                elif hasattr(val1, '__contains__') and 'avg' in val1 and hasattr(val2, '__contains__') and 'avg' in val2:
                    similarity = 1.0 - abs(val1['avg'] - val2['avg'])  # Inverse difference
                    similarities.append(max(0.0, similarity))
        
        if not similarities:
            return 0.0
        
        return sum(similarities) / len(similarities)
    
    def _merge_techniques(self, existing: TechniqueTemplate, new: TechniqueTemplate) -> None:
        """Merge new technique data into existing technique"""
        # Update usage count and success rate
        existing.usage_count += 1
        existing.last_used = new.last_used
        
        # Weighted average of fitness scores
        total_usage = existing.usage_count + 1
        existing.fitness_score = (existing.fitness_score * (existing.usage_count) + new.fitness_score) / total_usage
        
        # Update success rate (weighted)
        existing.success_rate = (existing.success_rate * existing.usage_count + new.success_rate) / total_usage
        
        logger.debug(f"🔄 Merged technique: {existing.name}")
    
    def get_techniques(self) -> List[TechniqueTemplate]:
        """Get all techniques"""
        return self.techniques.copy()
    
    def get_technique_for_situation(self, current_inputs: List[float]) -> Optional[TechniqueTemplate]:
        """Get best matching technique for current situation"""
        best_technique = None
        best_score = 0.0
        
        for technique in self.techniques:
            score = self._calculate_technique_match_score(technique, current_inputs)
            if score > best_score and score > 0.5:  # Minimum threshold
                best_technique = technique
                best_score = score
        
        if best_technique:
            best_technique.usage_count += 1
            best_technique.last_used = self.game_time if hasattr(self, 'game_time') else 0.0
        
        return best_technique
    
    def _calculate_technique_match_score(self, technique: TechniqueTemplate, current_inputs: List[float]) -> float:
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
        return self._calculate_pattern_dict_similarity(technique.input_pattern, current_dict)
    
    def save_to_file(self, filename: str) -> Result[bool]:
        """Save techniques to JSON file"""
        try:
            techniques_data = [technique.to_dict() for technique in self.techniques]
            
            with open(filename, 'w') as f:
                json.dump(techniques_data, f, indent=2)
            
            logger.info(f"💾 Saved {len(self.techniques)} techniques to {filename}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to save techniques: {e}")
    
    def load_from_file(self, filename: str) -> Result[bool]:
        """Load techniques from JSON file"""
        try:
            with open(filename, 'r') as f:
                techniques_data = json.load(f)
            
            self.techniques = [TechniqueTemplate.from_dict(data) for data in techniques_data]
            
            logger.info(f"📖 Loaded {len(self.techniques)} techniques from {filename}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to load techniques: {e}")
    
    def cleanup_old_techniques(self, max_age: float = 300.0) -> None:
        """Remove old or unused techniques"""
        current_time = self.game_time if hasattr(self, 'game_time') else 0.0
        
        # Remove techniques that haven't been used recently
        self.techniques = [
            tech for tech in self.techniques 
            if current_time - tech.last_used < max_age
        ]
        
        # Remove techniques with low success rates
        self.techniques = [
            tech for tech in self.techniques 
            if tech.success_rate > 0.3
        ]
        
        logger.info(f"🧹 Cleaned old techniques. Remaining: {len(self.techniques)}")


# Factory function
def create_technique_extractor() -> TechniqueExtractor:
    """Create technique extractor for behavioral fingerprinting"""
    return TechniqueExtractor()
