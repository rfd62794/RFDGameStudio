import os
import pytest
from src.tools.apj.journal import Journal

@pytest.fixture
def temp_journal(tmp_path):
    journal_dir = tmp_path / "docs" / "journal"
    journal_dir.mkdir(parents=True)
    journal_file = journal_dir / "PROJECT_JOURNAL.md"
    content = """# rpgCore — Project Journal

## Current State
Initial state.

## In Flight
Nothing.

## Next Priority
Testing.
"""
    journal_file.write_text(content, encoding="utf-8")

    # Mock goals and milestones so .get_handoff doesn't crash from missing files
    planning_dir = tmp_path / "docs" / "planning"
    planning_dir.mkdir(parents=True)
    goals_file = planning_dir / "GOALS.md"
    goals_file.write_text("# rpgCore — Goals\n\n## G1 — Test\nDesc", encoding="utf-8")
    milestones = planning_dir / "MILESTONES.md"
    milestones.write_text("# rpgCore — Milestones\n\n## Active\n", encoding="utf-8")
    tasks = planning_dir / "TASKS.md"
    tasks.write_text("# rpgCore — Task Backlog\n\n## Queued\n", encoding="utf-8")

    return Journal(root_dir=str(tmp_path))

def test_journal_loads(temp_journal):
    content = temp_journal.load()
    assert "# rpgCore — Project Journal" in content
    assert "## Current State" in content

def test_get_section_returns_content(temp_journal):
    section = temp_journal.get_section("Current State")
    assert section == "Initial state."
    
    section = temp_journal.get_section("Next Priority")
    assert section == "Testing."

def test_get_handoff_contains_date(temp_journal):
    from datetime import datetime
    handoff = temp_journal.get_handoff()
    date_str = datetime.now().strftime("%Y-%m-%d")
    assert date_str in handoff

def test_get_handoff_contains_all_sections(temp_journal):
    handoff = temp_journal.get_handoff()
    assert "Initial state." in handoff
    assert "Nothing." in handoff
    assert "Testing." in handoff

def test_update_section_persists(temp_journal):
    temp_journal.update_section("In Flight", "Building APJ.")
    assert temp_journal.get_section("In Flight") == "Building APJ."
    
    # Reload to verify file write
    new_journal = Journal(root_dir=temp_journal.root_dir)
    assert new_journal.get_section("In Flight") == "Building APJ."

def test_get_handoff_contains_environment(temp_journal):
    handoff = temp_journal.get_handoff()
    assert "ENVIRONMENT: Windows (PowerShell/CMD)" in handoff
    assert "Do NOT use: cp, mv, rm, touch, grep, ls" in handoff

def test_get_boot_block_contains_environment(temp_journal):
    boot = temp_journal.get_boot_block()
    assert "rpgCore — Agent Boot Sequence" in boot
    assert "ENVIRONMENT: Windows PowerShell" in boot
    assert "STEP 0 — Verify orientation" in boot

def test_update_current_flag_via_cli_simulation(temp_journal):
    # Simulating the CLI update with flag
    new_content = "327 passing tests. Shared physics, input, spawner base established. APJ boot command live."
    temp_journal.update_section("Current State", new_content)
    assert temp_journal.get_section("Current State") == new_content

@pytest.fixture
def temp_journal_with_tasks(tmp_path):
    planning_dir = tmp_path / "docs" / "planning"
    planning_dir.mkdir(parents=True, exist_ok=True)
    journal_dir = tmp_path / "docs" / "journal"
    journal_dir.mkdir(parents=True, exist_ok=True)

    # Journal file
    journal_file = journal_dir / "PROJECT_JOURNAL.md"
    journal_file.write_text("# rpgCore — Project Journal\n\n## Current State\nState.\n\n## In Flight\nFlight.\n\n## Next Priority\nPriority.\n", encoding="utf-8")

    # Tasks file
    tasks_file = planning_dir / "TASKS.md"
    tasks_content = "# rpgCore — Task Backlog\n\n## Active\n- [ ] [TOOL] APJ\n\n## Queued\n- [ ] [FEAT] Task 1\n- [ ] [FEAT] Task 2\n- [ ] [FEAT] Task 3\n- [ ] [FEAT] Task 4\n\n## Backlog\n\n## Completed\n"
    tasks_file.write_text(tasks_content, encoding="utf-8")

    # Goals file
    goals_file = planning_dir / "GOALS.md"
    goals_content = "# rpgCore — Goals\n\n## G1 — Testing Goal\nGoal text here.\n"
    goals_file.write_text(goals_content, encoding="utf-8")

    # Milestones file
    milestones_file = planning_dir / "MILESTONES.md"
    milestones_content = "# rpgCore — Milestones\n\n## Active\n- [ ] M1 — Test Milestone (Goals: G1)\n\n## Completed\n"
    milestones_file.write_text(milestones_content, encoding="utf-8")

    return Journal(root_dir=str(tmp_path))

def test_tasks_file_loads(temp_journal_with_tasks):
    content = temp_journal_with_tasks.load(temp_journal_with_tasks.tasks_path)
    assert "# rpgCore — Task Backlog" in content

def test_tasks_add_appends_to_queued(temp_journal_with_tasks):
    temp_journal_with_tasks.add_task("[FEAT] Task 5")
    queued = temp_journal_with_tasks.milestone_tracker.get_section("Queued")
    # Actually add_task updates tasks_path
    queued = temp_journal_with_tasks.tasks_tracker.get_section("Queued")
    assert "- [FEAT] Task 5" in queued

def test_tasks_done_moves_to_completed(temp_journal_with_tasks):
    # Setup: ensure Task 1 is there
    queued = temp_journal_with_tasks.tasks_tracker.get_section("Queued")
    assert "Task 1" in queued
    
    temp_journal_with_tasks.complete_task("Task 1")
    
    # Check it's gone from Queued
    queued_after = temp_journal_with_tasks.tasks_tracker.get_section("Queued")
    assert "Task 1" not in queued_after
    
    # Check it's in Completed
    completed = temp_journal_with_tasks.tasks_tracker.get_section("Completed")
    assert "Task 1" in completed

def test_get_next_tasks_returns_top_three(temp_journal_with_tasks):
    next_tasks = temp_journal_with_tasks.get_next_tasks(3)
    assert "1. [FEAT] Task 1" in next_tasks
    assert "2. [FEAT] Task 2" in next_tasks
    assert "3. [FEAT] Task 3" in next_tasks
    assert "4. [FEAT] Task 4" not in next_tasks

def test_handoff_contains_queued_tasks(temp_journal_with_tasks):
    handoff = temp_journal_with_tasks.get_handoff()
    assert "QUEUED TASKS (top 3):" in handoff
    assert "1. [FEAT] Task 1" in handoff

def test_get_handoff_protected_floor_updated(temp_journal_with_tasks):
    handoff = temp_journal_with_tasks.get_handoff(test_floor=342)
    assert "PROTECTED FLOOR: 342 passing tests" in handoff

def test_goals_file_loads(temp_journal_with_tasks):
    content = temp_journal_with_tasks.load(temp_journal_with_tasks.goals_path)
    assert "# rpgCore — Goals" in content

def test_milestones_file_loads(temp_journal_with_tasks):
    content = temp_journal_with_tasks.load(temp_journal_with_tasks.milestones_path)
    assert "# rpgCore — Milestones" in content

def test_milestones_done_marks_complete(temp_journal_with_tasks):
    active = temp_journal_with_tasks.milestone_tracker.get_section("Active")
    assert "M1" in active
    
    temp_journal_with_tasks.complete_milestone("M1")
    
    active_after = temp_journal_with_tasks.milestone_tracker.get_section("Active")
    assert "M1" not in active_after
    
    completed = temp_journal_with_tasks.milestone_tracker.get_section("Completed")
    assert "M1" in completed
    assert "- [x]" in completed

def test_handoff_contains_active_milestone(temp_journal_with_tasks):
    handoff = temp_journal_with_tasks.get_handoff()
    assert "ACTIVE MILESTONE: M1 — Test Milestone" in handoff
    assert "GOAL: G1 Testing Goal" in handoff


# ---------------------------------------------------------------------------
# Archivist Agent Tests (offline — no live Ollama required)
# ---------------------------------------------------------------------------

def test_ollama_client_sets_env_vars():
    """get_ollama_model() must configure the three required env vars."""
    import os
    from src.tools.apj.agents.ollama_client import get_ollama_model

    # Clear any previous state
    for key in ("OPENAI_BASE_URL", "OPENAI_API_KEY"):
        os.environ.pop(key, None)

    get_ollama_model(model_name="llama3.2:3b")

    assert os.environ.get("OPENAI_BASE_URL", "").endswith("/v1"), (
        "OPENAI_BASE_URL must end with /v1 for Ollama compat"
    )
    assert os.environ.get("OPENAI_API_KEY") == "ollama", (
        "OPENAI_API_KEY must be 'ollama' (dummy auth)"
    )


def test_archivist_fallback_report_when_ollama_offline(tmp_path):
    """Archivist returns a valid CoherenceReport via fallback when Ollama is unreachable."""
    from datetime import datetime
    from unittest.mock import patch, MagicMock
    from src.tools.apj.agents.archivist import Archivist, CoherenceReport
    from src.tools.apj.schema import Corpus

    archivist = Archivist(model_name="llama3.2:3b")
    empty_corpus = Corpus(parsed_at=datetime(2026, 2, 25, 6, 0, 0))

    # Patch build_corpus so no real YAML files are needed
    # Patch _run_async to simulate Ollama being offline
    with patch(
        "src.tools.apj.agents.archivist.build_corpus",
        return_value=empty_corpus,
    ), patch.object(
        archivist,
        "_execute_run",
        side_effect=ConnectionError("Ollama not reachable"),
    ), patch.object(
        archivist,
        "_save_report",
    ) as mock_save:
        report = archivist.run()

    # Report must be a valid CoherenceReport even on fallback
    assert isinstance(report, CoherenceReport)
    assert report.corpus_hash == empty_corpus.corpus_hash
    assert "FALLBACK" in report.session_primer
    assert len(report.open_risks) >= 1
    mock_save.assert_called_once_with(report)


def test_archivist_uses_parser():
    """Archivist.run() calls build_corpus() — no raw file reads."""
    from datetime import datetime
    from unittest.mock import patch, MagicMock
    from src.tools.apj.agents.archivist import Archivist, CoherenceReport
    from src.tools.apj.schema import Corpus

    archivist = Archivist(model_name="llama3.2:3b")
    empty_corpus = Corpus(parsed_at=datetime(2026, 2, 25, 6, 0, 0))

    stub_report = CoherenceReport(
        session_primer="Test primer. Second sentence.",
        open_risks=[],
        queued_focus="Phase 5 done.",
        constitutional_flags=[],
        corpus_hash=empty_corpus.corpus_hash,
    )

    with patch(
        "src.tools.apj.agents.archivist.build_corpus",
        return_value=empty_corpus,
    ) as mock_build, patch.object(
        archivist,
        "_execute_run",
        side_effect=ConnectionError("skip Ollama"),
    ), patch.object(
        archivist,
        "_save_report",
    ):
        archivist.run()

    mock_build.assert_called_once()

def test_archivist_saves_session_log(tmp_path):
    """Archivist writes a .md file to the session_logs directory."""
    from src.tools.apj.agents.archivist import Archivist, CoherenceReport

    # Use real tmp_path for log writing — injected via log_dir parameter
    fake_log_dir = tmp_path / "session_logs"
    fake_log_dir.mkdir()

    stub_report = CoherenceReport(
        session_primer="Test primer sentence one. Test primer sentence two.",
        open_risks=["Risk alpha"],
        queued_focus="Fix the thing.",
        constitutional_flags=[],
        corpus_hash="a" * 64,
    )

    archivist = Archivist(model_name="llama3.2:3b")
    archivist._save_report(stub_report, log_dir=fake_log_dir)

    log_files = list(fake_log_dir.glob("*_archivist.md"))
    assert len(log_files) == 1, "Expected exactly one archivist log file"

    content = log_files[0].read_text(encoding="utf-8")
    assert "# Archivist Coherence Report" in content
    assert "Test primer sentence one" in content
    assert "Risk alpha" in content
    assert "Fix the thing." in content


# ---------------------------------------------------------------------------
# Strategist offline tests
# ---------------------------------------------------------------------------

def test_strategist_fallback_plan():
    """Strategist returns a valid SessionPlan via deterministic fallback when Ollama is offline."""
    from unittest.mock import patch
    from src.tools.apj.agents.archivist import CoherenceReport
    from src.tools.apj.agents.strategist import Strategist, SessionPlan

    stub_report = CoherenceReport(
        session_primer="The project has 405 passing tests. Momentum is on the Strategist.",
        open_risks=["G3 orphaned from milestones"],
        queued_focus="Build the Strategist agent.",
        constitutional_flags=[],
        corpus_hash="b" * 64,
    )

    strategist = Strategist(model_name="llama3.2:3b")

    with patch.object(
        strategist,
        "_execute_run",
        side_effect=ConnectionError("Ollama not reachable"),
    ), patch.object(strategist, "_save_plan"):
        plan = strategist.run(archivist_report=stub_report)

    assert isinstance(plan, SessionPlan)
    assert plan.recommended.label in ("Headlong", "Divert", "Alt")
    assert plan.recommended.title
    assert isinstance(plan.alternatives, list)
    assert plan.corpus_hash == "b" * 64


def test_strategist_plan_has_three_options():
    """SessionPlan always has recommended + exactly 2 alternatives."""
    from src.tools.apj.agents.archivist import CoherenceReport
    from src.tools.apj.agents.strategist import Strategist, SessionOption

    stub_report = CoherenceReport(
        session_primer="405 passing. Combat loop complete.",
        open_risks=["Two Active tasks with no Milestone"],
        queued_focus="Wire Strategist into session start.",
        constitutional_flags=[],
        corpus_hash="c" * 64,
    )

    strategist = Strategist(model_name="llama3.2:3b")
    plan = strategist._fallback_plan(stub_report)

    assert isinstance(plan.recommended, SessionOption)
    assert len(plan.alternatives) == 2, (
        f"Expected exactly 2 alternatives, got {len(plan.alternatives)}"
    )
    for opt in [plan.recommended] + plan.alternatives:
        assert opt.title, "Every option must have a title"
        assert opt.tasks, "Every option must have at least one task"
        assert opt.risk in ("Low", "Medium", "High"), f"Invalid risk: {opt.risk}"


def test_session_start_runs_both_agents():
    """session start calls Archivist then Strategist in sequence."""
    from unittest.mock import patch, MagicMock
    from src.tools.apj.agents.archivist import CoherenceReport
    from src.tools.apj.agents.strategist import SessionPlan, SessionOption
    from src.tools.apj import cli

    stub_report = CoherenceReport(
        session_primer="405 passing. Both agents running.",
        open_risks=[],
        queued_focus="Verify sequential session start.",
        constitutional_flags=[],
        corpus_hash="d" * 64,
    )

    def _make_option(label: str) -> SessionOption:
        return SessionOption(
            label=label, title=f"{label} Title", rationale="test",
            tasks=["step 1"], risk="Low", milestone_impact="M3"
        )

    stub_plan = SessionPlan(
        recommended=_make_option("Headlong"),
        alternatives=[_make_option("Divert"), _make_option("Alt")],
        open_questions=[],
        archivist_risks_addressed=[],
        corpus_hash="d" * 64,
    )

    mock_archivist_instance = MagicMock()
    mock_archivist_instance.run.return_value = stub_report
    mock_strategist_instance = MagicMock()
    mock_strategist_instance.run.return_value = stub_plan

    # Patch at cli module level (imports are now module-level, not local)
    with (
        patch("src.tools.apj.cli.Archivist", return_value=mock_archivist_instance),
        patch("src.tools.apj.cli.Strategist", return_value=mock_strategist_instance),
        patch("src.tools.apj.cli.resolve_model", return_value="llama3.2:3b"),
        patch("src.tools.apj.cli.print_coherence_report"),
        patch("src.tools.apj.cli.print_session_plan"),
    ):
        cli._run_session_start()

    mock_archivist_instance.run.assert_called_once()
    mock_strategist_instance.run.assert_called_once_with(archivist_report=stub_report)


# ---------------------------------------------------------------------------
# OpenRouter Director offline tests
# ---------------------------------------------------------------------------

def test_director_disabled_when_no_key(monkeypatch):
    """is_director_enabled() returns False when OPENROUTER_API_KEY is missing or placeholder."""
    from src.tools.apj.agents.openrouter_client import is_director_enabled

    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.setenv("DIRECTOR_APPROVAL_MODE", "STRICT")
    assert is_director_enabled() is False

    monkeypatch.setenv("OPENROUTER_API_KEY", "your_key_here")
    assert is_director_enabled() is False


def test_director_disabled_when_mode_off(monkeypatch):
    """is_director_enabled() returns False when DIRECTOR_APPROVAL_MODE=OFF regardless of key."""
    from src.tools.apj.agents.openrouter_client import is_director_enabled

    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-real-key-12345")
    monkeypatch.setenv("DIRECTOR_APPROVAL_MODE", "OFF")
    assert is_director_enabled() is False


def test_approval_mode_defaults_to_strict(monkeypatch):
    """get_approval_mode() returns STRICT when DIRECTOR_APPROVAL_MODE is not set."""
    from src.tools.apj.agents.openrouter_client import get_approval_mode, APPROVAL_STRICT

    monkeypatch.delenv("DIRECTOR_APPROVAL_MODE", raising=False)
    assert get_approval_mode() == APPROVAL_STRICT
