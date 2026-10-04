# ADR 0001: Zodiac Synergy System (Revision 6, Track 1)

## Context
KingMaker Squads introduces a Zodiac identity axis for units to expand tactical squad composition options through celestial alignment synergies.

## Decisions

### 1. Pure Random Zodiac Assignment at Creation
- Zodiac assignment (`assignRandomZodiac()`) is assigned purely randomly from the 12 astrological signs upon unit creation in `createUnit()`.
- It acts as an independent identity axis alongside archetype and rank tier.

### 2. Standard Zodiac Opposition Wheel
- Celestial alignment synergy (`celestial_alignment`) relies on real opposition pairs across the astrological wheel:
  - Aries ↔ Libra
  - Taurus ↔ Scorpio
  - Gemini ↔ Sagittarius
  - Cancer ↔ Capricorn
  - Leo ↔ Aquarius
  - Virgo ↔ Pisces
- Each pair detected in a squad contributes 2 units toward the `celestial_alignment` count without double-counting units across multiple pairs.

### 3. Purely Additive Synergy Mechanics
- No negative or penalty synergies (such as `discordant_signs`) are included.
- Non-opposing or same-sign units simply do not trigger celestial alignment, preserving the rule that all synergies in KingMaker Squads are strictly additive.
