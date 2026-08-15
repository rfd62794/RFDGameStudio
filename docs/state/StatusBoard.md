# RFD Game Studio — Status Board

*August 15, 2026 | RFD IT Services Ltd. | First populated version.*

> **How this stays alive:** refreshed at natural checkpoints — the start of a
> big multi-thread studio session (like the one that produced this), or
> whenever three or more threads below have moved since the last refresh.
> Not continuously maintained, and not meant to be. Each game's own
> `docs/state/current.md` (or AI-Studio equivalent) remains the real source
> of truth; this is a rollup, not a replacement. If this document and a
> project's own state file disagree, the project's own file wins.
>
> **Scope:** RFD Game Studio only — the game/demo catalog and its shared
> engine infrastructure. Everything else (content pipeline, site,
> infrastructure/MCP tooling, business work) is explicitly out of this
> document. The one acknowledged tether: **Trailers** are a studio-produced
> asset even though they render through the separate content pipeline — see
> the checklist column below, not a subsection.

---

## Legend

**Active** — real, ongoing work this month. **Shipped/Mature** — live,
stable, touched only for maintenance. **Shipped/Deliberately Paused** — a
real, chosen stopping point (engine-death pattern named explicitly), not a
stall. **Blocked** — real work exists, next step needs a decision or a
verify-first check before continuing. **Retired** — superseded, source
preserved read-only, explicitly removed from the live registry. **Status
Unconfirmed** — I have real evidence this exists and had real work done on
it, but no recent enough confirmation to state its current state — flagged
for you to fill in, not guessed at.

---

## 1. Live Catalog (TS-native, registered or mid-conversion)

| Game | Status | Current State | Next Real Action | Trailer? |
|---|---|---|---|---|
| **Planet of Greed** | Shipped/Mature | Converted, live on rfditservices.com + itch.io. Five-chapter canon locked. Recent polish: branding fixes, guided walkthrough, Shell Compliance, attack-capability bug fix, Boardroom softlock fix. | None blocking — stable maintenance state. | Unconfirmed |
| **Shoal** | Active | TS-native migration complete, confirmed 151.7x speedup over fengari. Deployed, real traceable traffic. | **The open item**: artGen creative mapping (what visually distinguishes fish/shark/algae) is still unresolved — decide the mapping or explicitly defer it, don't let it sit ambiguous. | Confirmed sent to itch.io w/ devlog — unclear if a video trailer exists separately |
| **Mutant Battle Ball** | Active | TS-native migration done. Major creative overhaul in progress — Neo Battlopolis setting, six-Brand Trinity system, Body Part Synergy, Frame chassis. Match-engine bugs fixed. 3 of 4 tabs wired with real currency/persistence. | Continue the feature build-out — this is genuinely mid-build, per your own read ("still needs feature addition and polish"), not close to done. | No |
| **SlimeWorld** | Shipped/Mature | Live on itch.io + arcade. Survived a real production crisis (missing Lua engine files in the deployed bundle — root-caused, fixed retroactively across 5 other affected games). First-breed trap fixed. Breeding tax mechanic rebuilt and certified (Python 567/TS 328). | None blocking — "SlimeWorld Finale" session title suggests this has reached a real, intentional wrap point. Worth confirming that's actually true rather than assumed. | Unconfirmed |
| **Dissonance Depths** | Shipped/Mature | Live on itch.io + rfditservices.com. 106 SVG placeholder art assets shipped via the new generator pipeline. | None blocking. | Unconfirmed |

---

## 2. Separate-Infrastructure Games (real, active, outside both the Lua contract and the TS-native registry)

| Game | Status | Current State | Next Real Action |
|---|---|---|---|
| **VoidDrift** (Rust/Bevy/Android) | Active, one item **Status Unconfirmed** | Act 1 of a locked three-game narrative trilogy (VoidDrift → Dissonance Depths → SlimeWorld), with a Regent/Meld economy bridge connecting all three, recently formalized. | A previously-flagged blocking bug (`OpeningCompleteEvent` never firing, Sprint 5 blocked) has unknown current status — **verify directly before assuming it's still open or resolved**, don't inherit the old assumption either way. |
| **VoidDrift Redux** (web/TS reimagining) | Active | Reached Phase 6 (tap-to-dispatch interaction). Explicitly a separate exploratory thread from native VoidDrift, not a replacement for it. | Pending fragment natural-drift correction (named, not yet done). |
| **House of Kings: Collab** (Firebase/Firestore) | Active/Mature | Phases 0–10 plus a full security remediation arc complete (5 real regressions caught and fixed). Dual economy, shared atomic transactions, Cloud Monitoring quota panel, Phase 10 shared Actions budget design complete. | No blocking item found in the record — appears stable, worth a direct status check since this is substantial infrastructure that's easy to lose track of given it's architecturally isolated from everything else in the studio. |
| **AntSim Redux** | Shipped/Deliberately Paused | Reached Phase 5, 90-test floor, real SOLID refactor. Closed via an explicit, named engine-death-pattern acknowledgment — a clean, chosen ship point, not a stall. | None — this is what a good stop looks like. Don't reopen without a real new pull. |

---

## 3. AI-Studio-Origin Track (per SDD v0.3 §7 — a legitimate category, not a queue waiting to be converted)

| Project | Status | Current State | Next Real Action |
|---|---|---|---|
| **Succession** | Active | Mid-development (Phase 6 area as of this session). Full persuasion-sim redesign, engine + orchestration + UI verified in stages. | Continue current phase sequence. |
| **SlimeGarden** | **Status Unconfirmed** | Substantial design work as of mid-July (SlimeDex codex, Life Stages, a partially-designed Color Tree system). No confirmation found since. | Direct status check needed — real, unfinished design threads (Garden cultivation, Training, the Galactic Layer, Tree deviation mechanics) were explicitly left open, not resolved. |
| **Trinity Siege/Combat** | **Status Unconfirmed** | Real architecture question (Bevy vs. egui/eframe) was left unresolved. Real design work exists. | Direct status check needed. Given VoidDrift's Rust chassis is now confirmed Far Future Dream, resolving Bevy-vs-egui for this specifically no longer needs to wait on that — worth deciding on its own merits if this thread is still live. |
| **7 Days to Fry** | **Status Unconfirmed** | Imported into the studio alongside KingMaker Squads (which has since been retired). No confirmation of 7 Days to Fry's own status since import. | Direct status check needed. |
| **TurboShells** | **Status Unconfirmed** | Named as one of two genuine cross-language-origin Lua-exception games (with VoidDrift) — implies an active or intended Rust port. No recent confirmation. | Direct status check needed. |
| BREWFIELD (pre-conversion), LEDGER, Slime Conquest | **Status Unconfirmed** | Previously tiered as "Built (AI Studio), Not Yet Deployed" per the site's own Legacy Projects taxonomy. | Not urgent — this tier is explicitly fine to leave as-is per §7's own framing. Listed for completeness, not as an action item. |

---

## 4. Retired (source preserved, read-only, explicitly removed from the live registry)

| Game | Superseded By |
|---|---|
| CorpWorld | Planet of Greed |
| KingMaker Squads | Planet of Greed |
| BrewField | Dissonance Depths |
| SlimeBreeder | (earliest precedent — established the retirement pattern itself) |

---

## 5. Shared Engine Infrastructure

| Piece | Status | Note |
|---|---|---|
| Four-file Lua contract + `RFDStudioMCP` | Stable, live | 28/0/0, port 8025, NSSM-registered |
| TS-native default (ADR-010/ADR-013) | Stable, current policy | Now the actual default, not the exception |
| Shared UI components (`ts/src/ui/components/`, ADR-008) | Active use | 6+ games |
| Shared logic (`ts/src/engine/shared/`) | Active, narrow | Demand-gated — combat resolver + components extracted from CorpWorld/Planet of Greed only |
| `artGen` module | **Built, not yet consumed** | `seededRandom.ts` + `types.ts` seam + shape primitives exist. Neither Shoal nor SlimeWorld actually uses it yet — see Shoal's row above, this is the same open item |
| Standalone publishing pipeline + `RFD_IT_Publishing` | Working | 7 games packaged, Butler-based, real analytics confirmed |
| Rust runtime (mlua bridge) | **Confirmed Far Future Dream** | Not active roadmap — VoidDrift remains fully separate native Rust, no relationship to the contract |
| Bevy vs. egui (studio-wide Rust graphical layer) | Open, deprioritized | Tied to the Rust runtime question above — low priority, but see Trinity Siege's row, which may not need to wait on this being resolved studio-wide |

---

## What actually needs your input, not mine

Everything tagged **Status Unconfirmed** above (5 items) is the real output
of this exercise — not busywork, but the specific, named gaps between what
I can verify from conversation history and what's true right now. A quick
direct check on each (even just "still alive, no change" or "dead, retire
it") is worth more than anything else this document could add.

---

*RFD Game Studio Status Board | v1 | August 15, 2026*
*A rollup, not a rewrite. Refresh it, don't rebuild it.*
