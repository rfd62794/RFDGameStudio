#!/usr/bin/env python3
"""
Test Auto-Detection System - Demonstrate self-aware swarm
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.tools.apj.agents.project_analyzer import PROJECT_ANALYZER


def test_auto_detection():
    """Test auto-detection of work from project documentation"""
    
    print("🔍 TESTING AUTO-DETECTION SYSTEM")
    print("=" * 60)
    
    # Analyze the project
    print("\n📋 Analyzing Project Documentation...")
    analysis = PROJECT_ANALYZER.analyze_project()
    
    # Show analysis results
    print(f"\n📊 Analysis Results:")
    print(f"• Issues Detected: {analysis['issues_detected']}")
    print(f"• Recommendations: {analysis['recommendations']}")
    print(f"• Critical Issues: {analysis['critical_issues']}")
    print(f"• High Priority Issues: {analysis['high_priority_issues']}")
    print(f"• Auto-Executable Tasks: {analysis['auto_executable_tasks']}")
    print(f"• Project Health: {analysis['project_health']}")
    
    # Show critical issues
    critical_issues = [issue for issue in analysis['issues'] if issue['priority'] == 'CRITICAL']
    if critical_issues:
        print(f"\n🚨 Critical Issues Found:")
        for issue in critical_issues[:3]:  # Show first 3
            print(f"• {issue['title']}")
            print(f"  Location: {issue['location']}")
            print(f"  Impact: {', '.join(issue['impact'])}")
            print(f"  Suggested Action: {issue['suggested_action']}")
            print()
    
    # Show high priority issues
    high_issues = [issue for issue in analysis['issues'] if issue['priority'] == 'HIGH']
    if high_issues:
        print(f"⚠️ High Priority Issues:")
        for issue in high_issues[:3]:  # Show first 3
            print(f"• {issue['title']}")
            print(f"  Location: {issue['location']}")
            print(f"  Impact: {', '.join(issue['impact'])}")
            print()
    
    # Show recommendations
    if analysis['recommendations']:
        print(f"💡 Work Recommendations:")
        for rec in analysis['recommendations'][:5]:  # Show first 5
            print(f"• {rec['title']}")
            print(f"  Priority: {rec['priority']}")
            print(f"  Estimated: {rec['estimated_hours']:.1f} hours")
            print(f"  Agents: {', '.join(rec['agent_types'])}")
            print(f"  Auto-Execute: {'Yes' if rec['auto_execute'] else 'No'}")
            print()
    
    # Test auto-execution
    print(f"🚀 Testing Auto-Execution...")
    auto_executed = PROJECT_ANALYZER.auto_execute_critical_tasks()
    
    if auto_executed:
        print(f"✅ Auto-Executed {len(auto_executed)} Critical Tasks:")
        for task in auto_executed:
            print(f"• {task}")
    else:
        print(f"ℹ️ No critical tasks auto-executed (may need manual intervention)")
    
    print(f"\n🎯 Auto-Detection Test Complete!")
    print("💡 The swarm now automatically:")
    print("   • Analyzes project documentation")
    print("   • Detects blockers and issues")
    print("   • Generates work recommendations")
    print("   • Auto-executes critical tasks")
    print("   • Reports project health")


if __name__ == "__main__":
    test_auto_detection()
