<!-- GENERATED FILE — edit ts/src/status/board.data.ts, then run scripts/generate-status-board.ts -->

# RFD Game Studio — Status Board

*August 15, 2026 | RFD IT Services Ltd. | Generated from `ts/src/status/board.data.ts`.*

> **How this stays alive:** refreshed at natural checkpoints — the start of a
> big multi-thread studio session, or whenever three or more threads below
> have moved since the last refresh. Not continuously maintained, and not
> meant to be. Each game's own `docs/state/current.md` (or AI-Studio
> equivalent) remains the real source of truth; this is a rollup, not a
> replacement. If this document and a project's own state file disagree,
> the project's own file wins.

---

## Legend

**Active** — real, ongoing work this month. **Shipped/Mature** — live,
stable, touched only for maintenance. **Shipped/Deliberately Paused** — a
real, chosen stopping point (engine-death pattern named explicitly), not a
stall. **Blocked** — real work exists, next step needs a decision or a
verify-first check before continuing. **Retired** — superseded, source
preserved read-only, explicitly removed from the live registry. **Status
Unconfirmed** — real evidence this exists and had real work done on it, but
no recent enough confirmation to state its current state.

---

## 1. Live Catalog

| Game | Status | Current State | Next Real Action | Last Updated |
|---|---|---|---|---|
| **Planet of Greed** | Shipped/Mature | Converted, live on rfditservices.com + itch.io. Five-chapter canon locked. | — | 2026-08-15 |
| **Shoal** | Active | TS-native migration complete (151.7x speedup). artGen fully consumed (canvas paths, hunger-aware specs, path caching). | — | 2026-08-15 |
| **Mutant Battle Ball** | Active | TS-native migration done. Mid major creative overhaul — Neo Battlopolis, six-Brand Trinity, Body Part Synergy. | Continue feature build-out — genuinely mid-build, not near done. | 2026-08-15 |
| **SlimeWorld** | Shipped/Mature | Live on itch.io + arcade. Survived a production crisis (missing Lua files in bundle, fixed retroactively across 5 games). artGen fully consumed. | — | 2026-08-15 |
| **Dissonance Depths** | Shipped/Mature | Live on itch.io + rfditservices.com. Source of the artGen module. | — | 2026-08-15 |

---

## 2. Separate Infrastructure

| Game | Status | Current State | Next Real Action | Last Updated |
|---|---|---|---|---|
| **VoidDrift** | Status Unconfirmed | Rust/Bevy/Android. Act 1 of a locked 3-game narrative trilogy (VoidDrift -> Dissonance Depths -> SlimeWorld). | Verify whether the previously-flagged OpeningCompleteEvent blocking bug is still open. | 2026-08-15 |
| **VoidDrift Redux (web)** | Active | Phase 6 (tap-to-dispatch). Separate exploratory thread from native VoidDrift. | Pending fragment natural-drift correction. | 2026-08-15 |
| **House of Kings: Collab** | Active | Firebase/Firestore. Phases 0-10 + full security remediation arc complete. | Direct status check — architecturally isolated, easy to lose track of. | 2026-08-15 |
| **AntSim Redux** | Shipped/Deliberately Paused | Phase 5, 90-test floor. Closed via named engine-death-pattern acknowledgment. | — | 2026-08-15 |

---

## 3. AI-Studio-Origin Track

| Game | Status | Current State | Next Real Action | Last Updated |
|---|---|---|---|---|
| **Succession** | Active | Persuasion-sim redesign, mid-development. | — | 2026-08-15 |
| **SlimeGarden** | Status Unconfirmed | Substantial design work as of mid-July (SlimeDex, Life Stages, partial Color Tree). | Direct status check needed. | 2026-08-15 |
| **Trinity Siege/Combat** | Status Unconfirmed | Bevy vs. egui architecture question left unresolved. | Direct status check — no longer blocked on the Rust-chassis question, that is confirmed Far Future Dream now. | 2026-08-15 |
| **7 Days to Fry** | Status Unconfirmed | Imported alongside KingMaker Squads (now retired). No status since. | Direct status check needed. | 2026-08-15 |
| **TurboShells** | Status Unconfirmed | Named as a genuine cross-language-origin Lua exception (with VoidDrift). No recent confirmation. | Direct status check needed. | 2026-08-15 |

---

## 4. Retired

| Game | Status | Superseded By | Current State | Last Updated |
|---|---|---|---|---|
| **CorpWorld** | Retired | Planet of Greed | Source preserved read-only. | 2026-08-15 |
| **KingMaker Squads** | Retired | Planet of Greed | Source preserved read-only. | 2026-08-15 |
| **BrewField** | Retired | Dissonance Depths | Source preserved read-only. | 2026-08-15 |
| **SlimeBreeder** | Retired | — | Established the retirement pattern itself. | 2026-08-15 |

---

## 5. Shared Engine Infrastructure

| Piece | Status | Note |
|---|---|---|
| Four-file Lua contract + `RFDStudioMCP` | Stable, live | 28/0/0, port 8025, NSSM-registered |
| TS-native default (ADR-010/ADR-013) | Stable, current policy | Now the actual default, not the exception |
| Shared UI components (`ts/src/ui/components/`, ADR-008) | Active use | 6+ games |
| Shared logic (`ts/src/engine/shared/`) | Active, first-class | ADR-014: shared engine modules are the default, not demand-gated |
| `artGen` module | Built AND consumed | Consumed by Shoal (canvas paths, hunger-aware specs) and SlimeWorld (seeded random, polygon generation) — ADR-014 proof case |
| Standalone publishing pipeline + `RFD_IT_Publishing` | Working | 7 games packaged, Butler-based, real analytics confirmed |
| Rust runtime (mlua bridge) | **Confirmed Far Future Dream** | Not active roadmap — VoidDrift remains fully separate native Rust |
| Bevy vs. egui (studio-wide Rust graphical layer) | Open, deprioritized | Low priority — see Trinity Siege's row above |

---

*RFD Game Studio Status Board | Generated from `ts/src/status/board.data.ts`*
*A rollup, not a rewrite. Refresh it, don't rebuild it.*