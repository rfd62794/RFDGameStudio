#!/usr/bin/env python3
"""
Production validation script for Tri-Modal Display Suite
Validates Terminal, Cockpit, and PPU display bodies
"""

import sys
import time
from pathlib import Path
from loguru import logger

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

def validate_dispatcher():
    """Validate display dispatcher functionality"""
    logger.info("🎭 Validating Display Dispatcher...")
    
    try:
        from body.dispatcher import DisplayDispatcher, DisplayMode, create_ppu_packet
        
        # Create dispatcher
        dispatcher = DisplayDispatcher(default_mode=DisplayMode.TERMINAL)
        
        # Test mode switching
        modes = [DisplayMode.TERMINAL, DisplayMode.COCKPIT, DisplayMode.PPU]
        for mode in modes:
            if dispatcher.set_mode(mode):
                logger.success(f"✅ Switched to {mode.value} mode")
            else:
                logger.warning(f"⚠️ Failed to switch to {mode.value} mode")
        
        # Test packet rendering
        packet = create_ppu_packet([
            {'id': 'test', 'x': 10, 'y': 10, 'type': 'dynamic'}
        ], ["Test HUD"])
        
        if dispatcher.render(packet):
            logger.success("✅ Packet rendering successful")
        else:
            logger.error("❌ Packet rendering failed")
            return False
        
        # Test performance stats
        stats = dispatcher.get_performance_stats()
        if 'dispatcher' in stats and 'bodies' in stats:
            logger.success("✅ Performance stats collection working")
        else:
            logger.error("❌ Performance stats collection failed")
            return False
        
        dispatcher.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ Dispatcher validation failed: {e}")
        return False

def validate_terminal_body():
    """Validate terminal display body"""
    logger.info("🖥️ Validating Terminal Body...")
    
    try:
        from body.terminal import create_terminal_body
        
        body = create_terminal_body()
        if not body:
            logger.warning("⚠️ Terminal body not available (Rich missing?)")
            return True  # Not a failure, just optional
        
        # Test table rendering
        test_data = {'FPS': 60.0, 'Entities': 25, 'Memory': '67.8MB'}
        if body.render_table("Test Data", test_data):
            logger.success("✅ Terminal table rendering working")
        else:
            logger.error("❌ Terminal table rendering failed")
            return False
        
        # Test message logging
        if body.log_message("Test message", "info"):
            logger.success("✅ Terminal message logging working")
        else:
            logger.error("❌ Terminal message logging failed")
            return False
        
        body.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ Terminal body validation failed: {e}")
        return False

def validate_cockpit_body():
    """Validate cockpit display body"""
    logger.info("🪟 Validating Cockpit Body...")
    
    try:
        from body.cockpit import create_cockpit_body
        
        body = create_cockpit_body()
        if not body:
            logger.warning("⚠️ Cockpit body not available (Tkinter missing?)")
            return True  # Not a failure, just optional
        
        # Test meter updates
        if body.update_meter('fps', 45.5):
            logger.success("✅ Cockpit meter update working")
        else:
            logger.error("❌ Cockpit meter update failed")
            return False
        
        # Test label updates
        if body.update_label('status', 'Test Status'):
            logger.success("✅ Cockpit label update working")
        else:
            logger.error("❌ Cockpit label update failed")
            return False
        
        # Test performance stats
        stats = body.get_performance_stats()
        if 'name' in stats and stats['name'] == 'Cockpit':
            logger.success("✅ Cockpit performance stats working")
        else:
            logger.error("❌ Cockpit performance stats failed")
            return False
        
        body.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ Cockpit body validation failed: {e}")
        return False

def validate_ppu_body():
    """Validate PPU display body"""
    logger.info("🎮 Validating PPU Body...")
    
    try:
        from body.ppu import create_ppu_body
        
        body = create_ppu_body()
        if not body:
            logger.warning("⚠️ PPU body not available (components missing?)")
            return True  # Not a failure, just optional
        
        # Test entity position update
        if body.update_entity_position('test_entity', 15, 8):
            logger.success("✅ PPU entity position update working")
        else:
            logger.error("❌ PPU entity position update failed")
            return False
        
        # Test performance stats
        stats = body.get_performance_stats()
        if 'target_fps' in stats and stats['target_fps'] == 60:
            logger.success("✅ PPU performance stats working")
        else:
            logger.error("❌ PPU performance stats failed")
            return False
        
        body.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ PPU body validation failed: {e}")
        return False

def validate_packet_validation():
    """Validate packet creation and validation"""
    logger.info("📦 Validating Packet System...")
    
    try:
        from body.dispatcher import RenderPacket, RenderLayer, HUDData, DisplayMode
        from body.dispatcher import create_ppu_packet, create_terminal_packet, create_cockpit_packet
        
        # Test manual packet creation
        layers = [
            RenderLayer(depth=0, type="dynamic", id="test", x=10, y=10)
        ]
        hud = HUDData(line_1="Test HUD")
        
        packet = RenderPacket(
            mode=DisplayMode.PPU,
            layers=layers,
            hud=hud
        )
        
        if packet.mode == DisplayMode.PPU and len(packet.layers) == 1:
            logger.success("✅ Manual packet creation working")
        else:
            logger.error("❌ Manual packet creation failed")
            return False
        
        # Test convenience functions
        ppu_packet = create_ppu_packet([{'id': 'test'}], ["HUD Line"])
        terminal_packet = create_terminal_packet({'key': 'value'}, "Title")
        cockpit_packet = create_cockpit_packet({'fps': 60}, {'status': 'OK'})
        
        if (ppu_packet.mode == DisplayMode.PPU and 
            terminal_packet.mode == DisplayMode.TERMINAL and
            cockpit_packet.mode == DisplayMode.COCKPIT):
            logger.success("✅ Convenience packet creation working")
        else:
            logger.error("❌ Convenience packet creation failed")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Packet validation failed: {e}")
        return False

def run_integration_test():
    """Run full integration test"""
    logger.info("🔄 Running Integration Test...")
    
    try:
        from body.dispatcher import DisplayDispatcher, DisplayMode
        from body.terminal import create_terminal_body
        from body.cockpit import create_cockpit_body
        from body.ppu import create_ppu_body
        
        # Create dispatcher
        dispatcher = DisplayDispatcher(default_mode=DisplayMode.TERMINAL)
        
        # Register bodies
        terminal_body = create_terminal_body()
        if terminal_body:
            dispatcher.register_body(DisplayMode.TERMINAL, terminal_body)
        
        cockpit_body = create_cockpit_body()
        if cockpit_body:
            dispatcher.register_body(DisplayMode.COCKPIT, cockpit_body)
        
        ppu_body = create_ppu_body()
        if ppu_body:
            dispatcher.register_body(DisplayMode.PPU, ppu_body)
        
        # Test state rendering across modes
        test_state = {
            'entities': [
                {'id': 'player', 'x': 10, 'y': 10, 'effect': 'sway'},
                {'id': 'item', 'x': 5, 'y': 8, 'effect': 'pulse'}
            ],
            'background': {'id': 'test_bg'},
            'hud': {'line_1': 'Integration Test', 'line_2': 'Running...'}
        }
        
        # Test each available mode
        available_modes = []
        if terminal_body:
            available_modes.append(DisplayMode.TERMINAL)
        if cockpit_body:
            available_modes.append(DisplayMode.COCKPIT)
        if ppu_body:
            available_modes.append(DisplayMode.PPU)
        
        success_count = 0
        for mode in available_modes:
            if dispatcher.render_state(test_state, mode):
                logger.success(f"✅ Integration test passed for {mode.value}")
                success_count += 1
            else:
                logger.error(f"❌ Integration test failed for {mode.value}")
        
        dispatcher.cleanup()
        
        if success_count == len(available_modes):
            logger.success("✅ Full integration test passed")
            return True
        else:
            logger.error(f"❌ Integration test: {success_count}/{len(available_modes)} modes passed")
            return False
        
    except Exception as e:
        logger.error(f"❌ Integration test failed: {e}")
        return False

def main():
    """Main validation function"""
    logger.info("🚀 DGT Tri-Modal Display Suite Validation")
    logger.info("=" * 60)
    
    validations = [
        ("Display Dispatcher", validate_dispatcher),
        ("Terminal Body", validate_terminal_body),
        ("Cockpit Body", validate_cockpit_body),
        ("PPU Body", validate_ppu_body),
        ("Packet System", validate_packet_validation),
        ("Integration Test", run_integration_test),
    ]
    
    results = []
    for name, validator in validations:
        logger.info(f"\n📋 {name} Validation")
        results.append((name, validator()))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 VALIDATION SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"  {status} {name}")
    
    logger.info(f"\n🎯 Overall: {passed}/{total} validations passed")
    
    if passed == total:
        logger.success("🚀 Tri-Modal Display Suite is production ready!")
        return 0
    else:
        logger.error("⚠️ Some validations failed - review before deployment")
        return 1

if __name__ == "__main__":
    sys.exit(main())
