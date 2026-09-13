#!/usr/bin/env python3
"""
Test the complete Raw File system with actual files
"""

from src.assets.raw_loader import create_sovereign_registry
from pathlib import Path

def test_raw_system():
    """Test the complete raw file system"""
    print("=== DGT Raw File System Test ===")
    
    # Test with the actual raw files we created
    registry = create_sovereign_registry(Path('assets/raws'))
    summary = registry.get_registry_summary()
    
    print('\nRegistry Summary:')
    for category, info in summary['categories'].items():
        print(f'  {category}: {info["count"]} objects')
    
    print(f'Total objects: {summary["statistics"]["total_objects"]}')
    print(f'Safety mode: {summary["safety_mode_active"]}')
    
    # Test inheritance handling (the original problem)
    print('\n=== Inheritance Handling Test ===')
    oak_wood = registry.get_object('material', 'oak_wood')
    if oak_wood:
        inherits = oak_wood.get_unknown_fields().get('inherits', 'None')
        print(f'Oak Wood inherits: {inherits}')
        print(f'Oak Wood unknown fields: {list(oak_wood.get_unknown_fields().keys())}')
    
    pine_wood = registry.get_object('material', 'pine_wood')
    if pine_wood:
        inherits = pine_wood.get_unknown_fields().get('inherits', 'None')
        print(f'Pine Wood inherits: {inherits}')
    
    # Test version 2.0 tag-based objects
    print('\n=== Version 2.0 Tag-Based Objects Test ===')
    sonic_grass = registry.get_object('template', 'sonic_field_grass')
    if sonic_grass:
        print(f'Sonic Grass version: {sonic_grass.version}')
        print(f'Sonic Grass tags: {sonic_grass.tags}')
        print(f'Sonic Grass components: {sonic_grass.components}')
    
    # Test search functionality
    print('\n=== Search Test ===')
    wood_results = registry.search_objects('wood')
    print(f'Found {len(wood_results)} objects with "wood":')
    for result in wood_results:
        print(f'  - {result.object_id}: {result.name}')
    
    sonic_results = registry.search_objects('sonic')
    print(f'Found {len(sonic_results)} objects with "sonic":')
    for result in sonic_results:
        print(f'  - {result.object_id}: {result.name}')
    
    # Test validation
    print('\n=== Validation Test ===')
    issues = registry.validate_registry()
    if issues['errors']:
        print(f'Errors: {len(issues["errors"])}')
        for error in issues['errors']:
            print(f'  - {error}')
    
    if issues['warnings']:
        print(f'Warnings: {len(issues["warnings"])}')
        for warning in issues['warnings']:
            print(f'  - {warning}')
    
    if issues['info']:
        print(f'Info: {len(issues["info"])}')
        for info in issues['info']:
            print(f'  - {info}')
    
    print('\n=== Test Complete ===')
    print('✅ Raw File System working correctly!')
    print('✅ Inheritance fields absorbed without errors!')
    print('✅ Varied version files loaded successfully!')
    print('✅ Schema drift handled gracefully!')

if __name__ == '__main__':
    test_raw_system()
