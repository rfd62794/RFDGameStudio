"""
Semantic Baker: Pre-compute Intent Embeddings

Enterprise-grade tooling for instant game boot.
Pre-calculates and caches semantic embeddings to eliminate 4-second lag.

Usage:
    python -m src.utils.bake_embeddings [--output embeddings.safetensors]

ROI: Boot time goes from "Warming up..." to "Instant."
"""

import argparse
import pickle
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import sys
import os

from loguru import logger
from sentence_transformers import SentenceTransformer

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from semantic_engine import create_default_intent_library, IntentLibrary


class SemanticBaker:
    """
    Pre-computes semantic embeddings for instant game boot.
    
    This is your "Compiler" for narrative logic - converts text intents
    into mathematical vectors that can be loaded instantly.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize the baker with sentence transformer model."""
        self.model_name = model_name
        self.model = None
        logger.info(f"Semantic Baker initialized with model: {model_name}")
    
    def _load_model(self):
        """Lazy load the sentence transformer model."""
        if self.model is None:
            logger.info(f"Loading sentence transformer: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
    
    def bake_embeddings(
        self, 
        intent_library: IntentLibrary,
        output_path: Path,
        format: str = "safetensors"
    ) -> Dict[str, np.ndarray]:
        """
        Pre-compute embeddings for all intents and standard actions.
        
        Args:
            intent_library: Library of intents to bake
            output_path: Output file path
            format: Output format ("safetensors" or "pickle")
            
        Returns:
            Dictionary mapping intent names to embedding vectors
        """
        self._load_model()
        
        # Collect all texts to embed
        texts_to_embed = []
        embedding_keys = []
        
        # Add intent definitions
        for intent_name, exemplars in intent_library.get_intents().items():
            # Embed each exemplar for this intent
            for i, example in enumerate(exemplars):
                texts_to_embed.append(example)
                embedding_keys.append(f"example_{intent_name}_{i}")
        
        # Add standard actions
        try:
            from semantic_engine import STANDARD_ACTIONS
            for action_category, actions in STANDARD_ACTIONS.items():
                for action_text in actions:
                    texts_to_embed.append(action_text)
                    embedding_keys.append(f"action_{action_category}_{len([k for k in embedding_keys if k.startswith(f'action_{action_category}')])}")
        except ImportError:
            logger.warning("STANDARD_ACTIONS not available, skipping")
        
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
        self._save_embeddings(embedding_map, output_path, format)
        
        logger.info(f"Successfully baked {len(embedding_map)} embeddings to {output_path}")
        return embedding_map
    
    def _save_embeddings(
        self, 
        embeddings: Dict[str, np.ndarray], 
        output_path: Path, 
        format: str
    ):
        """Save embeddings to file in specified format."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if format == "safetensors":
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
                    logger.warning("safetensors or torch not available, falling back to pickle")
                    format = "pickle"
            except Exception as e:
                logger.warning(f"safetensors save failed: {e}, falling back to pickle")
                format = "pickle"
        
        if format == "pickle":
            with open(output_path, 'wb') as f:
                pickle.dump(embeddings, f, protocol=pickle.HIGHEST_PROTOCOL)
            logger.info(f"Saved embeddings in pickle format")
    
    @staticmethod
    def load_embeddings(embedding_path: Path) -> Dict[str, np.ndarray]:
        """
        Load pre-baked embeddings from file.
        
        Args:
            embedding_path: Path to embeddings file
            
        Returns:
            Dictionary mapping keys to embedding vectors
        """
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
    
    def verify_embeddings(self, embedding_path: Path) -> bool:
        """
        Verify that embeddings are complete and valid.
        
        Args:
            embedding_path: Path to embeddings file
            
        Returns:
            True if embeddings are valid
        """
        try:
            embeddings = self.load_embeddings(embedding_path)
            
            # Check basic structure
            if not embeddings:
                logger.error("No embeddings found in file")
                return False
            
            # Check embedding dimensions
            sample_embedding = next(iter(embeddings.values()))
            expected_dim = 384  # MiniLM-L6-v2 dimension
            if sample_embedding.shape[0] != expected_dim:
                logger.error(f"Unexpected embedding dimension: {sample_embedding.shape[0]} (expected {expected_dim})")
                return False
            
            # Check for required keys
            intent_library = create_default_intent_library()
            required_intents = list(intent_library.get_intents().keys())
            
            for intent in required_intents:
                # Check for at least one example embedding
                example_keys = [k for k in embeddings.keys() if k.startswith(f"example_{intent}_")]
                if not example_keys:
                    logger.error(f"Missing example embeddings for intent: {intent}")
                    return False
            
            logger.info(f"Verified {len(embeddings)} embeddings - all valid")
            return True
            
        except Exception as e:
            logger.error(f"Embedding verification failed: {e}")
            return False


def main():
    """CLI entry point for baking embeddings."""
    parser = argparse.ArgumentParser(description="Bake semantic embeddings for instant boot")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/embeddings.safetensors"),
        help="Output path for embeddings file"
    )
    parser.add_argument(
        "--format",
        choices=["safetensors", "pickle"],
        default="safetensors",
        help="Output format for embeddings"
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify existing embeddings instead of baking new ones"
    )
    parser.add_argument(
        "--model",
        default="all-MiniLM-L6-v2",
        help="Sentence transformer model to use"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    baker = SemanticBaker(model_name=args.model)
    
    if args.verify:
        # Verify existing embeddings
        if baker.verify_embeddings(args.output):
            print("✅ Embeddings are valid and complete")
        else:
            print("❌ Embeddings verification failed")
            return 1
    else:
        # Bake new embeddings
        intent_library = create_default_intent_library()
        embeddings = baker.bake_embeddings(intent_library, args.output, args.format)
        
        # Verify after baking
        if baker.verify_embeddings(args.output):
            print("✅ Embeddings baked and verified successfully")
        else:
            print("❌ Embedding verification failed after baking")
            return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
