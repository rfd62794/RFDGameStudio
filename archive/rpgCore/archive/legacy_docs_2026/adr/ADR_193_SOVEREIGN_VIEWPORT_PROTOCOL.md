> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 193: Sovereign Viewport Protocol

## Status
**Proposed** - Context-Aware Scaling Architecture

## Context
The DGT Platform needs to bridge the gap between handheld (Miyoo Mini) and desktop (PC) deployments while maintaining the 160×144 sovereign resolution standard. The challenge is to provide a premium PC experience with multiple information displays while preserving tactical focus on handheld devices.

## Decision
Implement a **Container-Aware Viewport Manager** that uses **Normalized Coordinate System** with **Integer Scaling** for the sovereign PPU and **Flexible Scaling** for sidecar components.

## Technical Architecture

### Core Principle
> **The 160×144 PPU is the "Master Tile" in a virtual grid system**

The system treats the game as a grid of tiles rather than a single window, enabling responsive layout adaptation across different screen sizes.

### Standard Scale Mapping

| Target Output | Layout Mode | PPU Scale | Sidecar Status | Total Resolution |
|---------------|-------------|-----------|----------------|-----------------|
| **Miyoo** (320×240) | Focus | 1x (with padding) | Hidden (Hotkey toggle) | 320×240 |
| **HD** (1280×720) | Dashboard | 4x (640×576) | Thin Wings (320px total) | 1280×720 |
| **FHD** (1920×1080) | MFD | 7.5x (1200×1080) | Standard Wings (720px total) | 1920×1080 |
| **QHD** (2560×1440) | Sovereign | 9x (1440×1296) | Ultra-Wide Wings (1120px total) | 2560×1440 |

### System Components

#### 1. Normalized Coordinate System
```python
@dataclass
class ViewportConfig:
    """Configuration for viewport layout and scaling"""
    
    # Window dimensions
    window_width: int
    window_height: int
    
    # Layout regions
    center_region: Rectangle
    left_wing: Rectangle
    right_wing: Rectangle
    
    # Scaling factors
    ppu_scale: int  # Integer scaling for sovereign PPU
    wing_scale: float  # Flexible scaling for sidecars
    
    # Layout mode
    layout_mode: ViewportLayoutMode
    
    # Responsive behavior
    focus_mode: bool = False  # Small screen overlay mode

class ViewportLayoutMode(Enum):
    """Viewport layout modes"""
    FOCUS = "focus"          # Center only (handheld)
    DASHBOARD = "dashboard"  # HD display
    MFD = "mfd"             # Full HD display
    SOVEREIGN = "sovereign"  # Ultra-wide display
```

#### 2. Container-Aware Viewport Manager
```python
class ViewportManager:
    """Manages responsive viewport scaling and layout"""
    
    def __init__(self):
        self.config: Optional[ViewportConfig] = None
        self.scale_buckets = self._define_scale_buckets()
        
    def calculate_optimal_layout(self, window_width: int, window_height: int) -> ViewportConfig:
        """Calculate optimal layout for given window dimensions"""
        
        # Determine layout mode based on resolution
        layout_mode = self._determine_layout_mode(window_width, window_height)
        
        if layout_mode == ViewportLayoutMode.FOCUS:
            return self._create_focus_layout(window_width, window_height)
        else:
            return self._create_multi_panel_layout(window_width, window_height, layout_mode)
    
    def _create_multi_panel_layout(self, width: int, height: int, mode: ViewportLayoutMode) -> ViewportConfig:
        """Create multi-panel layout with wings"""
        
        # Calculate PPU scale (largest integer that fits height)
        ppu_scale = height // SOVEREIGN_HEIGHT
        
        # Calculate center region size
        center_width = SOVEREIGN_WIDTH * ppu_scale
        center_height = SOVEREIGN_HEIGHT * ppu_scale
        
        # Calculate remaining width for wings
        remaining_width = width - center_width
        wing_width = remaining_width // 2
        
        # Center the PPU
        center_x = (width - center_width) // 2
        center_y = (height - center_height) // 2
        
        return ViewportConfig(
            window_width=width,
            window_height=height,
            center_region=Rectangle(center_x, center_y, center_width, center_height),
            left_wing=Rectangle(0, 0, wing_width, height),
            right_wing=Rectangle(width - wing_width, 0, wing_width, height),
            ppu_scale=ppu_scale,
            wing_scale=1.0,
            layout_mode=mode
        )
```

#### 3. Z-Layering for Small Screens
```python
class OverlayManager:
    """Manages Z-layered overlays for small screen focus mode"""
    
    def __init__(self):
        self.overlays: Dict[str, OverlayComponent] = {}
        self.active_overlay: Optional[str] = None
        
    def create_overlay(self, name: str, component: UIComponent) -> OverlayComponent:
        """Create overlay component with transparency"""
        return OverlayComponent(
            name=name,
            component=component,
            alpha=0.8,  # Semi-transparent
            z_index=1000,
            slide_animation=True
        )
    
    def toggle_overlay(self, overlay_name: str) -> None:
        """Toggle overlay visibility with slide animation"""
        if self.active_overlay == overlay_name:
            self._slide_out(overlay_name)
            self.active_overlay = None
        else:
            if self.active_overlay:
                self._slide_out(self.active_overlay)
            self._slide_in(overlay_name)
            self.active_overlay = overlay_name
```

### Responsive Layout Logic

#### Integer Scaling for Sovereign PPU
```python
def calculate_ppu_scale(self, window_height: int) -> int:
    """Calculate largest integer scale that fits in window height"""
    return max(1, window_height // SOVEREIGN_HEIGHT)

def validate_ppu_scaling(self, scale: int) -> bool:
    """Validate that PPU scaling maintains pixel-perfect rendering"""
    return scale >= 1 and scale <= 16  # Reasonable scaling limits
```

#### Wing Expansion Algorithm
```python
def calculate_wing_dimensions(self, window_width: int, center_width: int) -> Tuple[int, int]:
    """Calculate wing dimensions to fill remaining space"""
    remaining_width = window_width - center_width
    wing_width = remaining_width // 2
    
    # Ensure minimum wing width for usability
    min_wing_width = 200
    if wing_width < min_wing_width:
        wing_width = min_wing_width
    
    return wing_width, window_height
```

### Small Screen Exception Handling

#### Focus Mode Detection
```python
def should_use_focus_mode(self, width: int, height: int) -> bool:
    """Determine if focus mode should be used"""
    # Small screen threshold
    return width < 640 or height < 480

def create_focus_layout(self, width: int, height: int) -> ViewportConfig:
    """Create focus layout for small screens"""
    
    # Scale PPU to fit screen
    ppu_scale = min(width // SOVEREIGN_WIDTH, height // SOVEREIGN_HEIGHT)
    
    # Center the PPU
    center_width = SOVEREIGN_WIDTH * ppu_scale
    center_height = SOVEREIGN_HEIGHT * ppu_scale
    center_x = (width - center_width) // 2
    center_y = (height - center_height) // 2
    
    return ViewportConfig(
        window_width=width,
        window_height=height,
        center_region=Rectangle(center_x, center_y, center_width, center_height),
        left_wing=Rectangle(0, 0, 0, 0),  # Hidden
        right_wing=Rectangle(0, 0, 0, 0),  # Hidden
        ppu_scale=ppu_scale,
        wing_scale=1.0,
        layout_mode=ViewportLayoutMode.FOCUS,
        focus_mode=True
    )
```

## Implementation Details

### Kernel Integration
```python
# src/dgt_core/kernel/models.py
@dataclass
class ViewportLayout:
    """Viewport layout configuration in kernel"""
    
    # Layout regions
    center_anchor: Point
    left_wing: Rectangle
    right_wing: Rectangle
    
    # Scaling configuration
    ppu_scale: int
    wing_scale: float
    
    # Layout mode
    mode: ViewportLayoutMode
    
    # Responsive settings
    focus_mode: bool
    overlay_alpha: float = 0.8
    
    def validate(self) -> Result[None]:
        """Validate layout configuration"""
        if self.ppu_scale < 1:
            return Result.failure_result("PPU scale must be >= 1")
        
        if self.mode == ViewportLayoutMode.FOCUS and not self.focus_mode:
            return Result.failure_result("Focus mode required for FOCUS layout")
        
        return Result.success_result(None)
```

### UnifiedPPU Integration
```python
class UnifiedPPU(BasePPU):
    """Enhanced with viewport management"""
    
    def __init__(self, config: Optional[PPUConfig] = None):
        super().__init__(config)
        self.viewport_manager = ViewportManager()
        self.overlay_manager = OverlayManager()
        
    def render_with_viewport(self, game_state: GameState, window_width: int, window_height: int) -> Result[bytes]:
        """Render with viewport-aware scaling"""
        
        # Calculate optimal layout
        viewport_config = self.viewport_manager.calculate_optimal_layout(window_width, window_height)
        
        # Render sovereign PPU at calculated scale
        ppu_result = self._render_scaled_ppu(viewport_config.ppu_scale)
        if not ppu_result.success:
            return ppu_result
        
        # Render wings if not in focus mode
        if not viewport_config.focus_mode:
            wing_result = self._render_wings(viewport_config)
            if not wing_result.success:
                return wing_result
        
        # Composite final frame
        return self._composite_viewport_frame(viewport_config)
```

### Component Integration
```python
# PhosphorTerminal integration
class PhosphorTerminal:
    """Terminal with viewport-aware rendering"""
    
    def render_to_wing(self, wing_region: Rectangle, scale: float) -> Result[bytes]:
        """Render terminal to wing region"""
        # Scale terminal content to wing dimensions
        scaled_width = int(wing_region.width / scale)
        scaled_height = int(wing_region.height / scale)
        
        # Render at scaled resolution
        return self._render_scaled(scaled_width, scaled_height)

# GlassCockpit integration  
class GlassCockpit:
    """Cockpit with viewport-aware rendering"""
    
    def render_to_wing(self, wing_region: Rectangle, scale: float) -> Result[bytes]:
        """Render cockpit to wing region"""
        # Similar scaling logic for cockpit components
        pass
```

## Quality Assurance

### Validation Suite
```python
class ViewportValidationSuite:
    """Validates viewport scaling and layout compliance"""
    
    def validate_scaling_consistency(self) -> Result[Dict[str, bool]]:
        """Validate scaling consistency across resolutions"""
        test_resolutions = [
            (320, 240),   # Miyoo
            (1280, 720),  # HD
            (1920, 1080), # FHD
            (2560, 1440)  # QHD
        ]
        
        results = {}
        
        for width, height in test_resolutions:
            viewport_config = self.viewport_manager.calculate_optimal_layout(width, height)
            
            # Validate PPU scaling
            ppu_scale_valid = viewport_config.ppu_scale >= 1
            ppu_fits_height = (SOVEREIGN_HEIGHT * viewport_config.ppu_scale) <= height
            
            # Validate layout integrity
            total_width = viewport_config.center_region.width + \
                          viewport_config.left_wing.width + \
                          viewport_config.right_wing.width
            
            layout_valid = total_width <= width
            
            results[f"{width}x{height}"] = {
                "ppu_scale_valid": ppu_scale_valid,
                "ppu_fits_height": ppu_fits_height,
                "layout_valid": layout_valid,
                "compliant": ppu_scale_valid and ppu_fits_height and layout_valid
            }
        
        return Result.success_result(results)
```

## Performance Considerations

### Scaling Performance
- **Integer PPU Scaling**: Pixel-perfect, no interpolation artifacts
- **Wing Scaling**: Flexible scaling with smooth interpolation
- **Layout Calculation**: O(1) computational complexity
- **Memory Usage**: Fixed PPU buffer + dynamic wing buffers

### Responsive Performance
- **Layout Recalculation**: Only on window resize events
- **Wing Rendering**: Independent of PPU rendering thread
- **Overlay Animation**: GPU-accelerated transitions
- **Frame Composition**: Efficient buffer blitting

## Future Considerations

### Ultra-Wide Support
- **21:9 Displays**: Extended wing configurations
- **Multi-Monitor**: Cross-display viewport management
- **Dynamic Layouts**: User-configurable region arrangements

### Mobile Optimization
- **Touch Controls**: Overlay management for touch interfaces
- **Battery Life**: Reduced rendering in focus mode
- **Orientation**: Portrait/landscape adaptation

---

## Consequences

### Positive
- **Cross-Platform Consistency**: Sovereign PPU maintains 160×144 everywhere
- **Premium PC Experience**: Multi-panel layouts for large screens
- **Handheld Optimization**: Focus mode with overlays for small screens
- **Professional Appearance**: Data-rich environment on desktop

### Negative
- **Layout Complexity**: Additional viewport management overhead
- **Testing Complexity**: Multiple resolution combinations to validate
- **Memory Usage**: Additional buffers for wing rendering

### Mitigations
- **Modular Design**: Viewport manager isolated from core PPU logic
- **Automated Testing**: Comprehensive validation suite
- **Memory Management**: Dynamic buffer allocation and cleanup

---

**Status**: Proposed Implementation  
**Phase**: 3 (Viewport Management)  
**Next Review**: After PPU consolidation completion  
**Success Criteria**: Responsive scaling across all target resolutions
