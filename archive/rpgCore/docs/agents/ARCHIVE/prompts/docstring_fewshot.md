EXAMPLE:
Input symbol:
  def resolve_attack(self, attacker, defender, action):
      roll = self.d20.roll()
      return CombatResult(roll=roll, hit=roll > defender.armor)

Output:
{
  "symbol_name": "resolve_attack",
  "file_path": "src/shared/combat/d20_resolver.py",
  "line_number": 24,
  "docstring": "Resolve a single attack action using d20 rules.\\n\\nArgs:\\n    attacker: The unit making the attack.\\n    defender: The unit receiving the attack.\\n    action: The combat action being performed.\\n\\nReturns:\\n    CombatResult with roll value and hit determination.",
  "confidence": "high",
  "reasoning": "Clear input/output contract from source code."
}
DO NOT copy these example values.
