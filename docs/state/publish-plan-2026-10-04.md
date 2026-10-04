# Publish plan, 2026-10-04

Read-only plan; nothing was deployed, pushed to a site, or changed live. Robert 2026-10-04: "I fully approve publishing to the website once confirmed safe local." Base: origin/main 802f4837 (PR #176, safe check, merged). Every fact below was re-checked today; recorded notes were treated as claims.

## 1. How the arcade and site are built and deployed today

Two repos. Studio: `C:\Github\RFDGameStudio` (this repo). Site: `C:\Github\RFD_IT_Services_Site` (private, rfd62794/RFD_IT_Services_Site, Hugo; `hugo.toml` = main site rfditservices.com, `hugo.studio.toml` = games site games.rfditservices.com). Both live on the laptop; the deploy runs from the laptop only (the site repo holds `.venv\Scripts\python.exe`, `hugo.exe` and the SFTP config).

One entry point does everything: `studio_deploy_arcade()` (`studio_mcp/tools.py:733`; wrapper `__deploy_arcade_now.py`). It does NOT build first ("dist/ must already be fresh"), so building is a controller step. In order:
1. `write_game_metadata()` (`tools.py:748`).
2. Standalone builds: every `ts/dist-<id>/index.html` is auto-discovered and copied to site `static/arcade/<id>/`; a dist older than its source aborts the deploy (`tools.py:769-776`).
3. Example demos: each `examples/<slug>/dist` is copied to `static/arcade/<static_name>/`; the loop errors out if a demo has neither `ts/dist-<name>/index.html` nor `examples/<slug>/dist` (`tools.py:790-799`). This is the "errors if an example demo lacks a dist" behaviour. The PR #75 overwrite bug (example loop clobbering the slimeworld build) is fixed (`docs/state/arcade-and-site-status-2026-10-04.md` section 5.3).
4. The main arcade app `ts/dist/` is copied (rmtree then copytree) to `static/arcade/rfdgamestudio/`.
5. `_prepare_site_arcade()` (`tools.py:700`): `npx vite-node tools/export-arcade-manifest.ts` (in `ts/`), then site `scripts/site/inject_return.py` (adds the `/arcade-return.js` return-pill tag to every `static/arcade/*/index.html`), then site `scripts/site/check_arcade.py` (headless Chromium contract per build; writes `data/arcade_health.json` and cover screenshots).
6. Site `scripts/site/build_all.py`: builds `public/` (main) and `public-games/` (games) and regenerates `data/arcade.json` from the exported manifest plus health (`sync_arcade.py`).
7. `verify_arcade_deploy()` (Tier 1 + Tier 2): informational, does not block.
8. `deploy_smart.py deploy_config.games.json` (site repo): SFTP via paramiko with a local hash manifest (`.deploy_manifest.json`) so only changed files upload; local `public-games/` to remote `/var/www/html/games` (`deploy/ROLLOUT.md` step 3). The main site uses `deploy_config.json` (`public/`, remote `/var/www/html/simple`).
9. Only if the deploy returns 0: each tracked game's pipeline stage advances and `deployed_version` is recorded (`tools.py` after the deploy call).

Who and where: a controller session on the laptop (Robert's Claude), run by hand. No cron, no deploy loop, no CI (local-CI policy). Server: `ssh3.rfditservices.com` port 42; credential NAMES: `deploy_config*.json` keys `sftp.host`, `sftp.port`, `sftp.username`, `sftp.password` (plaintext in the site repo; value not printed here); `.env` keys `WP_URL`, `WP_USER`, `WP_APP_PASSWORD`, `WP_SSH_CONN`, `WP_SSH_PORT` (blog only, not needed for the arcade); env `SITE_REPO_PATH` (optional sibling-repo override). Hosting: Cloudflare in front (`Server: cloudflare` in the HEAD below), Certbot TLS on the origin, vhost `games.rfditservices.com` with docroot `/var/www/html/games`. DNS and nginx are already done (games host returns 200).

Cabinet framing: `/games/<slug>/` pages create an iframe for the play URL on the Start click in `static/js/cabinet.js:48-56` (`allow="fullscreen; autoplay; gamepad"`, rfd-arcade/1 postMessage seam). An embed that 404s means that card's Start shows a broken frame.

Verify step today: `check_arcade.py` plus `verify_arcade_deploy()` run before the upload; nothing checks the live site afterwards. Section 4 steps 7-10 add that. Gotchas (`deploy/ROLLOUT.md`): in Git Bash use `MSYS_NO_PATHCONV=1`; `deploy_smart.py` creates remote directories even in dry-run; run with `PYTHONUTF8=1`.

## 2. What is live now (curl HEAD, one request each, 2 s apart, 2026-10-04 about 20:35 UTC)

The host sends no Content-Length on these (Cloudflare), so only status is recorded.

| id | /arcade/id/ | id | /arcade/id/ |
|---|---|---|---|
| (home) / | 200 | dissonance | 200 |
| kingmaker_squads | 200 | dissonance_prototype | 404 |
| factory_idle | 404 | succession | 404 |
| facility_escape | 200 | shoal | 200 |
| gladiator_arena | 404 | ledger | 200 |
| slimeworld | 200 | mutant_battle_ball | 200 |
| horse_racing | 404 | antsim_redux | 200 |
| slimegarden | 200 | trinity_siege | 200 |
| choke_point | 404 | voiddrift_particle_sandbox | 404 |
| chimera_wilds | 200 | coin_pusher_arcade | 404 |
| scrapcrawl | 200 | slither_rogue | 404 |
| bpo_sim | 404 | systemic_extract | 200 |

Also `/arcade/rfdgamestudio/` (the TS-native arcade app that hosts horse_racing and others via `?game=`) = 200. `/arcade/slimeworld/` has `last-modified: Sun, 20 Sep 2026 00:19:42 GMT`, so the live slimeworld embed is two weeks old.

Counts: the site repo's `data/arcade.json` (main 6d3116d) has 27 games, matching the 27 live cards recorded in `docs/state/arcade-and-site-status-2026-10-04.md` section 3. Studio side: `ts/tests/test_arcade_manifest_counts.ts:30-41` pins counts.total to the registry length and published to non-retired, non-tool entries; the arcade app showed 36 cards in the local safe check, and the audit counts 36 `registry.ts` imports. The 27 vs 36 gap is the unpublished set. Not done here: the manifest export (controller step) and a live fetch of `arcade.json` (Hugo data is not served), so the live count is the recorded 27, not re-fetched.

## 3. The safe demos: live or new

Badges are from the safe check ("Badges on the changed cards"). "Live" means the standalone `/arcade/<id>/` returned 200 above.

### A. Republish updated embed (live today)

| id | badge | reason |
|---|---|---|
| kingmaker_squads | EXTERNAL | Restart now a two-step confirm; header wraps at 390 |
| facility_escape | EXTERNAL | STEALTH badge, how-to-play hint on turn 0 |
| slimeworld | BETA | Two-step "New Campaign" reset; live copy is from 2026-09-20 |
| slimegarden | EXTERNAL | No sideways scroll at 390 (385 headless; see risk 5) |
| chimera_wilds | DEV | Winnable (16-14 over 30 fights), no console errors |
| scrapcrawl | DEV | Lose path verified in browser; win path by unit test only (soft blocker B3) |

### B. New publication: card or embed did not exist live (recommended to publish; covered by "once confirmed safe local", but list for Robert's awareness)

| id | badge | live now | reason |
|---|---|---|---|
| factory_idle | EXTERNAL | no embed (404), no card in `data/arcade.json` | Phase 2 playable; blurb honest ("Early build, published as-is"); creates a new card |
| gladiator_arena | DEV | embed 404; card `gladiator-arena` exists, no cover | Balance Lab hidden unless `?dev=1` |
| choke_point | DEV | embed 404; card `choke-point` exists, no cover | Wave 2 spawns correctly; fits 390 |
| horse_racing | BETA | `/arcade/horse_racing/` 404 by design: TS-native, ships inside `/arcade/rfdgamestudio/` (200); card `horse-racing` exists, no cover | Publishing it means republishing the arcade app |

Held: bpo_sim (section 5).

### C. Controller steps before publishing

Per item: `cd ts; npm run build:demo -- <id>` for the standalone ids (kingmaker_squads, facility_escape, slimeworld, slimegarden, chimera_wilds, scrapcrawl, factory_idle, gladiator_arena, choke_point); `npm run build` for the arcade app (needed for horse_racing and for the Dissonance origin button). Game metadata (`write_game_metadata`), the arcade manifest export (`npx vite-node tools/export-arcade-manifest.ts`) and the site's `data/arcade.json` run inside the deploy (steps 1, 5, 6 above). `docs/children.json` and StatusBoard regeneration follow the studio's usual generators (not run here; check the `docs/state/StatusBoard.md` header). Covers: 8 cards have none (succession, slither-rogue, horse-racing, voiddrift, wire-rust, choke-point, voiddrift-redux, gladiator-arena); `check_arcade.py` auto-screenshots only builds with a standalone folder, so horse-racing needs a manual cover or ships cover-less (cosmetic).

## 4. Runbook (one sitting, controller, laptop)

Pre-flight checklist:
- [ ] Studio on origin/main with every intended PR merged; `git status` clean in both repos; note both HEAD SHAs.
- [ ] Hold list out of the copy set: `studio_deploy_arcade` auto-discovers every `ts/dist-*`, so move `ts/dist-slither_rogue`, `ts/dist-systemic_extract`, `ts/dist-bpo_sim` out of `ts/` before the deploy.
- [ ] Site repo `.venv` present; `deploy_config.games.json` exists; SSH to `ssh3.rfditservices.com:42` works.
- [ ] Backup of the live embeds taken (step 1) and its location written in the message that reports the publish.

Steps:
1. Back up the live embeds BEFORE any overwrite (live-config rule). From the laptop, copy down the remote tree: `sftp -P 42 rdugger@ssh3.rfditservices.com`, then `get -r /var/www/html/games/arcade C:\Github\_backups\games-arcade-2026-10-04\arcade`. Also copy the site repo's `deploy_config.games.json` and `.deploy_manifest.json` into `C:\Github\_backups\games-arcade-2026-10-04\`. Optional server-side copy outside the served tree: `ssh -p 42 rdugger@ssh3.rfditservices.com 'cp -a /var/www/html/games /var/www/html/games.bak-2026-10-04'` (a copy, not a change to live paths).
2. Build: in `C:\Github\RFDGameStudio\ts` run `npm run build:demo -- <id>` for each Section 3 standalone id, then `npm run build` for the app. Exit 0 each; `build:demo --all --check` should flag only dissonance_prototype and slimebreeder, as in the safe check.
3. Order dependency: dissonance_prototype's embed publishes BEFORE Dissonance. Dissonance's title screen has a "Where Dissonance began" button (`ts/src/games/dissonance/phases/TitlePhase.tsx:47`) wired to `navigateTo('dissonance_prototype')` (`App.tsx:258`), only when not standalone, i.e. inside the arcade app. dissonance_prototype has an embedUrl but nothing to build standalone, and `/arcade/dissonance_prototype/` is 404 today. So publish the prototype (and the rebuilt arcade app) first or in the same atomic deploy, verify its URL, and never ship Dissonance alone. Dissonance itself is not in this plan's safe list; it needs its own safe-check row first.
4. Dry run: set `dry_run: true` in the site's `deploy_config.games.json`, run the deploy (step 5), read the file list (only Section 3 ids, `rfdgamestudio` and generated pages), then set `dry_run: false`.
5. Deploy (one atomic call; stages, builds, uploads): `cd C:\Github\RFDGameStudio; $env:PYTHONUTF8=1; uv run python __deploy_arcade_now.py`. Controller-only; on success it also advances pipeline stage and `deployed_version`.
6. Read the JSON result: `deploy.returncode == 0`, `verification.ok`, `copied_files` non-zero, `standalone_builds` equals the intended list and does NOT contain slither_rogue, systemic_extract or bpo_sim.
7. HEAD sweep (1 request each, 2 s apart) for every changed id: all intended ids 200; bpo_sim and slither_rogue still 404; systemic_extract unchanged (still the old live build). Compare `last-modified` on `/arcade/slimeworld/` to today.
8. 390px smoke per changed embed (Playwright, 390x844): loads, no console errors, `document.documentElement.scrollWidth <= 390`, and the safe-check change is visible (two-step confirm, STEALTH badge, wave 2, etc.).
9. Card pages: each `/games/<slug>/` Start button opens its iframe; the new factory_idle card appears; `/arcade-return.js` tag present in each changed `index.html`; `data/arcade_health.json` ok for them.
10. Report to Robert: what went up, the backup path, the hold list, check results; mark items Done per the standing rule.

Rollback (any failed check): restore from the step 1 backup with the same channel, e.g. `sftp -P 42 rdugger@ssh3.rfditservices.com` then `put -r C:\Github\_backups\games-arcade-2026-10-04\arcade /var/www/html/games/`, or server-side `rsync -a --delete /var/www/html/games.bak-2026-10-04/arcade/ /var/www/html/games/arcade/`. Restore the backed-up `.deploy_manifest.json` (or delete it) so the next smart deploy re-hashes against the real remote. For one bad embed, restore only `/var/www/html/games/arcade/<id>/`, then repeat steps 7-9. Discard staged site copies with `git -C C:\Github\RFD_IT_Services_Site checkout -- static/arcade data`.

## 5. Risks and what NOT to publish

Do NOT publish:
- slither_rogue: the run never starts (black canvas, "Time NaN"). Not live today, so holding costs nothing. Fix in progress.
- systemic_extract: NEW RUN is off-screen at 390 (x=571..637). Live is the older build (200); keep it. Re-run its safe check after the fix.
- bpo_sim: loads and plays (SAFE) but is unpublished by decision; Robert said it is not to be published until he approves.
- Anything outside the safe list (dissonance, succession, shoal, mbb, antsim_redux, ledger, trinity) until each gets its own check; scrapcrawl's win path wants one human win.

Risks and mitigations:
1. Auto-discovery ships held builds (any `ts/dist-*`): move them out before step 5, assert in step 6.
2. One deploy for all games, no per-game flag: backup, dry run, per-embed rollback.
3. Plaintext SFTP password in the site repo's deploy config: unchanged for this run; recommend env or key auth separately.
4. Dissonance without the prototype shows a dead button: ordering in step 3.
5. slimegarden measured 385 vs 375 visible width headless (scrollbar): confirm by eye in step 8.
6. Site copy says "34 games" (`content/projects/rfd-game-studio.md:9,62`) while 27 cards are published and the count will rise; correct it so `check_arcade.py` honesty checks do not flag it.
7. Windows/MSYS path rewrite, UTF-8 codec crash, stale dist abort, dry-run creating remote dirs: covered by the flags and order above.
8. `deploy_smart.py` trusts a local manifest; manual server edits desync it (see rollback).
9. Cover-less cards (gladiator-arena, choke-point, horse-racing) look incomplete: cosmetic.

## Blockers
B1 slither_rogue fix (hold). B2 systemic_extract 390 fix (hold). B3 scrapcrawl human win (soft). B4 Robert's approval for bpo_sim (hold). B5 more demo changes still landing (dissonance, succession, shoal, mbb, antsim_redux, ledger, trinity); re-run the section 2 sweep and add safe-check rows before adding them.
