# Coin Pusher Arcade roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/coin_pusher_arcade/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Hold (S): ADD nothing; keep status dev and keep it out of "Start here"/home picks; CUT no code. Verify: registry status is dev; card not in '
  status: pending
  exit:
  - file: docs/demos/coin_pusher_arcade/DIRECTION.md
  steps:
  - id: s1
    title: 'Hold (S): ADD nothing; keep status dev and keep it out of "Start here"/home picks; CUT no code. Verify: registry status is dev; card not in '
    kind: feature
    size: S
    status: pending
    directive: ''
    detail: 'Hold (S): ADD nothing; keep status dev and keep it out of "Start here"/home picks; CUT no code. Verify: registry status is dev; card not in the featured list.'
- id: M2
  title: 'Only if the playtest says it feels better than slime_coin (M): ADD title/Start screen, `build:coin_pusher_arcade` script and 390 px check; C'
  status: pending
  exit:
  - file: docs/demos/coin_pusher_arcade/DIRECTION.md
  steps:
  - id: s2
    title: 'Only if the playtest says it feels better than slime_coin (M): ADD title/Start screen, `build:coin_pusher_arcade` script and 390 px check; C'
    kind: tests
    size: M
    status: pending
    directive: ''
    detail: 'Only if the playtest says it feels better than slime_coin (M): ADD title/Start screen, `build:coin_pusher_arcade` script and 390 px check; CUT the Gemini claim from metadata.json (unused). Verify: `cd ts && npm run build:coin_pusher_arcade`, Playwright load.'
```
