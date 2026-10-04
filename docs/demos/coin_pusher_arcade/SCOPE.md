# coin_pusher_arcade scope analysis (2026-10-03, Sonnet scope agent, registry status: NOT registered; directive Port_Coin_Pusher_Arcade_Directive.md is Approved)
Direction: physics coin pusher with drops, combos, a reward wheel, special pocket coins, pressure levels and meta-progression (examples/coin-pusher-arcade/metadata.json:3; docs/RFDGameStudio_DemoPortingRoadmap.md:76 "Archived, not deployed"). Points at a straight port as a second pusher beside slime_coin (directive section 1, line 12).
Working:
- Complete run loop in the source: level targets (src/App.tsx:209), win round, game over (App.tsx:104,301-304), Restart run (App.tsx:141-150,415-420), Game Over overlay with restart (App.tsx:505-516).
- Meta-progression in localStorage with a parse guard (App.tsx:35-62); data tables in src/data.ts (COIN_TYPES :8, WHEEL_REWARDS :91, POCKET_COIN_TYPES :139, LEVEL_SETTINGS :182, BOARD_THEMES :225).
- Directive facts match the source: CoinPusherGame.tsx 1,446 lines and App.tsx 1,029 lines (wc -l), no AI calls in src (grep for genai/fetch/process.env: none; @google/genai, express, dotenv only in package.json:14,21,22).
Rough:
- Source has no title or Start screen (grep of App.tsx for Start/title/menu: none), and the directive never asks for one, so A3 "visible Start" will fail after the port.
- Both big files must be split below 600 lines (directive section 3, items 3 and 6), yet the physics lives inside the canvas component (CoinPusherGame.tsx:60); directive tests cover data integrity and simple physics only (section 3, item 10).
- Directive forbids a build script and standalone entry (section 4), so A7 fails until a follow-up.
Class: improve - adds one new, finished game to the arcade; port-only, no redesign (directive section 3 "This is a port, not a redesign").
Top 3 changes, in order: 1. Port as specified (types, data, logic/ modules, canvas, wheel and pocket modals, sound). 2. Add a Start screen and keep the existing Restart (A3), in a follow-up or as an explicit directive addition. 3. Follow-up: `build:coin_pusher_arcade`, phone-width check, manifest screenshot (A4, A5, A7).
Out of scope: balance/art changes, new coins or levels, Gemini features (metadata.json:5 claims a capability the source never uses), changes to slime_coin, deployment.
Dependencies / risks: behaviour drift while splitting 1,446 lines of physics (highest risk, only light tests); overlap with slime_coin is limited (slime_coin is real-time shooter plus two-layer board, ts/src/games/slime_coin/config.ts); registry.ts edit conflicts with other demo ports at the demos:end marker.
Effort: M
Open question for Robert: none
Decision 2026-10-04 (Robert approved all recommendations): PARK. The port is done and registered (commits 7a1fd77f and cd21e099), so "NOT registered" above is stale. Status stays dev, the game stays out of "Start here" and featured picks, and no further work (title screen, build script) happens until a 10-minute side-by-side playtest against SlimeCoin decides keep or fold.
Phone layout: N/A while parked. Tier B and C: N/A while parked.
