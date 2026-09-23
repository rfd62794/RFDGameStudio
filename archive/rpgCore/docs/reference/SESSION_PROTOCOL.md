# rpgCore — AI Session Protocol

*To be provided at the start of every new Coding Agent session to prevent context drift.*

## Session Start Sequence

```powershell
python -m src.tools.apj session start
```

1. **Archivist** reads corpus → prints Coherence Report (risks, flags, primer)
2. **Strategist** reads report → prints Session Plan (Recommended / Divert / Alt)
3. **You** choose an option and tell the IDE agent which was selected
4. **IDE agent** executes the chosen plan

---

## Step 0 — Orient
Run: `python -m src.tools.apj session start`
This runs the full Archivist + Strategist pipeline and prints current project state,
risks, constitutional flags, and a ranked session plan. Read all output before touching code.

## Agent Behavior Standards
- Always use `uv run` for execution. Never activate venv manually.
- Spec-first: No code written until plan is confirmed by Overseer in the IMPLEMENTATION PLAN artifact.
- Present significant architectural decisions as three options:
    - **Headlong**: Direct engineering, fastest path.
    - **Divert**: Side-step, different approach to the same goal.
    - **Alt**: The better way, may change the question.
- No `print()` statements in `src/`. Use `logging` or `Rich` for CLI output.
- All commands must be Windows PowerShell safe.
- Artifact first: update docs and journal before closing a session.
- Stub tests (e.g., `assert 0 == 1`, `pass`) are strictly prohibited in the protected test suite. Either write a real assertion or use `@pytest.mark.skip`.
- File move directives require explicit verification. Moves must be visually confirmed with `Get-ChildItem` (or similar tools) to ensure success *before* any source code path references are updated.

---

## Combat Standards
- **Always** inherit from `CombatSceneBase` for any turn-based combat.
- **5v5 Layout** is the engine mandatory standard (5 slots party, 5 slots enemy).
- **TurnOrderManager** and **D20Resolver** must be used for turn tracking and resolution.
- Never implement custom layout or resolution patterns in demo-specific code.

---

You are working on the Slime Clan game within the rpgCore repository (github.com/rfd62794/rpgCore). Before starting, read these docs:

- `docs/RPGCORE_CONSTITUTION.md` — engine law, demo structure, repository context (READ FIRST)
- `docs/VISION.md` — the north star
- `docs/ROADMAP.md` — session plan
- `docs/COLONY_SYSTEM.md` — colony architecture
- `docs/SCENE_MANAGER.md` — scene contract

## Key facts:

- This is a desktop pygame application on Windows
- Entry point: `uv run python run_overworld.py`
- Manual verification means running locally and describing what you see
- Do NOT use browser tools — this is not a web application
- Test command: `uv run pytest`
- Current passing tests: [UPDATE THIS NUMBER]
- Git identity: rfd62794

## Architecture: 
- `src/apps/slime_clan/scenes/` for scenes
- `src/apps/slime_clan/ui/` for rendering
- `src/shared/` for engine components

## UI Patterns
Before building any new scene:
1. Read `docs/SCENE_TEMPLATE_GUIDE.md`
2. Identify the correct template base class (Hub, Garden, Combat)
3. Inherit from template class, not `Scene` directly
4. Never rebuild layout patterns that templates already provide

New pygame scenes must inherit from a template in `src.shared.engine.scene_templates`
(e.g., `HubScene`, `GardenSceneBase`, `CombatSceneBase`) instead of `Scene` directly. 
Register via `manager.register()` and launch via `manager.run()`.
- `src/apps/slime_clan/app.py` is a 31-line launcher.
- Final step of every session:
  - Run `python -m src.tools.apj tasks --done "completed task"` for each finished item.
  - Run `python -m src.tools.apj tasks --add "[TAG] description"` for new discoveries.
  - Run `python -m src.tools.apj update` and update all three journal sections to reflect current state.

---

## Director (Generalist) — OpenRouter

The Director is called **SPARINGLY** at decision gates the local swarm cannot handle.

### When to call the Director
- Architectural decisions with no clear answer in the Constitution
- Novel task types the Strategist has never seen
- Constitutional conflicts requiring cross-domain judgment
- Cross-demo design decisions affecting the Living World

### When NOT to call the Director
- Anything the local swarm handles reliably
- Routine implementation tasks
- Tasks already in TASKS.md with clear specs
- Anything where the Strategist produced a confident plan

### Approval and Cost
- **Approval gate:** `STRICT` by default — every call requires explicit `[y/N]` confirmation
- **Cost tracking:** all Director calls logged to `docs/session_logs/director_usage.log`
- **Free models preferred:** `deepseek/deepseek-r1`, `meta-llama/llama-3.1-70b-instruct`
- **Configuration:** copy `.env.example` → `.env`, add `OPENROUTER_API_KEY`

```powershell
# Verify Director is configured and enabled
python -c "from dotenv import load_dotenv; load_dotenv(); from src.tools.apj.agents.openrouter_client import is_director_enabled; print('Director enabled:', is_director_enabled())"
```
