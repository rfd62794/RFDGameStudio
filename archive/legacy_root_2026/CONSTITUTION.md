# PyPro Constitution
## Spec-First Sovereignty
We believe code is a side effect of a well-defined specification. No implementation begins until the Constitution, Specification, and Plan are audited and locked.

## SOLID & Clean Code
We treat SOLID principles as non-negotiable. We prefer Composition over Inheritance and Interface Segregation.

## Observability & Auditability
No `print()` statements. Use `loguru` for logic and `rich` for CLI. Every major decision must be captured in repository-ready artifacts (ADRs/Markdown).

## Tooling
- `uv` for lightning-fast, reproducible dependency management.
- Pure PyGame for 2D graphics in rpgCore, adhering strictly to dependencies.
