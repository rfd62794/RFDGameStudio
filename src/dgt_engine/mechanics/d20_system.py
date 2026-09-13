"""
D20 Mechanic System - ADR 106: Deterministic Gameplay
Tabletop-inspired D20 resolution with visual feedback
"""

import random
import time
from typing import Dict, List, Optional, Tuple, Callable
from dataclasses import dataclass
from enum import Enum
import tkinter as tk
from loguru import logger


class CheckType(Enum):
    """Types of D20 skill checks"""
    OBSERVATION = "observation"      # Perceptive checks
    LOCKPICK = "lockpick"           # Mechanical manipulation
    ATHLETICS = "athletics"         # Physical feats
    STEALTH = "stealth"             # Avoiding detection
    PERSUASION = "persuasion"       # Social interaction
    ARCANA = "arcana"              # Magical knowledge
    SURVIVAL = "survival"          # Wilderness skills


class RollResult(Enum):
    """D20 roll outcome categories"""
    CRITICAL_FAILURE = 1    # Natural 1
    FAILURE = 2             # Below DC
    SUCCESS = 3             # Meet or exceed DC
    CRITICAL_SUCCESS = 4    # Natural 20


@dataclass
class SkillCheck:
    """Individual skill check definition"""
    check_type: CheckType
    difficulty_class: int  # DC (1-20)
    description: str
    success_message: str
    failure_message: str
    critical_success_message: str
    critical_failure_message: str
    on_success: Optional[Callable] = None
    on_failure: Optional[Callable] = None


@dataclass
class D20Roll:
    """Single D20 roll result"""
    roll_value: int
    check_type: CheckType
    difficulty_class: int
    result: RollResult
    message: str
    timestamp: float = time.time()


class D20System:
    """Core D20 resolution system"""
    
    def __init__(self):
        self.roll_history: List[D20Roll] = []
        self.skill_checks: Dict[str, SkillCheck] = {}
        self._register_default_checks()
        
        logger.info("🎲 D20 System initialized with deterministic mechanics")
    
    def _register_default_checks(self) -> None:
        """Register default skill checks for the game"""
        # Ancient Stone observation check
        self.skill_checks["ancient_stone"] = SkillCheck(
            check_type=CheckType.OBSERVATION,
            difficulty_class=12,
            description="Examine the ancient stone for markings",
            success_message="🔍 You notice faint runes carved into the stone!",
            failure_message="🔍 The stone appears weathered and featureless.",
            critical_success_message="✨ The runes glow faintly as you touch them! Ancient knowledge flows into your mind.",
            critical_failure_message="💥 You cut your hand on a sharp edge of the stone! Take 1 damage."
        )
        
        # Iron Lockbox lockpicking check
        self.skill_checks["iron_lockbox"] = SkillCheck(
            check_type=CheckType.LOCKPICK,
            difficulty_class=15,
            description="Attempt to pick the complex lock",
            success_message="🔓 With a satisfying click, the lock opens!",
            failure_message="🔒 The lock resists your attempts - it remains secure.",
            critical_success_message="💎 The lock opens effortlessly! Inside, you find a rare gemstone!",
            critical_failure_message="⚠️ Your lockpick breaks in the mechanism! The lock is now jammed."
        )
        
        # Generic interaction checks
        self.skill_checks["barrier_inspection"] = SkillCheck(
            check_type=CheckType.OBSERVATION,
            difficulty_class=8,
            description="Inspect the barrier for weaknesses",
            success_message="👁️ You spot potential handholds in the barrier.",
            failure_message="👁️ The barrier appears impassable from this angle.",
            critical_success_message="🎯 You discover a hidden path through the barrier!",
            critical_failure_message="😵 The barrier's strange patterns make you dizzy. Take 1 mental damage."
        )
    
    def roll_d20(self) -> int:
        """Roll a D20 (1-20)"""
        return random.randint(1, 20)
    
    def determine_result(self, roll: int, dc: int) -> RollResult:
        """Determine roll result category"""
        if roll == 1:
            return RollResult.CRITICAL_FAILURE
        elif roll == 20:
            return RollResult.CRITICAL_SUCCESS
        elif roll >= dc:
            return RollResult.SUCCESS
        else:
            return RollResult.FAILURE
    
    def perform_check(self, check_id: str) -> D20Roll:
        """Perform a D20 skill check"""
        if check_id not in self.skill_checks:
            logger.error(f"Unknown skill check: {check_id}")
            raise ValueError(f"Skill check '{check_id}' not found")
        
        check = self.skill_checks[check_id]
        roll_value = self.roll_d20()
        result = self.determine_result(roll_value, check.difficulty_class)
        
        # Generate appropriate message
        message = self._generate_roll_message(check, roll_value, result)
        
        # Create roll record
        d20_roll = D20Roll(
            roll_value=roll_value,
            check_type=check.check_type,
            difficulty_class=check.difficulty_class,
            result=result,
            message=message
        )
        
        # Add to history
        self.roll_history.append(d20_roll)
        
        # Execute callbacks
        self._execute_callbacks(check, result)
        
        logger.info(f"🎲 D20 Roll: {roll_value} vs DC {check.difficulty_class} = {result.name}")
        
        return d20_roll
    
    def _generate_roll_message(self, check: SkillCheck, roll: int, result: RollResult) -> str:
        """Generate appropriate message for roll result"""
        base_message = f"🎲 D20 Roll: {roll} vs DC {check.difficulty_class}"
        
        if result == RollResult.CRITICAL_SUCCESS:
            return f"{base_message} - CRITICAL SUCCESS! {check.critical_success_message}"
        elif result == RollResult.SUCCESS:
            return f"{base_message} - SUCCESS! {check.success_message}"
        elif result == RollResult.CRITICAL_FAILURE:
            return f"{base_message} - CRITICAL FAILURE! {check.critical_failure_message}"
        else:  # RollResult.FAILURE
            return f"{base_message} - FAILURE! {check.failure_message}"
    
    def _execute_callbacks(self, check: SkillCheck, result: RollResult) -> None:
        """Execute appropriate callbacks for roll result"""
        if result in [RollResult.SUCCESS, RollResult.CRITICAL_SUCCESS] and check.on_success:
            check.on_success()
        elif result in [RollResult.FAILURE, RollResult.CRITICAL_FAILURE] and check.on_failure:
            check.on_failure()
    
    def register_check(self, check_id: str, skill_check: SkillCheck) -> None:
        """Register a new skill check"""
        self.skill_checks[check_id] = skill_check
        logger.debug(f"Registered skill check: {check_id}")
    
    def get_check(self, check_id: str) -> Optional[SkillCheck]:
        """Get skill check by ID"""
        return self.skill_checks.get(check_id)
    
    def get_recent_rolls(self, count: int = 5) -> List[D20Roll]:
        """Get recent roll history"""
        return self.roll_history[-count:]
    
    def clear_history(self) -> None:
        """Clear roll history"""
        self.roll_history.clear()
        logger.debug("D20 roll history cleared")


class D20VisualFeedback:
    """Visual feedback system for D20 rolls"""
    
    def __init__(self, canvas: tk.Canvas, position: Tuple[int, int]):
        self.canvas = canvas
        self.position = position
        self.feedback_items: List[int] = []
        self.active_animations: Dict[str, float] = {}
        
        # Visual configuration
        self.success_color = "#00ff00"
        self.failure_color = "#ff0000"
        self.critical_color = "#ffd700"
        self.text_color = "#ffffff"
        self.bg_color = "#1a1a1a"
        
    def show_roll_result(self, roll: D20Roll) -> None:
        """Display visual feedback for D20 roll"""
        self._clear_previous_feedback()
        
        # Determine colors based on result
        if roll.result == RollResult.CRITICAL_SUCCESS:
            bg_color = self.critical_color
            text_color = "#000000"
            effect = "critical"
        elif roll.result == RollResult.SUCCESS:
            bg_color = self.success_color
            text_color = "#000000"
            effect = "success"
        elif roll.result == RollResult.CRITICAL_FAILURE:
            bg_color = self.critical_color
            text_color = "#000000"
            effect = "critical"
        else:  # RollResult.FAILURE
            bg_color = self.failure_color
            text_color = "#ffffff"
            effect = "failure"
        
        # Create feedback display
        self._create_feedback_display(roll, bg_color, text_color, effect)
    
    def _create_feedback_display(self, roll: D20Roll, bg_color: str, text_color: str, effect: str) -> None:
        """Create the visual feedback display"""
        x, y = self.position
        
        # Background box
        box_width = 300
        box_height = 120
        
        bg_box = self.canvas.create_rectangle(
            x - box_width//2, y - box_height//2,
            x + box_width//2, y + box_height//2,
            fill=bg_color,
            outline="#ffffff",
            width=2,
            tags="d20_feedback"
        )
        self.feedback_items.append(bg_box)
        
        # Roll value (large)
        roll_text = self.canvas.create_text(
            x, y - 30,
            text=f"D20: {roll.roll_value}",
            font=("Arial", 24, "bold"),
            fill=text_color,
            tags="d20_feedback"
        )
        self.feedback_items.append(roll_text)
        
        # Result text
        result_text = self.canvas.create_text(
            x, y,
            text=roll.result.name.replace("_", " ").title(),
            font=("Arial", 16, "bold"),
            fill=text_color,
            tags="d20_feedback"
        )
        self.feedback_items.append(result_text)
        
        # DC comparison
        dc_text = self.canvas.create_text(
            x, y + 25,
            text=f"vs DC {roll.difficulty_class}",
            font=("Arial", 12),
            fill=text_color,
            tags="d20_feedback"
        )
        self.feedback_items.append(dc_text)
        
        # Start animation
        if effect == "critical":
            self._animate_critical_success()
        elif effect == "success":
            self._animate_success()
        else:
            self._animate_failure()
        
        # Auto-hide after 3 seconds
        self.canvas.after(3000, self._clear_previous_feedback)
    
    def _animate_critical_success(self) -> None:
        """Animate critical success with sparkle effect"""
        # Add sparkle particles
        x, y = self.position
        for i in range(8):
            angle = (i * 45) * (3.14159 / 180)  # Convert to radians
            spark_x = x + 40 * math.cos(angle)
            spark_y = y + 40 * math.sin(angle)
            
            sparkle = self.canvas.create_oval(
                spark_x - 3, spark_y - 3,
                spark_x + 3, spark_y + 3,
                fill="#ffd700",
                outline="",
                tags="d20_feedback"
            )
            self.feedback_items.append(sparkle)
            
            # Animate sparkle
            self._animate_sparkle(sparkle, spark_x, spark_y, angle)
    
    def _animate_sparkle(self, sparkle_id: int, start_x: float, start_y: float, angle: float) -> None:
        """Animate individual sparkle particle"""
        def update_sparkle(step: int = 0):
            if step > 10:
                return
            
            # Move sparkle outward
            distance = 40 + (step * 5)
            new_x = start_x + (distance - 40) * math.cos(angle)
            new_y = start_y + (distance - 40) * math.sin(angle)
            
            # Update position
            self.canvas.coords(sparkle_id, new_x - 3, new_y - 3, new_x + 3, new_y + 3)
            
            # Fade out
            if step > 5:
                alpha = 1.0 - ((step - 5) / 5.0)
                # Tkinter doesn't support alpha, so we'll just delete at the end
                if step == 10:
                    self.canvas.delete(sparkle_id)
                    return
            
            # Continue animation
            self.canvas.after(50, lambda: update_sparkle(step + 1))
        
        update_sparkle()
    
    def _animate_success(self) -> None:
        """Animate success with gentle pulse"""
        # Simple pulse effect would go here
        pass
    
    def _animate_failure(self) -> None:
        """Animate failure with shake effect"""
        # Shake effect would go here
        pass
    
    def _clear_previous_feedback(self) -> None:
        """Clear previous feedback display"""
        self.canvas.delete("d20_feedback")
        self.feedback_items.clear()


# Factory functions
def create_d20_system() -> D20System:
    """Create D20 system with default checks"""
    return D20System()


def create_visual_feedback(canvas: tk.Canvas, position: Tuple[int, int]) -> D20VisualFeedback:
    """Create visual feedback system"""
    return D20VisualFeedback(canvas, position)


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    import math
    
    # Test D20 system
    root = tk.Tk()
    root.title("D20 System Test")
    root.geometry("600x400")
    root.configure(bg='#1a1a1a')
    
    canvas = tk.Canvas(root, width=600, height=300, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Create systems
    d20_system = create_d20_system()
    visual_feedback = create_visual_feedback(canvas, (300, 150))
    
    # Test buttons
    button_frame = tk.Frame(root, bg='#1a1a1a')
    button_frame.pack()
    
    def test_lockbox():
        roll = d20_system.perform_check("iron_lockbox")
        visual_feedback.show_roll_result(roll)
        print(roll.message)
    
    def test_stone():
        roll = d20_system.perform_check("ancient_stone")
        visual_feedback.show_roll_result(roll)
        print(roll.message)
    
    def test_random():
        checks = ["iron_lockbox", "ancient_stone", "barrier_inspection"]
        check_id = random.choice(checks)
        roll = d20_system.perform_check(check_id)
        visual_feedback.show_roll_result(roll)
        print(roll.message)
    
    tk.Button(button_frame, text="Test Lockbox (DC 15)", command=test_lockbox).pack(side=tk.LEFT, padx=5)
    tk.Button(button_frame, text="Test Stone (DC 12)", command=test_stone).pack(side=tk.LEFT, padx=5)
    tk.Button(button_frame, text="Test Random", command=test_random).pack(side=tk.LEFT, padx=5)
    
    print("🎲 D20 System Test - Click buttons to test skill checks")
    root.mainloop()
