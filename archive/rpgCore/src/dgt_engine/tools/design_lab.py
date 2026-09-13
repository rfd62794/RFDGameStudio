"""
DGT Design Lab - Asset Design & Pre-Bake Tool
ADR 088: The Pre-Bake Design Protocol

A Tkinter-based editor with sliders for Material colors and pattern selection.
Allows real-time preview and export to YAML.
"""

import tkinter as tk
from tkinter import ttk, colorchooser, messagebox, filedialog
import yaml
import json
from pathlib import Path
import sys
import os
from typing import Dict, List, Optional, Protocol
from dataclasses import dataclass
from abc import ABC, abstractmethod
from loguru import logger
from pydantic import BaseModel, Field, field_validator

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Domain Models
class Color(BaseModel):
    """Color representation with validation"""
    hex_value: str = Field(pattern=r'^#[0-9A-Fa-f]{6}$')
    
    @field_validator('hex_value')
    @classmethod
    def validate_hex(cls, v):
        if not v.startswith('#') or len(v) != 7:
            raise ValueError('Color must be in hex format #RRGGBB')
        return v

class DitherPattern(BaseModel):
    """Dither pattern configuration"""
    name: str
    intensity: float = Field(ge=0.0, le=1.0)
    pattern_type: str

class AssetTemplate(BaseModel):
    """Asset template configuration"""
    name: str
    description: str
    base_color: Color
    pattern: DitherPattern
    animation_frames: int = Field(ge=1, le=4)
    frame_duration: int = Field(ge=0)
    use_case: List[str]
    sonic_field_compatible: bool = False

# Abstract Interfaces
class DitheringEngine(ABC):
    """Abstract dithering engine interface"""
    
    @abstractmethod
    def get_pattern_list(self) -> List[str]:
        """Get available pattern names"""
        pass
    
    @abstractmethod
    def apply_dither(self, color: str, pattern: str) -> List[List[str]]:
        """Apply dither pattern to color"""
        pass

class TemplateGenerator(ABC):
    """Abstract template generator interface"""
    
    @abstractmethod
    def generate_template(self, template_type: str, color: str) -> List[List[str]]:
        """Generate template pattern"""
        pass

class AssetExporter(ABC):
    """Abstract asset exporter interface"""
    
    @abstractmethod
    def export(self, data: Dict, path: Path) -> bool:
        """Export data to file"""
        pass

# Concrete Implementations
class YAMLExporter(AssetExporter):
    """YAML file exporter"""
    
    def export(self, data: Dict, path: Path) -> bool:
        try:
            with open(path, 'w') as f:
                yaml.dump(data, f, default_flow_style=False)
            logger.info(f"Exported to {path}")
            return True
        except Exception as e:
            logger.error(f"Export failed: {e}")
            return False

class AssetValidator:
    """Asset data validator"""
    
    @staticmethod
    def validate_template(template_data: Dict) -> Optional[AssetTemplate]:
        """Validate and parse template data"""
        try:
            return AssetTemplate(**template_data)
        except Exception as e:
            logger.warning(f"Template validation failed: {e}")
            return None

# Try direct imports first
try:
    from tools.dithering_engine import DitheringEngine as ConcreteDitheringEngine, TemplateGenerator as ConcreteTemplateGenerator
except ImportError:
    from dithering_engine import DitheringEngine as ConcreteDitheringEngine, TemplateGenerator as ConcreteTemplateGenerator

try:
    from assets.parser import AssetParser
except ImportError:
    logger.warning("AssetParser not available, using fallback")
    # Create a simple fallback for testing
    class AssetParser:
        def __init__(self, path: Path):
            self.path = path
        def load_all_assets(self) -> Dict:
            return {'templates': {}, 'materials': {}, 'objects': {}}

try:
    from assets.fabricator_tkinter import AssetFabricator
except ImportError:
    logger.warning("AssetFabricator not available, using fallback")
    # Create a simple fallback for testing
    class AssetFabricator:
        def __init__(self):
            self.registry = {}
        def generate_all_sprites(self, data: Dict) -> Dict:
            return {}

try:
    from assets.registry import AssetRegistry
except ImportError:
    logger.warning("AssetRegistry not available, using fallback")
    # Create a simple fallback for testing
    class AssetRegistry:
        def __init__(self):
            self.objects = {}
            self.materials = {}
            self.animations = {}
            self.entities = {}
            self.sprites = {}
        def load_from_parsed_data(self, data: Dict, sprites: Dict) -> None:
            pass
        def get_all_objects(self) -> Dict:
            return {}
        def get_registry_stats(self) -> Dict:
            return {'objects': 0, 'materials': 0, 'animations': 0, 'entities': 0, 'sprites': 0}

class AssetDesignController:
    """Controller for asset design operations"""
    
    def __init__(self, 
                 dithering_engine: DitheringEngine,
                 template_generator: TemplateGenerator,
                 exporter: AssetExporter,
                 validator: AssetValidator):
        self.dithering_engine = dithering_engine
        self.template_generator = template_generator
        self.exporter = exporter
        self.validator = validator
        
        # Design state
        self.material_designs: Dict[str, AssetTemplate] = {}
        self.template_designs: Dict[str, AssetTemplate] = {}
        
        logger.info("AssetDesignController initialized")
    
    def create_material_design(self, 
                              name: str, 
                              material: str, 
                              color: str, 
                              pattern: str, 
                              intensity: float) -> Optional[AssetTemplate]:
        """Create a new material design"""
        try:
            color_obj = Color(hex_value=color)
            pattern_obj = DitherPattern(name=pattern, intensity=intensity, pattern_type=pattern)
            
            template = AssetTemplate(
                name=name,
                description=f"{material} material with {pattern} pattern",
                base_color=color_obj,
                pattern=pattern_obj,
                animation_frames=1,
                frame_duration=0,
                use_case=[material],
                sonic_field_compatible=material in ['organic', 'water']
            )
            
            self.material_designs[name] = template
            logger.info(f"Created material design: {name}")
            return template
            
        except Exception as e:
            logger.error(f"Failed to create material design: {e}")
            return None
    
    def export_designs(self, export_path: Path) -> bool:
        """Export all designs to file"""
        export_data = {
            'material_designs': [design.model_dump() for design in self.material_designs.values()],
            'template_designs': [design.model_dump() for design in self.template_designs.values()],
            'export_metadata': {
                'total_materials': len(self.material_designs),
                'total_templates': len(self.template_designs),
                'exported_at': str(Path.cwd())
            }
        }
        
        return self.exporter.export(export_data, export_path)

class DGTDesignLab:
    """DGT Design Lab - Asset Design & Pre-Bake Tool"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🎨 DGT Design Lab - Asset Design & Pre-Bake Tool")
        self.root.geometry("1200x800")
        
        # Initialize components with dependency injection
        self.dithering_engine = ConcreteDitheringEngine()
        self.template_generator = ConcreteTemplateGenerator(self.dithering_engine)
        self.exporter = YAMLExporter()
        self.validator = AssetValidator()
        
        # Initialize controller
        self.controller = AssetDesignController(
            self.dithering_engine,
            self.template_generator,
            self.exporter,
            self.validator
        )
        
        # Legacy components for compatibility
        self.fabricator = AssetFabricator()
        self.registry = AssetRegistry()
        
        # Current design state
        self.current_material = 'wood'
        self.current_pattern = 'checkerboard'
        self.current_color = '#8B5A2B'
        self.current_template = 'organic_sway'
        
        # Build UI
        self._build_ui()
        
        # Load existing assets
        self._load_existing_assets()
        
        logger.info("DGT Design Lab initialized")
        self.root.mainloop()
    
    def _build_ui(self) -> None:
        """Build the main UI"""
        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Title
        title_label = ttk.Label(
            main_frame,
            text="🎨 DGT Design Lab - Asset Design & Pre-Bake Tool",
            font=("Arial", 16, "bold")
        )
        title_label.pack(pady=(0, 10))
        
        # Create three columns
        left_frame = ttk.Frame(main_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        center_frame = ttk.Frame(main_frame)
        center_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)
        
        right_frame = ttk.Frame(main_frame)
        right_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(5, 0))
        
        # Build each section
        self._build_material_controls(left_frame)
        self._build_pattern_controls(left_frame)
        self._build_preview_canvas(center_frame)
        self._build_template_controls(right_frame)
        self._build_export_controls(right_frame)
    
    def _build_material_controls(self, parent: ttk.Frame) -> None:
        """Build material control panel"""
        # Material section
        material_frame = ttk.LabelFrame(parent, text="🎨 Material Designer", padding=10)
        material_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Material selector
        ttk.Label(material_frame, text="Material:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.material_var = tk.StringVar(value=self.current_material)
        material_combo = ttk.Combobox(
            material_frame, 
            textvariable=self.material_var,
            values=['wood', 'stone', 'metal', 'organic', 'water', 'crystal'],
            state='readonly'
        )
        material_combo.grid(row=0, column=1, sticky=tk.W+tk.E, pady=2, padx=(5, 0))
        material_combo.bind('<<ComboboxSelected>>', self._on_material_change)
        
        # Color picker
        ttk.Label(material_frame, text="Base Color:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.color_button = tk.Button(
            material_frame,
            text="Choose Color",
            bg=self.current_color,
            command=self._choose_color,
            width=15
        )
        self.color_button.grid(row=1, column=1, sticky=tk.W+tk.E, pady=2, padx=(5, 0))
        
        # Color display
        self.color_display = tk.Label(material_frame, text="", bg=self.current_color, width=20)
        self.color_display.grid(row=2, column=0, columnspan=2, pady=5)
    
    def _build_pattern_controls(self, parent: ttk.Frame) -> None:
        """Build pattern control panel"""
        # Pattern section
        pattern_frame = ttk.LabelFrame(parent, text="🕹️ Pattern Designer", padding=10)
        pattern_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Pattern selector
        ttk.Label(pattern_frame, text="Dither Pattern:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.pattern_var = tk.StringVar(value=self.current_pattern)
        pattern_combo = ttk.Combobox(
            pattern_frame,
            textvariable=self.pattern_var,
            values=self.dithering_engine.get_pattern_list(),
            state='readonly'
        )
        pattern_combo.grid(row=0, column=1, sticky=tk.W+tk.E, pady=2, padx=(5, 0))
        pattern_combo.bind('<<ComboboxSelected>>', self._on_pattern_change)
        
        # Dither intensity
        ttk.Label(pattern_frame, text="Dither Intensity:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.intensity_var = tk.DoubleVar(value=0.3)
        intensity_scale = ttk.Scale(
            pattern_frame,
            from_=0.0,
            to=1.0,
            variable=self.intensity_var,
            orient=tk.HORIZONTAL,
            command=self._on_intensity_change
        )
        intensity_scale.grid(row=1, column=1, sticky=tk.W+tk.E, pady=2, padx=(5, 0))
        
        self.intensity_label = ttk.Label(pattern_frame, text="0.3")
        self.intensity_label.grid(row=2, column=0, columnspan=2, pady=2)
        
        # Preview button
        ttk.Button(
            pattern_frame,
            text="🎨 Apply Pattern",
            command=self._apply_pattern
        ).grid(row=3, column=0, columnspan=2, pady=10)
    
    def _build_preview_canvas(self, parent: ttk.Frame) -> None:
        """Build preview canvas"""
        # Preview section
        preview_frame = ttk.LabelFrame(parent, text="👁️ Real-Time Preview", padding=10)
        preview_frame.pack(fill=tk.BOTH, expand=True)
        
        # Canvas for preview
        self.preview_canvas = tk.Canvas(
            preview_frame,
            width=400,
            height=400,
            bg='black',
            highlightthickness=1
        )
        self.preview_canvas.pack(fill=tk.BOTH, expand=True)
        
        # Preview info
        self.preview_info = ttk.Label(preview_frame, text="Select a pattern to preview")
        self.preview_info.pack(pady=5)
        
        # Initial preview
        self._update_preview()
    
    def _build_template_controls(self, parent: ttk.Frame) -> None:
        """Build template control panel"""
        # Template section
        template_frame = ttk.LabelFrame(parent, text="📋 Template Designer", padding=10)
        template_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Template selector
        ttk.Label(template_frame, text="Template:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.template_var = tk.StringVar(value=self.current_template)
        template_combo = ttk.Combobox(
            template_frame,
            textvariable=self.template_var,
            values=['organic_sway', 'hard_inert', 'actor_kinetic', 'water'],
            state='readonly'
        )
        template_combo.grid(row=0, column=1, sticky=tk.W+tk.E, pady=2, padx=(5, 0))
        template_combo.bind('<<ComboboxSelected>>', self._on_template_change)
        
        # Template buttons
        ttk.Button(
            template_frame,
            text="🌸 Generate Template",
            command=self._generate_template
        ).grid(row=1, column=0, columnspan=2, pady=5)
        
        ttk.Button(
            template_frame,
            text="💾 Save Template",
            command=self._save_template
        ).grid(row=2, column=0, columnspan=2, pady=5)
        
        # Sonic Field presets
        sonic_frame = ttk.LabelFrame(template_frame, text="🌸 Sonic Field Presets", padding=5)
        sonic_frame.grid(row=3, column=0, columnspan=2, pady=10, sticky=tk.W+tk.E)
        
        ttk.Button(
            sonic_frame,
            text="🌸 Sonic Green",
            command=lambda: self._apply_sonic_preset('green')
        ).pack(side=tk.LEFT, padx=2)
        
        ttk.Button(
            sonic_frame,
            text="🌸 Sonic Pink",
            command=lambda: self._apply_sonic_preset('pink')
        ).pack(side=tk.LEFT, padx=2)
    
    def _build_export_controls(self, parent: ttk.Frame) -> None:
        """Build export control panel"""
        # Export section
        export_frame = ttk.LabelFrame(parent, text="📤 Export Controls", padding=10)
        export_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Export buttons
        ttk.Button(
            export_frame,
            text="📝 Export to YAML",
            command=self._export_to_yaml
        ).pack(fill=tk.X, pady=2)
        
        ttk.Button(
            export_frame,
            text="📦 Export to Templates",
            command=self._export_to_templates
        ).pack(fill=tk.X, pady=2)
        
        ttk.Button(
            export_frame,
            text="🎮 Export to Assets",
            command=self._export_to_assets
        ).pack(fill=tk.X, pady=2)
        
        # Status
        self.export_status = ttk.Label(export_frame, text="Ready to export")
        self.export_status.pack(pady=5)
    
    def _choose_color(self) -> None:
        """Open color chooser dialog"""
        color = colorchooser.askcolor(initialcolor=self.current_color)
        if color[1]:  # User didn't cancel
            self.current_color = color[1]
            self.color_button.config(bg=self.current_color)
            self.color_display.config(bg=self.current_color)
            self._update_preview()
    
    def _on_material_change(self, event) -> None:
        """Handle material change"""
        self.current_material = self.material_var.get()
        self._update_preview()
    
    def _on_pattern_change(self, event) -> None:
        """Handle pattern change"""
        self.current_pattern = self.pattern_var.get()
        self._update_preview()
    
    def _on_intensity_change(self, value) -> None:
        """Handle intensity change"""
        self.intensity_label.config(text=f"{float(value):.2f}")
        self.dithering_engine.dither_intensity = float(value)
        self._update_preview()
    
    def _on_template_change(self, event) -> None:
        """Handle template change"""
        self.current_template = self.template_var.get()
        self._generate_template()
    
    def _apply_pattern(self) -> None:
        """Apply current pattern to preview"""
        self._update_preview()
        self.preview_info.config(text=f"Applied {self.current_pattern} pattern")
    
    def _update_preview(self) -> None:
        """Update the preview canvas"""
        self.preview_canvas.delete("all")
        
        # Generate dithered pattern
        pattern_grid = self.dithering_engine.apply_dither(
            self.current_color, 
            self.current_pattern
        )
        
        # Draw pattern on canvas
        cell_size = 40
        for y, row in enumerate(pattern_grid):
            for x, color in enumerate(row):
                x1 = x * cell_size
                y1 = y * cell_size
                x2 = x1 + cell_size
                y2 = y1 + cell_size
                
                self.preview_canvas.create_rectangle(
                    x1, y1, x2, y2,
                    fill=color,
                    outline='gray',
                    width=1
                )
        
        # Draw grid lines
        for i in range(9):
            # Vertical lines
            self.preview_canvas.create_line(
                i * cell_size, 0, i * cell_size, 8 * cell_size,
                fill='gray', width=1
            )
            # Horizontal lines
            self.preview_canvas.create_line(
                0, i * cell_size, 8 * cell_size, i * cell_size,
                fill='gray', width=1
            )
    
    def _generate_template(self) -> None:
        """Generate template based on current selection"""
        if self.current_template == 'organic_sway':
            pattern = self.template_generator.generate_organic_sway_template(self.current_color)
        elif self.current_template == 'hard_inert':
            pattern = self.template_generator.generate_hard_inert_template(self.current_color)
        elif self.current_template == 'actor_kinetic':
            pattern = self.template_generator.generate_actor_kinetic_template(self.current_color)
        elif self.current_template == 'water':
            pattern = self.template_generator.generate_water_template(self.current_color)
        else:
            pattern = self.dithering_engine.apply_dither(self.current_color)
        
        self._draw_template_preview(pattern)
        self.preview_info.config(text=f"Generated {self.current_template} template")
    
    def _draw_template_preview(self, pattern: List[List[str]]) -> None:
        """Draw template pattern on canvas"""
        self.preview_canvas.delete("all")
        
        if not pattern or not pattern[0]:
            return
        
        cell_size = min(400 // len(pattern[0]), 400 // len(pattern))
        
        for y, row in enumerate(pattern):
            for x, color in enumerate(row):
                # Convert RGB tuple to hex if needed
                if isinstance(color, tuple):
                    color = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
                elif isinstance(color, list):
                    color = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
                
                x1 = x * cell_size
                y1 = y * cell_size
                x2 = x1 + cell_size
                y2 = y1 + cell_size
                
                try:
                    self.preview_canvas.create_rectangle(
                        x1, y1, x2, y2,
                        fill=color,
                        outline='gray',
                        width=1
                    )
                except tk.TclError:
                    # Fallback to a safe color if the color format is invalid
                    self.preview_canvas.create_rectangle(
                        x1, y1, x2, y2,
                        fill="#808080",
                        outline='gray',
                        width=1
                    )
    
    def _apply_sonic_preset(self, preset_type: str) -> None:
        """Apply Sonic Field preset"""
        if preset_type == 'green':
            self.current_color = '#228B22'
            self.current_pattern = 'organic'
        elif preset_type == 'pink':
            self.current_color = '#FFB6C1'
            self.current_pattern = 'dots'
        
        self.color_button.config(bg=self.current_color)
        self.color_display.config(bg=self.current_color)
        self.pattern_var.set(self.current_pattern)
        self._update_preview()
        self.preview_info.config(text=f"Applied Sonic {preset_type} preset")
    
    def _save_template(self) -> None:
        """Save current template using controller"""
        template_name = f"{self.current_material}_{self.current_pattern}"
        
        template = self.controller.create_material_design(
            name=template_name,
            material=self.current_material,
            color=self.current_color,
            pattern=self.current_pattern,
            intensity=self.dithering_engine.dither_intensity
        )
        
        if template:
            self.export_status.config(text=f"Saved template: {template_name}")
            logger.info(f"Template saved: {template_name}")
        else:
            self.export_status.config(text="Failed to save template")
            logger.error("Template save failed")
    
    def _export_to_yaml(self) -> None:
        """Export designs to YAML using controller"""
        filename = filedialog.asksaveasfilename(
            defaultextension=".yaml",
            filetypes=[("YAML files", "*.yaml"), ("All files", "*.*")]
        )
        
        if filename:
            success = self.controller.export_designs(Path(filename))
            if success:
                self.export_status.config(text=f"Exported to {filename}")
                messagebox.showinfo("Export Success", f"Designs exported to {filename}")
                logger.info(f"Export successful: {filename}")
            else:
                self.export_status.config(text="Export failed")
                messagebox.showerror("Export Error", "Failed to export designs")
                logger.error(f"Export failed: {filename}")
    
    def _export_to_templates(self) -> None:
        """Export to templates.yaml"""
        templates_path = Path(__file__).parent.parent.parent / "assets" / "templates.yaml"
        
        try:
            templates_data = {
                'organic_sway': {
                    'description': 'Organic sway pattern for grass/flowers',
                    'base_color': '#228B22',
                    'pattern': 'organic',
                    'intensity': 0.3
                },
                'hard_inert': {
                    'description': 'Hard inert pattern for stones/walls',
                    'base_color': '#808080',
                    'pattern': 'checkerboard',
                    'intensity': 0.4
                },
                'actor_kinetic': {
                    'description': 'Actor kinetic pattern for breathing',
                    'base_color': '#0064FF',
                    'pattern': 'dots',
                    'intensity': 0.1
                },
                'water': {
                    'description': 'Water pattern with ripples',
                    'base_color': '#0064C8',
                    'pattern': 'noise',
                    'intensity': 0.3
                }
            }
            
            with open(templates_path, 'w') as f:
                yaml.dump(templates_data, f, default_flow_style=False)
            
            self.export_status.config(text=f"Exported to {templates_path}")
            messagebox.showinfo("Export Success", f"Templates exported to {templates_path}")
            
        except Exception as e:
            messagebox.showerror("Export Error", f"Failed to export templates: {e}")
    
    def _export_to_assets(self) -> None:
        """Export designs to assets folder"""
        assets_path = Path(__file__).parent.parent.parent / "assets"
        
        try:
            # Export material designs
            materials_data = {}
            for name, design in self.material_designs.items():
                materials_data[name] = {
                    'material': design['material'],
                    'base_color': design['color'],
                    'pattern': design['pattern'],
                    'intensity': design['intensity']
                }
            
            with open(assets_path / "material_designs.yaml", 'w') as f:
                yaml.dump(materials_data, f, default_flow_style=False)
            
            self.export_status.config(text=f"Exported to {assets_path}")
            messagebox.showinfo("Export Success", f"Designs exported to {assets_path}")
            
        except Exception as e:
            messagebox.showerror("Export Error", f"Failed to export assets: {e}")
    
    def _load_existing_assets(self) -> None:
        """Load existing assets for reference"""
        try:
            assets_path = Path(__file__).parent.parent.parent / "assets"
            parser = AssetParser(assets_path)
            parsed_data = parser.load_all_assets()
            
            # Load into registry for reference
            sprites = self.fabricator.generate_all_sprites(parsed_data)
            self.registry.load_from_parsed_data(parsed_data, sprites)
            
            # Validate existing templates
            if 'templates' in parsed_data:
                for template_name, template_data in parsed_data['templates'].items():
                    validated = self.validator.validate_template(template_data)
                    if validated:
                        self.controller.template_designs[template_name] = validated
                        logger.debug(f"Loaded valid template: {template_name}")
            
            self.export_status.config(text="Loaded existing assets")
            logger.info(f"Loaded {len(parsed_data.get('templates', {}))} templates")
            
        except Exception as e:
            self.export_status.config(text="Could not load existing assets")
            logger.error(f"Failed to load existing assets: {e}")

if __name__ == "__main__":
    lab = DGTDesignLab()
