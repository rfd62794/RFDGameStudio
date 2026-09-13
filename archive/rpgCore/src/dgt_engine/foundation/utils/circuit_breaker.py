"""
Circuit Breaker Pattern Implementation for DGT System

Provides fault tolerance for pillar operations with automatic recovery,
failure tracking, and graceful degradation. Follows the circuit breaker
pattern for resilient distributed systems.
"""

import time
import threading
from enum import Enum
from typing import Dict, Any, Optional, Callable, TypeVar, Union
from dataclasses import dataclass, field
from collections import deque
import asyncio

from loguru import logger

T = TypeVar('T')


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject calls
    HALF_OPEN = "half_open"  # Testing if recovery occurred


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker"""
    failure_threshold: int = 5          # Failures before opening
    recovery_timeout: float = 60.0      # Seconds to wait before recovery attempt
    success_threshold: int = 3          # Successes in half-open to close
    timeout: float = 30.0               # Call timeout in seconds
    max_retries: int = 2                # Max retries per call


@dataclass
class CallResult:
    """Result of a circuit breaker call"""
    success: bool
    result: Any = None
    error: Optional[Exception] = None
    execution_time: float = 0.0
    retries: int = 0


class CircuitBreakerError(Exception):
    """Base circuit breaker exception"""
    pass


class CircuitOpenError(CircuitBreakerError):
    """Circuit is open, calls are rejected"""
    pass


class CallTimeoutError(CircuitBreakerError):
    """Call exceeded timeout"""
    pass


class PillarCircuitBreaker:
    """Circuit breaker for pillar operations"""
    
    def __init__(self, 
                 pillar_name: str,
                 config: Optional[CircuitBreakerConfig] = None) -> None:
        self.pillar_name = pillar_name
        self.config = config or CircuitBreakerConfig()
        
        # State management
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = 0.0
        self._last_state_change = time.time()
        
        # Call history
        self._call_history: deque[CallResult] = deque(maxlen=100)
        
        # Thread safety
        self._lock = threading.RLock()
        
        # Statistics
        self._total_calls = 0
        self._total_failures = 0
        self._total_successes = 0
        
        logger.info(f"🔌 Circuit Breaker initialized for {pillar_name}")
    
    @property
    def state(self) -> CircuitState:
        """Get current circuit state"""
        with self._lock:
            return self._state
    
    @property
    def is_available(self) -> bool:
        """Check if circuit is available for calls"""
        return self.state != CircuitState.OPEN
    
    @property
    def failure_rate(self) -> float:
        """Get current failure rate"""
        with self._lock:
            if self._total_calls == 0:
                return 0.0
            return self._total_failures / self._total_calls
    
    async def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute function with circuit breaker protection"""
        start_time = time.time()
        
        # Check if circuit is open
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self._transition_to_half_open()
            else:
                raise CircuitOpenError(f"Circuit open for {self.pillar_name}")
        
        # Execute call with retries
        result = await self._execute_with_retries(func, args, kwargs, start_time)
        
        # Record result
        self._record_call_result(result)
        
        # Handle state transitions
        self._handle_state_transition(result.success)
        
        # Return result or raise error
        if result.success:
            return result.result
        else:
            raise result.error
    
    async def _execute_with_retries(self, 
                                   func: Callable[..., T], 
                                   args: tuple, 
                                   kwargs: dict, 
                                   start_time: float) -> CallResult:
        """Execute function with retry logic"""
        last_error = None
        
        for attempt in range(self.config.max_retries + 1):
            try:
                # Execute with timeout
                result = await asyncio.wait_for(
                    self._execute_function(func, args, kwargs),
                    timeout=self.config.timeout
                )
                
                return CallResult(
                    success=True,
                    result=result,
                    execution_time=time.time() - start_time,
                    retries=attempt
                )
                
            except asyncio.TimeoutError:
                last_error = CallTimeoutError(f"Call timeout for {self.pillar_name}")
                logger.warning(f"⏱️ Timeout for {self.pillar_name} (attempt {attempt + 1})")
                
            except Exception as e:
                last_error = e
                logger.warning(f"❌ Call failed for {self.pillar_name} (attempt {attempt + 1}): {e}")
            
            # Wait before retry (exponential backoff)
            if attempt < self.config.max_retries:
                wait_time = min(2 ** attempt, 5.0)  # Max 5 seconds
                await asyncio.sleep(wait_time)
        
        # All retries failed
        return CallResult(
            success=False,
            error=last_error,
            execution_time=time.time() - start_time,
            retries=self.config.max_retries
        )
    
    async def _execute_function(self, func: Callable[..., T], args: tuple, kwargs: dict) -> T:
        """Execute the function (sync or async)"""
        if asyncio.iscoroutinefunction(func):
            return await func(*args, **kwargs)
        else:
            # Run sync function in thread pool
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, func, *args, **kwargs)
    
    def _should_attempt_reset(self) -> bool:
        """Check if circuit should attempt reset"""
        return time.time() - self._last_failure_time >= self.config.recovery_timeout
    
    def _transition_to_half_open(self) -> None:
        """Transition to half-open state"""
        self._state = CircuitState.HALF_OPEN
        self._success_count = 0
        self._last_state_change = time.time()
        logger.info(f"🔄 Circuit {self.pillar_name} transitioning to HALF_OPEN")
    
    def _transition_to_open(self) -> None:
        """Transition to open state"""
        self._state = CircuitState.OPEN
        self._last_failure_time = time.time()
        self._last_state_change = time.time()
        logger.error(f"🚫 Circuit {self.pillar_name} OPENED after {self._failure_count} failures")
    
    def _transition_to_closed(self) -> None:
        """Transition to closed state"""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_state_change = time.time()
        logger.info(f"✅ Circuit {self.pillar_name} CLOSED - recovery successful")
    
    def _record_call_result(self, result: CallResult) -> None:
        """Record call result for statistics"""
        with self._lock:
            self._call_history.append(result)
            self._total_calls += 1
            
            if result.success:
                self._total_successes += 1
            else:
                self._total_failures += 1
    
    def _handle_state_transition(self, success: bool) -> None:
        """Handle circuit state transitions based on call result"""
        with self._lock:
            if success:
                if self.state == CircuitState.HALF_OPEN:
                    self._success_count += 1
                    if self._success_count >= self.config.success_threshold:
                        self._transition_to_closed()
                elif self.state == CircuitState.CLOSED:
                    # Reset failure count on success in closed state
                    self._failure_count = max(0, self._failure_count - 1)
            else:
                self._failure_count += 1
                
                if self.state == CircuitState.CLOSED:
                    if self._failure_count >= self.config.failure_threshold:
                        self._transition_to_open()
                elif self.state == CircuitState.HALF_OPEN:
                    # Immediate transition back to open on failure
                    self._transition_to_open()
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get circuit breaker statistics"""
        with self._lock:
            recent_calls = list(self._call_history)[-10:]  # Last 10 calls
            
            return {
                "pillar_name": self.pillar_name,
                "state": self.state.value,
                "failure_count": self._failure_count,
                "success_count": self._success_count,
                "total_calls": self._total_calls,
                "total_failures": self._total_failures,
                "total_successes": self._total_successes,
                "failure_rate": self.failure_rate,
                "last_failure_time": self._last_failure_time,
                "last_state_change": self._last_state_change,
                "recent_call_times": [call.execution_time for call in recent_calls],
                "average_call_time": sum(call.execution_time for call in recent_calls) / len(recent_calls) if recent_calls else 0.0
            }
    
    def reset(self) -> None:
        """Reset circuit breaker to closed state"""
        with self._lock:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._success_count = 0
            self._last_failure_time = 0.0
            self._last_state_change = time.time()
            self._call_history.clear()
            self._total_calls = 0
            self._total_failures = 0
            self._total_successes = 0
            
            logger.info(f"🔄 Circuit {self.pillar_name} reset to CLOSED state")


class CircuitBreakerManager:
    """Manages multiple circuit breakers for system pillars"""
    
    def __init__(self) -> None:
        self._breakers: Dict[str, PillarCircuitBreaker] = {}
        self._lock = threading.RLock()
        
        logger.info("🔌 Circuit Breaker Manager initialized")
    
    def get_breaker(self, pillar_name: str, 
                   config: Optional[CircuitBreakerConfig] = None) -> PillarCircuitBreaker:
        """Get or create circuit breaker for pillar"""
        with self._lock:
            if pillar_name not in self._breakers:
                self._breakers[pillar_name] = PillarCircuitBreaker(pillar_name, config)
            return self._breakers[pillar_name]
    
    async def call_pillar(self, 
                         pillar_name: str, 
                         func: Callable[..., T], 
                         *args, 
                         **kwargs) -> T:
        """Call pillar function with circuit breaker protection"""
        breaker = self.get_breaker(pillar_name)
        return await breaker.call(func, *args, **kwargs)
    
    def get_all_statistics(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all circuit breakers"""
        with self._lock:
            return {
                name: breaker.get_statistics()
                for name, breaker in self._breakers.items()
            }
    
    def reset_all(self) -> None:
        """Reset all circuit breakers"""
        with self._lock:
            for breaker in self._breakers.values():
                breaker.reset()
        
        logger.info("🔄 All circuit breakers reset")
    
    def get_open_circuits(self) -> list[str]:
        """Get list of pillars with open circuits"""
        with self._lock:
            return [
                name for name, breaker in self._breakers.items()
                if breaker.state == CircuitState.OPEN
            ]
    
    def get_degraded_pillars(self) -> list[str]:
        """Get list of pillars with degraded performance"""
        with self._lock:
            return [
                name for name, breaker in self._breakers.items()
                if breaker.failure_rate > 0.1  # >10% failure rate
            ]


# Global circuit breaker manager
_circuit_manager: Optional[CircuitBreakerManager] = None


def get_circuit_manager() -> CircuitBreakerManager:
    """Get global circuit breaker manager"""
    global _circuit_manager
    if _circuit_manager is None:
        _circuit_manager = CircuitBreakerManager()
    return _circuit_manager


def circuit_breaker(pillar_name: str, 
                   config: Optional[CircuitBreakerConfig] = None):
    """Decorator for circuit breaker protection"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        async def async_wrapper(*args, **kwargs):
            manager = get_circuit_manager()
            return await manager.call_pillar(pillar_name, func, *args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            # For sync functions, we need to run in async context
            async def async_call():
                manager = get_circuit_manager()
                return await manager.call_pillar(pillar_name, func, *args, **kwargs)
            
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(async_call())
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator
