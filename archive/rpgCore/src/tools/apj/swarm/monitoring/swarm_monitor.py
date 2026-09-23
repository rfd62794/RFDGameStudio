"""
Real-time monitoring and observability for swarm
Health checks, performance tracking, incident detection
"""

from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime
import json


@dataclass
class SwarmMetrics:
    """Current swarm health metrics"""
    total_agents: int
    active_agents: int
    idle_agents: int
    failed_agents: int
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    in_progress_tasks: int
    avg_task_duration: float
    overall_success_rate: float
    circuit_breakers_open: int
    last_update: str


class SwarmMonitor:
    """Monitor swarm health and performance"""
    
    def __init__(self):
        self.metrics_history: List[SwarmMetrics] = []
        self.alerts: List[Dict] = []
        self.performance_baselines: Dict[str, float] = {}
    
    def collect_metrics(self, swarm_state: Dict) -> SwarmMetrics:
        """Collect current swarm metrics"""
        
        metrics = SwarmMetrics(
            total_agents=swarm_state.get("total_agents", 0),
            active_agents=swarm_state.get("active_agents", 0),
            idle_agents=swarm_state.get("idle_agents", 0),
            failed_agents=swarm_state.get("failed_agents", 0),
            total_tasks=swarm_state.get("total_tasks", 0),
            completed_tasks=swarm_state.get("completed_tasks", 0),
            failed_tasks=swarm_state.get("failed_tasks", 0),
            in_progress_tasks=swarm_state.get("in_progress_tasks", 0),
            avg_task_duration=swarm_state.get("avg_task_duration", 0.0),
            overall_success_rate=self._calculate_success_rate(swarm_state),
            circuit_breakers_open=swarm_state.get("circuit_breakers_open", 0),
            last_update=datetime.now().isoformat()
        )
        
        self.metrics_history.append(metrics)
        
        # Check for anomalies
        self._check_health(metrics)
        
        return metrics
    
    def _calculate_success_rate(self, swarm_state: Dict) -> float:
        """Calculate overall success rate"""
        
        total = swarm_state.get("total_tasks", 0)
        completed = swarm_state.get("completed_tasks", 0)
        
        if total == 0:
            return 0.0
        
        return (completed / total) * 100
    
    def _check_health(self, metrics: SwarmMetrics) -> None:
        """Check for health issues and create alerts"""
        
        # Alert if too many circuit breakers open
        if metrics.circuit_breakers_open > 2:
            self.alerts.append({
                "severity": "HIGH",
                "message": f"Multiple circuit breakers open: {metrics.circuit_breakers_open}",
                "timestamp": metrics.last_update
            })
        
        # Alert if success rate drops
        if metrics.overall_success_rate < 70:
            self.alerts.append({
                "severity": "MEDIUM",
                "message": f"Low success rate: {metrics.overall_success_rate:.1f}%",
                "timestamp": metrics.last_update
            })
        
        # Alert if many agents failed
        if metrics.failed_agents > metrics.total_agents * 0.5:
            self.alerts.append({
                "severity": "CRITICAL",
                "message": f"More than half agents failed: {metrics.failed_agents}/{metrics.total_agents}",
                "timestamp": metrics.last_update
            })
    
    def print_status(self) -> None:
        """Print current swarm status"""
        
        if not self.metrics_history:
            print("No metrics collected yet")
            return
        
        latest = self.metrics_history[-1]
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║              SWARM HEALTH STATUS                              ║
╚══════════════════════════════════════════════════════════════╝

👥 AGENTS:
  Total: {latest.total_agents}
  Active: {latest.active_agents}
  Idle: {latest.idle_agents}
  Failed: {latest.failed_agents}
  Circuit Breakers Open: {latest.circuit_breakers_open}

📊 TASKS:
  Total: {latest.total_tasks}
  Completed: {latest.completed_tasks}
  Failed: {latest.failed_tasks}
  In Progress: {latest.in_progress_tasks}
  Success Rate: {latest.overall_success_rate:.1f}%

⏱️  PERFORMANCE:
  Avg Task Duration: {latest.avg_task_duration:.1f}s

🚨 ALERTS:
""")
        
        if self.alerts:
            for alert in self.alerts[-5:]:  # Last 5 alerts
                print(f"  [{alert['severity']}] {alert['message']}")
        else:
            print("  ✅ No alerts")
