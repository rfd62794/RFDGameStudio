"""
SlimeEntityTemplate - Canonical factory for slime creation.

Provides validation, completeness checks, and standardized
creation of RosterSlime objects. All new slime creation
should go through this template to ensure consistency.
"""

import uuid
from typing import Optional, List

from src.shared.teams.roster import RosterSlime
from src.shared.genetics.genome import SlimeGenome


class SlimeEntityTemplate:
    """
    Canonical factory for all slime creation.
    Applies template, validates completeness,
    returns fully-formed RosterSlime.
    All new slime creation goes through here.
    """

    # Required genome fields — no defaults
    REQUIRED_GENOME_FIELDS: List[str] = [
        'shape', 'size', 'base_color',
        'pattern', 'pattern_color', 'accessory',
        'curiosity', 'energy', 'affection', 'shyness'
    ]

    # Required RosterSlime fields
    REQUIRED_SLIME_FIELDS: List[str] = [
        'slime_id', 'name', 'genome'
    ]

    @classmethod
    def build(
        cls,
        genome: SlimeGenome,
        name: str,
        slime_id: Optional[str] = None,
        team: str = 'unassigned',
        level: int = 1,
        generation: int = 1,
    ) -> RosterSlime:
        """
        Canonical factory. Validates genome,
        generates UUID if not provided,
        returns fully-formed RosterSlime.

        Raises ValueError if genome is invalid.
        Never returns a partial slime.
        """
        if slime_id is None:
            slime_id = str(uuid.uuid4())

        errors = cls.validate_genome(genome)
        if errors:
            raise ValueError(
                f"Invalid genome for '{name}': "
                f"{', '.join(errors)}"
            )

        # Ensure culture_expression is populated
        # (same alias logic as Roster._migrate_genome)
        cls._ensure_culture_expression(genome)

        return RosterSlime(
            slime_id=slime_id,
            name=name,
            genome=genome,
            team=team,
            level=level,
            generation=generation,
        )

    @classmethod
    def validate(cls, slime: RosterSlime) -> List[str]:
        """
        Returns list of validation errors.
        Empty list = valid.
        Called by RosterSyncService.add_slime()
        before accepting a slime.
        """
        errors = []

        # Check required slime fields
        for field in cls.REQUIRED_SLIME_FIELDS:
            if not getattr(slime, field, None):
                errors.append(f"Missing: {field}")

        # Check genome if present
        if slime.genome:
            errors.extend(
                cls.validate_genome(slime.genome))

        return errors

    @classmethod
    def validate_genome(cls, genome: SlimeGenome) -> List[str]:
        """
        Validate genome completeness.
        Returns list of error strings.
        """
        errors = []
        for field in cls.REQUIRED_GENOME_FIELDS:
            val = getattr(genome, field, None)
            if val is None:
                errors.append(
                    f"genome.{field} is None")
            elif isinstance(val, str) and not val:
                errors.append(
                    f"genome.{field} is empty string")
        return errors

    @classmethod
    def _ensure_culture_expression(cls, genome: SlimeGenome) -> None:
        """
        Mutates genome in-place if
        culture_expression is empty.
        Same alias logic as
        Roster._migrate_genome().
        Single source of truth for this logic.
        """
        # If already populated, skip
        if genome.culture_expression:
            return

        # Delegate to Roster migration logic
        # to avoid duplication
        from src.shared.teams.roster import Roster
        data = {'cultural_base': genome.cultural_base,
                'culture_expression': {}}
        migrated = Roster._migrate_genome(data)
        genome.culture_expression = (
            migrated['culture_expression'])
