"""
Tests for Sovereign Schema - ADR 089 Implementation
Tests the "Raw File" pattern and schema-loose parsing
"""

import pytest
import tempfile
import yaml
from pathlib import Path
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from assets.sovereign_schema import (
    SovereignObject,
    MaterialObject,
    TemplateObject,
    TagObject,
    LegacyParser,
    SovereignParserV1,
    TagBasedParser,
    ParserFactory,
    RawFileLoader,
    SafetyArchetypes,
    create_sovereign_object,
    export_to_raw_file
)

class TestSovereignObject:
    """Test base sovereign object functionality"""
    
    def test_basic_object_creation(self):
        obj = SovereignObject(
            object_type="test",
            object_id="test_obj",
            name="Test Object"
        )
        
        assert obj.object_type == "test"
        assert obj.object_id == "test_obj"
        assert obj.name == "Test Object"
        assert obj.version == "1.0"
        assert isinstance(obj.metadata, dict)
    
    def test_unknown_field_absorption(self):
        obj = SovereignObject(
            object_type="test",
            object_id="test_obj"
        )
        
        obj.absorb_field("unknown_key", "unknown_value")
        obj.absorb_field("another_key", {"nested": "data"})
        
        unknown = obj.get_unknown_fields()
        assert "unknown_key" in unknown
        assert unknown["unknown_key"] == "unknown_value"
        assert "another_key" in unknown
    
    def test_get_all_data(self):
        obj = SovereignObject(
            object_type="test",
            object_id="test_obj",
            name="Test Object"
        )
        
        obj.absorb_field("custom_field", "custom_value")
        
        all_data = obj.get_all_data()
        assert all_data["name"] == "Test Object"
        assert all_data["custom_field"] == "custom_value"

class TestMaterialObject:
    """Test material-specific sovereign object"""
    
    def test_material_creation(self):
        material = MaterialObject(
            object_id="oak_wood",
            name="Oak Wood",
            base_color="#8B4513",
            pattern="solid",
            intensity=0.0
        )
        
        assert material.object_type == "material"
        assert material.object_id == "oak_wood"
        assert material.base_color == "#8B4513"
        assert material.inherits is None  # Should handle gracefully
    
    def test_material_with_inheritance(self):
        material = MaterialObject(
            object_id="pine_wood",
            name="Pine Wood",
            inherits="wood_base"  # This should not cause an error
        )
        
        assert material.inherits == "wood_base"

class TestLegacyParser:
    """Test legacy parser for version 1.0 files"""
    
    def test_can_parse_v1_0(self):
        parser = LegacyParser()
        
        v1_data = {"version": "1.0", "object_type": "material"}
        v2_data = {"version": "1.1", "object_type": "material"}
        
        assert parser.can_parse(v1_data) is True
        assert parser.can_parse(v2_data) is False
    
    def test_parse_material_v1_0(self):
        parser = LegacyParser()
        
        data = {
            "version": "1.0",
            "object_type": "material",
            "id": "test_material",
            "name": "Test Material",
            "base_color": "#FF0000",
            "pattern": "solid",
            "unknown_field": "should_be_absorbed"
        }
        
        obj = parser.parse(data)
        
        assert isinstance(obj, MaterialObject)
        assert obj.object_id == "test_material"
        assert obj.name == "Test Material"
        assert obj.base_color == "#FF0000"
        
        # Check unknown field absorption
        unknown = obj.get_unknown_fields()
        assert "unknown_field" in unknown
        assert unknown["unknown_field"] == "should_be_absorbed"

class TestSovereignParserV1:
    """Test sovereign parser for version 1.1 files"""
    
    def test_can_parse_v1_1(self):
        parser = SovereignParserV1()
        
        v1_data = {"version": "1.0", "object_type": "material"}
        v1_1_data = {"version": "1.1", "object_type": "material"}
        
        assert parser.can_parse(v1_data) is False
        assert parser.can_parse(v1_1_data) is True
    
    def test_parse_with_inheritance(self):
        parser = SovereignParserV1()
        
        data = {
            "version": "1.1",
            "object_type": "material",
            "id": "oak_wood",
            "name": "Oak Wood",
            "inherits": "wood_base",  # This should be absorbed
            "base_color": "#8B4513",
            "custom_property": "custom_value"
        }
        
        obj = parser.parse(data)
        
        assert isinstance(obj, MaterialObject)
        assert obj.object_id == "oak_wood"
        
        # 'inherits' should be absorbed into unknown fields, not set as property
        unknown = obj.get_unknown_fields()
        assert "inherits" in unknown
        assert unknown["inherits"] == "wood_base"
        assert "custom_property" in unknown

class TestTagBasedParser:
    """Test tag-based parser for version 2.0 files"""
    
    def test_can_parse_v2_0(self):
        parser = TagBasedParser()
        
        v1_data = {"version": "1.1", "object_type": "template"}
        v2_data = {"version": "2.0", "object_type": "template"}
        
        assert parser.can_parse(v1_data) is False
        assert parser.can_parse(v2_data) is True
    
    def test_parse_tag_based_object(self):
        parser = TagBasedParser()
        
        data = {
            "version": "2.0",
            "id": "sonic_field_grass",
            "name": "Sonic Field Grass",
            "tags": ["grass", "sonic", "enhanced"],
            "components": {
                "base_color": "#228B22",
                "pattern": "organic",
                "intensity": 0.4
            },
            "extra_metadata": "should_be_absorbed"
        }
        
        obj = parser.parse(data)
        
        assert isinstance(obj, TagObject)
        assert obj.object_id == "sonic_field_grass"
        assert "grass" in obj.tags
        assert "sonic" in obj.tags
        assert obj.components["base_color"] == "#228B22"
        
        unknown = obj.get_unknown_fields()
        assert "extra_metadata" in unknown

class TestParserFactory:
    """Test parser factory selection"""
    
    def test_parser_selection(self):
        factory = ParserFactory()
        
        # Test version 2.0 selection
        v2_data = {"version": "2.0", "id": "test"}
        parser = factory.get_parser(v2_data)
        assert isinstance(parser, TagBasedParser)
        
        # Test version 1.1 selection
        v1_1_data = {"version": "1.1", "id": "test"}
        parser = factory.get_parser(v1_1_data)
        assert isinstance(parser, SovereignParserV1)
        
        # Test version 1.0 selection
        v1_0_data = {"version": "1.0", "id": "test"}
        parser = factory.get_parser(v1_0_data)
        assert isinstance(parser, LegacyParser)
        
        # Test fallback for unknown version
        unknown_data = {"version": "9.9", "id": "test"}
        parser = factory.get_parser(unknown_data)
        assert isinstance(parser, LegacyParser)

class TestRawFileLoader:
    """Test raw file loader functionality"""
    
    def test_load_single_file(self, tmp_path):
        # Create test YAML file
        test_file = tmp_path / "test_materials.yaml"
        test_data = [
            {
                "object_type": "material",
                "id": "test_wood",
                "version": "1.1",
                "name": "Test Wood",
                "base_color": "#8B4513",
                "inherits": "wood_base"
            },
            {
                "object_type": "template",
                "id": "test_template",
                "version": "1.1",
                "name": "Test Template",
                "base_color": "#FF0000"
            }
        ]
        
        with open(test_file, 'w') as f:
            yaml.dump(test_data, f)
        
        # Load with RawFileLoader
        loader = RawFileLoader(tmp_path)
        registry = loader.load_all_raws()
        
        assert "material" in registry
        assert "template" in registry
        assert len(registry["material"]) == 1
        assert len(registry["template"]) == 1
        
        material = registry["material"][0]
        assert material.object_id == "test_wood"
        assert "inherits" in material.get_unknown_fields()
    
    def test_load_multiple_files(self, tmp_path):
        # Create multiple test files
        materials_file = tmp_path / "materials.yaml"
        templates_file = tmp_path / "templates.yaml"
        
        materials_data = [{
            "object_type": "material",
            "id": "oak",
            "version": "1.1",
            "name": "Oak"
        }]
        
        templates_data = [{
            "object_type": "template", 
            "id": "basic",
            "version": "1.1",
            "name": "Basic"
        }]
        
        with open(materials_file, 'w') as f:
            yaml.dump(materials_data, f)
        
        with open(templates_file, 'w') as f:
            yaml.dump(templates_data, f)
        
        loader = RawFileLoader(tmp_path)
        registry = loader.load_all_raws()
        
        assert len(registry["material"]) == 1
        assert len(registry["template"]) == 1
        assert registry["material"][0].object_id == "oak"
        assert registry["template"][0].object_id == "basic"
    
    def test_fault_isolation(self, tmp_path):
        # Create one valid file and one invalid file
        valid_file = tmp_path / "valid.yaml"
        invalid_file = tmp_path / "invalid.yaml"
        
        valid_data = [{
            "object_type": "material",
            "id": "valid_material",
            "version": "1.1",
            "name": "Valid Material"
        }]
        
        # Invalid YAML (should cause parsing error)
        invalid_content = "invalid: yaml: content: ["
        
        with open(valid_file, 'w') as f:
            yaml.dump(valid_data, f)
        
        with open(invalid_file, 'w') as f:
            f.write(invalid_content)
        
        loader = RawFileLoader(tmp_path)
        registry = loader.load_all_raws()
        
        # Should still load the valid file despite the invalid one
        assert len(registry["material"]) == 1
        assert registry["material"][0].object_id == "valid_material"

class TestSafetyArchetypes:
    """Test safety archetype fallbacks"""
    
    def test_fallback_material(self):
        material = SafetyArchetypes.get_fallback_material()
        
        assert isinstance(material, MaterialObject)
        assert material.object_id == "fallback_wood"
        assert material.name == "Fallback Wood"
        assert material.base_color == "#8B4513"
    
    def test_fallback_template(self):
        template = SafetyArchetypes.get_fallback_template()
        
        assert isinstance(template, TemplateObject)
        assert template.object_id == "fallback_basic"
        assert template.name == "Fallback Template"
        assert template.base_color == "#808080"

class TestUtilityFunctions:
    """Test utility functions"""
    
    def test_create_sovereign_object(self):
        obj = create_sovereign_object(
            object_type="material",
            object_id="test_obj",
            name="Test Object",
            base_color="#FF0000"
        )
        
        assert isinstance(obj, MaterialObject)
        assert obj.object_id == "test_obj"
        assert obj.base_color == "#FF0000"
    
    def test_export_to_raw_file(self, tmp_path):
        # Create test objects
        material = MaterialObject(
            object_id="test_material",
            name="Test Material",
            base_color="#FF0000"
        )
        
        template = TemplateObject(
            object_id="test_template", 
            name="Test Template",
            base_color="#00FF00"
        )
        
        # Export to file
        export_file = tmp_path / "exported.yaml"
        export_to_raw_file([material, template], export_file)
        
        # Verify export
        assert export_file.exists()
        
        with open(export_file, 'r') as f:
            exported_data = yaml.safe_load(f)
        
        assert len(exported_data) == 2
        assert exported_data[0]["object_type"] == "material"
        assert exported_data[0]["id"] == "test_material"
        assert exported_data[1]["object_type"] == "template"
        assert exported_data[1]["id"] == "test_template"

class TestInheritanceHandling:
    """Test inheritance field handling (the original problem)"""
    
    def test_inheritance_absorption(self):
        """Test that 'inherits' field is absorbed without causing errors"""
        parser = SovereignParserV1()
        
        # This is the problematic case that would break with dataclasses
        data = {
            "version": "1.1",
            "object_type": "material",
            "id": "oak_wood",
            "name": "Oak Wood",
            "inherits": "wood_base",  # This field caused the original error
            "base_color": "#8B4513",
            "custom_field": "custom_value"
        }
        
        # Should not raise an error
        obj = parser.parse(data)
        
        assert isinstance(obj, MaterialObject)
        assert obj.object_id == "oak_wood"
        
        # 'inherits' should be in unknown fields, not causing constructor error
        unknown = obj.get_unknown_fields()
        assert "inherits" in unknown
        assert unknown["inherits"] == "wood_base"
        assert "custom_field" in unknown

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
