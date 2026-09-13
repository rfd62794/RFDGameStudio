"""
Drift Code Pruning Tool

Identifies and removes terminal-only logic drift code that violates
the single source of truth principle.
"""

import os
import ast
from pathlib import Path
from typing import List, Dict, Set, Tuple
import re

from loguru import logger


class DriftCodeAnalyzer:
    """Analyzes codebase for drift violations."""
    
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.violations: List[Dict] = []
        
        # Patterns that indicate drift violations
        self.drift_patterns = {
            "terminal_rpg": [
                r"terminal_rpg\.py",
                r"class.*Terminal.*Game",
                r"def.*terminal.*game",
                r"run.*terminal"
            ],
            "dual_logic": [
                r"if.*terminal.*else.*gui",
                r"mode.*==.*terminal",
                r"view_mode.*terminal",
                r"terminal.*mode"
            ],
            "separate_state": [
                r"game_state.*terminal",
                r"terminal.*state",
                r"GameState.*terminal"
            ],
            "redundant_engines": [
                r"SemanticResolver.*terminal",
                r"Arbiter.*terminal",
                r"Chronicler.*terminal"
            ]
        }
        
        # Files that should be pruned
        self.prune_candidates = {
            "terminal_rpg.py",
            "run_game.py",  # Replaced by unified simulator
            "game_loop.py",  # Contains old terminal logic
            "handheld_mode.py"  # If exists
        }
    
    def analyze_file(self, file_path: Path) -> Dict:
        """Analyze a single file for drift violations."""
        violations = {
            "file": str(file_path),
            "drift_violations": [],
            "prune_candidate": file_path.name in self.prune_candidates,
            "severity": "low"
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for drift patterns
            for category, patterns in self.drift_patterns.items():
                for pattern in patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        violations["drift_violations"].append({
                            "category": category,
                            "pattern": pattern,
                            "line": line_num,
                            "match": match.group()
                        })
            
            # Determine severity
            if violations["prune_candidate"]:
                violations["severity"] = "high"
            elif len(violations["drift_violations"]) > 5:
                violations["severity"] = "medium"
            elif violations["drift_violations"]:
                violations["severity"] = "low"
            
        except Exception as e:
            logger.error(f"❌ Error analyzing {file_path}: {e}")
            violations["error"] = str(e)
        
        return violations
    
    def scan_codebase(self) -> List[Dict]:
        """Scan entire codebase for drift violations."""
        logger.info(f"🔍 Scanning {self.root_dir} for drift violations...")
        
        all_violations = []
        
        # Scan Python files
        for py_file in self.root_dir.rglob("*.py"):
            # Skip certain directories
            if any(skip in str(py_file) for skip in ["__pycache__", ".git", "venv", "env"]):
                continue
            
            violations = self.analyze_file(py_file)
            if violations["drift_violations"] or violations["prune_candidate"]:
                all_violations.append(violations)
        
        self.violations = all_violations
        return all_violations
    
    def generate_prune_report(self) -> str:
        """Generate a report of files to prune."""
        report = []
        report.append("# Drift Code Pruning Report")
        report.append("=" * 50)
        report.append("")
        
        # Summary
        high_severity = [v for v in self.violations if v["severity"] == "high"]
        medium_severity = [v for v in self.violations if v["severity"] == "medium"]
        low_severity = [v for v in self.violations if v["severity"] == "low"]
        
        report.append("## Summary")
        report.append(f"- High severity (prune candidates): {len(high_severity)}")
        report.append(f"- Medium severity: {len(medium_severity)}")
        report.append(f"- Low severity: {len(low_severity)}")
        report.append("")
        
        # High severity - immediate prune
        if high_severity:
            report.append("## HIGH SEVERITY - Immediate Prune Required")
            report.append("")
            for violation in high_severity:
                report.append(f"### {violation['file']}")
                report.append("**Status**: PRUNE CANDIDATE")
                report.append("**Reason**: Legacy terminal-only code")
                report.append("")
        
        # Medium severity
        if medium_severity:
            report.append("## MEDIUM SEVERITY - Review Required")
            report.append("")
            for violation in medium_severity:
                report.append(f"### {violation['file']}")
                report.append(f"**Violations**: {len(violation['drift_violations'])}")
                for v in violation['drift_violations']:
                    report.append(f"- Line {v['line']}: {v['category']} - `{v['match']}`")
                report.append("")
        
        # Low severity
        if low_severity:
            report.append("## LOW SEVERITY - Minor Issues")
            report.append("")
            for violation in low_severity:
                report.append(f"### {violation['file']}")
                report.append(f"**Violations**: {len(violation['drift_violations'])}")
                for v in violation['drift_violations']:
                    report.append(f"- Line {v['line']}: {v['category']}")
                report.append("")
        
        return "\n".join(report)
    
    def create_prune_script(self) -> str:
        """Generate a script to safely prune drift files."""
        script = []
        script.append("#!/usr/bin/env python3")
        script.append('"""')
        script.append("Auto-generated drift code pruning script.")
        script.append("")
        script.append("WARNING: This will permanently delete files!")
        script.append("Review the output first before running.")
        script.append('"""')
        script.append("")
        script.append("import os")
        script.append("import shutil")
        script.append("from pathlib import Path")
        script.append("")
        script.append("def main():")
        script.append('    print("Pruning drift code files...")')
        script.append("")
        
        # Add prune candidates
        high_severity = [v for v in self.violations if v["severity"] == "high"]
        for violation in high_severity:
            file_path = Path(violation['file'])
            script.append(f'    # Prune: {file_path.name}')
            script.append(f'    file_path = Path("{file_path}")')
            script.append('    if file_path.exists():')
            script.append('        print(f"Deleting: {file_path}")')
            script.append('        # file_path.unlink()  # Uncomment to actually delete')
            script.append('    else:')
            script.append('        print(f"File not found: {file_path}")')
            script.append("")
        
        script.append('    print("Pruning complete")')
        script.append("")
        script.append("if __name__ == '__main__':")
        script.append("    main()")
        
        return "\n".join(script)


def main():
    """Main function to run drift analysis."""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    # Get root directory
    root_dir = Path(__file__).parent.parent
    
    print("Drift Code Analysis Tool")
    print("=" * 40)
    
    # Analyze codebase
    analyzer = DriftCodeAnalyzer(root_dir)
    violations = analyzer.scan_codebase()
    
    # Generate reports
    prune_report = analyzer.generate_prune_report()
    prune_script = analyzer.create_prune_script()
    
    # Save reports
    report_path = root_dir / "DRIFT_ANALYSIS_REPORT.md"
    script_path = root_dir / "tools" / "prune_drift_files.py"
    
    with open(report_path, 'w') as f:
        f.write(prune_report)
    
    with open(script_path, 'w') as f:
        f.write(prune_script)
    
    print(f"Report saved to: {report_path}")
    print(f"Prune script saved to: {script_path}")
    print("")
    
    # Show summary
    high_severity = [v for v in violations if v["severity"] == "high"]
    medium_severity = [v for v in violations if v["severity"] == "medium"]
    low_severity = [v for v in violations if v["severity"] == "low"]
    
    print("Summary:")
    print(f"  High severity (prune): {len(high_severity)}")
    print(f"  Medium severity: {len(medium_severity)}")
    print(f"  Low severity: {len(low_severity)}")
    print("")
    
    if high_severity:
        print("Files to prune:")
        for violation in high_severity:
            print(f"  - {Path(violation['file']).name}")
        print("")
        print("WARNING: Review the report and script before running prune!")
        print(f"   Report: {report_path}")
        print(f"   Script: {script_path}")


if __name__ == "__main__":
    main()
