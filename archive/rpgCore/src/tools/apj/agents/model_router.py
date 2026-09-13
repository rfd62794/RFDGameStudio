import os
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Optional, Union
from loguru import logger
from pydantic import BaseModel, Field

from src.tools.apj.agents.ollama_client import get_ollama_model
from src.tools.apj.agents.openrouter_client import get_openrouter_model
from src.tools.apj.agents.model_contracts import ModelRequest, ModelResponse, TaskType, ROUTING_POLICY
from src.tools.apj.agents.model_monitor import ModelMonitor
from pydantic_ai import Agent

# Resolution: src/tools/apj/agents/model_router.py -> parents[4] is rpgCore
PROJECT_ROOT = Path(__file__).resolve().parents[4]

class RoutingDecision(str, Enum):
    LOCAL   = "local"
    REMOTE  = "remote"
    REFUSE  = "refuse"

class AccountRateLimitState(BaseModel):
    requests_today: int = 0
    requests_this_minute: int = 0
    daily_limit: int = 50
    rpm_limit: int = 20
    last_minute_reset: datetime = Field(default_factory=datetime.now)
    last_day_reset: datetime = Field(default_factory=datetime.now)
    
    def can_request(self) -> tuple[bool, str]:
        self._reset_if_needed()
        if self.requests_today >= self.daily_limit:
            return False, f"daily limit reached ({self.daily_limit}/day)"
        if self.requests_this_minute >= self.rpm_limit:
            seconds_until_reset = 60 - (datetime.now() - self.last_minute_reset).seconds
            return False, f"RPM limit reached — wait {seconds_until_reset}s"
        return True, "ok"
    
    def record_request(self) -> None:
        self._reset_if_needed()
        self.requests_today += 1
        self.requests_this_minute += 1
    
    def _reset_if_needed(self) -> None:
        now = datetime.now()
        if (now - self.last_minute_reset).seconds >= 60:
            self.requests_this_minute = 0
            self.last_minute_reset = now
        if (now - self.last_day_reset).days >= 1:
            self.requests_today = 0
            self.last_day_reset = now

class BudgetState(BaseModel):
    daily_tokens_used: int = 0
    session_tokens_used: int = 0
    daily_soft_limit: int = 20000
    session_hard_limit: int = 10000
    
    def check(self, estimated_tokens: int) -> str:
        if self.session_tokens_used + estimated_tokens > self.session_hard_limit:
            return "hard_stop"
        if self.daily_tokens_used + estimated_tokens > self.daily_soft_limit:
            return "warn"
        return "ok"
    
    def record_usage(self, tokens: int) -> None:
        self.daily_tokens_used += tokens
        self.session_tokens_used += tokens

DEPARTMENT_ROUTING: dict[str, RoutingDecision] = {
    "analysis":   RoutingDecision.LOCAL,
    "planning":   RoutingDecision.LOCAL,
    "memory":     RoutingDecision.LOCAL,
    "execution":  RoutingDecision.REMOTE,   # Herald
    "persona":    RoutingDecision.REMOTE,
}

REMOTE_FALLBACK_CHAIN: list[str] = [
    "deepseek/deepseek-r1",
    "meta-llama/llama-3.1-70b-instruct",
    "google/gemini-flash-1.5",
]

LOCAL_FALLBACK_CHAIN: list[str] = [
    "llama3.2:3b",
    "llama3.2:1b",
    "qwen2.5:0.5b",
]

class ModelRouter:
    _account_state: AccountRateLimitState = AccountRateLimitState()
    _budget: BudgetState = BudgetState()
    _monitor: ModelMonitor = ModelMonitor(PROJECT_ROOT)
    
    @classmethod
    def route_request(cls, request: ModelRequest) -> ModelResponse:
        """
        Route request using standardized contract
        Replaces the existing routing logic
        """
        
        # Get policy for task type
        preferred_system = ROUTING_POLICY.get(request.task_type, "ollama")
        
        # Try preferred system
        response = cls._call_system(preferred_system, request)
        
        if not response.success:
            # Try fallback
            fallback = "openrouter" if preferred_system == "ollama" else "ollama"
            response = cls._call_system(fallback, request)
        
        # Log the request
        cls._monitor.log_request(response)
        
        return response
    
    @classmethod
    def _call_system(cls, system: str, request: ModelRequest) -> ModelResponse:
        """Call a specific system"""
        
        if system == "ollama":
            return cls._call_ollama(request)
        else:
            return cls._call_openrouter(request)
    
    @classmethod
    def _call_ollama(cls, request: ModelRequest) -> ModelResponse:
        """Call OllamaClient with contract"""
        import time
        start_time = time.time()
        
        try:
            # Use existing _try_local logic but with timing
            for model_name in LOCAL_FALLBACK_CHAIN:
                try:
                    client = get_ollama_model(model_name=model_name)
                    agent = Agent(model=client)
                    result = agent.run_sync(request.prompt)
                    
                    latency = time.time() - start_time
                    
                    return ModelResponse(
                        success=True,
                        response=result.output,
                        model_used=model_name,
                        system="ollama",
                        cost_dollars=0.0,  # Local is free
                        tokens_input=len(request.prompt.split()),
                        tokens_output=len(result.output.split()),
                        latency_seconds=latency
                    )
                except Exception as e:
                    logger.debug(f"Local {model_name} failed: {e}")
                    continue
            
            # All models failed
            return ModelResponse(
                success=False,
                response="",
                model_used="ollama",
                system="ollama",
                cost_dollars=0.0,
                tokens_input=0,
                tokens_output=0,
                latency_seconds=time.time() - start_time,
                error="All local models failed"
            )
            
        except Exception as e:
            return ModelResponse(
                success=False,
                response="",
                model_used="ollama",
                system="ollama",
                cost_dollars=0.0,
                tokens_input=0,
                tokens_output=0,
                latency_seconds=0.0,
                error=str(e)
            )
    
    @classmethod
    def _call_openrouter(cls, request: ModelRequest) -> ModelResponse:
        """Call OpenRouterClient with contract"""
        import time
        start_time = time.time()
        
        try:
            # Use existing _try_remote logic but with timing
            chain = REMOTE_FALLBACK_CHAIN
            
            # Simple token estimation: chars / 4
            estimated_tokens = len(request.prompt) // 4
            budget_status = cls._budget.check(estimated_tokens)
            
            if budget_status == "hard_stop":
                return ModelResponse(
                    success=False,
                    response="",
                    model_used="openrouter",
                    system="openrouter",
                    cost_dollars=0.0,
                    tokens_input=0,
                    tokens_output=0,
                    latency_seconds=0.0,
                    error="Budget hard stop"
                )
            
            can_request, reason = cls._account_state.can_request()
            if not can_request:
                return ModelResponse(
                    success=False,
                    response="",
                    model_used="openrouter",
                    system="openrouter",
                    cost_dollars=0.0,
                    tokens_input=0,
                    tokens_output=0,
                    latency_seconds=0.0,
                    error=f"Account limit: {reason}"
                )
            
            for model_name in chain:
                try:
                    client = get_openrouter_model(model=model_name)
                    agent = Agent(model=client)
                    result = agent.run_sync(request.prompt)
                    
                    latency = time.time() - start_time
                    
                    # Success - record usage
                    cls._account_state.record_request()
                    cls._budget.record_usage(estimated_tokens)
                    
                    # Estimate cost (would need actual token counts)
                    cost = estimated_tokens * 0.001  # Rough estimate
                    
                    return ModelResponse(
                        success=True,
                        response=result.output,
                        model_used=model_name,
                        system="openrouter",
                        cost_dollars=cost,
                        tokens_input=estimated_tokens,
                        tokens_output=len(result.output.split()),
                        latency_seconds=latency
                    )
                    
                except Exception as e:
                    error_type = cls._handle_429(e, model_name)
                    if error_type == "account_rate_limited":
                        return ModelResponse(
                            success=False,
                            response="",
                            model_used="openrouter",
                            system="openrouter",
                            cost_dollars=0.0,
                            tokens_input=0,
                            tokens_output=0,
                            latency_seconds=0.0,
                            error="Account rate limited"
                        )
                    elif error_type == "provider_saturated":
                        continue     # Try next model
                    
                    logger.warning(f"Remote {model_name} failed: {e}")
                    continue
            
            # All models failed
            return ModelResponse(
                success=False,
                response="",
                model_used="openrouter",
                system="openrouter",
                cost_dollars=0.0,
                tokens_input=0,
                tokens_output=0,
                latency_seconds=time.time() - start_time,
                error="All remote models failed"
            )
            
        except Exception as e:
            return ModelResponse(
                success=False,
                response="",
                model_used="openrouter",
                system="openrouter",
                cost_dollars=0.0,
                tokens_input=0,
                tokens_output=0,
                latency_seconds=0.0,
                error=str(e)
            )
    
    @classmethod
    def route(cls, config: Any, prompt: str) -> str:
        """Route request to local or remote based on department and policy."""
        decision = cls._decide(config)
        
        if decision == RoutingDecision.LOCAL:
            result = cls._try_local(prompt)
            if result is not None:
                return result
            # Local failed — escalate if permitted
            if config.model_preference != "local":
                logger.warning(f"{config.name}: Local models failed — escalating to remote")
                return cls._try_remote(config, prompt)
            raise RuntimeError(f"Agent {config.name}: local models failed, remote not permitted")
        
        if decision == RoutingDecision.REMOTE:
            result = cls._try_remote(config, prompt)
            if result is not None:
                return result
            # Remote failed — emergency fallback to local
            logger.warning(f"{config.name}: Remote failed — emergency fallback to local")
            return cls._try_local(prompt) or "[ROUTER FAILED — all backends exhausted]"
        
        return "[ROUTER FAILED — invalid decision]"
    
    @classmethod
    def _decide(cls, config: Any) -> RoutingDecision:
        if config.backend_override:
            return RoutingDecision.REMOTE
        return DEPARTMENT_ROUTING.get(
            config.department,
            RoutingDecision.LOCAL
        )
    
    @classmethod
    def _try_local(cls, prompt: str) -> Optional[str]:
        for model_name in LOCAL_FALLBACK_CHAIN:
            try:
                client = get_ollama_model(model_name=model_name)
                agent = Agent(model=client)
                result = agent.run_sync(prompt)
                return result.output
            except Exception as e:
                logger.debug(f"Local {model_name} failed: {e}")
                continue
        return None
    
    @classmethod
    def _try_remote(cls, config: Any, prompt: str) -> Optional[str]:
        chain = [config.backend_override] if config.backend_override else REMOTE_FALLBACK_CHAIN
        
        # Simple token estimation: chars / 4
        estimated_tokens = len(prompt) // 4
        budget_status = cls._budget.check(estimated_tokens)
        
        if budget_status == "hard_stop":
            logger.warning(f"ModelRouter: Budget hard stop — refusing remote call for {config.name}")
            return None
        
        can_request, reason = cls._account_state.can_request()
        if not can_request:
            logger.warning(f"ModelRouter: Account limit — {reason}")
            return None
        
        for model_name in chain:
            try:
                client = get_openrouter_model(model=model_name)
                agent = Agent(model=client)
                result = agent.run_sync(prompt)
                
                # Success - record usage
                cls._account_state.record_request()
                cls._budget.record_usage(estimated_tokens)
                cls._log_usage(model_name, estimated_tokens)
                return result.output
                
            except Exception as e:
                error_type = cls._handle_429(e, model_name)
                if error_type == "account_rate_limited":
                    return None  # Stop chain entirely
                elif error_type == "provider_saturated":
                    continue     # Try next model
                
                logger.warning(f"ModelRouter: Remote {model_name} failed: {e}")
                continue
        return None
    
    @classmethod
    def _handle_429(cls, error: Exception, model: str) -> str:
        err_str = str(error).lower()
        if "provider" in err_str or "upstream" in err_str:
            logger.warning(f"ModelRouter: {model} provider saturated")
            return "provider_saturated"
        if "rate limit" in err_str or "quota" in err_str or "429" in err_str:
            logger.warning(f"ModelRouter: Account rate limited or out of quota")
            return "account_rate_limited"
        return "unknown"
    
    @classmethod
    def _log_usage(cls, model: str, tokens: int) -> None:
        log_path = PROJECT_ROOT / "docs" / "agents" / "improvements" / "router_usage.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"{datetime.now().isoformat()} | {model} | {tokens} tokens\n")
