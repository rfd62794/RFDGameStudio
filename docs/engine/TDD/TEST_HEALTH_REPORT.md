# Test Health Report

**Protected Baseline: 296 Passing Tests, 0 Failures**

*Note: The test suite currently includes 3 explicit skips for conditionally installed dependencies like Hypothesis and the Rust bindings. These do not count against the protected pass baseline.*

The `rpgCore` engine is held strictly to its passing suite status. Decreasing the number of passing tests without archiving explicitly deprecated modules is considered a regression.

To run the full suite:
```bash
uv run pytest
```
