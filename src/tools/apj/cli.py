import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # fix cp1252 on Windows
import argparse
from dotenv import load_dotenv
load_dotenv()  # Load .env before agent imports resolve env vars

from loguru import logger
from src.tools.apj.journal import Journal
from src.tools.apj.agents.archivist import Archivist, CoherenceReport
from src.tools.apj.agents.strategist import Strategist, SessionPlan, SessionOption
from src.tools.apj.agents.ollama_client import resolve_model, warm_model_sync
from src.tools.apj.agents.herald import Herald, HeraldDirective
from datetime import datetime
from pathlib import Path

# Resolution: src/tools/apj/cli.py -> parents[3] is rpgCore
PROJECT_ROOT = Path(__file__).resolve().parents[3]

def print_coherence_report(report: "CoherenceReport") -> None:
    """Print the Archivist CoherenceReport to stdout."""
    print("=" * 60)
    print("  ARCHIVIST COHERENCE REPORT")
    print("=" * 60)
    print("\n[PRIMER]")
    print(f"  {report.session_primer}")
    print("\n[QUEUED FOCUS]")
    print(f"  -> {report.queued_focus}")
    if report.open_risks:
        print("\n[OPEN RISKS]")
        for risk in report.open_risks:
            print(f"  * {risk}")
    else:
        print("\n[OPEN RISKS] None detected.")
    if report.constitutional_flags:
        print("\n[CONSTITUTIONAL FLAGS]")
        for flag in report.constitutional_flags:
            print(f"  !! {flag}")
    else:
        print("\n[CONSTITUTIONAL FLAGS] No violations detected.")
    print(f"\n[CORPUS HASH] {report.corpus_hash[:16]}...")
    print("=" * 60)
    print("  Session log saved to docs/agents/session_logs/")
    print("=" * 60 + "\n")


def print_session_plan(plan: "SessionPlan") -> None:
    """Print the Strategist SessionPlan to stdout."""
    print("=" * 60)
    print("  STRATEGIST SESSION PLAN")
    print("=" * 60)

    def _print_option(icon: str, opt: "SessionOption") -> None:
        print(f"\n{icon} {opt.label.upper()} -- {opt.title} [{opt.risk} Risk]")
        print(f"  Advances: {opt.milestone_impact}")
        print(f"  Rationale: {opt.rationale}")
        print("  Tasks:")
        for i, task in enumerate(opt.tasks, 1):
            print(f"    {i}. {task}")

    _print_option("[R] RECOMMENDED", plan.recommended)
    icons = ["[D] DIVERT", "[A] ALT"]
    for icon, alt in zip(icons, plan.alternatives):
        _print_option(icon, alt)

    if plan.open_questions:
        print("\n[OPEN QUESTIONS]")
        for q in plan.open_questions:
            print(f"  ? {q}")

    if plan.archivist_risks_addressed:
        print("\n[ARCHIVIST RISKS ADDRESSED]")
        for r in plan.archivist_risks_addressed:
            print(f"  -> {r}")

    print("\n" + "=" * 60 + "\n")


def _run_session_start() -> None:
    """Run Archivist then Strategist, print both reports to console."""
    import yaml
    
    # Check if we can skip warmup (if both primary agents are remote)
    skip_warmup = False
    try:
        a_path = PROJECT_ROOT / "docs/agents/configs/archivist.yaml"
        s_path = PROJECT_ROOT / "docs/agents/configs/strategist.yaml"
        with open(a_path) as f: a_conf = yaml.safe_load(f)
        with open(s_path) as f: s_conf = yaml.safe_load(f)
        if a_conf.get("model_preference") == "remote" and s_conf.get("model_preference") == "remote":
            skip_warmup = True
    except:
        pass

    if not skip_warmup:
        model = resolve_model()
        # Pre-load model into VRAM — auto-downgrades to 1b/0.5b on memory constraint
        print("\n[~] Warming model in VRAM...")
        active_model = warm_model_sync(model)   # may return a smaller model
        if active_model != model:
            print(f"[!] Memory constraint — downgraded to {active_model}")
    else:
        print("\n[~] Skipping local warmup (remote preference detected)")
        active_model = "base_agent_router" # ModelRouter will handle actual model selection

    print("\n[*] APJ Archivist initializing...\n")
    archivist = Archivist(model_name=active_model)
    report = archivist.run()
    print_coherence_report(report)

    print("\n[...] Strategist planning session...\n")
    strategist = Strategist(model_name=active_model)
    plan = strategist.run(archivist_report=report)
    print_session_plan(plan)


def print_herald_directive(directive: "HeraldDirective") -> None:
    """Print the Herald directive to stdout in ready-to-paste format."""
    print("=" * 60)
    print("  HERALD DIRECTIVE")
    print("=" * 60)
    print(f"[SESSION]  {directive.session_id} \u2014 {directive.title}")
    print(f"[CONFIDENCE]  {directive.confidence}")
    print("-" * 60)
    print(f"\n{directive.preamble}")
    print("\n[CONTEXT]")
    # Wrap context lines at ~70 chars for readability
    for line in directive.context.split(". "):
        if line:
            print(f"  {line.strip()}.")
    print("\n[TASKS]")
    for task in directive.tasks:
        print(f"  {task}")
    print("\n[VERIFY]")
    print(f"  {directive.verification}")
    print("\n[COMMIT]")
    print(f"  {directive.commit_message}")
    print("=" * 60 + "\n")


def _load_last_strategist_plan() -> "SessionPlan | None":
    """
    Load the most recent *_strategist.md from docs/session_logs/.
    Parses the markdown back to a SessionPlan. Returns None if not found
    or if parse fails — caller handles the None case.
    """
    import json
    import re
    from pathlib import Path

    logs_dir = Path(__file__).resolve().parents[3] / "docs" / "session_logs"
    if not logs_dir.exists():
        logger.warning("Herald: session_logs dir not found — run session start first")
        return None

    strategist_files = sorted(logs_dir.glob("*_strategist.md"))
    if not strategist_files:
        logger.warning("Herald: no *_strategist.md found in session_logs")
        return None

    latest = strategist_files[-1]
    logger.info(f"Herald: loading plan from {latest.name}")

    try:
        # The strategist saves plain markdown — we reconstruct SessionPlan
        # from the embedded JSON-like structure in the task list.
        # Since we don't store raw JSON, we build a fallback plan from
        # text parsing of the markdown headings and task lines.
        text = latest.read_text(encoding="utf-8")

        # Extract recommended title and tasks using markdown patterns
        title_match = re.search(r"\[R\] HEADLONG.*?\u2014 (.+?) \[", text)
        title = title_match.group(1).strip() if title_match else "Session Work"

        # Extract task lines (numbered list items)
        tasks = re.findall(r"    \d+\.\s+(.+)", text)

        # Extract milestone impact
        milestone_match = re.search(r"Advances:\s+(.+)", text)
        milestone = milestone_match.group(1).strip() if milestone_match else "Active Milestone"

        # Extract corpus hash
        hash_match = re.search(r"Corpus Hash.*?`([a-f0-9]+)`", text)
        corpus_hash = hash_match.group(1) if hash_match else ""

        from src.tools.apj.agents.strategist import SessionPlan, SessionOption
        return SessionPlan(
            recommended=SessionOption(
                label="Headlong",
                title=title,
                rationale="Loaded from last Strategist session log.",
                tasks=tasks or ["Review session log for details"],
                risk="Low",
                milestone_impact=milestone,
            ),
            alternatives=[
                SessionOption(
                    label="Divert",
                    title="Address Open Risks",
                    rationale="Check Archivist report for risks.",
                    tasks=["Review docs/agents/session_logs/ for last archivist report"],
                    risk="Low",
                    milestone_impact="N/A",
                ),
                SessionOption(
                    label="Alt",
                    title="Smaller Session Scope",
                    rationale="Lower risk option — reduce scope.",
                    tasks=["python -m src.tools.apj handoff"],
                    risk="Low",
                    milestone_impact="N/A",
                ),
            ],
            open_questions=[],
            archivist_risks_addressed=[],
            corpus_hash=corpus_hash,
        )
    except Exception as exc:
        logger.warning(f"Herald: failed to parse strategist plan ({exc})")
        return None


def print_improvement_suggestion(s: "ImprovementSuggestion") -> None:
    """Print an ImprovementSuggestion in readable format."""
    print("=" * 60)
    print("  IMPROVER SUGGESTION")
    print("=" * 60)
    print(f"[AGENT]      {s.agent_name}")
    print(f"[FILE]       {s.prompt_file}")
    print(f"[CONFIDENCE] {s.confidence}")
    print("\n[WEAKNESSES FOUND]")
    for w in s.weaknesses:
        print(f"  * {w}")
    print("\n[ANNOTATED CHANGES]")
    for c in s.changes_annotated:
        print(f"  -> {c}")
    print("\n[REWRITTEN PROMPT PREVIEW] (first 300 chars)")
    print(f"  {s.rewritten_prompt[:300]}...")
    print("=" * 60 + "\n")


def main():
    journal = Journal()

    if len(sys.argv) < 2:
        print("Usage: python -m src.tools.apj [status|update|handoff|boot|tasks|goals|milestones|session|herald|improve]")
        return

    cmd = sys.argv[1].lower()

    if cmd == "status":
        print(journal.load())
    
    elif cmd == "handoff":
        print(journal.get_handoff())
        
    elif cmd == "boot":
        print(journal.get_boot_block())

    elif cmd == "goals":
        content = journal.load(journal.goals_path)
        print(content)

    elif cmd == "milestones":
        parser = argparse.ArgumentParser(description="rpgCore APJ Milestones")
        parser.add_argument("command") # consume 'milestones'
        parser.add_argument("--done", help="Mark a milestone as completed (matches text)")
        
        args, _ = parser.parse_known_args()
        
        if args.done:
            success = journal.complete_milestone(args.done)
            if success:
                print(f"Milestone matching '{args.done}' moved to Completed.")
            else:
                print(f"Milestone matching '{args.done}' not found.")
        else:
            content = journal.load(journal.milestones_path)
            print(content)

    elif cmd == "tasks":
        parser = argparse.ArgumentParser(description="rpgCore APJ Tasks")
        parser.add_argument("command") # consume 'tasks'
        parser.add_argument("--next", action="store_true", help="Print top 5 queued tasks")
        parser.add_argument("--add", help="Add a new task to Queued section")
        parser.add_argument("--done", help="Mark a task as completed (matches text)")
        
        args, _ = parser.parse_known_args()
        
        if args.next:
            print("QUEUED TASKS (top 5):")
            print(journal.get_next_tasks(5))
        elif args.add:
            journal.add_task(args.add)
            print(f"Added task: {args.add}")
        elif args.done:
            success = journal.complete_task(args.done)
            if success:
                print(f"Task matching '{args.done}' moved to Completed.")
            else:
                print(f"Task matching '{args.done}' not found.")
        else:
            # Print full TASKS.md
            content = journal.load(journal.tasks_path)
            print(content)

    elif cmd == "update":
        # Use argparse for update flags
        parser = argparse.ArgumentParser(description="rpgCore APJ Update")
        parser.add_argument("command") # consume 'update'
        parser.add_argument("--current", help="New content for Current State")
        parser.add_argument("--inflight", help="New content for In Flight")
        parser.add_argument("--next", help="New content for Next Priority")
        
        args, _ = parser.parse_known_args()
        
        # Mapping for flags to section names
        flag_map = {
            "current": ("Current State", args.current),
            "inflight": ("In Flight", args.inflight),
            "next": ("Next Priority", args.next)
        }
        
        # If any flags provided, skip interactive loop
        if any([args.current, args.inflight, args.next]):
            for section_key in ["current", "inflight", "next"]:
                name, content = flag_map[section_key]
                if content:
                    journal.update_section(name, content)
                    print(f"Section '{name}' updated via flag.")
            return

        # Interactive Mode fallback
        sections = ["Current State", "In Flight", "Next Priority"]
        for section in sections:
            current = journal.get_section(section)
            print(f"\n--- {section} ---")
            print(current)
            
            choice = input(f"\nUpdate '{section}'? (y/n): ").lower()
            if choice == 'y':
                print("Enter new content (type 'DONE' on a new line to finish):")
                lines = []
                while True:
                    line = sys.stdin.readline()
                    if line.strip() == "DONE":
                        break
                    lines.append(line)
                
                new_content = "".join(lines)
                journal.update_section(section, new_content)
                print(f"Section '{section}' updated.")
    elif cmd == "session":
        sub = sys.argv[2].lower() if len(sys.argv) > 2 else ""
        if sub == "start":
            _run_session_start()
        elif sub == "end":
            from src.tools.apj.agents.scribe import Scribe
            print("\n[*] APJ Scribe initializing...")
            scribe = Scribe()
            draft = scribe.run()
            if draft:
                print("\n" + "=" * 60)
                print("  SCRIBE DRAFT — REVIEW BEFORE APPROVING")
                print("=" * 60)
                print(f"  Session:    {draft.session_id}")
                print(f"  Date:       {draft.session_date}")
                print(f"  Floor:      {draft.test_floor}")
                print(f"  Summary:    {draft.summary}")
                print(f"  Commits:    {', '.join(draft.committed) or 'none'}")
                print(f"  Done:       {', '.join(draft.tasks_completed) or 'none'}")
                print(f"  Added:      {', '.join(draft.tasks_added) or 'none'}")
                print(f"  Confidence: {draft.confidence}")
                print("=" * 60)
                response = input("\n  Approve and write to journal? [y/N]: ").strip().lower()
                if response == "y":
                    scribe.approve_and_write(draft)
                    print(f"\n  Journal entry {draft.session_id} written.")
                    print("  Session closed.")
                else:
                    print("\n  Draft not written. Run session end again to retry.")
        else:
            print("Usage: python -m src.tools.apj session [start|end]")

    elif cmd == "herald":
        from src.tools.apj.agents.herald import Herald
        plan = _load_last_strategist_plan()
        if plan is None:
            print("No strategist plan found. Run session start first.")
            return

        print("\n[~] Herald: invoking ModelRouter (with ContextBuilder)...")
        agent = Herald.from_config("herald")
        directive = agent.run(plan)
        
        from src.tools.apj.cli import print_herald_directive
        print_herald_directive(directive)
        
        response = input("Save directive? [y/N]: ").strip().lower()
        if response == "y":
            from src.tools.apj.agents.herald import Herald
            h = Herald(model_name="base_agent_router") # Dummy for save logic
            h._save_directive(directive)
            print("Directive saved to session_logs/")

    elif cmd == "inventory":
        sub = sys.argv[2] if len(sys.argv) > 2 else "scan"
        
        if sub == "scan":
            from .inventory.scanner import ASTScanner
            from .inventory.cache import save_cache
            scanner = ASTScanner(PROJECT_ROOT)
            symbol_map = scanner.scan()
            save_cache(PROJECT_ROOT, symbol_map)
            print(symbol_map.summary())
        
        elif sub == "find":
            keyword = sys.argv[3] if len(sys.argv) > 3 else ""
            if not keyword:
                print("Usage: apj inventory find <keyword>")
                return
            from .inventory.cache import load_cache
            from .inventory.scanner import ASTScanner
            from .inventory.cache import save_cache
            symbol_map = load_cache(PROJECT_ROOT)
            if symbol_map is None:
                scanner = ASTScanner(PROJECT_ROOT)
                symbol_map = scanner.scan()
                save_cache(PROJECT_ROOT, symbol_map)
            results = symbol_map.find_by_keyword(keyword)
            for f in results:
                classes = [c.name for c in f.classes]
                print(f"{f.path} — {classes}")
        
        elif sub == "classes":
            name = sys.argv[3] if len(sys.argv) > 3 else ""
            if not name:
                print("Usage: apj inventory classes <ClassName>")
                return
            from .inventory.cache import load_cache
            symbol_map = load_cache(PROJECT_ROOT)
            if symbol_map is None:
                print("Run: apj inventory scan first")
                return
            results = symbol_map.find_class(name)
            for c in results:
                print(f"{c.name} in {c.file}:{c.line_start} — bases: {c.bases}")

    elif cmd == "docstring":
        sub = sys.argv[2] if len(sys.argv) > 2 else "help"
        
        if sub == "add":
            symbol_name = sys.argv[3] if len(sys.argv) > 3 else ""
            if not symbol_name:
                print("Usage: apj docstring add <SymbolName>")
                return
            
            # find symbol in inventory
            from .inventory.cache import load_cache
            symbol_map = load_cache(PROJECT_ROOT)
            if symbol_map is None:
                from .inventory.scanner import ASTScanner
                from .inventory.cache import save_cache
                scanner = ASTScanner(PROJECT_ROOT)
                symbol_map = scanner.scan()
                save_cache(PROJECT_ROOT, symbol_map)
            
            # find class or function
            classes = symbol_map.find_class(symbol_name)
            functions = symbol_map.find_function(symbol_name)
            
            if not classes and not functions:
                print(f"Symbol '{symbol_name}' not found. Run: apj inventory scan")
                return
            
            target = classes[0] if classes else functions[0]
            symbol_type = "class" if classes else "function"
            
            # read source code for that symbol
            file_path = PROJECT_ROOT / target.file
            source_lines = file_path.read_text(encoding="utf-8").splitlines()
            source_code = "\n".join(
                source_lines[target.line_start - 1 : target.line_end]
            )
            
            # generate
            from .agents.docstring_agent import DocstringAgent, DocstringRequest
            agent = DocstringAgent.from_config("docstring")
            request = DocstringRequest(
                symbol_name=target.name,
                symbol_type=symbol_type,
                source_code=source_code,
                file_path=target.file,
                existing_docstring=target.docstring,
            )
            
            print(f"\nGenerating docstring for {symbol_type}: {symbol_name}...")
            result = agent.generate(request)
            result.line_number = target.line_start # Ensure correct line number from inventory
            
            print(f"\n{'='*60}")
            print(f"  PROPOSED DOCSTRING — {result.symbol_name}")
            print(f"{'='*60}")
            print(f"[CONFIDENCE] {result.confidence}")
            print(f"[REASONING]  {result.reasoning}")
            print(f"[DOCSTRING]")
            print(f'  """{result.docstring}"""')
            print(f"{'='*60}")
            
            response = input("\nInsert this docstring? [y/N]: ")
            if response.lower() == "y":
                success = agent.insert(result, PROJECT_ROOT)
                if success:
                    print(f"Docstring inserted. Run: apj inventory scan to update cache.")
                else:
                    print("Insertion failed — check logs.")
        
        elif sub == "sweep":
            print("Sweep mode: finds symbols missing docstrings.")
            from .inventory.cache import load_cache
            symbol_map = load_cache(PROJECT_ROOT)
            if symbol_map is None:
                from .inventory.scanner import ASTScanner
                from .inventory.cache import save_cache
                scanner = ASTScanner(PROJECT_ROOT)
                symbol_map = scanner.scan()
                save_cache(PROJECT_ROOT, symbol_map)
            
            missing = []
            for f in symbol_map.files.values():
                for c in f.classes:
                    if not c.docstring:
                        missing.append((c.name, f.path, "class"))
                for fn in f.functions:
                    if not fn.docstring and not fn.name.startswith("_"):
                        missing.append((fn.name, f.path, "function"))
            
            print(f"\nFound {len(missing)} symbols missing docstrings:")
            for name, path, stype in missing[:20]:
                print(f"  {stype}: {name} in {path}")
            if len(missing) > 20:
                print(f"  ... and {len(missing) - 20} more")
            print(f"\nRun: apj docstring add <SymbolName> to add one at a time.")
        
        else:
            print("Usage: apj docstring [add|sweep]")

    elif cmd == "improve":
        agent_name = sys.argv[2] if len(sys.argv) > 2 else None
        if not agent_name or agent_name not in ("archivist", "strategist", "scribe", "herald"):
            print("Usage: apj improve [archivist|strategist|scribe|herald]")
            return
        from src.tools.apj.agents.improver import Improver
        try:
            improver = Improver()
        except RuntimeError as e:
            print(f"[!] {e}")
            return
        suggestion = improver.run(agent_name)
        print_improvement_suggestion(suggestion)
        response = input("Apply this improvement? [y/N]: ").strip().lower()
        if response == "y":
            improver.apply(suggestion)
            print(f"Prompt updated. Backup saved.")

    elif cmd == "ui-review":
        from src.tools.ui_reviewer.review_mode import run_review
        scene_name = sys.argv[2] if len(sys.argv) > 2 else "all"
        if scene_name == "all":
            scenes = ["garden"] # Supported scenes
            for s in scenes:
                run_review(s)
        else:
            run_review(scene_name)

    else:
        print(f"Unknown command: {cmd}")

if __name__ == "__main__":
    main()
