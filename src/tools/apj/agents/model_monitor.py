"""
Model monitor - unified monitoring and observability
"""

from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime
from pathlib import Path
import json
import re


@dataclass
class ModelStats:
    """Statistics for a model"""
    name: str
    system: str
    requests: int = 0
    successful: int = 0
    total_cost: float = 0.0
    total_tokens_out: int = 0
    avg_latency: float = 0.0
    
    @property
    def success_rate(self) -> float:
        return (self.successful / self.requests * 100) if self.requests > 0 else 0
    
    @property
    def cost_per_1k_tokens(self) -> float:
        return (self.total_cost / self.total_tokens_out * 1000) if self.total_tokens_out > 0 else 0


class ModelMonitor:
    """Monitor and aggregate model usage"""
    
    def __init__(self, log_dir: Path = Path(".")):
        self.log_dir = Path(log_dir)
        self.stats: Dict[str, ModelStats] = {}
        self._load_logs()
    
    def _load_logs(self) -> None:
        """Load and aggregate all model logs"""
        
        # Load OpenRouter director_usage.log
        usage_log = self.log_dir / "docs" / "agents" / "session_logs" / "director_usage.log"
        if usage_log.exists():
            self._load_openrouter_log(usage_log)
        
        # Load Ollama usage (would be stored similarly)
        # For now, we'll track live requests
    
    def _load_openrouter_log(self, log_file: Path) -> None:
        """Load OpenRouter usage log"""
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    if "|" in line:
                        parts = line.strip().split("|")
                        if len(parts) >= 5:
                            entry = {
                                "model": parts[1].strip().split("=")[1],
                                "tokens_input": int(parts[2].strip().split("=")[1]),
                                "tokens_output": int(parts[3].strip().split("=")[1]),
                                "system": "openrouter"
                            }
                            self._add_entry(entry)
        except FileNotFoundError:
            pass
    
    def _add_entry(self, entry: Dict) -> None:
        """Add a log entry to statistics"""
        
        model_name = entry.get("model", "unknown")
        system = entry.get("system", "unknown")
        cost = 0.0  # Would need to calculate based on model
        tokens_out = entry.get("tokens_output", 0)
        latency = 0.0  # Would need to measure
        success = True
        
        if model_name not in self.stats:
            self.stats[model_name] = ModelStats(name=model_name, system=system)
        
        stats = self.stats[model_name]
        stats.requests += 1
        if success:
            stats.successful += 1
        stats.total_cost += cost
        stats.total_tokens_out += tokens_out
        
        # Update average latency
        if stats.requests > 0:
            stats.avg_latency = (stats.avg_latency * (stats.requests - 1) + latency) / stats.requests
    
    def log_request(self, response: "ModelResponse") -> None:
        """Log a model response"""
        
        # Store in memory
        if response.model_used not in self.stats:
            self.stats[response.model_used] = ModelStats(
                name=response.model_used,
                system=response.system
            )
        
        stats = self.stats[response.model_used]
        stats.requests += 1
        if response.success:
            stats.successful += 1
        stats.total_cost += response.cost_dollars
        stats.total_tokens_out += response.tokens_output
        
        # Update average latency
        if stats.requests > 0:
            stats.avg_latency = (stats.avg_latency * (stats.requests - 1) + response.latency_seconds) / stats.requests
        
        # Append to log file
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "model": response.model_used,
            "system": response.system,
            "success": response.success,
            "cost": response.cost_dollars,
            "tokens_input": response.tokens_input,
            "tokens_output": response.tokens_output,
            "latency": response.latency_seconds,
            "error": response.error
        }
        
        log_file = self.log_dir / "docs" / "agents" / "model_usage.jsonl"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def get_summary(self) -> Dict:
        """Get summary of all model usage"""
        return {
            "timestamp": datetime.now().isoformat(),
            "total_requests": sum(s.requests for s in self.stats.values()),
            "total_cost": sum(s.total_cost for s in self.stats.values()),
            "models": {
                name: {
                    "system": stats.system,
                    "requests": stats.requests,
                    "success_rate": stats.success_rate,
                    "total_cost": stats.total_cost,
                    "cost_per_1k_tokens": stats.cost_per_1k_tokens,
                    "avg_latency": stats.avg_latency
                }
                for name, stats in self.stats.items()
            }
        }
    
    def print_summary(self) -> None:
        """Print model usage summary"""
        summary = self.get_summary()
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    MODEL USAGE SUMMARY                        ║
╚══════════════════════════════════════════════════════════════╝

📊 OVERALL:
  Total requests: {summary['total_requests']}
  Total cost: ${summary['total_cost']:.2f}

🤖 BY MODEL:
""")
        
        for model_name, stats in summary['models'].items():
            print(f"  {model_name:20s} {stats['system']:10s} ", end="")
            print(f"Requests: {stats['requests']:3d}  Success: {stats['success_rate']:5.1f}%  ", end="")
            print(f"Cost: ${stats['total_cost']:6.2f}  Latency: {stats['avg_latency']:5.2f}s")
