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
- **Player relationship:** the primary lever tuned turn to turn, and the primary target of upgrades.
- **Visual signature:** a pacing throttle control in the Upgrades modal, with upgrade tiers that visibly change its dial/readout.
- **Progression:** upgrades (bought from earnings) raise the max safe pace and add capability — smarter routing, predictive pacing — over time. As of this revision, Upgrades absorbs what was originally scoped as separate IT Support and Training systems — both folded in rather than kept as distinct menus, since they were tuning the same underlying capability from two different UI surfaces.

### Office (Build)
- **Role:** the physical footprint the floor operates inside of. Reintroduced deliberately — this entity was cut early in design (the real job has no equivalent; "I just watch the Dialer") and reinstated afterward as a conscious fun-over-realism call, not a design error being corrected. The reality-vs-fun tension named early in this document resolves in fun's favor here, specifically.
- **Player relationship:** owned and expanded — the player builds outward from a small room toward a larger corporate footprint over time.
- **Visual signature:** the permanent isometric floor view itself grows — more desks, more space, a visibly larger operation — as the player invests in it.
- **Progression:** small room → larger floor → full corporation, an explicit long-arc progression track distinct from the daily List/Dialer/Quota loop. Exact pacing and stages are not locked here — a directive-stage design question, not a GDD-level one.

Agents are explicitly **not** an entity — they're floor-state, observed and occasionally navigated around, never owned or directly commanded. Recruiting, Wage Management, Staff, HR, and Training — the original cubicle-tycoon-era agent-management systems — are not player-commanded menus. They run as auto-handled background systems that still affect floor outcomes (morale, capacity, turnover) causally rather than randomly, but the player never opens a menu to direct them.

### Script (tentative — not yet a locked entity)
Script tuning (greeting style, empathy level, pacing) is real BPO practice the player-designer has direct experience with, and it survived the menu cut as "not bad in concept." It is explicitly **not yet defined** as a system with real mechanics, inputs, or outputs — treat as under consideration, not scoped, until a dedicated design pass locks it the way List/Dialer/Quota were locked.

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

**Revised per Phase 2b — RollerCoaster Tycoon pattern, not a screen-based Dashboard.** What the player sees at game start: the office floor, permanently and full-screen, exactly as in the original prototype — never replaced by another screen during normal play. A thin bottom status bar shows quota progress, list health, and dialer pace at a glance. The side menu (Build, Upgrades, Reports, tentatively Script) opens popup modals layered over the still-visible, still-running floor — closing a modal returns to the same floor, unchanged, never a navigation.

**Screens:**
- **Floor** (permanent, always visible during normal play) — the world itself, with the side menu and bottom status bar around it.
- **Popups** (Build, Upgrades, Reports, Script) — modal windows over the floor, matching the existing modal pattern already used by the original prototype's menu system.
- **After-Hours** (the one legitimate full-screen exception) — a day-boundary transition screen, not a popup, closer to a scenario-complete moment than a stat window.

Primary action surface: the popup modals opened from the side menu — the floor itself is watched, not directly interacted with.

Always visible regardless of state: the floor, the bottom status bar (quota, list health, dialer pace), and the side menu.

---

## MVP Scope

### Included
- One vertical: **LedgerRate Merchant Services** — B2B, merchant-processing/credit-card-rate-savings cold calling. Chosen deliberately because B2B is the domain the player-designer actually knows firsthand; consumer-list consent-chain nuance is not something to fake.
- **List**, **Dialer**, and **Office (Build)** as the commandable entities. Build was cut early and reinstated deliberately — see Entities section.
- The daily-quota structure with the day-shift / after-hours split.
- A permanent, always-visible Floor view (RollerCoaster Tycoon pattern — the world is never replaced by a screen; interactive controls are popups layered over it), repurposing the existing isometric office visualization, with agent-state "weather" and occasional remote-assist popups.
- The side menu, locked to: **Build**, **Upgrades** (Dialer, absorbing former IT Support and Training scope), **Reports**, and tentatively **Create/Alter Script** (not yet a defined system). Recruiting, Wage Management, Staff, and HR are removed as player-facing menus entirely and run as auto-handled background systems instead.
- A real-math pass on the existing HUD: the current employee-count display (`agents.length * 10 + 2`) and the hardcoded Day-68/₱458,720 starting state (both artifacts of matching the original fake screenshot) are replaced with real, earned values before this ships as anything beyond a tech demo. (Delivered in Phase 2.)

### Explicitly Deferred
- The five fictionalized consumer verticals (Vehicle Protection Plans, Senior Health Screening, Mobility & Comfort Devices, Dealership Service BDC, Fraternal Order Charity Drive) — deferred specifically because they require consumer-list consent-chain nuance the player-designer doesn't have lived experience with, unlike the B2B vertical shipping in the MVP.
- Any persistent multi-week progression or campaign-unlock arc beyond Build's small-room-to-corporation track — the daily loop needs to prove itself fun first; Build's own pacing/stages are a directive-stage question, not locked here.
- Script as a real system — concept survives, mechanics don't exist yet.
- Direct agent management via a player-facing menu — agents stay weather; Recruiting/Wage/Staff/HR run automatically in the background instead.

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
- List decay rate, pacing safety thresholds, and quota target numbers are balance values, not design-locked — tune empically once the systems exist, not guessed at here.
