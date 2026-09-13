#!/usr/bin/env python3
"""
Test Workflow Builder - Demonstrate custom workflow creation
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.tools.apj.agents.workflow_builder import WORKFLOW_BUILDER


def test_workflow_builder():
    """Test workflow builder with various requests"""
    
    print("🔧 TESTING WORKFLOW BUILDER")
    print("=" * 60)
    
    # Test 1: Simple development workflow
    print("\n📋 Test 1: Simple Development Workflow")
    workflow1 = WORKFLOW_BUILDER.build_workflow(
        request="Build a simple user authentication system",
        context={"scale": "small", "integrations": 1, "stakeholders": 2}
    )
    
    print(f"• Name: {workflow1.name}")
    print(f"• Type: {workflow1.workflow_type.value}")
    print(f"• Tasks: {workflow1.total_tasks}")
    print(f"• Hours: {workflow1.total_estimated_hours:.1f}")
    print(f"• Critical Path: {workflow1.critical_path_hours:.1f} hours")
    
    # Test 2: Complex system integration
    print("\n📋 Test 2: Complex System Integration")
    workflow2 = WORKFLOW_BUILDER.build_workflow(
        request="Integrate microservices architecture with database migration",
        context={"scale": "large", "integrations": 5, "stakeholders": 8}
    )
    
    print(f"• Name: {workflow2.name}")
    print(f"• Type: {workflow2.workflow_type.value}")
    print(f"• Tasks: {workflow2.total_tasks}")
    print(f"• Hours: {workflow2.total_estimated_hours:.1f}")
    print(f"• Critical Path: {workflow2.critical_path_hours:.1f} hours")
    
    # Test 3: ECS Rendering System (current project)
    print("\n📋 Test 3: ECS Rendering System (Current Project)")
    workflow3 = WORKFLOW_BUILDER.build_workflow(
        request="Implement ECS rendering system for dungeon and tower defense demos",
        context={
            "scale": "medium",
            "integrations": 3,
            "stakeholders": 3,
            "current_systems": ["ECS", "Physics", "Genetics"],
            "blockers": ["RenderingSystem missing"]
        }
    )
    
    print(f"• Name: {workflow3.name}")
    print(f"• Type: {workflow3.workflow_type.value}")
    print(f"• Tasks: {workflow3.total_tasks}")
    print(f"• Hours: {workflow3.total_estimated_hours:.1f}")
    print(f"• Critical Path: {workflow3.critical_path_hours:.1f} hours")
    
    # Show agent distribution
    print(f"\n🤖 Agent Distribution:")
    for agent, count in workflow3.agent_distribution.items():
        print(f"• {agent}: {count} tasks")
    
    # Show first few steps
    print(f"\n📋 First 5 Steps:")
    for i, step in enumerate(workflow3.steps[:5], 1):
        print(f"{i}. {step.title} ({step.agent_type}) - {step.estimated_hours:.1f}h")
    
    # Show risks and optimizations
    if workflow3.risk_factors:
        print(f"\n⚠️ Risk Factors:")
        for risk in workflow3.risk_factors:
            print(f"• {risk}")
    
    if workflow3.optimization_suggestions:
        print(f"\n💡 Optimization Suggestions:")
        for suggestion in workflow3.optimization_suggestions:
            print(f"• {suggestion}")
    
    # Test 4: Export workflow
    print("\n📋 Test 4: Workflow Export")
    json_export = WORKFLOW_BUILDER.export_workflow(workflow3, "json")
    print(f"• JSON Export: {len(json_export)} characters")
    
    markdown_export = WORKFLOW_BUILDER.export_workflow(workflow3, "markdown")
    print(f"• Markdown Export: {len(markdown_export)} characters")
    
    print(f"\n🎯 Workflow Builder Test Complete!")
    print("💡 To use in ADJ, say:")
    print("   'build workflow for ECS rendering system'")
    print("   'create workflow for dungeon demo completion'")
    print("   'design workflow for tower defense integration'")


if __name__ == "__main__":
    test_workflow_builder()
