"""
Tests for DGT Design Lab - SOLID Architecture Validation
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pydantic import BaseModel, Field, field_validator
import yaml

# Import the refactored components
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from tools.design_lab import (
    AssetDesignController,
    YAMLExporter,
    AssetValidator,
    Color,
    DitherPattern,
    AssetTemplate,
    DitheringEngine,
    TemplateGenerator,
    AssetExporter
)


class MockDitheringEngine(DitheringEngine):
    """Mock dithering engine for testing"""
    
    def get_pattern_list(self) -> list:
        return ['solid', 'checkerboard', 'dots']
    
    def apply_dither(self, color: str, pattern: str) -> list:
        return [[color] * 8 for _ in range(8)]


class MockTemplateGenerator(TemplateGenerator):
    """Mock template generator for testing"""
    
    def __init__(self, dithering_engine: DitheringEngine = None):
        self.dithering_engine = dithering_engine
    
    def generate_template(self, template_type: str, color: str) -> list:
        return [[color] * 8 for _ in range(8)]


class Color(BaseModel):
    """Color representation with validation"""
    hex_value: str = Field(pattern=r'^#[0-9A-Fa-f]{6}$')
    
    @field_validator('hex_value')
    @classmethod
    def validate_hex(cls, v):
        if not v.startswith('#') or len(v) != 7:
            raise ValueError('Color must be in hex format #RRGGBB')
        return v


class TestColorModel:
    """Test Color domain model"""
    
    def test_valid_color(self):
        color = Color(hex_value="#FF0000")
        assert color.hex_value == "#FF0000"
    
    def test_invalid_color_format(self):
        with pytest.raises(ValueError):
            Color(hex_value="FF0000")  # Missing #
    
    def test_invalid_color_length(self):
        with pytest.raises(ValueError):
            Color(hex_value="#FF00")  # Too short


class TestDitherPatternModel:
    """Test DitherPattern domain model"""
    
    def test_valid_pattern(self):
        pattern = DitherPattern(name="test", intensity=0.5, pattern_type="dots")
        assert pattern.name == "test"
        assert pattern.intensity == 0.5
    
    def test_intensity_bounds(self):
        # Valid bounds
        pattern = DitherPattern(name="test", intensity=0.0, pattern_type="dots")
        assert pattern.intensity == 0.0
        
        pattern = DitherPattern(name="test", intensity=1.0, pattern_type="dots")
        assert pattern.intensity == 1.0
        
        # Invalid bounds
        with pytest.raises(ValueError):
            DitherPattern(name="test", intensity=-0.1, pattern_type="dots")
        
        with pytest.raises(ValueError):
            DitherPattern(name="test", intensity=1.1, pattern_type="dots")


class TestAssetTemplateModel:
    """Test AssetTemplate domain model"""
    
    def test_valid_template(self):
        color = Color(hex_value="#FF0000")
        pattern = DitherPattern(name="test", intensity=0.5, pattern_type="dots")
        
        template = AssetTemplate(
            name="test_template",
            description="Test template",
            base_color=color.model_dump(),
            pattern=pattern.model_dump(),
            animation_frames=2,
            frame_duration=100,
            use_case=["test"],
            sonic_field_compatible=True
        )
        
        assert template.name == "test_template"
        assert template.animation_frames == 2
        assert template.sonic_field_compatible is True


class TestYAMLExporter:
    """Test YAML exporter implementation"""
    
    def test_export_success(self, tmp_path):
        exporter = YAMLExporter()
        test_data = {"test": "data"}
        export_path = tmp_path / "test.yaml"
        
        result = exporter.export(test_data, export_path)
        
        assert result is True
        assert export_path.exists()
        
        with open(export_path, 'r') as f:
            loaded_data = yaml.safe_load(f)
        
        assert loaded_data == test_data
    
    def test_export_failure(self, tmp_path):
        exporter = YAMLExporter()
        test_data = {"test": "data"}
        # Invalid path (directory instead of file)
        export_path = tmp_path
        
        result = exporter.export(test_data, export_path)
        
        assert result is False


class TestAssetValidator:
    """Test asset validator"""
    
    def test_valid_template_validation(self):
        validator = AssetValidator()
        template_data = {
            "name": "test",
            "description": "Test template",
            "base_color": {"hex_value": "#FF0000"},
            "pattern": {
                "name": "dots",
                "intensity": 0.5,
                "pattern_type": "dots"
            },
            "animation_frames": 1,
            "frame_duration": 0,
            "use_case": ["test"],
            "sonic_field_compatible": False
        }
        
        result = validator.validate_template(template_data)
        
        assert result is not None
        assert isinstance(result, AssetTemplate)
        assert result.name == "test"
    
    def test_invalid_template_validation(self):
        validator = AssetValidator()
        invalid_data = {
            "name": "test",
            # Missing required fields
        }
        
        result = validator.validate_template(invalid_data)
        
        assert result is None


class TestAssetDesignController:
    """Test asset design controller"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.mock_engine = MockDitheringEngine()
        self.mock_generator = MockTemplateGenerator(self.mock_engine)
        self.mock_exporter = Mock(spec=AssetExporter)
        self.mock_validator = Mock(spec=AssetValidator)
        
        self.controller = AssetDesignController(
            self.mock_engine,
            self.mock_generator,
            self.mock_exporter,
            self.mock_validator
        )
    
    def test_create_material_design_success(self):
        """Test successful material design creation"""
        result = self.controller.create_material_design(
            name="test_material",
            material="wood",
            color="#8B4513",
            pattern="checkerboard",
            intensity=0.3
        )
        
        assert result is not None
        assert isinstance(result, AssetTemplate)
        assert result.name == "test_material"
        assert "test_material" in self.controller.material_designs
    
    def test_create_material_design_invalid_color(self):
        """Test material design creation with invalid color"""
        result = self.controller.create_material_design(
            name="test_material",
            material="wood",
            color="invalid_color",  # Invalid format
            pattern="checkerboard",
            intensity=0.3
        )
        
        assert result is None
        assert "test_material" not in self.controller.material_designs
    
    def test_export_designs_success(self, tmp_path):
        """Test successful design export"""
        # Create a test design first
        self.controller.create_material_design(
            name="test_material",
            material="wood",
            color="#8B4513",
            pattern="checkerboard",
            intensity=0.3
        )
        
        # Mock successful export
        self.mock_exporter.export.return_value = True
        
        export_path = tmp_path / "export.yaml"
        result = self.controller.export_designs(export_path)
        
        assert result is True
        self.mock_exporter.export.assert_called_once()
        
        # Check export data structure
        call_args = self.mock_exporter.export.call_args[0]
        export_data = call_args[0]
        
        assert 'material_designs' in export_data
        assert 'template_designs' in export_data
        assert 'export_metadata' in export_data
        assert export_data['export_metadata']['total_materials'] == 1
    
    def test_export_designs_failure(self, tmp_path):
        """Test failed design export"""
        # Mock failed export
        self.mock_exporter.export.return_value = False
        
        export_path = tmp_path / "export.yaml"
        result = self.controller.export_designs(export_path)
        
        assert result is False


class TestIntegration:
    """Integration tests for the complete system"""
    
    def test_full_design_workflow(self, tmp_path):
        """Test complete design workflow from creation to export"""
        # Setup real components
        mock_engine = MockDitheringEngine()
        mock_generator = MockTemplateGenerator(mock_engine)
        exporter = YAMLExporter()
        validator = AssetValidator()
        
        controller = AssetDesignController(
            mock_engine,
            mock_generator,
            exporter,
            validator
        )
        
        # Create design
        design = controller.create_material_design(
            name="integration_test",
            material="stone",
            color="#808080",
            pattern="solid",
            intensity=0.0
        )
        
        assert design is not None
        
        # Export design
        export_path = tmp_path / "integration_test.yaml"
        result = controller.export_designs(export_path)
        
        assert result is True
        assert export_path.exists()
        
        # Verify exported data
        with open(export_path, 'r') as f:
            exported_data = yaml.safe_load(f)
        
        assert 'material_designs' in exported_data
        assert len(exported_data['material_designs']) == 1
        assert exported_data['material_designs'][0]['name'] == 'integration_test'


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
