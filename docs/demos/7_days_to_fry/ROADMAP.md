# 7 Days To Fry roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/7_days_to_fry/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Honest card and Restart. CUT: "cooking survival" copy and the empty-genre comment hack. ADD: kitchen-sim blurb, genre decision (management-s'
  status: pending
  exit:
  - file: docs/demos/7_days_to_fry/DIRECTION.md
  steps:
  - id: s1
    title: 'Honest card and Restart. CUT: "cooking survival" copy and the empty-genre comment hack. ADD: kitchen-sim blurb, genre decision (management-s'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Honest card and Restart. CUT: "cooking survival" copy and the empty-genre comment hack. ADD: kitchen-sim blurb, genre decision (management-sim), in-frame Restart/New Week on the intro screen. Size S. Verify: `cd ts && npx vitest run tests/test_registry_export.ts` and a blurb test.'
- id: M2
  title: 'Finish the week. CUT: nothing. ADD: purchaseCoffeeForCustomers (Day 5) and purchaseSodaUnlock (Day 6-7) in nightShop.ts, order generation ru'
  status: pending
  exit:
  - file: docs/demos/7_days_to_fry/DIRECTION.md
  steps:
  - id: s2
    title: 'Finish the week. CUT: nothing. ADD: purchaseCoffeeForCustomers (Day 5) and purchaseSodaUnlock (Day 6-7) in nightShop.ts, order generation ru'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Finish the week. CUT: nothing. ADD: purchaseCoffeeForCustomers (Day 5) and purchaseSodaUnlock (Day 6-7) in nightShop.ts, order generation rules, tests. Size M. Verify: `cd examples/7-days-to-fry && npx vitest run` shows 241 plus new tests green (controller runs if install blocked).'
```
