"""
Ollama system - manages local model inference
"""

from dataclasses import dataclass
from typing import Optional, List, Dict
from pathlib import Path
import subprocess
import requests
import json
import time


@dataclass
class ModelInfo:
    """Information about a local model"""
    name: str
    size_gb: float
    context_window: int
    speed_tokens_per_sec: Optional[float] = None
    quality_score: Optional[float] = None  # 1-10, higher is better
    loaded: bool = False


@dataclass
class OllamaRequest:
    """Request to Ollama"""
    model: str
    prompt: str
    temperature: float = 0.7
    top_p: float = 0.9
    max_tokens: int = 2000
    timeout: float = 30.0


@dataclass
class OllamaResponse:
    """Response from Ollama"""
    model: str
    response: str
    tokens_generated: int
    latency_seconds: float
    success: bool
    error: Optional[str] = None


class OllamaSystem:
    """Manage local Ollama deployment"""
    
    # Known models and their properties
    KNOWN_MODELS = {
        "mistral": ModelInfo(
            name="mistral",
            size_gb=4.1,
            context_window=8192,
            speed_tokens_per_sec=15,
            quality_score=7.5
        ),
        "llama2": ModelInfo(
            name="llama2",
            size_gb=3.8,
            context_window=4096,
            speed_tokens_per_sec=12,
            quality_score=7.0
        ),
        "neural-chat": ModelInfo(
            name="neural-chat",
            size_gb=4.0,
            context_window=8192,
            speed_tokens_per_sec=14,
            quality_score=7.2
        ),
        "dolphin-mixtral": ModelInfo(
            name="dolphin-mixtral",
            size_gb=26.0,
            context_window=8192,
            speed_tokens_per_sec=8,
            quality_score=8.5
        )
    }
    
    def __init__(self, base_url: str = "http://localhost:11434", timeout: float = 5.0):
        self.base_url = base_url
        self.timeout = timeout
        self.running = False
        self.current_model: Optional[str] = None
        self.models: Dict[str, ModelInfo] = {}
        
        # Verify Ollama is running
        self._verify_running()
        
        # Load available models
        self._refresh_models()
    
    def _verify_running(self) -> bool:
        """Check if Ollama is running and responsive"""
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=self.timeout
            )
            self.running = response.status_code == 200
            return self.running
        except Exception as e:
            print(f"⚠️  Ollama not running: {e}")
            self.running = False
            return False
    
    def _refresh_models(self) -> None:
        """Get list of loaded models from Ollama"""
        if not self.running:
            print("❌ Ollama not running, cannot refresh models")
            return
        
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=self.timeout
            )
            data = response.json()
            
            # Mark which models are loaded
            loaded_names = set()
            if "models" in data:
                for model_data in data["models"]:
                    loaded_names.add(model_data["name"])
            
            # Update models dict
            self.models = {}
            for model_name, model_info in self.KNOWN_MODELS.items():
                model_info.loaded = model_name in loaded_names
                self.models[model_name] = model_info
            
            # Set current model (first loaded)
            if loaded_names:
                self.current_model = sorted(list(loaded_names))[0]
        
        except Exception as e:
            print(f"⚠️  Error refreshing models: {e}")
    
    def is_available(self) -> bool:
        """Is Ollama running and ready?"""
        if not self.running:
            self._verify_running()
        return self.running
    
    def get_loaded_models(self) -> List[str]:
        """Get list of models currently loaded"""
        return [name for name, info in self.models.items() if info.loaded]
    
    def load_model(self, model_name: str) -> bool:
        """Load a model into memory"""
        if not self.is_available():
            return False
        
        if model_name not in self.KNOWN_MODELS:
            print(f"❌ Unknown model: {model_name}")
            return False
        
        try:
            print(f"📥 Loading model: {model_name}")
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name},
                timeout=300  # 5 min timeout for large models
            )
            
            if response.status_code == 200:
                self.models[model_name].loaded = True
                self.current_model = model_name
                print(f"✅ Model loaded: {model_name}")
                return True
            else:
                print(f"❌ Failed to load model: {response.status_code}")
                return False
        
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    
    def switch_model(self, model_name: str) -> bool:
        """Switch to a different model"""
        if not self.is_available():
            return False
        
        if model_name not in self.models:
            print(f"❌ Unknown model: {model_name}")
            return False
        
        if not self.models[model_name].loaded:
            print(f"⚠️  Model not loaded: {model_name}. Loading...")
            if not self.load_model(model_name):
                return False
        
        self.current_model = model_name
        print(f"✅ Switched to model: {model_name}")
        return True
    
    def infer(self, request: OllamaRequest) -> OllamaResponse:
        """Run inference on Ollama"""
        if not self.is_available():
            return OllamaResponse(
                model=request.model,
                response="",
                tokens_generated=0,
                latency_seconds=0,
                success=False,
                error="Ollama not available"
            )
        
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": request.model,
                    "prompt": request.prompt,
                    "temperature": request.temperature,
                    "top_p": request.top_p,
                    "num_predict": request.max_tokens,
                    "stream": False
                },
                timeout=request.timeout
            )
            
            latency = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                tokens = len(data.get("response", "").split())
                
                return OllamaResponse(
                    model=request.model,
                    response=data.get("response", ""),
                    tokens_generated=tokens,
                    latency_seconds=latency,
                    success=True
                )
            
            elif response.status_code == 429:
                return OllamaResponse(
                    model=request.model,
                    response="",
                    tokens_generated=0,
                    latency_seconds=latency,
                    success=False,
                    error="Rate limited (429)"
                )
            
            else:
                return OllamaResponse(
                    model=request.model,
                    response="",
                    tokens_generated=0,
                    latency_seconds=latency,
                    success=False,
                    error=f"HTTP {response.status_code}"
                )
        
        except requests.Timeout:
            latency = time.time() - start_time
            return OllamaResponse(
                model=request.model,
                response="",
                tokens_generated=0,
                latency_seconds=latency,
                success=False,
                error="Timeout"
            )
        
        except Exception as e:
            latency = time.time() - start_time
            return OllamaResponse(
                model=request.model,
                response="",
                tokens_generated=0,
                latency_seconds=latency,
                success=False,
                error=str(e)
            )
    
    def get_model_info(self, model_name: str) -> Optional[ModelInfo]:
        """Get info about a model"""
        return self.models.get(model_name)
    
    def estimate_token_count(self, text: str) -> int:
        """Rough estimate of token count"""
        # Approximation: ~4 characters per token
        return len(text) // 4
    
    def will_fit_context(self, prompt: str, model_name: str) -> bool:
        """Check if prompt fits in model's context window"""
        model = self.models.get(model_name)
        if not model:
            return False
        
        tokens = self.estimate_token_count(prompt)
        # Leave 30% buffer for response
        return tokens < (model.context_window * 0.7)
