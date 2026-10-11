# Roadmap: Shoal: Evolve

The sequel advances through playable slices. Every milestone keeps the original Shoal independently playable and keeps shared simulation behavior covered by deterministic tests.

```yaml roadmap
status: approved
approved: 2026-10-11 robert
milestones:
- id: M0
  title: Two products, one simulation core
  status: pending
  exit:
  - file: docs/demos/shoal_evolve/DIRECTION.md
  - grep:
      path: docs/children.json
      pattern: shoal_evolve
  - test: cd ts && npx vitest run tests/test_shoal_headless.ts
  steps:
  - id: M0.1
    title: Register Shoal Evolve as a child and arcade entry
    kind: refactor
    size: S
    value: 5
    status: pending
    directive: RFDGameStudio_Shoal_Evolve_Foundation_Directive.md
    detail: Add a separate shoal_evolve child and arcade entry with its own docs path, config, thin application shell, and persistence namespace. Reuse the current Shoal simulation directly; do not fork it or broadly extract it.
    accept:
    - grep:
        path: docs/children.json
        pattern: shoal_evolve
    - test: cd ts && npx vitest run tests/test_shoal_headless.ts
  - id: M0.2
    title: Lock the shared-core compatibility contract
    kind: tests
    size: S
    value: 5
    status: pending
    directive: RFDGameStudio_Shoal_Evolve_Foundation_Directive.md
    detail: Add targeted tests proving both entries can initialize and tick the same simulation contract, and require original Shoal headless tests whenever shared simulation code changes.
    accept:
    - test: cd ts && npx vitest run tests/test_shoal_headless.ts tests/test_shoal_evolve_foundation.ts
- id: M1
  title: Become a fish and grow one stage
  status: pending
  exit:
  - test: cd ts && npx vitest run tests/test_shoal_evolve_foundation.ts
  - test: cd ts && npm run build
  steps:
  - id: M1.1
    title: Control one ordinary fish
    kind: feature
    size: M
    value: 5
    needs:
    - M0.2
    status: pending
    directive: RFDGameStudio_Shoal_Evolve_Foundation_Directive.md
    detail: Add a pure playerFishController and the smallest optional steering seam in the simulation. Pointer and touch targets steer the selected fish while AI fish and ecosystem forces continue normally.
    accept:
    - test: cd ts && npx vitest run tests/test_shoal_evolve_foundation.ts
  - id: M1.2
    title: Eat, compete, and grow visibly by one stage
    kind: feature
    size: M
    value: 5
    needs:
    - M1.1
    status: pending
    directive: RFDGameStudio_Shoal_Evolve_Foundation_Directive.md
    detail: Add pure growth-stage rules based on feeding progress. AI fish keep competing for algae. The player changes size and speed at one threshold; predation sets progress back one stage and respawns without permanent death.
    accept:
    - test: cd ts && npx vitest run tests/test_shoal_evolve_foundation.ts
    - test: cd ts && npx vitest run tests/test_shoal_headless.ts
- id: M2
  title: Branch into visible evolution paths
  status: pending
  exit:
  - test: cd ts && npx vitest run tests/test_shoal_evolve_traits.ts
  steps:
  - id: M2.1
    title: Choose the first cosmetic or ability trait
    kind: feature
    size: M
    value: 4
    needs:
    - M1.2
    status: pending
    directive: ''
    detail: Add the first small branching choice after the foundation proves control and growth. Trait data and effects remain pure; rendering consumes the result without coupling it to simulation orchestration.
    accept:
    - test: cd ts && npx vitest run tests/test_shoal_evolve_traits.ts
- id: M3
  title: Keep the evolved fish locally
  status: pending
  exit:
  - test: cd ts && npx vitest run tests/test_shoal_evolve_save.ts
  steps:
  - id: M3.1
    title: Save sequel progress in its own browser namespace
    kind: feature
    size: S
    value: 3
    needs:
    - M2.1
    status: pending
    directive: ''
    detail: Persist the evolved fish locally with guarded load/write behavior. No accounts, hosting, or cross-title progression.
    accept:
    - test: cd ts && npx vitest run tests/test_shoal_evolve_save.ts
```
