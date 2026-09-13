"""
Reality audit - maps actual implementation to plans
"""

DEMO_REALITY = {
    "racing": {
        "status": "✅ Complete and playable",
        "files": 45,
        "key_files": [
            "src/apps/racing_demo/racing_scene.py",
            "src/apps/racing_demo/racing_session.py",
            "src/shared/physics/kinematics.py"
        ],
        "systems_used": ["physics", "ecs", "rendering"],
        "features": [
            "Creature physics-based movement",
            "Track rendering",
            "Career progression"
        ],
        "missing_tasks": [
            "Create racing_session.py tests",
            "Document physics integration"
        ]
    },
    
    "dungeon": {
        "status": "🔄 Playable but incomplete",
        "files": 25,
        "key_files": [
            "src/apps/dungeon_crawler/dungeon_scene.py",
            "src/apps/dungeon_crawler/dungeon_session.py",
        ],
        "systems_used": ["ecs", "genetics", "pathfinding", "rendering"],
        "features": [
            "Grid-based exploration",
            "Combat with creatures",
            "Loot system"
        ],
        "missing_tasks": [
            "Improve AI pathfinding",
            "Balance creature difficulty"
        ]
    },
    
    "breeding": {
        "status": "✅ Complete",
        "files": 13,
        "key_files": [
            "src/shared/genetics/genome.py",
            "src/apps/slime_breeder/breeder_ui.py"
        ],
        "systems_used": ["genetics", "ui", "persistence"],
        "features": [
            "Genetic inheritance system",
            "Creature breeding UI",
            "Trait visualization"
        ],
        "missing_tasks": []
    },
    
    "tower_defense": {
        "status": "🔄 Planning phase",
        "files": 5,
        "key_files": [
            "src/apps/tower_defense/tower_defense_scene.py",
            "src/apps/tower_defense/tower_defense_session.py"
        ],
        "systems_used": ["ecs", "rendering", "genetics"],
        "features": [
            "Grid-based tower placement",
            "Wave spawning (basic)"
        ],
        "missing_tasks": [
            "Complete ECS rendering system",
            "Implement tower genetics",
            "Create wave system",
            "Balance economy"
        ]
    },
    
    "slime_breeder": {
        "status": "🔄 In progress",
        "files": 6,
        "key_files": [
            "src/apps/slime_breeder/slime_breeder_scene.py",
            "src/apps/slime_breeder/slime_breeder_ui.py"
        ],
        "systems_used": ["ui", "rendering", "persistence", "genetics"],
        "features": [
            "Hub for all games",
            "Creature roster management",
            "Scene navigation"
        ],
        "missing_tasks": [
            "Integrate all demos",
            "Cross-demo creature sharing"
        ]
    }
}

SYSTEM_REALITY = {
    "ecs": {
        "status": "✅ Production ready",
        "coverage": "96%",
        "files": 142,
        "components": [
            "KinematicsComponent",
            "BehaviorComponent",
            "GridPositionComponent",
            "TowerComponent",
            "WaveComponent"
        ],
        "systems": [
            "KinematicsSystem",
            "BehaviorSystem",
            "TowerDefenseBehaviorSystem"
        ],
        "missing": [
            "RenderComponent (needed for Phase 3)",
            "AnimationComponent (needed for Phase 3)"
        ]
    },
    
    "genetics": {
        "status": "✅ Complete",
        "coverage": "87%",
        "files": 16,
        "key_classes": [
            "Creature",
            "Genome",
            "GenomeFactory"
        ],
        "features": [
            "Genetic inheritance",
            "Trait mutations",
            "Visual phenotypes"
        ],
        "missing": [
            "Tower appearance from genetics",
            "Genetic AI traits"
        ]
    },
    
    "rendering": {
        "status": "🔄 Partial",
        "coverage": "83%",
        "files": 22,
        "key_classes": [
            "SlimeRenderer",
            "PyGameRenderer",
            "SpriteLoader"
        ],
        "features": [
            "Pixel-gen slime rendering",
            "Sprite loading",
            "Layer compositing"
        ],
        "missing": [
            "ECS RenderComponent",
            "ECS RenderingSystem",
            "Enemy sprite rendering"
        ]
    }
}

# Gaps identified between plans and reality
PLANNED_BUT_MISSING = [
    ("M_BROWSER", "Browser deployment", "Missing: Web hosting setup"),
    ("M_LOOP", "Core loop integration", "Partial: Only dungeon integration done"),
    ("M_V3", "Living world with faction", "Missing: Entire faction system")
]

IMPLEMENTED_BUT_UNPLANNED = [
    ("racing_demo", "Racing physics + career", "No tasks document this"),
    ("slime_clan", "Territorial grid system", "Experimental, not in phase plan"),
    ("space demos", "Various space games", "Exploratory, should be archived")
]

PARTIAL_IMPLEMENTATIONS = [
    ("Tower Defense", "Basic grid + scene", "Missing: Genetics, waves, economy"),
    ("Rendering", "Slimes + sprites", "Missing: ECS integration"),
    ("Slime Breeder", "UI + roster", "Missing: Cross-demo integration")
]
