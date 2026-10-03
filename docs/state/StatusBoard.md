<!-- GENERATED FILE — edit ts/src/status/board.data.ts, then run ts/tools/generate-status-board.ts -->

# RFD Game Studio — Status Board

*August 16, 2026 | RFD IT Services Ltd. | Generated from `ts/src/status/board.data.ts`.*

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

| Game | Status | Current State | Next Real Action | Menu | Tutorial | Visual | Sound | Last Updated |
|---|---|---|---|---|---|---|---|---|
| **Planet of Greed** | Active | Culture stat asymmetry implemented + balance-verified (60-game harness). House stats wired into all mechanics. UI/UX style split landed: per-House chrome themes via shared FactionTheme tokens, document surfaces stay neutral paper. | — | Shared | Y | 2026-08-15 | N | 2026-09-30 (direct file read) |
| **Shoal** | Shipped/Mature | TS-native migration complete (151.7x speedup). artGen fully consumed (canvas paths, hunger-aware specs, path caching). | — | N | N | 2026-08-15 | N | 2026-08-15 |
| **Mutant Battle Ball** | Active | TS-native migration done. Mid major creative overhaul — Neo Battlopolis, six-Brand Trinity, Body Part Synergy. | Continue feature build-out — genuinely mid-build, not near done. | Shared | N | 2026-08-15 | N | 2026-08-15 |
| **SlimeWorld** | Shipped/Mature | Live on itch.io + arcade. Survived a production crisis (missing Lua files in bundle, fixed retroactively across 5 games). artGen fully consumed. | — | N | Y | 2026-08-15 | N | 2026-08-15 |
| **Dissonance Depths** | Shipped/Mature | Live on itch.io + rfditservices.com. Source of the artGen module. | — | Shared | Y | 2026-08-15 | N | 2026-08-15 |
| **Gladiator Arena** | Active | Cyber-organic gladiator roster management. Turn-based tactical combat with continuous anatomy damage. Procedural sound effects implemented (Web Audio API). | — | N | N | 2026-08-16 | Y | 2026-08-16 |
| **Chimera Wilds** | Shipped/Mature | Live on itch.io + arcade. Lua-backed. | — | Shared | N | 2026-08-15 | N | 2026-08-15 |
| **ScrapCrawl** | Shipped/Mature | Live on itch.io + arcade. Lua-backed. | — | Shared | N | 2026-08-15 | N | 2026-08-15 |
| **Slime Coin** | Shipped/Mature | Live on itch.io + arcade. Lua-backed. | — | Shared | N | 2026-08-15 | N | 2026-08-15 |
| **Horse Racing** | Shipped/Mature | Live on arcade. Lua-backed. | — | Shared | N | 2026-08-15 | N | 2026-08-15 |
| **Slither Rogue** | Shipped/Mature | Live on arcade. Lua-backed. | — | N | N | 2026-08-15 | N | 2026-08-15 |

---

## 2. Separate Infrastructure

| Game | Status | Current State | Next Real Action | Menu | Tutorial | Visual | Sound | Last Updated |
|---|---|---|---|---|---|---|---|---|
| **VoidDrift** | Shipped/Mature | Rust/Bevy/Android + WASM. Phase 4a complete, live on itch.io — opening cinematic live, OpeningCompleteEvent wired via Phase 3b event bus (bug closed). cargo test 48/48 green (re-verified 2026-09-29). Act 1 of a locked 3-game narrative trilogy (VoidDrift -> Dissonance Depths -> SlimeWorld). | — | Y | Y | 2026-05-17 | N | 2026-09-29 (direct file read) |
| **VoidDrift Redux (web)** | Active | Fragment drift correction landed (FRAGMENT_DRIFT_RATE in engine.ts). Auto-dispatch FSM with manual toggle. Orbital canvas with zoom/pan. Web simulation, separate from native VoidDrift. | — | N | N | 2026-08-16 | N | 2026-08-16 |
| **House of Kings: Collab** | Active | Firebase/Firestore. Phases 0-10 + full security remediation arc complete. | Direct status check — architecturally isolated, easy to lose track of. | N | N | — | N | 2026-08-15 |
| **AntSim Redux** | Shipped/Deliberately Paused | Phase 5, 90-test floor. Closed via named engine-death-pattern acknowledgment. | — | N | N | — | N | 2026-08-15 |
| **Early Learning Buddy** | Active | Voice-powered learning companion. Speech recognition, fuzzy matching, AI-generated story beats. Intentionally unlisted from public arcade. | — | N | N | 2026-08-16 | Partial | 2026-08-16 |
| **TurboShells** | Blocked | Python/pygame legacy project (turtle breeding + racing). No game code in this repo — only the Feb 2026 audit doc (archive/rpgCore TURBOSHELLS_AUDIT_REPORT) and archived rpgCore racing/genetics modules adapted from it. The Lua carve-out protecting its port was retired by ADR-013 after the port lapsed. | Robert decides the completion path per ADR-013 — TS-native rebuild or drop — and the legacy source repo location needs confirming before any revive. | — | — | — | — | 2026-09-29 (direct file read) |

---

## 3. AI-Studio-Origin Track

| Game | Status | Current State | Next Real Action | Menu | Tutorial | Visual | Sound | Last Updated |
|---|---|---|---|---|---|---|---|---|
| **Succession** | Active | Persuasion-sim, mid-development. ADR-007 landed figure-locked persuasion methods (Chancellor=evidence, Archbishop=whisper, Commander=appeal) plus a first-run CourtPrimer via shared OnboardingGate. | — | N | Shared | 2026-08-15 | N | 2026-09-29 |
| **SlimeGarden** | Status Unconfirmed | Substantial design work as of mid-July (SlimeDex, Life Stages, partial Color Tree). Audit 2026-09-29: origin project merged with SlimeBreeder into the live SlimeWorld (ADR-023). | Recommendation only: retire, superseded by SlimeWorld (origin project per ADR-023; source preserved in examples/slimegarden). Retirement is Robert's call. | — | — | — | — | 2026-08-15 (research/inference) |
| **Trinity Siege/Combat** | Status Unconfirmed | Bevy vs. egui architecture question left unresolved. | Direct status check — no longer blocked on the Rust-chassis question, that is confirmed Far Future Dream now. | — | — | — | — | 2026-08-15 (research/inference) |
| **7 Days to Fry** | Shipped/Mature | Complete cooking-survival sim (7-day arc, win/lose). Registered in GAME_REGISTRY as an external demo and in website_collection. Own state doc (Aug 2026) reports 241/241 vitest floor — self-reported, not re-runnable in-repo. | Promotion decision if revived — TS-native port or permanent external status; wire its own test suite into a runner the studio executes. | Y | N | 2026-08-30 | N | 2026-09-29 (direct file read) |

---

## 4. Retired

| Game | Status | Superseded By | Current State | Last Updated |
|---|---|---|---|---|
| **CorpWorld** | Retired | Planet of Greed | Source preserved read-only. | 2026-08-15 |
| **KingMaker Squads** | Retired | Planet of Greed | Source preserved read-only. | 2026-08-15 |
| **BrewField** | Retired | Dissonance Depths | Source preserved read-only. Had IntroScreen using shared TitleScreen. | 2026-08-15 |
| **SlimeBreeder** | Retired | — | Established the retirement pattern itself. | 2026-08-15 |

---

## 5. Shared Engine Infrastructure

| Piece | Status | Note |
|---|---|---|
| Four-file Lua contract + `RFDStudioMCP` | Stable, live | 28/0/0, port 8025, NSSM-registered |
| TS-native default (ADR-010/ADR-013) | Stable, current policy | Now the actual default, not the exception |
| Shared UI components (`ts/src/ui/components/`, ADR-008) | Active use | 6+ games |
| OnboardingGate (`ts/src/ui/components/OnboardingGate.tsx`) | Built, 2 consumers | Shared fire-once gate mechanism extracted from SlimeWorld. Consumed by SlimeWorld (original) + Planet of Greed (validation) |
| Guided First-Action Walkthrough | Single instance, watching | `planetofgreed/GuidedWalkthrough.tsx` — guides real gameplay decisions with state-derived defaults. Not extracted yet — watching for a second independent build |
| FactionTheme (`ts/src/ui/components/FactionTheme.tsx`) | Built, 1 consumer | Per-faction `--faction-*` CSS-var theme contract (ADR-014) built for Planet of Greed's per-House chrome. Known second consumer: Mutant Battle Ball Brands |
| Shared logic (`ts/src/engine/shared/`) | Active, first-class | ADR-014: shared engine modules are the default, not demand-gated |
| `artGen` module | Built AND consumed | Consumed by Shoal (canvas paths, hunger-aware specs) and SlimeWorld (seeded random, polygon generation) — ADR-014 proof case |
| Standalone publishing pipeline + `RFD_IT_Publishing` | Working | 7 games packaged, Butler-based, real analytics confirmed |
| Rust runtime (mlua bridge) | **Confirmed Far Future Dream** | Not active roadmap — VoidDrift remains fully separate native Rust |
| Bevy vs. egui (studio-wide Rust graphical layer) | Open, deprioritized | Low priority — see Trinity Siege's row above |

---

*RFD Game Studio Status Board | Generated from `ts/src/status/board.data.ts`*
*A rollup, not a rewrite. Refresh it, don't rebuild it.*