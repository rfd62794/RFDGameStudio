import os
import shutil
from pathlib import Path

def main():
    docs_dir = Path("docs")
    archive_dir = Path("archive/legacy_docs_2026")
    
    # Ensure archive dir exists
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    # The explicitly kept list
    keepers = {
        "RPGCORE_CONSTITUTION.md",
        "SESSION_PROTOCOL.md",
        "TEST_HEALTH_REPORT.md",
        "TECH_DEBT.md",
        "ENGINE_AUDIT.md",
        "RENDERING_AUDIT.md",
        "DEMOS.md"
    }
    
    archive_note = "> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.\n\n"
    
    def archive_file(filepath: Path, dest_dir: Path):
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / filepath.name
        
        # Prepend note if markdown
        if filepath.suffix == '.md':
            try:
                content = filepath.read_text(encoding='utf-8')
                new_content = archive_note + content
                dest_path.write_text(new_content, encoding='utf-8')
                filepath.unlink()
                print(f"Archived (prepending note): {filepath} -> {dest_path}")
            except Exception as e:
                print(f"Error archiving {filepath}: {e}")
                # Fallback to pure move
                shutil.move(str(filepath), str(dest_path))
        else:
            shutil.move(str(filepath), str(dest_path))
            print(f"Moved: {filepath} -> {dest_path}")
            
    # Walk the docs/ directory and grab everything
    for root, dirs, files in os.walk(docs_dir, topdown=False):
        root_path = Path(root)
        
        # Don't archive the root if we're in the root, but process its files
        for filename in files:
            if root_path == docs_dir and filename in keepers:
                continue # Keep these
                
            file_path = root_path / filename
            
            # Calculate where it should go in the archive to preserve structure
            rel_path = file_path.relative_to(docs_dir)
            
            # If it's directly in docs/, put it directly in archive_dir
            # If it's in docs/adr/, put it in archive_dir/adr/
            dest_dir = archive_dir / rel_path.parent
            
            archive_file(file_path, dest_dir)
            
        # Clean up empty directories in docs
        if root_path != docs_dir:
            try:
                root_path.rmdir()
            except OSError:
                pass # Not empty

if __name__ == "__main__":
    main()
