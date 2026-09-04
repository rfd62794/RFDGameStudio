# Call Center Tycoon — Design.md
*September 2026 | Engine-agnostic in structure. Retrofits onto the existing React + Vite + Canvas prototype (not a Phaser target — a working non-Phaser build already exists and passes real tsc/vite checks).*

---

## Vision
Pressured competence under imperfect information — you know exactly what a good list looks like and what a well-paced dialer feels like, but you don't control what you're given, and you find out a list is bad in real time, with real consequences.

You're the remote IT-pilot behind DialSmart Contact Solutions' dialer operation. You don't manage the people on the floor — that's your counterpart's job, handled off-screen. You manage the data and the machine that feeds them. ACBS ("We know the ABCs of opening, so you can use the ABCs of closing") supplies the offshore floor. LedgerRate Merchant Services is the client whose daily quota you're chasing.

---

## Core Loop
**Tune the list (purity, freshness, source; swap in/out as lists fail or empty) → set dialer pace against available agents → calls land on the floor and get worked → see results (connect rate, CSAT, compliance flags, revenue toward quota) → adjust for the next batch.**

- **Idle variant (day-shift):** the dialer keeps running at whatever pace was last set, and the currently loaded list keeps getting worked, without further input. This is where "limited control, occasional intervention" lives — the loop runs on its own between check-ins.
- **Active variant (after-hours):** the player spends earnings on Dialer/Data upgrades and chooses tomorrow's list allocation from what ACBS makes available. All structural decisions happen here — nothing structural changes mid-shift.

---

## Design Pillars

- **Limited Control, Full Responsibility** — You don't choose your leads, only how you work them. The vendor decides what you're given; you decide how to use it, and you own the outcome either way.
- **Agents Are Weather** — The floor is observed and occasionally assisted, never directly commanded. Consequences of upstream decisions show up as floor behavior downstream, not as something you micromanage.
- **The List Is the Character** — Lists have real properties (purity, freshness, source, volume) that decay and expire. A list is a resource with behavior, not a static number on a spreadsheet.
- **Quota Is the Clock** — Every day-shift is a closed daily challenge against a target. The day resolves — win, lose, or partial — regardless of what's left undone. No shift bleeds into the next.
- **Consequences Surface Where You're Watching** — A bad list or bad pacing decision always shows up visibly on the Dashboard or the Floor feed (queue spikes, compliance flags, CSAT drops) — never as an invisible stat penalty you'd have to dig for.

---

## World

**Dashboard.** The primary space the player inhabits — quota tracker, list health readouts, dialer pacing controls, compliance flags, connect-rate and CSAT numbers. This is where 80% of play happens.

**The Floor** is a secondary camera-view, not the world itself — a live feed of the ACBS office, agents visibly working their states, occasionally throwing an issue up that the player can remotely assist with. It's a *consequence readout*, not a control surface.

Player relationship to the world: remote operator, piloting from outside. Never physically present on the floor — the god-mode/blended-lines instinct from early in this conversation is resolved by this split: you watch both views without needing a narrative excuse for how.

**Permanently off-screen:** ACBS's internal sourcing process — where lists actually originate, never shown or explained. LedgerRate's own internal business — the player never sees the client's operation, only the contract and the quota.

**Always visible:** quota progress, current list health, dialer pace setting.

---

## Entities

### List
- **Role:** the raw material the dialer works. Determines connect rate, CSAT, and compliance risk downstream.
- **Player relationship:** owned and curated — accepted from ACBS's offered pool, allocated, swapped, discarded.
- **Visual signature:** a batch/card representation with purity, freshness, and remaining-volume readouts that visibly degrade as it's worked.
- **Progression:** depletes as it's dialed; quality degrades over time if not worked; eventually empties or goes stale and must be swapped for a new batch.

### Dialer
- **Role:** the pacing engine — how aggressively calls are pushed to the floor relative to available agents.
- **Player relationship:** the primary lever tuned turn to turn, and the primary target of after-hours upgrades.
- **Visual signature:** a pacing throttle control on the Dashboard, with upgrade tiers that visibly change its dial/readout.
- **Progression:** upgrades (bought after-hours from earnings) raise the max safe pace and add capability — smarter routing, predictive pacing — over time.

Agents are explicitly **not** an entity — they're floor-state, observed and occasionally navigated around, never owned or directly commanded.

---

## Resource Economy

- **Money** — Source: completed calls, paid per LedgerRate's contract payout rate. Sink: Dialer and Data upgrades, purchased after-hours. Terminal currency — doesn't convert into anything else.
- **List Quality (purity/freshness)** — Source: ACBS's offered pool each day, limited choice. Sink: consumed and degraded by dialing. Conversion: quality directly drives connect rate and compliance-flag risk.
- **Quota Progress** — Source: calls that convert, counted against LedgerRate's daily target. Sink: resets every day-shift. Conversion: quota result (met/missed/partial) determines the day's payout and standing with the client.

**Idle rate:** during a day-shift, calls continue generating and being worked at the last-set pace even without further player input — that's the literal mechanical expression of "limited control."

**Session cap:** a day-shift ends at shift close regardless of remaining list volume. What happens to unworked list volume (carries over vs. expires) is a balance/rules question for the directive stage, not locked here.

---

## Session Design

| Session Length | What the player produces |
|---|---|
| 2 minutes | A mid-shift check-in — catch a list about to empty or fail, swap it before the floor stalls. No deep decision-making, just staying ahead of failure. |
| 5 minutes | A full day-shift — monitor quota progress, react to a couple of list failures or floor issues, land on a shift result. |
| 10 minutes | A full daily cycle — day-shift plus the after-hours phase: spend earnings on Dialer/Data upgrades, choose tomorrow's list allocation from ACBS's offer. |

---

## UI Architecture

What the player sees at game start: the Dashboard — LedgerRate's quota tracker, a list health panel (purity/freshness/volume of the currently loaded list), the dialer pace throttle, connect-rate/CSAT/compliance readouts, and a toggle over to the Floor camera-view.

**Screens:**
- **Dashboard** (primary, day-shift) — quota, list health, pacing, compliance flags.
- **Floor** (secondary, toggleable camera-view) — agent states, occasional remote-assist events.
- **After-Hours** (planning phase) — Dialer upgrades, next day's list allocation from ACBS, shift summary.

Primary action surface: the Dashboard — this is where the player spends the large majority of their time.

Always visible regardless of screen: quota progress, current list health, dialer pace setting.

---

## MVP Scope

### Included
- One vertical: **LedgerRate Merchant Services** — B2B, merchant-processing/credit-card-rate-savings cold calling. Chosen deliberately because B2B is the domain the player-designer actually knows firsthand; consumer-list consent-chain nuance is not something to fake.
- **List** and **Dialer** as the only commandable entities.
- The daily-quota structure with the day-shift / after-hours split.
- The Floor camera-view, repurposing the existing isometric office visualization, with agent-state "weather" and occasional remote-assist popups.
- A real-math pass on the existing HUD: the current employee-count display (`agents.length * 10 + 2`) and the hardcoded Day-68/₱458,720 starting state (both artifacts of matching the original fake screenshot) are replaced with real, earned values before this ships as anything beyond a tech demo.

### Explicitly Deferred
- The five fictionalized consumer verticals (Vehicle Protection Plans, Senior Health Screening, Mobility & Comfort Devices, Dealership Service BDC, Fraternal Order Charity Drive) — deferred specifically because they require consumer-list consent-chain nuance the player-designer doesn't have lived experience with, unlike the B2B vertical shipping in the MVP.
- Any persistent multi-week progression or campaign-unlock arc — the single-vertical daily loop needs to prove itself fun on its own first.
- Direct agent management or floor control beyond remote-assist popups — agents stay weather, not a commandable entity, per locked design.

---

## Platform Targets
- Primary: itch.io HTML5 — matches the existing prototype's Vite build already producing working output.
- Secondary: not yet decided — defer.
- Build: Vite → `dist/` → zip → itch.io upload, matching RFDGameStudio's existing Butler-based publishing pipeline.

---

## Technical Notes
- This is a **retrofit, not a fresh build.** The existing React + Vite + Canvas isometric prototype (verified: `tsc --noEmit` clean, `vite build` succeeds, real non-trivial agent state machine already driving productivity/happiness) is the real foundation. List and Dialer systems get built into it; the game doesn't get rebuilt around them.
- The incoming-call generator currently in the prototype (`Math.random() < 0.75` flat coin-flip) needs to be replaced with output driven by the new List/Dialer systems — this is the core mechanical change the whole GDD exists to specify.
- Offline-first / persistence requirements: not yet decided. Flag as an open question for the game-sdd/directive stage, not resolved at the GDD level.
- List decay rate, pacing safety thresholds, and quota target numbers are balance values, not design-locked — tune empirically once the systems exist, not guessed at here.
