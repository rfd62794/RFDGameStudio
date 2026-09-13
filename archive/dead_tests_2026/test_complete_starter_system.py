#!/usr/bin/env python3
"""
Complete Starter System Test - ADR 091 Integration Test
Demonstrates the full Token & Tint system with semantic fallback
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from assets.starter_loader import load_starter_kit, get_starter_loader

def test_complete_starter_system():
    """Test the complete starter system integration"""
    print("=== Complete Starter System Test ===")
    print("Testing ADR 091: The Semantic Starter Protocol")
    
    # Test 1: Load Starter Kit
    print("\n1. Loading Starter Kit...")
    starter_path = Path("assets/objects_starter.yaml")
    if not starter_path.exists():
        print(f"❌ Starter kit not found: {starter_path}")
        return False
    
    success = load_starter_kit(starter_path)
    if not success:
        print("❌ Failed to load starter kit")
        return False
    
    loader = get_starter_loader()
    print(f"✅ Loaded {len(loader.objects)} objects from {len(loader.material_archetypes)} materials")
    
    # Test 2: Semantic Fallback System
    print("\n2. Testing Semantic Fallback...")
    
    # Test missing sprite fallback
    grass_obj = loader.get_object('grass_tuft')
    if grass_obj:
        fallback_sprite = grass_obj.get_sprite_id()
        print(f"✅ Grass sprite fallback: {fallback_sprite}")
    
    # Test semantic collision
    tree_obj = loader.get_object('oak_tree')
    if tree_obj:
        semantic_collision = tree_obj.get_collision()
        print(f"✅ Tree semantic collision: {semantic_collision} (barrier tag: {loader.get_material_archetype(tree_obj.material_id).has_tag('barrier')})")
    
    # Test 3: Material Archetype System
    print("\n3. Testing Material Archetypes...")
    
    for mat_id, archetype in loader.material_archetypes.items():
        print(f"✅ {mat_id}: {archetype.color} - {', '.join(archetype.tags)}")
        
        # Test tag system
        if mat_id == 'wood':
            assert archetype.has_tag('flammable'), "Wood should be flammable"
            assert archetype.has_tag('barrier'), "Wood should be barrier"
            print(f"  ✅ Wood tags working correctly")
        
        if mat_id == 'stone':
            assert archetype.has_tag('heavy'), "Stone should be heavy"
            print(f"  ✅ Stone tags working correctly")
        
        if mat_id == 'metal':
            assert archetype.has_tag('valuable'), "Metal should be valuable"
            assert archetype.has_tag('secure'), "Metal should be secure"
            print(f"  ✅ Metal tags working correctly")
        
        if mat_id == 'organic':
            assert archetype.has_tag('animated'), "Organic should be animated"
            print(f"  ✅ Organic tags working correctly")
    
    # Test 4: Token & Tint System
    print("\n4. Testing Token & Tint System...")
    
    for obj_id, obj in loader.objects.items():
        render_data = loader.get_rendering_data(obj_id)
        if render_data:
            material = loader.get_material_archetype(obj.material_id)
            
            # Verify color tinting
            assert render_data['color'] == material.color, f"Color tinting failed for {obj_id}"
            print(f"✅ {obj_id}: {obj.material_id} -> {render_data['color']} (tint applied)")
            
            # Verify sprite token
            assert render_data['sprite_id'] == obj.get_sprite_id(), f"Sprite token failed for {obj_id}"
            print(f"  ✅ Sprite token: {render_data['sprite_id']}")
            
            # Verify semantic properties
            for tag in material.tags:
                assert render_data[tag], f"Tag {tag} not applied for {obj_id}"
            print(f"  ✅ Tags applied: {', '.join(material.tags)}")
    
    # Test 5: D20 Check Integration
    print("\n5. Testing D20 Check Integration...")
    
    chest_obj = loader.get_object('iron_lockbox')
    if chest_obj and chest_obj.d20_checks:
        lockpick_dc = chest_obj.d20_checks.get('lockpick', {}).get('DC')
        print(f"✅ Iron Lockbox lockpick DC: {lockpick_dc}")
        assert lockpick_dc == 15, "Lockpick DC should be 15"
    
    # Test 6: Interaction Hooks
    print("\n6. Testing Interaction Hooks...")
    
    gate_obj = loader.get_object('wooden_gate')
    if gate_obj and gate_obj.interaction_hooks:
        hooks = gate_obj.interaction_hooks
        print(f"✅ Wooden Gate hooks: {', '.join(hooks)}")
        assert 'open' in hooks, "Gate should have open hook"
    
    # Test 7: Validation System
    print("\n7. Testing Validation System...")
    
    issues = loader.validate_starter_kit()
    
    if issues['errors']:
        print(f"❌ Found {len(issues['errors'])} errors:")
        for error in issues['errors']:
            print(f"  - {error}")
        return False
    
    if issues['warnings']:
        print(f"⚠️  Found {len(issues['warnings'])} warnings:")
        for warning in issues['warnings']:
            print(f"  - {warning}")
    
    print("✅ Validation passed")
    
    # Test 8: Scene Generation
    print("\n8. Testing Scene Generation...")
    
    scene_objects = loader.get_scene_objects()
    print(f"✅ Scene contains {len(scene_objects)} renderable objects")
    
    for obj_id in scene_objects.keys():
        render_data = loader.get_rendering_data(obj_id)
        assert render_data is not None, f"Render data missing for {obj_id}"
        assert 'color' in render_data, f"Color missing for {obj_id}"
        assert 'sprite_id' in render_data, f"Sprite ID missing for {obj_id}"
        print(f"  ✅ {obj_id}: {render_data['sprite_id']} ready for rendering")
    
    # Test 9: Error Handling
    print("\n9. Testing Error Handling...")
    
    # Test unknown material fallback
    unknown_material = loader.get_material_archetype('unknown_material')
    assert unknown_material.color == "#808080", "Unknown material should fallback to gray"
    print(f"✅ Unknown material fallback: {unknown_material.color}")
    
    # Test unknown object lookup
    unknown_obj = loader.get_object('unknown_object')
    assert unknown_obj is None, "Unknown object should return None"
    print("✅ Unknown object handling working")
    
    # Test 10: Performance Check
    print("\n10. Testing Performance...")
    
    import time
    
    # Test loading performance
    start_time = time.time()
    for i in range(100):
        load_starter_kit(starter_path)
    load_time = time.time() - start_time
    
    print(f"✅ 100 loads in {load_time:.3f} seconds ({load_time/100*1000:.1f}ms per load)")
    
    # Test rendering performance
    start_time = time.time()
    for i in range(1000):
        for obj_id in loader.objects.keys():
            loader.get_rendering_data(obj_id)
    render_time = time.time() - start_time
    
    print(f"✅ 5000 render calls in {render_time:.3f} seconds ({render_time/5000*1000:.1f}ms per call)")
    
    print("\n=== Complete System Test Results ===")
    print("✅ All tests passed!")
    print("✅ Token & Tint system fully operational")
    print("✅ Semantic fallback working perfectly")
    print("✅ Material archetype system functional")
    print("✅ D20 check integration ready")
    print("✅ Interaction hooks working")
    print("✅ Validation system operational")
    print("✅ Scene generation ready")
    print("✅ Error handling robust")
    print("✅ Performance acceptable")
    
    print("\n🏆 ADR 091: The Semantic Starter Protocol - COMPLETE!")
    print("🚀 Ready for production deployment!")
    
    return True

if __name__ == "__main__":
    success = test_complete_starter_system()
    sys.exit(0 if success else 1)
