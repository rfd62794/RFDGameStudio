# Succession — CHANGELOG

## 2026-08-20 — Balance Simulation Harness

Added `ts/tools/succession-balance-sim.ts` — a standalone diagnostic
script that runs 5 named strategies × 3 origins (15 runs) through the
real deterministic game orchestration code. No randomness; the variable
explored is player strategy, not seed space.

### Raw Findings

**Per-run results:**

| Strategy | Origin | Winner | Type | Margin | Exp | Chancellor | Archbishop | Commander |
|---|---|---|---|---|---|---|---|---|
| RushOneFigure | bastard_scion | aldric | Majority | -3 | 0 | P:43 A:45 V:45 | P:42 A:30 V:45 | P:22 A:45 V:0 |
| RushOneFigure | disgraced_knight | aldric | Majority | -3 | 0 | P:22 A:30 V:0 | P:40 A:45 V:45 | P:12 A:45 V:0 |
| RushOneFigure | merchant_banker | DRAW | Deadlock | -1 | 0 | P:43 A:45 V:50 | P:37 A:35 V:0 | P:27 A:45 V:0 |
| SpreadEvenly | bastard_scion | aldric | Majority | -3 | 0 | P:33 A:30 V:45 | P:42 A:45 V:45 | P:32 A:45 V:0 |
| SpreadEvenly | disgraced_knight | aldric | Majority | -1 | 0 | P:32 A:30 V:0 | P:40 A:45 V:45 | P:22 A:45 V:30 |
| SpreadEvenly | merchant_banker | aldric | Majority | -3 | 0 | P:43 A:30 V:50 | P:32 A:50 V:0 | P:32 A:45 V:0 |
| SafeAppealsOnly | bastard_scion | aldric | Majority | -3 | 0 | P:19 A:30 V:60 | P:24 A:45 V:30 | P:16 A:45 V:30 |
| SafeAppealsOnly | disgraced_knight | aldric | Majority | -3 | 0 | P:24 A:30 V:60 | P:24 A:45 V:30 | P:24 A:45 V:30 |
| SafeAppealsOnly | merchant_banker | aldric | Majority | -3 | 0 | P:24 A:30 V:65 | P:24 A:50 V:30 | P:16 A:45 V:30 |
| ScoutThenEvidence | bastard_scion | aldric | Majority | -3 | 0 | P:27 A:60 V:30 | P:26 A:45 V:45 | P:10 A:15 V:0 |
| ScoutThenEvidence | disgraced_knight | DRAW | Deadlock | -1 | 0 | P:14 A:0 V:75 | P:14 A:60 V:15 | P:30 A:30 V:0 |
| ScoutThenEvidence | merchant_banker | DRAW | Deadlock | -1 | 0 | P:24 A:0 V:65 | P:14 A:65 V:0 | P:30 A:30 V:0 |
| WhisperHeavy | bastard_scion | aldric | Majority | -3 | 0 | P:43 A:45 V:45 | P:42 A:30 V:45 | P:22 A:45 V:0 |
| WhisperHeavy | disgraced_knight | aldric | Majority | -1 | 0 | P:16 A:30 V:0 | P:16 A:60 V:30 | P:32 A:30 V:0 |
| WhisperHeavy | merchant_banker | DRAW | Deadlock | -1 | 0 | P:43 A:45 V:50 | P:37 A:35 V:0 | P:27 A:45 V:0 |

**Per-figure winners:**

| Strategy | Origin | Chancellor | Archbishop | Commander |
|---|---|---|---|---|
| RushOneFigure | bastard_scion | aldric | vivienne | aldric |
| RushOneFigure | disgraced_knight | aldric | aldric | aldric |
| RushOneFigure | merchant_banker | vivienne | player | aldric |
| SpreadEvenly | bastard_scion | vivienne | aldric | aldric |
| SpreadEvenly | disgraced_knight | player | aldric | aldric |
| SpreadEvenly | merchant_banker | vivienne | aldric | aldric |
| SafeAppealsOnly | bastard_scion | vivienne | aldric | aldric |
| SafeAppealsOnly | disgraced_knight | vivienne | aldric | aldric |
| SafeAppealsOnly | merchant_banker | vivienne | aldric | aldric |
| ScoutThenEvidence | bastard_scion | aldric | aldric | aldric |
| ScoutThenEvidence | disgraced_knight | vivienne | aldric | player |
| ScoutThenEvidence | merchant_banker | vivienne | aldric | player |
| WhisperHeavy | bastard_scion | aldric | vivienne | aldric |
| WhisperHeavy | disgraced_knight | aldric | aldric | player |
| WhisperHeavy | merchant_banker | vivienne | player | aldric |

**Aggregate statistics:**

Win rate per strategy (W/L/D, blowout vs contested, avg margin):
- RushOneFigure: W:0 L:2 D:1 | Blowout:2 Contested:1 | AvgMargin:-2.33
- SpreadEvenly: W:0 L:3 D:0 | Blowout:2 Contested:1 | AvgMargin:-2.33
- SafeAppealsOnly: W:0 L:3 D:0 | Blowout:3 Contested:0 | AvgMargin:-3.00
- ScoutThenEvidence: W:0 L:1 D:2 | Blowout:1 Contested:2 | AvgMargin:-1.67
- WhisperHeavy: W:0 L:2 D:1 | Blowout:1 Contested:2 | AvgMargin:-1.67

Win rate per origin:
- bastard_scion: W:0 L:5 D:0
- disgraced_knight: W:0 L:4 D:1
- merchant_banker: W:0 L:2 D:3

Exposure statistics:
- Total exposures across all runs: 0
- Runs with at least 1 exposure: 0/15

Strategy dominance: No player wins across any strategy. Best win count: 0/3.

### Key observations (raw, not tuning recommendations)

- Player wins 0/15 runs. Rivals (aldric/vivienne) win 10/15. 5/15 end in deadlock.
- SafeAppealsOnly is the worst performer: 0 wins, 3 blowout losses, avg margin -3.0.
- ScoutThenEvidence and WhisperHeavy tie for best (least bad): avg margin -1.67, 2 contested each.
- merchant_banker is the best origin for survival (3 draws, only 2 losses).
- bastard_scion is the worst origin (5 losses, 0 draws).
- Zero exposures occurred in any run — no strategy triggered a contradiction.
- No single strategy dominates; all lose. The question of whether any
  strategy can win at all with current constants is open.
