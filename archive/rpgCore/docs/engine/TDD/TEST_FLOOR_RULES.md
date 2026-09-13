# Test Floor Rules — Engine TDD
Authority: Hard enforcement contract.
Agents must never violate these rules.

## The Floor
The test floor is the minimum number of
passing tests that must be maintained at
all times. The floor only moves upward.

Current floor: 1001 passing tests.

## Rules
1. Zero failing tests at all times.
   A failing test is never acceptable.
   Fix before committing any other work.

2. Floor only rises.
   New tests added = new floor.
   Floor never decreases.

3. Skipped tests must be documented.
   Every skipped test requires:
   - Reason for skip
   - Tracking note for resolution
   - Phase when it will be fixed

4. Suspended tests live in tests/suspended/
   ADJ swarm tests are currently suspended.
   They do not count toward the floor.
   They must not be deleted.

5. No implementation without tests.
   Every new system requires test anchors
   defined in the directive before coding.
   Minimum 5 tests per new system.

## Current State
- Passing: 1001
- Failing: 0
- Skipped: 2 (test_garden_scene_initializes
  — brittle integration test, tracked for
  Phase 5A when StatBlock wiring lands)
- Suspended: ADJ swarm tests in
  tests/suspended/

## Violation Response
If tests fail:
1. Stop all other work immediately
2. Fix the failing tests first
3. Do not proceed until floor is restored
