"""
SaveManager - Atomic save/load system for all player data
Prevents roster loss and provides unified persistence
"""

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from loguru import logger

from src.shared.teams.roster import Roster
from src.shared.session.game_session import GameSession


class SaveManager:
    """Atomic save/load system for player data"""
    
    SAVE_DIR: Path = Path('saves')
    SAVE_FILE: Path = SAVE_DIR / 'player.json'
    BACKUP_FILE: Path = SAVE_DIR / 'player.backup.json'
    
    @classmethod
    def save(cls, roster: Roster, session: GameSession) -> bool:
        """
        Atomic save — writes to backup first,
        then promotes to main save.
        Never corrupts existing save on failure.
        """
        # Skip saves if debug flag set
        import os
        if os.getenv('SKIP_SAVE') == 'true':
            logger.debug("SKIP_SAVE=true - skipping save")
            return True
            
        try:
            cls.SAVE_DIR.mkdir(exist_ok=True)
            data = {
                'version': 2,
                'saved_at': datetime.now(timezone.utc).isoformat(),
                'roster': cls._serialize_roster(roster),
                'session': session.to_dict(),
            }
            
            # Write to temp first
            temp_file = cls.SAVE_DIR / 'player.tmp.json'
            temp_file.write_text(json.dumps(data, indent=2))
            
            # Promote backup
            if cls.SAVE_FILE.exists():
                shutil.copy2(cls.SAVE_FILE, cls.BACKUP_FILE)
            
            # Promote temp to main
            temp_file.replace(cls.SAVE_FILE)
            
            logger.info(f"Save successful: {len(roster.entries)} slimes, {len(session.resources)} resources")
            return True
            
        except Exception as e:
            logger.error(f'Save failed: {e}')
            return False
    
    @classmethod
    def load(cls) -> Optional[Tuple[Dict[str, Any], Dict[str, Any]]]:
        """
        Returns (roster_data, session_data)
        or None if no save exists.
        Tries backup if main save corrupted.
        """
        for path in [cls.SAVE_FILE, cls.BACKUP_FILE]:
            try:
                if path.exists():
                    data = json.loads(path.read_text())
                    if data.get('version', 1) < 2:
                        logger.warning(f"Save file {path.name} is obsolete (version < 2). Ignoring.")
                        continue
                    logger.info(f"Loaded save from {path.name}")
                    return (data['roster'], data['session'])
            except Exception as e:
                logger.warning(f"Failed to load {path.name}: {e}")
                continue
        
        logger.info("No save file found - starting fresh game")
        return None
    
    @classmethod
    def has_save(cls) -> bool:
        return cls.SAVE_FILE.exists()
    
    @classmethod
    def delete_save(cls) -> None:
        """Delete all save files"""
        for file_path in [cls.SAVE_FILE, cls.BACKUP_FILE]:
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted {file_path.name}")
    
    @classmethod
    def _serialize_roster(cls, roster: Roster) -> Dict[str, Any]:
        """Serialize roster using the full RosterSlime format for complete data preservation"""
        return roster.to_dict()  # This includes full slimes data
    
    @classmethod
    def auto_save(cls, context) -> bool:
        """Convenience method for auto-saving from scene context"""
        if context and context.roster and context.game_session:
            return cls.save(context.roster, context.game_session)
        return False
