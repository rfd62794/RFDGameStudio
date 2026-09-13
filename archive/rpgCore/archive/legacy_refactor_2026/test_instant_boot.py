#!/usr/bin/env python3
"""
Test script to verify instant boot with pre-baked embeddings.
"""

import time
from pathlib import Path
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from semantic_engine import create_default_intent_library, SemanticResolver


def test_boot_performance():
    """Test boot performance with and without pre-baked embeddings."""
    print("🚀 Testing SemanticResolver boot performance...")
    
    # Test with pre-baked embeddings
    print("\n=== Test 1: With Pre-Baked Embeddings ===")
    start_time = time.time()
    
    intent_library = create_default_intent_library()
    resolver = SemanticResolver(
        intent_library,
        embeddings_path=Path("assets/intent_vectors.safetensors")
    )
    
    boot_time_with_embeddings = time.time() - start_time
    print(f"⚡ Boot time with embeddings: {boot_time_with_embeddings:.3f} seconds")
    
    # Test resolution
    start_time = time.time()
    result = resolver.resolve_intent("I want to search the room carefully")
    resolution_time = time.time() - start_time
    print(f"🎯 Resolution time: {resolution_time:.3f} seconds")
    print(f"📝 Result: {result.intent_id if result else 'None'}")
    
    # Test without pre-baked embeddings (rename file temporarily)
    embeddings_file = Path("assets/intent_vectors.safetensors")
    backup_file = Path("assets/intent_vectors.safetensors.backup")
    
    if embeddings_file.exists():
        embeddings_file.rename(backup_file)
        print("\n=== Test 2: Without Pre-Baked Embeddings ===")
        
        start_time = time.time()
        
        resolver_no_cache = SemanticResolver(intent_library)
        
        boot_time_without_embeddings = time.time() - start_time
        print(f"🐌 Boot time without embeddings: {boot_time_without_embeddings:.3f} seconds")
        
        # Test resolution
        start_time = time.time()
        result = resolver_no_cache.resolve_intent("I want to search the room carefully")
        resolution_time = time.time() - start_time
        print(f"🎯 Resolution time: {resolution_time:.3f} seconds")
        print(f"📝 Result: {result.intent_id if result else 'None'}")
        
        # Restore file
        backup_file.rename(embeddings_file)
        
        # Calculate improvement
        improvement = ((boot_time_without_embeddings - boot_time_with_embeddings) / boot_time_without_embeddings) * 100
        print(f"\n📊 Performance Improvement: {improvement:.1f}% faster boot")
        
        if boot_time_with_embeddings < 0.5:
            print("✅ INSTANT BOOT ACHIEVED!")
        else:
            print("⚠️  Boot still slow, check embeddings loading")
    else:
        print("❌ No embeddings file found to test comparison")


if __name__ == "__main__":
    test_boot_performance()
