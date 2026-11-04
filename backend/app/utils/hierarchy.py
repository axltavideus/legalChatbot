"""Regulation type hierarchy for conflict detection (Phase 5)."""
from app.models.regulation import RegulationType

HIERARCHY: dict[RegulationType, int] = {
    RegulationType.UUD: 1,
    RegulationType.UU: 2,
    RegulationType.PP: 3,
    RegulationType.Perpres: 4,
    RegulationType.Permen: 5,
    RegulationType.Perda: 6,
}


def get_level(reg_type: RegulationType) -> int:
    """Lower number = higher authority."""
    return HIERARCHY.get(reg_type, 99)


def higher_authority(type_a: RegulationType, type_b: RegulationType) -> RegulationType:
    """Return whichever type has higher legal authority."""
    return type_a if get_level(type_a) <= get_level(type_b) else type_b

