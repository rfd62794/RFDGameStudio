# Succession roadmap

```yaml roadmap
status: draft
milestones:
- id: M0
  title: Current shippable state kept
  status: pending
  exit:
  - file: docs/demos/succession/DIRECTION.md
  steps:
  - id: s0
    title: Confirm current shippable state
    kind: docs
    size: S
    status: pending
    directive: ''
    detail: Review the direction note and verify the demo still runs and tests pass.
- id: M1
  title: 'Succession M0: parkedFeatures flag + title core line + harness ablation + timed run - S/M - none (queue directives touch App.tsx: sequence a'
  status: pending
  exit:
  - file: docs/demos/succession/DIRECTION.md
  steps:
  - id: s1
    title: 'Succession M0: parkedFeatures flag + title core line + harness ablation + timed run - S/M - none (queue directives touch App.tsx: sequence a'
    kind: tests
    size: S
    status: pending
    directive: ''
    detail: 'Succession M0: parkedFeatures flag + title core line + harness ablation + timed run - S/M - none (queue directives touch App.tsx: sequence after them or rebase).'
- id: M2
  title: Succession in-play Restart/Abandon + Back to Title - S - already written (Succession_Run_Controls_Directive).
  status: pending
  exit:
  - file: docs/demos/succession/DIRECTION.md
  steps:
  - id: s2
    title: Succession in-play Restart/Abandon + Back to Title - S - already written (Succession_Run_Controls_Directive).
    kind: docs
    size: M
    status: pending
    directive: Succession_Run_Controls_Directive
    detail: Succession in-play Restart/Abandon + Back to Title - S - already written (Succession_Run_Controls_Directive).
questions:
- id: q1
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Approve the overseer judgement (trim first, Inquest later)? Default: yes.'
- id: q2
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Mystery cast and clues: reuse the existing five suspects, three methods and motives (deduction.ts) or write a new cast?'
- id: q3
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'How many cases for Inquest (one seeded, or three)? Default: one in M3, three in M4.'
- id: q4
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Balance harness: extend it for the vote phase (default, reuses succession-balance-sim.ts) or a separate harness?'
- id: q5
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: 'Cabinet presentation: Inquest as a second cabinet card or a mode inside the one Succession card?'
- id: q6
  status: open
  asked: '2026-10-11'
  asked_by: robert
  prompt: May the M2 feedback prompt and devlog ask go out, and who posts them?
```
