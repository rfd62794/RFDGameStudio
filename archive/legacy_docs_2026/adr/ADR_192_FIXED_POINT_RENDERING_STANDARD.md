> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 192: Fixed-Point Rendering Standard

## Status
**Active** - Sovereign Resolution Established

## Context
The DGT Platform has identified that Miyoo Mini hardware parity and Game Boy style aesthetics are not limitations but **systemic constraints** that create a "tactile crunchiness" essential to the simulation experience. Rather than building for a toy, we are creating a **High-Fidelity Simulation Engine** that uses these constraints to achieve deterministic behavior and focused player attention.

## Decision
Establish the **160×144 grid** as the **"Sovereign Resolution"** - a fixed-point rendering standard that ensures mathematical parity across all deployment targets while maintaining the tactile aesthetic.

## Technical Strategy

### Core Principle
> **All rendering strategies must output to a 160×144 logical buffer**

This creates a **"Fixed-Point Reality"** where:
- **Deterministic Behavior**: Same calculations on all platforms
- **Hardware Parity**: Miyoo Mini performance ensures desktop optimization
- **Visual Focus**: Limited resolution forces attention to physics and narrative
- **Systemic Consistency**: Mathematical identity across all tiers

### Constraint-Driven Engineering

| Constraint | Sovereign Reason | Engineering Impact |
|------------|------------------|-------------------|
| **Miyoo Mini** | 1.2GHz ARM parity forces clean code | Blazing performance on i9, optimized algorithms |
| **Game Boy Style** | 1-bit/2-bit logic reduces visual noise | Focus on Newtonian physics and narrative |
| **160×144 Grid** | Fixed-point reality ensures determinism | Mathematical parity across platforms |

### Implementation Architecture

#### 1. Sovereign Resolution Buffer
```python
@dataclass
class SovereignResolution:
    """Fixed-point rendering standard"""
    LOGICAL_WIDTH: int = 160
    LOGICAL_HEIGHT: int = 144
    TOTAL_PIXELS: int = 23040  # 160 * 144
    
    @classmethod
    def validate_buffer(cls, buffer: bytearray) -> Result[None]:
        """Validate buffer matches sovereign resolution"""
        expected_size = cls.TOTAL_PIXELS
        if len(buffer) != expected_size:
            return Result.failure_result(
                f"Buffer size {len(buffer)} != expected {expected_size}"
            )
        return Result.success_result(None)
```

#### 2. Physical Upscaling Layer
```python
class PhysicalUpscaler:
    """Handles physical display scaling while maintaining logical parity"""
    
    def __init__(self, scale_factor: int = 1):
        self.scale_factor = scale_factor
        self.physical_width = 160 * scale_factor
        self.physical_height = 144 * scale_factor
    
    def upscale_frame(self, logical_buffer: bytearray) -> Result[bytearray]:
        """Upscale logical buffer to physical dimensions"""
        # Implementation for integer scaling
        pass
    
    def get_physical_dimensions(self) -> Tuple[int, int]:
        """Get physical display dimensions"""
        return (self.physical_width, self.physical_height)
```

#### 3. Constraint Validation System
```python
class ConstraintValidator:
    """Validates rendering strategies against sovereign constraints"""
    
    @staticmethod
    def validate_resolution(buffer: bytearray) -> Result[None]:
        """Validate 160×144 resolution constraint"""
        return SovereignResolution.validate_buffer(buffer)
    
    @staticmethod
    def validate_color_depth(palette: List[Tuple[int, int, int]]) -> Result[None]:
        """Validate color depth constraint (max 4 colors)"""
        if len(palette) > 4:
            return Result.failure_result("Palette exceeds 4-color constraint")
        return Result.success_result(None)
    
    @staticmethod
    def validate_performance(profile: Dict[str, Any]) -> Result[None]:
        """Validate performance constraints"""
        if profile.get("target_fps", 0) > 60:
            return Result.failure_result("FPS exceeds 60fps constraint")
        return Result.success_result(None)
```

## Rendering Strategy Compliance

### Mandatory Interface
All rendering strategies must implement the fixed-point interface:

```python
class FixedPointRenderingStrategy(RenderingStrategy):
    """Base class for all rendering strategies with fixed-point compliance"""
    
    def render_to_sovereign_buffer(self, game_state: GameState) -> Result[bytearray]:
        """Render directly to 160×144 sovereign buffer"""
        buffer = bytearray(SovereignResolution.TOTAL_PIXELS)
        
        # Strategy-specific rendering logic
        result = self._render_logic(game_state, buffer)
        
        if not result.success:
            return result
        
        # Validate against sovereign constraints
        validation = ConstraintValidator.validate_resolution(buffer)
        if not validation.success:
            return validation
        
        return Result.success_result(buffer)
    
    @abstractmethod
    def _render_logic(self, game_state: GameState, buffer: bytearray) -> Result[None]:
        """Strategy-specific rendering implementation"""
        pass
```

### Strategy Compliance Matrix

| Strategy | Resolution | Color Depth | Performance | Status |
|-----------|------------|-------------|-------------|---------|
| **MiyooStrategy** | 160×144 | 4-color | 60fps | ✅ Compliant |
| **PhosphorStrategy** | 160×144 | 4-color | 30fps | ✅ Compliant |
| **GameBoyStrategy** | 160×144 | 4-color | 60fps | ✅ Compliant |
| **EnhancedStrategy** | 160×144 | 4-color | 60fps | ✅ Compliant |
| **HardwareBurnStrategy** | 160×144 | 4-color | 30fps | ✅ Compliant |

## Systemic Benefits

### 1. Deterministic Parity
```python
# Mathematical identity across platforms
def calculate_collision(position: Tuple[int, int]) -> bool:
    """Same calculation on Miyoo and Desktop"""
    grid_x, grid_y = position
    return grid_x < 160 and grid_y < 144 and GRID[grid_y][grid_x] == SOLID
```

### 2. Performance Optimization
- **Miyoo Constraint**: If it runs on 1.2GHz ARM, it's optimized everywhere
- **Fixed Memory**: 23,040 bytes = predictable memory usage
- **Deterministic Timing**: Fixed resolution = predictable frame times

### 3. Visual Focus
- **Reduced Noise**: Limited resolution forces attention to game mechanics
- **Tactile Feedback**: Pixel-level precision creates "crunchiness"
- **Narrative Emphasis**: Players focus on story, not graphics

## Implementation Details

### UnifiedPPU Integration
```python
class UnifiedPPU(BasePPU):
    """Enhanced with fixed-point rendering compliance"""
    
    def __init__(self, config: PPUConfig):
        super().__init__(config)
        self.sovereign_buffer = bytearray(SovereignResolution.TOTAL_PIXELS)
        self.physical_upscaler = PhysicalUpscaler(config.scale_factor or 1)
    
    def render_state(self, game_state: GameState) -> Result[bytes]:
        """Render with fixed-point compliance"""
        # Render to sovereign buffer
        render_result = self.current_strategy.render_to_sovereign_buffer(game_state)
        if not render_result.success:
            return render_result
        
        self.sovereign_buffer = render_result.value
        
        # Physical upscaling
        upscale_result = self.physical_upscaler.upscale_frame(self.sovereign_buffer)
        if not upscale_result.success:
            return upscale_result
        
        return Result.success_result(bytes(upscale_result.value))
```

### Constraint Validation Suite
```python
class ConstraintValidationSuite:
    """Comprehensive validation for sovereign constraints"""
    
    def __init__(self):
        self.validators = [
            ConstraintValidator.validate_resolution,
            ConstraintValidator.validate_color_depth,
            ConstraintValidator.validate_performance
        ]
    
    def validate_strategy(self, strategy: RenderingStrategy) -> Result[Dict[str, bool]]:
        """Validate strategy against all constraints"""
        results = {}
        
        for validator in self.validators:
            # Create test buffer for validation
            test_buffer = bytearray(SovereignResolution.TOTAL_PIXELS)
            
            # Test strategy rendering
            try:
                # Mock game state for testing
                mock_state = self._create_mock_game_state()
                render_result = strategy.render_to_sovereign_buffer(mock_state)
                
                if render_result.success:
                    # Validate against constraints
                    validation_result = validator(render_result.value)
                    results[validator.__name__] = validation_result.success
                else:
                    results[validator.__name__] = False
                    
            except Exception as e:
                results[validator.__name__] = False
        
        return Result.success_result(results)
    
    def _create_mock_game_state(self) -> GameState:
        """Create mock game state for validation"""
        # Implementation for mock state creation
        pass
```

## Quality Assurance

### Pre-Commit Integration
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate all rendering strategies against sovereign constraints
python scripts/validate_sovereign_constraints.py

if [ $? -ne 0 ]; then
    echo "❌ SOVEREIGN CONSTRAINT VIOLATION"
    echo "Rendering strategy must comply with 160×144 fixed-point standard"
    exit 1
fi
```

### Continuous Integration
```yaml
# .github/workflows/sovereign-constraints.yml
name: Sovereign Constraints Validation

on: [push, pull_request]

jobs:
  validate-constraints:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Fixed-Point Rendering
        run: python scripts/validate_sovereign_constraints.py
      - name: Validate Performance Parity
        run: python scripts/validate_performance_parity.py
```

## Future Considerations

### Scalability Within Constraints
- **Advanced Effects**: Maintain 160×144 while adding post-processing
- **Multi-Layer**: Composite multiple layers at fixed resolution
- **Animation**: Sprite animation within grid constraints

### Platform Expansion
- **New Devices**: Any platform must support 160×144 logical buffer
- **Display Adaptation**: Physical scaling handled per-device
- **Input Mapping**: All inputs mapped to grid coordinates

### Evolution Path
- **Constraint Relaxation**: Future ADRs can modify sovereign resolution
- **Backward Compatibility**: Changes must maintain mathematical parity
- **Performance Monitoring**: Track constraint impact on performance

---

## Consequences

### Positive
- **Deterministic Behavior**: Mathematical parity across all platforms
- **Performance Optimization**: Miyoo constraint ensures clean code
- **Visual Focus**: Limited resolution enhances gameplay focus
- **System Consistency**: Single rendering standard for all strategies

### Negative
- **Resolution Limitation**: Fixed to 160×144 logical grid
- **Visual Complexity**: Limited to 4-color palette
- **Development Constraint**: All rendering must work within constraints

### Mitigations
- **Physical Upscaling**: High-resolution displays supported through scaling
- **Advanced Effects**: Post-processing can enhance visual quality
- **Constraint Documentation**: Clear guidelines for developers

---

**Status**: Active Implementation  
**Phase**: 2 (Constraint Validation)  
**Next Review**: After PPU migration completion  
**Success Criteria**: All rendering strategies comply with 160×144 sovereign resolution
