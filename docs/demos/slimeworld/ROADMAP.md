# SlimeWorld roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/slimeworld/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Slimeworld_Ranch_Data_And_Model: data files (species, recipes, zones, gates, fruit) plus the pure-TS model (traits, inheritance, mutation, p'
  status: pending
  exit:
  - file: docs/demos/slimeworld/DIRECTION.md
  steps:
  - id: s1
    title: 'Slimeworld_Ranch_Data_And_Model: data files (species, recipes, zones, gates, fruit) plus the pure-TS model (traits, inheritance, mutation, p'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Slimeworld_Ranch_Data_And_Model: data files (species, recipes, zones, gates, fruit) plus the pure-TS model (traits, inheritance, mutation, plort economy, gate check, save schema), with unit tests; no UI; S-M; blocked on open questions 1, 5, 6, 13.'
- id: M2
  title: 'Slimeworld_Ranch_Forage_Loop: trees, basket, lure resolution, twist interface, Meadow screen at 360 px with a headless lure test; M; after 1'
  status: pending
  exit:
  - file: docs/demos/slimeworld/DIRECTION.md
  steps:
  - id: s2
    title: 'Slimeworld_Ranch_Forage_Loop: trees, basket, lure resolution, twist interface, Meadow screen at 360 px with a headless lure test; M; after 1'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Slimeworld_Ranch_Forage_Loop: trees, basket, lure resolution, twist interface, Meadow screen at 360 px with a headless lure test; M; after 1.'
questions:
- id: q1
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Existing code: move the current territory game to a World Conquest id (rename directive) and build the ranch fresh, or build the ranch in a temporary new directory first and move later? Recommended: temporary new directory, rename later.'
- id: q2
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: Hold/redirect the queued old-game directives (Headless_Balance_Test, New_Campaign_Button, Deploy_Source_Fix, Horse_Racing_Status_Beta, Port1-4)? Which are still wanted for the Conquest side?
- id: q3
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'SlimeBreeder: keep the retired exhibit online or remove it from the arcade manifest?'
- id: q4
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: Art style and palette (SlimeVisual's current blobs vs flat/outline/pixel; fixed palette of N colors tied to the color trait).
- id: q5
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Total species count (PROPOSED ~34; is 30-40 the right band?) and the Largo recipe list: hand-authored by me for review, or by Robert?'
- id: q6
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Trait list: is color + size + one affinity final, and should size affect plort yield or price?'
- id: q7
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Sound: none, a handful of SFX, or music? (There is a shared sfx directive, Polish_Shared_Sfx.)'
- id: q8
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Tutorial: the Meadow as the tutorial (no popups, one pointer hand) vs a short scripted opening.'
```
