> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# ADR 191: Debt-to-Asset Conversion Strategy

## Status
**Active** - Phase 2 Implementation

## Context
The DGT Platform contains 576 TODO/FIXME/HACK markers representing significant technical debt. Traditional debt reduction approaches are reactive and often fail to make meaningful progress. We need a systemic, proactive approach that converts technical debt into architectural assets.

## Decision
Implement a **"1 TODO per file"** mandatory resolution policy that systematically converts debt into improved architecture with every modification.

## Technical Strategy

### Core Principle
> **Every file modified must resolve at least 1 TODO marker**

This creates a **self-correcting system** where development activity automatically reduces technical debt.

### Implementation Protocol

#### 1. Pre-Modification Debt Audit
```python
def audit_file_debt(file_path: str) -> int:
    """Count TODO markers before modification"""
    with open(file_path, 'r') as f:
        content = f.read()
        return content.count('TODO') + content.count('FIXME') + content.count('HACK')
```

#### 2. Modification Requirements
- **Mandatory**: Resolve ≥1 TODO marker in any modified file
- **Tracking**: Update `docs/production/MANIFEST.md` with new debt count
- **Validation**: Pre-commit hook ensures compliance
- **Quality**: Resolved TODOs must be properly implemented, not just commented out

#### 3. Debt-to-Asset Conversion Types

| Debt Type | Asset Created | Example |
|-----------|---------------|---------|
| Missing Interface | Protocol Definition | `TODO: Add interface` → `EngineProtocol` |
| Hard-coded Import | Dependency Injection | `TODO: Fix import` → DI Container registration |
| Raw Exception | Result[T] Pattern | `TODO: Handle error` → `Result.failure_result()` |
| Duplicate Code | Consolidated Component | `TODO: Refactor duplicate` → UnifiedPPU |
| Missing Type Hint | Type Safety | `TODO: Add type` → Full type hints |

### Phase 2: PPU Consolidation as Test Case

#### Target Debt Reduction
- **Files to modify**: 5 PPU variants
- **Minimum TODOs to resolve**: 5 (1 per file)
- **Expected total TODOs in PPU files**: ~25
- **Target reduction**: 20% of PPU-related debt

#### Conversion Strategy
1. **Inventory PPU debt** in each variant
2. **Create UnifiedPPU** implementing `PPUProtocol`
3. **Migrate functionality** resolving TODOs during migration
4. **Eliminate duplicate code** consolidating similar TODOs
5. **Update MANIFEST** with debt reduction metrics

## Architectural Benefits

### 1. Systematic Improvement
- **Continuous**: Every change improves the codebase
- **Measurable**: Debt reduction tracked in MANIFEST
- **Predictable**: Linear debt reduction over time

### 2. Quality Enforcement
- **Prevents debt accumulation**: New features must resolve existing debt
- **Encourages refactoring**: Developers motivated to clean up code
- **Maintains standards**: Debt resolution follows architectural patterns

### 3. Long-Term Sustainability
- **Self-correcting**: System automatically improves over time
- **Debt ceiling**: Natural limit on technical debt accumulation
- **Progress tracking**: Clear metrics for technical debt health

## Implementation Details

### Debt Tracking System
```python
@dataclass
class DebtMetrics:
    total_todos: int
    files_with_debt: int
    reduction_percentage: float
    target_date: datetime
    current_rate: float  # TODOs per week

class DebtTracker:
    def track_debt_reduction(self, file_path: str, todos_resolved: int):
        """Track and report debt reduction progress"""
        pass
    
    def validate_debt_reduction(self, file_path: str) -> bool:
        """Validate that at least 1 TODO was resolved"""
        pass
```

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for debt reduction compliance
python scripts/validate_debt_reduction.py

if [ $? -ne 0 ]; then
    echo "❌ DEBT VIOLATION: Must resolve at least 1 TODO per modified file"
    exit 1
fi
```

### MANIFEST Integration
```markdown
## 📊 TECHNICAL DEBT TRACKING

### Current Debt Metrics
```
Total TODO/FIXME/HACK markers: 576 → 551 (Phase 2 Progress)
Target: <50 (90% reduction)
Current Reduction: 4.2% (25 TODOs resolved)
Files with Debt: 183/348 (52.6%)
Reduction Rate: 5 TODOs per session
```

### Phase 2 Debt Conversion
- **PPU Consolidation**: 5 TODOs resolved
- **Protocol Migration**: 8 TODOs resolved
- **DI Integration**: 12 TODOs resolved
```

## Success Metrics

### Quantitative Targets
- **Weekly Reduction**: ≥5 TODOs per development session
- **Phase Completion**: 50% reduction by end of Phase 2
- **Production Target**: <50 TODOs (90% reduction from baseline)

### Qualitative Benefits
- **Code Quality**: Improved architecture with every change
- **Developer Experience**: Cleaner codebase to work with
- **Maintainability**: Reduced complexity and improved documentation

### Risk Mitigation
- **Quality Gates**: Pre-commit hooks prevent debt accumulation
- **Progress Tracking**: MANIFEST provides visibility into debt status
- **Architectural Compliance**: Debt resolution follows established patterns

## Future Considerations

### Scalability
- **Automated Tools**: Develop tools to automatically resolve common TODO patterns
- **Template Generation**: Create templates for common debt resolution patterns
- **Metrics Dashboard**: Real-time debt tracking and visualization

### Integration with Development Workflow
- **IDE Integration**: Visual indicators for files with high debt
- **Code Review**: Debt reduction as part of PR review process
- **Planning**: Debt reduction included in sprint planning

---

## Consequences

### Positive
- **Systematic Improvement**: Guaranteed debt reduction over time
- **Quality Enforcement**: Architectural patterns enforced through debt resolution
- **Measurable Progress**: Clear metrics for technical debt health

### Negative
- **Development Overhead**: Additional time required for debt resolution
- **Learning Curve**: Developers must understand debt resolution patterns
- **Initial Resistance**: May slow initial development velocity

### Mitigations
- **Tooling Support**: Automated tools to assist with debt resolution
- **Documentation**: Clear guidelines and examples for debt resolution
- **Gradual Implementation**: Phase-based rollout to minimize disruption

---

**Status**: Active Implementation  
**Phase**: 2 (PPU Consolidation Test Case)  
**Next Review**: After PPU consolidation completion  
**Success Criteria**: 25+ TODOs resolved during Phase 2
