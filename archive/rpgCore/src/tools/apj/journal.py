import os
import re
from datetime import datetime
from src.tools.apj.tracker import MarkdownListTracker

class Journal:
    JOURNAL_PATH = "docs/journal/PROJECT_JOURNAL.md"
    TASKS_PATH = "docs/planning/TASKS.md"
    MILESTONES_PATH = "docs/planning/MILESTONES.md"
    GOALS_PATH = "docs/planning/GOALS.md"

    def __init__(self, root_dir: str = "."):
        self.root_dir = root_dir
        self.full_path = os.path.join(self.root_dir, self.JOURNAL_PATH)
        self.tasks_path = os.path.join(self.root_dir, self.TASKS_PATH)
        self.milestones_path = os.path.join(self.root_dir, self.MILESTONES_PATH)
        self.goals_path = os.path.join(self.root_dir, self.GOALS_PATH)
        
        self.tasks_tracker = MarkdownListTracker(self.tasks_path)
        self.milestone_tracker = MarkdownListTracker(self.milestones_path)

    def load(self, path: str = None) -> str:
        """Reads and returns full content of a file."""
        target = path or self.full_path
        if not os.path.exists(target):
            return ""
        with open(target, "r", encoding="utf-8") as f:
            return f.read()

    def get_section(self, name: str, path: str = None) -> str:
        """Extracts a named ## Section and its content."""
        content = self.load(path)
        pattern = rf"## {name}\n(.*?)(?=\n## |\Z)"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""

    def update_section(self, name: str, new_content: str, path: str = None):
        """Replaces a section's content in the file."""
        target = path or self.full_path
        content = self.load(target)
        pattern = rf"## {name}\n(.*?)(?=\n## |\Z)"
        
        if re.search(pattern, content, re.DOTALL):
            new_section = rf"## {name}\n{new_content.strip()}\n"
            updated_content = re.sub(pattern, new_section, content, flags=re.DOTALL)
        else:
            updated_content = content.rstrip() + f"\n\n## {name}\n{new_content.strip()}\n"
            
        with open(target, "w", encoding="utf-8") as f:
            f.write(updated_content)

    def get_next_tasks(self, n: int = 3) -> str:
        """Reads top n items from Queued tier in TASKS.md."""
        top_n = self.tasks_tracker.get_top_items("Queued", n, strip_boxes=True)
        if not top_n:
            return "No queued tasks."
        return "\n".join([f"  {i+1}. {task}" for i, task in enumerate(top_n)])

    def add_task(self, text: str):
        """Appends a task to the Queued section in TASKS.md."""
        self.tasks_tracker.append_item("Queued", text)

    def complete_task(self, pattern: str):
        """Moves matching task to Completed section in TASKS.md."""
        self.tasks_tracker.mark_completed(pattern, from_sections=["Active", "Queued"])

    def complete_milestone(self, pattern: str):
        """Moves matching milestone to Completed section in MILESTONES.md."""
        self.milestone_tracker.mark_completed(pattern, from_sections=["Active", "Queued"])

    def get_active_milestone_and_goals(self) -> str:
        """Parses active milestone and its linked goals for the handoff block."""
        active_items = self.milestone_tracker.get_top_items("Active", 1, strip_boxes=True)
        if not active_items:
            return "ACTIVE MILESTONE: None\nGOAL: None"
            
        text, goal_codes = self.milestone_tracker.extract_metadata(active_items[0])
        
        goal_titles = []
        if goal_codes:
            goals_content = self.load(self.goals_path)
            for code in goal_codes:
                # Find "## G1 — Title"
                match = re.search(rf"## {code} — (.*?)\n", goals_content)
                if match:
                    goal_titles.append(f"{code} {match.group(1).strip()}")
                else:
                    goal_titles.append(code)
                    
        goals_str = " / ".join(goal_titles) if goal_titles else "None"
        
        return f"ACTIVE MILESTONE: {text}\nGOAL: {goals_str}"

    def get_handoff(self, test_floor: int = 342) -> str:
        """Builds a formatted handoff string."""
        date_str = datetime.now().strftime("%Y-%m-%d")
        curr_state = self.get_section("Current State")
        in_flight = self.get_section("In Flight")
        next_priority = self.get_section("Next Priority")
        queued_tasks = self.get_next_tasks(3)
        milestone_block = self.get_active_milestone_and_goals()

        handoff = f"""═══════════════════════════════════════
rpgCore Agent Handoff — {date_str}
═══════════════════════════════════════
ENVIRONMENT: Windows (PowerShell/CMD)
  All commands use: python, uv run pytest, copy, move
  Do NOT use: cp, mv, rm, touch, grep, ls
  Path separator: backslash
  Line endings: CRLF

READ FIRST:
  docs/core/RPGCORE_CONSTITUTION.md
  docs/reference/SESSION_PROTOCOL.md

{milestone_block}

CURRENT STATE:
  {curr_state}

IN FLIGHT:
  {in_flight}

QUEUED TASKS (top 3):
{queued_tasks}

NEXT PRIORITY:
  {next_priority}

PROTECTED FLOOR: {test_floor} passing tests
  Verify with: uv run pytest
═══════════════════════════════════════"""
        return handoff

    def get_boot_block(self, test_floor: int = 342) -> str:
        """Prints a complete agent onboarding block."""
        date_str = datetime.now().strftime("%Y-%m-%d")
        cwd = os.getcwd()
        queued_tasks = self.get_next_tasks(3)
        milestone_block = self.get_active_milestone_and_goals()
        
        boot = f"""═══════════════════════════════════════
rpgCore — Agent Boot Sequence
═══════════════════════════════════════
ENVIRONMENT: Windows PowerShell
REPO: {cwd}

{milestone_block}

STEP 0 — Verify orientation:
  python -m src.tools.apj handoff

STEP 1 — Read these documents in order:
  docs/core/RPGCORE_CONSTITUTION.md
  docs/reference/SESSION_PROTOCOL.md
  docs/journal/PROJECT_JOURNAL.md
  docs/planning/TASKS.md

STEP 2 — Verify test floor:
  uv run pytest

STEP 3 — Confirm understanding before acting:
  State current floor, what is in flight, next priority.
  Wait for Overseer confirmation before writing any code.

QUEUED TASKS (top 3):
{queued_tasks}

AGENT STANDARDS:
  Use: uv run pytest, uv run python
  No print() in src/ — use logging
  Spec before code — confirm plan with Overseer first
  Present options as: Headlong / Divert / Alt
  Final step: python -m src.tools.apj update --current "..." --inflight "..." --next "..."

PROTECTED FLOOR: {test_floor} passing tests
SESSION DATE: {date_str}
═══════════════════════════════════════"""
        return boot
