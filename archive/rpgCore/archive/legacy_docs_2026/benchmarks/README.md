> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# Benchmarks Archive

**Archived Development Scripts and Performance Measurements**

This directory contains historical development scripts and performance benchmarks that were used during the Three-Tier Architecture refactor. These files are preserved for reference but are no longer part of the active test suite.

## 📁 Archived Files

### `test_scrap_entity_optimized.py`
**Original Location**: `tests/test_scrap_entity_optimized.py`  
**Archived**: Wave 3 Production Hardening  
**Purpose**: Entity optimization testing during development

**Description**: This script was used for performance testing and optimization of entity systems during the development phase. It contains valuable performance data and optimization techniques that informed the final Three-Tier architecture.

## 🎯 Why These Were Archived

During Wave 3 Production Hardening, we made the decision to:
1. **Lean Test Suite**: Keep the `tests/` directory focused on production validation
2. **Historical Reference**: Preserve development benchmarks for future reference
3. **Clean Separation**: Separate active tests from development experiments

## 📊 Performance Insights

The archived scripts contain valuable performance data that informed:
- SystemClock implementation decisions
- Three-Tier architecture performance targets
- Miyoo Mini optimization strategies
- Memory footprint optimizations

## 🔍 Accessing Archived Data

These files are preserved but not actively maintained. To reference them:

```bash
# View archived entity optimization test
cat docs/benchmarks/test_scrap_entity_optimized.py

# Note: These scripts may require legacy dependencies
# and are not guaranteed to run without modification
```

## 📈 Current Performance Testing

For current performance validation, use:
- `test_persistence_stress.py` - Persistence system testing
- `test_theater_mode.py` - Integration testing
- `tools/production_validation.py` - Complete validation suite

---

**Note**: The DGT Platform v1.0 has moved from development experimentation to production deployment. These archived files represent the journey that led to our current Three-Tier Architecture excellence.
