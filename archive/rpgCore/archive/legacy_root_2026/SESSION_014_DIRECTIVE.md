# Session 014 Directive

**Initialize Session 014 — Playable Demo Slice.** 
Wire the three existing scenes into a single complete loop. This is a polish and integration session only — no new systems:

1. `run_overworld.py` is the single entry point for the entire demo.
2. Overworld node click launches `auto_battle.py` passing the region name as context. Display the region name in the auto-battle scene header.
3. Hard-coded default player squad: one CIRCLE/SWORD named 'Rex', one SQUARE/SHIELD named 'Brom', one TRIANGLE/STAFF named 'Pip'. Same three every battle for now.
4. Battle result returns to overworld: win flips node to Blue, loss keeps it Red/Contested.
5. Win condition: all 4 non-home nodes Blue → overworld displays 'Planet Secured — The Slime Clans bow to the Astronaut' banner with ESC to restart.
6. Loss condition: if 3 or more nodes go Red → 'Colony Lost — The Clans have driven you out' banner with ESC to restart.
7. Polish pass: consistent dark theme across all three scenes, consistent font sizing, consistent ESC behavior.
8. All 7 slime_clan tests must still pass.
9. Commit as 'feat: Session 014 — Playable Demo Slice' and tag as v0.1-demo in git.
