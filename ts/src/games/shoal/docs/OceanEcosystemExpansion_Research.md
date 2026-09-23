# Shoal — Ocean Ecosystem Expansion Research

*v0.1 | August 2026 | Real research: marine biology, reference games, implementation notes. Not a directive — design reference for the next real environment-building pass.*

---

## Part 1 — Real Marine Habitats Beyond Reeds/Coral

| Habitat | Real, defining traits | Real fit for Shoal |
|---|---|---|
| **Kelp forest** | Large brown algae (*Macrocystis*), needs hard substrate + high nutrients + light. Giant kelp can grow 30-60cm/day in ideal conditions. Associated with upwelling zones (cool, nutrient-rich water from depth). | **High** — genuinely new spatial axis reeds/coral don't offer: real vertical structure. Fish could use kelp height as cover, distinct from reef's flat/clustered cover. |
| **Seagrass meadow** | Flowering plants (not algae) in shallow, sheltered coastal water. Stabilizes sediment, real nursery habitat for juveniles. | Medium — softer, denser cover than reef; a real "nursery zone" concept (juvenile fish safer here) is a real, distinct gameplay hook. |
| **Hydrothermal vents** | Chemosynthesis, not photosynthesis — a real, alternate energy source entirely. Mineral-rich, near-boiling water from tectonic activity. Real, extreme, specialized fauna (tube worms, yeti crabs). | Medium-high — a real, distinct resource zone (not just more algae) with its own real chemistry-based logic, could be Shoal's "rare, valuable, dangerous" tile type, functionally different from algae hubs rather than a reskin. |
| **Open pelagic zone** (epipelagic/mesopelagic) | The water column itself, not a fixed structure — depth-banded (sunlit → twilight → midnight zones), real light/pressure gradients. | Already partially present via Shoal's depth-band system — real opportunity to make depth bands feel more distinct (twilight-zone creatures, light-avoidance behavior). |
| **Rocky reef / tide pools** | Real, distinct from coral reef — hard substrate, wave-exposed, real tidal fluctuation stress. | Lower priority — mechanically closer to existing reef, less new gameplay surface. |

---

## Part 2 — Real Biology for the Orca/Whale Role-Fill Mechanic

**Real, confirmed precedent for the sex-change idea, more precise than "clownfish":** the **Blue-headed Wrasse** (*Thalassoma bifasciatum*) — protogynous sequential hermaphroditism. One dominant "terminal phase" male controls a harem. When he's removed (predation, etc.), the largest female **transforms**, with a real, staged timeline:
- **Minutes to hours:** visible signal — temporary spawning colors (bluish head, darkened fin tips), aggressive/courtship behavior begins.
- **3 days:** ovarian tissue begins to disappear.
- **4-6 days:** testes development and full male coloring complete.

This is a much better real model for the "Whale fills the Orca void" idea than instant swapping — a real, visible, multi-stage transformation with an early tell before the full change completes.

**Real, confirmed orca facts directly relevant to the design:**
- Orcas are genuine apex predators — **no natural predators of their own**, confirmed directly. The food chain has a real top; nothing needs to threaten the Orca itself.
- **Transient/Bigg's ecotype specifically** (not all orcas) are the mammal/whale-hunters — Resident orcas eat fish, Offshore orcas are a third, distinct type. If implemented, the Orca should be flavored as this specific real ecotype.
- **Orcas genuinely do hunt sharks** — a real, documented case (Costa Rica, killer whale predation on a carcharhinid shark) — confirms Orca-preys-on-Shark is biologically real, not just game balance.
- Real kill-rate data: orcas hunt grey whale **calves** specifically far more than healthy adults (0.11 calves per orca per 24hr vs. rare, notable adult-hunting events like the real, documented 9-hour, 15-orca humpback hunt at the Farallon Islands — described as atypical even by researchers).
- Real, spectacular documented tactic: orca pods cooperatively **herd** herring schools upward via coordinated diving, splitting large schools into smaller, vulnerable clusters — a real, potentially implementable pod-hunting behavior distinct from a lone-predator chase.

---

## Part 3 — Real Reference Games

| Game | Real, relevant mechanic | Why it matters for Shoal |
|---|---|---|
| **Ecosystem** (Steam) | Procedural evolution sim — creatures have real combat stats determining food-chain role, forced-trait tuning tools (size, drag/torque physics), sculptable procedural terrain including caves for predators to lurk in. | The closest real analog to Shoal's own ambition — an emergent, tool-assisted sim rather than a scripted eat-em-up. Worth a direct look at how it exposes tuning to the player, if at all. |
| **Rain World** | Real, repeatedly cited by players specifically for predator-prey relationships that happen whether or not the player is watching — no scripting, genuinely emergent. | Exactly the design quality Shoal already has and should protect — real, independent confirmation this is the right instinct, not a novelty. |
| **Food Chain: Ocean Predators** (itch.io) | Real, direct precedent: morph-up-the-food-chain culminating in orca as a top form; uses rocks/seaweed/coral explicitly as concealment mechanics. | Directly on-point for the "environment as strategic cover" question — real, existing proof this pattern works as a player-facing mechanic. |
| **Feeding Frenzy / Feed and Grow: Fish** | Classic "eat smaller, avoid bigger, grow" — simple, legible size-hierarchy communication. | Useful reference for how to visually communicate real predator/prey size relationships at a glance, if Shoal ever wants clearer at-a-glance threat-reading. |
| **Odell Lake** (older, real, teaching-game lineage from the Oregon Trail studio) | Player-as-prey, real ecological choice/consequence structure (dive deep vs. surface vs. fight). | Real, historical precedent for putting the player in a genuinely vulnerable ecological role rather than always at the top. |

---

## Part 4 — Potential Implementation Methods

**Kelp forest as a real, new zone type:** a vertical structure primitive distinct from Shoal's existing flat algae hubs — real design question: does kelp need its own collision/occlusion logic (a real vertical "climbing" cover value), or can it reuse the existing spatial-hash neighbor system with an added height dimension?

**Hydrothermal vents as a distinct resource zone:** not a reskinned algae hub — a real, separate resource type with its own chemistry-flavored logic (matching the studio's existing "extend real logic, don't reskin" discipline already applied to Shoal's color/decay work). Real candidate for tying into the shared `aiBehavior` module's upcoming FSM work — a vent could be a real "Foraging" sub-target distinct from algae.

**Orca/Whale role-fill, grounded in the wrasse mechanism specifically:**
1. A real, tracked "Orca slot" — filled or empty, matches the wrasse's single-dominant-individual pattern.
2. When empty, real, existing Whale population entities check real, existing social/proximity conditions (matching how the wrasse mechanism is socially cued, not random).
3. A real, staged transition — a visible signal state first (color/behavior change, matching the wrasse's minutes-to-hours tell), then a longer full transformation (matching the wrasse's multi-day gonadal change) before the entity actually becomes a real, functional Orca.
4. Given the aiBehavior/Yuka directive currently in flight adds real FSM capability to Shoal specifically for this kind of staged, state-driven behavior — this role-fill mechanic is a strong, real candidate to build directly on top of that work once it lands, rather than as a separate, parallel system.
5. Orca behavior itself: reuse Shark's existing hunt-state logic where it genuinely applies (single-target pursuit), but the real, documented pod-herding tactic (splitting a school, driving it toward the surface) is a genuinely distinct behavior worth its own real logic if pursued — not just a reskinned, faster shark.

**Real, honest open question, not resolved here:** whether "a single Orca at any given time" needs a hard population cap enforced in code, or whether the wrasse-style social/proximity trigger naturally produces that scarcity on its own without an explicit cap. Worth testing the natural behavior before assuming a hard limit is needed.

---

*Shoal | RFDGameStudio | August 22 2026*
*Real biology first, then real games as proof the mechanic reads well to a player, then implementation — in that order.*
