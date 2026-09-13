"""Layer 3: Local Ollama model for analysis and strategy"""

import requests
import json
from typing import Dict, Optional

class OllamaLayer:
    """Use local Ollama for structured decisions"""
    
    def __init__(self, model: str = "mistral", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.available = self._check_availability()
    
    def _check_availability(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def analyze_blockers(self, blockers: list, context: str) -> Dict:
        """Use Ollama to analyze blockers"""
        if not self.available:
            return {"error": "Ollama unavailable", "fallback": "use_layer_2"}
        
        prompt = f"""
Analyze these DGT Engine development blockers:

Context: {context}

Blockers:
{json.dumps(blockers, indent=2)}

For each blocker:
1. Root cause
2. Impact
3. Recommended fix
4. Time estimate

Keep response concise and actionable.
"""
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            return response.json()
        except:
            return {"error": "Ollama request failed", "fallback": "use_layer_2"}
    
    def phase_strategy(self, phase_num: int, phase_data: Dict) -> Dict:
        """Use Ollama to analyze phase strategy"""
        if not self.available:
            return {"error": "Ollama unavailable", "fallback": "use_layer_2"}
        
        prompt = f"""
Analyze Phase {phase_num} strategy for DGT Engine:

Phase Data:
{json.dumps(phase_data, indent=2)}

Provide:
1. Strategic importance
2. Success criteria
3. Risk assessment
4. Timeline recommendation
5. Go/no-go decision

Keep response structured and brief.
"""
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            return response.json()
        except:
            return {"error": "Ollama request failed", "fallback": "use_layer_2"}
