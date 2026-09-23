"""
Tier Enforcement Check for DGT Platform Architecture

Sprint B: Testing & CI Pipeline - Tier Enforcement Check
ADR 212: Zero-Regression automatic checks to prevent Tier-violation imports

Verifies that Tier 1 (Foundation) has Zero Dependencies on Tier 2 or 3,
maintaining the sovereign three-tier architecture.
"""

import ast
import sys
from pathlib import Path
from typing import List, Set, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class ImportViolation:
    """Represents a tier architecture violation"""
    file_path: str
    line_number: int
    import_statement: str
    from_tier: str
    to_tier: str
    violation_type: str


class TierEnforcementChecker:
    """
    Enforces DGT Platform's three-tier architecture:
    
    Tier 1: Foundation Layer (src/foundation/) - CANNOT import from Tier 2 or 3
    Tier 2: Engine Layer (src/engines/, src/apps/) - CANNOT import from Tier 3  
    Tier 3: Application Layer (genre-specific systems) - CAN import from Tier 1 and 2
    """
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.src_root = project_root / "src"
        self.violations: List[ImportViolation] = []
        
        # Define tier mappings
        self.tier_mappings = {
            "foundation": 1,
            "engines": 2, 
            "apps": 2,  # Apps are considered Engine layer
            "actors": 2,  # Actors are Engine layer
            "assets": 2,  # Assets are Engine layer
            "ui": 3,     # UI is Application layer
            "views": 3,  # Views are Application layer
            "models": 3, # Models are Application layer
            "logic": 3,  # Logic is Application layer
            "mechanics": 3, # Mechanics are Application layer
            "narrative": 3, # Narrative is Application layer
            "world": 3,   # World is Application layer
            "d20_core": 3, # D20 core is Application layer
            "game_loop": 3, # Game loop is Application layer
            "game_state": 3, # Game state is Application layer
            "main": 3,    # Main entry point is Application layer
        }
        
        # Files that are allowed to violate tiers (legacy compatibility)
        self.allowed_violations = {
            "src/foundation/legacy_bridge.py",  # Explicitly for legacy compatibility
            "src/foundation/utils/logger.py",   # Has conditional imports
        }
    
    def check_all_files(self) -> List[ImportViolation]:
        """Check all Python files for tier violations"""
        self.violations = []
        
        # Find all Python files in src directory
        python_files = list(self.src_root.rglob("*.py"))
        
        for file_path in python_files:
            self._check_file_tiers(file_path)
        
        return self.violations
    
    def _check_file_tiers(self, file_path: Path) -> None:
        """Check a single file for tier violations"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            # Determine which tier this file belongs to
            from_tier = self._get_file_tier(file_path)
            if from_tier is None:
                return  # Skip files not in tier system
            
            # Check all imports
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    self._check_import_node(file_path, node, from_tier)
                elif isinstance(node, ast.ImportFrom):
                    self._check_import_from_node(file_path, node, from_tier)
        
        except Exception as e:
            # Log parsing errors but don't fail the entire check
            print(f"Warning: Could not parse {file_path}: {e}")
    
    def _get_file_tier(self, file_path: Path) -> Optional[int]:
        """Determine which tier a file belongs to"""
        relative_path = file_path.relative_to(self.src_root)
        parts = relative_path.parts
        
        if not parts:
            return None
        
        # Check first directory part against tier mappings
        first_part = parts[0]
        return self.tier_mappings.get(first_part)
    
    def _check_import_node(self, file_path: Path, node: ast.Import, from_tier: int) -> None:
        """Check regular import statement for tier violations"""
        for alias in node.names:
            import_name = alias.name
            
            # Skip standard library and third-party imports
            if self._is_external_import(import_name):
                continue
            
            # Determine target tier
            to_tier = self._get_import_tier(import_name)
            
            if to_tier and self._is_violation(from_tier, to_tier):
                violation = ImportViolation(
                    file_path=str(file_path.relative_to(self.project_root)),
                    line_number=node.lineno,
                    import_statement=f"import {import_name}",
                    from_tier=f"Tier {from_tier}",
                    to_tier=f"Tier {to_tier}",
                    violation_type="Import violation"
                )
                self.violations.append(violation)
    
    def _check_import_from_node(self, file_path: Path, node: ast.ImportFrom, from_tier: int) -> None:
        """Check from-import statement for tier violations"""
        if node.module is None:
            return
        
        import_name = node.module
        
        # Skip standard library and third-party imports
        if self._is_external_import(import_name):
            return
        
        # Handle relative imports
        if import_name.startswith('.'):
            # Convert relative import to absolute for tier checking
            import_name = self._resolve_relative_import(file_path, import_name)
            if import_name is None:
                return
        
        # Determine target tier
        to_tier = self._get_import_tier(import_name)
        
        if to_tier and self._is_violation(from_tier, to_tier):
            import_names = ', '.join(name.name for name in node.names)
            violation = ImportViolation(
                file_path=str(file_path.relative_to(self.project_root)),
                line_number=node.lineno,
                import_statement=f"from {import_name} import {import_names}",
                from_tier=f"Tier {from_tier}",
                to_tier=f"Tier {to_tier}",
                violation_type="From-import violation"
            )
            self.violations.append(violation)
    
    def _is_external_import(self, import_name: str) -> bool:
        """Check if import is from standard library or third-party"""
        external_modules = {
            'ast', 'sys', 'os', 'pathlib', 'typing', 'dataclasses', 'enum',
            'random', 'math', 'time', 'json', 'pickle', 'collections',
            'itertools', 'functools', 'datetime', 're', 'string',
            'pydantic', 'loguru', 'rich', 'numpy', 'pillow', 'pytest',
            'hypothesis', 'grimp', 'import_linter'
        }
        
        return import_name in external_modules or not any(
            import_name.startswith(tier_dir) 
            for tier_dir in self.tier_mappings.keys()
        )
    
    def _get_import_tier(self, import_name: str) -> Optional[int]:
        """Determine which tier an import belongs to"""
        # Check if import starts with any tier directory
        for tier_dir, tier_num in self.tier_mappings.items():
            if import_name.startswith(tier_dir):
                return tier_num
        
        return None
    
    def _is_violation(self, from_tier: int, to_tier: int) -> bool:
        """Check if importing from one tier to another is a violation"""
        # Tier 1 cannot import from Tier 2 or 3
        if from_tier == 1 and to_tier in [2, 3]:
            return True
        
        # Tier 2 cannot import from Tier 3
        if from_tier == 2 and to_tier == 3:
            return True
        
        return False
    
    def _resolve_relative_import(self, file_path: Path, relative_import: str) -> Optional[str]:
        """Resolve relative import to absolute import name"""
        # Count leading dots to determine relative level
        dots = len(relative_import) - len(relative_import.lstrip('.'))
        if dots == 0:
            return None
        
        # Remove dots and get module part
        module_part = relative_import[dots:]
        
        # Get relative path from file location
        relative_path = file_path.relative_to(self.src_root)
        
        # Go up the directory structure based on dot count
        path_parts = list(relative_path.parts[:-1])  # Remove filename
        
        for _ in range(dots - 1):
            if path_parts:
                path_parts.pop()
        
        # Construct absolute import
        if path_parts:
            absolute_import = '.'.join(path_parts + [module_part]) if module_part else '.'.join(path_parts)
        else:
            absolute_import = module_part
        
        return absolute_import
    
    def generate_report(self) -> str:
        """Generate a detailed report of tier violations"""
        if not self.violations:
            return "✅ No tier violations found. Architecture is clean."
        
        report = ["🚨 TIER ARCHITECTURE VIOLATIONS DETECTED", ""]
        
        # Group violations by type
        violations_by_tier = {}
        for violation in self.violations:
            key = f"{violation.from_tier} → {violation.to_tier}"
            if key not in violations_by_tier:
                violations_by_tier[key] = []
            violations_by_tier[key].append(violation)
        
        for tier_transition, tier_violations in violations_by_tier.items():
            report.append(f"## {tier_transition} Violations ({len(tier_violations)})")
            
            for violation in tier_violations:
                # Check if this is an allowed violation
                file_path = violation.file_path
                if file_path in self.allowed_violations:
                    report.append(f"  ⚠️  **ALLOWED**: {file_path}:{violation.line_number}")
                    report.append(f"      `{violation.import_statement}`")
                    report.append(f"      Reason: Legacy compatibility")
                else:
                    report.append(f"  ❌ **VIOLATION**: {file_path}:{violation.line_number}")
                    report.append(f"      `{violation.import_statement}`")
                    report.append(f"      Type: {violation.violation_type}")
            
            report.append("")
        
        # Summary
        report.append("## Summary")
        report.append(f"Total violations: {len(self.violations)}")
        report.append(f"Allowed violations: {len([v for v in self.violations if v.file_path in self.allowed_violations])}")
        report.append(f"Actual violations: {len([v for v in self.violations if v.file_path not in self.allowed_violations])}")
        
        return "\n".join(report)


def run_tier_enforcement_check(project_root: Optional[Path] = None) -> Tuple[int, str]:
    """
    Run tier enforcement check and return exit code and report.
    
    Returns:
        Tuple of (exit_code, report_text)
        exit_code: 0 for success, 1 for violations found
    """
    if project_root is None:
        project_root = Path.cwd()
    
    checker = TierEnforcementChecker(project_root)
    violations = checker.check_all_files()
    
    # Filter out allowed violations for exit code
    actual_violations = [
        v for v in violations 
        if v.file_path not in checker.allowed_violations
    ]
    
    report = checker.generate_report()
    
    return (1 if actual_violations else 0, report)


if __name__ == "__main__":
    # Run as standalone script
    exit_code, report = run_tier_enforcement_check()
    print(report)
    sys.exit(exit_code)
