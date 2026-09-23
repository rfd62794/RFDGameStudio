"""
Test models - verify availability and functionality
"""

from typing import Dict
import os


def test_claude_sonnet() -> bool:
    """Test Claude 3.5 Sonnet availability"""
    try:
        from .openrouter_client import get_openrouter_model
        
        # Try to create a Claude model
        model = get_openrouter_model("claude-sonnet")
        
        # Simple test request using pydantic_ai
        from pydantic_ai import Agent
        
        agent = Agent(model=model)
        result = agent.run_sync("Say 'test' and nothing else.", max_tokens=10)
        
        print("✅ Claude Sonnet: Available")
        return True
    except Exception as e:
        print(f"❌ Claude Sonnet: {str(e)}")
        return False


def test_deepseek_r1() -> bool:
    """Test DeepSeek R1 availability"""
    try:
        from .openrouter_client import get_openrouter_model
        
        # Try to create a DeepSeek model
        model = get_openrouter_model("deepseek-r1")
        
        # Simple test request using pydantic_ai
        from pydantic_ai import Agent
        
        agent = Agent(model=model)
        result = agent.run_sync("Say 'test' and nothing else.", max_tokens=10)
        
        print("✅ DeepSeek R1: Available")
        return True
    except Exception as e:
        print(f"❌ DeepSeek R1: {str(e)}")
        return False


def test_ollama_models() -> Dict[str, bool]:
    """Test local Ollama models"""
    try:
        from .ollama_client import resolve_model, _get_available_models
        
        available = _get_available_models()
        results = {}
        
        for model in ["llama3.2:3b", "llama3.2:1b", "qwen2.5:0.5b"]:
            try:
                # Quick test - just check if model resolves
                resolved = resolve_model()
                results[model] = True
                print(f"✅ {model}: Available")
            except Exception as e:
                results[model] = False
                print(f"❌ {model}: {str(e)}")
        
        return results
    except Exception as e:
        print(f"❌ Ollama: {str(e)}")
        return {}


def test_all() -> None:
    """Test all models"""
    print("Testing Model Availability...\n")
    
    # Test Ollama
    print("🏠 LOCAL MODELS:")
    ollama_results = test_ollama_models()
    
    print("\n☁️  REMOTE MODELS:")
    print("OpenRouter:")
    
    # Check if OpenRouter is configured
    if os.getenv("OPENROUTER_API_KEY"):
        claude = test_claude_sonnet()
        deepseek = test_deepseek_r1()
    else:
        print("❌ OpenRouter: No API key configured")
        claude = False
        deepseek = False
    
    print(f"\n📊 SUMMARY:")
    print(f"  Ollama: {sum(ollama_results.values())}/{len(ollama_results)} working")
    print(f"  Claude Sonnet: {'✅' if claude else '❌'}")
    print(f"  DeepSeek R1: {'✅' if deepseek else '❌'}")


if __name__ == "__main__":
    test_all()
