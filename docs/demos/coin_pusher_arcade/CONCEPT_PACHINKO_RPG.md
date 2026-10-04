# coin_pusher_arcade -> pachinko-style RPG: concept and replan (2026-10-04)
Robert, 2026-10-04 17:17: "Coin pusher can be reworked into a pachinko style rpg I think." Supersedes the PARK verdict in DIRECTION.md. Tuning knobs reference the planned `docs/superpowers/specs/2026-10-04-tuning-tools.md`.

## 1. Pitch and player fantasy
- Launch glowing balls down a tall peg board; every bounce is a spell you aimed.
- Balls land in pockets and enemy targets: damage, loot, XP, healing.
- Between volleys you upgrade a small party and pick one ball skill (split, pierce, heal).
- Five stages and a boss in a 10-15 minute run, with a clear win and a clear lose.
- Fantasy: "I am a tiny hero who wins by lining up one lucky bounce." Luck is shaped by aim and build, never punishing.
- Differs from slime_coin: that is a real-time score shooter on a shelf; this is a turn-based, vertical, character RPG.

## 2. Core loop
Aim (drag the launcher) -> release a ball -> bounces through pegs -> lands in a pocket or hits an enemy -> damage/loot/XP -> pick an upgrade between volleys -> next stage -> boss.
One volley = 5 balls (knob). Enemies sit on the board as peg-sized targets; pockets at the bottom give effects.
Worked first-play script (60 s):
1. 0-5 s: title card "Pegs & Pockets: tap to start". One tap. Board is empty and still; a ghost ball shows the aim line.
2. 5-15 s: a pulsing arrow says "Drag to aim, release to launch". Ball 1 bounces down and hits a Goblin: -4 HP, coin burst, cheerful chime.
3. 15-30 s: balls 2-5 resolve. One lands in the Heal pocket (hero +3). Goblin dies: +10 XP, a loot chest drops.
4. 30-45 s: volley ends; 3 upgrade cards appear (Split Ball, Bigger Ball, +1 ball). Tap one; the first pick is always a strong one.
5. 45-60 s: stage 1 clears at about 55 s with a visible "Stage 1 clear" and the next stage preview. No failure is possible in the first minute.

## References we draw from (accessed 2026-10-04 via web search; Robert 17:2x)
- BALL x PIT ([Steam](https://store.steampowered.com/app/2062430/BALL_x_PIT/), [guide](https://www.thegamer.com/ball-x-pit-complete-guide/)): brick-breaker roguelite; balls hit waves of enemies; 60+ ball types, two balls at level 3 fuse into an evolution (43); 16 characters each with a ball quirk; base-building (New Ballbylon) between runs.
- Borrow: ball-type evolution (two skills merge: Split + Pierce = Shard Rain, a P2 stretch, 3-5 recipes only); each hero owns a ball type; short runs plus a small between-run unlock track (relics) for the "one more run" hook.
- Do NOT copy: free-aim brick-breaker bouncing in a pit, enemies descending in real time, a big base-builder. Our identity stays pegs, pockets, turn-based volleys.
- "Billionaire": title unconfirmed. Candidates found: Pachincro (Steam, 2026-03: pachinko-plinko incremental with a big skill tree; transfer: money per peg/pocket, upgrade tree), Billionaire Simulator (Steam 2023: click-to-wealth idle; transfer: escalating wealth numbers), Idle Town Billionaire / AI Empire (idle with prestige reset; transfer: prestige = restart with permanent boosts). No "Plinko Billionaire" title found.
- Lightly adopted either way: pocket multipliers (x2, x5 pockets bank gold), big escalating numbers on pop-ups, and a prestige-style restart that keeps relics.

## 3. RPG layer
- Hero + 2 party slots (Knight, Mage, Rogue): each owns a ball colour and skill. Stats: HP, ATK (ball damage), LUCK (pocket weight), BALLS per volley.
- Ball skills (pickable, max 4 per run): Split (splits in 2 at first peg hit), Pierce (passes through one enemy), Heal pocket (pocket heals party), Bomb (area damage), Magnet (nudges toward enemies).
- Enemies: 3-5 targets per stage with HP (3 to 20) that strike back once per volley for small damage; boss at stage 5 with a weak-point pocket.
- Loot: gold (buys one upgrade between stages), relics (passive, e.g. +1 bounce); drop rates in YAML.
- Run: 5 stages, 3 volleys each, 10-15 min. Win: boss dead. Lose: party HP 0 -> "Try again" restarts at stage 1 with a small kept-relic bonus.
- Persistence: localStorage only (best stage, relics unlocked, settings) via engine/shared/persistence, as App.tsx:60-65 does today. No mid-run save (a run is 15 min). No multiplayer, no live-ops.

## 4. Keep / cut / rewrite (ts/src/games/coin_pusher_arcade, 3,536 lines)
Engine choice: pure TS game, not Lua-over-YAML. A pachinko needs deterministic seeded fixed-step physics, and the existing `stepBoard(state, nowMs, rng)` pattern already injects clock and rng (physics.ts:5), so tests are deterministic; Lua would add a runtime for no gain. Content (enemies, relics, stages, drops) lives in YAML read at build time. Reuse physics.ts's circle maths if sound; add a small `logic/pegs.ts` for static peg/wall/pocket collisions.
| Item | Verdict | Lines |
|---|---|---|
| logic/physics.ts (seeded step, circle collisions) | KEEP pattern and `resolveCollisions`; strip pusher/shelf code | 477 -> ~200 |
| logic/pegs.ts (peg/wall/pocket collision, restitution) | NEW, small, tested | ~150 |
| components/render.ts + BoardCanvas.tsx | REWRITE to vertical board, reuse draw helpers | 797 -> ~500 |
| utils/sound.ts | KEEP | 301 |
| RewardWheelModal.tsx + logic/wheel.ts | KEEP wheel as boss/stage-clear reward | 211 |
| components/HelpModal.tsx | KEEP, reword | 68 |
| PocketCoinPickerModal, PocketHand, logic/coins.ts, logic/combo.ts | CUT (pocket coins duplicate slime_coin); salvage combo as "chain bonus" | 419 |
| components/SidePanel.tsx | CUT; bottom HUD instead | 302 |
| App.tsx | REWRITE as small screens (Title, Run, Upgrade, End); keep EndStateScreen and persistence | 563 -> ~250 |
| data.ts, types.ts | REWRITE as YAML plus a loader | 383 -> ~150 TS + YAML |
| tests (446 + 177 lines) | REWRITE around pegs, stage data, run state | |

| | slime_coin | pachinko RPG |
|---|---|---|
| Genre | coin pusher on a shelf | pachinko board with an RPG party |
| Input | real-time fire | aim then launch, turn-based volleys |
| Win | rising score target (15 rounds) | defeat enemies, beat a boss in 5 stages |
| Progress | chips, shop, tokens | party skills, relics, loot |
| Orientation | wide board | tall portrait board |

## 5. Phone-first layout (portrait 390x844 first)
- Board fills the width: 390 x about 560 px canvas; HUD strip (party HP, volley counter) above; thumb launcher zone in the bottom 25% (drag anywhere in it; 44 px minimum targets).
- Safe areas: padding with env(safe-area-inset-*); the shell's return pill floats top-left.
- Cabinet: the embed is about 373x210 (all shell games), unusable for a tall board. Declare `phone: 'fullscreen'` (redesign spec c3): portrait DOM+canvas, no width need, so no rotate-hint. Until the shell supports it (D2.1), the title shows an "Open full screen" button. Desktop: board centred at about 420 px wide.

## 6. Tunable knobs (for the planned tuning tools)
peg_density (pegs per row, 5-9), peg_radius, bounce (restitution 0.4-0.9), gravity, ball_speed (launch power), ball_radius, balls_per_volley (3-8), aim_assist (0-1), pocket_weights (heal/gold/damage), enemy_hp_curve (base and per-stage multiplier), enemy_strike (damage per volley), boss_hp, drop_rate_gold, drop_rate_relic, xp_per_kill, upgrade_choices (2-4), rng_seed (fixed for tests).

## 7. First-minute "inviting" checklist
- [ ] Title with a one-line promise and one big Start (not a modal).
- [ ] First screen never shows a mid-run state or a raw id (today's header shows `coin_pusher_arcade`); use the label.
- [ ] No modal before first play (today's "CHOOSE A POCKET COIN!"); hints are inline and fade after use.
- [ ] First ball is guaranteed to hit something; first upgrade is strong.
- [ ] Every ball gives feedback (sound, number pop); no fail state in minute one.
- [ ] Encouraging copy ("Nice bounce!"); defeat says "Almost! Keep your relics."
- [ ] Works at 390x844 with no horizontal scroll; mute button reachable.

## 8. Phases (each ships something playable)
| Phase | Size | Ships | Verify |
|---|---|---|---|
| P0 Board toy | M | Title, vertical board, aim/launch, pegs, 3 pockets, score | `cd ts && npx vitest run tests/test_coin_pusher_arcade_pegs.ts`; Playwright 390x844 shows title then a bouncing ball |
| P1 One-stage RPG | M | enemies with HP, hero HP, volleys, win/lose, restart, YAML stage data | vitest stage/run tests; screenshot of a won stage |
| P2 Full run | L | 5 stages, boss, upgrade cards, skills (split, pierce, heal), loot, wheel | vitest plus a seeded full-run test with a deterministic win |
| P3 Polish | M | cover, sound, copy, localStorage best, `phone: fullscreen`, build script, knobs wired | `cd ts && npm run build:coin_pusher_arcade`; 390x844 screenshot; polish Tier A pass |

## 9. First three Devin directives
1. Pegs module and tests: `logic/pegs.ts` (peg/wall/pocket collisions on the seeded step) plus vitest determinism tests - M - none.
2. Pachinko board P0: Title screen, vertical BoardCanvas, aim/launch, remove SidePanel and pocket-coin code, new label - M - directive 1.
3. Stage and enemy data P1: YAML stages/enemies, run state (hero HP, volleys, win/lose, restart), tests - M - directive 2.

## Open questions for Robert (recommended default first)
0. Which Billionaire game did you mean? Default (best guess, unverified): a pachinko/plinko incremental like Pachincro, so we borrow pocket multipliers and the upgrade tree.
1. Name: keep "Coin Pusher Arcade" or rename? Default: rename to "Pegs & Pockets" (alt: "Pachinko Quest"). The demo is unpublished and held, so the id/URL/embed change is cheap: one directive moves gameId and folder to `pegs_and_pockets` (URL `/games/pegs-and-pockets/`); no live links exist.
2. Keep pocket coins and the wheel? Default: cut pocket coins, keep the wheel as the boss reward.
3. Party size? Default: hero + 2 party members (one hero is faster but flatter).
4. Stay held back from the publish until P2 passes a playtest? Default: yes.
