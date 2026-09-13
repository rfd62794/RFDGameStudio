# Font Directory Structure
## Sovereign Scout Font Management System

### **🎯 Directory Overview**

The Sovereign Scout system uses a structured font directory to support the Phosphor Terminal and bitmap rendering requirements.

```
assets/fonts/
├── public_pixel/           # Public domain pixel fonts
│   ├── README.md           # Font licensing and usage
│   ├── 8x8_basic/          # 8x8 pixel fonts for terminal
│   ├── 16x16_enhanced/     # 16x16 enhanced fonts for UI
│   └── special/            # Specialized fonts for effects
├── proprietary/            # Custom fonts (if any)
└── generated/              # Procedurally generated fonts
```

### **📟 Public Pixel Fonts**

**Source**: `C:\Users\cheat\Downloads\Public_Pixel_Font_1_24`

**Integration**: Fonts from this directory are copied to `assets/fonts/public_pixel/` for project integration.

**Usage**:
- **8x8 fonts**: Primary terminal display (80x24 character grid)
- **16x16 fonts**: Enhanced UI elements and larger displays
- **Special fonts**: Effects, symbols, and decorative elements

### **🔧 Font Configuration**

**Phosphor Terminal Font Mapping**:
```python
FONT_CONFIG = {
    'terminal_8x8': {
        'path': 'assets/fonts/public_pixel/8x8_basic/',
        'char_width': 8,
        'char_height': 16,  # Scaled for readability
        'file_format': 'png',
        'encoding': 'ascii'
    },
    'ui_16x16': {
        'path': 'assets/fonts/public_pixel/16x16_enhanced/',
        'char_width': 16,
        'char_height': 16,
        'file_format': 'png',
        'encoding': 'ascii'
    }
}
```

### **📋 Font Requirements**

**Terminal Fonts**:
- **Format**: PNG sprite sheets
- **Size**: 8x8 pixels per character
- **Characters**: Full ASCII (32-126)
- **Style**: Monospace, high-contrast
- **Effects**: Phosphor glow compatible

**UI Fonts**:
- **Format**: PNG sprite sheets
- **Size**: 16x16 pixels per character
- **Characters**: Extended ASCII + symbols
- **Style**: Clean, readable
- **Effects**: Energy-state compatible

### **🎨 Font Effects Integration**

**Phosphor Glow**:
- Fonts designed for phosphor rendering
- High contrast for CRT effects
- Compatible with color bleed simulation

**Energy Coupling**:
- Fonts support color shifting
- Brownout effects applied at font level
- Flicker compatible rendering

**Scanline Compatibility**:
- Designed to work with scanline overlay
- Maintains readability with scanlines
- Optimized for retro CRT aesthetic

### **📁 Font File Organization**

**8x8 Basic Fonts**:
```
assets/fonts/public_pixel/8x8_basic/
├── terminal_green.png      # Standard terminal green
├── terminal_amber.png      # Brownout amber
├── terminal_red.png        # Critical red
└── font_atlas.json         # Character mapping data
```

**16x16 Enhanced Fonts**:
```
assets/fonts/public_pixel/16x16_enhanced/
├── ui_normal.png           # Standard UI
├── ui_energy_low.png       # Low energy state
├── ui_critical.png        # Critical energy
└── ui_atlas.json          # Extended character mapping
```

### **🔧 Font Loading System**

**Font Manager**:
```python
class FontManager:
    def __init__(self):
        self.fonts = {}
        self.current_font = None
    
    def load_font(self, font_name: str, config: dict):
        """Load font from sprite sheet"""
        # Implementation for loading PNG sprite sheets
        pass
    
    def get_char_glyph(self, char: str, energy_state: float = 100.0):
        """Get character glyph based on energy state"""
        # Implementation for energy-based font selection
        pass
```

### **📋 Integration Status**

**Current State**: ✅ Directory structure created
**Next Steps**: 
- Copy fonts from `C:\Users\cheat\Downloads\Public_Pixel_Font_1_24`
- Implement font loading system
- Integrate with Phosphor Terminal
- Add energy-based font switching

### **🎯 Usage Examples**

**Terminal Display**:
```python
# Load 8x8 terminal font
font_manager.load_font('terminal_8x8', FONT_CONFIG['terminal_8x8'])

# Render character with phosphor effect
glyph = font_manager.get_char_glyph('A', energy_level=85.0)
terminal.render_glyph(x, y, glyph)
```

**Energy-Based Switching**:
```python
# Automatically switch font based on energy
if energy < 25:
    font_manager.switch_font('terminal_red')
elif energy < 50:
    font_manager.switch_font('terminal_amber')
else:
    font_manager.switch_font('terminal_green')
```

---

## **🚀 Next Actions**

1. **Font Import**: Copy fonts from Public_Pixel_Font_1_24
2. **Sprite Sheet Creation**: Generate PNG sprite sheets
3. **Font Atlas**: Create character mapping files
4. **Integration**: Implement font loading in Phosphor Terminal
5. **Testing**: Verify font rendering with CRT effects

---

**Status**: ✅ Directory structure established  
**Ready for**: Font import and integration
