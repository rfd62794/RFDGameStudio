from src.shared.combat.stance import StanceController, CombatStance

def test_stance_controller_evaluate_thresholds():
    controller = StanceController()
    
    # Tactical evaluations
    assert controller.evaluate(hp=10, max_hp=10, tier="tactical") == CombatStance.AGGRESSIVE
    assert controller.evaluate(hp=6, max_hp=10, tier="tactical") == CombatStance.AGGRESSIVE
    assert controller.evaluate(hp=5, max_hp=10, tier="tactical") == CombatStance.DEFENSIVE
    assert controller.evaluate(hp=1, max_hp=10, tier="tactical") == CombatStance.DEFENSIVE
    
    # Mindless evaluations
    assert controller.evaluate(hp=10, max_hp=10, tier="mindless") == CombatStance.AGGRESSIVE
    assert controller.evaluate(hp=3, max_hp=10, tier="mindless") == CombatStance.AGGRESSIVE
    assert controller.evaluate(hp=2, max_hp=10, tier="mindless") == CombatStance.FLEEING

def test_stance_effective_stat_calculation():
    controller = StanceController()
    
    # Starts AGGRESSIVE (attack x1.2, defense x1.0, speed x1.0)
    assert controller.effective_stat(10, "attack") == 12
    assert controller.effective_stat(10, "defense") == 10
    assert controller.effective_stat(10, "speed") == 10
    
    # Transition to DEFENSIVE (attack x0.8, defense x1.5, speed x0.8)
    controller.transition(CombatStance.DEFENSIVE)
    assert controller.effective_stat(10, "attack") == 8
    assert controller.effective_stat(10, "defense") == 15
    assert controller.effective_stat(10, "speed") == 8

    # Transition to FLEEING (attack x0.5, defense x0.7, speed x1.4)
    controller.transition(CombatStance.FLEEING)
    assert controller.effective_stat(10, "attack") == 5
    assert controller.effective_stat(10, "defense") == 7
    assert controller.effective_stat(10, "speed") == 14

def test_stance_transition_returns_true_on_change():
    controller = StanceController()
    
    # Stays same -> False
    assert controller.transition(CombatStance.AGGRESSIVE) is False
    
    # Changes -> True
    assert controller.transition(CombatStance.DEFENSIVE) is True
    
    # Changes -> True
    assert controller.transition(CombatStance.FLEEING) is True
