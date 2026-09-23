"""
Culture Amplification Table - Single Source of Truth

Defines XP amplification rates for each culture across all six stats.
This is the authoritative reference for all stat calculations.
"""

CULTURE_AMP_TABLE = {
    'ember': {
        'vit': 1.0,  'pwr': 1.25, 'agi': 1.1,
        'mnd': 0.9,  'res': 0.9,  'chm': 1.0,
    },
    'gale': {
        'vit': 0.9,  'pwr': 0.9,  'agi': 1.25,
        'mnd': 1.1, 'res': 1.0, 'chm': 1.0,
    },
    'marsh': {
        'vit': 1.25, 'pwr': 1.0, 'agi': 1.0,
        'mnd': 0.9, 'res': 1.0, 'chm': 1.1,
    },
    'crystal': {
        'vit': 1.0,  'pwr': 0.9, 'agi': 0.9,
        'mnd': 1.25, 'res': 1.1, 'chm': 0.8,
    },
    'tundra': {
        'vit': 1.1, 'pwr': 0.9, 'agi': 0.9,
        'mnd': 1.0, 'res': 1.25, 'chm': 0.9,
    },
    'tide': {
        'vit': 1.0, 'pwr': 1.1, 'agi': 1.0,
        'mnd': 1.0, 'res': 0.9, 'chm': 1.25,
    },
    'void': {
        'vit': 1.0, 'pwr': 1.0, 'agi': 1.0,
        'mnd': 1.0, 'res': 1.0, 'chm': 1.0,
    },
}
