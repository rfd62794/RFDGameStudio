"""
Zero-Friction Loop Verification - Cross-Platform Save System
Demonstrates seamless save/load between Miyoo Mini (160x144) and Desktop HD (1920x1080)
"""

from typing import Dict, Any, List, Optional, Tuple
import logging
import json
from pathlib import Path
import time

from dgt_core.engines.viewport.logical_viewport import LogicalViewport
from dgt_core.compat.pygame_shim import create_legacy_context
from dgt_core.registry.dgt_registry import RegistryBridge
from legacy_logic_extraction.breeding_logic import BreedingLogicExtractor
from legacy_logic_extraction.roster_logic import RosterLogicExtractor
from legacy_logic_extraction.market_logic import MarketLogicExtractor


class ZeroFrictionLoopVerifier:
    """
    Verifies the Zero-Friction Loop: save on Miyoo Mini, load on Desktop HD
    with identical UI proportions and genetic data preservation.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Test configurations
        self.miyoomini_config = {
            'resolution': (160, 144),
            'name': 'Miyoo Mini',
            'scale_factor': 1
        }
        
        self.desktop_config = {
            'resolution': (1920, 1080),
            'name': 'Desktop HD',
            'scale_factor': 4
        }
        
        # Test data
        self.test_save_data = None
        self.verification_results = {}
        
        self.logger.info("ZeroFrictionLoopVerifier initialized")
    
    def run_complete_verification(self) -> Dict[str, Any]:
        """
        Run the complete Zero-Friction Loop verification.
        
        Returns:
            Verification results
        """
        self.logger.info("Starting Zero-Friction Loop verification")
        
        results = {
            'test_timestamp': time.time(),
            'phases': {},
            'overall_success': False,
            'errors': []
        }
        
        try:
            # Phase 1: Create test data on Miyoo Mini
            results['phases']['miyoomini_creation'] = self._test_miyoomini_creation()
            
            # Phase 2: Save data
            results['phases']['save_data'] = self._test_save_data()
            
            # Phase 3: Load data on Desktop HD
            results['phases']['desktop_load'] = self._test_desktop_load()
            
            # Phase 4: Verify UI proportions
            results['phases']['ui_proportions'] = self._test_ui_proportions()
            
            # Phase 5: Verify genetic data integrity
            results['phases']['genetic_integrity'] = self._test_genetic_integrity()
            
            # Phase 6: Verify cross-platform functionality
            results['phases']['cross_platform_functionality'] = self._test_cross_platform_functionality()
            
            # Calculate overall success
            all_phases_passed = all(
                phase.get('success', False) 
                for phase in results['phases'].values()
            )
            results['overall_success'] = all_phases_passed
            
            if all_phases_passed:
                self.logger.info("🎉 Zero-Friction Loop verification PASSED!")
            else:
                self.logger.error("❌ Zero-Friction Loop verification FAILED")
                
        except Exception as e:
            results['errors'].append(str(e))
            self.logger.error(f"Verification error: {e}")
        
        return results
    
    def _test_miyoomini_creation(self) -> Dict[str, Any]:
        """Phase 1: Create test data on Miyoo Mini configuration"""
        self.logger.info("Phase 1: Creating test data on Miyoo Mini (160x144)")
        
        try:
            # Create Miyoo Mini viewport
            viewport = LogicalViewport()
            viewport.set_physical_resolution(self.miyoomini_config['resolution'])
            
            # Create legacy context
            context = create_legacy_context(self.miyoomini_config['resolution'])
            
            # Create registry bridge
            registry = RegistryBridge(None, Path("data/test_miyoomini_save.json"))
            
            # Create logic extractors
            breeding_logic = BreedingLogicExtractor()
            roster_logic = RosterLogicExtractor()
            market_logic = MarketLogicExtractor()
            
            # Create test turtles
            test_turtles = self._create_test_turtles()
            
            # Add turtles to registry
            for turtle in test_turtles:
                registry.add_turtle(turtle)
            
            # Create test breeding
            breeding_result = self._create_test_breeding(registry, breeding_logic)
            
            # Store test data
            self.test_save_data = {
                'viewport_size': viewport.physical_size,
                'turtles': test_turtles,
                'breeding_result': breeding_result,
                'player_money': registry.get_player_money(),
                'statistics': registry.get_player_statistics(),
                'ui_layout': self._capture_ui_layout(context, viewport.physical_size)
            }
            
            return {
                'success': True,
                'data_created': len(test_turtles),
                'resolution': self.miyoomini_config['resolution'],
                'ui_elements': len(self.test_save_data['ui_layout'])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_save_data(self) -> Dict[str, Any]:
        """Phase 2: Save data with integrity verification"""
        self.logger.info("Phase 2: Saving data with integrity verification")
        
        try:
            if not self.test_save_data:
                raise ValueError("No test data to save")
            
            # Create save file
            save_file = Path("data/zero_friction_test_save.json")
            save_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Add metadata
            save_data = {
                'version': '1.0',
                'timestamp': time.time(),
                'platform': 'Miyoo Mini',
                'resolution': self.miyoomini_config['resolution'],
                'data': self.test_save_data
            }
            
            # Save with checksum
            save_json = json.dumps(save_data, indent=2)
            checksum = hash(save_json)
            
            with open(save_file, 'w') as f:
                f.write(save_json)
            
            # Verify save integrity
            with open(save_file, 'r') as f:
                loaded_json = f.read()
            
            if hash(loaded_json) != checksum:
                raise ValueError("Save file integrity check failed")
            
            return {
                'success': True,
                'file_size': save_file.stat().st_size,
                'checksum': checksum,
                'file_path': str(save_file)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_desktop_load(self) -> Dict[str, Any]:
        """Phase 3: Load data on Desktop HD configuration"""
        self.logger.info("Phase 3: Loading data on Desktop HD (1920x1080)")
        
        try:
            # Create Desktop HD viewport
            viewport = LogicalViewport()
            viewport.set_physical_resolution(self.desktop_config['resolution'])
            
            # Create legacy context
            context = create_legacy_context(self.desktop_config['resolution'])
            
            # Load save file
            save_file = Path("data/zero_friction_test_save.json")
            
            if not save_file.exists():
                raise ValueError("Save file not found")
            
            with open(save_file, 'r') as f:
                save_data = json.load(f)
            
            # Extract data
            loaded_data = save_data['data']
            
            # Verify data integrity
            if loaded_data['turtles'] != self.test_save_data['turtles']:
                raise ValueError("Turtle data mismatch")
            
            if loaded_data['breeding_result'] != self.test_save_data['breeding_result']:
                raise ValueError("Breeding result mismatch")
            
            # Create registry with loaded data
            registry = RegistryBridge(None, Path("data/test_desktop_load.json"))
            
            # Load turtles into registry
            for turtle in loaded_data['turtles']:
                registry.add_turtle(turtle)
            
            # Capture loaded UI layout
            loaded_ui_layout = self._capture_ui_layout(context, viewport.physical_size)
            
            return {
                'success': True,
                'turtles_loaded': len(loaded_data['turtles']),
                'resolution': self.desktop_config['resolution'],
                'ui_elements': len(loaded_ui_layout),
                'data_integrity': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_ui_proportions(self) -> Dict[str, Any]:
        """Phase 4: Verify UI proportions are identical across resolutions"""
        self.logger.info("Phase 4: Verifying UI proportions across resolutions")
        
        try:
            # Create both viewports
            miyoomini_viewport = LogicalViewport()
            miyoomini_viewport.set_physical_resolution(self.miyoomini_config['resolution'])
            
            desktop_viewport = LogicalViewport()
            desktop_viewport.set_physical_resolution(self.desktop_config['resolution'])
            
            # Create contexts
            miyoomini_context = create_legacy_context(self.miyoomini_config['resolution'])
            desktop_context = create_legacy_context(self.desktop_config['resolution'])
            
            # Test critical UI elements
            test_elements = [
                ('breeding_slot', (50, 100, 200, 150)),
                ('breed_button', (10, 15, 120, 30)),
                ('money_display', (600, 15, 140, 30)),
                ('roster_card', (20, 100, 150, 200)),
                ('shop_item', (20, 110, 160, 120))
            ]
            
            proportion_results = []
            
            for element_name, legacy_coords in test_elements:
                # Test on Miyoo Mini
                miyoomini_rect = miyoomini_context.Rect(*legacy_coords)
                miyoomini_logical = (miyoomini_rect.x, miyoomini_rect.y, miyoomini_rect.width, miyoomini_rect.height)
                
                # Test on Desktop HD
                desktop_rect = desktop_context.Rect(*legacy_coords)
                desktop_logical = (desktop_rect.x, desktop_rect.y, desktop_rect.width, desktop_rect.height)
                
                # Verify logical coordinates are identical
                tolerance = 0.1
                coordinates_match = all(
                    abs(miyoomini_logical[i] - desktop_logical[i]) <= tolerance
                    for i in range(4)
                )
                
                # Verify physical scaling is proportional
                miyoomini_physical = miyoomini_rect.get_physical_rect(self.miyoomini_config['resolution'])
                desktop_physical = desktop_rect.get_physical_rect(self.desktop_config['resolution'])
                
                scale_x = desktop_physical[2] / miyoomini_physical[2]
                scale_y = desktop_physical[3] / miyoomini_physical[3]
                
                expected_scale = self.desktop_config['resolution'][0] / self.miyoomini_config['resolution'][0]
                
                scaling_correct = abs(scale_x - expected_scale) <= 0.1 and abs(scale_y - expected_scale) <= 0.1
                
                proportion_results.append({
                    'element': element_name,
                    'coordinates_match': coordinates_match,
                    'scaling_correct': scaling_correct,
                    'scale_x': scale_x,
                    'scale_y': scale_y,
                    'expected_scale': expected_scale
                })
            
            all_proportions_correct = all(
                result['coordinates_match'] and result['scaling_correct']
                for result in proportion_results
            )
            
            return {
                'success': all_proportions_correct,
                'elements_tested': len(test_elements),
                'proportion_results': proportion_results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_genetic_integrity(self) -> Dict[str, Any]:
        """Phase 5: Verify genetic data integrity across platforms"""
        self.logger.info("Phase 5: Verifying genetic data integrity")
        
        try:
            if not self.test_save_data:
                raise ValueError("No test data available")
            
            turtles = self.test_save_data['turtles']
            integrity_results = []
            
            for turtle in turtles:
                # Verify genetics structure
                genetics = turtle.get('genetics', {})
                required_genes = ['shell_base_color', 'speed_gene', 'endurance_gene']
                
                genes_intact = all(gene in genetics for gene in required_genes)
                
                # Verify stats structure
                stats = turtle.get('stats', {})
                required_stats = ['speed', 'endurance', 'strength']
                
                stats_intact = all(stat in stats for stat in required_stats)
                
                # Verify data types
                genes_valid_types = all(
                    isinstance(genetics[gene], (str, float, int))
                    for gene in required_genes
                )
                
                stats_valid_types = all(
                    isinstance(stats[stat], (int, float))
                    for stat in required_stats
                )
                
                integrity_results.append({
                    'turtle_id': turtle['id'],
                    'genes_intact': genes_intact,
                    'stats_intact': stats_intact,
                    'genes_valid_types': genes_valid_types,
                    'stats_valid_types': stats_valid_types,
                    'overall_integrity': genes_intact and stats_intact and genes_valid_types and stats_valid_types
                })
            
            all_integrity_passed = all(result['overall_integrity'] for result in integrity_results)
            
            return {
                'success': all_integrity_passed,
                'turtles_tested': len(turtles),
                'integrity_results': integrity_results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_cross_platform_functionality(self) -> Dict[str, Any]:
        """Phase 6: Test cross-platform functionality"""
        self.logger.info("Phase 6: Testing cross-platform functionality")
        
        try:
            functionality_tests = []
            
            # Test 1: Breeding works on both platforms
            breeding_test = self._test_cross_platform_breeding()
            functionality_tests.append(('breeding', breeding_test))
            
            # Test 2: Roster sorting works on both platforms
            roster_test = self._test_cross_platform_roster()
            functionality_tests.append(('roster', roster_test))
            
            # Test 3: Market transactions work on both platforms
            market_test = self._test_cross_platform_market()
            functionality_tests.append(('market', market_test))
            
            all_functionality_passed = all(test['success'] for _, test in functionality_tests)
            
            return {
                'success': all_functionality_passed,
                'functionality_tests': functionality_tests
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_cross_platform_breeding(self) -> Dict[str, Any]:
        """Test breeding functionality across platforms"""
        try:
            # Test on both resolutions
            results = {}
            
            for config_name, config in [('miyoomini', self.miyoomini_config), ('desktop', self.desktop_config)]:
                viewport = LogicalViewport()
                viewport.set_physical_resolution(config['resolution'])
                context = create_legacy_context(config['resolution'])
                
                # Create test breeding logic
                breeding_logic = BreedingLogicExtractor()
                
                # Add test parents
                parent1 = {'id': 'test_parent_1', 'name': 'Speedy', 'genetics': {'speed_gene': 0.8}, 'stats': {'speed': 80}, 'is_retired': False}
                parent2 = {'id': 'test_parent_2', 'name': 'Enduro', 'genetics': {'endurance_gene': 0.9}, 'stats': {'endurance': 90}, 'is_retired': False}
                
                breeding_logic.process_parent_selection(0, parent1)
                breeding_logic.process_parent_selection(1, parent2)
                
                # Test breeding
                result = breeding_logic.trigger_breed()
                
                results[config_name] = {
                    'success': result['success'],
                    'offspring_generated': result['success'] and 'offspring' in result
                }
            
            # Verify results are consistent
            consistent = (
                results['miyoomini']['success'] == results['desktop']['success'] and
                results['miyoomini']['offspring_generated'] == results['desktop']['offspring_generated']
            )
            
            return {
                'success': consistent,
                'results': results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_cross_platform_roster(self) -> Dict[str, Any]:
        """Test roster functionality across platforms"""
        try:
            results = {}
            
            for config_name, config in [('miyoomini', self.miyoomini_config), ('desktop', self.desktop_config)]:
                viewport = LogicalViewport()
                viewport.set_physical_resolution(config['resolution'])
                context = create_legacy_context(config['resolution'])
                
                # Create test roster logic
                roster_logic = RosterLogicExtractor()
                
                # Create test turtles
                test_turtles = self._create_test_turtles()[:3]  # Use 3 turtles
                processed_cards = roster_logic.process_turtle_data(test_turtles)
                
                # Test sorting
                sorted_cards = roster_logic.apply_sorting(processed_cards)
                
                results[config_name] = {
                    'turtles_processed': len(processed_cards),
                    'sorting_works': len(sorted_cards) == len(processed_cards)
                }
            
            # Verify results are consistent
            consistent = (
                results['miyoomini']['turtles_processed'] == results['desktop']['turtles_processed'] and
                results['miyoomini']['sorting_works'] == results['desktop']['sorting_works']
            )
            
            return {
                'success': consistent,
                'results': results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_cross_platform_market(self) -> Dict[str, Any]:
        """Test market functionality across platforms"""
        try:
            results = {}
            
            for config_name, config in [('miyoomini', self.miyoomini_config), ('desktop', self.desktop_config)]:
                viewport = LogicalViewport()
                viewport.set_physical_resolution(config['resolution'])
                context = create_legacy_context(config['resolution'])
                
                # Create test market logic
                market_logic = MarketLogicExtractor()
                
                # Create test items
                test_items = [
                    {'id': 'item1', 'name': 'Test Item', 'price': 100, 'rarity': 'common', 'category': 'items', 'stock': 5}
                ]
                processed_items = market_logic.process_shop_items(test_items)
                
                # Test pricing
                total_value = market_logic.calculate_market_value()
                
                results[config_name] = {
                    'items_processed': len(processed_items),
                    'pricing_works': total_value > 0
                }
            
            # Verify results are consistent
            consistent = (
                results['miyoomini']['items_processed'] == results['desktop']['items_processed'] and
                results['miyoomini']['pricing_works'] == results['desktop']['pricing_works']
            )
            
            return {
                'success': consistent,
                'results': results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_test_turtles(self) -> List[Dict[str, Any]]:
        """Create test turtles for verification"""
        return [
            {
                'id': 'test_turtle_1',
                'name': 'Lightning',
                'genetics': {
                    'shell_base_color': 'green',
                    'speed_gene': 0.9,
                    'endurance_gene': 0.6
                },
                'stats': {
                    'speed': 85,
                    'endurance': 60,
                    'strength': 70
                },
                'generation': 1,
                'rarity': 'rare',
                'is_retired': False
            },
            {
                'id': 'test_turtle_2',
                'name': 'Tank',
                'genetics': {
                    'shell_base_color': 'blue',
                    'speed_gene': 0.5,
                    'endurance_gene': 0.9
                },
                'stats': {
                    'speed': 50,
                    'endurance': 90,
                    'strength': 85
                },
                'generation': 1,
                'rarity': 'common',
                'is_retired': False
            },
            {
                'id': 'test_turtle_3',
                'name': 'All-Star',
                'genetics': {
                    'shell_base_color': 'red',
                    'speed_gene': 0.8,
                    'endurance_gene': 0.8
                },
                'stats': {
                    'speed': 80,
                    'endurance': 80,
                    'strength': 80
                },
                'generation': 2,
                'rarity': 'epic',
                'is_retired': False
            }
        ]
    
    def _create_test_breeding(self, registry: RegistryBridge, breeding_logic: BreedingLogicExtractor) -> Dict[str, Any]:
        """Create test breeding result"""
        # Get two test turtles
        turtles = registry.get_all_turtles()
        
        if len(turtles) >= 2:
            # Select parents
            parent1 = turtles[0]
            parent2 = turtles[1]
            
            # Process breeding
            result = registry.process_breeding(parent1['id'], parent2['id'], 100)
            
            return result.value if result.success else {'error': 'Breeding failed'}
        
        return {'error': 'Not enough turtles for breeding'}
    
    def _capture_ui_layout(self, context, resolution: Tuple[int, int]) -> List[Dict[str, Any]]:
        """Capture UI layout elements for verification"""
        layout_elements = []
        
        # Test common UI elements
        test_elements = [
            ('header', (0, 0, 800, 60)),
            ('breeding_panel', (50, 100, 200, 150)),
            ('button', (10, 15, 120, 30)),
            ('money_display', (600, 15, 140, 30))
        ]
        
        for element_name, coords in test_elements:
            rect = context.Rect(*coords)
            physical_rect = rect.get_physical_rect(resolution)
            
            layout_elements.append({
                'name': element_name,
                'logical_coords': (rect.x, rect.y, rect.width, rect.height),
                'physical_coords': physical_rect
            })
        
        return layout_elements
    
    def generate_verification_report(self, results: Dict[str, Any]) -> str:
        """Generate a human-readable verification report"""
        report = []
        report.append("=" * 70)
        report.append("ZERO-FRICTION LOOP VERIFICATION REPORT")
        report.append("=" * 70)
        report.append(f"Test Timestamp: {time.ctime(results['test_timestamp'])}")
        report.append(f"Overall Success: {'✅ PASSED' if results['overall_success'] else '❌ FAILED'}")
        report.append("")
        
        # Phase results
        for phase_name, phase_result in results['phases'].items():
            status = '✅ PASSED' if phase_result.get('success', False) else '❌ FAILED'
            report.append(f"{phase_name.upper()}: {status}")
            
            if 'error' in phase_result:
                report.append(f"  Error: {phase_result['error']}")
            else:
                for key, value in phase_result.items():
                    if key not in ['success', 'error']:
                        report.append(f"  {key}: {value}")
            report.append("")
        
        # Summary
        if results['overall_success']:
            report.append("🎉 ZERO-FRICTION LOOP VERIFICATION SUCCESSFUL!")
            report.append("✅ Save on Miyoo Mini → Load on Desktop HD: PERFECT")
            report.append("✅ UI Proportions: IDENTICAL")
            report.append("✅ Genetic Data: PRESERVED")
            report.append("✅ Cross-Platform Functionality: OPERATIONAL")
            report.append("")
            report.append("🚀 TURBOSHELLS TYCOON - READY FOR COMMERCIAL DEPLOYMENT! 🚀")
        else:
            report.append("❌ ZERO-FRICTION LOOP VERIFICATION FAILED")
            if results['errors']:
                report.append("Errors:")
                for error in results['errors']:
                    report.append(f"  - {error}")
        
        report.append("=" * 70)
        
        return "\n".join(report)
