"""
Semantic Intent Resolution Engine

Uses sentence embeddings to map natural language player input to structured intents.
Designed for laptop-friendly performance (<50ms on CPU) with instant boot support.
"""

from dataclasses import dataclass
from typing import Dict, Optional
from pathlib import Path

import numpy as np
from loguru import logger
from sentence_transformers import SentenceTransformer, util


@dataclass
class IntentMatch:
    """Result of intent resolution with confidence scoring."""
    
    intent_id: str
    description: str
    confidence: float
    reasoning: str = ""  # Added reasoning attribute for compatibility


class IntentLibrary:
    """
    Extensible repository of game intents with exemplar-based matching.
    
    Each intent has:
    - intent_id: Unique identifier (e.g., 'distract', 'force')
    - exemplars: List of concrete action examples for semantic matching
    
    Design: Multiple exemplars increase semantic hit-rate for small models
    by providing diverse action patterns within the same intent category.
    """
    
    def __init__(self):
        self._intents: Dict[str, list[str]] = {}
        self._embeddings: Optional[Dict[str, np.ndarray]] = None
        self._embeddings_stale = True
    
    def add_intent(self, intent_id: str, exemplars: list[str]) -> None:
        """
        Add or update an intent with action exemplars.
        
        Args:
            intent_id: Unique intent identifier
            exemplars: 3-5 concrete action examples (e.g., "Throw a beer", "Kick a table")
        """
        if not exemplars:
            raise ValueError(f"Intent '{intent_id}' must have at least one exemplar")
        
        self._intents[intent_id] = exemplars
        self._embeddings_stale = True
        logger.debug(f"Added intent: {intent_id} with {len(exemplars)} exemplars")
    
    def get_intents(self) -> Dict[str, list[str]]:
        """Return all registered intents with their exemplars."""
        return self._intents.copy()
    
    def mark_embeddings_computed(self, embeddings: Dict[str, np.ndarray]) -> None:
        """Cache precomputed embeddings (called by SemanticResolver)."""
        self._embeddings = embeddings
        self._embeddings_stale = False


class SemanticResolver:
    """
    Maps player input to intents using cosine similarity.
    
    Performance:
    - Model load: ~200ms (one-time) OR instant with pre-baked embeddings
    - Inference: <50ms per query on CPU
    """
    
    def __init__(
        self,
        intent_library: IntentLibrary,
        model_name: str = 'all-MiniLM-L6-v2',
        confidence_threshold: float = 0.5,
        embeddings_path: Optional[Path] = None
    ):
        """
        Initialize semantic resolver with instant boot support.
        
        Args:
            intent_library: Library of intents to match against
            model_name: SentenceTransformer model (default: MiniLM, 80MB)
            confidence_threshold: Minimum similarity score (0-1) to accept match
            embeddings_path: Path to pre-baked embeddings file
        """
        self.intent_library = intent_library
        self.confidence_threshold = confidence_threshold
        self.model_name = model_name
        self.embeddings_path = embeddings_path or Path("assets/intent_vectors.safetensors")
        
        # Try to load pre-baked embeddings for instant boot
        if self._load_prebaked_embeddings():
            logger.info("✅ Instant boot: Loaded pre-baked embeddings")
            self.model = None  # Don't load model unless needed
        else:
            logger.info(f"⚡ Loading embedding model: {model_name}")
            self.model = SentenceTransformer(model_name)
            self._update_intent_embeddings()
    
    def _load_prebaked_embeddings(self) -> bool:
        """
        Attempt to load memory-mapped embeddings for instant boot.
        
        Returns:
            True if embeddings were loaded successfully
        """
        # Try memory-mapped assets first (instant boot)
        mmap_path = self.embeddings_path.with_suffix('.mmap')
        if mmap_path.exists():
            return self._load_mmap_embeddings(mmap_path)
        
        # Fallback to regular pre-baked embeddings
        if not self.embeddings_path.exists():
            logger.debug(f"No pre-baked embeddings found at {self.embeddings_path}")
            return False
        
        try:
            # Load pre-baked embeddings
            from utils.baker import SemanticBaker
            baker = SemanticBaker(model_name=self.model_name)
            all_embeddings = baker.load_embeddings(self.embeddings_path)
            
            # Extract intent embeddings from the full embedding map
            intent_embeddings = {}
            intents = self.intent_library.get_intents()
            
            for intent_id in intents:
                # Collect all example embeddings for this intent
                example_keys = [k for k in all_embeddings.keys() if k.startswith(f"example_{intent_id}_")]
                if not example_keys:
                    logger.warning(f"No example embeddings found for intent: {intent_id}")
                    return False
                
                # Stack all example embeddings for this intent
                example_embeddings = []
                for key in sorted(example_keys):  # Sort for consistent ordering
                    example_embeddings.append(all_embeddings[key])
                
                intent_embeddings[intent_id] = np.stack(example_embeddings)
            
            # Cache the embeddings
            self.intent_library.mark_embeddings_computed(intent_embeddings)
            total_examples = sum(len(exemplars) for exemplars in intent_embeddings.values())
            logger.info(f"Loaded {len(intent_embeddings)} pre-baked intent embeddings ({total_examples} total examples)")
            return True
            
        except Exception as e:
            logger.warning(f"Failed to load pre-baked embeddings: {e}")
            return False
    
    def _load_mmap_embeddings(self, mmap_path: Path) -> bool:
        """
        Load memory-mapped embeddings for instant boot performance.
        
        Args:
            mmap_path: Path to memory-mapped asset file
            
        Returns:
            True if embeddings were loaded successfully
        """
        try:
            from utils.mmap_assets import MMapAssetLoader
            
            logger.info("⚡ Loading memory-mapped embeddings for instant boot...")
            loader = MMapAssetLoader(mmap_path)
            
            if not loader.is_loaded():
                logger.warning("Memory-mapped loader failed to initialize")
                return False
            
            # Extract intent embeddings from memory-mapped data
            intent_embeddings = {}
            intents = self.intent_library.get_intents()
            
            for intent_id in intents:
                # Collect all example embeddings for this intent
                example_keys = [k for k in loader.get_keys() if k.startswith(f"example_{intent_id}_")]
                if not example_keys:
                    logger.warning(f"No memory-mapped embeddings found for intent: {intent_id}")
                    return False
                
                # Load all example embeddings for this intent
                example_embeddings = []
                for key in sorted(example_keys):  # Sort for consistent ordering
                    vector = loader.get_vector(key)
                    if vector is not None:
                        example_embeddings.append(vector)
                    else:
                        logger.warning(f"Failed to load memory-mapped vector: {key}")
                        return False
                
                intent_embeddings[intent_id] = np.stack(example_embeddings)
            
            # Cache the embeddings
            self.intent_library.mark_embeddings_computed(intent_embeddings)
            total_examples = sum(len(exemplars) for exemplars in intent_embeddings.values())
            logger.info(f"✅ Instant boot: Loaded {len(intent_embeddings)} memory-mapped intent embeddings ({total_examples} total examples)")
            
            # Store loader for potential future use
            self._mmap_loader = loader
            return True
            
        except Exception as e:
            logger.warning(f"Failed to load memory-mapped embeddings: {e}")
            return False
    
    def _ensure_model_loaded(self):
        """Ensure the sentence transformer model is loaded (lazy loading)."""
        if self.model is None:
            logger.info(f"Loading embedding model on-demand: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
    
    def _update_intent_embeddings(self) -> None:
        """
        Compute and cache embeddings for all intent exemplars.
        
        For each intent, we compute embeddings for ALL exemplars, allowing
        max-similarity matching during resolution.
        """
        self._ensure_model_loaded()
        
        intents = self.intent_library.get_intents()
        
        if not intents:
            logger.warning("Intent library is empty!")
            return
        
        # Compute embeddings per-intent (each intent has multiple exemplars)
        embeddings_dict = {}
        total_exemplars = 0
        
        for intent_id, exemplars in intents.items():
            # Encode all exemplars for this intent
            exemplar_embeddings = self.model.encode(exemplars, convert_to_numpy=True)
            embeddings_dict[intent_id] = exemplar_embeddings
            total_exemplars += len(exemplars)
        
        self.intent_library.mark_embeddings_computed(embeddings_dict)
        logger.info(
            f"Precomputed embeddings for {len(intents)} intents "
            f"({total_exemplars} total exemplars)"
        )
    
    def resolve_intent(self, player_input: str) -> Optional[IntentMatch]:
        """
        Find the best matching intent using max-similarity across exemplars.
        
        Algorithm:
        1. Encode player input
        2. For each intent, compute similarity against ALL exemplars
        3. Take the MAX similarity score for that intent
        4. Select the intent with the highest max score
        5. Fallback to 'improvise' if confidence is too low
        
        Args:
            player_input: Natural language action (e.g., "I kick the table")
        
        Returns:
            IntentMatch if confidence exceeds threshold, otherwise None
        """
        if not player_input.strip():
            logger.warning("Empty input received")
            return None
        
        intents = self.intent_library.get_intents()
        
        if not intents:
            logger.error("Cannot resolve intent: library is empty")
            return None
        
        # Get cached embeddings (or recompute if stale)
        if self.intent_library._embeddings_stale:
            self._update_intent_embeddings()
        
        # Encode player input once
        self._ensure_model_loaded()
        input_embedding = self.model.encode(player_input, convert_to_numpy=True)
        
        # Find best intent via max-similarity matching
        best_intent_id = None
        best_score = 0.0
        best_exemplar = ""
        
        for intent_id, exemplar_embeddings in self.intent_library._embeddings.items():
            # Compute similarity against all exemplars for this intent
            scores = util.cos_sim(input_embedding, exemplar_embeddings)[0]
            
            # Convert torch tensor to numpy for compatibility
            if hasattr(scores, 'numpy'):
                scores_np = scores.cpu().numpy()
            else:
                scores_np = np.array(scores)
            
            # Take the MAX score (closest exemplar match)
            max_score = float(np.max(scores_np))
            max_idx = int(np.argmax(scores_np))
            
            # Track the best intent across all intents
            if max_score > best_score:
                best_score = max_score
                best_intent_id = intent_id
                best_exemplar = intents[intent_id][max_idx]
        
        if best_intent_id is None:
            logger.error("No intent matched (should not happen)")
            return None
        
        logger.info(
            f"Intent resolution: '{player_input}' → {best_intent_id} "
            f"(confidence: {best_score:.3f}, matched exemplar: '{best_exemplar}')"
        )
        
        # Reject low-confidence matches
        if best_score < self.confidence_threshold:
            logger.warning(
                f"Confidence {best_score:.3f} below threshold "
                f"{self.confidence_threshold}"
            )
            return None
        
        return IntentMatch(
            intent_id=best_intent_id,
            description=best_exemplar,  # Return the matched exemplar
            confidence=best_score,
            reasoning=f"Matched exemplar: '{best_exemplar}' with confidence {best_score:.3f}"
        )
    
    def add_intent(self, intent_id: str, exemplars: list[str]) -> None:
        """Convenience method to add intent and invalidate cache."""
        self.intent_library.add_intent(intent_id, exemplars)


def create_default_intent_library() -> IntentLibrary:
    """
    Create an intent library with action-focused exemplars.
    
    Design Philosophy:
    - 3-5 exemplars per intent to maximize semantic coverage
    - Use DISTINCT action verbs to prevent semantic bleed
    - Concrete scenarios with specific objects (beer, table, guard, door)
    - Separate vector neighborhoods (stealth ≠ protection, noise ≠ violence)
    """
    library = IntentLibrary()
    
    # ============================================================
    # DISTRACT: Environmental chaos and loud diversions
    # ============================================================
    library.add_intent(
        "distract",
        [
            "Throw a beer mug at someone to create a distraction",
            "Kick over a table to cause a loud commotion",
            "Smash a bottle on the floor to draw attention",
            "Shout something to divert the guard's gaze",
            "Start a fake argument with another patron"
        ]
    )
    
    # ============================================================
    # FORCE: Direct violence and physical destruction
    # ============================================================
    library.add_intent(
        "force",
        [
            "Attack the guard with a sword or weapon",
            "Punch someone in the face aggressively",
            "Kick down a door with brute strength",
            "Tackle an enemy to knock them down",
            "Smash through a barrier with force"
        ]
    )
    
    # ============================================================
    # FINESSE: Stealth, silence, and going unnoticed
    # (CRITICAL: Separated from 'defend' - no safety/protection language)
    # ============================================================
    library.add_intent(
        "finesse",
        [
            "Sneak past the guard without making a sound",
            "Tiptoe through the shadows to avoid detection",
            "Pick the lock on a door quietly",
            "Pickpocket coins from someone's belt",
            "Hide behind a barrel and slip by unnoticed"
        ]
    )
    
    # ============================================================
    # CHARM: Social manipulation and persuasion
    # (Added question phrasing to catch "Can I convince...")
    # ============================================================
    library.add_intent(
        "charm",
        [
            "Convince the guard to let me pass with words",
            "Can I persuade someone to help me out",
            "Offer a bribe of gold coins to gain cooperation",
            "Flatter the bartender to get free information",
            "Negotiate a deal by talking smoothly"
        ]
    )
    
    # ============================================================
    # INTIMIDATE: Threats, fear, and coercion
    # (Added "intimidate" as explicit action verb)
    # ============================================================
    library.add_intent(
        "intimidate",
        [
            "Intimidate the bartender with a menacing glare",
            "Threaten someone by showing my weapon",
            "Loom over them to scare them into compliance",
            "Use harsh threatening words to coerce",
            "Growl menacingly to make them afraid"
        ]
    )
    
    # ============================================================
    # DECEIVE: Lies, tricks, and misdirection
    # ============================================================
    library.add_intent(
        "deceive",
        [
            "Lie about my identity to fool the guard",
            "Bluff my way through the checkpoint",
            "Invent a false story to mislead them",
            "Pretend to be someone I'm not",
            "Trick them with a clever deception"
        ]
    )
    
    # ============================================================
    # INVESTIGATE: Searching and examination
    # ============================================================
    library.add_intent(
        "investigate",
        [
            "Search the room carefully for hidden clues",
            "Examine the suspicious object closely",
            "Inspect the area for secret passages",
            "Study the ancient text for information",
            "Look around for anything unusual"
        ]
    )
    
    # ============================================================
    # USE_ITEM: Inventory and equipment usage
    # ============================================================
    library.add_intent(
        "use_item",
        [
            "Drink a health potion to restore HP",
            "Use the lockpick tool from my inventory",
            "Equip my sword and shield for combat",
            "Consume the magical elixir",
            "Apply healing salve to my wounds"
        ]
    )
    
    # ============================================================
    # DEFEND: Active blocking and combat defense
    # (CRITICAL: Changed from safety/protection to ACTIVE combat blocking)
    # (Removed "Take cover" to separate from stealth)
    # ============================================================
    library.add_intent(
        "defend",
        [
            "Raise my shield to block the incoming attack",
            "Parry the enemy's sword strike with my blade",
            "Dodge to the side to avoid the blow",
            "Brace myself and prepare to deflect damage",
            "Counter-block the attack with my weapon"
        ]
    )
    
    # ============================================================
    # LEAVE_AREA: Transitioning between locations
    # ============================================================
    library.add_intent(
        "leave_area",
        [
            "Leave this place",
            "Exit the area",
            "Walk out of the room",
            "Go to the next location",
            "Head out"
        ]
    )
    
    # ============================================================
    # IMPROVISE: Fallback for creative/unusual actions
    # ============================================================
    library.add_intent(
        "improvise",
        [
            "Try something creative and unconventional",
            "Attempt an unusual wild action",
            "Do something unexpected with the environment",
            "Use objects around me in a creative way",
            "Take an unorthodox approach to the problem"
        ]
    )
    
    return library
