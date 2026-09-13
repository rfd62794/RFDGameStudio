"""
Model Factory: Singleton for Large Language Model Management

This module provides a unified interface for creating Pydantic AI models
with shared network resources (httpx.AsyncClient) and persistent 'keep_alive'
settings to prevent model unloading/reloading (The "Iron Frame" Workflow).
"""

import os
import httpx
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.settings import ModelSettings

# Singleton client logic removed as OpenAIModel doesn't accept it directly
# but we still want keep_alive via settings.

def get_model(model_name: str = "llama3.2:1b", temperature: float = 0.1) -> OpenAIModel:
    """
    Get a configured OpenAIModel instance with persistent settings.
    
    Args:
        model_name: Name of the Ollama model to use.
        temperature: Sampling temperature (0.1 for logic, 0.8 for creative).
        
    Returns:
        Configured OpenAIModel instance.
    """
    # Ensure environment is set up for local Ollama
    if 'OLLAMA_BASE_URL' not in os.environ:
        os.environ['OLLAMA_BASE_URL'] = 'http://localhost:11434'
        
    os.environ["OPENAI_BASE_URL"] = f"{os.environ['OLLAMA_BASE_URL']}/v1"
    os.environ["OPENAI_API_KEY"] = "ollama"
    
    # Configure settings for Iron Frame workflow
    settings = ModelSettings(
        temperature=temperature,
        max_tokens=1024,
        extra_body={"keep_alive": -1}, # Keep loaded indefinitely
        timeout=120.0
    )
    
    # Strip 'ollama:' prefix if present for OpenAI compatible endpoint
    actual_model = model_name.replace("ollama:", "")
    
    # Return configured model
    return OpenAIModel(actual_model, settings=settings)

def get_common_model_settings(temperature: float = 0.1) -> dict:
    """
    Return standard generation settings.
    """
    return {
        "temperature": temperature,
        "max_tokens": 1024,
        # Ollama specific extra_body
        "extra_body": {
            "keep_alive": -1 # Keep model in memory indefinitely
        }
    }
