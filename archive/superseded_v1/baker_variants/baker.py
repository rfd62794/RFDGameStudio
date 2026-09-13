"""
Semantic Baker: Pre-calculate Intent Embeddings

Enterprise utility for instant game boot.
Pre-calculates and caches semantic embeddings to eliminate 4-second lag.

Usage:
    python -m src.utils.baker

ROI: Boot time goes from "Warming up..." to "Instant."
"""

import sys
import os
from pathlib import Path
import pickle
import numpy as np
from typing import Dict, List

from loguru import logger
from sentence_transformers import SentenceTransformer

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from semantic_engine import create_default_intent_library


class SemanticBaker:
    """
    Pre-computes semantic embeddings for instant game boot.
    
    This is your "Compiler" for narrative logic - converts text intents
    into mathematical vectors that can be loaded instantly.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize the baker (model loaded only when baking)."""
        self.model_name = model_name
        self.model = None  # Lazy load only when baking
        logger.info(f"Semantic Baker initialized with model: {model_name}")
    
    def _ensure_model_loaded(self):
        """Ensure the sentence transformer model is loaded."""
        if self.model is None:
            self.model = SentenceTransformer(self.model_name)
    
    def bake_embeddings(self, output_path: Path) -> Dict[str, np.ndarray]:
        """
        Pre-compute embeddings for all intents and standard actions.
        
        Args:
            output_path: Output file path for embeddings
            
        Returns:
            Dictionary mapping intent names to embedding vectors
        """
        # Load model only when baking
        self._ensure_model_loaded()
        
        # Load intent library
        intent_library = create_default_intent_library()
        
        # Collect all texts to embed
        texts_to_embed = []
        embedding_keys = []
        
        # Add intent exemplars
        for intent_name, exemplars in intent_library.get_intents().items():
            for i, example in enumerate(exemplars):
                texts_to_embed.append(example)
                embedding_keys.append(f"example_{intent_name}_{i}")
        
        logger.info(f"Baking {len(texts_to_embed)} embeddings...")
        
        # Batch compute embeddings
        embeddings = self.model.encode(
            texts_to_embed,
            batch_size=32,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        # Create mapping dictionary
        embedding_map = dict(zip(embedding_keys, embeddings))
        
        # Save to file
        self._save_embeddings(embedding_map, output_path)
        
        logger.info(f"Successfully baked {len(embedding_map)} embeddings to {output_path}")
        return embedding_map
    
    def _save_embeddings(self, embeddings: Dict[str, np.ndarray], output_path: Path):
        """Save embeddings to file."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Try safetensors first, fallback to pickle
        try:
            try:
                import torch
                import safetensors.torch
                # Convert to torch tensors for safetensors
                torch_embeddings = {
                    key: torch.from_numpy(embedding) 
                    for key, embedding in embeddings.items()
                }
                safetensors.torch.save_file(torch_embeddings, str(output_path))
                logger.info(f"Saved embeddings in safetensors format")
            except ImportError:
                logger.warning("safetensors not available, falling back to pickle")
                raise
        except Exception as e:
            logger.warning(f"safetensors save failed: {e}, falling back to pickle")
            with open(output_path, 'wb') as f:
                pickle.dump(embeddings, f, protocol=pickle.HIGHEST_PROTOCOL)
            logger.info(f"Saved embeddings in pickle format")
    
    @staticmethod
    def load_embeddings(embedding_path: Path) -> Dict[str, np.ndarray]:
        """Load pre-baked embeddings from file."""
        if not embedding_path.exists():
            raise FileNotFoundError(f"Embeddings file not found: {embedding_path}")
        
        if embedding_path.suffix == ".safetensors":
            try:
                import safetensors.torch
                import torch
                torch_embeddings = safetensors.torch.load_file(str(embedding_path))
                # Convert back to numpy
                return {k: v.numpy() for k, v in torch_embeddings.items()}
            except ImportError:
                logger.error("safetensors not available for loading")
                raise
        
        # Default to pickle
        with open(embedding_path, 'rb') as f:
            return pickle.load(f)


def main():
    """CLI entry point for baking embeddings."""
    output_path = Path("assets/intent_vectors.safetensors")
    
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    # Bake embeddings
    baker = SemanticBaker()
    embeddings = baker.bake_embeddings(output_path)
    
    print(f"✅ Successfully baked {len(embeddings)} embeddings")
    print(f"📍 Saved to: {output_path}")
    print(f"⚡ Game will now boot instantly!")


if __name__ == "__main__":
    main()
