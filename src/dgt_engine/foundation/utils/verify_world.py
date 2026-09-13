"""
Schema Validator: World Integrity Checker

Enterprise-grade tooling for procedural factory validation.
Acts as a "Skeptical Auditor" to ensure narrative consistency.

Usage:
    python -m src.utils.verify_world [--fix] [--verbose]

ROI: Prevents "plot holes" before you hit play.
"""

import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass

from loguru import logger
from pydantic import ValidationError

from dgt_engine.foundation.protocols import WorldStateSnapshot, EntityStateProtocol


@dataclass
class ValidationIssue:
    """Represents a validation issue found."""
    severity: str  # "error", "warning", "info"
    category: str  # "connectivity", "schema", "logic", "balance"
    message: str
    location: Optional[str] = None
    suggestion: Optional[str] = None


class WorldValidator:
    """
    Comprehensive world validation system.
    
    This is your "Skeptical Auditor" - catches plot holes, orphaned rooms,
    invalid goals, and schema inconsistencies before runtime.
    """
    
    def __init__(self):
        """Initialize validator with factories."""
        self.world_factory = WorldFactory()
        self.character_factory = CharacterFactory()
        self.intent_library = create_default_intent_library()
        self.issues: List[ValidationIssue] = []
        
        logger.info("World Validator initialized - ready to audit")
    
    def validate_all(self, fix_issues: bool = False) -> List[ValidationIssue]:
        """
        Run comprehensive validation on all world components.
        
        Args:
            fix_issues: Whether to attempt automatic fixes
            
        Returns:
            List of validation issues found
        """
        self.issues.clear()
        
        logger.info("Starting comprehensive world validation...")
        
        # Validate world factory
        self._validate_world_factory()
        
        # Validate character factory
        self._validate_character_factory()
        
        # Validate intent library
        self._validate_intent_library()
        
        # Validate scenario integrity
        self._validate_scenarios()
        
        # Test factory integration
        self._validate_factory_integration()
        
        # Check for logical consistency
        self._validate_logical_consistency()
        
        # Attempt fixes if requested
        if fix_issues:
            self._attempt_fixes()
        
        # Report results
        self._report_results()
        
        return self.issues
    
    def _validate_world_factory(self):
        """Validate world factory templates and connectivity."""
        logger.info("Validating World Factory...")
        
        # Check all templates
        for location_id, template in self.world_factory.templates.items():
            # Validate template structure
            if not template.name:
                self.issues.append(ValidationIssue(
                    severity="error",
                    category="schema",
                    message=f"Location {location_id} has no name",
                    location=location_id,
                    suggestion="Add a descriptive name to the template"
                ))
            
            if not template.description:
                self.issues.append(ValidationIssue(
                    severity="warning",
                    category="schema", 
                    message=f"Location {location_id} has no description",
                    location=location_id,
                    suggestion="Add a description for player context"
                ))
            
            # Validate connections
            for direction, target_id in template.connections.items():
                if target_id not in self.world_factory.templates:
                    self.issues.append(ValidationIssue(
                        severity="error",
                        category="connectivity",
                        message=f"Location {location_id} has orphaned exit: {direction} -> {target_id}",
                        location=location_id,
                        suggestion=f"Create {target_id} template or remove exit"
                    ))
        
        # Check for isolated locations
        connected_locations = set()
        for template in self.world_factory.templates.values():
            connected_locations.update(template.connections.values())
        
        for location_id in self.world_factory.templates:
            if location_id not in connected_locations and location_id != "tavern":
                self.issues.append(ValidationIssue(
                    severity="warning",
                    category="connectivity",
                    message=f"Location {location_id} is isolated (no incoming connections)",
                    location=location_id,
                    suggestion="Add an exit from another location to this one"
                ))
    
    def _validate_character_factory(self):
        """Validate character factory archetypes and balance."""
        logger.info("Validating Character Factory...")
        
        # Check all archetypes
        for archetype_name in self.character_factory.list_archetypes():
            archetype = self.character_factory.get_archetype_info(archetype_name)
            
            # Validate stat balance
            total_stats = sum(archetype.stat_array.values())
            if total_stats < 40 or total_stats > 80:
                self.issues.append(ValidationIssue(
                    severity="warning",
                    category="balance",
                    message=f"Archetype {archetype_name} has unbalanced stats: {total_stats} total",
                    location=archetype_name,
                    suggestion="Aim for 40-80 total stat points"
                ))
            
            # Check for missing required stats
            required_stats = ["strength", "dexterity", "intelligence", "charisma"]
            for stat in required_stats:
                if stat not in archetype.stat_array:
                    self.issues.append(ValidationIssue(
                        severity="error",
                        category="schema",
                        message=f"Archetype {archetype_name} missing required stat: {stat}",
                        location=archetype_name,
                        suggestion=f"Add {stat} to stat_array"
                    ))
            
            # Validate skill proficiencies
            if not archetype.skill_proficiencies:
                self.issues.append(ValidationIssue(
                    severity="warning",
                    category="schema",
                    message=f"Archetype {archetype_name} has no skill proficiencies",
                    location=archetype_name,
                    suggestion="Add relevant skill proficiencies"
                ))
        
        # Check for stat balance across archetypes
        stat_ranges = self._calculate_stat_ranges()
        for stat, (min_val, max_val) in stat_ranges.items():
            if max_val - min_val > 10:
                self.issues.append(ValidationIssue(
                    severity="info",
                    category="balance",
                    message=f"Large stat disparity in {stat}: {min_val}-{max_val}",
                    suggestion="Consider balancing stat distributions"
                ))
    
    def _validate_intent_library(self):
        """Validate intent library completeness and consistency."""
        logger.info("Validating Intent Library...")
        
        valid_intents = set(self.intent_library.intents.keys())
        
        # Check for required intents
        required_intents = ["investigate", "force", "charm", "stealth", "leave_area"]
        for intent in required_intents:
            if intent not in valid_intents:
                self.issues.append(ValidationIssue(
                    severity="error",
                    category="schema",
                    message=f"Missing required intent: {intent}",
                    suggestion="Add intent definition to library"
                ))
        
        # Check intent definitions
        for intent_id, intent_data in self.intent_library.intents.items():
            if not intent_data.get("definition"):
                self.issues.append(ValidationIssue(
                    severity="warning",
                    category="schema",
                    message=f"Intent {intent_id} has no definition",
                    location=intent_id,
                    suggestion="Add a clear definition for the intent"
                ))
            
            examples = intent_data.get("examples", [])
            if not examples:
                self.issues.append(ValidationIssue(
                    severity="warning",
                    category="schema",
                    message=f"Intent {intent_id} has no examples",
                    location=intent_id,
                    suggestion="Add example phrases for training"
                ))
    
    def _validate_scenarios(self):
        """Validate scenario integrity and goal consistency."""
        logger.info("Validating Scenarios...")
        
        for scenario_id, scenario in self.world_factory.scenarios.items():
            sequence = scenario.get("sequence", [])
            
            if not sequence:
                self.issues.append(ValidationIssue(
                    severity="error",
                    category="schema",
                    message=f"Scenario {scenario_id} has no sequence",
                    location=scenario_id,
                    suggestion="Add a sequence of locations"
                ))
                continue
            
            # Validate each location in sequence
            for i, entry in enumerate(sequence):
                location_id = entry.get("id")
                if not location_id:
                    self.issues.append(ValidationIssue(
                        severity="error",
                        category="schema",
                        message=f"Scenario {scenario_id} entry {i} has no id",
                        location=f"{scenario_id}[{i}]",
                        suggestion="Add location id to sequence entry"
                    ))
                    continue
                
                # Check if location exists in templates
                if location_id not in self.world_factory.templates:
                    self.issues.append(ValidationIssue(
                        severity="warning",
                        category="connectivity",
                        message=f"Scenario {scenario_id} references unknown location: {location_id}",
                        location=f"{scenario_id}[{i}]",
                        suggestion="Create location template or update scenario"
                    ))
                
                # Validate objectives
                objectives = entry.get("objectives", [])
                for j, obj in enumerate(objectives):
                    required_intent = obj.get("required_intent")
                    if required_intent and required_intent not in self.intent_library.intents:
                        self.issues.append(ValidationIssue(
                            severity="error",
                            category="logic",
                            message=f"Objective references unknown intent: {required_intent}",
                            location=f"{scenario_id}[{i}].objectives[{j}]",
                            suggestion=f"Update intent or add to library"
                        ))
    
    def _validate_factory_integration(self):
        """Test that factories work together correctly."""
        logger.info("Validating Factory Integration...")
        
        try:
            # Test character creation
            for archetype_name in self.character_factory.list_archetypes():
                character = self.character_factory.create(archetype_name)
                if not character:
                    self.issues.append(ValidationIssue(
                        severity="error",
                        category="logic",
                        message=f"Failed to create character: {archetype_name}",
                        location=archetype_name,
                        suggestion="Check character factory implementation"
                    ))
            
            # Test location creation
            for location_id in self.world_factory.templates:
                room = self.world_factory.get_location(location_id)
                if not room:
                    self.issues.append(ValidationIssue(
                        severity="error",
                        category="logic",
                        message=f"Failed to create location: {location_id}",
                        location=location_id,
                        suggestion="Check world factory implementation"
                    ))
            
            # Test scenario loading
            test_state = GameState()
            for scenario_id in self.world_factory.scenarios:
                self.world_factory.load_scenario(scenario_id, test_state)
                if not test_state.rooms:
                    self.issues.append(ValidationIssue(
                        severity="error",
                        category="logic",
                        message=f"Failed to load scenario: {scenario_id}",
                        location=scenario_id,
                        suggestion="Check scenario loading implementation"
                    ))
                test_state = GameState()  # Reset for next test
                
        except Exception as e:
            self.issues.append(ValidationIssue(
                severity="error",
                category="logic",
                message=f"Factory integration failed: {str(e)}",
                suggestion="Check factory implementations for compatibility"
            ))
    
    def _validate_logical_consistency(self):
        """Check for logical inconsistencies across the world."""
        logger.info("Validating Logical Consistency...")
        
        # Check for circular dependencies in exits
        for location_id, template in self.world_factory.templates.items():
            for direction, target_id in template.connections.items():
                # Check if target has a return path
                target_template = self.world_factory.templates.get(target_id)
                if target_template:
                    opposite_directions = {"north": "south", "east": "west", "up": "down"}
                    opposite = opposite_directions.get(direction)
                    if opposite and target_template.connections.get(opposite) != location_id:
                        self.issues.append(ValidationIssue(
                            severity="info",
                            category="logic",
                            message=f"Asymmetric connection: {location_id}.{direction} -> {target_id} but no {opposite} back",
                            location=f"{location_id}->{target_id}",
                            suggestion="Add return path or make asymmetry intentional"
                        ))
        
        # Check for goal feasibility
        for scenario_id, scenario in self.world_factory.scenarios.items():
            sequence = scenario.get("sequence", [])
            for entry in sequence:
                objectives = entry.get("objectives", [])
                location_id = entry.get("id")
                location_template = self.world_factory.templates.get(location_id, {})
                
                for obj in objectives:
                    required_intent = obj.get("required_intent")
                    target_tags = obj.get("target_tags", [])
                    
                    # Check if targets exist in location
                    if target_tags:
                        npcs = location_template.get("initial_npcs", [])
                        props = location_template.get("props", [])
                        
                        available_targets = npcs + props
                        matching_targets = [
                            target for target in available_targets
                            if any(tag.lower() in target.lower() for tag in target_tags)
                        ]
                        
                        if not matching_targets:
                            self.issues.append(ValidationIssue(
                                severity="warning",
                                category="logic",
                                message=f"Goal targets not found in location: {target_tags}",
                                location=f"{scenario_id}:{location_id}",
                                suggestion="Add targets to location or update goal tags"
                            ))
    
    def _calculate_stat_ranges(self) -> Dict[str, Tuple[int, int]]:
        """Calculate min/max ranges for each stat across archetypes."""
        stats = {"strength": [], "dexterity": [], "intelligence": [], "charisma": []}
        
        for archetype_name in self.character_factory.list_archetypes():
            archetype = self.character_factory.get_archetype_info(archetype_name)
            for stat, value in archetype.stat_array.items():
                stats[stat].append(value)
        
        return {stat: (min(values), max(values)) for stat, values in stats.items()}
    
    def _attempt_fixes(self):
        """Attempt to automatically fix non-critical issues."""
        logger.info("Attempting automatic fixes...")
        
        fixes_attempted = 0
        fixes_successful = 0
        
        for issue in self.issues:
            if issue.severity == "warning" and issue.suggestion:
                # Only attempt safe fixes
                if "Add description" in issue.suggestion:
                    # This would require more sophisticated logic
                    fixes_attempted += 1
                    # Skip for now - would need AI to generate descriptions
                elif "Add relevant skill proficiencies" in issue.suggestion:
                    # Could add default skills based on highest stat
                    fixes_attempted += 1
                    # Skip for now - needs archetype-specific logic
        
        logger.info(f"Attempted {fixes_attempted} fixes, {fixes_successful} successful")
    
    def _report_results(self):
        """Report validation results."""
        if not self.issues:
            logger.info("✅ All validations passed! World is ready.")
            return
        
        # Group by severity
        errors = [i for i in self.issues if i.severity == "error"]
        warnings = [i for i in self.issues if i.severity == "warning"]
        info = [i for i in self.issues if i.severity == "info"]
        
        print(f"\n🔍 World Validation Results:")
        print(f"   ❌ Errors: {len(errors)}")
        print(f"   ⚠️  Warnings: {len(warnings)}")
        print(f"   ℹ️  Info: {len(info)}")
        
        if errors:
            print(f"\n❌ Critical Issues:")
            for error in errors[:10]:  # Limit output
                print(f"   • {error.message}")
                if error.location:
                    print(f"     Location: {error.location}")
                if error.suggestion:
                    print(f"     Suggestion: {error.suggestion}")
        
        if warnings:
            print(f"\n⚠️  Warnings:")
            for warning in warnings[:10]:  # Limit output
                print(f"   • {warning.message}")
                if error.suggestion:
                    print(f"     Suggestion: {error.suggestion}")
        
        if info:
            print(f"\nℹ️  Information:")
            for info_item in info[:5]:  # Limit output
                print(f"   • {info_item.message}")


def main():
    """CLI entry point for world validation."""
    parser = argparse.ArgumentParser(description="Validate world integrity")
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Attempt to automatically fix issues"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed validation output"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    if args.verbose:
        logger.add(
            lambda msg: print(msg, end=""),
            level="DEBUG",
            format="{time:HH:mm:ss} | {level} | {message}"
        )
    else:
        logger.add(
            lambda msg: print(msg, end=""),
            level="INFO",
            format="{level} | {message}"
        )
    
    # Run validation
    validator = WorldValidator()
    issues = validator.validate_all(fix_issues=args.fix)
    
    # Return appropriate exit code
    errors = [i for i in issues if i.severity == "error"]
    return 1 if errors else 0


if __name__ == "__main__":
    exit(main())
