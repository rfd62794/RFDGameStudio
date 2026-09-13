# RFD_IT_Publishing - Current State

## Phase 1: itch.io via Butler — CERTIFIED ✅ (updated August 30 2026)

**Date:** August 30, 2026  
**Status:** Complete — freshness check + `--userversion` wiring landed  
**Test Floor:** 9 passing, 0 failing, 0 skipped

### Implementation Summary

- **Repo Structure:** Matches §1 specification exactly
- **Game Registry:** `config/games.yaml` with example entries (antsim, voidrift, greengap)
- **Butler Wrapper:** `targets/itchio.py` with check_butler(), push(), load_game_config()
- **CLI Entry Point:** `publisher.py` with deploy and list commands
- **Test Coverage:** 5 test anchors in `tests/test_itchio.py` (all passing)
- **Documentation:** README.md with setup and usage instructions
- **Secrets Handling:** Butler local auth — no .env needed for itch.io

### Completion Criteria — ALL MET

- [x] Repo structure matches §1 exactly
- [x] `python publisher.py list` prints configured games
- [x] `python publisher.py deploy antsim --target itchio --dry-run` prints correct butler command
- [x] `python publisher.py deploy unknown --target itchio` exits cleanly with helpful message
- [x] `python publisher.py deploy antsim --target unknown` exits cleanly with helpful message
- [x] 5 passing, 0 failing, 0 skipped
- [x] .env not committed — .gitignore verified
- [x] .env.example committed with empty values
- [x] README covers setup and usage clearly

### Usage

```bash
# List configured games
python publisher.py list

# Deploy to itch.io (dry run)
python publisher.py deploy antsim --target itchio --dry-run

# Deploy to itch.io (real push)
python publisher.py deploy antsim --target itchio
```

### Prerequisites for Real Deployment

1. Install Butler locally: https://itch.io/docs/butler/
2. Run `butler login` once (authenticates with itch.io — stored locally by Butler)
3. Edit `config/games.yaml` with real game slugs

### Value Delivered

One-command publishing to itch.io. Eliminates friction between "it's ready" and "it's live." No manual uploading, no browser UI, no deployment friction.

---

## Phase 2: PyPI via Twine — NOT STARTED

**Status:** Pending  
**Trigger:** When ready to deploy Python packages to PyPI

### Notes

- Almost pre-built since OpenAgent already uses Twine
- Will require PYPI_TOKEN in .env
- Target: `targets/pypi.py`

---

## Phase 3: Play Store via Google CLI — NOT STARTED

**Status:** Pending  
**Trigger:** When ready to deploy Android apps to Google Play

---

## Phase 4: rfditservices.com via SFTP — STATUS UNDER REVIEW

**Status:** Pending / potentially superseded  
**Trigger:** Decision needed by Robert  
**Note:** `studio_deploy_arcade` in the RFDGameStudio repo already performs a real SFTP/deploy to the same site endpoint. The original plan to build a competing mechanism in this repo may be redundant. This is explicitly flagged as an open judgment call, not silently resolved.
