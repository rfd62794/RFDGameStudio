#!/usr/bin/env python3
"""
Persistence Stress Test - Wave 3 Production Hardening
Tests Tier 1 Foundation persistence with 100 character sheets
Validates roster.db and locker.json handshake integrity
"""

import sys
import time
import sqlite3
import json
import random
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from dgt_engine.foundation.types import Result
from loguru import logger


@dataclass
class CharacterSheet:
    """Character sheet data structure"""
    character_id: str
    name: str
    class_type: str
    level: int
    hp: int
    max_hp: int
    strength: int
    dexterity: int
    constitution: int
    intelligence: int
    wisdom: int
    charisma: int
    inventory: List[str]
    gold: int
    experience: int
    created_at: str
    last_updated: str


class PersistenceStressTester:
    """Stress tests Tier 1 Foundation persistence system"""
    
    def __init__(self):
        self.test_db_path = Path("test_roster_stress.db")
        self.test_locker_path = Path("test_locker_stress.json")
        self.character_count = 100
        self.results = {
            'write_operations': 0,
            'read_operations': 0,
            'write_errors': 0,
            'read_errors': 0,
            'write_time_ms': 0.0,
            'read_time_ms': 0.0,
            'integrity_failures': 0
        }
        
        # Clean up any existing test files
        if self.test_db_path.exists():
            self.test_db_path.unlink()
        if self.test_locker_path.exists():
            self.test_locker_path.unlink()
        
        logger.info("🔍 Persistence Stress Tester initialized")
    
    def create_test_database(self) -> Result[bool]:
        """Create test database schema"""
        try:
            conn = sqlite3.connect(self.test_db_path)
            cursor = conn.cursor()
            
            # Create character sheets table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS character_sheets (
                    character_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    class_type TEXT NOT NULL,
                    level INTEGER NOT NULL,
                    hp INTEGER NOT NULL,
                    max_hp INTEGER NOT NULL,
                    strength INTEGER NOT NULL,
                    dexterity INTEGER NOT NULL,
                    constitution INTEGER NOT NULL,
                    intelligence INTEGER NOT NULL,
                    wisdom INTEGER NOT NULL,
                    charisma INTEGER NOT NULL,
                    gold INTEGER NOT NULL,
                    experience INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    last_updated TEXT NOT NULL
                )
            ''')
            
            # Create inventory table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS character_inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    character_id TEXT NOT NULL,
                    item_name TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    FOREIGN KEY (character_id) REFERENCES character_sheets (character_id)
                )
            ''')
            
            conn.commit()
            conn.close()
            
            logger.info("✅ Test database created")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to create test database: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def generate_test_characters(self) -> List[CharacterSheet]:
        """Generate test character data"""
        characters = []
        classes = ["Fighter", "Wizard", "Rogue", "Cleric", "Ranger", "Paladin"]
        names = ["Aldric", "Bree", "Cael", "Dara", "Erik", "Faye", "Gorn", "Hela", "Ivan", "Jora"]
        
        for i in range(self.character_count):
            character = CharacterSheet(
                character_id=f"char_{i:03d}",
                name=f"{random.choice(names)}_{i}",
                class_type=random.choice(classes),
                level=random.randint(1, 20),
                hp=random.randint(10, 100),
                max_hp=random.randint(10, 100),
                strength=random.randint(8, 18),
                dexterity=random.randint(8, 18),
                constitution=random.randint(8, 18),
                intelligence=random.randint(8, 18),
                wisdom=random.randint(8, 18),
                charisma=random.randint(8, 18),
                gold=random.randint(0, 1000),
                experience=random.randint(0, 50000),
                created_at=datetime.now().isoformat(),
                last_updated=datetime.now().isoformat()
            )
            
            # Add random inventory items
            items = ["sword", "shield", "potion", "scroll", "armor", "helmet", "boots", "gloves"]
            character.inventory = random.sample(items, random.randint(0, 5))
            
            characters.append(character)
        
        return characters
    
    def write_character_sheets(self, characters: List[CharacterSheet]) -> Result[bool]:
        """Write character sheets to database"""
        try:
            start_time = time.time()
            
            conn = sqlite3.connect(self.test_db_path)
            cursor = conn.cursor()
            
            for character in characters:
                try:
                    # Insert character sheet
                    cursor.execute('''
                        INSERT INTO character_sheets 
                        (character_id, name, class_type, level, hp, max_hp, 
                         strength, dexterity, constitution, intelligence, wisdom, charisma,
                         gold, experience, created_at, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        character.character_id,
                        character.name,
                        character.class_type,
                        character.level,
                        character.hp,
                        character.max_hp,
                        character.strength,
                        character.dexterity,
                        character.constitution,
                        character.intelligence,
                        character.wisdom,
                        character.charisma,
                        character.gold,
                        character.experience,
                        character.created_at,
                        character.last_updated
                    ))
                    
                    # Insert inventory items
                    for item in character.inventory:
                        cursor.execute('''
                            INSERT INTO character_inventory (character_id, item_name, quantity)
                            VALUES (?, ?, ?)
                        ''', (character.character_id, item, 1))
                    
                    self.results['write_operations'] += 1
                    
                except Exception as e:
                    self.results['write_errors'] += 1
                    logger.error(f"Write error for character {character.character_id}: {e}")
            
            conn.commit()
            conn.close()
            
            self.results['write_time_ms'] = (time.time() - start_time) * 1000
            
            logger.info(f"✅ Wrote {len(characters)} character sheets in {self.results['write_time_ms']:.2f}ms")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to write character sheets: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def read_character_sheets(self) -> Result[List[CharacterSheet]]:
        """Read character sheets from database"""
        try:
            start_time = time.time()
            
            conn = sqlite3.connect(self.test_db_path)
            cursor = conn.cursor()
            
            characters = []
            
            for i in range(self.character_count):
                try:
                    character_id = f"char_{i:03d}"
                    
                    # Read character sheet
                    cursor.execute('''
                        SELECT character_id, name, class_type, level, hp, max_hp,
                               strength, dexterity, constitution, intelligence, wisdom, charisma,
                               gold, experience, created_at, last_updated
                        FROM character_sheets WHERE character_id = ?
                    ''', (character_id,))
                    
                    row = cursor.fetchone()
                    if not row:
                        self.results['read_errors'] += 1
                        continue
                    
                    # Read inventory items
                    cursor.execute('''
                        SELECT item_name FROM character_inventory WHERE character_id = ?
                    ''', (character_id,))
                    
                    inventory_rows = cursor.fetchall()
                    inventory = [row[0] for row in inventory_rows]
                    
                    # Reconstruct character sheet
                    character = CharacterSheet(
                        character_id=row[0],
                        name=row[1],
                        class_type=row[2],
                        level=row[3],
                        hp=row[4],
                        max_hp=row[5],
                        strength=row[6],
                        dexterity=row[7],
                        constitution=row[8],
                        intelligence=row[9],
                        wisdom=row[10],
                        charisma=row[11],
                        gold=row[12],
                        experience=row[13],
                        created_at=row[14],
                        last_updated=row[15],
                        inventory=inventory
                    )
                    
                    characters.append(character)
                    self.results['read_operations'] += 1
                    
                except Exception as e:
                    self.results['read_errors'] += 1
                    logger.error(f"Read error for character {character_id}: {e}")
            
            conn.close()
            
            self.results['read_time_ms'] = (time.time() - start_time) * 1000
            
            logger.info(f"✅ Read {len(characters)} character sheets in {self.results['read_time_ms']:.2f}ms")
            return Result(success=True, value=characters)
            
        except Exception as e:
            error_msg = f"Failed to read character sheets: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def create_locker_data(self, characters: List[CharacterSheet]) -> Dict[str, Any]:
        """Create locker.json data structure"""
        locker_data = {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "total_characters": len(characters),
            "character_summaries": {},
            "global_statistics": {
                "total_level": sum(c.level for c in characters),
                "total_gold": sum(c.gold for c in characters),
                "total_experience": sum(c.experience for c in characters),
                "class_distribution": {}
            }
        }
        
        # Add character summaries
        for character in characters:
            locker_data["character_summaries"][character.character_id] = {
                "name": character.name,
                "class_type": character.class_type,
                "level": character.level,
                "hp": character.hp,
                "max_hp": character.max_hp,
                "gold": character.gold
            }
            
            # Update class distribution
            class_type = character.class_type
            if class_type not in locker_data["global_statistics"]["class_distribution"]:
                locker_data["global_statistics"]["class_distribution"][class_type] = 0
            locker_data["global_statistics"]["class_distribution"][class_type] += 1
        
        return locker_data
    
    def write_locker_file(self, locker_data: Dict[str, Any]) -> Result[bool]:
        """Write locker.json file"""
        try:
            with open(self.test_locker_path, 'w') as f:
                json.dump(locker_data, f, indent=2)
            
            logger.info(f"✅ Locker file written with {locker_data['total_characters']} characters")
            return Result(success=True, value=True)
            
        except Exception as e:
            error_msg = f"Failed to write locker file: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def read_locker_file(self) -> Result[Dict[str, Any]]:
        """Read locker.json file"""
        try:
            with open(self.test_locker_path, 'r') as f:
                locker_data = json.load(f)
            
            logger.info(f"✅ Locker file read with {locker_data['total_characters']} characters")
            return Result(success=True, value=locker_data)
            
        except Exception as e:
            error_msg = f"Failed to read locker file: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def verify_integrity(self, characters: List[CharacterSheet], locker_data: Dict[str, Any]) -> bool:
        """Verify integrity between database and locker file"""
        try:
            integrity_issues = 0
            
            # Check character count
            if len(characters) != locker_data['total_characters']:
                integrity_issues += 1
                logger.error(f"Character count mismatch: DB={len(characters)}, Locker={locker_data['total_characters']}")
            
            # Check each character summary
            for character in characters:
                if character.character_id not in locker_data['character_summaries']:
                    integrity_issues += 1
                    logger.error(f"Character {character.character_id} missing from locker")
                    continue
                
                summary = locker_data['character_summaries'][character.character_id]
                
                # Verify key fields
                if summary['name'] != character.name:
                    integrity_issues += 1
                    logger.error(f"Name mismatch for {character.character_id}")
                
                if summary['class_type'] != character.class_type:
                    integrity_issues += 1
                    logger.error(f"Class mismatch for {character.character_id}")
                
                if summary['level'] != character.level:
                    integrity_issues += 1
                    logger.error(f"Level mismatch for {character.character_id}")
            
            # Verify global statistics
            db_total_level = sum(c.level for c in characters)
            if db_total_level != locker_data['global_statistics']['total_level']:
                integrity_issues += 1
                logger.error(f"Total level mismatch: DB={db_total_level}, Locker={locker_data['global_statistics']['total_level']}")
            
            db_total_gold = sum(c.gold for c in characters)
            if db_total_gold != locker_data['global_statistics']['total_gold']:
                integrity_issues += 1
                logger.error(f"Total gold mismatch: DB={db_total_gold}, Locker={locker_data['global_statistics']['total_gold']}")
            
            self.results['integrity_failures'] = integrity_issues
            
            if integrity_issues == 0:
                logger.info("✅ Integrity verification passed")
            else:
                logger.warning(f"⚠️ {integrity_issues} integrity issues found")
            
            return integrity_issues == 0
            
        except Exception as e:
            logger.error(f"Integrity verification failed: {e}")
            return False
    
    def run_stress_test(self) -> Result[Dict[str, Any]]:
        """Run complete persistence stress test"""
        logger.info("🔍 Starting Persistence Stress Test")
        logger.info(f"Testing with {self.character_count} character sheets")
        
        try:
            # Step 1: Create database
            db_result = self.create_test_database()
            if not db_result.success:
                return Result(success=False, error=db_result.error)
            
            # Step 2: Generate test data
            characters = self.generate_test_characters()
            logger.info(f"Generated {len(characters)} test characters")
            
            # Step 3: Write to database
            write_result = self.write_character_sheets(characters)
            if not write_result.success:
                return Result(success=False, error=write_result.error)
            
            # Step 4: Create locker data
            locker_data = self.create_locker_data(characters)
            
            # Step 5: Write locker file
            locker_write_result = self.write_locker_file(locker_data)
            if not locker_write_result.success:
                return Result(success=False, error=locker_write_result.error)
            
            # Step 6: Read from database
            read_result = self.read_character_sheets()
            if not read_result.success:
                return Result(success=False, error=read_result.error)
            
            read_characters = read_result.value
            
            # Step 7: Read locker file
            locker_read_result = self.read_locker_file()
            if not locker_read_result.success:
                return Result(success=False, error=locker_read_result.error)
            
            read_locker_data = locker_read_result.value
            
            # Step 8: Verify integrity
            integrity_ok = self.verify_integrity(read_characters, read_locker_data)
            
            # Step 9: Calculate performance metrics
            write_ops_per_sec = self.results['write_operations'] / (self.results['write_time_ms'] / 1000) if self.results['write_time_ms'] > 0 else 0
            read_ops_per_sec = self.results['read_operations'] / (self.results['read_time_ms'] / 1000) if self.results['read_time_ms'] > 0 else 0
            
            performance_metrics = {
                'write_ops_per_sec': write_ops_per_sec,
                'read_ops_per_sec': read_ops_per_sec,
                'avg_write_time_ms': self.results['write_time_ms'] / self.results['write_operations'] if self.results['write_operations'] > 0 else 0,
                'avg_read_time_ms': self.results['read_time_ms'] / self.results['read_operations'] if self.results['read_operations'] > 0 else 0
            }
            
            # Step 10: Generate final report
            report = {
                'test_completed': True,
                'character_count': self.character_count,
                'integrity_passed': integrity_ok,
                'performance_metrics': performance_metrics,
                'operations': {
                    'write_operations': self.results['write_operations'],
                    'read_operations': self.results['read_operations'],
                    'write_errors': self.results['write_errors'],
                    'read_errors': self.results['read_errors'],
                    'integrity_failures': self.results['integrity_failures']
                },
                'timing': {
                    'total_write_time_ms': self.results['write_time_ms'],
                    'total_read_time_ms': self.results['read_time_ms'],
                    'total_time_ms': self.results['write_time_ms'] + self.results['read_time_ms']
                },
                'files_created': {
                    'database': str(self.test_db_path),
                    'locker': str(self.test_locker_path)
                }
            }
            
            logger.info("✅ Persistence stress test completed")
            return Result(success=True, value=report)
            
        except Exception as e:
            error_msg = f"Stress test failed: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def cleanup(self):
        """Clean up test files"""
        try:
            if self.test_db_path.exists():
                self.test_db_path.unlink()
            if self.test_locker_path.exists():
                self.test_locker_path.unlink()
            logger.info("🗑️ Test files cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")


def main():
    """Main stress test execution"""
    print("🔍 DGT Platform - Persistence Stress Test")
    print("=" * 50)
    print("Wave 3: Testing Tier 1 Foundation persistence")
    print(f"Testing 100 character sheets with roster.db/locker.json handshake")
    print()
    
    tester = PersistenceStressTester()
    
    try:
        # Run stress test
        result = tester.run_stress_test()
        
        if not result.success:
            print(f"❌ Stress test failed: {result.error}")
            return 1
        
        report = result.value
        
        # Display results
        print(f"📊 Stress Test Results:")
        print(f"   Characters tested: {report['character_count']}")
        print(f"   Integrity check: {'✅ PASSED' if report['integrity_passed'] else '❌ FAILED'}")
        print()
        
        print(f"📈 Performance Metrics:")
        print(f"   Write ops/sec: {report['performance_metrics']['write_ops_per_sec']:.1f}")
        print(f"   Read ops/sec: {report['performance_metrics']['read_ops_per_sec']:.1f}")
        print(f"   Avg write time: {report['performance_metrics']['avg_write_time_ms']:.2f}ms")
        print(f"   Avg read time: {report['performance_metrics']['avg_read_time_ms']:.2f}ms")
        print()
        
        print(f"🔧 Operations:")
        print(f"   Write operations: {report['operations']['write_operations']}")
        print(f"   Read operations: {report['operations']['read_operations']}")
        print(f"   Write errors: {report['operations']['write_errors']}")
        print(f"   Read errors: {report['operations']['read_errors']}")
        print(f"   Integrity failures: {report['operations']['integrity_failures']}")
        print()
        
        print(f"⏱️ Timing:")
        print(f"   Total write time: {report['timing']['total_write_time_ms']:.2f}ms")
        print(f"   Total read time: {report['timing']['total_read_time_ms']:.2f}ms")
        print(f"   Total time: {report['timing']['total_time_ms']:.2f}ms")
        print()
        
        # Final verdict
        success_criteria = (
            report['integrity_passed'] and
            report['operations']['write_errors'] == 0 and
            report['operations']['read_errors'] == 0 and
            report['operations']['integrity_failures'] == 0 and
            report['performance_metrics']['write_ops_per_sec'] > 50 and
            report['performance_metrics']['read_ops_per_sec'] > 100
        )
        
        if success_criteria:
            print("🏆 PERSISTENCE STRESS TEST PASSED!")
            print("🚀 Tier 1 Foundation persistence is production ready")
        else:
            print("⚠️  STRESS TEST FAILED")
            print("🔧 Review persistence performance before production deployment")
        
        print()
        
        # Save report
        report_file = Path("persistence_stress_test_report.json")
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"📄 Detailed report saved to: {report_file}")
        
        return 0 if success_criteria else 1
        
    except Exception as e:
        logger.error(f"❌ Stress test execution failed: {e}")
        print(f"❌ Error: {e}")
        return 1
    finally:
        # Clean up
        tester.cleanup()


if __name__ == "__main__":
    exit(main())
