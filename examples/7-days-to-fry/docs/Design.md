# The Line ("7 Days to Fry") — Design.md (v4)
*July 2026 | Engine-agnostic. Implements to React-TS + Vite (Google AI Studio pipeline).*
*Supersedes v3 (`project:the_line:design_v3`) — v1/v2/v3 remain real history, marked superseded, not deleted.*
*Real, verified floor as of this revision: 130/130.*

---

## Vision

Watch a small crew of autonomous workers run your kitchen for seven real, escalating days — each day quietly teaching you the next real thing, not through a tutorial bolted on top, but through what actually unlocks — until surviving the week hands you the real game with nothing left held back.

A restaurant-management/tycoon sim on a colony-sim's autonomous-agent core. Not a twitch-reflex Diner Sim — the player never directly serves anyone. **The central, hard-won correction from v3 still holds and matters more now than ever:** legibility is not agency. Investigate, Station, and Attention are the real interaction model, present in full from the first minute — Week 1's progression is about the *menu and the shop*, never about withholding the player's actual tools.

---

## The Real Insight This Revision Locks In

The staged-teaching system named as a real, deferred need many directives ago was never a separate thing to design from scratch. **It's the Tier/Shop unlock sequence itself, run across seven real days instead of dumped on Day 1.** Surviving the week isn't a difficulty milestone bolted onto a menu-progression system running in parallel — completing the curriculum *is* what "surviving the week" means. One system, not two.

---

## The Real Week

| Day | What's real and new | Why here, specifically |
|---|---|---|
| **1** | Burgers only. No Fryer, no `wantsFries` roll at all — suppressed at order generation, not just hidden on the map. Investigate/Station/Attention fully live. | The core loop, undiluted. One pipeline, so autonomy and Quality register clearly before anything competes for attention. Gentlest real demand of the arc (5.00s/customer), correctly matched to gentlest complexity. |
| **2** | Night Shop opens. First purchase: **Fries.** Real, dramatic reveal — the Fryer's pre-reserved, currently-empty map slot fills in; `wantsFries` starts rolling. | The first purchase should feel structural, not incremental, or the shop mechanic itself won't register as meaningful. |
| **3–4** | **Basic Upgrades** become purchasable: Buffer Capacity, Stock Capacity, Extended Day Duration. Pure numeric, no map presence, no reveal mechanic. | Having just learned "purchases add new things" (Fries), the player now learns the shop's *other* flavor — quiet, strategic, numeric. |
| **5** | **Coffee-for-customers** unlocks. The Coffee Station — already visible, already in real use by Workers/Manager since Day 1 — visibly upgrades: customer-facing signage/window appears on the same physical station. Not a spawn, a promotion. | By now the player isn't a newcomer. Real complexity for someone ready for it. |
| **6–7** | **Soda** unlocks, landing as the Final Wave's internal escalation builds. Full toolkit and full menu converge right as the week's real climax hits. | Maximum complexity meets maximum difficulty, then both get tested together in the finale. |
| **7 → Night** | Week Survived. Real milestone screen, not a terminal state. | Nothing left to teach. Everything unlocked. |
| **8+** | **Tier 2.** Same real ramp formula (`demandTier = dayNumber`), uncapped, continuing exactly as it already scales through Days 1–7. No new mechanics invented for this. | "I'm seeing depth in the simplicity" — the depth already exists in Stock Units and demand pressure compounding. Tier 2 just means that's allowed to keep happening. |

---

## The Coffee Exception — stated precisely, because it's the one real nuance in this whole structure

Fryer and Soda are pure customer-order infrastructure — nothing else in the game needs them before their tier, so full physical absence (empty reserved slot → real construction-reveal) is clean and correct for both.

**Coffee is two real things sharing one name.** Staff infrastructure — needed Day 1, unconditional, already built, unchanged by any of this. And a customer revenue stream — gated behind Tier 2 same as Fries/Soda are gated behind their own tiers. The station stays visibly present and in genuine use by Workers/Manager from Day 1. What Tier 2 reveals is a real visual upgrade to that same physical station — not a spawn.

---

## Real Technical Approach

**`STATION_CONFIGS` stays the static structure it already is** — a full dynamization isn't warranted. Each station config gains a real `unlocked: boolean`, checked at every real consumption point:
- `chooseStation`'s scoring treats a locked station as permanently invalid — never selectable, not merely deprioritized.
- Rendering skips locked stations entirely.
- **Order generation respects the same flag** — `wantsFries` (and future `wantsCoffee`/`wantsSoda`) rolls are hard-suppressed to `false` until unlocked. The station being invisible doesn't help if demand for it still exists.

**Fryer's map space stays reserved from Day 1, empty, not reflowed.** Grill and Assembly do not shift to fill the gap. Reflowing would move every worker's real-time target coordinates the instant Fryer appears — visible disruption to something already in motion. A fixed, pre-allocated slot that fills in later is the stable choice.

**Basic Upgrades get none of the above.** Pure numeric modifiers, no physical form, no reveal mechanic — just purchasable when their day arrives.

---

## Design Pillars

*(unchanged from v3 — Autonomy Is the Show, Real Agency Not Just Legibility, Show Don't Explain, Nudge Never Puppet, Consequential Not Comprehensive Interruptions, The Shift Never Pauses For You, Owned Not Rented — all hold, none revised this pass)*

---

## MVP Scope

### Shipped and verified (130/130 as of this revision)
Everything through the Manager rotation fix, the Worker break-task commitment lock (now genuinely evidence-backed, not vacuously passing), full economic automation (Waste Buffer + Restock, both unconditional), and real per-Day P&L reporting.

### Real, next, in dependency order
1. **Station unlock/lock infrastructure** — the `unlocked` flag, `chooseStation` exclusion, rendering suppression, order-generation gating. This is the real foundation everything else in this revision depends on; nothing below can be built correctly before this exists.
2. **Day 1 Burgers-only rebalance** — a genuinely fresh, computed economic baseline. The existing `STOCK_UNITS_CAPACITY=3` and related numbers were measured against a *mixed* Burger/Fries flow; a single-pipeline Day 1 almost certainly serves orders faster (no Fryer-sync wait), meaning Stock likely depletes sooner than currently measured — on the one day meant to be most forgiving. Needs real, fresh probe data, not an assumption the old numbers still hold.
3. **Night Shop framework + Basic Upgrades** (Buffer Capacity, Stock Capacity, Extended Day Duration) — fully designed since the earlier "sensible upgrade system" conversation, real computed starting prices already sitting there unused.
4. **Fries as a real, gated Tier 1 purchase** — wiring the already-built Fryer/`wantsFries` pipeline behind the new unlock flag, plus the real construction-reveal visual moment.
5. **Coffee-for-customers (Tier 2)** — new `wantsCoffee` order attribute, new pipeline convergence at Window, the physical-upgrade visual treatment described above, and the real removal of the Day-7 hard stop in favor of the Tier 2 continuation.
6. **Soda (Tier 3)** — same real rigor as Fries originally got, its own dedicated pass.

### Explicitly deferred, unchanged reasoning from v3
Presets. Sims-style need-bar clusters. Seating. Manager Station Coverage. Accountability scoring. ADR-001 Skill/Aptitude. Hire/Fire, Bathroom, Customer needs/emotions beyond Quality, any Cash accumulation ceiling.

---

## Platform Targets & Technical Notes

*(unchanged from v3 — real formulas over eyeballed balance remains the standard for every number this document names as pending; the refactor, ADR-001 Decision Point 1, and the two-bug pattern noted in v3 all still hold as real, standing discipline)*
